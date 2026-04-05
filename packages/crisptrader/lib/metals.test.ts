/**
 * Test script for Metals.dev API client
 * Run with: METALS_DEV_API_KEY=your_key npx tsx lib/metals.test.ts
 * Or add METALS_DEV_API_KEY to .env.local and run: npx tsx lib/metals.test.ts
 */

import {
  fetchAllSpotPrices,
  fetchSpotPrice,
  fetchMultipleMetals,
  MetalCode,
} from "./metals";

async function runTests() {
  console.log("=".repeat(50));
  console.log("Metals.dev API Client Tests");
  console.log("=".repeat(50));

  const apiKey = process.env.METALS_DEV_API_KEY;
  if (!apiKey) {
    console.error("ERROR: METALS_DEV_API_KEY environment variable is not set");
    console.error("Get your free API key at https://metals.dev");
    process.exit(1);
  }

  console.log("API Key found:", apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4));
  console.log("");

  // Test 1: Fetch all spot prices
  console.log("Test 1: fetchAllSpotPrices()");
  console.log("-".repeat(30));
  try {
    const allPrices = await fetchAllSpotPrices();
    console.log("  ✓ Success!");
    console.log("  Metals:", JSON.stringify(allPrices.metals, null, 2));
    console.log("  Currencies:", JSON.stringify(allPrices.currencies, null, 2));
    console.log("  Unit:", allPrices.unit);
    console.log("  Base Currency:", allPrices.currency);
    console.log("");
  } catch (error) {
    console.error("  ✗ Failed:", error instanceof Error ? error.message : error);
    console.error("");
  }

  // Test 2: Fetch single metal price (gold)
  console.log("Test 2: fetchSpotPrice('gold')");
  console.log("-".repeat(30));
  try {
    const gold = await fetchSpotPrice("gold");
    console.log("  ✓ Success!");
    console.log("  Metal:", gold.metal);
    console.log("  Spot Price:", gold.spot_price);
    console.log("  Currency:", gold.currency);
    console.log("");
  } catch (error) {
    console.error("  ✗ Failed:", error instanceof Error ? error.message : error);
    console.error("");
  }

  // Test 3: Fetch multiple metals
  console.log("Test 3: fetchMultipleMetals(['gold', 'silver'])");
  console.log("-".repeat(30));
  try {
    const goldSilver = await fetchMultipleMetals(["gold", "silver"]);
    console.log("  ✓ Success!");
    console.log("  Metals:", JSON.stringify(goldSilver.metals, null, 2));
    console.log("");
  } catch (error) {
    console.error("  ✗ Failed:", error instanceof Error ? error.message : error);
    console.error("");
  }

  // Test 4: Fetch all four metals
  console.log("Test 4: fetchAllSpotPrices() - all 4 metals");
  console.log("-".repeat(30));
  try {
    const allMetals: MetalCode[] = ["gold", "silver", "platinum", "palladium"];
    const prices = await fetchAllSpotPrices();

    const availableMetals = Object.keys(prices.metals) as MetalCode[];
    console.log("  ✓ Success!");
    console.log("  Available metals from API:", availableMetals.join(", "));

    for (const metal of allMetals) {
      const price = prices.metals[metal];
      if (price !== undefined) {
        console.log(`  ${metal.charAt(0).toUpperCase() + metal.slice(1)}: $${price.toFixed(2)}`);
      } else {
        console.log(`  ${metal.charAt(0).toUpperCase() + metal.slice(1)}: not returned by API`);
      }
    }
    console.log("");
  } catch (error) {
    console.error("  ✗ Failed:", error instanceof Error ? error.message : error);
    console.error("");
  }

  console.log("=".repeat(50));
  console.log("Tests complete!");
  console.log("=".repeat(50));
}

runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
