"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  getRouteLoadingServerSnapshot,
  getRouteLoadingSnapshot,
  stopRouteLoading,
  subscribeRouteLoading,
} from "./routeLoading";

export default function RouteLoadingIndicator() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = useMemo(
    () => `${pathname}?${searchParams.toString()}`,
    [pathname, searchParams],
  );
  const routeLoading = useSyncExternalStore(
    subscribeRouteLoading,
    getRouteLoadingSnapshot,
    getRouteLoadingServerSnapshot,
  );

  useEffect(() => {
    stopRouteLoading();
  }, [routeKey]);

  if (!routeLoading.isLoading) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-70">
      <div className="h-1 w-full overflow-hidden bg-zinc-200 dark:bg-zinc-800">
        <div className="ct-route-loading-bar h-full w-1/3 animate-[route-loading_1.2s_ease-in-out_infinite]" />
      </div>
      <div className="ct-route-loading-pill mx-auto mt-3 flex w-fit items-center gap-3 rounded-full border px-4 py-2 text-sm shadow-sm backdrop-blur">
        <div className="ct-route-loading-spinner h-3 w-3 animate-spin rounded-full border" />
        <span>{routeLoading.label}</span>
      </div>
    </div>
  );
}
