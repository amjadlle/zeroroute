import { beforeEach, describe, expect, it, vi } from "vitest";
import crypto from "crypto";
import { testDb } from "@/tests/db";

const email = vi.hoisted(() => ({
  sendWelcomeCredentialsEmail: vi.fn(async () => {}),
  sendSubscriptionCancelledEmail: vi.fn(async () => {}),
}));
vi.mock("@/lib/email", () => email);

const { POST } = await import("./route");

const SECRET = "test_webhook_secret";
const BUYER = "buyer@example.com";

/** A signed delivery, as the payment provider sends it. `at` is the event's own time in ms. */
function deliver(id: string, type: string, at: number, data: Record<string, unknown> = {}) {
  const body = JSON.stringify({ type, timestamp: new Date(at).toISOString(), data: { customer: { email: BUYER, name: "Buyer" }, ...data } });
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = crypto.createHmac("sha256", Buffer.from(SECRET)).update(`${id}.${ts}.${body}`).digest("base64");
  return POST(new Request("http://localhost/api/webhooks/dodo", {
    method: "POST",
    headers: { "webhook-id": id, "webhook-timestamp": ts, "webhook-signature": `v1,${sig}` },
    body,
  }));
}

async function status() {
  const { rows } = await (await testDb()).execute({ sql: "SELECT status FROM customers WHERE email = ?", args: [BUYER] });
  return rows[0]?.status;
}

beforeEach(async () => {
  process.env.DODO_WEBHOOK_SECRET = SECRET;
  const db = await testDb();
  await db.execute("DELETE FROM customers");
  await db.execute("DELETE FROM webhook_events");
  vi.clearAllMocks();
});

describe("dodo webhook (#45)", () => {
  it("processes a retried delivery once and sends one welcome email", async () => {
    const t = Date.now();
    expect((await deliver("msg_1", "subscription.active", t)).status).toBe(200);
    const retry = await deliver("msg_1", "subscription.active", t);
    expect(retry.status).toBe(200);
    expect(await retry.json()).toMatchObject({ duplicate: true });
    expect(email.sendWelcomeCredentialsEmail).toHaveBeenCalledTimes(1);
    expect(await status()).toBe("active");
  });

  it("ignores an older event that arrives after a newer one", async () => {
    const t = Date.now();
    await deliver("msg_a", "subscription.active", t - 60_000);
    await deliver("msg_c", "subscription.cancelled", t);
    const late = await deliver("msg_b", "subscription.active", t - 30_000);
    expect(await late.json()).toMatchObject({ stale: true });
    expect(await status()).toBe("canceled");
    expect(email.sendWelcomeCredentialsEmail).toHaveBeenCalledTimes(1);
  });

  it("lets a retry through when the first attempt failed", async () => {
    const t = Date.now();
    const db = await testDb();
    await db.execute("ALTER TABLE customers RENAME TO customers_tmp");
    expect((await deliver("msg_x", "subscription.active", t)).status).toBe(400);
    await db.execute("ALTER TABLE customers_tmp RENAME TO customers");
    expect((await deliver("msg_x", "subscription.active", t)).status).toBe(200);
    expect(await status()).toBe("active");
  });
});
