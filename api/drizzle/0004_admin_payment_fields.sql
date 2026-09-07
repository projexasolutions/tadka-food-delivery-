ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "restaurant_id" uuid;

DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "razorpay_order_id" text;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "razorpay_payment_id" text;

CREATE UNIQUE INDEX IF NOT EXISTS "orders_razorpay_order_id_idx" ON "orders" ("razorpay_order_id") WHERE "razorpay_order_id" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "orders_razorpay_payment_id_idx" ON "orders" ("razorpay_payment_id") WHERE "razorpay_payment_id" IS NOT NULL;
