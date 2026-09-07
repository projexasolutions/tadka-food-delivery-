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
├── Payment gateway integration
└── S3-compatible media storage
```

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and configure the database/API values.
3. Start the web app with `npm run dev`.
4. Start the API with `npm run dev:api`.
5. Run `npm run typecheck` before opening a pull request.

## Migration status

The current repository contains legacy Supabase code from the MVP. Supabase is **not part of the target architecture** and will be removed module-by-module after equivalent API/database behavior is in place.

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
- Added a validated `GET /v1/restaurants/:restaurantId/menu` API.
- Kept unavailable restaurants and menu items out of customer-facing results.
- Replaced the restaurant listing page's direct Supabase query with the REST API.
- Replaced the menu page's direct Supabase reads with the REST API.
- Added abort handling so navigation does not leave stale restaurant/menu requests updating UI state.
- Kept cart mutation on the legacy path temporarily because secure session authentication is not migrated yet.

### Phase 3 completed

- Added Zod validation for signup and login payloads.
- Added Argon2id password hashing and verification.
- Added opaque server-side sessions with configurable 30-day expiry.
- Added HttpOnly, SameSite=Lax session cookies with Secure enabled in production.
- Added `POST /v1/auth/signup`, `POST /v1/auth/login`, `GET /v1/auth/me` and `POST /v1/auth/logout`.
- Added authenticated request middleware for future protected modules.
- Added an Origin guard for state-changing API requests when `WEB_ORIGIN` is configured.
- Migrated the customer auth page off Supabase and onto the API session flow.
- Added unit coverage for session cookie helpers.
- Google OAuth remains intentionally deferred until the password/session foundation is stable.

### Next phases

1. Migrate cart reads/writes behind authenticated API endpoints and remove its Supabase dependency.
2. Migrate order, delivery, review and notification workflows.
3. Integrate Razorpay through trusted server-side payment flows/webhooks.
4. Complete Tailwind/design-system migration without changing the approved TADKA visual language.
5. Add broader Vitest unit coverage and Playwright end-to-end coverage.
6. Remove all Supabase packages, routes and environment variables after every dependency is migrated.
7. Deploy the web app and API to dedicated cloud infrastructure.
