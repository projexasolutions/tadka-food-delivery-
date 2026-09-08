# TADKA production deployment

TADKA is designed to run as a modular monolith on dedicated cloud infrastructure.

## Services

Run these as separate processes/containers on the same host initially:

- Next.js web: port 3000 (`Dockerfile.web`)
- Node API: port 4000 (`Dockerfile.api`)
- PostgreSQL: managed PostgreSQL is preferred
- S3-compatible object storage for media

Put a TLS reverse proxy in front of the web/API services. Only ports 80/443 should be publicly exposed; PostgreSQL should remain private.

## Required environment

Start from `.env.example`. In production configure at minimum:

- `NODE_ENV=production`
- `NEXT_PUBLIC_API_URL=https://api.<your-domain>`
- `WEB_ORIGIN=https://<your-domain>`
- `TRUST_PROXY=true` when the API is behind a trusted reverse proxy
- `DATABASE_URL`
- `SESSION_TTL_DAYS`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- S3-compatible storage variables when media uploads are enabled

Use a secrets manager or the hosting provider's encrypted environment variables. Never commit production secrets.

## Database release procedure

1. Take a database backup/snapshot.
2. Deploy the API image/code.
3. Run `npm run db:migrate` once against the production database.
4. Confirm the migration runner completes successfully.
5. Start/restart the API and verify `/health`.
6. Deploy the web application.
7. Run the Playwright smoke suite against the deployed web URL.

The migration runner uses an advisory lock so concurrent application instances do not execute the same migration simultaneously.

## Razorpay

Configure the webhook endpoint at:

`POST https://api.<your-domain>/v1/payments/razorpay/webhook`

Use the exact same webhook secret in `RAZORPAY_WEBHOOK_SECRET`. Keep the webhook route before JSON parsing so the raw request body remains available for signature verification.

## Operational checklist

- TLS certificate active and auto-renewing
- PostgreSQL backups enabled and restore procedure tested
- API and web health checks configured
- CPU, memory, disk and database connection monitoring enabled
- Application logs retained with secrets/credentials excluded
- Razorpay webhook delivery monitored
- Database migrations backed up and applied before dependent application code
- Firewall exposes only required public ports
- Non-production credentials removed from production
- Error pages do not expose stack traces
