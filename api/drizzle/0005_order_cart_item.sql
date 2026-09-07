ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "cart_item_id" uuid;

DO $$ BEGIN
  ALTER TABLE "order_items" ADD CONSTRAINT "order_items_cart_item_id_cart_items_id_fk" FOREIGN KEY ("cart_item_id") REFERENCES "cart_items"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
