-- Fix the UUID issue by creating proper UUIDs and updating the frontend logic

-- First, let's see what products already exist
SELECT '=== Current Products ===' as info;
SELECT id, name, sku FROM products ORDER BY name;

-- Create LED products with proper UUIDs
INSERT INTO products (
    id,  -- Use proper UUIDs
    sku, 
    name, 
    brand, 
    category_id, 
    bulb_type_id, 
    voltage, 
    wattage, 
    color_temperature, 
    lumens, 
    beam_type,
    cost_price, 
    selling_price, 
    stock_quantity, 
    reorder_level, 
    min_stock_level,
    specifications,
    image_url,
    created_at
) VALUES 
-- LED Headlight Kit
('18230000-0000-0000-0000-000000000000', 'GPNE-H4-LED-001', 'GPNE Universal LED Headlight Kit', 'GPNE', 1, 1, 12, 50, 6000, 8000, 'High/Low', 80.00, 129.99, 50, 10, 5, 
'{"has_variants": true, "wattage": "50W", "lumens": "8000", "color_temperature": "6000K"}', 
'https://via.placeholder.com/300x200/3b82f6/ffffff?text=LED+Headlight+Kit', NOW()),

-- LED Fog Light  
('30972700-0000-0000-0000-000000000000', 'GPNE-H11-FOG-001', 'GPNE Multi-Fit LED Fog Light', 'GPNE', 2, 2, 12, 30, 6000, 4000, 'Fog', 50.00, 79.99, 40, 8, 4,
'{"has_variants": true, "wattage": "30W", "lumens": "4000", "color_temperature": "6000K"}',
'https://via.placeholder.com/300x200/10b981/ffffff?text=LED+Fog+Light', NOW())

ON CONFLICT (id) DO NOTHING;

-- Now let's link these products to the bulb type variants
DO $$
DECLARE
    headlight_variant_1 UUID;
    headlight_variant_2 UUID;
    headlight_variant_3 UUID;
    fog_variant_1 UUID;
    fog_variant_2 UUID;
    fog_variant_3 UUID;
BEGIN
    -- Get LED Headlight Kit variant IDs
    SELECT id INTO headlight_variant_1 FROM bulb_type_variants WHERE display_name = 'LED Headlight Kit (H4/H7/9005/9006)';
    SELECT id INTO headlight_variant_2 FROM bulb_type_variants WHERE display_name = 'LED Headlight Kit (H4/H7)';
    SELECT id INTO headlight_variant_3 FROM bulb_type_variants WHERE display_name = 'LED Headlight Kit (9005/9006)';
    
    -- Get LED Fog Light variant IDs
    SELECT id INTO fog_variant_1 FROM bulb_type_variants WHERE display_name = 'LED Fog Light (H11/H8/H16)';
    SELECT id INTO fog_variant_2 FROM bulb_type_variants WHERE display_name = 'LED Fog Light (H11/H8)';
    SELECT id INTO fog_variant_3 FROM bulb_type_variants WHERE display_name = 'LED Fog Light (H11)';
    
    -- Link LED Headlight Kit to variants
    INSERT INTO product_bulb_variants (product_id, variant_id, price_adjustment, stock_quantity, is_primary) VALUES
    ('18230000-0000-0000-0000-000000000000', headlight_variant_1, 0.00, 20, true),
    ('18230000-0000-0000-0000-000000000000', headlight_variant_2, -5.00, 15, false),
    ('18230000-0000-0000-0000-000000000000', headlight_variant_3, 10.00, 12, false)
    ON CONFLICT (product_id, variant_id) DO NOTHING;
    
    -- Link LED Fog Light to variants
    INSERT INTO product_bulb_variants (product_id, variant_id, price_adjustment, stock_quantity, is_primary) VALUES
    ('30972700-0000-0000-0000-000000000000', fog_variant_1, 0.00, 18, true),
    ('30972700-0000-0000-0000-000000000000', fog_variant_2, 0.00, 20, false),
    ('30972700-0000-0000-0000-000000000000', fog_variant_3, 0.00, 25, false)
    ON CONFLICT (product_id, variant_id) DO NOTHING;
END $$;

-- Update the view to handle both UUID and numeric lookups
DROP VIEW IF EXISTS pos_product_variants;

CREATE VIEW pos_product_variants AS
SELECT 
    p.id::text as product_id,
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
WHERE btv.is_active = true
ORDER BY p.name, btv.display_name;

-- Test the results
SELECT '=== Products Created ===' as info;
SELECT id, name, sku, brand FROM products WHERE id IN ('18230000-0000-0000-0000-000000000000', '30972700-0000-0000-0000-000000000000');

SELECT '=== Variants Linked ===' as info;
SELECT product_id, base_name, display_name, final_price, stock_quantity, is_primary 
FROM pos_product_variants 
WHERE product_id IN ('18230000-0000-0000-0000-000000000000', '30972700-0000-0000-0000-000000000000')
ORDER BY product_id, is_primary DESC;
