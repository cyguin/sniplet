# CrispTrader Price Poller — Deployment Guide

## Lin TX Setup

The poller runs as a systemd service on the lin TX (Linode VPS) at `144.172.71.19`.

### 1. Copy poller to server

```bash
rsync -avz --exclude 'node_modules/' \
  /Users/joepro/cyguin/23/packages/crisptrader/poller/ \
  root@144.172.71.19:/opt/crisptrader/poller/
```

### 2. Create `.env` file on server

```bash
# On the server, create /opt/crisptrader/poller/.env
METALS_DEV_API_KEY=your_metals_dev_api_key_here
INTERNAL_POLLER_SECRET=your_internal_poller_secret_here
VERCEL_APP_URL=https://your-staging-or-prod.vercel.app
NODE_ENV=production
```

### 3. Install Node.js (if not present)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version  # should be v20.x
```

### 4. Install dependencies

```bash
cd /opt/crisptrader/poller
npm install  # or copy node_modules from dev machine
```

### 5. Create systemd service and timer

Create `/etc/systemd/system/crisptrader-poller.service`:

```
[Unit]
Description=CrispTrader price poller
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/node /opt/crisptrader/poller/index.js
Restart=always
RestartSec=30
Environment=NODE_ENV=production
EnvironmentFile=/opt/crisptrader/poller/.env

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/crisptrader-poller.timer`:

```
[Unit]
Description=Run CrispTrader price poller every 5 minutes

[Timer]
OnBootSec=30
OnUnitActiveSec=5min
Unit=crisptrader-poller.service

[Install]
WantedBy=timers.target
```

### 6. Enable and start

```bash
systemctl daemon-reload
systemctl enable crisptrader-poller.timer
systemctl start crisptrader-poller.timer

# Verify
systemctl status crisptrader-poller.timer
systemctl list-timers --no-pager | grep crisp
journalctl -u crisptrader-poller.service -f --no-pager
```

### 7. Manual test

```bash
systemctl start crisptrader-poller.service
journalctl -u crisptrader-poller.service -n 50 --no-pager
```

### 8. Restart after code updates

```bash
rsync -avz --exclude 'node_modules/' \
  /Users/joepro/cyguin/23/packages/crisptrader/poller/ \
  root@144.172.71.19:/opt/crisptrader/poller/
systemctl restart crisptrader-poller.service
```