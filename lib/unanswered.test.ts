import { expect, it } from "vitest";
import { testDb } from "@/tests/db";
import { isUnanswered, UNANSWERED_ARGS, UNANSWERED_SQL } from "./unanswered";

const ROWS = [
  { status: 200, response_preview: "I don't have specific information about that in my knowledge base." },
  { status: 200, response_preview: "I don’t have any information available at this time." }, // curly apostrophe
  { status: 200, response_preview: "SORRY, NOTHING IN MY KNOWLEDGE BASE ABOUT THAT." },
  { status: 200, response_preview: "We are open 9 to 5." },
  { status: 200, response_preview: null },
  { status: 502, response_preview: "I don't have specific information about that." }, // failed, not a gap
];

it("flags refusals, never answers or failed requests, and agrees with the SQL condition", async () => {
  expect(ROWS.map(isUnanswered)).toEqual([true, true, true, false, false, false]);

  const db = await testDb();
  for (const [i, r] of ROWS.entries()) {
    await db.execute({
      sql: `INSERT INTO request_logs (id, customer_key, timestamp, response_preview, provider, model, latency_ms, status)
            VALUES (?, 'k', ?, ?, 'groq', 'm', 1, ?)`,
      args: [`r${i}`, i, r.response_preview, r.status],
    });
  }
  const res = await db.execute({ sql: `SELECT id FROM request_logs WHERE ${UNANSWERED_SQL} ORDER BY timestamp`, args: UNANSWERED_ARGS });
  expect(res.rows.map((r) => r.id)).toEqual(["r0", "r1", "r2"]);
});
