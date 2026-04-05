# CrispTrader — Architectural Decisions

## 2026-04-04

- **Decision**: Use Metals.dev API for spot prices.
  - Free tier available, no cost for low-frequency polling. JSON API, simple fetch. 60s max delay is acceptable for this use case. No scraping needed.

- **Decision**: Edge-triggered evaluation (fire on price crossing, not level-check).
  - An alert fires when the price crosses the user's target threshold. It does NOT re-fire on every poll while the price remains above/below the target. This prevents alert spam and keeps noise minimal.

- **Decision**: Poller runs on lin TX via systemd (not Vercel Cron).
  - Vercel Hobby plan does not include Cron jobs. Vercel Pro is $20/mo. A $6/mo Linode VPS handles the polling cheaper and with full control. Systemd timer ensures reliable 5-minute intervals with auto-restart on failure.

- **Decision**: Snooze 4 hours after firing to prevent re-fire spam.
  - After an alert fires and the user receives an email, the system snoozes that alert for 4 hours. If the price moves back across the threshold within 4 hours, the alert does not re-fire. This is intentional to prevent spam while still allowing re-firing if the price leaves and re-enters the zone.

- **Decision**: Plan limits enforced at alert creation time.
  - Alert count limits (Free: 2 alerts, Paid: 20 alerts) are enforced when the user creates the alert, not on the poller side. No need to count during every poll cycle — just reject creation if the user has reached their limit.