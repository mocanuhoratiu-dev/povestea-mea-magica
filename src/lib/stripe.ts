import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) return null;

  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}
