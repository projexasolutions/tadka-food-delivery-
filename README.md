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
- Added Drizzle configuration and initial PostgreSQL schema foundation.
- Added PostgreSQL connection pooling.
- Added Zod request validation.
- Added the first Node REST module for restaurant discovery.
- Added API health checking.
- Added environment documentation.
- Added GitHub Actions verification for dependency installation, typechecking and frontend builds.

### Next phases

1. Replace Supabase restaurant/menu/cart access with REST modules.
2. Implement server-side sessions and Argon2id authentication.
3. Migrate order, delivery, review and notification workflows.
4. Integrate Razorpay through trusted server-side payment flows/webhooks.
5. Complete Tailwind/design-system migration without changing the approved TADKA visual language.
6. Add Vitest unit coverage and Playwright end-to-end coverage.
7. Remove all Supabase packages, routes and environment variables.
8. Deploy the web app and API to dedicated cloud infrastructure.
