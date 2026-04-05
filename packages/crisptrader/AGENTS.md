# AGENTS.md — CrispTrader

## Project
Price alert engine for precious metals stackers. Users set threshold rules on gold, silver,
platinum, or palladium spot price and receive an email when the price crosses their target.

## Stack
- Framework: Next.js 14 (App Router)
- Database: Postgres (Neon)
- ORM: Drizzle ORM
- Auth: Clerk
- Payments: Stripe (Checkout + Customer Portal)
- Email: Resend
- Hosting: Vercel
- Error tracking: Sentry
- Poller: Node.js service on lin TX (Linode VPS), calls /api/internal/check on a 5-min cron
- Metals data: Metals.dev API (spot prices, 60s max delay)

## Repo Layout
```
crisptrader/
├── app/                        # Next.js App Router
│   ├── (auth)/                 # Clerk auth routes
│   ├── (dashboard)/            # Protected app routes
│   │   ├── dashboard/          # Alert list + status
│   │   └── account/            # Plan + billing management
│   ├── api/
│   │   ├── internal/
│   │   │   └── check/          # POST — poller calls this; protected by INTERNAL_POLLER_SECRET
│   │   └── webhooks/
│   │       └── stripe/         # Stripe webhook handler
│   └── page.tsx                # Landing page (public)
├── components/                 # Shared UI components
├── db/
│   ├── schema.ts               # Drizzle schema
│   └── index.ts                # DB client
├── lib/
│   ├── metals.ts               # Metals.dev API client
│   ├── evaluator.ts            # Alert evaluation logic (edge-triggered)
│   ├── notifications.ts        # Resend email dispatch
│   └── stripe.ts               # Stripe helpers
├── poller/                     # Standalone Node.js poller — deployed to lin TX, NOT to Vercel
│   ├── index.js                # Entry point — runs on 5-min interval via systemd
│   └── package.json
├── drizzle/                    # Drizzle migrations
├── .env.example                # All required env vars documented here
├── AGENTS.md                   # This file
├── STATE.md                    # Sprint checkpoint
└── DECISIONS.md                # Architectural decisions log
```

## Environment Variables
All secrets are lazy-loaded from .env.local — never hardcoded. If a required variable is
missing at runtime, the app must throw with a clear error referencing .env.example.

See .env.example for all required variables and where to get them.

## Branching
- main → staging → feature/[name]
- PRs to staging only. Never push to main directly.
- Joe merges staging → main for production deploys.

## QA
- Smoke QA runs on the Vercel staging preview URL after each slice merge.
- Report failures to Joe. Do not auto-fix unless Joe explicitly enables the recursive loop.
- Every slice must pass: lint clean, no TypeScript errors, core flow works in browser.

## Deploy
- Push feature branch → open PR to staging → Vercel preview URL generated automatically.
- Merge to staging → Vercel deploys staging environment.
- Joe merges staging → main for production.
- Poller (poller/) is deployed manually to lin TX via scp + systemd. It is NOT a Vercel deployment.

## Non-Scope (entire sprint — do not implement under any circumstances)
- SMS notifications
- Discord / Slack / Telegram webhooks
- Dealer product price alerts (premium-over-spot) — this is v2
- Price history charts
- Portfolio tracking
- Mobile app or PWA
- Multiple notification channels per alert
- Browser extension
- Any feature not explicitly listed in the active slice's done conditions

## Decisions
Log all architectural decisions in DECISIONS.md with date and one-line rationale.
Joe reviews at slice boundaries, not during build. When in doubt, make a decision, log it, continue.
