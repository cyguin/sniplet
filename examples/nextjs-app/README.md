# sniplet example

A minimal Next.js 14 app running `@cyguin/sniplet`.

## Setup

This example uses **Postgres** as the storage adapter (required for Vercel/serverless deployments).

1. Copy `.env.example` to `.env.local` and set your `DATABASE_URL`
2. Run the SQL migration below to create the `sniplet_snips` table

```sql
CREATE TABLE IF NOT EXISTS sniplet_snips (
  id            TEXT PRIMARY KEY,
  content       TEXT NOT NULL,
  language      TEXT,
  expires_at    TIMESTAMPTZ,
  burn_on_read  BOOLEAN DEFAULT FALSE,
  burned_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS sniplet_expires_idx
  ON sniplet_snips(expires_at)
  WHERE expires_at IS NOT NULL;
```

## Run it

```bash
npm install
npm run dev
```

Then visit [http://localhost:3000/snips](http://localhost:3000/snips).

[**Live demo →**](https://sniplet-sand.vercel.app)

