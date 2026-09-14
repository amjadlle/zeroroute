import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (sessionToken) {
      await initDb();
      const db = getDb();
      await db.execute({
        sql: "UPDATE customers SET session_token = NULL WHERE session_token = ?",
        args: [sessionToken],
      });
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully.",
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    console.error("Logout error:", err);
    return NextResponse.json({ error: "Failed to log out." }, { status: 500 });
  }
}
