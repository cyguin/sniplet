#!/usr/bin/env node
/**
 * CrispTrader Price Poller
 * Runs every 5 minutes via systemd timer on lin TX.
 * Fetches spot prices from Metals.dev and POSTs to /api/internal/check.
 */

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const {
  METALS_DEV_API_KEY,
  INTERNAL_POLLER_SECRET,
  VERCEL_APP_URL,
} = process.env;

function validateEnv() {
  const missing = [];
  if (!METALS_DEV_API_KEY) missing.push("METALS_DEV_API_KEY");
  if (!INTERNAL_POLLER_SECRET) missing.push("INTERNAL_POLLER_SECRET");
  if (!VERCEL_APP_URL) missing.push("VERCEL_APP_URL");

  if (missing.length > 0) {
    throw new Error(
      `Missing required env vars: ${missing.join(", ")}. Set them in /opt/crisptrader/poller/.env or systemd Environment=`
    );
  }
}

async function fetchSpotPrices() {
  const url = new URL("https://metals.dev/api/v1/spot");
  url.searchParams.set("api_key", METALS_DEV_API_KEY);
  url.searchParams.set("metals", "gold,silver,platinum,palladium");
  url.searchParams.set("currency", "USD");
  url.searchParams.set("unit", "toz"); // troy ounce

  console.log(`[${new Date().toISOString()}] Fetching spot prices from Metals.dev...`);

  const response = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Metals.dev API error ${response.status}: ${text}`);
  }

  const data = await response.json();

  const prices = {};
  const metalMap = {
    gold: "gold",
    silver: "silver",
    platinum: "platinum",
    palladium: "palladium",
  };

  for (const [key, label] of Object.entries(metalMap)) {
    const metalData = data[label];
    if (metalData && typeof metalData.price === "number") {
      prices[key] = metalData.price;
    } else {
      throw new Error(`Unexpected Metals.dev response structure for ${key}: ${JSON.stringify(metalData)}`);
    }
  }

  console.log(`  Prices → Gold: $${prices.gold} | Silver: $${prices.silver} | Platinum: $${prices.platinum} | Palladium: $${prices.palladium}`);

  return prices;
}

async function postPricesToCheck(prices) {
  const checkUrl = `${VERCEL_APP_URL}/api/internal/check`;
  console.log(`[${new Date().toISOString()}] POSTing prices to ${checkUrl}...`);

  const response = await fetch(checkUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${INTERNAL_POLLER_SECRET}`,
    },
    body: JSON.stringify(prices),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`/api/internal/check responded ${response.status}: ${text}`);
  }

  const result = await response.json();
  console.log(`  Check result → ${JSON.stringify(result)}`);
  return result;
}

async function pollCycle() {
  const timestamp = new Date().toISOString();
  console.log(`\n=== Poll cycle started at ${timestamp} ===`);

  try {
    const prices = await fetchSpotPrices();
    await postPricesToCheck(prices);
    console.log(`=== Poll cycle completed successfully ===\n`);
  } catch (err) {
    console.error(`!!! Poll cycle failed: ${err.message}`);
    console.log("=== Poll cycle failed — will retry on next interval ===\n");
  }
}

async function main() {
  console.log("CrispTrader Price Poller starting...");
  validateEnv();
  console.log(`Environment validated. Polling every ${POLL_INTERVAL_MS / 1000 / 60} minutes.`);

  // Run immediately on startup, then every 5 minutes
  await pollCycle();
  setInterval(pollCycle, POLL_INTERVAL_MS);
}

main().catch((err) => {
  console.error("Fatal error in poller:", err);
  process.exit(1);
});