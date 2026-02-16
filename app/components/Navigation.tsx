"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="mx-auto flex max-w-3xl gap-4 px-4 py-4 sm:px-16">
        <Link
          className={`flex h-12 flex-1 items-center justify-center rounded-lg px-5 text-base font-medium transition-colors ${
            pathname === "/"
              ? "bg-foreground text-background"
              : "border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          }`}
          href="/"
          data-testid="nav-dashboard"
        >
          Dashboard
        </Link>
        <Link
          className={`flex h-12 flex-1 items-center justify-center rounded-lg px-5 text-base font-medium transition-colors ${
            pathname === "/diary"
              ? "bg-foreground text-background"
              : "border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          }`}
          href="/diary"
          data-testid="nav-diary"
        >
          Diary
        </Link>
        <Link
          className={`flex h-12 flex-1 items-center justify-center rounded-lg px-5 text-base font-medium transition-colors ${
            pathname === "/settings"
              ? "bg-foreground text-background"
              : "border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          }`}
          href="/settings"
          data-testid="nav-settings"
        >
          Settings
        </Link>
      </div>
    </nav>
  );
}
