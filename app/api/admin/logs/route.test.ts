import { beforeEach, expect, it, vi } from "vitest";
import { testDb } from "@/tests/db";

vi.mock("@/lib/auth/session", () => ({ resolveAuth: vi.fn(async () => ({ isAdmin: true })) }));

const { GET } = await import("./route");
const metrics = async () => (await (await GET(new Request("http://localhost/api/admin/logs"))).json()).metrics;

beforeEach(async () => {
  await (await testDb()).execute("DELETE FROM request_logs");
});

async function seed(id: string, status: number, latency: number, cacheHit = 0) {
  await (await testDb()).execute({
    sql: `INSERT INTO request_logs (id, customer_key, timestamp, provider, model, latency_ms, status, is_cache_hit) VALUES (?, 'k', 0, 'groq', 'm', ?, ?, ?)`,
    args: [id, latency, status, cacheHit],
  });
}

it("reports zero latency, not a made-up number, when there are no requests", async () => {
  expect(await metrics()).toMatchObject({ totalRequests: 0, avgLatencyMs: 0, cacheHits: 0 });
});

it("computes success rate, cache hits and latency from the rows", async () => {
  await seed("a", 200, 100, 1);
  await seed("b", 200, 200);
  await seed("c", 200, 300, 1);
  await seed("d", 500, 400);
  expect(await metrics()).toMatchObject({ totalRequests: 4, avgLatencyMs: 250, successRate: 75, cacheHits: 2, cacheHitRatio: 50 });
});

it("filters to one customer's requests when customer_key is given", async () => {
  await seed("a", 200, 100);
  await (await testDb()).execute(`INSERT INTO request_logs (id, customer_key, timestamp, provider, model, latency_ms, status) VALUES ('b', 'other', 0, 'groq', 'm', 1, 200)`);
  const res = await GET(new Request("http://localhost/api/admin/logs?customer_key=other"));
  expect((await res.json()).logs.map((l: { id: string }) => l.id)).toEqual(["b"]);
});

it("buckets the last 14 days into rolling 24-hour trends, oldest first", async () => {
  const db = await testDb();
  const now = Date.now();
  const at = (id: string, hoursAgo: number, status: number, latency: number, cacheHit = 0) =>
    db.execute({
      sql: `INSERT INTO request_logs (id, customer_key, timestamp, provider, model, latency_ms, status, is_cache_hit) VALUES (?, 'k', ?, 'groq', 'm', ?, ?, ?)`,
      args: [id, now - hoursAgo * 3_600_000, latency, status, cacheHit],
    });
  await at("a", 1, 200, 100, 1);
  await at("b", 2, 500, 300);
  await at("c", 30, 200, 50);
  await at("d", 24 * 20, 200, 999); // older than the window

  const { daily } = await metrics();
  expect(daily).toHaveLength(14);
  expect(daily[13]).toEqual({ total: 2, ok: 1, cacheHits: 1, avgLatencyMs: 200 });
  expect(daily[12]).toEqual({ total: 1, ok: 1, cacheHits: 0, avgLatencyMs: 50 });
  expect(daily.slice(0, 12).every((d: { total: number }) => d.total === 0)).toBe(true);
});
