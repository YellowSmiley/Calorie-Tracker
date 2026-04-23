/**
 * Centralized cache tag constants for Next.js Data Cache revalidation.
 * Use these tags with revalidateTag() to invalidate caches after mutations.
 *
 * Convention:
 * - User-scoped: `{resource}:{userId}`
 * - Global: `{resource}`
 */

export const CACHE_TAGS = {
  // User-scoped resources
  userSettings: (userId: string) => `settings:${userId}`,
  userMeals: (userId: string, date: string) => `meals:${userId}:${date}`,
  userBodyWeight: (userId: string) => `bodyWeight:${userId}`,
  userMealFavorites: (userId: string) => `mealFavorites:${userId}`,

  // Global resources
  foods: "foods",
  adminUsers: "adminUsers",
};

// Keep caching strict in production but lax during local development.
export const IS_PRODUCTION_CACHE = process.env.NODE_ENV === "production";

/**
 * Cache durations (in seconds) per resource type.
 * Shorter TTL for frequently-changed resources, longer for stable data.
 */
export const CACHE_DURATIONS = {
  // User-scoped (1–5 min)
  userSettings: IS_PRODUCTION_CACHE ? 300 : 0, // 5 min in prod, disabled in dev
  userMeals: IS_PRODUCTION_CACHE ? 180 : 0, // 3 min in prod, disabled in dev
  userBodyWeight: IS_PRODUCTION_CACHE ? 600 : 0, // 10 min in prod, disabled in dev
  userMealFavorites: IS_PRODUCTION_CACHE ? 600 : 0, // 10 min in prod, disabled in dev

  // Aggregated / user-derived (2–5 min)
  dashboard: IS_PRODUCTION_CACHE ? 300 : 0, // 5 min in prod, disabled in dev

  // Global (10–30 min)
  foods: IS_PRODUCTION_CACHE ? 1200 : 0, // 20 min in prod, disabled in dev
  adminUsers: IS_PRODUCTION_CACHE ? 1800 : 0, // 30 min in prod, disabled in dev
};

export function getUnstableCacheRevalidate(
  maxAgeSeconds: number,
): number | false {
  if (!IS_PRODUCTION_CACHE || maxAgeSeconds <= 0) {
    return false;
  }

  return maxAgeSeconds;
}

export function getCacheControlHeader(maxAgeSeconds: number): string {
  if (!IS_PRODUCTION_CACHE || maxAgeSeconds <= 0) {
    return "no-store, no-cache, must-revalidate, max-age=0";
  }

  return `private, max-age=${maxAgeSeconds}`;
}
