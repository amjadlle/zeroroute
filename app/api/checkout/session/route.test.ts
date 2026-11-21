import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { testDb } from "@/tests/db";
import { GET } from "./route";

const EMAIL = "buyer@example.com";

beforeEach(async () => {
  process.env.DODO_API_KEY = "test_key";
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ status: "succeeded", customer: { email: EMAIL, name: "Buyer" } })));
  const db = await testDb();
  await db.execute("DELETE FROM customers");
  await db.execute("DELETE FROM checkout_claims");
});

afterEach(() => vi.unstubAllGlobals());

const lookup = (qs: string) => GET(new NextRequest(`http://localhost/api/checkout/session?${qs}`));

async function seedCustomer(status: string) {
  const db = await testDb();
  await db.execute({
    sql: `INSERT INTO customers (id, key, email, bot_id, status, monthly_limit, created_at, updated_at) VALUES ('c1', 'zr_live_k', ?, 'bot_1', ?, 500, 0, 0)`,
    args: [EMAIL, status],
  });
}

it("issues a session and key only the first time an id is seen", async () => {
  await seedCustomer("active");

  const first = await lookup("payment_id=pay_1");
  expect((await first.json()).key).toBe("zr_live_k");
  expect(first.cookies.get("zr_session")?.value).toMatch(/^zr_sess_/);

  const replay = await lookup("payment_id=pay_1");
  const body = await replay.json();
  expect(body).toMatchObject({ success: false, paid: true, claimed: true });
  expect(body.key).toBeUndefined();
  expect(replay.cookies.get("zr_session")).toBeUndefined();
});

it("treats a lookup as a replay if any presented id was already claimed", async () => {
  await seedCustomer("active");
  await lookup("payment_id=pay_1");
  const res = await lookup("subscription_id=sub_new&payment_id=pay_1");
  expect((await res.json()).key).toBeUndefined();
});

it("never changes plan status or limits", async () => {
  await seedCustomer("canceled");
  await lookup("payment_id=pay_2");
  await lookup("payment_id=pay_2");
  const { rows } = await (await testDb()).execute("SELECT status, monthly_limit, subscription_expires FROM customers");
  expect(rows[0]).toMatchObject({ status: "canceled", monthly_limit: 500, subscription_expires: null });
});

it("reports pending without creating an account or consuming the id before the webhook", async () => {
  const res = await lookup("payment_id=pay_3");
  expect(res.status).toBe(202);
  expect(res.cookies.get("zr_session")).toBeUndefined();
  const db = await testDb();
  expect((await db.execute("SELECT * FROM customers")).rows).toHaveLength(0);
  expect((await db.execute("SELECT * FROM checkout_claims")).rows).toHaveLength(0);

  await seedCustomer("active");
  expect((await (await lookup("payment_id=pay_3")).json()).success).toBe(true);
});
