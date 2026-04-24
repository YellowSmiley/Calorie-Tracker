"use client";

import { track } from "@vercel/analytics";

type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

export function trackEvent(name: string, properties: AnalyticsProperties = {}) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    track(name, properties);
  } catch {
    // Avoid blocking user interactions if analytics is unavailable.
  }
}
