import Stripe from 'stripe';

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY environment variable is not set. ' +
      'Add it to your .env.local file. Get your key at https://stripe.com'
    );
  }
  return new Stripe(key, { apiVersion: '2023-10-16' });
}

export type PlanType = 'free' | 'stacker' | 'vault';

export interface PlanLimits {
  maxAlerts: number;
  pollInterval: number;
}

export function getPlanLimits(plan: PlanType): PlanLimits {
  switch (plan) {
    case 'free':
      return { maxAlerts: 3, pollInterval: 15 };
    case 'stacker':
      return { maxAlerts: 25, pollInterval: 5 };
    case 'vault':
      return { maxAlerts: Infinity, pollInterval: 1 };
    default:
      return { maxAlerts: 3, pollInterval: 15 };
  }
}

export async function createCheckoutSession(
  userId: string,
  plan: 'stacker' | 'vault'
): Promise<string> {
  const stripe = getStripe();
  
  const priceId =
    plan === 'stacker'
      ? process.env.STRIPE_PRICE_STACKER
      : process.env.STRIPE_PRICE_VAULT;

  if (!priceId) {
    throw new Error(
      `STRIPE_PRICE_${plan.toUpperCase()} environment variable is not set. ` +
      `Add the Stripe price ID for the ${plan} plan to your .env.local file.`
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/account?checkout=cancelled`,
    metadata: {
      userId,
    },
  });

  if (!session.url) {
    throw new Error('Failed to create Stripe checkout session: no URL returned');
  }

  return session.url;
}

export async function createPortalSession(customerId: string): Promise<string> {
  const stripe = getStripe();
  
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/account`,
  });

  return session.url;
}
