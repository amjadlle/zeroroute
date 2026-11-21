import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { generateSessionToken } from "@/lib/auth/password";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id") || url.searchParams.get("id");
  const subscriptionId = url.searchParams.get("subscription_id");
  const paymentId = url.searchParams.get("payment_id");

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
  let isPaymentSuccessful = false;

  // 1. Strictly verify payment status with Dodo Payments API
  try {
    if (subscriptionId) {
      const subRes = await fetch(`${dodoApiBase}/subscriptions/${encodeURIComponent(subscriptionId)}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (subRes.ok) {
        const subData = await subRes.json();
        if (subData.customer?.email) customerEmail = subData.customer.email.toLowerCase();
        if (subData.status === "active" || subData.status === "on_trial") {
          isPaymentSuccessful = true;
        }
      }
    } else if (sessionId) {
      const dodoRes = await fetch(`${dodoApiBase}/checkouts/${encodeURIComponent(sessionId)}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (dodoRes.ok) {
        const sessionData = await dodoRes.json();
        if (sessionData.customer?.email) customerEmail = sessionData.customer.email.toLowerCase();
        const status = sessionData.payment_status || sessionData.status;
        if (status === "succeeded" || status === "paid" || status === "complete" || status === "active") {
          isPaymentSuccessful = true;
        }
      }
    } else if (paymentId) {
      const payRes = await fetch(`${dodoApiBase}/payments/${encodeURIComponent(paymentId)}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (payRes.ok) {
        const payData = await payRes.json();
        if (payData.customer?.email) customerEmail = payData.customer.email.toLowerCase();
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
  const customer = existingRes.rows[0];

  // Entitlements come only from the signed webhook. Until it has created the
  // account, report the payment as pending without consuming the id.
  if (!customer) {
    return NextResponse.json({ success: false, paid: true, pending: true }, { status: 202 });
  }

  // One-time claim: every presented id is recorded; any id seen before means
  // this is a repeat lookup, which only gets the payment status back.
  // Ceiling: ids of the same purchase that were never presented (e.g. a linked
  // payment_id when only subscription_id was used) remain claimable once.
  const now = Date.now();
  let firstClaim = true;
  for (const id of [subscriptionId, sessionId, paymentId].filter(Boolean)) {
    const res = await db.execute({
      sql: `INSERT OR IGNORE INTO checkout_claims (id, email, claimed_at) VALUES (?, ?, ?)`,
      args: [id, customerEmail, now],
    });
    if (!res.rowsAffected) firstClaim = false;
  }
  if (!firstClaim) {
    return NextResponse.json({ success: false, paid: true, claimed: true });
  }

  const sessionToken = generateSessionToken();
  await db.execute({
    sql: `UPDATE customers SET session_token = ?, updated_at = ? WHERE id = ?`,
    args: [sessionToken, now, customer.id],
  });

  const response = NextResponse.json({
    success: true,
    key: customer.key,
    email: customer.email,
    name: customer.name,
    company: customer.company,
    botId: customer.bot_id,
    sessionToken,
  });

  response.cookies.set({
    name: "zr_session",
    value: sessionToken,
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
