-- Drop the existing foreign key constraint
ALTER TABLE IF EXISTS "public"."products"
  DROP CONSTRAINT IF EXISTS "products_category_id_fkey";

-- Re-create it with ON DELETE SET NULL
ALTER TABLE "public"."products"
  ADD CONSTRAINT "products_category_id_fkey"
  FOREIGN KEY ("category_id")
  REFERENCES "public"."product_categories"("id")
  ON DELETE SET NULL;
