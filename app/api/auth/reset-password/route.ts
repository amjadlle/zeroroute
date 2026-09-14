import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import {
  generateSalt,
  hashPassword,
  generateSessionToken,
} from "@/lib/auth/password";
import { isRateLimited, getClientIp } from "@/lib/auth/rate-limit";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (isRateLimited(`reset:${ip}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Too many verification attempts. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();
    const code = (body.code || "").trim();
    const newPassword = body.newPassword || "";

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: "Email, reset code, and new password are required." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      );
    }

    await initDb();
    const db = getDb();

    // Verify OTP
    const otpResult = await db.execute({
      sql: "SELECT * FROM auth_otps WHERE email = ? LIMIT 1",
      args: [email],
    });

    if (otpResult.rows.length === 0) {
      return NextResponse.json(
        { error: "No reset code found for this email. Please request a new one." },
        { status: 400 }
      );
    }

    const otp = otpResult.rows[0];
    const now = Date.now();

    if (now > Number(otp.expires_at)) {
      await db.execute({ sql: "DELETE FROM auth_otps WHERE email = ?", args: [email] });
      return NextResponse.json(
        { error: "Reset code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    if (otp.code !== code) {
      const attempts = Number(otp.attempts) + 1;
      if (attempts >= 5) {
        await db.execute({ sql: "DELETE FROM auth_otps WHERE email = ?", args: [email] });
        return NextResponse.json(
          { error: "Too many incorrect attempts. Code invalidated. Please request a new one." },
          { status: 400 }
        );
      }
      await db.execute({
        sql: "UPDATE auth_otps SET attempts = ? WHERE email = ?",
        args: [attempts, email],
      });
      return NextResponse.json({ error: "Invalid reset code." }, { status: 400 });
    }

    // Hash new password
    const salt = generateSalt();
    const passwordHash = hashPassword(newPassword, salt);
    const sessionToken = generateSessionToken();

    await db.execute({
      sql: `
        UPDATE customers 
        SET password_hash = ?, password_salt = ?, session_token = ?, updated_at = ?
        WHERE email = ?
      `,
      args: [passwordHash, salt, sessionToken, now, email],
    });

    // Clean up OTP
    await db.execute({ sql: "DELETE FROM auth_otps WHERE email = ?", args: [email] });

    const response = NextResponse.json({
      success: true,
      message: "Password reset successfully! You are now logged in.",
      token: sessionToken,
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { error: "Failed to reset password." },
      { status: 500 }
    );
  }
}
