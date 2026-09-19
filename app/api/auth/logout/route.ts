import { NextRequest, NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { SESSION_COOKIE_NAME, ROLE_COOKIE_NAME, invalidateSessionCache } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

async function performLogout(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (sessionToken) {
      invalidateSessionCache(sessionToken);
      try {
        await initDb();
        const db = getDb();
        await db.execute({
          sql: "UPDATE customers SET session_token = NULL WHERE session_token = ?",
          args: [sessionToken],
        });
      } catch (dbErr) {
        console.warn("[Logout] DB update warning:", dbErr);
      }
    }
  } catch (err) {
    console.warn("[Logout] Error:", err);
  }

  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully.",
  });

  // Clear session cookie
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    maxAge: 0,
    path: "/",
  });

  // Clear role cookie
  response.cookies.set({
    name: ROLE_COOKIE_NAME,
    value: "",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    maxAge: 0,
    path: "/",
  });

  return response;
}

export async function POST(req: NextRequest) {
  return performLogout(req);
}

export async function GET(req: NextRequest) {
  await performLogout(req);
  const response = NextResponse.redirect(new URL("/login", req.url));

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    maxAge: 0,
    path: "/",
  });

  response.cookies.set({
    name: ROLE_COOKIE_NAME,
    value: "",
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    maxAge: 0,
    path: "/",
  });

  return response;
}
