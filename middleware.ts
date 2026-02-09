import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow auth API routes and static files
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico")
  ) {
    return NextResponse.next();
  }

  // Check if user is authenticated via cookie (JWT or database session)
  const sessionToken =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token") ||
    request.cookies.get("authjs.jwt-token") ||
    request.cookies.get("__Secure-authjs.jwt-token");

  const isLoginPage = pathname === "/login";
  const isRegisterPage = pathname === "/register";
  const isVerifyPage = pathname === "/verify";
  const isPublicPage = isLoginPage || isRegisterPage || isVerifyPage;

  if (!sessionToken && !isPublicPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (sessionToken && isPublicPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
