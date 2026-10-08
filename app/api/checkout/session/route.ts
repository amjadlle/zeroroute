import { NextResponse } from "next/server";
import crypto from "crypto";
import { getDb, initDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id") || url.searchParams.get("id");
  const subscriptionId = url.searchParams.get("subscription_id");
  const paymentId = url.searchParams.get("payment_id");
  let emailParam = url.searchParams.get("email")?.trim().toLowerCase();
  const statusParam = (url.searchParams.get("status") || "").toLowerCase();

  const apiKey = process.env.DODO_API_KEY;
  const isLive = process.env.DODO_ENVIRONMENT === "live_mode";
  const dodoApiBase = isLive ? "https://live.dodopayments.com" : "https://test.dodopayments.com";

  if (!apiKey || apiKey.trim() === "") {
    return NextResponse.json(
      { error: "Payment gateway is not configured on this server." },
      { status: 503 }
    );
  }

  // Mandatory verification parameters
  if (!sessionId && !subscriptionId && !paymentId) {
    return NextResponse.json(
      { error: "Missing required payment verification identifier (session_id, subscription_id, or payment_id)." },
      { status: 400 }
    );
  }

  let customerEmail = "";
  let customerName = "Subscriber";
  let customerCompany = "My Application";
  let isPaymentSuccessful = false;

  // 1. Strictly verify payment status with Dodo Payments API
  try {
    if (subscriptionId) {
      const subRes = await fetch(`${dodoApiBase}/subscriptions/${subscriptionId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (subRes.ok) {
        const subData = await subRes.json();
        if (subData.customer?.email) customerEmail = subData.customer.email.toLowerCase();
        if (subData.customer?.name) customerName = subData.customer.name;
        if (subData.status === "active" || subData.status === "on_trial") {
          isPaymentSuccessful = true;
        }
      }
    } else if (sessionId) {
      const dodoRes = await fetch(`${dodoApiBase}/checkouts/${sessionId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (dodoRes.ok) {
        const sessionData = await dodoRes.json();
        if (sessionData.customer?.email) customerEmail = sessionData.customer.email.toLowerCase();
        if (sessionData.customer?.name) customerName = sessionData.customer.name;
        const status = sessionData.payment_status || sessionData.status;
        if (status === "succeeded" || status === "paid" || status === "complete" || status === "active") {
          isPaymentSuccessful = true;
        }
      }
    } else if (paymentId) {
      const payRes = await fetch(`${dodoApiBase}/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (payRes.ok) {
        const payData = await payRes.json();
        if (payData.customer?.email) customerEmail = payData.customer.email.toLowerCase();
        if (payData.customer?.name) customerName = payData.customer.name;
        if (payData.status === "succeeded" || payData.status === "paid") {
          isPaymentSuccessful = true;
        }
      }
    }
  } catch (err) {
    console.error("[DodoVerification] API fetch error:", err);
    return NextResponse.json(
      { error: "Unable to verify payment with gateway. Please contact support." },
      { status: 502 }
    );
  }

  // Only proceed if payment is confirmed successful and email is verified from Dodo
  if (!isPaymentSuccessful || !customerEmail) {
    return NextResponse.json(
      { error: "Payment verification failed or payment is incomplete." },
      { status: 400 }
    );
  }

  await initDb();
  const db = getDb();
  const existingRes = await db.execute({
    sql: `SELECT * FROM customers WHERE email = ? LIMIT 1`,
    args: [customerEmail],
  });

  let customer = existingRes.rows[0] as any;
  const now = Date.now();
    const expiresAt = now + 30 * 24 * 60 * 60 * 1000;

    if (!customer) {
      const id = crypto.randomUUID();
      const key = `zr_live_${crypto.randomBytes(18).toString("hex")}`;
      const botId = `bot_${crypto.randomBytes(8).toString("hex")}`;
      const sessionToken = `zr_sess_${crypto.randomBytes(24).toString("hex")}`;

      await db.execute({
        sql: `INSERT INTO customers (
          id, key, email, name, company, bot_id, status,
          subscription_expires, monthly_requests, monthly_limit,
          session_token, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'active', ?, 0, 10000, ?, ?, ?)`,
        args: [
          id,
          key,
          customerEmail,
          customerName,
          customerCompany,
          botId,
          expiresAt,
          sessionToken,
          now,
          now,
        ],
      });

      customer = {
        id,
        key,
        email: customerEmail,
        name: customerName,
        company: customerCompany,
        bot_id: botId,
        status: "active",
        session_token: sessionToken,
      };

    } else {
      // Ensure status is active and upgrade quota to 10,000 requests/month
      const sessionToken = `zr_sess_${crypto.randomBytes(24).toString("hex")}`;
      await db.execute({
        sql: `UPDATE customers SET status = 'active', monthly_limit = 10000, subscription_expires = ?, session_token = ?, updated_at = ? WHERE id = ?`,
        args: [expiresAt, sessionToken, now, customer.id],
      });
      customer.session_token = sessionToken;
      customer.status = "active";
      customer.monthly_limit = 10000;
    }

    // Dispatch welcome credentials email upon successful checkout
    try {
      const { sendWelcomeCredentialsEmail } = await import("@/lib/email");
      await sendWelcomeCredentialsEmail({
        email: customer.email || customerEmail,
        name: customer.name || customerName,
        key: customer.key,
        botId: customer.bot_id,
      });
    } catch (emailErr) {
      console.warn("[DodoCheckout] Welcome email warning:", emailErr);
    }

    const response = NextResponse.json({
      success: true,
      key: customer.key,
      email: customer.email,
      name: customer.name,
      company: customer.company,
      botId: customer.bot_id,
      sessionToken: customer.session_token,
    });

    response.cookies.set({
      name: "zr_session",
      value: customer.session_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    response.cookies.set({
      name: "zr_role",
      value: "customer",
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
}
