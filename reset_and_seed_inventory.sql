-- =====================================================
-- RESET AND SEED INVENTORY (CLEAN SLATE)
-- =====================================================
-- WARNING: This will DELETE all existing products and variants!

-- 1. Clean up existing data
TRUNCATE TABLE product_bulb_variants CASCADE;
DELETE FROM products WHERE 1=1; 
-- We keep categories and base bulb_types, but let's ensure variants are clean
DELETE FROM bulb_type_variants WHERE 1=1;

-- 1a. Ensure color_temperature column exists (Assuming it exists or will be added as whatever type is default, but if it exists as int, we respect it)
-- We skip ALTER to avoid view dependency issues. We will insert integers.

-- 1b. Add variant_color to variants for specific overrides
ALTER TABLE product_bulb_variants ADD COLUMN IF NOT EXISTS variant_color VARCHAR(50);

-- 1c. Update the View to include color logic (Product color is default, Variant color overrides if present)
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
    COALESCE(pbv.variant_color, CAST(p.color_temperature AS VARCHAR)) as color_temperature -- The Key Field
FROM products p
JOIN product_bulb_variants pbv ON p.id = pbv.product_id
JOIN bulb_type_variants btv ON pbv.variant_id = btv.id
LEFT JOIN product_categories pc ON p.category_id = pc.id
WHERE p.has_variants = true
  AND btv.is_active = true
ORDER BY p.name, btv.display_name;


-- 2. Ensure Categories Exist
INSERT INTO product_categories (name, description) VALUES
('Headlight', 'Main front lighting'),
('Fog Light', 'Auxiliary fog lights'),
('Signal Light', 'Turn signals'),
('Interior Light', 'Cabin lighting'),
('Brake Light', 'Rear brake lights')
ON CONFLICT (name) DO NOTHING;

-- 3. Insert specific Bulb Type Variants (The "Menus" of options)
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

-- 4. Insert Base Products (The "Parent" Items)
INSERT INTO products (
    sku, name, brand, category_id, 
    selling_price, cost_price, stock_quantity, 
    description, image_url, has_variants, 
    specifications, color_temperature
) VALUES
-- Product 1: GPNE Premium Headlight
('GPNE-R1-KIT', 'GPNE R1 LED Headlight Kit', 'GPNE', 
 (SELECT id FROM product_categories WHERE name = 'Headlight' LIMIT 1),
 129.99, 65.00, 0, -- Stock will be auto-calculated by trigger
 'Premium LED headlight conversion kit. 6000K Cool White. 20000 Lumens.',
 'https://m.media-amazon.com/images/I/71r+180k+TL._AC_SL1500_.jpg',
 true,
 '{"color": "6000K", "watts": "100W"}'::jsonb, '6000'),

-- Product 2: Philips Ultinon
('PHIL-ULT-fog', 'Philips Ultinon Pro Fog Light', 'Philips',
 (SELECT id FROM product_categories WHERE name = 'Fog Light' LIMIT 1),
 89.99, 45.00, 0,
 'High performance LED fog light. Sharp cut-off line.',
 'https://m.media-amazon.com/images/I/61y+6-2+12L._AC_SL1000_.jpg',
 true,
 '{"color": "5800K", "watts": "25W"}'::jsonb, '5800'),

-- Product 3: Regular wipers (No variants example)
('WIPER-24', 'Hybrid Wiper Blade 24"', 'Denso',
 (SELECT id FROM product_categories WHERE name = 'Headlight' LIMIT 1), -- Just putting in a category
 15.00, 7.50, 50,
 'Standard hybrid wiper blade.',
 'https://m.media-amazon.com/images/I/71+2+12L._AC_SL1000_.jpg',
 false,
 '{}'::jsonb, NULL),

-- Product 4: T10 Interior Bulbs
('T10-PACK', 'T10 LED Canbus Bulb (Pair)', 'Osram',
 (SELECT id FROM product_categories WHERE name = 'Interior Light' LIMIT 1),
 12.99, 3.50, 0,
 'Error-free T10 LED bulbs for interior or license plate.',
 'https://m.media-amazon.com/images/I/61+2+12L._AC_SL1000_.jpg',
 true,
 '{"color": "6000K"}'::jsonb, '6000'),

-- Product 5: Golden Yellow Fog (3000K)
('FOG-Tv-YEL', 'TVT LED Fog Light (Yellow)', 'TVT',
 (SELECT id FROM product_categories WHERE name = 'Fog Light' LIMIT 1),
 45.00, 20.00, 0,
 'Deep yellow 3000K fog light for bad weather.',
 'https://m.media-amazon.com/images/I/61y+6-2+12L._AC_SL1000_.jpg', -- Reusing image for demo
 true,
 '{"color": "3000K"}'::jsonb, '3000'),

-- Product 6: Ice Blue Headlight (8000K)
('HID-8000K', 'Ice Blue LED Headlight', 'Generic',
 (SELECT id FROM product_categories WHERE name = 'Headlight' LIMIT 1),
 55.00, 25.00, 0,
 '8000K Ice Blue tint for styling.',
 'https://m.media-amazon.com/images/I/71r+180k+TL._AC_SL1500_.jpg', -- Reusing image
 true,
 '{"color": "8000K"}'::jsonb, '8000'),

-- Product 7: DUAL COLOR FOG (The Testing Product)
('FOG-DUAL-Switch', 'Switchback LED Fog (WHT/YEL)', 'Auxbeam',
 (SELECT id FROM product_categories WHERE name = 'Fog Light' LIMIT 1),
 65.00, 30.00, 0,
 'Switch between 6000K White and 3000K Yellow.',
 'https://m.media-amazon.com/images/I/61y+6-2+12L._AC_SL1000_.jpg',
 true,
 '{"color": "Multi", "watts": "30W"}'::jsonb, NULL);


-- 5. Link Products to Variants (Inventory Injection)

-- Link GPNE Headlight to its variants
INSERT INTO product_bulb_variants (product_id, variant_id, price_adjustment, stock_quantity, is_primary, variant_sku)
SELECT 
    p.id,
    v.id,
    CASE WHEN v.variant_name LIKE '%H4%' THEN 0 ELSE 5.00 END, -- Example: Non-H4s are $5 more
    20, -- 20 of each in stock
    CASE WHEN v.variant_name LIKE '%H4/Hb2%' THEN true ELSE false END,
    p.sku || '-' || v.variant_name
FROM products p, bulb_type_variants v
WHERE p.sku = 'GPNE-R1-KIT' 
AND v.base_name = 'LED Headlight Kit';

-- Link Philips Fog Light to variants
INSERT INTO product_bulb_variants (product_id, variant_id, price_adjustment, stock_quantity, is_primary, variant_sku)
SELECT 
    p.id,
    v.id,
    0,
    15,
    CASE WHEN v.variant_name LIKE '%H11%' THEN true ELSE false END,
    p.sku || '-' || v.variant_name
FROM products p, bulb_type_variants v
WHERE p.sku = 'PHIL-ULT-fog' 
AND v.base_name = 'LED Fog Light';

-- Link T10 Bulbs
INSERT INTO product_bulb_variants (product_id, variant_id, price_adjustment, stock_quantity, is_primary, variant_sku)
SELECT 
    p.id,
    v.id,
    0,
    100,
    true,
    p.sku || '-' || v.variant_name
FROM products p, bulb_type_variants v
WHERE p.sku = 'T10-PACK' 
AND v.base_name = 'Interior LED'
AND v.variant_name LIKE '%T10%';

-- Link Product 5 (Yellow Fog)
INSERT INTO product_bulb_variants (product_id, variant_id, price_adjustment, stock_quantity, is_primary, variant_sku)
SELECT 
    p.id,
    v.id,
    0, 25, CASE WHEN v.variant_name LIKE '%H11%' THEN true ELSE false END,
    p.sku || '-' || v.variant_name
FROM products p, bulb_type_variants v
WHERE p.sku = 'FOG-Tv-YEL' AND v.base_name = 'LED Fog Light';

-- Link Product 6 (Ice Blue Headlight)
INSERT INTO product_bulb_variants (product_id, variant_id, price_adjustment, stock_quantity, is_primary, variant_sku)
SELECT 
    p.id,
    v.id,
    0, 30, CASE WHEN v.variant_name LIKE '%H4%' THEN true ELSE false END,
    p.sku || '-' || v.variant_name
FROM products p, bulb_type_variants v
WHERE p.sku = 'HID-8000K' AND v.base_name = 'LED Headlight Kit';

-- Link Product 7 (Dual Color - With Variant Colors)
-- White Variants (6000K)
INSERT INTO product_bulb_variants (product_id, variant_id, price_adjustment, stock_quantity, is_primary, variant_sku, variant_color)
SELECT p.id, v.id, 0, 10, true, p.sku || '-' || v.variant_name || '-W', '6000'
FROM products p, bulb_type_variants v
WHERE p.sku = 'FOG-DUAL-Switch' AND v.base_name = 'LED Fog Light' AND v.variant_name LIKE '%H11%';

-- Yellow Variants (3000K) - Same variant_id/socket but different color/SKU? 
-- DB enforces (product_id, variant_id) unique constraint usually?
-- If so, I can't have two rows for same product+variant_id with different colors.
-- I need to check schema. If product_bulb_variants PK is (product_id, variant_id), I can't do this.
-- If schema allows duplicates, fine. If not, I need to create NEW bulb_type_variants for the other color? NO, that's messy.
-- Let's assume for now I cannot split "H11" into two rows unless I drop the PK constraint or use a surrogate key.
-- Standard normalization: "H11-3000K" and "H11-6000K" are distinct SKU items.
-- But my `bulb_type_variants` table defines "H11/H8/H16".
-- To support this, I should probably rely on `fix_variant_schema.sql` having ID as PK, not composite?
-- Let's check constraints. `fix_variant_schema.sql` likely didn't recreate the table, just added columns. 
-- The original table probable has a composite PK.
-- For this DEMO, I will avoid breaking PKs. I will just add different sockets having different colors to show filtering.
-- e.g. H11 is 6000K, but maybe I add a H8 specific variant that is 3000K?
-- Or better: A different product "Switchback" where I insert H11 as 6000K and H16 as 3000K (just for demo).
INSERT INTO product_bulb_variants (product_id, variant_id, price_adjustment, stock_quantity, is_primary, variant_sku, variant_color)
SELECT p.id, v.id, 5.00, 10, false, p.sku || '-' || v.variant_name || '-Y', '3000'
FROM products p, bulb_type_variants v
WHERE p.sku = 'FOG-DUAL-Switch' AND v.base_name = 'LED Fog Light' AND v.variant_name NOT LIKE '%H11%';

-- 6. Force sync of total stocks (Trigger should handle this, but being explicit is good)
UPDATE products p
SET stock_quantity = (
    SELECT COALESCE(SUM(stock_quantity), 0)
    FROM product_bulb_variants pbv
    WHERE pbv.product_id = p.id
)
WHERE has_variants = true;

SELECT 'Inventory Reset Complete' as status;
