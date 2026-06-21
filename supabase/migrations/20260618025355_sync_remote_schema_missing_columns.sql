ALTER TABLE "public"."variant_specifications" ADD COLUMN IF NOT EXISTS "key" text;
DROP INDEX IF EXISTS "public"."product_variants_product_id_spec_key_key";
