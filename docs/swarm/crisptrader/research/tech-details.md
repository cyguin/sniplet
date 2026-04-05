# CrispTrader — Technical Implementation Details

## Project Context
- **App**: Price alert engine for precious metals stackers
- **Tables**: users (Clerk-managed), alerts, price_checks, notifications
- **Stack**: Next.js 14 App Router, Neon Postgres, Drizzle ORM, Clerk Auth, Stripe, Resend

---

## 1. Neon + Drizzle ORM Best Practices

### Connection String Format

The Neon connection string follows this pattern:
```
postgresql://[user]:[password]@[neon_hostname]/[dbname]?sslmode=require&channel_binding=require
```

From `.env.example`:
```env
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/crisptrader?sslmode=require
```

### SSL Configuration

Neon requires SSL. The `?sslmode=require` query parameter is essential. For additional safety in production:
```env
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/crisptrader?sslmode=require&channel_binding=require
```

### Driver Selection

For serverless environments (Vercel), use the **Neon HTTP driver**:
```bash
npm install drizzle-orm @neondatabase/serverless dotenv
npm install -D drizzle-kit tsx
```

### DB Client Setup

```typescript
// packages/crisptrader/db/index.ts
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```

### Connection Pooling for Serverless

Neon's serverless HTTP driver handles connection pooling automatically. For WebSocket connections (long-running processes), use the pool:

```typescript
// packages/crisptrader/db/index.ts (alternative for non-edge)
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Required for Node.js < v22
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
export const db = drizzle(pool);
```

### Multi-Branch Setup (Dev/Staging/Prod)

```typescript
// packages/crisptrader/db/index.ts
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const getBranchUrl = () => {
  const env = process.env.NODE_ENV;
  if (env === 'development') return process.env.DEV_DATABASE_URL;
  if (env === 'test') return process.env.TEST_DATABASE_URL;
  return process.env.DATABASE_URL;
};

const sql = neon(getBranchUrl()!);
export const db = drizzle(sql);
```

### Drizzle Config

```typescript
// drizzle.config.ts
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

export default defineConfig({
  schema: './packages/crisptrader/db/schema.ts',
  out: './packages/crisptrader/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
```

### Schema Definition

```typescript
// packages/crisptrader/db/schema.ts
import { pgTable, text, numeric, boolean, timestamp, varchar, uuid } from 'drizzle-orm/pg-core';

// Users table (syncs from Clerk via webhook)
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkId: text('clerk_id').unique().notNull(),
  email: text('email').notNull(),
  plan: varchar('plan', { length: 20 }).default('free').notNull(), // free, stacker, vault
  stripeCustomerId: text('stripe_customer_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Alerts table
export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  metal: varchar('metal', { length: 3 }).notNull(), // XAU, XAG, XPT, XPD
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  threshold: numeric('threshold', { precision: 12, scale: 2 }).notNull(),
  direction: varchar('direction', { length: 10 }).notNull(), // above, below
  active: boolean('active').default(true).notNull(),
  lastSpot: numeric('last_spot', { precision: 12, scale: 2 }),
  lastCheckedAt: timestamp('last_checked_at'),
  lastFiredAt: timestamp('last_fired_at'),
  snoozeUntil: timestamp('snooze_until'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Price checks (idempotent logging)
export const priceChecks = pgTable('price_checks', {
  id: uuid('id').primaryKey().defaultRandom(),
  metal: varchar('metal', { length: 3 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('USD').notNull(),
  spotPrice: numeric('spot_price', { precision: 12, scale: 2 }).notNull(),
  observedAt: timestamp('observed_at').defaultNow().notNull(),
  payloadHash: text('payload_hash').unique().notNull(),
});

// Notifications
export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  alertId: uuid('alert_id').references(() => alerts.id).notNull(),
  channel: varchar('channel', { length: 20 }).notNull(), // email, webhook
  status: varchar('status', { length: 20 }).notNull(), // pending, sent, failed
  sentAt: timestamp('sent_at'),
  error: text('error'),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;
export type PriceCheck = typeof priceChecks.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
```

### Migrations

```bash
# Generate migrations
npm run db:generate

# Apply migrations
npm run db:migrate

# Push schema (dev only - bypasses migrations)
npm run db:push
```

---

## 2. Clerk + Next.js App Router Best Practices

### Environment Variables

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### Middleware Setup

Create `middleware.ts` in the project root (or `src/middleware.ts` if using src directory):

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/account(.*)',
  '/api/alerts(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

**Key points**:
- `clerkMiddleware()` from `@clerk/nextjs/server` (NOT `authMiddleware` from `@clerk/nextjs`)
- `auth.protect()` redirects to sign-in if unauthenticated
- The matcher excludes static files and Next.js internals

### ClerkProvider Setup

```typescript
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### Server Components Getting User ID

Use the `auth()` helper in Server Components and Route Handlers:

```typescript
// app/dashboard/page.tsx
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { alerts, users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function DashboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  // Get user's alerts
  const userAlerts = await db
    .select()
    .from(alerts)
    .where(eq(alerts.userId, userId));
  
  return (
    <div>
      <h1>Your Alerts</h1>
      {/* render alerts */}
    </div>
  );
}
```

### Alternative: Using userId directly

```typescript
// For pages that just need the userId
import { auth, currentUser } from '@clerk/nextjs/server';

export default async function Page() {
  const { userId } = await auth();
  const user = await currentUser();
  
  // user has full user object with email, name, etc.
  console.log(user?.emailAddresses[0]?.emailAddress);
  
  return <div>Hello, {userId}</div>;
}
```

### Protected Route Patterns

#### Pattern 1: Middleware protection (recommended for entire routes)

```typescript
// middleware.ts - protects all /dashboard routes
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)']);
```

#### Pattern 2: Inline protection in Server Components

```typescript
// app/dashboard/page.tsx
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }
  
  return <Dashboard userId={userId} />;
}
```

#### Pattern 3: Using protect() for authorization checks

```typescript
// app/account/page.tsx
import { auth } from '@clerk/nextjs/server';

export default async function AccountPage() {
  const { userId, protect } = await auth();
  
  // Check for specific role/permission
  protect({ role: 'org:admin' });
  
  return <AccountSettings userId={userId} />;
}
```

### Clerk Webhook Handling

#### 1. Set up webhook endpoint in Clerk Dashboard

Go to Clerk Dashboard > Webhooks > Add Endpoint:
- URL: `https://your-domain.com/api/webhooks/clerk`
- Events: `user.created`, `user.updated`, `user.deleted`
- Copy the signing secret

#### 2. Webhook handler with signature verification

```typescript
// app/api/webhooks/clerk/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhook } from '@clerk/backend/webhooks';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const evt = await verifyWebhook(request, {
      signingSecret: process.env.CLERK_WEBHOOK_SECRET!,
    });
    
    const eventType = evt.type;
    const { id, email_addresses, primary_email_address_id } = evt.data;
    
    if (eventType === 'user.created') {
      // Find primary email
      const primaryEmail = email_addresses.find(
        (email: { id: string }) => email.id === primary_email_address_id
      );
      
      // Sync user to your database
      await db.insert(users).values({
        clerkId: id,
        email: primaryEmail?.email_address || '',
        plan: 'free',
      }).onConflictDoNothing();
    }
    
    if (eventType === 'user.updated') {
      const primaryEmail = email_addresses.find(
        (email: { id: string }) => email.id === primary_email_address_id
      );
      
      await db.update(users)
        .set({ email: primaryEmail?.email_address || '' })
        .where(eq(users.clerkId, id));
    }
    
    if (eventType === 'user.deleted') {
      await db.delete(users).where(eq(users.clerkId, id));
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json(
      { error: 'Webhook verification failed' },
      { status: 400 }
    );
  }
}
```

#### 3. Environment variable for webhook secret

```env
CLERK_WEBHOOK_SECRET=whsec_...
```

### Auth Helper Reference

| Helper | Location | Use Case |
|--------|----------|----------|
| `auth()` | `@clerk/nextjs/server` | Server Components, Route Handlers, Server Actions |
| `currentUser()` | `@clerk/nextjs/server` | Get full user object |
| `clerkMiddleware()` | `@clerk/nextjs/server` | Middleware protection |
| `verifyWebhook()` | `@clerk/backend/webhooks` | Webhook signature verification |
| `<ClerkProvider>` | `@clerk/nextjs` | Client-side provider |
| `<SignInButton>` | `@clerk/nextjs` | UI component |
| `<UserButton>` | `@clerk/nextjs` | UI component |

### Auth Object Properties

```typescript
const { 
  userId,        // Current user's ID
  isAuthenticated, // Boolean
  isSignedIn,    // Boolean (alias for isAuthenticated)
  protect,       // Function to enforce auth/roles
  redirectToSignIn, // Function to redirect
  getToken,      // Get JWT session token
} = await auth();
```

---

## 3. CrispTrader-Specific Implementation

### Alert CRUD with User Context

```typescript
// app/api/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/db';
import { alerts } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userAlerts = await db
    .select()
    .from(alerts)
    .where(eq(alerts.userId, userId));
  
  return NextResponse.json(userAlerts);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const body = await request.json();
  const { metal, currency, threshold, direction } = body;
  
  // Check plan limits
  const user = await db.select().from(users).where(eq(users.clerkId, userId));
  const alertCount = await db.select().from(alerts).where(eq(alerts.userId, userId));
  
  const limits = { free: 3, stacker: 25, vault: Infinity };
  const plan = user.plan || 'free';
  
  if (alertCount.length >= limits[plan]) {
    return NextResponse.json({ error: 'Alert limit reached' }, { status: 403 });
  }
  
  const [newAlert] = await db.insert(alerts).values({
    userId: user.id,
    metal,
    currency: currency || 'USD',
    threshold,
    direction,
  }).returning();
  
  return NextResponse.json(newAlert, { status: 201 });
}
```

### Internal API (Poller) Protection

```typescript
// app/api/internal/check/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expectedSecret = process.env.INTERNAL_POLLER_SECRET;
  
  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Process price check and evaluate alerts
  // ...
  
  return NextResponse.json({ success: true });
}
```

### Stripe Webhook Handler

```typescript
// app/api/webhooks/stripe/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = headers();
  const signature = headersList.get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const customerId = session.customer as string;
    const plan = session.metadata?.plan || 'stacker';
    
    await db.update(users)
      .set({ 
        stripeCustomerId: customerId,
        plan,
      })
      .where(eq(users.stripeCustomerId, customerId));
  }
  
  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;
    // Handle plan changes
  }
  
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    await db.update(users)
      .set({ plan: 'free' })
      .where(eq(users.stripeCustomerId, subscription.customer as string));
  }
  
  return NextResponse.json({ success: true });
}
```

---

## 4. Key Files Structure

```
packages/crisptrader/
├── middleware.ts                    # Clerk middleware
├── app/
│   ├── layout.tsx                   # ClerkProvider wrapper
│   ├── (auth)/
│   │   ├── sign-in/[[...sign-in]]/page.tsx
│   │   └── sign-up/[[...sign-up]]/page.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx       # Protected - alert list
│   │   └── account/page.tsx         # Protected - billing
│   ├── api/
│   │   ├── alerts/route.ts          # Protected CRUD
│   │   ├── internal/check/route.ts  # Poller endpoint
│   │   └── webhooks/
│   │       ├── clerk/route.ts        # Clerk user sync
│   │       └── stripe/route.ts       # Subscription events
│   └── page.tsx                     # Public landing
├── db/
│   ├── index.ts                     # Drizzle client
│   └── schema.ts                    # Table definitions
└── drizzle/                         # Migrations
```

---

## 5. Summary

### Neon + Drizzle
- Use `neon-http` driver for serverless (Vercel)
- SSL is required: `?sslmode=require`
- Connection string from Neon console
- Migrations via `drizzle-kit`

### Clerk + Next.js
- Use `clerkMiddleware()` in `middleware.ts`
- Use `auth()` helper in Server Components
- Protect routes via middleware or inline `auth.protect()`
- Webhooks require signature verification via `verifyWebhook()`
- Sync users to DB via `user.created` webhook

### CrispTrader Flow
1. User signs up via Clerk -> `user.created` webhook creates DB record
2. User creates alerts (plan-gated)
3. Poller hits `/api/internal/check` every 5 min
4. Evaluator checks alerts against spot prices
5. Matching alerts fire via Resend, then snooze
6. Stripe webhooks handle plan changes
