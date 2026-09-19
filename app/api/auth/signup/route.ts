import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import {
  generateSalt,
  hashPassword,
  generateApiKey,
  generateSessionToken,
  generateBotId,
} from "@/lib/auth/password";
import { isRateLimited, getClientIp } from "@/lib/auth/rate-limit";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (isRateLimited(`signup:${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const name = (body.name || "").trim();
    const company = (body.company || "").trim();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    await initDb();
    const db = getDb();

    // Check if email already exists
    const existing = await db.execute({
      sql: "SELECT id FROM customers WHERE email = ? LIMIT 1",
      args: [email],
    });

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in." },
        { status: 409 }
      );
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);
    const id = `cust_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const apiKey = generateApiKey();
    const botId = generateBotId();
    const sessionToken = generateSessionToken();
    const now = Date.now();
    // Free Forever tier: 500 requests/month, perpetual access
    const nextMonth = now + 30 * 24 * 60 * 60 * 1000;
    const freePlanExpires = now + 3650 * 24 * 60 * 60 * 1000; // 10 years (perpetual free tier)

    await db.execute({
      sql: `
        INSERT INTO customers (
          id, key, email, password_hash, password_salt, name, company,
          bot_title, bot_role, tone, greeting, prompts,
          status, subscription_expires, monthly_requests, monthly_limit,
          period_start, period_end, bot_id, session_token,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          'ZeroRoute AI', 'AI Assistant', 'helpful and concise', 'Hi there! How can I help you today?', '[]',
          'active', ?, 0, 500,
          ?, ?, ?, ?,
          ?, ?
        )
      `,
      args: [
        id,
        apiKey,
        email,
        passwordHash,
        salt,
        name || email.split("@")[0],
        company || null,
        freePlanExpires,
        now,
        nextMonth,
        botId,
        sessionToken,
        now,
        now,
      ],
    });

    // Dispatch transactional welcome email
    try {
      const { sendWelcomeCredentialsEmail } = await import("@/lib/email");
      await sendWelcomeCredentialsEmail({
        email,
        name: name || email.split("@")[0],
        key: apiKey,
        botId,
      });
    } catch (emailErr) {
      console.warn("[Signup] Welcome credentials email error:", emailErr);
    }

    const response = NextResponse.json({
      success: true,
      message: "Account created successfully!",
      token: sessionToken,
      customer: {
        id,
        key: apiKey,
        email,
        name: name || email.split("@")[0],
        company,
        bot_id: botId,
        status: "active",
        subscription_expires: freePlanExpires,
      },
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    // Set client role cookie
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
  } catch (err: unknown) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
