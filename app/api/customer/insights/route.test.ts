import { afterAll, beforeEach, expect, it, vi } from "vitest";
import { A, B, loginAs, seedCustomers } from "@/tests/auth";
import { jar } from "@/tests/cookies";

vi.mock("next/headers", async () => (await import("@/tests/cookies")).nextHeaders);

const { GET } = await import("./route");

const DAY = 86_400_000;
const REFUSAL = "I don't have specific information about that in my knowledge base. For accurate details…";
// Noon UTC, so every "today" log stays on the same UTC day.
const NOW = Date.UTC(2026, 10, 22, 12);
vi.useFakeTimers({ toFake: ["Date"], now: NOW });
afterAll(() => vi.useRealTimers());

type Day = { date: string; total: number; failed: number; unanswered: number; avgReplyMs: number };
const body = async () => (await GET()).json() as Promise<{ days: Day[]; topics: { topic: string; count: number; example: string }[] }>;

beforeEach(async () => {
  const db = await seedCustomers();
  let n = 0;
  const log = (key: string, ago: number, prompt: string, reply: string, status = 200, latency = 100) =>
    db.execute({
      sql: `INSERT INTO request_logs (id, customer_key, timestamp, prompt_preview, response_preview, provider, model, latency_ms, status)
            VALUES (?, ?, ?, ?, ?, 'groq', 'm', ?, ?)`,
      args: [`l${n++}`, key, NOW - ago, prompt, reply, latency, status],
    });
  await log(A.key, 0, "Can I pay in instalments?", REFUSAL, 200, 100);
  await log(A.key, 1000, "Do you offer instalment plans", "I don’t have specific information about that.", 200, 300);
  await log(A.key, 2000, "Instalments for the annual course?", REFUSAL);
  await log(A.key, 3000, "Do you travel to Leeds?", REFUSAL);
  await log(A.key, 4000, "What are your hours?", "We are open 9 to 5, Monday to Friday.");
  await log(A.key, 5000, "Is the shop open on Sunday?", "All providers failed (request x)", 502, 9000);
  await log(A.key, DAY, "Price of a trial?", "A trial lesson is free.", 200, 500);
  await log(A.key, 20 * DAY, "Old question about instalments", REFUSAL); // outside the 14-day window
  // Another customer's gaps must never show up for A.
  for (let i = 0; i < 5; i++) await log(B.key, i, "Secret refund policy question", REFUSAL);
});

it("rejects a request without a session", async () => {
  jar.session = undefined;
  expect((await GET()).status).toBe(401);
});

it("counts the last 14 days per day for the session owner only", async () => {
  loginAs(A);
  const { days } = await body();
  expect(days).toHaveLength(14);
  expect(days[0].date).toBe("2026-11-09");
  expect(days.at(-1)).toEqual({ date: "2026-11-22", total: 6, failed: 1, unanswered: 4, avgReplyMs: 140 });
  expect(days.at(-2)).toMatchObject({ date: "2026-11-21", total: 1, failed: 0, unanswered: 0, avgReplyMs: 500 });
  expect(days.slice(0, -2).every((d) => d.total === 0)).toBe(true);
});

it("groups unanswered questions into topics, ignoring answered and failed ones", async () => {
  loginAs(A);
  const { topics } = await body();
  expect(topics).toEqual([
    { topic: "instalments", count: 3, example: "Can I pay in instalments?" },
    { topic: "travel", count: 1, example: "Do you travel to Leeds?" },
  ]);
  expect(JSON.stringify(topics)).not.toMatch(/refund|hours|shop/i);
});

it("returns empty insights for a customer with no logs in the window", async () => {
  loginAs(B);
  const db = (await import("@/lib/db")).getDb();
  await db.execute({ sql: "DELETE FROM request_logs WHERE customer_key = ?", args: [B.key] });
  const { days, topics } = await body();
  expect(days.every((d) => d.total === 0 && d.avgReplyMs === 0)).toBe(true);
  expect(topics).toEqual([]);
});
