"use client";

import { type ReactNode } from "react";
import Image from "next/image";
import HelpButton from "@/app/components/HelpButton";

interface AppHeaderProps {
  title: string;
  maxWidthClassName?: string;
  className?: string;
  helpTitle?: string;
  helpAriaLabel?: string;
  helpContent?: ReactNode;
  helpTestId?: string;
}

export default function AppHeader({
  title,
  maxWidthClassName = "max-w-3xl",
  className,
  helpTitle,
  helpAriaLabel,
  helpContent,
  helpTestId,
}: AppHeaderProps) {
  return (
    <header
      className={[
        "ct-app-header border-b border-zinc-200 p-4 dark:border-zinc-800",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={["mx-auto", maxWidthClassName].join(" ")}>
        <div className="flex items-center gap-3">
          <div className="ct-app-icon-shell flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 shadow-sm dark:border-white/15">
            <Image
              src="/icon-192.png"
              alt=""
              aria-hidden="true"
              width={32}
              height={32}
              priority
              className="rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
              {title}
            </h1>
            {helpTitle && helpAriaLabel && helpContent ? (
              <HelpButton
                title={helpTitle}
                ariaLabel={helpAriaLabel}
                data-testid={helpTestId}
              >
                {helpContent}
              </HelpButton>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
