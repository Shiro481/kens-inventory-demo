
-- Drop the restrictive unique constraint
ALTER TABLE product_bulb_variants DROP CONSTRAINT IF EXISTS product_bulb_variants_product_id_variant_id_key;

-- Add a new constraint that includes variant_color
-- Using COALESCE in a unique index is better if we want to treat NULLs as equal, but for now standard UNIQUE is okay or we assume color is provided for duplicates.
-- Actually, let's just use a unique index on the 3 columns.
CREATE UNIQUE INDEX IF NOT EXISTS product_bulb_variants_pid_vid_color_idx ON product_bulb_variants (product_id, variant_id, COALESCE(variant_color, ''));

