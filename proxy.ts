import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRuntimeEnv } from "@/lib/runtimeEnv";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const runtimeEnv = getRuntimeEnv();

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  return response;
}

function checkCsrf(request: NextRequest): NextResponse | null {
  if (!MUTATING_METHODS.has(request.method)) {
    return null;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Allow requests with no origin (same-origin navigation, server-side)
  if (!origin) {
    return null;
  }

  // Always allow same-origin mutations for the current request host.
  // This supports local LAN testing (e.g., phone on 192.168.x.x) while
  // preserving strict cross-origin blocking.
  if (origin === request.nextUrl.origin) {
    return null;
  }

  // Some Android WebView/Capacitor flows submit with Origin: null.
  // Accept only if Referer proves it came from the same app origin.
  if (origin === "null" && referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (refererOrigin === request.nextUrl.origin) {
        return null;
      }
    } catch {
      // invalid referer URL
    }
  }

  // Capacitor WebView can send origin as capacitor://localhost while the app
  // is actually served from http(s)://<host>. Allow only when referer confirms
  // the same origin as the current request.
  if (origin === "capacitor://localhost" && referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (refererOrigin === request.nextUrl.origin) {
        return null;
      }
    } catch {
      // invalid referer URL
    }
  }

  const allowedUrl = runtimeEnv.AUTH_URL;
  const allowedOrigin = new URL(allowedUrl).origin;
  if (origin === allowedOrigin) {
    return null;
  }

  // Also allow localhost during development
  if (process.env.NODE_ENV === "development") {
    try {
      const parsed = new URL(origin);
      if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
        return null;
      }
    } catch {
      // invalid origin URL
    }
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isStaticAsset = /\.[a-zA-Z0-9]+$/.test(pathname);
  const isPwaAsset =
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname.startsWith("/icon-");

  // Allow static and PWA assets through without auth redirects.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    isStaticAsset ||
    isPwaAsset
  ) {
    return withSecurityHeaders(NextResponse.next());
  }

  // CSRF check on all API mutations (including /api/auth for NextAuth form POSTs)
  if (pathname.startsWith("/api/")) {
    const csrfError = checkCsrf(request);
    if (csrfError) return withSecurityHeaders(csrfError);
  }

  // Allow auth API routes through (after CSRF check)
  if (pathname.startsWith("/api/auth")) {
    return withSecurityHeaders(NextResponse.next());
  }

  // Fast-path cookie check for page redirects only.
  // This does NOT validate cookie contents — all API routes independently
  // call auth() which cryptographically verifies the JWT/session.
  const sessionToken =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token") ||
    request.cookies.get("authjs.jwt-token") ||
    request.cookies.get("__Secure-authjs.jwt-token");

  const isLoginPage = pathname === "/login";
  const isRegisterPage = pathname === "/register";
  const isVerifyPage = pathname === "/verify";
  const isResetPasswordPage = pathname === "/reset-password";
  const isPrivacyPage = pathname === "/privacy";
  const isTermsPage = pathname === "/terms";
  const isAuthPage =
    isLoginPage || isRegisterPage || isVerifyPage || isResetPasswordPage;
  const isPublicPage = isAuthPage || isPrivacyPage || isTermsPage;

  if (!sessionToken && !isPublicPage) {
    return withSecurityHeaders(
      NextResponse.redirect(new URL("/login", request.url)),
    );
  }

  if (sessionToken && isAuthPage) {
    return withSecurityHeaders(
      NextResponse.redirect(new URL("/", request.url)),
    );
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
