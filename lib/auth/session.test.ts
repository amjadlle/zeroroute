import { beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { testDb } from "@/tests/db";

const jar = vi.hoisted(() => {
  process.env.ADMIN_EMAIL = "owner@example.com";
  process.env.ADMIN_PASSWORD = "test-admin-password";
  process.env.ADMIN_SESSION_SECRET = "test-admin-session-secret-at-least-32-chars";
  process.env.ROUTER_API_KEY = "zr_live_test_router_key";
  return new Map<string, string>();
});
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (jar.has(name) ? { name, value: jar.get(name) } : undefined) }),
}));

import { getCurrentUser, getCustomerByTokenOrKey, resolveAuth } from "./session";
import { POST as login } from "@/app/api/auth/login/route";

function loginRequest(email: string, password: string) {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

beforeAll(async () => {
  const db = await testDb();
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
