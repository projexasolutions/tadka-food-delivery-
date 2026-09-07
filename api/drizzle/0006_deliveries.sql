CREATE TABLE IF NOT EXISTS "deliveries" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL UNIQUE,
  "rider_id" uuid NOT NULL,
  "status" text DEFAULT 'assigned' NOT NULL,
  "assigned_at" timestamptz DEFAULT now() NOT NULL,
  "picked_up_at" timestamptz,
  "delivered_at" timestamptz,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);
DO $$ BEGIN
  ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_rider_id_users_id_fk" FOREIGN KEY ("rider_id") REFERENCES "users"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS "deliveries_rider_id_idx" ON "deliveries" ("rider_id");
CREATE INDEX IF NOT EXISTS "deliveries_status_idx" ON "deliveries" ("status");
