import { eq, and, or, isNull, gt } from 'drizzle-orm';
import { db } from '../db';
import { alerts } from '../db/schema';
import { sendAlertEmail } from './notifications';

export interface SpotPrices {
  gold?: number;
  silver?: number;
  platinum?: number;
  palladium?: number;
}

export interface EvaluationResult {
  alertId: string;
  metal: string;
  crossed: boolean;
  lastSpot: number;
  currentPrice: number;
  threshold: number;
  direction: 'above' | 'below';
  shouldNotify: boolean;
}

function metalToKey(metal: string): keyof SpotPrices {
  const map: Record<string, keyof SpotPrices> = {
    gold: 'gold',
    silver: 'silver',
    platinum: 'platinum',
    palladium: 'palladium',
  };
  return map[metal.toLowerCase()] ?? 'gold';
}

export async function evaluateAlerts(
  activeAlerts: typeof alerts.$inferSelect[],
  currentPrices: SpotPrices
): Promise<EvaluationResult[]> {
  const results: EvaluationResult[] = [];

  for (const alert of activeAlerts) {
    const metalKey = metalToKey(alert.metal);
    const currentPrice = currentPrices[metalKey];

    if (currentPrice === undefined) {
      results.push({
        alertId: alert.id,
        metal: alert.metal,
        crossed: false,
        lastSpot: Number(alert.lastSpot) || 0,
        currentPrice: 0,
        threshold: Number(alert.threshold),
        direction: alert.direction as 'above' | 'below',
        shouldNotify: false,
      });
      continue;
    }

    const lastSpot = Number(alert.lastSpot) ?? 0;
    const threshold = Number(alert.threshold);
    const direction = alert.direction as 'above' | 'below';

    let crossed = false;
    if (direction === 'below') {
      crossed = lastSpot > threshold && currentPrice <= threshold;
    } else if (direction === 'above') {
      crossed = lastSpot < threshold && currentPrice >= threshold;
    }

    results.push({
      alertId: alert.id,
      metal: alert.metal,
      crossed,
      lastSpot,
      currentPrice,
      threshold,
      direction,
      shouldNotify: crossed,
    });
  }

  return results;
}

export async function processAlertTriggers(
  evaluationResults: EvaluationResult[],
  allAlerts: typeof alerts.$inferSelect[]
): Promise<void> {
  const now = new Date();
  const snoozeDuration = 4 * 60 * 60 * 1000;

  for (const result of evaluationResults) {
    if (!result.shouldNotify) continue;

    const alert = allAlerts.find((a) => a.id === result.alertId);
    if (!alert) continue;

    try {
      await sendAlertEmail(
        alert as unknown as Parameters<typeof sendAlertEmail>[0],
        result.currentPrice,
        result.direction
      );
    } catch (err) {
      console.error(`Failed to send alert email for alert ${result.alertId}:`, err);
    }

    const snoozeUntil = new Date(now.getTime() + snoozeDuration);

    await db
      .update(alerts)
      .set({
        lastSpot: String(result.currentPrice),
        lastCheckedAt: now,
        lastFiredAt: now,
        snoozeUntil,
      })
      .where(eq(alerts.id, result.alertId));
  }

  for (const result of evaluationResults) {
    if (result.shouldNotify) continue;

    const alert = allAlerts.find((a) => a.id === result.alertId);
    if (!alert) continue;

    await db
      .update(alerts)
      .set({
        lastSpot: String(result.currentPrice),
        lastCheckedAt: now,
      })
      .where(eq(alerts.id, result.alertId));
  }
}

export async function loadActiveAlerts() {
  const now = new Date();

  return db
    .select()
    .from(alerts)
    .where(
      and(
        eq(alerts.active, true),
        or(isNull(alerts.snoozeUntil), gt(alerts.snoozeUntil, now))
      )
    );
}
