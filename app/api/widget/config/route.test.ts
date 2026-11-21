import { beforeEach, expect, it } from "vitest";
import { testDb } from "@/tests/db";
import { GET } from "./route";

const get = (qs: string) => GET(new Request(`http://localhost/api/widget/config?${qs}`));

beforeEach(async () => {
  const db = await testDb();
  await db.execute("DELETE FROM customers");
  await db.execute(`INSERT INTO customers (id, key, email, password_hash, session_token, persona, bot_id, bot_title, prompts, monthly_limit, created_at, updated_at)
    VALUES ('c1', 'zr_live_secret', 'owner@example.com', 'hash', 'zr_sess_secret', 'private instructions', 'bot_pub', 'Shop Bot', 'not json', 500, 0, 0)`);
});

it("requires a bot id", async () => {
  expect((await get("")).status).toBe(400);
});

it("returns 404 for an unknown bot", async () => {
  expect((await get("bot_id=bot_missing")).status).toBe(404);
});

it("serves the built-in demo bot", async () => {
  const res = await get("bot_id=demo");
  expect((await res.json()).bot).toMatchObject({ company: "ZeroRoute", showBadge: false });
});

it("serves public bot settings with CORS and never the owner's secrets", async () => {
  const res = await get("id=bot_pub");
  expect(res.headers.get("access-control-allow-origin")).toBe("*");
  const text = await res.text();
  for (const secret of ["zr_live_secret", "owner@example.com", "hash", "zr_sess_secret", "private instructions"]) {
    expect(text).not.toContain(secret);
  }
  // Bad stored prompts fall back to defaults; a free plan shows the badge.
  expect(JSON.parse(text).bot).toMatchObject({ botTitle: "Shop Bot", isPaid: false, showBadge: true });
  expect(JSON.parse(text).bot.prompts.length).toBeGreaterThan(0);
});
