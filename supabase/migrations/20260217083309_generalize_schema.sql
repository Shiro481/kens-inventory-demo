SET search_path TO public;
-- Generalizing the schema for varied automotive parts
BEGIN;

-- 1. Rename tables (if they exist with old names)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bulb_types') THEN
        ALTER TABLE "public"."bulb_types" RENAME TO "variant_categories";
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bulb_type_variants') THEN
        ALTER TABLE "public"."bulb_type_variants" RENAME TO "variant_definitions";
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'product_bulb_variants') THEN
        ALTER TABLE "public"."product_bulb_variants" RENAME TO "product_variants";
    END IF;
END $$;

-- 2. Rename columns in products (if they exist with old names)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'bulb_type_id') THEN
        ALTER TABLE "public"."products" RENAME COLUMN "bulb_type_id" TO "variant_type_id";
    END IF;
END $$;

-- 3. Rename columns in product_variants (if they exist with old names)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'product_variants' AND column_name = 'bulb_type') THEN
        ALTER TABLE "public"."product_variants" RENAME COLUMN "bulb_type" TO "variant_type";
    END IF;
END $$;

-- 4. Update the stock sync function
CREATE OR REPLACE FUNCTION "public"."sync_product_stock_from_variants"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE products
    SET stock_quantity = (
        SELECT COALESCE(SUM(stock_quantity), 0)
        FROM product_variants
        WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    )
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    RETURN NEW;
END;
$$;

-- 5. Rename constraints for consistency (wrapped in DO blocks for safety)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bulb_types_pkey') THEN
        ALTER TABLE "public"."variant_categories" RENAME CONSTRAINT "bulb_types_pkey" TO "variant_categories_pkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bulb_types_code_key') THEN
        ALTER TABLE "public"."variant_categories" RENAME CONSTRAINT "bulb_types_code_key" TO "variant_categories_code_key";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bulb_type_variants_pkey') THEN
        ALTER TABLE "public"."variant_definitions" RENAME CONSTRAINT "bulb_type_variants_pkey" TO "variant_definitions_pkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_bulb_variants_pkey') THEN
        ALTER TABLE "public"."product_variants" RENAME CONSTRAINT "product_bulb_variants_pkey" TO "product_variants_pkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_bulb_variants_product_id_fkey') THEN
        ALTER TABLE "public"."product_variants" RENAME CONSTRAINT "product_bulb_variants_product_id_fkey" TO "product_variants_product_id_fkey";
    END IF;
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'product_bulb_variants_variant_id_fkey') THEN
        ALTER TABLE "public"."product_variants" RENAME CONSTRAINT "product_bulb_variants_variant_id_fkey" TO "product_variants_variant_id_fkey";
    END IF;
END $$;

-- 6. Recreate the view with new names
DROP VIEW IF EXISTS "public"."pos_product_variants";
CREATE OR REPLACE VIEW "public"."pos_product_variants" AS
 SELECT "p"."id" AS "product_id",
    "p"."sku",
    "p"."name" AS "base_name",
    "p"."brand",
    "p"."selling_price" AS "base_price",
    "pbv"."id",
    "pbv"."id" AS "variant_id",
    COALESCE("btv"."display_name", "pbv"."variant_type") AS "display_name",
    "btv"."compatibility_list",
    COALESCE("pbv"."description", "btv"."description") AS "variant_description",
        CASE
            WHEN ("pbv"."selling_price" > (0)::numeric) THEN "pbv"."selling_price"
            ELSE ("p"."selling_price" + COALESCE("pbv"."price_adjustment", (0)::numeric))
        END AS "final_price",
    "pbv"."stock_quantity",
    "pbv"."min_stock_level",
    "pbv"."is_primary",
    "pbv"."variant_sku",
    "pc"."name" AS "category",
    "p"."image_url",
    COALESCE("pbv"."variant_color", "p"."color_temperature") AS "color_temperature"
   FROM ((("public"."products" "p"
     JOIN "public"."product_variants" "pbv" ON (("p"."id" = "pbv"."product_id")))
     LEFT JOIN "public"."variant_definitions" "btv" ON (("pbv"."variant_id" = "btv"."id")))
     LEFT JOIN "public"."product_categories" "pc" ON (("p"."category_id" = "pc"."id")))
  WHERE (("p"."has_variants" = true) AND (("btv"."is_active" = true) OR ("btv"."id" IS NULL)))
  ORDER BY "p"."name", COALESCE("btv"."display_name", "pbv"."variant_type");

COMMIT;
