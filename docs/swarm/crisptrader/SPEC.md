# CrispTrader — Spec

## What You're Building

Price alert engine for precious metals stackers. Set a threshold on gold, silver, platinum, or palladium spot price. Get emailed when it crosses. V2 adds dealer product alerts with total cost including premium and shipping.

## Problem

Precious metals stackers miss price dips while at work. They check spot price manually or rely on noisy apps. No simple "email me when gold hits $X" tool exists without expensive subscriptions.

## Target Users

- Precious metals stackers (gold, silver, platinum, palladium)
- Reddit communities: r/Silverbugs (260k), r/gold (180k), r/pmsforsale
- Dollar-cost-averaging investors who want dip alerts

## Core Features

### Alert Types
- **Spot price alerts**: Gold (XAU), Silver (XAG), Platinum (XPT), Palladium (XPD)
- **Threshold direction**: above or below target price
- **Edge-triggered evaluation**: fire on crossing, not on level

### Alert Evaluation Logic
```
For each active alert:
1. Skip if snoozed (snooze_until > now)
2. Check if crossed:
   - below: last_spot > threshold && current <= threshold
   - above: last_spot < threshold && current >= threshold
3. If crossed → fire notification, set snooze (4hrs default)
4. Always update last_spot and last_checked_at
```

### Snooze / Re-fire Prevention
- After firing, alert snoozes for 4 hours (configurable per plan)
- Prevents spam while price sits below threshold

### Pricing Tiers
| Plan | Alerts | Poll Interval | Channels | Price |
|------|--------|---------------|----------|-------|
| Free | 3 | 15 min | Email only | $0 |
| Stacker | 25 | 5 min | Email + webhook | $9/mo |
| Vault | Unlimited | 1 min | Email + webhook + dealer deals (v2) + daily digest | $19/mo |

Frame: "Less than a silver round" — 1oz silver round is $32-35. One dip buy caught = paid for 3-4 months.

## Data Source

**Primary**: Metals.dev
- Free tier available
- 60-second max delay documented
- JSON API, no approval process
- API key in hand in < 5 minutes

**Fallback**: Metals-API.com if Metals.dev has rate issues at scale

## Architecture

### Polling Separation
Lin TX runs the poller (not Vercel cron — Hobby tier has limits):
- systemd service on lin TX, hits Metals.dev every 5 min
- POSTs evaluated results to `/api/internal/check` on Vercel
- Protected by `INTERNAL_POLLER_SECRET` header

### Flow
```
lin TX (systemd poller, 5-min interval)
  → fetch spot from Metals.dev
  → POST /api/internal/check (with INTERNAL_POLLER_SECRET)
  → Vercel: evaluate all active alerts against spot
  → fire Resend emails for triggered alerts
  → write price_checks, update last_fired_at
```

## Database Schema

### users (managed by Clerk)
- id, clerk_id, email, plan, stripe_customer_id, created_at

### alerts
- id, user_id
- metal TEXT (XAU | XAG | XPT | XPD)
- currency TEXT (USD | EUR | GBP)
- threshold NUMERIC
- direction TEXT (above | below)
- active BOOLEAN
- last_spot NUMERIC
- last_checked_at TIMESTAMPTZ
- last_fired_at TIMESTAMPTZ
- snooze_until TIMESTAMPTZ
- created_at TIMESTAMPTZ

### price_checks
- id, metal, currency
- spot_price NUMERIC
- observed_at TIMESTAMPTZ
- payload_hash TEXT UNIQUE (idempotency)

### notifications
- id, alert_id, channel TEXT
- status TEXT
- sent_at TIMESTAMPTZ

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router) |
| Database | Postgres (Neon) |
| ORM | Drizzle ORM |
| Auth | Clerk |
| Payments | Stripe (Checkout + Customer Portal) |
| Email | Resend |
| Hosting | Vercel |
| Poller | Node.js on lin TX (systemd) |
| Data | Metals.dev API |
| Errors | Sentry |

## API Endpoints

### Public (auth required)
- `POST /api/alerts` — Create alert
- `GET /api/alerts` — List user's alerts
- `PATCH /api/alerts/[id]` — Update alert
- `DELETE /api/alerts/[id]` — Delete alert

### Internal (poller only)
- `POST /api/internal/check` — Poller endpoint, protected by INTERNAL_POLLER_SECRET

### Webhooks
- `POST /api/webhooks/stripe` — Stripe events (checkout.session.completed, customer.subscription.updated/deleted)

## Non-Scope (do not implement)
- SMS notifications
- Discord / Slack / Telegram webhooks
- Dealer product price alerts (v2 only)
- Price history charts
- Portfolio tracking
- Mobile app or PWA
- Multiple notification channels per alert
- Browser extension

## Two-Week Schedule

| Day | Focus |
|-----|-------|
| 1 | Metals.dev API spike — prove end-to-end quote fetch in 30 min |
| 2-3 | Next.js scaffold, Clerk, Neon DB, schema migrations, alert CRUD |
| 4-5 | Poller service, /api/internal/check, evaluator logic |
| 6 | Resend integration, email template |
| 7-8 | Dashboard (alerts, last spot, last fired), account page |
| 9-10 | Stripe (Checkout + portal), plan gating |
| 11 | Landing page |
| 12 | Sentry, UptimeRobot, smoke QA |
| 13 | DNS live, soft announce to 2-3 people |
| 14 | Reddit posts |

## Acceptance Criteria

- [ ] Metals.dev API returns clean spot prices for XAU, XAG, XPT, XPD
- [ ] User can create, edit, delete alerts (authenticated)
- [ ] Edge-triggered evaluation works correctly
- [ ] Snooze prevents re-fire within 4 hours
- [ ] Email sent via Resend when alert triggers
- [ ] Poller runs on lin TX, calls /api/internal/check every 5 min
- [ ] Stripe Checkout works for plan upgrades
- [ ] Customer portal allows plan changes and cancellation
- [ ] Free tier: 3 alerts max, 15-min poll
- [ ] Stacker tier: 25 alerts, 5-min poll
- [ ] Vault tier: unlimited alerts, 1-min poll
- [ ] Landing page with CTA
- [ ] No spam when price sits below threshold
