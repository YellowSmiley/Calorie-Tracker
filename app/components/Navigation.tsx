"use client";

import { usePathname } from "next/navigation";
import PendingLink from "./PendingLink";

export default function Navigation() {
  const pathname = usePathname();
  const hiddenRoutes = new Set([
    "/login",
    "/register",
    "/reset-password",
    "/verify",
  ]);

  if (hiddenRoutes.has(pathname)) {
    return null;
  }

  return (
    <nav className="ct-nav-shell fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="mx-auto flex max-w-3xl gap-4 px-4 py-4 sm:px-16">
        <PendingLink
          className={`flex h-12 flex-1 items-center justify-center rounded-lg px-5 text-base font-medium transition-colors ${
            pathname === "/"
              ? "ct-nav-active"
              : "ct-nav-link border border-solid border-black/8 dark:border-white/[.145]"
          }`}
          href="/"
          pendingLabel="Loading dashboard..."
          data-testid="nav-dashboard"
        >
          Dashboard
        </PendingLink>
        <PendingLink
          className={`flex h-12 flex-1 items-center justify-center rounded-lg px-5 text-base font-medium transition-colors ${
            pathname === "/diary"
              ? "ct-nav-active"
              : "ct-nav-link border border-solid border-black/8 dark:border-white/[.145]"
          }`}
          href="/diary"
          pendingLabel="Loading diary..."
          data-testid="nav-diary"
        >
          Diary
        </PendingLink>
        <PendingLink
          className={`flex h-12 flex-1 items-center justify-center rounded-lg px-5 text-base font-medium transition-colors ${
            pathname === "/settings"
              ? "ct-nav-active"
              : "ct-nav-link border border-solid border-black/8 dark:border-white/[.145]"
          }`}
          href="/settings"
          pendingLabel="Loading settings..."
          data-testid="nav-settings"
        >
          Settings
        </PendingLink>
      </div>
    </nav>
  );
}
