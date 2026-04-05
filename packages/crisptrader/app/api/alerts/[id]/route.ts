import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { alerts, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const VALID_METALS = ['gold', 'silver', 'platinum', 'palladium'] as const;
const VALID_DIRECTIONS = ['above', 'below'] as const;

type MetalCode = typeof VALID_METALS[number];
type Direction = typeof VALID_DIRECTIONS[number];

type AlertParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: AlertParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const alert = await db.query.alerts.findFirst({
    where: and(eq(alerts.id, id), eq(alerts.userId, user.id)),
  });

  if (!alert) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
  }

  return NextResponse.json({ alert });
}

export async function PATCH(request: Request, { params }: AlertParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const alert = await db.query.alerts.findFirst({
    where: and(eq(alerts.id, id), eq(alerts.userId, user.id)),
  });

  if (!alert) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
  }

  const body = await request.json();
  const { active, threshold, direction, snoozeUntil } = body;

  const updates: Partial<{
    active: boolean;
    threshold: string;
    direction: string;
    snoozeUntil: Date | null;
  }> = {};

  if (active !== undefined) {
    updates.active = Boolean(active);
  }

  if (threshold !== undefined) {
    if (typeof threshold !== 'number' || threshold <= 0) {
      return NextResponse.json(
        { error: 'Threshold must be a positive number' },
        { status: 400 }
      );
    }
    updates.threshold = threshold.toString();
  }

  if (direction !== undefined) {
    if (!VALID_DIRECTIONS.includes(direction)) {
      return NextResponse.json(
        { error: 'Invalid direction. Must be above or below' },
        { status: 400 }
      );
    }
    updates.direction = direction as Direction;
  }

  if (snoozeUntil !== undefined) {
    if (snoozeUntil === null) {
      updates.snoozeUntil = null;
    } else if (snoozeUntil instanceof Date || typeof snoozeUntil === 'string') {
      updates.snoozeUntil = new Date(snoozeUntil);
    } else {
      return NextResponse.json(
        { error: 'snoozeUntil must be a valid date or null' },
        { status: 400 }
      );
    }
  }

  await db.update(alerts).set(updates).where(eq(alerts.id, id));

  const updatedAlert = await db.query.alerts.findFirst({
    where: eq(alerts.id, id),
  });

  return NextResponse.json({ alert: updatedAlert });
}

export async function DELETE(request: Request, { params }: AlertParams) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const alert = await db.query.alerts.findFirst({
    where: and(eq(alerts.id, id), eq(alerts.userId, user.id)),
  });

  if (!alert) {
    return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
  }

  await db.delete(alerts).where(eq(alerts.id, id));

  return NextResponse.json({ success: true });
}
