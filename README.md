# TripPossible — Week 1 MVP

TripPossible is an AI-powered travel inspiration MVP. The hypothesis: if travelers can compare exactly three budget-valid trip ideas from their real constraints, they will open at least one recommendation, save an alert, or leave feedback that tells us what to build next.

## Architecture

- Next.js App Router, React Server Components by default, small client islands for wizard, analytics, alerts, feedback, and regeneration.
- Server Actions are thin public adapters; all payloads and opaque IDs are revalidated server-side.
- Prisma ORM 7 + PostgreSQL stores requests, recommendations, itinerary days, price-alert signups, feedback, rate limits, and first-party analytics events.
- `RecommendationGenerator` is a port with deterministic mock and OpenAI adapters.
- OpenAI production mode uses the Responses API with `gpt-5.6-terra`, low reasoning, strict structured JSON, server-side validation, and one correction retry.
- Local policy: do **not** run `pnpm build`; Vercel performs the production build.

## Setup

```bash
pnpm install
cp .env.example .env.local
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Required environment variables:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL development/production database URL. |
| `RATE_LIMIT_SECRET` | Long random secret for HMAC hashing client identities. |
| `NEXT_PUBLIC_APP_URL` | Canonical app URL. |
| `OPENAI_API_KEY` | Required when `USE_MOCK_AI=false`. |
| `TEST_DATABASE_URL` | Isolated PostgreSQL URL for integration/E2E tests. |
| `USE_MOCK_AI` | Set to `true` for deterministic local demos and E2E. Defaults to `false`. |

## Commands

- `pnpm dev` — Next dev server with Turbopack.
- `pnpm lint` — ESLint flat config for Next 16.
- `pnpm typecheck` — strict TypeScript verification.
- `pnpm test` / `pnpm test:watch` — Vitest unit/component tests.
- `pnpm test:e2e` — Playwright mock journey; requires migrated PostgreSQL.
- `pnpm db:migrate`, `pnpm db:deploy`, `pnpm db:generate`, `pnpm db:seed`, `pnpm db:studio` — Prisma workflows.
- `pnpm build` — configured for Vercel/CI only; do not run locally under repository policy.

## Mock AI

Set `USE_MOCK_AI=true` to use deterministic recommendations. Seeds and mock generator include the two required scenarios:

1. Mexico City → Oaxaca City, Mérida, San Cristóbal de las Casas.
2. Dallas → Santa Fe, Asheville, Savannah.

Every mock response returns exactly three recommendations and the requested number of itinerary days.

## Validation and resilience

Before any generated trip is persisted, the server validates exactly three recommendations, itinerary length, sequential day numbers, date bounds, matching currency, nonnegative component costs, recomputed totals within 0.01, and total cost not exceeding budget. Invalid AI output is retried once with correction issues; a second failure marks the request `FAILED` without partial recommendation rows.

Generation is claimed with a conditional status update to avoid concurrent duplication. Regeneration keeps current recommendations visible until replacement output validates, then atomically replaces rows. Rate limiting stores HMAC-hashed identities only: three generation attempts per identity per rolling 15 minutes and five per request per 24 hours.

## Analytics

First-party `AnalyticsEvent` rows capture only the MVP event names and non-PII properties: `landing_viewed`, `planner_started`, `request_created`, `recommendations_generated`, `generation_failed`, `recommendation_opened`, `alert_created`, `feedback_submitted`, and `regeneration_requested`. Analytics failures are logged and never block the product action.

## Week 1 limitations

TripPossible provides estimated—not live—prices. It does not book trips, send actual alerts, authenticate users, make visa eligibility claims, or guarantee availability. The next feature should be chosen only after reviewing recommendation openings, feedback, and alert signup signals.

## Verification used in this implementation

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trippossible_dev pnpm db:generate
pnpm typecheck
pnpm lint
pnpm test
```

`pnpm test:e2e` is ready but requires a reachable migrated PostgreSQL database. `pnpm build` was intentionally not run.
