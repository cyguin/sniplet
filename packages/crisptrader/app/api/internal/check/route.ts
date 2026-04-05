import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '../../../../db';
import { alerts, priceChecks } from '../../../../db/schema';
import { fetchAllSpotPrices } from '../../../../lib/metals';
import { evaluateAlerts, loadActiveAlerts, processAlertTriggers, SpotPrices } from '../../../../lib/evaluator';
import { eq } from 'drizzle-orm';

function verifySecret(request: NextRequest): boolean {
  const secret = request.headers.get('x-internal-poller-secret');
  const expectedSecret = process.env.INTERNAL_POLLER_SECRET;

  if (!expectedSecret) {
    console.error('INTERNAL_POLLER_SECRET is not configured');
    return false;
  }

  if (!secret) {
    return false;
  }

  return secret === expectedSecret;
}

function generatePayloadHash(metal: string, price: number): string {
  return createHash('sha256')
    .update(`${metal}:${price}`)
    .digest('hex');
}

export async function POST(request: NextRequest) {
  if (!verifySecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const metalsResponse = await fetchAllSpotPrices('USD');

    const currentPrices: SpotPrices = {
      gold: metalsResponse.metals.gold,
      silver: metalsResponse.metals.silver,
      platinum: metalsResponse.metals.platinum,
      palladium: metalsResponse.metals.palladium,
    };

    const activeAlerts = await loadActiveAlerts();

    const evaluationResults = await evaluateAlerts(activeAlerts, currentPrices);

    await processAlertTriggers(evaluationResults, activeAlerts);

    const now = new Date();

    for (const [metal, price] of Object.entries(currentPrices)) {
      if (price === undefined) continue;

      const payloadHash = generatePayloadHash(metal, price);

      const existing = await db
        .select({ id: priceChecks.id })
        .from(priceChecks)
        .where(eq(priceChecks.payloadHash, payloadHash))
        .limit(1);

      if (existing.length === 0) {
        await db.insert(priceChecks).values({
          id: `${metal}-${Date.now()}`,
          metal,
          currency: 'USD',
          spotPrice: price,
          observedAt: now,
          payloadHash,
        });
      }
    }

    const triggered = evaluationResults.filter((r) => r.shouldNotify).length;
    const evaluated = evaluationResults.length;

    return NextResponse.json({
      success: true,
      evaluated,
      triggered,
      prices: currentPrices,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Error in /api/internal/check:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
