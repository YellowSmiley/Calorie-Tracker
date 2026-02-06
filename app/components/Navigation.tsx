"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <div className="mx-auto flex max-w-3xl gap-4 px-4 py-4 sm:px-16">
        <Link
          className={`flex h-12 flex-1 items-center justify-center rounded-full px-5 text-base font-medium transition-colors ${
            pathname === "/"
              ? "bg-foreground text-background"
              : "border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          }`}
          href="/"
        >
          Dashboard
        </Link>
        <Link
          className={`flex h-12 flex-1 items-center justify-center rounded-full px-5 text-base font-medium transition-colors ${
            pathname === "/diary"
              ? "bg-foreground text-background"
              : "border border-solid border-black/8 hover:border-transparent hover:bg-black/4 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          }`}
          href="/diary"
        >
          Diary
        </Link>
      </div>
    </nav>
  );
}
