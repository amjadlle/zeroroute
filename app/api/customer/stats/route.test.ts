import { beforeEach, expect, it, vi } from "vitest";
import { A, B, loginAs, seedCustomers } from "@/tests/auth";
import { testDb } from "@/tests/db";

vi.mock("next/headers", async () => (await import("@/tests/cookies")).nextHeaders);

const { GET } = await import("./route");
const req = (query = "") => new Request(`http://localhost/api/customer/stats${query}`);

beforeEach(async () => {
  const db = await seedCustomers();
  await db.execute(`INSERT INTO request_logs (id, customer_key, timestamp, provider, model, latency_ms, status) VALUES
    ('a1', '${A.key}', 2, 'groq', 'm', 100, 200),
    ('a2', '${A.key}', 1, 'groq', 'm', 300, 200),
    ('b1', '${B.key}', 3, 'groq', 'm', 999, 200)`);
});

it("returns only the session owner's logs and their average latency", async () => {
  loginAs(A);
  const { stats } = await (await GET(req())).json();
  expect(stats.logs.map((l: { id: string }) => l.id)).toEqual(["a1", "a2"]);
  expect(stats).toMatchObject({ totalRecentLogs: 2, averageLatencyMs: 200 });
  expect(Object.keys(stats.logs[0]).sort()).toEqual(["id", "latency_ms", "origin", "prompt_preview", "response_preview", "status", "timestamp"]);
});

it("reports zero latency when there are no logs", async () => {
  loginAs(B);
  await (await testDb()).execute("DELETE FROM request_logs");
  expect((await (await GET(req())).json()).stats).toMatchObject({ totalRecentLogs: 0, averageLatencyMs: 0 });
});

it("filters by result with ?show=answered|unanswered|failed", async () => {
  const db = await testDb();
  await db.execute(`INSERT INTO request_logs (id, customer_key, timestamp, prompt_preview, response_preview, provider, model, latency_ms, status) VALUES
    ('u1', '${A.key}', 10, 'Instalments?', 'I don''t have specific information about that in my knowledge base.', 'groq', 'm', 100, 200),
    ('u2', '${A.key}', 9, 'Hours?', 'I DON''T HAVE ANY INFORMATION available right now.', 'groq', 'm', 100, 200),
    ('f1', '${A.key}', 8, 'Broken', 'in my knowledge base', 'groq', 'm', 100, 502),
    ('u3', '${B.key}', 7, 'Not yours', 'I don''t have specific information about that.', 'groq', 'm', 100, 200),
    ('f2', '${A.key}', 6, 'Down', NULL, 'groq', 'm', 100, 500)`);
  loginAs(A);
  const ids = async (query: string) => (await (await GET(req(query))).json()).stats.logs.map((l: { id: string }) => l.id);
  expect(await ids("?show=unanswered")).toEqual(["u1", "u2"]);
  // a1/a2 have no reply text saved: still answered, not dropped by the NULL LIKE.
  expect(await ids("?show=answered")).toEqual(["a1", "a2"]);
  expect(await ids("?show=failed")).toEqual(["f1", "f2"]);
  expect(await ids("?show=all")).toEqual(["u1", "u2", "f1", "f2", "a1", "a2"]);
  expect(await ids("?show=nonsense")).toEqual(["u1", "u2", "f1", "f2", "a1", "a2"]);
});
