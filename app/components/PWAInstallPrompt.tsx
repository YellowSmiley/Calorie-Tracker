"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { trackEvent } from "./analyticsEvents";
import { Capacitor } from "@capacitor/core";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const CONSENT_KEY = "pwa-install-consent";
const ACKNOWLEDGED_VALUE = "acknowledged";
const CONSENT_EVENT = "pwa-install-consent-changed";

function getConsentSnapshot() {
  return localStorage.getItem(CONSENT_KEY);
}

function getConsentServerSnapshot() {
  return ACKNOWLEDGED_VALUE;
}

function subscribeConsent(callback: () => void) {
  const onStorage = () => callback();
  const onInternalConsentChange = () => callback();

  window.addEventListener("storage", onStorage);
  window.addEventListener(CONSENT_EVENT, onInternalConsentChange);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CONSENT_EVENT, onInternalConsentChange);
  };
}

function acknowledgeInstallPrompt() {
  localStorage.setItem(CONSENT_KEY, ACKNOWLEDGED_VALUE);
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

function isInstallPromptAcknowledged() {
  return localStorage.getItem(CONSENT_KEY) === ACKNOWLEDGED_VALUE;
}

export default function PWAInstallPrompt() {
  const consent = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getConsentServerSnapshot,
  );
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showManualInstallHint, setShowManualInstallHint] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      return;
    }

    // Mirror cookie banner behavior: once actioned, do not show again.
    if (consent === ACKNOWLEDGED_VALUE || isInstallPromptAcknowledged()) {
      return;
    }

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    let installEventFired = false;

    // Listen for beforeinstallprompt event
    const handler = (e: Event) => {
      if (isInstallPromptAcknowledged()) {
        return;
      }
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
      if (!installEventFired && !isInstallPromptAcknowledged()) {
        setShowManualInstallHint(true);
        setShowPrompt(true);
      }
    }, 3000);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [consent]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    trackEvent("pwa_install_clicked", {
      source: "install_prompt",
      hasManualHint: showManualInstallHint,
    });

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    trackEvent("pwa_install_result", {
      outcome,
      source: "install_prompt",
    });

    // Treat any completed install flow as actioned so prompt doesn't reappear.
    if (outcome === "accepted" || outcome === "dismissed") {
      acknowledgeInstallPrompt();
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    trackEvent("pwa_install_not_now", {
      source: "install_prompt",
      hasManualHint: showManualInstallHint,
    });

    acknowledgeInstallPrompt();
    setDeferredPrompt(null);
    setShowManualInstallHint(false);
    setShowPrompt(false);
  };

  if (consent === ACKNOWLEDGED_VALUE) return null;
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
                  data-testid="install-prompt-install-button"
                >
                  Install
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs font-medium text-black dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
                data-testid="install-prompt-dismiss-button"
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
