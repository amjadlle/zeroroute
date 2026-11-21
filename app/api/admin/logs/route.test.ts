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
