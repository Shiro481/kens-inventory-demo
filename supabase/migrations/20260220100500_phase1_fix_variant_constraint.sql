-- ============================================================
-- Phase 1 Data Integrity: Fix variant unique constraint
-- 1. Drop stale constraint referencing old 'bulb_type' column
-- 2. Create correct constraint on 'variant_type'
-- 3. Drop products SKU unique constraint (SKUs are intentionally non-unique)
-- ============================================================

BEGIN;

-- ── 1. Drop stale constraint (references renamed column 'bulb_type') ──────────
-- This constraint has been silently inactive since the column was renamed.
ALTER TABLE public.product_variants
  DROP CONSTRAINT IF EXISTS "product_variants_product_id_bulb_type_color_temperatur_key";

-- ── 2. Check for existing duplicates before adding the new constraint ─────────
-- If duplicates exist, we log them and skip constraint creation to avoid hard failure.
DO $$
DECLARE
  dup_count INT;
BEGIN
  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT product_id, variant_type, color_temperature, COUNT(*) AS cnt
    FROM public.product_variants
    WHERE variant_type IS NOT NULL
    GROUP BY product_id, variant_type, color_temperature
    HAVING COUNT(*) > 1
  ) sub;

  IF dup_count > 0 THEN
    RAISE WARNING 'Found % duplicate (product_id, variant_type, color_temperature) group(s) in product_variants. Constraint NOT added. Clean up duplicates first.', dup_count;
  ELSE
    -- Safe to add the constraint
    ALTER TABLE public.product_variants
      ADD CONSTRAINT "product_variants_product_id_variant_type_color_temp_key"
      UNIQUE (product_id, variant_type, color_temperature);

    RAISE NOTICE 'Unique constraint on (product_id, variant_type, color_temperature) added successfully.';
  END IF;
END $$;

-- ── 3. Drop the SKU unique constraint on products ─────────────────────────────
-- SKUs are intentionally non-unique in this system (multiple items may share
-- the same SKU across model years; notes/specs are used for distinction).
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS "products_sku_key";

DO $$
BEGIN
  RAISE NOTICE 'Phase 1 constraint migration applied: stale bulb_type constraint dropped, SKU uniqueness removed.';
END $$;

COMMIT;
