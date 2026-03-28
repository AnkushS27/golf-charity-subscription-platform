# Fairway Forward

Subscription golf platform with monthly score-based prize draws and charity contributions.

## Tech Stack

- Next.js 16 App Router
- TypeScript strict mode
- NextAuth (Auth.js) credentials auth
- Prisma + PostgreSQL
- Tailwind CSS
- Vercel Blob (winner proof uploads)
- Resend (email notifications)
- Pino (structured logging)
- Vitest (domain tests)

## Core Features

- Subscriber signup/login and protected dashboards
- Subscription lifecycle with mock payment success/failure simulation
- Rolling latest-5 Stableford score retention
- Monthly draw simulation and publish workflows
- Prize split logic (40/35/25) and 5-match rollover support
- Charity contributions and independent donations
- Winner proof upload, admin verification, payout status updates
- Notification and audit event recording for sensitive operations

## Local Setup

1. Install dependencies

```bash
pnpm install
```

2. Configure environment

```bash
copy .env.example .env
```

Fill all required values in .env:

- DATABASE_URL
- AUTH_SECRET
- RESEND_API_KEY
- BLOB_READ_WRITE_TOKEN
- APP_BASE_URL
- LOG_LEVEL

3. Generate Prisma client and apply migrations

```bash
pnpm prisma:generate
pnpm prisma:migrate
```

4. Seed demo data

```bash
pnpm prisma:seed
```

5. Run locally

```bash
pnpm dev
```

## Quality Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
```

## Project Structure

- app/(auth): login/signup UI
- app/(user): subscriber dashboard
- app/(admin): admin operations and reporting
- app/actions: server actions for business workflows
- lib/domain: pure business logic (draw, scoring, winners, prize pool)
- lib/ops: audit + notification event helpers
- lib/validation: Zod input schemas
- prisma: schema and seed data
- tests/domain: domain-level unit tests

## Operational Notes

- Middleware enforces authentication for non-public routes.
- Notifications are always persisted in the database. Email delivery is best-effort and failures are logged.
- Audit events are written for draw simulation/publish, subscription changes, donation creation, winner verification, and payout updates.

## Admin Reporting APIs

- GET /api/admin/reports/summary: JSON snapshot of users, subscriptions, verification/payout queues, totals, and latest draw info.
- GET /api/admin/reports/charities-csv: downloadable CSV export of charity impact totals.

Both endpoints require an authenticated admin session.

## Deployment Readiness Checklist

1. Provision PostgreSQL and set DATABASE_URL.
2. Set AUTH_SECRET for NextAuth session signing.
3. Add Resend API key and verified sender domain.
4. Add Vercel Blob token.
5. Run Prisma migrations in target environment.
6. Seed initial plan and charity data.
7. Run lint, typecheck, and tests in CI before promotion.
