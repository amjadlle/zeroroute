import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const webhookSecret = process.env.DODO_WEBHOOK_SECRET;

    // Verify Standard Webhook Signature if secret configured
    if (webhookSecret && webhookSecret.trim() !== "") {
      const webhookId = request.headers.get("webhook-id") || request.headers.get("webhook_id");
      const webhookTimestamp = request.headers.get("webhook-timestamp") || request.headers.get("webhook_timestamp");
      const webhookSignature = request.headers.get("webhook-signature") || request.headers.get("webhook_signature");

      if (!webhookId || !webhookTimestamp || !webhookSignature) {
        console.warn("[DodoWebhook] Missing webhook signature headers");
        return NextResponse.json({ error: "Missing signature headers" }, { status: 401 });
      }

      const secretKey = webhookSecret.startsWith("whsec_")
        ? Buffer.from(webhookSecret.slice(6), "base64")
        : Buffer.from(webhookSecret, "utf-8");

      const toSign = `${webhookId}.${webhookTimestamp}.${rawBody}`;
      const expectedSig = crypto.createHmac("sha256", secretKey).update(toSign).digest("base64");

      const signatures = webhookSignature.split(" ").map(s => s.replace(/^v\d+,/, "").trim());
      const isValid = signatures.some(sig => sig === expectedSig);

      if (!isValid) {
        console.warn("[DodoWebhook] Invalid signature received");
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event.type || event.event_type || "";
    console.log(`[DodoWebhook] Received event: ${eventType}`);

    const data = event.data || event;
    const customerEmail = (data.customer?.email || data.email || "").trim().toLowerCase();
    const customerName = data.customer?.name || data.name || "Subscriber";
    const customerCompany = data.customer_business_name || data.customer?.business_name || data.metadata?.company || customerName;

    if (customerEmail) {
      const { initDb } = await import("@/lib/db");
      await initDb();
      const db = getDb();
      const existingRes = await db.execute({
        sql: `SELECT * FROM customers WHERE email = ? LIMIT 1`,
        args: [customerEmail]
      });

      const existing = existingRes.rows[0] as any;
      const now = Date.now();

      // 1. Activation & Renewal Events
      if (
        eventType.includes("payment.succeeded") ||
        eventType.includes("subscription.active") ||
        eventType.includes("subscription.created") ||
        eventType.includes("subscription.renewed") ||
        eventType.includes("subscription.unpaused") ||
        eventType.includes("subscription.updated")
      ) {
        const expiresAt = data.next_billing_date ? new Date(data.next_billing_date).getTime() : now + 30 * 24 * 60 * 60 * 1000;
        let activeKey = "";
        let activeBotId = "";
        let activeName = customerName;

        if (existing) {
          activeKey = existing.key || existing.api_key || `zr_live_${crypto.randomBytes(18).toString("hex")}`;
          activeBotId = existing.bot_id || `bot_${crypto.randomBytes(8).toString("hex")}`;
          activeName = existing.name || customerName;

          await db.execute({
            sql: `UPDATE customers SET status = 'active', subscription_expires = ?, key = ?, bot_id = ?, monthly_requests = 0, updated_at = ? WHERE email = ?`,
            args: [expiresAt, activeKey, activeBotId, now, customerEmail]
          });
        } else {
          const id = crypto.randomUUID();
          activeKey = `zr_live_${crypto.randomBytes(18).toString("hex")}`;
          activeBotId = `bot_${crypto.randomBytes(8).toString("hex")}`;

          await db.execute({
            sql: `INSERT INTO customers (id, key, email, name, company, bot_id, status, subscription_expires, monthly_requests, monthly_limit, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, 0, 10000, ?, ?)`,
            args: [id, activeKey, customerEmail, customerName, customerCompany, activeBotId, expiresAt, now, now]
          });
        }

        // Dispatch transactional welcome email on activation
        try {
          const { sendWelcomeCredentialsEmail } = await import("@/lib/email");
          await sendWelcomeCredentialsEmail({
            email: customerEmail,
            name: activeName,
            key: activeKey,
            botId: activeBotId,
          });
        } catch (emailErr) {
          console.warn("[DodoWebhook] Welcome email error:", emailErr);
        }

        console.log(`[DodoWebhook] Activated subscriber & dispatched email: ${customerEmail}`);
      }

      // 2. Cancellation Events
      if (
        eventType.includes("subscription.cancelled") ||
        eventType.includes("subscription.canceled") ||
        eventType.includes("subscription.expired") ||
        eventType.includes("payment.cancelled") ||
        eventType.includes("payment.canceled")
      ) {
        if (existing) {
          await db.execute({
            sql: `UPDATE customers SET status = 'canceled', updated_at = ? WHERE email = ?`,
            args: [now, customerEmail]
          });
          console.log(`[DodoWebhook] Canceled subscriber: ${customerEmail}`);
        }
      }

      // 3. Past Due / Paused Events
      if (
        eventType.includes("subscription.failed") ||
        eventType.includes("subscription.past_due") ||
        eventType.includes("subscription.on_hold") ||
        eventType.includes("subscription.paused") ||
        eventType.includes("payment.failed")
      ) {
        if (existing) {
          await db.execute({
            sql: `UPDATE customers SET status = 'paused', updated_at = ? WHERE email = ?`,
            args: [now, customerEmail]
          });
          console.log(`[DodoWebhook] Paused subscriber: ${customerEmail}`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[DodoWebhook Error]:", err);
    return NextResponse.json({ error: "Webhook error" }, { status: 400 });
  }
}
