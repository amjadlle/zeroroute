import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { testDb } from "@/tests/db";
import { runtimeStateMap } from "@/lib/providers/state";

const session = vi.hoisted(() => ({ user: null as null | Record<string, unknown> }));
vi.mock("@/lib/auth/session", async importOriginal => ({
  ...(await importOriginal<typeof import("@/lib/auth/session")>()),
  getCurrentUser: async () => session.user
}));

const { POST, OPTIONS } = await import("./route");

let db: Awaited<ReturnType<typeof testDb>>;
let seq = 0;
const fetchMock = vi.fn();

async function addCustomer(over: Record<string, unknown> = {}) {
  const n = ++seq;
  const c = { key: `zr_live_test${n}`, bot_id: `bot_test${n}`, monthly_requests: 0, monthly_limit: 1000, allowed_domains: "[]", ...over };
  await db.execute({
    sql: `INSERT INTO customers (id, key, email, bot_id, status, monthly_requests, monthly_limit, allowed_domains, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'active', ?, ?, ?, 0, 0)`,
    args: [`c${n}`, c.key, `c${n}@test.dev`, c.bot_id, c.monthly_requests, c.monthly_limit, c.allowed_domains]
  });
  return c;
}

function chat(headers: Record<string, string>, body: Record<string, unknown> = {}) {
  return POST(new Request("http://localhost/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", "x-real-ip": `10.0.0.${++seq % 250}`, ...headers },
    body: JSON.stringify({ messages: [{ role: "user", content: `hello ${++seq}` }], ...body })
  }));
}

beforeAll(async () => {
  db = await testDb();
  process.env.GROQ_API_KEY = "gsk_test_key";
});

beforeEach(() => {
  session.user = null;
  for (const s of runtimeStateMap.values()) {
    s.enabled = s.id === "groq";
    s.cooldownUntil = 0;
    s.models = [s.model];
  }
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => Response.json({ id: crypto.randomUUID(), choices: [{ message: { content: "hi" } }] }));
  vi.stubGlobal("fetch", fetchMock);
});

describe("CORS and cookie auth", () => {
  it("never allows credentials", async () => {
    const res = await OPTIONS();
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("access-control-allow-credentials")).toBeNull();
  });

  it("ignores the cookie session on cross-origin calls", async () => {
    const c = await addCustomer();
    session.user = { id: "u1", key: c.key };
    expect((await chat({ origin: "https://evil.example" })).status).toBe(401);
    expect((await chat({ origin: "http://localhost" })).status).toBe(200);
  });
});

describe("demo bot", () => {
  it("rejects any origin other than the official site", async () => {
    expect((await chat({ "x-bot-id": "demo", origin: "https://evil.example" })).status).toBe(403);
    expect((await chat({ "x-bot-id": "demo", origin: "https://mapki.in.evil.com" })).status).toBe(403);
    expect((await chat({ "x-bot-id": "demo" })).status).toBe(403);
    expect((await chat({ "x-bot-id": "demo", origin: "https://zeroroute.mapki.in" })).status).toBe(200);
  });
});

describe("widget rate limits", () => {
  it("limits per IP, and spoofed headers don't reset it", async () => {
    const c = await addCustomer();
    const statuses = [];
    for (let i = 0; i < 31; i++) {
      statuses.push((await chat({ "x-bot-id": c.bot_id, "x-real-ip": "9.9.9.9", "x-forwarded-for": `1.2.3.${i}` })).status);
    }
    expect(statuses.slice(0, 30).every(s => s === 200)).toBe(true);
    expect(statuses[30]).toBe(429);
  });

  it("limits per bot across many IPs", async () => {
    const c = await addCustomer();
    let last = 0;
    for (let i = 0; i < 301; i++) {
      last = (await chat({ "x-bot-id": c.bot_id, "x-real-ip": `172.16.${i >> 8}.${i & 255}` })).status;
    }
    expect(last).toBe(429);
  });

  it("does not limit bearer API-key calls", async () => {
    const c = await addCustomer();
    for (let i = 0; i < 31; i++) {
      expect((await chat({ authorization: `Bearer ${c.key}`, "x-real-ip": "8.8.8.8" })).status).toBe(200);
    }
  });
});

describe("quota", () => {
  it("lets exactly the remaining quota through under concurrency", async () => {
    const c = await addCustomer({ monthly_requests: 4, monthly_limit: 5 });
    const results = await Promise.all(Array.from({ length: 5 }, () => chat({ authorization: `Bearer ${c.key}` })));
    expect(results.map(r => r.status).sort()).toEqual([200, 429, 429, 429, 429]);
    const { rows } = await db.execute({ sql: "SELECT monthly_requests FROM customers WHERE key = ?", args: [c.key] });
    expect(Number(rows[0].monthly_requests)).toBe(5);
  });

  it("rejects a cached customer whose row is gone", async () => {
    const c = await addCustomer();
    expect((await chat({ authorization: `Bearer ${c.key}` })).status).toBe(200);
    await db.execute({ sql: "DELETE FROM customers WHERE key = ?", args: [c.key] });
    expect((await chat({ authorization: `Bearer ${c.key}` })).status).toBe(401);
  });
});

describe("size caps", () => {
  it("rejects oversized messages before calling a provider and clamps max_tokens", async () => {
    const c = await addCustomer();
    const auth = { authorization: `Bearer ${c.key}` };
    expect((await chat(auth, { messages: [{ role: "user", content: "a".repeat(20_000) }] })).status).toBe(413);
    expect(fetchMock).not.toHaveBeenCalled();

    expect((await chat(auth, { max_tokens: 1_000_000 })).status).toBe(200);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).max_tokens).toBe(4096);
  });
});
