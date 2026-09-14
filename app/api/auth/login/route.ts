import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getDb, initDb } from "@/lib/db";
import { verifyPassword, generateSessionToken } from "@/lib/auth/password";
import { isRateLimited, getClientIp } from "@/lib/auth/rate-limit";
import { SESSION_COOKIE_NAME, ROLE_COOKIE_NAME, ADMIN_EMAILS } from "@/lib/auth/session";

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

    const adminPassword = process.env.ADMIN_PASSWORD || process.env.ADMIN_KEY || process.env.ROUTER_API_KEY || "admin1234";
    const isAdminEmail = ADMIN_EMAILS.includes(email);

    // 1. Direct Admin Master Key / Password Check
    if (isAdminEmail && (password === adminPassword || password === process.env.ADMIN_KEY || password === process.env.ROUTER_API_KEY)) {
      const adminSessionToken = `zr_admin_${crypto.randomBytes(24).toString("hex")}`;
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
        maxAge: 30 * 24 * 60 * 60,
        path: "/",
      });

      response.cookies.set({
        name: ROLE_COOKIE_NAME,
        value: "admin",
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60,
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

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "No account found with this email address." },
        { status: 401 }
      );
    }

    const customer = result.rows[0];
    const passwordHash = customer.password_hash as string;
    const passwordSalt = customer.password_salt as string;

    if (!passwordHash || !passwordSalt) {
      return NextResponse.json(
        { error: "This account has no password set. Please use password reset or magic OTP." },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, passwordHash, passwordSalt);
    if (!isValid) {
      return NextResponse.json(
        { error: "Incorrect password. Please try again." },
        { status: 401 }
      );
    }

    // Determine role (customer or admin if registered with admin email)
    const isUserAdmin = ADMIN_EMAILS.includes(email);
    const sessionToken = isUserAdmin ? `zr_admin_${crypto.randomBytes(24).toString("hex")}` : generateSessionToken();
    const now = Date.now();

    await db.execute({
      sql: "UPDATE customers SET session_token = ?, updated_at = ? WHERE id = ?",
      args: [sessionToken, now, customer.id as string],
    });

    const targetRole = isUserAdmin ? "admin" : "customer";
    const targetRedirect = isUserAdmin ? "/admin" : "/app";

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

    response.cookies.set({
      name: ROLE_COOKIE_NAME,
      value: targetRole,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
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
