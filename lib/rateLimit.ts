import { RateLimiterMemory } from "rate-limiter-flexible";
import { NextResponse } from "next/server";

// Auth endpoints: 5 attempts per 60s, block for 5 minutes
const authLimiter = new RateLimiterMemory({
    points: 5,
    duration: 60,
    blockDuration: 300,
});

// Stricter limiter for registration: 3 attempts per 60s, block for 10 minutes
const registerLimiter = new RateLimiterMemory({
    points: 3,
    duration: 60,
    blockDuration: 600,
});

// Login limiter per email: 5 attempts per 60s, block for 15 minutes
const loginLimiter = new RateLimiterMemory({
    points: 5,
    duration: 60,
    blockDuration: 900,
});

function getClientIp(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    return "unknown";
}

function rateLimitedResponse() {
    return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
    );
}

export async function checkAuthRateLimit(request: Request): Promise<NextResponse | null> {
    const ip = getClientIp(request);
    try {
        await authLimiter.consume(ip);
        return null;
    } catch {
        return rateLimitedResponse();
    }
}

export async function checkRegisterRateLimit(request: Request): Promise<NextResponse | null> {
    const ip = getClientIp(request);
    try {
        await registerLimiter.consume(ip);
        return null;
    } catch {
        return rateLimitedResponse();
    }
}

/**
 * Check login rate limit by email. Returns true if allowed, false if blocked.
 */
export async function checkLoginRateLimit(email: string): Promise<boolean> {
    try {
        await loginLimiter.consume(email.toLowerCase());
        return true;
    } catch {
        return false;
    }
}
