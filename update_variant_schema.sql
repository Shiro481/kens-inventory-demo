-- Add additional columns to product_bulb_variants to support full variant specifications
ALTER TABLE product_bulb_variants 
ADD COLUMN IF NOT EXISTS bulb_type TEXT,
ADD COLUMN IF NOT EXISTS color_temperature DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 5;

-- Make variant_id nullable since we're allowing custom variants not tied to bulb_type_variants
ALTER TABLE product_bulb_variants ALTER COLUMN variant_id DROP NOT NULL;

-- Update the unique constraint to allow multiple custom variants per product
-- (We'll keep the constraint but it only applies when variant_id is not null)
