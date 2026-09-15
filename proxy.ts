import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const sessionToken = request.cookies.get("zr_session")?.value;
  const roleCookie = request.cookies.get("zr_role")?.value;
  const queryKey = searchParams.get("key") || searchParams.get("token");

  const isAdmin = Boolean(
    (sessionToken && sessionToken.startsWith("zr_admin_")) ||
    (queryKey && (queryKey.startsWith("zr_admin_") || (Boolean(process.env.ADMIN_KEY) && queryKey === process.env.ADMIN_KEY)))
  );

  const isAuthenticated = Boolean(sessionToken || queryKey);

  // 1. Protect /admin route - only accessible by Admin
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated || !isAdmin) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Protect /app dashboard route - accessible by authenticated customers or admin
  if (pathname.startsWith("/app")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 3. If already logged in, redirect /login to dashboard
  if (pathname === "/login" && sessionToken) {
    const targetPath = isAdmin ? "/admin" : "/app";
    const targetUrl = new URL(targetPath, request.url);
    return NextResponse.redirect(targetUrl);
  }

  return NextResponse.next();
}

export default proxy;

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|logo.png|widget.js).*)",
  ],
};
