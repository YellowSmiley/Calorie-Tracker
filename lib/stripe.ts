import Stripe from "stripe";

let cachedStripe: Stripe | null = null;

export function getStripeSecretKey(): string | null {
  const value = process.env.STRIPE_SECRET_KEY?.trim();
  return value ? value : null;
}

export function getStripePremiumPriceId(): string | null {
  const value = process.env.STRIPE_PREMIUM_PRICE_ID?.trim();
  return value ? value : null;
}

export function getStripeWebhookSecret(): string | null {
  const value = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  return value ? value : null;
}

export function getStripeClient(): Stripe | null {
  const secretKey = getStripeSecretKey();
  if (!secretKey) {
    return null;
  }

  if (cachedStripe) {
    return cachedStripe;
  }

  cachedStripe = new Stripe(secretKey);

  return cachedStripe;
}
