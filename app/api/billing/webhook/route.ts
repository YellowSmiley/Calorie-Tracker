import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import {
  apiBadRequest,
  apiInternalError,
  apiServiceUnavailable,
  apiSuccess,
} from "@/lib/apiResponse";
import {
  getStripeClient,
  getStripeWebhookSecret,
  getStripePremiumPriceId,
} from "@/lib/stripe";
import {
  hasPremiumAccess,
  parseStripePeriodEndDate,
} from "@/lib/subscriptionService";

const SUBSCRIPTION_EVENTS = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

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

async function updateFromSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const currentPeriodEnd = getCurrentPeriodEndUnix(subscription);
  const periodEnd = parseStripePeriodEndDate(currentPeriodEnd);
  const isPremium = hasPremiumAccess(subscription.status, currentPeriodEnd);

  const subscriptionPriceId = subscription.items.data[0]?.price?.id ?? null;
  const premiumPriceId = getStripePremiumPriceId();

  const shouldBePremium =
    premiumPriceId && subscriptionPriceId
      ? subscriptionPriceId === premiumPriceId && isPremium
      : isPremium;

  const updated = await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscriptionPriceId,
      subscriptionStatus: subscription.status,
      premiumExpiresAt: periodEnd,
      isPremium: shouldBePremium,
    },
  });

  if (updated.count === 0) {
    return;
  }

  const target = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true },
  });

  if (!target) {
    return;
  }

  await prisma.auditLog.create({
    data: {
      actorId: target.id,
      actorRole: "user",
      targetType: "user",
      targetId: target.id,
      action: "PREMIUM_STATUS_UPDATED",
      metadata: {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
        premiumExpiresAt: periodEnd?.toISOString() ?? null,
        isPremium: shouldBePremium,
      },
    },
  });
}

// POST /api/billing/webhook - Stripe webhook endpoint
export async function POST(request: Request) {
  try {
    const stripe = getStripeClient();
    const webhookSecret = getStripeWebhookSecret();

    if (!stripe || !webhookSecret) {
      return apiServiceUnavailable(
        "Billing webhook is not configured",
        "BILLING_NOT_CONFIGURED",
      );
    }

    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return apiBadRequest("Missing Stripe signature", "MISSING_SIGNATURE");
    }

    const rawBody = await request.text();

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      return apiBadRequest("Invalid Stripe signature", "INVALID_SIGNATURE");
    }

    if (!SUBSCRIPTION_EVENTS.has(event.type)) {
      return apiSuccess({ received: true });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") {
        return apiSuccess({ received: true });
      }

      const userId = session.client_reference_id ?? session.metadata?.userId;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;

      if (userId && customerId) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            stripeCustomerId: customerId,
            ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
          },
        });
      }

      if (subscriptionId) {
        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);
        await updateFromSubscription(subscription);
      }

      return apiSuccess({ received: true });
    }

    const subscription = event.data.object as Stripe.Subscription;
    await updateFromSubscription(subscription);

    return apiSuccess({ received: true });
  } catch (error) {
    return apiInternalError(
      "billing/webhook/POST",
      error,
      "Failed to process billing webhook",
    );
  }
}
