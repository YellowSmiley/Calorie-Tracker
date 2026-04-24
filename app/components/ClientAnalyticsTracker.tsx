"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { trackEvent } from "./analyticsEvents";

export default function ClientAnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    const query = searchParams.toString();
    const trackedPath = query ? `${pathname}?${query}` : pathname;

    if (lastTrackedPathRef.current === trackedPath) {
      return;
    }

    lastTrackedPathRef.current = trackedPath;
    trackEvent("page_view", {
      path: pathname,
      fullPath: trackedPath,
    });
  }, [pathname, searchParams]);

  return null;
}
