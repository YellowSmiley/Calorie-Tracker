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

function getClientIp(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) {
        return forwarded.split(",")[0].trim();
    }
    return "unknown";
}

const RATE_LIMITED_RESPONSE = NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429 },
);

export async function checkAuthRateLimit(request: Request): Promise<NextResponse | null> {
    const ip = getClientIp(request);
    try {
        await authLimiter.consume(ip);
        return null;
    } catch {
        return RATE_LIMITED_RESPONSE;
    }
}

export async function checkRegisterRateLimit(request: Request): Promise<NextResponse | null> {
    const ip = getClientIp(request);
    try {
        await registerLimiter.consume(ip);
        return null;
    } catch {
        return RATE_LIMITED_RESPONSE;
    }
}
