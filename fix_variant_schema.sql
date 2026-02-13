-- =====================================================
-- FIX: IMPROVED VARIANT SCHEMA & INVENTORY SYNC
-- =====================================================

-- 1. Add "has_variants" column to avoid JSON parsing fragility
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;

-- 2. Backfill existing data based on the JSON check
UPDATE products 
SET has_variants = true 
WHERE specifications::text LIKE '%has_variants": true%';

-- 3. Add SKU/Barcode to variants (critical for real inventory)
ALTER TABLE product_bulb_variants ADD COLUMN IF NOT EXISTS variant_sku VARCHAR(50);
ALTER TABLE product_bulb_variants ADD COLUMN IF NOT EXISTS variant_barcode VARCHAR(100);

-- 4. Update the POS view to use the new column + show variant SKU
DROP VIEW IF EXISTS pos_product_variants;

CREATE OR REPLACE VIEW pos_product_variants AS
SELECT 
    p.id as product_id,
    p.sku, -- Parent SKU
    p.name as base_name,
    p.brand,
    p.selling_price as base_price,
    btv.id as variant_id,
    btv.display_name,
    btv.compatibility_list,
    btv.description as variant_description,
    p.selling_price + pbv.price_adjustment as final_price,
    pbv.stock_quantity,
    pbv.is_primary,
    pbv.variant_sku, -- New specific SKU
    pc.name as category,
    p.image_url
FROM products p
JOIN product_bulb_variants pbv ON p.id = pbv.product_id
JOIN bulb_type_variants btv ON pbv.variant_id = btv.id
LEFT JOIN product_categories pc ON p.category_id = pc.id
WHERE p.has_variants = true -- Uses optimized boolean column
  AND btv.is_active = true
ORDER BY p.name, btv.display_name;

-- 5. FUNCTION: Keep parent stock in sync with sum of variants
CREATE OR REPLACE FUNCTION sync_product_stock_from_variants()
RETURNS TRIGGER AS $$
BEGIN
    -- Update parent product stock to be sum of all its variants
    UPDATE products
    SET stock_quantity = (
        SELECT COALESCE(SUM(stock_quantity), 0)
        FROM product_bulb_variants
        WHERE product_id = NEW.product_id
    )
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. TRIGGER: Run sync whenever a variant stock changes
DROP TRIGGER IF EXISTS update_parent_stock_trigger ON product_bulb_variants;

CREATE TRIGGER update_parent_stock_trigger
AFTER INSERT OR UPDATE OF stock_quantity OR DELETE ON product_bulb_variants
FOR EACH ROW
EXECUTE FUNCTION sync_product_stock_from_variants();

-- 7. Initial Sync for existing data
UPDATE products p
SET stock_quantity = (
    SELECT COALESCE(SUM(stock_quantity), 0)
    FROM product_bulb_variants pbv
    WHERE pbv.product_id = p.id
)
WHERE p.has_variants = true;

-- 8. Generate pseudo-SKUs for existing variants (optional backfill)
UPDATE product_bulb_variants pbv
SET variant_sku = p.sku || '-' || btv.variant_name
FROM products p, bulb_type_variants btv
WHERE pbv.product_id = p.id 
  AND pbv.variant_id = btv.id
  AND pbv.variant_sku IS NULL;
