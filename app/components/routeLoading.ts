export const ROUTE_LOADING_EVENT = "app:route-loading";

type RouteLoadingSnapshot = {
  isLoading: boolean;
  href: string | null;
  label: string;
};

let snapshot: RouteLoadingSnapshot = {
  isLoading: false,
  href: null,
  label: "Loading page...",
};

const serverSnapshot: RouteLoadingSnapshot = {
  isLoading: false,
  href: null,
  label: "Loading page...",
};

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeRouteLoading(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getRouteLoadingSnapshot() {
  return snapshot;
}

export function getRouteLoadingServerSnapshot(): RouteLoadingSnapshot {
  return serverSnapshot;
}

export function startRouteLoading(
  label = "Loading page...",
  href: string | null = null,
) {
  snapshot = {
    isLoading: true,
    href,
    label,
  };
  emitChange();

  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(ROUTE_LOADING_EVENT, {
      detail: { label, href },
    }),
  );
}

export function stopRouteLoading() {
  snapshot = {
    isLoading: false,
    href: null,
    label: "Loading page...",
  };
  emitChange();
}
