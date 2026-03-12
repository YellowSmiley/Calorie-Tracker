"use client";

import { useState } from "react";

interface TrendMeasurementsAccordionProps {
  title: string;
  summary?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function TrendMeasurementsAccordion({
  title,
  summary,
  children,
  defaultOpen = false,
}: TrendMeasurementsAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-black">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full flex-col gap-3 rounded-lg p-4 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div>
            <h3 className="text-base font-semibold text-black dark:text-zinc-50">
              {title}
            </h3>
            {summary ? (
              <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {summary}
              </div>
            ) : null}
          </div>
        </div>

        <svg
          className={`h-5 w-5 shrink-0 text-black transition-transform dark:text-zinc-50 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "mt-3 max-h-300 opacity-100" : "mt-0 max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          {children}
        </div>
      </div>
    </div>
  );
}
