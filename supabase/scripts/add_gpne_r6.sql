
-- 1. Ensure H1 exists in bulb_type_variants if not already present
INSERT INTO bulb_type_variants (base_name, variant_name, compatibility_list, display_name, description, is_active)
SELECT 'LED Headlight Kit', 'H1', ARRAY['H1'], 'Single Beam (H1)', 'Standard single beam H1', true
WHERE NOT EXISTS (
    SELECT 1 FROM bulb_type_variants WHERE variant_name = 'H1'
);

-- 2. Insert GPNE R6 Product and Link Variants
DO $$
DECLARE
    headlight_cat_id INT;
    r6_product_id BIGINT;
    h1_id INT;
    h4_id INT;
    h7_id INT;
    hb3_9005_id INT;
    hb4_9006_id INT;
    h11_id INT;
BEGIN
    -- Get Category ID
    SELECT id INTO headlight_cat_id FROM product_categories WHERE name = 'Headlight';

    -- Get Variant IDs
    SELECT id INTO h1_id FROM bulb_type_variants WHERE variant_name = 'H1' LIMIT 1;
    SELECT id INTO h4_id FROM bulb_type_variants WHERE variant_name ILIKE '%H4%' AND variant_name NOT ILIKE '%Universal%' LIMIT 1;
    SELECT id INTO h7_id FROM bulb_type_variants WHERE variant_name = 'H7' LIMIT 1;
    SELECT id INTO hb3_9005_id FROM bulb_type_variants WHERE variant_name ILIKE '%9005%' AND variant_name NOT ILIKE '%Universal%' LIMIT 1;
    SELECT id INTO hb4_9006_id FROM bulb_type_variants WHERE variant_name ILIKE '%9006%' AND variant_name NOT ILIKE '%Universal%' LIMIT 1;
    SELECT id INTO h11_id FROM bulb_type_variants WHERE variant_name ILIKE '%H11%' LIMIT 1;

    -- Create Product
    INSERT INTO products (
        sku, name, brand, category_id, 
        selling_price, cost_price, stock_quantity, 
        description, image_url, has_variants, 
        specifications, color_temperature
    ) VALUES (
        'GPNE-R6', 'GPNE R6 LED Headlight', 'GPNE',
        headlight_cat_id,
        6000.00, 4500.00, 34,
        'GPNE R6 Series. 2 Year Warranty.',
        'https://ph-test-11.slatic.net/p/1628189870be8399589d9016e1336c53.jpg', 
        true,
        '{"warranty": "2 Years"}'::jsonb,
        'Mixed'
    ) RETURNING id INTO r6_product_id;

    -- Link Variants
    
    -- H1 6000K (9)
    IF h1_id IS NOT NULL THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (r6_product_id, h1_id, 6000.00, 4500.00, 9, false, 'GPNE-R6-H1-6000K', '6000K', 'H1');
        
        -- H1 4300K (1)
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (r6_product_id, h1_id, 6000.00, 4500.00, 1, false, 'GPNE-R6-H1-4300K', '4300K', 'H1');
    END IF;

    -- 9006 6000K (6)
    IF hb4_9006_id IS NOT NULL THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (r6_product_id, hb4_9006_id, 6000.00, 4500.00, 6, false, 'GPNE-R6-9006-6000K', '6000K', '9006');
        
        -- 9006 4300K (2)
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (r6_product_id, hb4_9006_id, 6000.00, 4500.00, 2, false, 'GPNE-R6-9006-4300K', '4300K', '9006');
    END IF;

    -- H11 6000K (4)
    IF h11_id IS NOT NULL THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (r6_product_id, h11_id, 6000.00, 4500.00, 4, false, 'GPNE-R6-H11-6000K', '6000K', 'H11');
        
        -- H11 4300K (2)
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (r6_product_id, h11_id, 6000.00, 4500.00, 2, false, 'GPNE-R6-H11-4300K', '4300K', 'H11');
    END IF;

    -- 9005 6000K (2)
    IF hb3_9005_id IS NOT NULL THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (r6_product_id, hb3_9005_id, 6000.00, 4500.00, 2, false, 'GPNE-R6-9005-6000K', '6000K', '9005');
        
        -- 9005 4300K (2)
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (r6_product_id, hb3_9005_id, 6000.00, 4500.00, 2, false, 'GPNE-R6-9005-4300K', '4300K', '9005');
    END IF;

    -- H4 6000K (2)
    IF h4_id IS NOT NULL THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (r6_product_id, h4_id, 6000.00, 4500.00, 2, true, 'GPNE-R6-H4-6000K', '6000K', 'H4'); -- Primary
        
        -- H4 4300K (3)
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (r6_product_id, h4_id, 6000.00, 4500.00, 3, false, 'GPNE-R6-H4-4300K', '4300K', 'H4');
    END IF;

    -- H7 4300K (1)
    IF h7_id IS NOT NULL THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (r6_product_id, h7_id, 6000.00, 4500.00, 1, false, 'GPNE-R6-H7-4300K', '4300K', 'H7');
    END IF;

END $$;
