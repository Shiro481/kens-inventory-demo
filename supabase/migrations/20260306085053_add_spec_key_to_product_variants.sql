-- 1. Add a spec_key column to store a stable dimension signature
ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS spec_key text;

-- 2. Backfill existing rows (guaranteed safe: only built from fields currently unique)
-- 'color_temperature=' ... '|variant_type='
UPDATE product_variants
SET spec_key = (
  COALESCE('variant_type=' || lower(trim(variant_type)), '') ||
  CASE WHEN color_temperature IS NOT NULL AND trim(color_temperature) != ''
       THEN '|color_temperature=' || lower(trim(color_temperature))
       ELSE '' END
)
WHERE spec_key IS NULL AND variant_type IS NOT NULL;

-- 3. Drop the old (narrow) unique constraint
ALTER TABLE product_variants
  DROP CONSTRAINT IF EXISTS product_variants_product_id_variant_type_color_temp_key;

-- 4. Add the new spec_key unique index
-- Using an index instead of a CONSTRAINT because we include a WHERE clause
CREATE UNIQUE INDEX IF NOT EXISTS product_variants_product_id_spec_key_key
  ON product_variants (product_id, spec_key)
  WHERE spec_key IS NOT NULL;
