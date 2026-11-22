import { beforeEach, expect, it, vi } from "vitest";
import { A, B, loginAs, seedCustomers } from "@/tests/auth";
import { testDb } from "@/tests/db";

vi.mock("next/headers", async () => (await import("@/tests/cookies")).nextHeaders);

const { GET } = await import("./route");

beforeEach(async () => {
  const db = await seedCustomers();
  await db.execute(`INSERT INTO request_logs (id, customer_key, timestamp, provider, model, latency_ms, status) VALUES
    ('a1', '${A.key}', 2, 'groq', 'm', 100, 200),
    ('a2', '${A.key}', 1, 'groq', 'm', 300, 200),
    ('b1', '${B.key}', 3, 'groq', 'm', 999, 200)`);
});

it("returns only the session owner's logs and their average latency", async () => {
  loginAs(A);
  const { stats } = await (await GET()).json();
  expect(stats.logs.map((l: { id: string }) => l.id)).toEqual(["a1", "a2"]);
  expect(stats).toMatchObject({ totalRecentLogs: 2, averageLatencyMs: 200 });
  expect(Object.keys(stats.logs[0]).sort()).toEqual(["id", "latency_ms", "origin", "prompt_preview", "response_preview", "status", "timestamp"]);
});

it("reports zero latency when there are no logs", async () => {
  loginAs(B);
  await (await testDb()).execute("DELETE FROM request_logs");
  expect((await (await GET()).json()).stats).toMatchObject({ totalRecentLogs: 0, averageLatencyMs: 0 });
});
