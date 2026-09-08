# TADKA — Food Delivery Platform

TADKA is a production-oriented food-delivery platform focused on a clean customer experience and a modular backend architecture.

## Engineering stack

- **Web:** Next.js, React, TypeScript
- **Styling:** Tailwind CSS (migration in progress)
- **API:** Node.js, TypeScript, Express REST API
- **Database:** PostgreSQL
- **ORM:** Drizzle ORM
- **Validation:** Zod
- **Authentication:** Server-side sessions + Argon2id
- **Payments:** Razorpay
- **Storage:** S3-compatible object storage
- **Testing:** Vitest + Playwright
- **CI/CD:** GitHub Actions
- **Deployment:** Dedicated cloud hosting

## Architecture

The application uses a modular-monolith architecture. The former Supabase client and Supabase dependency have been removed from the application.

```text
TADKA
├── Next.js web application
├── Node.js REST API
├── PostgreSQL + Drizzle
├── Session-based authentication
├── Razorpay payment gateway
└── S3-compatible media storage
```

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and configure the database/API values.
3. Run `npm run db:migrate` against the configured PostgreSQL database.
4. Start the web app with `npm run dev`.
5. Start the API with `npm run dev:api`.
6. Run `npm run typecheck`, `npm run test` and `npm run test:e2e` before opening a pull request.

## Migration status

### Feature implementation complete

- TypeScript, Next.js and Express foundation with strict typechecking.
- PostgreSQL/Drizzle schema, connection pooling and idempotent migrations.
- Restaurant discovery and menu APIs with Zod validation.
- Argon2id authentication, opaque server-side sessions and secure cookies.
- Authenticated cart with single-restaurant enforcement and concurrency protection.
- Transactional checkout/order creation with server-calculated totals and historical item snapshots.
- Razorpay order creation, HMAC payment verification and raw-body webhook verification with duplicate-request protection.
- Admin role management, restaurant controls, category management and explicit order-state transitions.
- Restaurant-staff scoped menu, category and order operations.
- Rider delivery assignment and rider status workflow (`assigned → accepted → picked_up → delivered`).
- Customer reviews restricted to delivered orders, with one review per order.
- Restaurant review management and operational notification feeds.
- Customer profile editing through the authenticated API.
- Legacy Supabase browser/client dependencies and data access removed.
- Playwright customer smoke tests wired into GitHub Actions.
- Production web/API container definitions and dedicated-cloud deployment runbook.

## Release checklist

The product feature set is complete. Before declaring the hosted environment production-ready:

1. Run and verify all database migrations against the production PostgreSQL instance.
2. Regenerate and commit `package-lock.json` from the current `package.json` in a networked Node environment.
3. Expand Playwright coverage for authenticated checkout, payment and role-specific workflows.
4. Configure production secrets, S3 storage, Razorpay production keys/webhook, TLS, backups and monitoring on dedicated cloud hosting.
5. Perform a final production security/performance review and live smoke test.

See `docs/PRODUCTION_DEPLOYMENT.md` for the deployment procedure.

## Payment configuration

The server requires `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET`. The browser receives only the public `NEXT_PUBLIC_RAZORPAY_KEY_ID`.

Configure the Razorpay webhook endpoint as:

`POST /v1/payments/razorpay/webhook`

Use the webhook secret configured in `RAZORPAY_WEBHOOK_SECRET`.
