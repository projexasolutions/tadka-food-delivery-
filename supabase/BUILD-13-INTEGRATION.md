# Supabase Integration — Build 13

## Fresh project

1. Create a Supabase project.
2. In **SQL Editor**, run `migrations/0001_initial.sql`.
3. Then run `migrations/0002_demo_seed.sql` if demo restaurants/menu are wanted.
4. In the project's API settings, copy the project URL and publishable/anon key.
5. Put them in `.env.local` using `.env.example` as the template.
6. Restart the Next.js dev server after changing environment variables.

## Existing project

Do **not** blindly rerun the fresh migration. Keep the existing Build 2–11 SQL history and apply only the missing/hardening scripts appropriate to the current database.

## Authentication

Email/password signup is already wired in the app. New auth users receive a `profiles` row through the `handle_new_user` trigger.

For production, enable email confirmation and configure the Supabase Auth email settings before launch.

## Storage

When real food/restaurant images are added, create a Storage bucket such as `food-images` and add RLS policies that allow public reads and authenticated restaurant/admin uploads only.

## Important

This build prepares the database/migration and environment wiring. It does **not** connect to or modify a real Supabase project from this package automatically.
