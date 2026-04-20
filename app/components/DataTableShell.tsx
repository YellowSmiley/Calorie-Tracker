"use client";

import { ReactNode, RefObject, UIEventHandler } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface DataTableShellProps {
  scrollRef: RefObject<HTMLDivElement | null>;
  onScroll: UIEventHandler<HTMLDivElement>;
  containerClassName?: string;
  listClassName?: string;
  isLoading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
  emptyNode?: ReactNode;
  footerNode?: ReactNode;
}

export default function DataTableShell({
  scrollRef,
  onScroll,
  containerClassName = "flex-1 overflow-y-auto",
  listClassName = "divide-y divide-zinc-200 dark:divide-zinc-800",
  isLoading = false,
  loadingLabel = "Loading",
  children,
  emptyNode,
  footerNode,
}: DataTableShellProps) {
  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className={`${containerClassName} min-h-0`}
      aria-busy={isLoading}
      aria-live="polite"
    >
      <div className={listClassName}>
        {children}
        {isLoading && (
          <div
            className="px-4 py-4 flex items-center justify-center"
            role="status"
            aria-label={loadingLabel}
          >
            <LoadingSpinner className="h-5 w-5 text-zinc-700 dark:text-zinc-200" />
            <span className="sr-only">{loadingLabel}</span>
          </div>
        )}
        {emptyNode}
        {footerNode}
      </div>
    </div>
  );
}
