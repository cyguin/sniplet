# Metals.dev API Research - CrispTrader

## Overview

Metals.dev provides a JSON API for real-time precious metals spot prices, industrial metals, and currency conversion rates.

---

## API Details

### Base URL

```
https://api.metals.dev/v1/
```

### Authentication

**Method:** API key passed as a query parameter

```
?api_key=<YOUR API KEY>
```

The API key is found on the Dashboard and must be passed to every request.

---

## Endpoints

### Latest Spot Prices

**Endpoint:** `GET https://api.metals.dev/v1/latest`

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `api_key` | Yes | Your API key |
| `currency` | No | Currency code (default: USD) |
| `unit` | No | Unit code (default: toz for precious metals) |

**Example Request:**

```bash
curl -X GET "https://api.metals.dev/v1/latest?api_key=<YOUR API KEY>&currency=USD&unit=toz" \
  -H "Accept: application/json"
```

---

## Response Structure

### Full Response JSON

```json
{
  "status": "success",
  "currency": "USD",
  "unit": "toz",
  "metals": {
    "gold": 1923.86,
    "silver": 22.905,
    "platinum": 916.569,
    "palladium": 1229.684,
    "lbma_gold_am": 1929.75,
    "lbma_gold_pm": 1927.75,
    "lbma_silver": 23.005,
    "lbma_platinum_am": 922,
    "lbma_platinum_pm": 918,
    "lbma_palladium_am": 1251,
    "lbma_palladium_pm": 1241,
    "mcx_gold": 2212.307,
    "mcx_gold_am": 2204.8496,
    "mcx_gold_pm": 2208.3323,
    "mcx_silver": 26.3951,
    "mcx_silver_am": 26.3637,
    "mcx_silver_pm": 26.4216,
    "ibja_gold": 2215.339,
    "copper": 0.2584,
    "aluminum": 0.067,
    "lead": 0.0649,
    "nickel": 0.6355,
    "zinc": 0.0745,
    "lme_copper": 0.2599,
    "lme_aluminum": 0.0671,
    "lme_lead": 0.065,
    "lme_nickel": 0.6384,
    "lme_zinc": 0.074
  },
  "currencies": {
    "AED": 0.27225333,
    "USD": 1,
    "EUR": 1.08798,
    "GBP": 1.27026,
    ...
    "XAU": 1923.88,
    "XAG": 22.9155,
    "XPT": 919.01,
    "XPD": 1238.13
  },
  "timestamps": {
    "metal": "2023-07-05T06:16:02.829Z",
    "currency": "2023-07-05T06:16:04.204Z"
  }
}
```

---

## Metal Codes (Precious Metals)

| Metal | API Code | Default Unit | Chemical Symbol |
|-------|----------|--------------|-----------------|
| Gold | `gold` | Troy Ounce (toz) | Au |
| Silver | `silver` | Troy Ounce (toz) | Ag |
| Platinum | `platinum` | Troy Ounce (toz) | Pt |
| Palladium | `palladium` | Troy Ounce (toz) | Pd |

### ISO Currency Codes (XAU, XAG, XPT, XPD)

**Important:** These are **currency conversion rates**, not metal prices.

In the `currencies` section:
- `XAU` = 1 troy ounce of gold in USD
- `XAG` = 1 troy ounce of silver in USD
- `XPT` = 1 troy ounce of platinum in USD
- `XPD` = 1 troy ounce of palladium in USD

For CrispTrader's price alerts, use the `metals` object with codes: `gold`, `silver`, `platinum`, `palladium`.

---

## Spot Metal Endpoint (Single Metal)

For getting detailed bid/ask for a single metal:

**Endpoint:** `GET https://api.metals.dev/v1/metal/spot`

**Parameters:**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `api_key` | Yes | Your API key |
| `metal` | Yes | Metal code (gold, silver, platinum, palladium) |
| `currency` | No | Currency code (default: USD) |

**Response:**

```json
{
  "status": "success",
  "timestamp": "2023-07-05T07:10:01.933Z",
  "currency": "USD",
  "unit": "toz",
  "metal": "gold",
  "rate": {
    "price": 1923.76,
    "ask": 1923.63,
    "bid": 1922.96,
    "high": 1927.17,
    "low": 1920.91,
    "change": -2.67,
    "change_percent": -0.14
  }
}
```

This endpoint is useful for CrispTrader alerts as it provides bid/ask spread and daily change.

---

## Rate Limits & Pricing

### Free Tier

| Limit | Value |
|-------|-------|
| Requests per month | 100 |
| Data update delay | 60 seconds |
| Credit card required | No |

### Paid Plans

| Plan | Price | Requests/Month |
|------|-------|----------------|
| Free | $0 | 100 |
| Copper | $1.79 | 2,000 |
| Silver | $9.99 | 10,000 |
| Platinum | $19.99 | 50,000 |
| Palladium | $39.99 | 100,000 |
| Gold | $99.99 | 500,000 |

**Notes:**
- Quota resets on the 1st of every month
- 80% and 100% usage notifications sent
- 10% grace usage for paid plans after quota exceeded
- API access disabled after grace usage exhausted

---

## Gotchas & Issues

### 1. API Key as Query Parameter

The API key is passed as a query parameter (`?api_key=...`), not as a header. This has security implications:
- API key may get logged in server access logs
- Not suitable for client-side code (browser) unless using a backend proxy
- Consider using a backend proxy to keep the key secret

### 2. ISO Metal Codes (XAU/XAG/XPT/XPD) Are Currency Rates

The metals API uses plain English codes (`gold`, `silver`, `platinum`, `palladium`), NOT the ISO currency codes for metals.

The codes `XAU`, `XAG`, `XPT`, `XPD` appear in the `currencies` section and represent currency conversion rates (e.g., how much 1 oz of gold is worth in USD), not the spot price.

### 3. 60-Second Delay on Free Tier

Free tier data has up to 60 seconds delay. For real-time alerts, a paid plan is required.

### 4. Troy Ounce Default Unit

Precious metals are priced in Troy Ounces (toz) by default. Available units:
- `toz` - Troy Ounce
- `g` - Gram
- `kg` - Kilogram
- `mt` - Metric Tonne (for industrial metals)

### 5. Rate Limits are Strict

With only 100 requests/month on free tier, if checking every minute (60 min × 24 hours = 1,440 checks/day), you'd exhaust the quota in under 2 hours. For a price alert system, consider:

- Using the single metal spot endpoint (`/metal/spot?metal=gold`) to fetch only needed metals
- Implementing intelligent polling (e.g., only check when markets are open)
- Upgrading to a paid plan

### 6. Error Code 1203

When quota is exceeded, the API returns:
```json
{
  "status": "failure",
  "error_code": 1203,
  "error_message": "The quota for the current month including the grace usage is exceeded."
}
```

---

## Supported Units

| Unit Code | Unit Name |
|-----------|-----------|
| `toz` | Troy Ounce (default for precious metals) |
| `g` | Gram |
| `kg` | Kilogram |
| `mt` | Metric Tonne (default for industrial metals) |

---

## Error Codes

| Code | Description |
|------|-------------|
| 1101 | Unauthorized - Invalid API Key |
| 1201 | Plan not active (failed payments) |
| 1202 | Account not active or disabled |
| 1203 | Quota exceeded (including grace usage) |
| 2101 | Unsupported input parameter |
| 2102 | Mandatory parameter missing |
| 2103 | Unsupported currency code |
| 2104 | Invalid date format (use YYYY-MM-DD) |
| 2105 | Invalid date range (max 30 days for timeseries) |

---

## Recommendations for CrispTrader

1. **Use the `/metal/spot` endpoint** for each metal individually - this allows fetching only XAU, XAG, XPT, XPD prices without pulling all metals and currencies

2. **Store API key securely** - use backend proxy, never expose in client-side code

3. **Start with free tier** for development/testing, but **upgrade for production** due to 100 request/month limit

4. **Implement intelligent polling** - consider checking only during market hours or with exponential backoff

5. **Handle error code 1203 gracefully** - implement quota tracking and notify user when approaching limits

6. **Monitor usage** - use the `/usage` endpoint to track remaining quota

---

## Resources

- Documentation: https://metals.dev/docs
- Pricing: https://metals.dev/pricing
- Symbols: https://metals.dev/symbols
- API Base URL: https://api.metals.dev/v1/
