// AdSense component for Google AdSense integration
"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

const ADSENSE_HIDDEN_UNTIL_KEY = "ct_adsense_hidden_until";
const ADSENSE_REAPPEAR_MS = 30 * 1000;

interface AdSenseProps {
  className?: string;
}

export default function AdSense({ className }: AdSenseProps) {
  const { data: session } = useSession();
  const isPremiumUser = Boolean(
    (session?.user as { isPremium?: boolean } | undefined)?.isPremium,
  );
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }

    const hiddenUntilRaw = window.localStorage.getItem(
      ADSENSE_HIDDEN_UNTIL_KEY,
    );
    const parsed = hiddenUntilRaw ? Number(hiddenUntilRaw) : NaN;
    return !(Number.isFinite(parsed) && parsed > Date.now());
  });
  const adRef = useRef<HTMLElement | null>(null);
  const reopenTimerRef = useRef<number | null>(null);

  const scheduleReopen = (delayMs: number) => {
    if (reopenTimerRef.current !== null) {
      window.clearTimeout(reopenTimerRef.current);
    }

    reopenTimerRef.current = window.setTimeout(
      () => {
        localStorage.removeItem(ADSENSE_HIDDEN_UNTIL_KEY);
        setIsVisible(true);
        reopenTimerRef.current = null;
      },
      Math.max(delayMs, 0),
    );
  };

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hiddenUntilRaw = window.localStorage.getItem(
      ADSENSE_HIDDEN_UNTIL_KEY,
    );
    const hiddenUntil = hiddenUntilRaw ? Number(hiddenUntilRaw) : NaN;

    if (Number.isFinite(hiddenUntil) && hiddenUntil > Date.now()) {
      scheduleReopen(hiddenUntil - Date.now());
    } else {
      window.localStorage.removeItem(ADSENSE_HIDDEN_UNTIL_KEY);
    }

    if (process.env.NODE_ENV === "production") {
      const script = document.createElement("script");
      script.async = true;
      script.src =
        "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3994001555579385";
      script.crossOrigin = "anonymous";
      script.id = "ct-adsense-script";

      if (!document.getElementById(script.id)) {
        document.body.appendChild(script);
      }

      // Add meta tag for Google AdSense account
      if (!document.querySelector('meta[name="google-adsense-account"]')) {
        const meta = document.createElement("meta");
        meta.name = "google-adsense-account";
        meta.content = "ca-pub-3994001555579385";
        document.head.appendChild(meta);
      }
    }

    return () => {
      if (reopenTimerRef.current !== null) {
        window.clearTimeout(reopenTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !isVisible) {
      return;
    }

    if (!adRef.current || adRef.current.dataset.loaded === "true") {
      return;
    }

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      adRef.current.dataset.loaded = "true";
    } catch {
      // Ignore ad-load failures so header rendering remains stable.
    }
  }, [isVisible]);

  const handleClose = () => {
    const nextHiddenUntil = Date.now() + ADSENSE_REAPPEAR_MS;
    window.localStorage.setItem(
      ADSENSE_HIDDEN_UNTIL_KEY,
      String(nextHiddenUntil),
    );
    setIsVisible(false);
    scheduleReopen(ADSENSE_REAPPEAR_MS);
  };

  if (!isVisible) {
    return null;
  }

  if (isPremiumUser) {
    return null;
  }

  return (
    <section
      className={[
        "rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-black",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Advertisement"
      data-testid="header-ad-container"
    >
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Sponsored
        </p>
        <button
          type="button"
          onClick={handleClose}
          className="rounded px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-900"
          aria-label="Close advertisement"
          data-testid="close-header-ad-button"
        >
          Close
        </button>
      </div>
      {process.env.NODE_ENV === "production" ? (
        <ins
          ref={(node) => {
            adRef.current = node;
          }}
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-3994001555579385"
          data-ad-slot="1234567890"
          data-ad-format="auto"
          data-full-width-responsive="true"
          data-testid="header-adsense-slot"
        ></ins>
      ) : (
        <div
          className="flex h-20 items-center justify-center rounded border border-dashed border-zinc-300 text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400"
          data-testid="header-adsense-placeholder"
        >
          Ad preview
        </div>
      )}
    </section>
  );
}
