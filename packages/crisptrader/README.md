# CrispTrader

Price alert engine for precious metals stackers. Get emailed when gold, silver, platinum, or palladium hits your target price.

## Quick Start

```bash
cd packages/crisptrader
cp .env.example .env.local
# Fill in your API keys
npm install
npm run dev
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Postgres (Neon) + Drizzle ORM
- **Auth**: Clerk
- **Payments**: Stripe
- **Email**: Resend
- **Data**: Metals.dev API

## How It Works

1. User creates an alert: "Email me when gold drops below $1,900"
2. Poller (runs on lin TX) fetches spot prices every 5 minutes
3. When price **crosses** the threshold, email is sent
4. Alert snoozes for 4 hours to prevent spam

## Features

- Spot price alerts for gold, silver, platinum, palladium
- Edge-triggered evaluation (crossing, not level)
- 4-hour snooze after firing
- Three tiers: Free (3 alerts), Stacker ($9/mo), Vault ($19/mo)
- Stripe billing with customer portal

## Project Structure

```
packages/crisptrader/
├── app/
│   ├── (auth)/              # Clerk auth
│   ├── (dashboard)/         # Protected routes
│   │   ├── dashboard/       # Alert list
│   │   └── account/         # Plan + billing
│   ├── api/
│   │   ├── alerts/         # Alert CRUD
│   │   ├── internal/check/  # Poller endpoint
│   │   └── webhooks/stripe/ # Stripe webhooks
│   └── page.tsx            # Landing page
├── lib/
│   ├── metals.ts           # Metals.dev client
│   ├── evaluator.ts        # Alert evaluation logic
│   ├── notifications.ts     # Resend email
│   └── stripe.ts           # Stripe helpers
├── db/
│   └── schema.ts           # Drizzle schema
└── poller/               # Standalone Node.js poller (lin TX)
```

## Environment Variables

See `.env.example` for all required variables:

- `DATABASE_URL` — Neon Postgres connection string
- `CLERK_SECRET_KEY` — Clerk auth
- `STRIPE_SECRET_KEY` — Stripe payments
- `RESEND_API_KEY` — Email delivery
- `METALS_DEV_API_KEY` — Spot prices
- `INTERNAL_POLLER_SECRET` — Shared secret for poller → Vercel

## Deployment

- **App**: Vercel (push to staging → merge to main)
- **Poller**: Lin TX via systemd (manual deploy)

See `poller/README.md` for systemd setup.

---

## Signoff

**Status**: ✅ Signed Off  
**Date**: 2026-04-04  
**Commit**: `886d16a`  
**Build**: `npm run build` passes  
**QA**: TypeScript clean, all acceptance criteria implemented
