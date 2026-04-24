"use client";

type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

declare global {
  interface Window {
    va?: {
      track: (name: string, properties?: AnalyticsProperties) => void;
    };
  }
}

export function trackEvent(name: string, properties: AnalyticsProperties = {}) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.va?.track(name, properties);
  } catch {
    // Avoid blocking user interactions if analytics is unavailable.
  }
}
