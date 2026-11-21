import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDb, initDb } from "@/lib/db";
import { verifyPassword, generateSessionToken } from "@/lib/auth/password";
import { isRateLimited, getClientIp } from "@/lib/auth/rate-limit";
import { SESSION_COOKIE_NAME, ADMIN_EMAILS } from "@/lib/auth/session";
import { signAdminSession, ADMIN_SESSION_MAX_AGE } from "@/lib/auth/admin-session";

function safeEqual(a: string, b: string): boolean {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (isRateLimited(`login:${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const adminPassword = (process.env.ADMIN_PASSWORD || "").trim();
    const isAdminEmail = ADMIN_EMAILS.includes(email);

    // 1. Admin login: dedicated ADMIN_PASSWORD, session is a signed JWT (null if ADMIN_SESSION_SECRET is unset)
    const adminSessionToken = isAdminEmail && adminPassword && safeEqual(password, adminPassword)
      ? await signAdminSession()
      : null;
    if (adminSessionToken) {
      const response = NextResponse.json({
        success: true,
        message: "Admin authentication successful!",
        token: adminSessionToken,
        role: "admin",
        redirect: "/admin",
        customer: {
          id: "admin_master",
          email,
          name: "ZeroRoute Admin",
          company: "ZeroRoute Master",
          status: "active"
        }
      });

      response.cookies.set({
        name: SESSION_COOKIE_NAME,
        value: adminSessionToken,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: ADMIN_SESSION_MAX_AGE,
        path: "/",
      });

      return response;
    }

    await initDb();
    const db = getDb();

    const result = await db.execute({
      sql: "SELECT * FROM customers WHERE email = ? LIMIT 1",
      args: [email],
    });

    // One message for every failure, so the response never says which emails have accounts.
    // A missing account still runs one hash check to keep the timing similar.
    const customer = result.rows[0];
    const passwordHash = (customer?.password_hash as string) || "";
    const passwordSalt = (customer?.password_salt as string) || "";
    const isValid = verifyPassword(password, passwordHash || "0".repeat(128), passwordSalt || "0".repeat(32));
    if (!customer || !passwordHash || !passwordSalt || !isValid) {
      return NextResponse.json(
        { error: "Email or password is incorrect. Forgot it? Reset your password." },
        { status: 401 }
      );
    }

    // Customer accounts are always customers; admin comes only from the admin login above
    const sessionToken = generateSessionToken();
    const now = Date.now();

    await db.execute({
      sql: "UPDATE customers SET session_token = ?, updated_at = ? WHERE id = ?",
      args: [sessionToken, now, customer.id as string],
    });

    const targetRole = "customer";
    const targetRedirect = "/app";

    const response = NextResponse.json({
      success: true,
      message: "Logged in successfully!",
      token: sessionToken,
      role: targetRole,
      redirect: targetRedirect,
      customer: {
        id: customer.id,
        key: customer.key,
        email: customer.email,
        name: customer.name,
        company: customer.company,
        bot_id: customer.bot_id,
        status: customer.status,
        subscription_expires: customer.subscription_expires,
        monthly_requests: customer.monthly_requests,
        monthly_limit: customer.monthly_limit,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
