import { afterAll, afterEach, beforeEach, expect, it, vi } from "vitest";
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
afterEach(() => vi.setSystemTime(NOW));

type Day = { date: string; total: number; failed: number; unanswered: number; avgReplyMs: number };
const get = (tz?: string) =>
  GET(new Request(`http://localhost/api/customer/insights${tz === undefined ? "" : `?tz=${encodeURIComponent(tz)}`}`));
const body = async (tz?: string) => (await get(tz)).json() as Promise<{ days: Day[]; topics: { topic: string; count: number; example: string }[] }>;

let n = 0;
const insert = async (key: string, timestamp: number, prompt: string, reply: string, status = 200, latency = 100) =>
  (await import("@/lib/db")).getDb().execute({
    sql: `INSERT INTO request_logs (id, customer_key, timestamp, prompt_preview, response_preview, provider, model, latency_ms, status)
          VALUES (?, ?, ?, ?, ?, 'groq', 'm', ?, ?)`,
    args: [`l${n++}`, key, timestamp, prompt, reply, latency, status],
  });

beforeEach(async () => {
  await seedCustomers();
  const log = (key: string, ago: number, prompt: string, reply: string, status?: number, latency?: number) =>
    insert(key, NOW - ago, prompt, reply, status, latency);
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
  expect((await get()).status).toBe(401);
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

it("buckets days in the customer's time zone", async () => {
  loginAs(A);
  // 01:00 on Nov 22 in Tokyo (UTC+9), still Nov 21 in UTC.
  await insert(A.key, Date.UTC(2026, 10, 21, 16), "Early bird question", "Sure.");
  // Midnight starting Nov 9 in Tokyo opens its window; a minute earlier is outside it. Both are Nov 8 in UTC.
  await insert(A.key, Date.UTC(2026, 10, 8, 15), "Nov 9, 00:00 JST", "Sure.");
  await insert(A.key, Date.UTC(2026, 10, 8, 14, 59), "Nov 8, 23:59 JST", "Sure.");

  const tokyo = (await body("Asia/Tokyo")).days;
  expect(tokyo[0]).toMatchObject({ date: "2026-11-09", total: 1 });
  expect(tokyo.at(-1)).toMatchObject({ date: "2026-11-22", total: 7 });
  expect(tokyo.at(-2)).toMatchObject({ date: "2026-11-21", total: 1 });
  expect(tokyo.reduce((s, d) => s + d.total, 0)).toBe(9);

  const utc = (await body()).days;
  expect(utc.at(-1)).toMatchObject({ date: "2026-11-22", total: 6 });
  expect(utc.at(-2)).toMatchObject({ date: "2026-11-21", total: 2 });
  expect(utc[0]).toMatchObject({ date: "2026-11-09", total: 0 });
  expect(utc.reduce((s, d) => s + d.total, 0)).toBe(8);
});

it("falls back to UTC for an unknown or malformed time zone", async () => {
  loginAs(A);
  const utc = await body("UTC");
  expect(await body("Not/A_Zone")).toEqual(utc);
  expect(await body("../../etc/passwd")).toEqual(utc);
  expect(await body("")).toEqual(utc);
  expect(await body()).toEqual(utc);
});

it("finds each local midnight across a DST change and a skipped midnight", async () => {
  loginAs(A);
  const db = (await import("@/lib/db")).getDb();
  const clear = () => db.execute({ sql: "DELETE FROM request_logs WHERE customer_key = ?", args: [A.key] });
  await clear();

  // New York leaves DST on Nov 1 2026: the window's first day (Oct 23) is UTC-4, the last (Nov 5) UTC-5.
  vi.setSystemTime(Date.UTC(2026, 10, 5, 12));
  await insert(A.key, Date.UTC(2026, 9, 23, 3, 59), "Oct 22, 23:59 EDT", "Sure."); // outside the window
  await insert(A.key, Date.UTC(2026, 9, 23, 4), "Oct 23, 00:00 EDT", "Sure.");
  await insert(A.key, Date.UTC(2026, 10, 5, 4, 59), "Nov 4, 23:59 EST", "Sure.");
  await insert(A.key, Date.UTC(2026, 10, 5, 5), "Nov 5, 00:00 EST", "Sure.");
  const ny = (await body("America/New_York")).days;
  expect(ny[0]).toMatchObject({ date: "2026-10-23", total: 1 });
  expect(ny.at(-2)).toMatchObject({ date: "2026-11-04", total: 1 });
  expect(ny.at(-1)).toMatchObject({ date: "2026-11-05", total: 1 });

  // Chile springs forward at midnight on Sep 6 2026: 00:00 never happens, the day starts at 01:00 (UTC-3).
  await clear();
  vi.setSystemTime(Date.UTC(2026, 8, 6, 12));
  await insert(A.key, Date.UTC(2026, 8, 6, 3, 59), "Sep 5, 23:59 -04", "Sure.");
  await insert(A.key, Date.UTC(2026, 8, 6, 4), "Sep 6, 01:00 -03", "Sure.");
  const santiago = (await body("America/Santiago")).days;
  expect(santiago.at(-1)).toMatchObject({ date: "2026-09-06", total: 1 });
  expect(santiago.at(-2)).toMatchObject({ date: "2026-09-05", total: 1 });
});
