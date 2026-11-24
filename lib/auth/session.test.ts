import { beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { testDb } from "@/tests/db";

const jar = vi.hoisted(() => {
  process.env.ADMIN_EMAIL = "owner@example.com";
  process.env.ADMIN_PASSWORD = "test-admin-password";
  process.env.ADMIN_SESSION_SECRET = "test-admin-session-secret-at-least-32-chars";
  process.env.ROUTER_API_KEY = "zr_live_test_router_key";
  process.env.ADMIN_KEY = "zr_admin_test_key";
  return new Map<string, string>();
});
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined) }),
}));

import {
  getCachedCustomer, getCurrentUser, getCustomerByTokenOrKey, invalidateCustomerLookupCache, invalidateSessionCache,
  isMasterAdminKey, resolveAuth, setCachedCustomer,
} from "./session";
import type { Customer } from "@/lib/db/schema";
import { POST as login } from "@/app/api/auth/login/route";

function loginRequest(email: string, password: string) {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

let db: Awaited<ReturnType<typeof testDb>>;

beforeAll(async () => {
  db = await testDb();
  await db.execute(
    "INSERT INTO customers (id, key, email, session_token, status, created_at, updated_at) VALUES ('cust_1', 'zr_live_cust1', 'c@example.com', 'zr_sess_cust1', 'active', 0, 0)"
  );
});

describe("admin session cookie", () => {
  it("rejects a forged cookie value", async () => {
    jar.set("zr_session", "zr_admin_forged");
    expect(await getCurrentUser()).toBeNull();
    expect((await resolveAuth("")).isAdmin).toBe(false);
  });

  it("accepts the session issued by the admin login", async () => {
    const res = await login(loginRequest("owner@example.com", "test-admin-password"));
    expect(res.status).toBe(200);
    jar.set("zr_session", res.cookies.get("zr_session")!.value);
    expect((await resolveAuth("")).isAdmin).toBe(true);
  });

  it("does not accept the router API key as the admin password", async () => {
    const res = await login(loginRequest("owner@example.com", "zr_live_test_router_key"));
    expect(res.status).toBe(401);
  });

  it("does not grant admin to the router API key as a bearer token", async () => {
    jar.delete("zr_session");
    expect((await resolveAuth("Bearer zr_live_test_router_key")).isAdmin).toBe(false);
  });
});

describe("bearer lookup", () => {
  it("matches an API key", async () => {
    expect((await getCustomerByTokenOrKey("zr_live_cust1"))?.id).toBe("cust_1");
  });

  it("does not accept a customer id or session token", async () => {
    expect(await getCustomerByTokenOrKey("cust_1")).toBeNull();
    expect(await getCustomerByTokenOrKey("zr_sess_cust1")).toBeNull();
  });
});

describe("isMasterAdminKey", () => {
  it("matches ROUTER_API_KEY only (ADMIN_KEY is ignored), ignoring surrounding whitespace", () => {
    expect(isMasterAdminKey("zr_admin_test_key")).toBe(false);
    expect(isMasterAdminKey("  zr_live_test_router_key\t")).toBe(true);
  });

  it("rejects other, partial, empty and non-string values", () => {
    expect(isMasterAdminKey("zr_live_cust1")).toBe(false);
    expect(isMasterAdminKey("zr_admin_test")).toBe(false);
    expect(isMasterAdminKey("")).toBe(false);
    expect(isMasterAdminKey(undefined as unknown as string)).toBe(false);
    expect(isMasterAdminKey(42 as unknown as string)).toBe(false);
  });

  it("matches nothing when neither env var is set", () => {
    const saved = [process.env.ADMIN_KEY, process.env.ROUTER_API_KEY];
    delete process.env.ADMIN_KEY;
    delete process.env.ROUTER_API_KEY;
    try {
      expect(isMasterAdminKey("zr_admin_test_key")).toBe(false);
      expect(isMasterAdminKey("undefined")).toBe(false);
    } finally {
      [process.env.ADMIN_KEY, process.env.ROUTER_API_KEY] = saved;
    }
  });
});

describe("resolveAuth", () => {
  it("resolves a customer session cookie to the customer role", async () => {
    jar.set("zr_session", "zr_sess_cust1");
    const auth = await resolveAuth();
    expect(auth).toMatchObject({ isAdmin: false, role: "customer" });
    expect(auth.customer?.id).toBe("cust_1");
  });

  it("returns no customer for an unknown cookie or no cookie", async () => {
    jar.set("zr_session", "zr_sess_unknown");
    expect(await resolveAuth()).toEqual({ isAdmin: false, role: "customer", customer: null });
    jar.delete("zr_session");
    expect(await resolveAuth()).toEqual({ isAdmin: false, role: "customer", customer: null });
  });

  it("ignores Bearer customer keys and admin keys passed as the header argument", async () => {
    jar.delete("zr_session");
    for (const h of ["Bearer zr_live_cust1", "Bearer zr_admin_test_key", "zr_admin_test_key"]) {
      expect(await resolveAuth(h)).toEqual({ isAdmin: false, role: "customer", customer: null });
    }
  });
});

describe("session cache invalidation", () => {
  it("serves a cached cookie session until invalidated", async () => {
    await db.execute(
      "INSERT INTO customers (id, key, email, session_token, status, created_at, updated_at) VALUES ('cust_2', 'zr_live_cust2', 'd@example.com', 'zr_sess_cust2', 'active', 0, 0)"
    );
    jar.set("zr_session", "zr_sess_cust2");
    expect((await getCurrentUser())?.id).toBe("cust_2");

    // Logout rotates the token in the DB; the 30s cache still answers until invalidated.
    await db.execute("UPDATE customers SET session_token = NULL WHERE id = 'cust_2'");
    expect((await getCurrentUser())?.id).toBe("cust_2");
    invalidateSessionCache("zr_sess_cust2");
    expect(await getCurrentUser()).toBeNull();
  });

  it("expires cached sessions after 30s", async () => {
    await db.execute(
      "INSERT INTO customers (id, key, email, session_token, status, created_at, updated_at) VALUES ('cust_3', 'zr_live_cust3', 'e@example.com', 'zr_sess_cust3', 'active', 0, 0)"
    );
    jar.set("zr_session", "zr_sess_cust3");
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      expect((await getCurrentUser())?.id).toBe("cust_3");
      await db.execute("DELETE FROM customers WHERE id = 'cust_3'");
      vi.advanceTimersByTime(29_000);
      expect((await getCurrentUser())?.id).toBe("cust_3");
      vi.advanceTimersByTime(2_000);
      expect(await getCurrentUser()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("keeps bearer-key cache entries separate from cookie sessions", async () => {
    await db.execute(
      "INSERT INTO customers (id, key, email, session_token, status, created_at, updated_at) VALUES ('cust_4', 'zr_live_cust4', 'f@example.com', 'zr_sess_cust4', 'active', 0, 0)"
    );
    expect((await getCustomerByTokenOrKey("zr_live_cust4"))?.id).toBe("cust_4");
    await db.execute("DELETE FROM customers WHERE id = 'cust_4'");
    invalidateSessionCache("zr_live_cust4"); // un-prefixed: does not touch the bearer entry
    expect((await getCustomerByTokenOrKey("zr_live_cust4"))?.id).toBe("cust_4");
    invalidateSessionCache(); // clear all
    expect(await getCustomerByTokenOrKey("zr_live_cust4")).toBeNull();
    expect(await getCustomerByTokenOrKey("")).toBeNull();
  });
});

describe("customer lookup cache", () => {
  const customer = { id: "cust_9", key: "zr_live_9", bot_id: "bot_9" } as Customer;

  it("indexes by id, key and bot id, and expires after the TTL", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      setCachedCustomer("cust_9", customer, 1000);
      for (const k of ["cust_9", "zr_live_9", "bot_9"]) expect(getCachedCustomer(k)).toBe(customer);
      vi.advanceTimersByTime(1000);
      expect(getCachedCustomer("cust_9")).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("invalidates one entry or all", () => {
    setCachedCustomer("cust_9", customer);
    invalidateCustomerLookupCache("zr_live_9");
    expect(getCachedCustomer("zr_live_9")).toBeNull();
    expect(getCachedCustomer("bot_9")).toBe(customer);
    invalidateCustomerLookupCache();
    expect(getCachedCustomer("bot_9")).toBeNull();
    expect(getCachedCustomer("cust_9")).toBeNull();
  });
});
