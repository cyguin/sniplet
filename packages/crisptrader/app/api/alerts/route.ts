import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { alerts, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const VALID_METALS = ['gold', 'silver', 'platinum', 'palladium'] as const;
const VALID_DIRECTIONS = ['above', 'below'] as const;

type MetalCode = typeof VALID_METALS[number];
type Direction = typeof VALID_DIRECTIONS[number];

const PLAN_LIMITS: Record<string, number> = {
  free: 3,
  stacker: 25,
  vault: Infinity,
};

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const userAlerts = await db.query.alerts.findMany({
    where: eq(alerts.userId, user.id),
  });

  return NextResponse.json({ alerts: userAlerts });
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const planLimit = PLAN_LIMITS[user.plan] ?? PLAN_LIMITS.free;
  const currentAlertCount = await db.query.alerts.findMany({
    where: eq(alerts.userId, user.id),
  });

  if (currentAlertCount.length >= planLimit) {
    return NextResponse.json(
      { error: 'Alert limit reached for your plan', plan: user.plan, limit: planLimit },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { metal, threshold, direction, currency = 'USD' } = body;

  if (!VALID_METALS.includes(metal)) {
    return NextResponse.json(
      { error: 'Invalid metal. Must be gold, silver, platinum, or palladium' },
      { status: 400 }
    );
  }

  if (!VALID_DIRECTIONS.includes(direction)) {
    return NextResponse.json(
      { error: 'Invalid direction. Must be above or below' },
      { status: 400 }
    );
  }

  if (typeof threshold !== 'number' || threshold <= 0) {
    return NextResponse.json(
      { error: 'Threshold must be a positive number' },
      { status: 400 }
    );
  }

  const newAlert = {
    id: crypto.randomUUID(),
    userId: user.id,
    metal: metal as MetalCode,
    threshold: threshold.toString(),
    direction: direction as Direction,
    currency,
    active: true,
    createdAt: new Date(),
  };

  await db.insert(alerts).values(newAlert);

  return NextResponse.json({ alert: newAlert }, { status: 201 });
}
