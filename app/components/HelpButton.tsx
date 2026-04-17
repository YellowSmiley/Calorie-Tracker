"use client";

import { ReactNode, useState } from "react";
import AppModal from "./AppModal";

interface HelpButtonProps {
  /** Modal title */
  title?: string;
  /** Optional label for screen readers */
  ariaLabel?: string;
  "data-testid"?: string; // Allow passing data-testid for testing purposes
  children: ReactNode;
}

export default function HelpButton({
  title = "Help",
  ariaLabel = "Help information",
  "data-testid": dataTestId,
  children,
}: HelpButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        aria-label={ariaLabel}
        className="ct-link-accent inline text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-zinc-500 dark:focus:ring-offset-zinc-950"
        type="button"
        data-testid={dataTestId}
      >
        Help
      </button>

      <AppModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={title}
        closeAriaLabel="Close help"
        dataTestId={dataTestId}
        bodyClassName="p-4 overflow-y-auto max-h-[calc(100vh-8.5rem)] sm:max-h-[60vh]"
        footer={
          <button
            onClick={() => setShowModal(false)}
            className="w-full rounded-lg bg-foreground px-4 py-2 font-medium text-background transition-opacity hover:opacity-90"
            data-testid={dataTestId ? `${dataTestId}-footer-button` : undefined}
          >
            Got it
          </button>
        }
      >
        <div className="space-y-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {children}
        </div>
      </AppModal>
    </>
  );
}
