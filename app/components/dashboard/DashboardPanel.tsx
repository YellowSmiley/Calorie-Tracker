"use client";

import { type ReactNode } from "react";
import HelpButton from "@/app/components/HelpButton";

interface DashboardPanelProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  helpTitle?: string;
  helpContent?: string;
  helpAriaLabel?: string;
  className?: string;
  contentClassName?: string;
}

export default function DashboardPanel({
  title,
  children,
  actions,
  helpTitle,
  helpContent,
  helpAriaLabel,
  className,
  contentClassName,
}: DashboardPanelProps) {
  return (
    <section
      className={[
        "rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-black sm:p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex flex-col gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
            {title}
          </h2>
          {helpTitle && helpContent && helpAriaLabel ? (
            <HelpButton
              title={helpTitle}
              content={helpContent}
              ariaLabel={helpAriaLabel}
            />
          ) : null}
        </div>

        {actions ? <div className="w-full sm:w-auto">{actions}</div> : null}
      </div>

      <div className={["pt-4", contentClassName].filter(Boolean).join(" ")}>
        {children}
      </div>
    </section>
  );
}
