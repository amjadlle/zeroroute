import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { SignJWT } from "jose";
import { A, ADMIN_SECRET, jar, loginAs, loginAsAdmin, req, seedCustomers } from "@/tests/auth";
import { testDb } from "@/tests/db";

vi.mock("next/headers", async () => (await import("@/tests/cookies")).nextHeaders);

const customers = await import("./customers/route");
const logs = await import("./logs/route");
const providers = await import("./providers/route");
const providerTest = await import("./providers/test/route");
const benchmark = await import("./providers/benchmark/route");

// Every admin handler, called with a body that would change data if it got through.
const calls: Record<string, (bearer?: string) => Promise<Response>> = {
  "GET customers": (b) => customers.GET(req("/api/admin/customers", { bearer: b })),
  "POST customers": (b) => customers.POST(req("/api/admin/customers", { bearer: b, body: { name: "planted" } })),
  "PATCH customers": (b) => customers.PATCH(req("/api/admin/customers", { bearer: b, method: "PATCH", body: { id: A.id, status: "canceled", monthly_limit: 999999999 } })),
  "DELETE customers": (b) => customers.DELETE(req(`/api/admin/customers?id=${A.id}`, { bearer: b, method: "DELETE" })),
  "GET logs": (b) => logs.GET(req("/api/admin/logs", { bearer: b })),
  "GET providers": (b) => providers.GET(req("/api/admin/providers", { bearer: b })),
  "PUT providers": (b) => providers.PUT(req("/api/admin/providers", { bearer: b, method: "PUT", body: { providers: [] } })),
  "POST providers/test": (b) => providerTest.POST(req("/api/admin/providers/test", { bearer: b, body: { providerId: "groq" } })),
  "POST providers/benchmark": (b) => benchmark.POST(req("/api/admin/providers/benchmark", { bearer: b, method: "POST" })),
};
const all = Object.entries(calls);

beforeAll(() => {
  process.env.ADMIN_KEY = "zr_admin_master_key";
  process.env.ROUTER_API_KEY = "zr_router_key";
  // Provider tests must never reach the network.
  vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network disabled in tests"); }));
});
afterAll(() => vi.unstubAllGlobals());

beforeEach(async () => {
  await seedCustomers();
  process.env.ADMIN_SESSION_SECRET = ADMIN_SECRET;
});

async function untouched() {
  const { rows } = await (await testDb()).execute({ sql: "SELECT status, monthly_limit FROM customers WHERE id = ?", args: [A.id] });
  expect(rows[0]).toMatchObject({ status: "active", monthly_limit: 500 });
  expect((await (await testDb()).execute("SELECT COUNT(*) AS n FROM customers")).rows[0].n).toBe(2);
}

it.each(all)("%s: anonymous gets 401", async (_n, call) => {
  expect((await call()).status).toBe(401);
  await untouched();
});

it.each(all)("%s: a customer session gets 401", async (_n, call) => {
  loginAs(A);
  expect((await call()).status).toBe(401);
  await untouched();
});

it.each(all)("%s: a customer API key gets 401", async (_n, call) => {
  expect((await call(A.key)).status).toBe(401);
});

it.each(all)("%s: ADMIN_KEY / ROUTER_API_KEY as a bearer token never grant admin", async (_n, call) => {
  expect((await call(process.env.ADMIN_KEY)).status).toBe(401);
  expect((await call(process.env.ROUTER_API_KEY)).status).toBe(401);
  await untouched();
});

it.each(all)("%s: an admin-shaped JWT signed with the wrong secret gets 401", async (_n, call) => {
  jar.session = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("admin_master")
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode("x".repeat(40)));
  expect((await call()).status).toBe(401);
});

it.each(all)("%s: an admin session is rejected once ADMIN_SESSION_SECRET is unset", async (_n, call) => {
  await loginAsAdmin();
  delete process.env.ADMIN_SESSION_SECRET;
  expect((await call()).status).toBe(401);
});

it("an expired admin session gets 401", async () => {
  jar.session = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("admin_master")
    .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
    .sign(new TextEncoder().encode(ADMIN_SECRET));
  expect((await calls["GET customers"]()).status).toBe(401);
});

it("a valid admin session gets through", async () => {
  await loginAsAdmin();
  expect((await calls["GET customers"]()).status).toBe(200);
  expect((await calls["GET logs"]()).status).toBe(200);
  expect((await calls["GET providers"]()).status).toBe(200);
});
