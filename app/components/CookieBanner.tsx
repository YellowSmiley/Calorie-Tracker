"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

function getConsentSnapshot() {
  return localStorage.getItem("cookie-consent");
}

function getConsentServerSnapshot() {
  return "acknowledged"; // Hide banner during SSR
}

function subscribeConsent(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export default function CookieBanner() {
  const consent = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getConsentServerSnapshot,
  );
  const [dismissed, setDismissed] = useState(false);

  const handleAcknowledge = () => {
    localStorage.setItem("cookie-consent", "acknowledged");
    setDismissed(true);
  };

  if (consent || dismissed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black p-5 shadow-lg">
      <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <p className="flex-1 text-sm text-zinc-600 dark:text-zinc-400">
          This site uses strictly necessary cookies to keep you signed in and
          protect your account. No tracking or advertising cookies are used. See
          our{" "}
          <Link
            href="/privacy"
            className="underline hover:no-underline text-black dark:text-zinc-50"
          >
            Privacy Policy
          </Link>{" "}
          for details.
        </p>
        <button
          onClick={handleAcknowledge}
          className="shrink-0 rounded-lg bg-foreground text-background px-5 py-2 text-sm font-medium transition-opacity hover:opacity-90"
          data-testid="cookie-banner-button"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
