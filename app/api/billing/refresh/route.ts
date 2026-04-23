import Stripe from "stripe";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/apiGuards";
import {
  apiBadRequest,
  apiInternalError,
  apiServiceUnavailable,
  apiSuccess,
} from "@/lib/apiResponse";
import { getStripeClient, getStripePremiumPriceId } from "@/lib/stripe";
import {
  hasPremiumAccess,
  parseStripePeriodEndDate,
} from "@/lib/subscriptionService";
import { getRequestId, logAdminAction } from "@/lib/auditService";

function getCurrentPeriodEndUnix(
  subscription: Stripe.Subscription,
): number | null {
  const value = (
    subscription as Stripe.Subscription & {
      current_period_end?: number;
    }
  ).current_period_end;

  return typeof value === "number" ? value : null;
}

function pickRelevantSubscription(
  subscriptions: Stripe.Subscription[],
  premiumPriceId: string | null,
): Stripe.Subscription | null {
  if (subscriptions.length === 0) {
    return null;
  }

  if (!premiumPriceId) {
    return subscriptions[0] ?? null;
  }

  const premiumSubscription = subscriptions.find((subscription) =>
    subscription.items.data.some((item) => item.price?.id === premiumPriceId),
  );

  return premiumSubscription ?? subscriptions[0] ?? null;
}

// POST /api/billing/refresh - refresh current user's premium status from Stripe
export async function POST(request: NextRequest) {
  try {
    const guard = await requireUser();
    if ("response" in guard) {
      return guard.response;
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return apiServiceUnavailable(
        "Billing is not configured yet",
        "BILLING_NOT_CONFIGURED",
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: guard.user.id },
      select: {
        id: true,
        stripeCustomerId: true,
      },
    });

    if (!user?.stripeCustomerId) {
      return apiBadRequest(
        "No Stripe customer linked to this account yet",
        "BILLING_PROFILE_MISSING",
      );
    }

    const subscriptionsResponse = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "all",
      limit: 10,
    });

    const subscription = pickRelevantSubscription(
      subscriptionsResponse.data,
      getStripePremiumPriceId(),
    );

    if (!subscription) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          isPremium: false,
          stripeSubscriptionId: null,
          stripePriceId: null,
          subscriptionStatus: null,
          premiumExpiresAt: null,
        },
      });

      return apiSuccess({
        isPremium: false,
        subscriptionStatus: null,
        premiumExpiresAt: null,
      });
    }

    const currentPeriodEnd = getCurrentPeriodEndUnix(subscription);
    const periodEnd = parseStripePeriodEndDate(currentPeriodEnd);
    const subscriptionPriceId = subscription.items.data[0]?.price?.id ?? null;
    const premiumPriceId = getStripePremiumPriceId();

    const isPremium =
      premiumPriceId && subscriptionPriceId
        ? subscriptionPriceId === premiumPriceId &&
          hasPremiumAccess(subscription.status, currentPeriodEnd)
        : hasPremiumAccess(subscription.status, currentPeriodEnd);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isPremium,
        stripeSubscriptionId: subscription.id,
        stripePriceId: subscriptionPriceId,
        subscriptionStatus: subscription.status,
        premiumExpiresAt: periodEnd,
      },
    });

    await logAdminAction(prisma, {
      actorId: user.id,
      actorRole: "user",
      targetType: "user",
      targetId: user.id,
      action: "PREMIUM_STATUS_UPDATED",
      requestId: getRequestId(request),
      metadata: {
        source: "manual-refresh",
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        premiumExpiresAt: periodEnd?.toISOString() ?? null,
        isPremium,
      },
    });

    return apiSuccess({
      isPremium,
      subscriptionStatus: subscription.status,
      premiumExpiresAt: periodEnd?.toISOString() ?? null,
    });
  } catch (error) {
    return apiInternalError(
      "billing/refresh/POST",
      error,
      "Failed to refresh subscription status",
    );
  }
}
