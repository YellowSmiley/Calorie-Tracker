import Redis from "ioredis";
import {
  RateLimiterMemory,
  RateLimiterRedis,
  type IRateLimiterOptions,
} from "rate-limiter-flexible";
import { NextResponse } from "next/server";

type Limiter = {
  consume: (key: string) => Promise<unknown>;
};

let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    });

    redisClient.on("error", (error) => {
      if (process.env.NODE_ENV === "development") {
        console.error("Redis rate-limit client error:", error);
      }
    });
  }

  return redisClient;
}

function createLimiter(
  keyPrefix: string,
  options: Pick<IRateLimiterOptions, "points" | "duration" | "blockDuration">,
): Limiter {
  const memoryLimiter = new RateLimiterMemory(options);
  const client = getRedisClient();

  if (!client) {
    return memoryLimiter;
  }

  return new RateLimiterRedis({
    storeClient: client,
    keyPrefix,
    insuranceLimiter: memoryLimiter,
    ...options,
  });
}

// Auth endpoints: 5 attempts per 60s, block for 5 minutes
const authLimiter = createLimiter("rl:auth", {
  points: 5,
  duration: 60,
  blockDuration: 300,
});

// Stricter limiter for registration: 3 attempts per 60s, block for 10 minutes
const registerLimiter = createLimiter("rl:register", {
  points: 3,
  duration: 60,
  blockDuration: 600,
});

// Login limiter per email: relaxed in dev/test, strict in production
const isDev = process.env.NODE_ENV !== "production";
const loginLimiter = createLimiter("rl:login-email", {
  points: isDev ? 30 : 5, // 30 attempts per 60s in dev/test, 5 in prod
  duration: 60,
  blockDuration: isDev ? 120 : 900, // 2 min block in dev/test, 15 min in prod
});

// Write-heavy endpoints
const mealWriteLimiter = createLimiter("rl:meal-write", {
  points: 120,
  duration: 60,
  blockDuration: 0,
});

const reportLimiter = createLimiter("rl:food-report", {
  points: 10,
  duration: 60,
  blockDuration: 0,
});

const mealFavoritesWriteLimiter = createLimiter("rl:meal-favorites-write", {
  points: 60,
  duration: 60,
  blockDuration: 0,
});

const foodWriteLimiter = createLimiter("rl:food-write", {
  points: 60,
  duration: 60,
  blockDuration: 0,
});

const profileWriteLimiter = createLimiter("rl:profile-write", {
  points: 30,
  duration: 60,
  blockDuration: 0,
});

const accountDeleteLimiter = createLimiter("rl:account-delete", {
  points: 3,
  duration: 3600,
  blockDuration: 3600,
});

const adminWriteLimiter = createLimiter("rl:admin-write", {
  points: 120,
  duration: 60,
  blockDuration: 0,
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

export async function checkAuthRateLimit(
  request: Request,
): Promise<NextResponse | null> {
  const ip = getClientIp(request);
  try {
    await authLimiter.consume(ip);
    return null;
  } catch {
    return rateLimitedResponse();
  }
}

export async function checkRegisterRateLimit(
  request: Request,
): Promise<NextResponse | null> {
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

/**
 * Check meal write rate limit by user id. Returns true if allowed, false if blocked.
 */
export async function checkMealWriteRateLimit(
  userId: string,
): Promise<boolean> {
  try {
    await mealWriteLimiter.consume(userId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check food report rate limit by user id. Returns true if allowed, false if blocked.
 */
export async function checkFoodReportRateLimit(
  userId: string,
): Promise<boolean> {
  try {
    await reportLimiter.consume(userId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check meal favorites write rate limit by user id. Returns true if allowed, false if blocked.
 */
export async function checkMealFavoritesWriteRateLimit(
  userId: string,
): Promise<boolean> {
  try {
    await mealFavoritesWriteLimiter.consume(userId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check food write rate limit by user id. Returns true if allowed, false if blocked.
 */
export async function checkFoodWriteRateLimit(
  userId: string,
): Promise<boolean> {
  try {
    await foodWriteLimiter.consume(userId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check profile write rate limit by user id. Returns true if allowed, false if blocked.
 */
export async function checkProfileWriteRateLimit(
  userId: string,
): Promise<boolean> {
  try {
    await profileWriteLimiter.consume(userId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check account delete rate limit by user id. Returns true if allowed, false if blocked.
 */
export async function checkAccountDeleteRateLimit(
  userId: string,
): Promise<boolean> {
  try {
    await accountDeleteLimiter.consume(userId);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check admin write rate limit by user id. Returns true if allowed, false if blocked.
 */
export async function checkAdminWriteRateLimit(
  userId: string,
): Promise<boolean> {
  try {
    await adminWriteLimiter.consume(userId);
    return true;
  } catch {
    return false;
  }
}
