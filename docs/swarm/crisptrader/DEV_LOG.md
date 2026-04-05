# CrispTrader Dev Log

## 2026-04-04 — Setup
- Created directory structure under packages/crisptrader/
- Created swarm docs under docs/swarm/crisptrader/
- SPEC.md written from provided spec

## Research (2026-04-04)
- Metals.dev API: base URL https://api.metals.dev/v1/, auth via query param ?api_key=xxx, free tier 100 req/month
- Metal codes: gold, silver, platinum, palladium (NOT XAU/XAG)
- Neon + Drizzle: use neon-http driver, SSL required
- Clerk: clerkMiddleware() in middleware.ts, auth() in Server Components

## Build (2026-04-04)
- lib/metals.ts: Metals.dev API client with fetchAllSpotPrices, fetchSpotPrice
- lib/evaluator.ts: edge-triggered alert evaluation logic
- lib/notifications.ts: Resend email dispatch
- lib/stripe.ts: Stripe Checkout + portal helpers
- db/schema.ts: users, alerts, priceChecks, notifications tables
- db/index.ts: lazy Neon HTTP drizzle client
- app/api/alerts/route.ts: GET/POST alerts (plan-gated)
- app/api/alerts/[id]/route.ts: GET/PATCH/DELETE single alert
- app/api/internal/check/route.ts: poller endpoint
- app/api/webhooks/stripe/route.ts: Stripe webhooks
- app/(dashboard)/dashboard/page.tsx: alert list
- app/(dashboard)/account/page.tsx: plan + billing
- app/(auth)/sign-in, sign-up: Clerk auth pages
- app/page.tsx: landing page
- poller/index.js: standalone Node.js poller for lin TX

## Build Fixes
- drizzle.config.ts → .mjs (excluded from TS build)
- db/index.ts: lazy initialization to avoid build-time connection
- lib/stripe.ts: lazy Stripe client
- lib/notifications.ts: lazy Resend client

## Pending
- Sentry integration
- UptimeRobot setup
- DNS + soft launch
