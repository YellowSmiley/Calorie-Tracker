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
        <div className="h-full w-1/3 animate-[route-loading_1.2s_ease-in-out_infinite] bg-black dark:bg-white" />
      </div>
      <div className="mx-auto mt-3 flex w-fit items-center gap-3 rounded-full border border-zinc-300 bg-white/95 px-4 py-2 text-sm text-zinc-900 shadow-sm backdrop-blur dark:border-zinc-700 dark:bg-black/95 dark:text-zinc-100">
        <div className="h-3 w-3 animate-spin rounded-full border border-zinc-400 border-t-black dark:border-zinc-600 dark:border-t-white" />
        <span>{routeLoading.label}</span>
      </div>
    </div>
  );
}
