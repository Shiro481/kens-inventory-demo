-- =====================================================
-- CREATE BULB TYPE VARIANTS SYSTEM
-- =====================================================
-- This creates bulb types with same names but different compatibility

-- Create bulb type variants table
CREATE TABLE IF NOT EXISTS bulb_type_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    base_name VARCHAR(100) NOT NULL, -- e.g., "LED Headlight Kit"
    variant_name VARCHAR(100) NOT NULL, -- e.g., "H4/H7/9005/9006"
    compatibility_list TEXT[] NOT NULL, -- ['H4', 'H7', '9005', '9006']
    display_name VARCHAR(200) NOT NULL, -- "LED Headlight Kit (H4/H7/9005/9006)"
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product variants table to link products to multiple variants
CREATE TABLE IF NOT EXISTS product_bulb_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES bulb_type_variants(id) ON DELETE CASCADE,
    price_adjustment DECIMAL(10,2) DEFAULT 0.00, -- Price difference from base product
    stock_quantity INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false, -- Primary variant for display
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, variant_id)
);

-- Insert sample variants for same bulb names with different compatibility
INSERT INTO bulb_type_variants (base_name, variant_name, compatibility_list, display_name, description) VALUES
-- LED Headlight Kit variants
('LED Headlight Kit', 'H4/H7/9005/9006', ARRAY['H4', 'H7', '9005', '9006'], 'LED Headlight Kit (H4/H7/9005/9006)', 'Universal LED conversion kit for most vehicles'),
('LED Headlight Kit', 'H4/H7', ARRAY['H4', 'H7'], 'LED Headlight Kit (H4/H7)', 'LED kit for Japanese/European vehicles'),
('LED Headlight Kit', '9005/9006', ARRAY['9005', '9006'], 'LED Headlight Kit (9005/9006)', 'LED kit for American vehicles'),

-- LED Fog Light variants  
('LED Fog Light', 'H11/H8/H16', ARRAY['H11', 'H8', 'H16'], 'LED Fog Light (H11/H8/H16)', 'Universal LED fog light kit'),
('LED Fog Light', 'H11/H8', ARRAY['H11', 'H8'], 'LED Fog Light (H11/H8)', 'Standard fog light compatibility'),
('LED Fog Light', 'H11', ARRAY['H11'], 'LED Fog Light (H11)', 'H11 specific fog light'),

-- Turn Signal variants
('LED Turn Signal', '7507/PY21W', ARRAY['7507', 'PY21W'], 'LED Turn Signal (7507/PY21W)', 'European turn signal compatibility'),
('LED Turn Signal', '1156/2357', ARRAY['1156', '2357'], 'LED Turn Signal (1156/2357)', 'American turn signal compatibility'),
('LED Turn Signal', '3157/4157', ARRAY['3157', '4157'], 'LED Turn Signal (3157/4157)', 'Modern turn signal compatibility'),

-- Interior LED variants
('Interior LED Kit', 'W5W/194/168', ARRAY['W5W', '194', '168'], 'Interior LED Kit (W5W/194/168)', 'Standard interior bulbs'),
('Interior LED Kit', 'T10/147/152', ARRAY['T10', '147', '152'], 'Interior LED Kit (T10/147/152)', 'Alternative interior bulbs'),
('Interior LED Kit', '211/212', ARRAY['211', '212'], 'Interior LED Kit (211/212)', 'Classic interior bulbs'),

-- Brake Light variants
('LED Brake Light', '1157/2057', ARRAY['1157', '2057'], 'LED Brake Light (1157/2057)', 'Standard brake/tail light'),
('LED Brake Light', '7440/7443', ARRAY['7440', '7443'], 'LED Brake Light (7440/7443)', 'Modern brake light'),
('LED Brake Light', '3156/3157', ARRAY['3156', '3157'], 'LED Brake Light (3156/3157)', 'Compact brake light')
ON CONFLICT DO NOTHING;

-- Create sample products that use these variants
-- First, let's create some base products with the same name
INSERT INTO products (
    sku, barcode, name, brand, category_id, bulb_type_id, 
    voltage, wattage, color_temperature, lumens, beam_type,
    cost_price, selling_price, stock_quantity, reorder_level, min_stock_level,
    description, image_url, specifications
) VALUES
('LED-KIT-H4-001', '9876543210001', 'LED Headlight Kit', 'GPNE', 
 (SELECT id FROM product_categories WHERE name = 'Headlight'), 
 (SELECT id FROM bulb_types WHERE code = 'H4_LED'), 
 12.0, 45.0, 6500, 9000, 'High/Low', 
 65.00, 129.99, 25, 5, 2, 
 'Universal LED headlight conversion kit with multiple compatibility options.', 
 'https://example.com/images/led-headlight-kit.jpg',
 '{"color": "6500K Cool White", "lifespan": "60000 hours", "warranty": "3 years", "has_variants": true}'),

('LED-FOG-H11-001', '9876543210002', 'LED Fog Light', 'GPNE', 
 (SELECT id FROM product_categories WHERE name = 'Fog Light'), 
 (SELECT id FROM bulb_types WHERE code = 'H11_LED'), 
 12.0, 28.0, 3000, 2800, 'Fog', 
 38.00, 76.99, 30, 8, 4, 
 'Universal LED fog light with multiple compatibility options.', 
 'https://example.com/images/led-fog-light.jpg',
 '{"color": "3000K Yellow", "lifespan": "55000 hours", "warranty": "2 years", "has_variants": true}'),

('LED-SIG-7507-001', '9876543210003', 'LED Turn Signal', 'GPNE', 
 (SELECT id FROM product_categories WHERE name = 'Signal Light'), 
 (SELECT id FROM bulb_types WHERE code = '7507_LED'), 
 12.0, 18.0, 3200, 950, 'Signal', 
 35.00, 69.99, 20, 6, 3, 
 'Universal LED turn signal with multiple compatibility options.', 
 'https://example.com/images/led-turn-signal.jpg',
 '{"color": "3200K Amber", "lifespan": "50000 hours", "warranty": "2 years", "has_variants": true}'),

('LED-INT-W5W-001', '9876543210004', 'Interior LED Kit', 'GPNE', 
 (SELECT id FROM product_categories WHERE name = 'Interior Light'), 
 (SELECT id FROM bulb_types WHERE code = 'W5W_LED'), 
 12.0, 2.5, 4000, 150, 'Interior', 
 22.00, 44.99, 60, 20, 10, 
 'Universal interior LED kit with multiple compatibility options.', 
 'https://example.com/images/interior-led-kit.jpg',
 '{"color": "4000K Natural White", "lifespan": "65000 hours", "warranty": "3 years", "has_variants": true}'),

('LED-BRAKE-1157-001', '9876543210005', 'LED Brake Light', 'GPNE', 
 (SELECT id FROM product_categories WHERE name = 'Brake Light'), 
 (SELECT id FROM bulb_types WHERE code = '1157_LED'), 
 12.0, 22.0, 6200, 1400, 'Brake/Tail', 
 42.00, 84.99, 15, 5, 2, 
 'Universal LED brake light with multiple compatibility options.', 
 'https://example.com/images/led-brake-light.jpg',
 '{"color": "6200K Red", "lifespan": "60000 hours", "warranty": "3 years", "has_variants": true}')
ON CONFLICT (sku) DO NOTHING;

-- Link products to their variants
INSERT INTO product_bulb_variants (product_id, variant_id, price_adjustment, stock_quantity, is_primary) 
SELECT 
    p.id,
    btv.id,
    CASE 
        WHEN btv.variant_name LIKE '%9005/9006%' THEN 10.00
        WHEN btv.variant_name LIKE '%H4/H7%' THEN -5.00
        WHEN btv.variant_name LIKE '%H11%' THEN 0.00
        WHEN btv.variant_name LIKE '%1156%' THEN 5.00
        WHEN btv.variant_name LIKE '%3157%' THEN -3.00
        ELSE 0.00
    END as price_adjustment,
    CASE 
        WHEN btv.variant_name LIKE '%H4/H7/9005/9006%' THEN 10
        WHEN btv.variant_name LIKE '%H11/H8/H16%' THEN 15
        WHEN btv.variant_name LIKE '%7507/PY21W%' THEN 20
        ELSE 12
    END as stock_quantity,
    CASE 
        WHEN btv.variant_name LIKE '%H4/H7/9005/9006%' THEN true
        WHEN btv.variant_name LIKE '%H11/H8/H16%' THEN true
        WHEN btv.variant_name LIKE '%7507/PY21W%' THEN true
        ELSE false
    END as is_primary
FROM products p
CROSS JOIN bulb_type_variants btv
WHERE p.name = btv.base_name
ON CONFLICT (product_id, variant_id) DO NOTHING;

-- Create view for POS system
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
    pc.name as category,
    p.image_url
FROM products p
JOIN product_bulb_variants pbv ON p.id = pbv.product_id
JOIN bulb_type_variants btv ON pbv.variant_id = btv.id
LEFT JOIN product_categories pc ON p.category_id = pc.id
WHERE p.specifications::text LIKE '%has_variants": true%'
  AND btv.is_active = true
ORDER BY p.name, btv.display_name;

-- Verification queries
SELECT '=== Bulb Type Variants ===' as info;
SELECT * FROM bulb_type_variants ORDER BY base_name, display_name;

SELECT '=== Product Variants ===' as info;
SELECT * FROM product_bulb_variants ORDER BY product_id, is_primary DESC;

SELECT '=== POS Product Variants View ===' as info;
SELECT * FROM pos_product_variants ORDER BY base_name, is_primary DESC, display_name;
