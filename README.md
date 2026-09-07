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

The application is being migrated from the original Supabase-backed MVP to a self-managed modular-monolith architecture. The migration is intentionally incremental so existing customer, restaurant, rider and admin flows are not replaced blindly.

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
3. Start the web app with `npm run dev`.
4. Start the API with `npm run dev:api`.
5. Run `npm run typecheck` before opening a pull request.

## Migration status

The repository still contains legacy Supabase code in modules that have not yet been migrated. Supabase is **not part of the target architecture** and will be removed module-by-module after equivalent API/database behavior is in place.

### Phase 1 completed

- Added TypeScript project configuration.
- Added Drizzle configuration and PostgreSQL schema foundation.
- Added PostgreSQL connection pooling.
- Added Zod request validation.
- Added the first Node REST module for restaurant discovery.
- Added API health checking.
- Added environment documentation.
- Added GitHub Actions verification for dependency installation, typechecking and frontend builds.

### Phase 2 completed

- Added PostgreSQL/Drizzle category and menu-item models.
- Added a validated restaurant-menu API.
- Replaced restaurant and menu customer reads with REST API calls.
- Kept unavailable restaurants and dishes out of customer-facing results.

### Phase 3 completed

- Added Argon2id password hashing and verification.
- Added opaque server-side sessions with configurable expiry.
- Added secure HttpOnly/SameSite session cookies.
- Added signup, login, session lookup and logout endpoints.
- Added authenticated request middleware and state-changing Origin protection.
- Migrated the customer auth page off Supabase.

### Phase 4 completed

- Added authenticated cart APIs backed by PostgreSQL/Drizzle.
- Added quantity validation and item ownership checks.
- Added menu availability checks before cart mutation.
- Migrated menu/cart customer flows off Supabase.

### Phase 5 completed

- Added transactional checkout and order creation.
- Added order and order-item snapshots so historical prices/names are not dependent on mutable menu data.
- Added authenticated order history and single-order APIs.
- Added server-side subtotal, delivery-fee and total calculation.
- Preserved the cart for online orders until payment succeeds.
- Migrated checkout and order-history customer reads/writes to the API.

### Phase 6 in progress — Razorpay

- Added server-created Razorpay Orders using the trusted server amount.
- Added authenticated payment-order creation and payment-signature verification.
- Added raw-body webhook signature verification.
- Added captured/paid/failed payment status handling.
- Added cart clearing only after verified online payment.
- Connected the checkout UI to Razorpay Checkout.

### Remaining phases

7. Complete admin/restaurant operational management and remaining legacy workflows.
8. Production hardening, broader automated testing, final Supabase removal, migrations and dedicated-cloud deployment.

## Payment configuration

The server requires `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET`. The browser receives only the public `NEXT_PUBLIC_RAZORPAY_KEY_ID`.

Configure the Razorpay webhook endpoint as:

`POST /v1/payments/razorpay/webhook`

Use the webhook secret configured in `RAZORPAY_WEBHOOK_SECRET`.
