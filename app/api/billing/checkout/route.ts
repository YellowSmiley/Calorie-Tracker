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
import { getRequestId, logAdminAction } from "@/lib/auditService";

function getAppBaseUrl(request: NextRequest): string {
  const configured = process.env.AUTH_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return request.nextUrl.origin;
}

// POST /api/billing/checkout - create Stripe Checkout subscription session
export async function POST(request: NextRequest) {
  try {
    const guard = await requireUser();
    if ("response" in guard) {
      return guard.response;
    }

    const stripe = getStripeClient();
    const premiumPriceId = getStripePremiumPriceId();

    if (!stripe || !premiumPriceId) {
      return apiServiceUnavailable(
        "Billing is not configured yet",
        "BILLING_NOT_CONFIGURED",
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: guard.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        stripeCustomerId: true,
      },
    });

    if (!user || !user.email) {
      return apiBadRequest(
        "A verified account email is required before subscribing",
        "BILLING_EMAIL_REQUIRED",
      );
    }

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: {
          userId: user.id,
        },
      });

      stripeCustomerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId },
      });
    }

    const baseUrl = getAppBaseUrl(request);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [{ price: premiumPriceId, quantity: 1 }],
      success_url: `${baseUrl}/settings?billing=success`,
      cancel_url: `${baseUrl}/settings?billing=cancelled`,
      allow_promotion_codes: true,
      client_reference_id: user.id,
      metadata: {
        userId: user.id,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
    });

    if (!session.url) {
      return apiInternalError(
        "billing/checkout/POST",
        null,
        "Failed to create checkout session",
      );
    }

    await logAdminAction(prisma, {
      actorId: user.id,
      actorRole: "user",
      targetType: "user",
      targetId: user.id,
      action: "PREMIUM_CHECKOUT_STARTED",
      requestId: getRequestId(request),
      metadata: {
        stripeCustomerId,
        stripeCheckoutSessionId: session.id,
      },
    });

    return apiSuccess({ url: session.url });
  } catch (error) {
    return apiInternalError(
      "billing/checkout/POST",
      error,
      "Failed to start subscription checkout",
    );
  }
}
