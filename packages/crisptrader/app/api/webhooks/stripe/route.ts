import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '../../../../db';
import { users } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

function getStripeWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      'STRIPE_WEBHOOK_SECRET environment variable is not set. ' +
      'Add it to your .env.local file.'
    );
  }
  return secret;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const webhookSecret = getStripeWebhookSecret();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;

        if (!userId || !customerId) {
          console.error('Missing userId or customerId in checkout session metadata');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        const priceId = subscription.items.data[0]?.price.id;

        let plan: string = 'free';
        if (priceId === process.env.STRIPE_PRICE_STACKER) {
          plan = 'stacker';
        } else if (priceId === process.env.STRIPE_PRICE_VAULT) {
          plan = 'vault';
        }

        await db
          .update(users)
          .set({
            plan,
            stripeCustomerId: customerId,
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const [user] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.stripeCustomerId, customerId))
          .limit(1);

        if (!user) {
          console.error(`No user found for stripe customer ${customerId}`);
          break;
        }

        const priceId = subscription.items.data[0]?.price.id;

        let plan: string = 'free';
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          if (priceId === process.env.STRIPE_PRICE_STACKER) {
            plan = 'stacker';
          } else if (priceId === process.env.STRIPE_PRICE_VAULT) {
            plan = 'vault';
          }
        }

        await db
          .update(users)
          .set({
            plan,
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const [user] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.stripeCustomerId, customerId))
          .limit(1);

        if (!user) {
          console.error(`No user found for stripe customer ${customerId}`);
          break;
        }

        await db
          .update(users)
          .set({
            plan: 'free',
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id));

        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    return NextResponse.json(
      {
        error: 'Webhook handler failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
