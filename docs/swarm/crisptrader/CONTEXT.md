# CrispTrader Context

## Project Info
- Package: @cyguin/crisptrader
- Type: Price alert engine for precious metals

## Spec Summary
- Spot price alerts for gold, silver, platinum, palladium
- Edge-triggered evaluation (crossing, not level)
- Email via Resend
- Poller on lin TX → hits Vercel API
- Stripe for billing (Free/Stacker/Vault tiers)

## Stack
- Next.js 14, Postgres (Neon), Drizzle ORM, Clerk, Stripe, Resend
- Metals.dev for spot prices

## Key Decisions (Research Phase)

1. **Metals.dev API** — Free tier 100 req/month, API key as query param, metal codes: gold/silver/platinum/palladium
2. **Edge-triggered evaluation** — Fire on crossing threshold, not level. Snooze 4 hours after firing.
3. **Poller separation** — Runs on lin TX via systemd, calls /api/internal/check on Vercel
4. **Lazy DB/Resend/Stripe init** — Build-time env vars not available, use lazy initialization
5. **Plan limits** — Free: 3 alerts/15min poll, Stacker: 25/5min, Vault: unlimited/1min
