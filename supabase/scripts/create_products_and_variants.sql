-- Create actual products and link them to variants
-- This will create the missing products with the right IDs

-- First, let's create the LED products with simple numeric IDs
INSERT INTO products (
    id,  -- We'll use simple numeric IDs to match frontend
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
(18230, 'GPNE-H4-LED-001', 'GPNE Universal LED Headlight Kit', 'GPNE', 1, 1, 12, 50, 6000, 8000, 'High/Low', 80.00, 129.99, 50, 10, 5, 
'{"has_variants": true, "wattage": "50W", "lumens": "8000", "color_temperature": "6000K"}', 
'https://via.placeholder.com/300x200/3b82f6/ffffff?text=LED+Headlight+Kit', NOW()),

-- LED Fog Light  
(309727, 'GPNE-H11-FOG-001', 'GPNE Multi-Fit LED Fog Light', 'GPNE', 2, 2, 12, 30, 6000, 4000, 'Fog', 50.00, 79.99, 40, 8, 4,
'{"has_variants": true, "wattage": "30W", "lumens": "4000", "color_temperature": "6000K"}',
'https://via.placeholder.com/300x200/10b981/ffffff?text=LED+Fog+Light', NOW())

ON CONFLICT (id) DO NOTHING;

-- Now let's link these products to the bulb type variants
-- First, get the variant IDs
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
    (18230, headlight_variant_1, 0.00, 20, true),
    (18230, headlight_variant_2, -5.00, 15, false),
    (18230, headlight_variant_3, 10.00, 12, false)
    ON CONFLICT (product_id, variant_id) DO NOTHING;
    
    -- Link LED Fog Light to variants
    INSERT INTO product_bulb_variants (product_id, variant_id, price_adjustment, stock_quantity, is_primary) VALUES
    (309727, fog_variant_1, 0.00, 18, true),
    (309727, fog_variant_2, 0.00, 20, false),
    (309727, fog_variant_3, 0.00, 25, false)
    ON CONFLICT (product_id, variant_id) DO NOTHING;
END $$;

-- Test the results
SELECT '=== Products Created ===' as info;
SELECT id, name, sku, brand FROM products WHERE id IN (18230, 309727);

SELECT '=== Variants Linked ===' as info;
SELECT product_id, base_name, display_name, final_price, stock_quantity, is_primary 
FROM pos_product_variants 
WHERE product_id IN ('18230', '309727')
ORDER BY product_id, is_primary DESC;
