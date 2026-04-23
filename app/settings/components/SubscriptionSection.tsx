"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import LoadingButton from "@/app/components/LoadingButton";
import { getApiErrorMessage } from "@/lib/apiError";

type SectionMessage = {
  type: "success" | "error";
  text: string;
};

interface SubscriptionSectionProps {
  isPremium: boolean;
  subscriptionStatus: string | null;
  premiumExpiresAt: string | null;
}

export default function SubscriptionSection({
  isPremium,
  subscriptionStatus,
  premiumExpiresAt,
}: SubscriptionSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update } = useSession();
  const [isStartingCheckout, setIsStartingCheckout] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [message, setMessage] = useState<SectionMessage | null>(null);

  useEffect(() => {
    const billing = searchParams.get("billing");

    if (!billing) {
      return;
    }

    if (billing === "cancelled") {
      setMessage({
        type: "error",
        text: "Checkout was cancelled. You are still on the free plan.",
      });
      router.replace("/settings");
      return;
    }

    if (billing !== "success") {
      return;
    }

    let isMounted = true;

    const refreshSubscription = async () => {
      setIsRefreshingStatus(true);

      try {
        const response = await fetch("/api/billing/refresh", {
          method: "POST",
        });

        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          setMessage({
            type: "error",
            text: await getApiErrorMessage(
              response,
              "Payment succeeded but we could not refresh your subscription yet. Please try again in a moment.",
            ),
          });
          return;
        }

        setMessage({
          type: "success",
          text: "Subscription confirmed. Your account is now ad-free.",
        });

        await update?.();
        router.refresh();
      } catch {
        if (!isMounted) {
          return;
        }

        setMessage({
          type: "error",
          text: "Payment succeeded but subscription confirmation is still pending. Please refresh shortly.",
        });
      } finally {
        if (isMounted) {
          setIsRefreshingStatus(false);
          router.replace("/settings");
        }
      }
    };

    void refreshSubscription();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams, update]);

  const expiresLabel = premiumExpiresAt
    ? new Date(premiumExpiresAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : null;

  const handleCheckout = async () => {
    setIsStartingCheckout(true);
    setMessage(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
      });

      if (!response.ok) {
        setMessage({
          type: "error",
          text: await getApiErrorMessage(response, "Failed to start checkout"),
        });
        return;
      }

      const payload = (await response.json()) as { url?: string };
      if (!payload.url) {
        setMessage({
          type: "error",
          text: "Checkout URL was not returned by the server.",
        });
        return;
      }

      window.location.href = payload.url;
    } catch {
      setMessage({
        type: "error",
        text: "Failed to start checkout. Please try again.",
      });
    } finally {
      setIsStartingCheckout(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsOpeningPortal(true);
    setMessage(null);

    try {
      const response = await fetch("/api/billing/portal", {
        method: "POST",
      });

      if (!response.ok) {
        setMessage({
          type: "error",
          text: await getApiErrorMessage(response, "Failed to open billing"),
        });
        return;
      }

      const payload = (await response.json()) as { url?: string };
      if (!payload.url) {
        setMessage({
          type: "error",
          text: "Billing URL was not returned by the server.",
        });
        return;
      }

      window.location.href = payload.url;
    } catch {
      setMessage({
        type: "error",
        text: "Failed to open billing. Please try again.",
      });
    } finally {
      setIsOpeningPortal(false);
    }
  };

  return (
    <section className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-black">
      <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
        Upgrade to go ad free
      </h2>
      <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
        Subscribe for £2.50/month to remove all ads and support the app.
      </p>

      <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="font-medium text-black dark:text-zinc-50">
          {isPremium ? "Premium active" : "Free plan"}
        </p>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Status: {subscriptionStatus ?? "none"}
          {expiresLabel ? ` • renews on ${expiresLabel}` : ""}
        </p>
      </div>

      <div className="mt-4">
        {isPremium ? (
          <LoadingButton
            type="button"
            onClick={handleManageSubscription}
            isLoading={isOpeningPortal || isRefreshingStatus}
            loadingLabel="Opening billing..."
            spinnerClassName="h-4 w-4"
            className="ct-button-secondary h-10 w-full rounded-lg px-6 text-sm font-medium transition-colors disabled:opacity-50"
            data-testid="manage-subscription-button"
          >
            Manage Subscription
          </LoadingButton>
        ) : (
          <LoadingButton
            type="button"
            onClick={handleCheckout}
            isLoading={isStartingCheckout || isRefreshingStatus}
            loadingLabel="Redirecting to secure checkout..."
            spinnerClassName="h-4 w-4"
            className="ct-button-primary h-10 w-full rounded-lg px-6 text-sm font-medium transition-colors disabled:opacity-50"
            data-testid="upgrade-subscription-button"
          >
            Upgrade for £2.50/month
          </LoadingButton>
        )}
      </div>

      {message ? (
        <div
          className={`mt-3 rounded-lg p-3 text-sm ${
            message.type === "success"
              ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-200"
              : "bg-zinc-200 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100"
          }`}
          role={message.type === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {message.text}
        </div>
      ) : null}
    </section>
  );
}
