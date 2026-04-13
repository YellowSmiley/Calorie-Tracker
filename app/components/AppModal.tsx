"use client";

import { useId } from "react";

interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  headerRight?: React.ReactNode;
  bodyClassName?: string;
  maxWidthClassName?: string;
  closeAriaLabel?: string;
  dataTestId?: string;
}

export default function AppModal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  headerRight,
  bodyClassName = "p-4",
  maxWidthClassName = "sm:max-w-md",
  closeAriaLabel = "Close modal",
  dataTestId,
}: AppModalProps) {
  const titleId = useId();

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-0 sm:p-4"
      onClick={onClose}
      aria-hidden="true"
      data-testid={dataTestId ? `${dataTestId}-overlay` : undefined}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`h-full w-full max-w-none rounded-none border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950 sm:h-auto ${maxWidthClassName} sm:rounded-lg`}
        onClick={(event) => event.stopPropagation()}
        data-testid={dataTestId}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex items-center gap-2 min-w-0">
              <h2
                id={titleId}
                className="truncate text-lg font-semibold text-black dark:text-zinc-50"
              >
                {title}
              </h2>
              {headerRight}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={closeAriaLabel}
              className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
              data-testid={
                dataTestId ? `${dataTestId}-close-button` : undefined
              }
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className={bodyClassName}>{children}</div>

          {footer && (
            <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
