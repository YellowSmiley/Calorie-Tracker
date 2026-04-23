import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/apiGuards";
import {
  apiBadRequest,
  apiInternalError,
  apiServiceUnavailable,
  apiSuccess,
} from "@/lib/apiResponse";
import { getStripeClient } from "@/lib/stripe";

function getAppBaseUrl(request: NextRequest): string {
  const configured = process.env.AUTH_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return request.nextUrl.origin;
}

// POST /api/billing/portal - create Stripe customer portal session
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
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return apiBadRequest(
        "No active billing profile found for this account",
        "BILLING_PROFILE_MISSING",
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${getAppBaseUrl(request)}/settings`,
    });

    return apiSuccess({ url: session.url });
  } catch (error) {
    return apiInternalError(
      "billing/portal/POST",
      error,
      "Failed to open billing portal",
    );
  }
}
