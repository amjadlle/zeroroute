import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminSession } from "@/lib/auth/admin-session";

// Old links carried the API key in the URL. A key never signs a page in; it is stripped instead.
const URL_SECRET_PARAMS = ["key", "token", "email"];

export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const sessionToken = request.cookies.get("zr_session")?.value;

  if ((pathname.startsWith("/app") || pathname.startsWith("/onboarding")) && URL_SECRET_PARAMS.some((p) => searchParams.has(p))) {
    const clean = request.nextUrl.clone();
    URL_SECRET_PARAMS.forEach((p) => clean.searchParams.delete(p));
    return NextResponse.redirect(clean);
  }

  const isAdmin = await verifyAdminSession(sessionToken);

  const isAuthenticated = Boolean(sessionToken);

  // 1. Protect /admin route - strictly accessible by Admin only
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated || !isAdmin) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", "/admin");
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Protect /app dashboard route - accessible by authenticated customers or admin
  if (pathname.startsWith("/app")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
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
    "/((?!api|_next/static|_next/image|favicon.ico|icon.png|logo.png|apple-touch-icon.png|widget.js).*)",
  ],
};
