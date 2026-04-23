const PREMIUM_ACTIVE_STATUSES = new Set(["active", "trialing", "past_due"]);

export function parseStripePeriodEndDate(
  currentPeriodEndUnix: number | null | undefined,
): Date | null {
  if (!currentPeriodEndUnix || !Number.isFinite(currentPeriodEndUnix)) {
    return null;
  }

  return new Date(currentPeriodEndUnix * 1000);
}

export function hasPremiumAccess(
  subscriptionStatus: string | null | undefined,
  currentPeriodEndUnix: number | null | undefined,
  nowMs = Date.now(),
): boolean {
  if (!subscriptionStatus || !PREMIUM_ACTIVE_STATUSES.has(subscriptionStatus)) {
    return false;
  }

  if (!currentPeriodEndUnix || !Number.isFinite(currentPeriodEndUnix)) {
    return subscriptionStatus === "active" || subscriptionStatus === "trialing";
  }

  return currentPeriodEndUnix * 1000 > nowMs;
}
