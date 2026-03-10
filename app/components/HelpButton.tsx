"use client";

import { useState } from "react";

interface HelpButtonProps {
  /** Modal content text or React node */
  content: string | React.ReactNode;
  /** Modal title */
  title?: string;
  /** Optional label for screen readers */
  ariaLabel?: string;
  "data-testid"?: string; // Allow passing data-testid for testing purposes
}

export default function HelpButton({
  content,
  title = "Help",
  ariaLabel = "Help information",
  "data-testid": dataTestId,
}: HelpButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        aria-label={ariaLabel}
        aria-describedby={showModal ? "help-dialog" : undefined}
        className="inline text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-offset-zinc-950"
        type="button"
        data-testid={dataTestId}
      >
        Help
      </button>

      {/* Modal Dialog */}
      {showModal && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity dark:bg-opacity-60"
            onClick={() => setShowModal(false)}
            aria-hidden="true"
            data-testid={dataTestId ? `${dataTestId}-overlay` : undefined}
          />

          {/* Modal */}
          <div
            id="help-dialog"
            className="fixed inset-4 z-50 m-auto h-fit max-h-[80vh] w-full max-w-md rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-black"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-dialog-title"
            data-testid={dataTestId ? `${dataTestId}-modal` : undefined}
          >
            <div className="flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
                <h2
                  id="help-dialog-title"
                  className="text-lg font-semibold text-black dark:text-zinc-50"
                >
                  {title}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  aria-label="Close help"
                  className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                  data-testid={
                    dataTestId ? `${dataTestId}-close-button` : undefined
                  }
                >
                  <svg
                    className="w-5 h-5"
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

              {/* Content */}
              <div className="overflow-y-auto p-4">
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {content}
                </p>
              </div>

              {/* Footer */}
              <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full rounded-lg bg-zinc-100 px-4 py-2 font-medium text-black hover:bg-zinc-200 transition-colors dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
                  data-testid={
                    dataTestId ? `${dataTestId}-footer-button` : undefined
                  }
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
