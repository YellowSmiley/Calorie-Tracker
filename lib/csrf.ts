import { NextResponse } from "next/server";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Validates that mutating requests originate from the same site by
 * checking the Origin header against AUTH_URL.
 * Returns a 403 response if the origin doesn't match, or null if valid.
 */
export function validateOrigin(request: Request): NextResponse | null {
    if (!MUTATING_METHODS.has(request.method)) {
        return null;
    }

    const origin = request.headers.get("origin");

    // Allow requests with no origin (e.g. same-origin fetch in some browsers, server-side calls)
    if (!origin) {
        return null;
    }

    const allowedUrl = process.env.AUTH_URL || "http://localhost:3000";

    try {
        const allowedOrigin = new URL(allowedUrl).origin;
        if (origin === allowedOrigin) {
            return null;
        }
    } catch {
        // If AUTH_URL is malformed, fall through to rejection
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
