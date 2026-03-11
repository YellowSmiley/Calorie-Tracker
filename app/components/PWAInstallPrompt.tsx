"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/**
 * PWA Install Prompt Component
 *
 * Optional: Add this to your layout or any page to show an install button.
 * Users can install the PWA directly from the browser, but this provides
 * a more prominent call-to-action.
 *
 * Usage in layout.tsx or page.tsx:
 * import PWAInstallPrompt from "./components/PWAInstallPrompt";
 *
 * Then add: <PWAInstallPrompt />
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showManualInstallHint, setShowManualInstallHint] = useState(false);

  useEffect(() => {
    const DISMISS_KEY = "pwa-install-dismissed-until";

    // Respect a temporary dismissal window instead of hiding forever.
    const dismissedUntilRaw = localStorage.getItem(DISMISS_KEY);
    const dismissedUntil = dismissedUntilRaw ? Number(dismissedUntilRaw) : 0;
    if (dismissedUntil && Date.now() < dismissedUntil) {
      return;
    }

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    let installEventFired = false;

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      installEventFired = true;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
      setShowManualInstallHint(false);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Edge/Chromium may not emit beforeinstallprompt immediately.
    // Show a lightweight manual-install hint as fallback.
    const fallbackTimer = window.setTimeout(() => {
      if (!installEventFired) {
        setShowManualInstallHint(true);
        setShowPrompt(true);
      }
    }, 3000);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    const DISMISS_KEY = "pwa-install-dismissed-until";
    const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_DURATION_MS));
  };

  if (!showPrompt || !deferredPrompt) return null;
  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 md:left-auto md:right-4 md:w-80">
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0">
            <Image
              src="/icon-192.png"
              alt="App icon"
              width={48}
              height={48}
              className="rounded-lg"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-black dark:text-zinc-50 mb-1">
              Install Calorie Tracker
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
              {showManualInstallHint
                ? "In Edge, open menu (...) > Apps > Install this site as an app"
                : "Install the app for quick access and offline use"}
            </p>
            <div className="flex gap-2">
              {deferredPrompt && (
                <button
                  onClick={handleInstall}
                  className="flex-1 rounded-lg bg-black dark:bg-zinc-50 text-white dark:text-black px-3 py-2 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-300 transition-colors"
                >
                  Install
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs font-medium text-black dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
