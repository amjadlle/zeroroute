import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { generateOtp } from "@/lib/auth/password";
import { isRateLimited, getClientIp } from "@/lib/auth/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (isRateLimited(`forgot:${ip}`, 5, 60_000)) {
    return NextResponse.json(
      { error: "Too many reset attempts. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const email = (body.email || "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    await initDb();
    const db = getDb();

    // Check if account exists
    const result = await db.execute({
      sql: "SELECT id FROM customers WHERE email = ? LIMIT 1",
      args: [email],
    });

    if (result.rows.length === 0) {
      // Don't leak account existence to attackers, return success message
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a reset code has been sent.",
      });
    }

    const otp = generateOtp();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    await db.execute({
      sql: `
        INSERT INTO auth_otps (email, code, expires_at, attempts)
        VALUES (?, ?, ?, 0)
        ON CONFLICT(email) DO UPDATE SET
          code = excluded.code,
          expires_at = excluded.expires_at,
          attempts = 0
      `,
      args: [email, otp, expiresAt],
    });

    // Send transactional OTP email
    const { sendPasswordResetOtpEmail } = await import("@/lib/email");
    await sendPasswordResetOtpEmail({ email, otp });

    return NextResponse.json({
      success: true,
      message: "Password reset code sent to your email.",
      // Include debug OTP in development mode for easy testing
      debugOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
    });
  } catch (err: unknown) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { error: "Failed to process password reset request." },
      { status: 500 }
    );
  }
}
