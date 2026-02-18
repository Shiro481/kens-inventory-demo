-- =====================================================
-- DEPLOY SCHEMA CHANGES TO LIVE DATABASE
-- Safe to run on existing data (Adds columns/views only)
-- =====================================================

-- 1. Ensure 'variant_color' column exists (for specific variant color overrides)
ALTER TABLE product_bulb_variants ADD COLUMN IF NOT EXISTS variant_color VARCHAR(50);

-- 2. Ensure 'has_variants' column exists (optimization flag)
ALTER TABLE products ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false;

-- 3. Ensure 'variant_sku' and 'variant_barcode' columns exist
ALTER TABLE product_bulb_variants ADD COLUMN IF NOT EXISTS variant_sku VARCHAR(50);
ALTER TABLE product_bulb_variants ADD COLUMN IF NOT EXISTS variant_barcode VARCHAR(100);

-- 4. Update the POS View with Color Logic and Type Safety
-- This view combines product data with variant data for the POS
DROP VIEW IF EXISTS pos_product_variants;

CREATE OR REPLACE VIEW pos_product_variants AS
SELECT 
    p.id as product_id,
    p.sku,
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
    pbv.variant_sku,
    pc.name as category,
    p.image_url,
    -- Color Logic: Use variant specific color if set, otherwise fallback to product color
    -- Cast to VARCHAR ensures compatibility between types
    COALESCE(pbv.variant_color, CAST(p.color_temperature AS VARCHAR)) as color_temperature
FROM products p
JOIN product_bulb_variants pbv ON p.id = pbv.product_id
JOIN bulb_type_variants btv ON pbv.variant_id = btv.id
LEFT JOIN product_categories pc ON p.category_id = pc.id
WHERE p.has_variants = true
  AND btv.is_active = true
ORDER BY p.name, btv.display_name;

-- 5. Ensure Categories Exist (Safe Insert)
INSERT INTO product_categories (name, description) VALUES
('Headlight', 'Main front lighting'),
('Fog Light', 'Auxiliary fog lights'),
('Signal Light', 'Turn signals'),
('Interior Light', 'Cabin lighting'),
('Brake Light', 'Rear brake lights')
ON CONFLICT (name) DO NOTHING;

-- 6. Ensure Base Bulb Types Exist (Safe Insert)
-- This ensures the "Menus" for socket types are available
INSERT INTO bulb_type_variants (base_name, variant_name, compatibility_list, display_name, description) VALUES
-- Headlight Options
('LED Headlight Kit', 'H4/H7/9005/9006', ARRAY['H4', 'H7', '9005', '9006'], 'Universal Kit (H4/H7/9005/9006)', 'Universal fit for most cars'),
('LED Headlight Kit', 'H4/Hb2/9003', ARRAY['H4', 'Hb2', '9003'], 'Hi/Lo Beam (H4)', 'Standard high/low beam'),
('LED Headlight Kit', 'H7', ARRAY['H7'], 'Low Beam (H7)', 'Standard low beam'),
('LED Headlight Kit', '9005/HB3', ARRAY['9005', 'HB3'], 'High Beam (9005)', 'Standard high beam'),
('LED Headlight Kit', '9006/HB4', ARRAY['9006', 'HB4'], 'Low Beam (9006)', 'Standard low beam'),

-- Fog/Signal Options
('LED Fog Light', 'H11/H8/H16', ARRAY['H11', 'H8', 'H16'], 'Fog Universal (H11/H8/H16)', 'Universal fog light'),
('LED Signal', '1156/BA15S', ARRAY['1156', 'BA15S'], 'Single Contact (1156)', 'Turn signal / Reverse'),
('LED Signal', '7440/T20', ARRAY['7440', 'T20'], 'Wedge Base (7440)', 'Turn signal'),
('LED Brake', '1157/BAY15D', ARRAY['1157', 'BAY15D'], 'Double Contact (1157)', 'Brake/Tail light'),

-- Interior Options
('Interior LED', 'T10/194/168', ARRAY['T10', '194', '168'], 'Wedge T10 (Universal)', 'Parking/Interior/Plate'),
('Interior LED', 'Festoon 31mm', ARRAY['31mm'], 'Festoon 31mm', 'Dome light'),
('Interior LED', 'Festoon 36mm', ARRAY['36mm'], 'Festoon 36mm', 'Dome light')
ON CONFLICT DO NOTHING;

-- 7. Sync Function (Optional but recommended)
CREATE OR REPLACE FUNCTION sync_product_stock_from_variants()
RETURNS TRIGGER AS $$
BEGIN
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

SELECT 'Schema Deployment Complete' as status;
