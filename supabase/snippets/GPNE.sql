-- Import Inventory Data for R6, RS7, and R3 Models
-- Note: 'K' is stripped from color values (e.g., '6000K' -> '6000')

DO $$
DECLARE
    -- Category ID
    headlight_cat_id INT;
    
    -- Product IDs
    r6_product_id BIGINT;
    rs7_product_id BIGINT;
    r3_product_id BIGINT;
    
    -- Bulb Type Variant IDs
    h1_id INT;
    h4_id INT;
    h7_id INT;
    h11_id INT;
    hb3_9005_id INT;
    hb4_9006_id INT;
    
BEGIN
    -- 1. Get Category ID
    SELECT id INTO headlight_cat_id FROM product_categories WHERE name = 'Headlight';
    
    -- If category doesn't exist, create it (optional safer guard)
    IF headlight_cat_id IS NULL THEN
        INSERT INTO product_categories (name) VALUES ('Headlight') RETURNING id INTO headlight_cat_id;
    END IF;

    -- 2. Get Bulb Type Variant IDs
    SELECT id INTO h1_id FROM bulb_type_variants WHERE variant_name = 'H1' LIMIT 1;
    SELECT id INTO h4_id FROM bulb_type_variants WHERE variant_name ILIKE '%H4%' AND variant_name NOT ILIKE '%Universal%' LIMIT 1;
    SELECT id INTO h7_id FROM bulb_type_variants WHERE variant_name = 'H7' LIMIT 1;
    SELECT id INTO h11_id FROM bulb_type_variants WHERE variant_name ILIKE '%H11%' LIMIT 1;
    SELECT id INTO hb3_9005_id FROM bulb_type_variants WHERE variant_name ILIKE '%9005%' AND variant_name NOT ILIKE '%Universal%' LIMIT 1;
    SELECT id INTO hb4_9006_id FROM bulb_type_variants WHERE variant_name ILIKE '%9006%' AND variant_name NOT ILIKE '%Universal%' LIMIT 1;

    -- ==========================================
    -- PRODUCT 1: GPNE R6
    -- ==========================================
    
    -- Check if product exists, if not create it
    SELECT id INTO r6_product_id FROM products WHERE sku = 'GPNE-R6';
    
    IF r6_product_id IS NULL THEN
        INSERT INTO products (
            sku, name, brand, category_id, 
            selling_price, cost_price, stock_quantity, 
            description, image_url, has_variants, 
            specifications, color_temperature
        ) VALUES (
            'GPNE-R6', 'GPNE R6 LED Headlight', 'GPNE',
            headlight_cat_id,
            6000.00, 4500.00, 39,
            'GPNE R6 Series. 2 Year Warranty.',
            'https://ph-test-11.slatic.net/p/1628189870be8399589d9016e1336c53.jpg', 
            true,
            '{"warranty": "2 Years"}'::jsonb,
            'Mixed'
        ) RETURNING id INTO r6_product_id;
    END IF;

    -- Insert Variants for R6
    -- R6 H1 6000 (Qty: 9)
    IF h1_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM product_bulb_variants WHERE variant_sku = 'GPNE-R6-H1-6000') THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (r6_product_id, h1_id, 6000.00, 4500.00, 9, false, 'GPNE-R6-H1-6000', '6000', 'H1');
    END IF;

    -- R6 H1 4300 (Qty: 1)
    IF h1_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM product_bulb_variants WHERE variant_sku = 'GPNE-R6-H1-4300') THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (r6_product_id, h1_id, 6000.00, 4500.00, 1, false, 'GPNE-R6-H1-4300', '4300', 'H1');
    END IF;

    -- R6 9006 6000 (Qty: 6)
    IF hb4_9006_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM product_bulb_variants WHERE variant_sku = 'GPNE-R6-9006-6000') THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (r6_product_id, hb4_9006_id, 6000.00, 4500.00, 6, false, 'GPNE-R6-9006-6000', '6000', '9006');
    END IF;

    -- R6 9006 4300 (Qty: 2)
    IF hb4_9006_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM product_bulb_variants WHERE variant_sku = 'GPNE-R6-9006-4300') THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (r6_product_id, hb4_9006_id, 6000.00, 4500.00, 2, false, 'GPNE-R6-9006-4300', '4300', '9006');
    END IF;

    -- R6 H11 6000 (Qty: 4)
    IF h11_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM product_bulb_variants WHERE variant_sku = 'GPNE-R6-H11-6000') THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (r6_product_id, h11_id, 6000.00, 4500.00, 4, false, 'GPNE-R6-H11-6000', '6000', 'H11');
    END IF;
    
    -- R6 H11 4300 (Qty: 2)
    IF h11_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM product_bulb_variants WHERE variant_sku = 'GPNE-R6-H11-4300') THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (r6_product_id, h11_id, 6000.00, 4500.00, 2, false, 'GPNE-R6-H11-4300', '4300', 'H11');
    END IF;

    -- R6 9005 6000 (Qty: 2)
    IF hb3_9005_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM product_bulb_variants WHERE variant_sku = 'GPNE-R6-9005-6000') THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (r6_product_id, hb3_9005_id, 6000.00, 4500.00, 2, false, 'GPNE-R6-9005-6000', '6000', '9005');
    END IF;

    -- R6 9005 4300 (Qty: 2)
    IF hb3_9005_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM product_bulb_variants WHERE variant_sku = 'GPNE-R6-9005-4300') THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (r6_product_id, hb3_9005_id, 6000.00, 4500.00, 2, false, 'GPNE-R6-9005-4300', '4300', '9005');
    END IF;

    -- R6 H4 6000 (Qty: 2)
    IF h4_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM product_bulb_variants WHERE variant_sku = 'GPNE-R6-H4-6000') THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (r6_product_id, h4_id, 6000.00, 4500.00, 2, true, 'GPNE-R6-H4-6000', '6000', 'H4');
    END IF;

    -- R6 H4 4300 (Qty: 3)
    IF h4_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM product_bulb_variants WHERE variant_sku = 'GPNE-R6-H4-4300') THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (r6_product_id, h4_id, 6000.00, 4500.00, 3, false, 'GPNE-R6-H4-4300', '4300', 'H4');
    END IF;

    -- R6 H7 4300 (Qty: 1)
    IF h7_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM product_bulb_variants WHERE variant_sku = 'GPNE-R6-H7-4300') THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (r6_product_id, h7_id, 6000.00, 4500.00, 1, false, 'GPNE-R6-H7-4300', '4300', 'H7');
    END IF;


    -- ==========================================
    -- PRODUCT 2: GPNE RS7
    -- ==========================================
    
    SELECT id INTO rs7_product_id FROM products WHERE sku = 'GPNE-RS7';
    
    IF rs7_product_id IS NULL THEN
        INSERT INTO products (
            sku, name, brand, category_id, 
            selling_price, cost_price, stock_quantity, 
            description, has_variants, 
            specifications, color_temperature
        ) VALUES (
            'GPNE-RS7', 'GPNE RS7 LED Headlight', 'GPNE',
            headlight_cat_id,
            8500.00, 6000.00, 4,
            'GPNE RS7 Series.', 
            true,
            '{"warranty": "1 Year"}'::jsonb,
            '6000'
        ) RETURNING id INTO rs7_product_id;
    END IF;

    -- RS7 H4 6000 (Qty: 1)
    IF h4_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM product_bulb_variants WHERE variant_sku = 'GPNE-RS7-H4-6000') THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (rs7_product_id, h4_id, 8500.00, 6000.00, 1, true, 'GPNE-RS7-H4-6000', '6000', 'H4');
    END IF;

    -- RS7 9006 6000 (Qty: 1)
    IF hb4_9006_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM product_bulb_variants WHERE variant_sku = 'GPNE-RS7-9006-6000') THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (rs7_product_id, hb4_9006_id, 8500.00, 6000.00, 1, false, 'GPNE-RS7-9006-6000', '6000', '9006');
    END IF;

    -- RS7 9005 6000 (Qty: 1)
    IF hb3_9005_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM product_bulb_variants WHERE variant_sku = 'GPNE-RS7-9005-6000') THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (rs7_product_id, hb3_9005_id, 8500.00, 6000.00, 1, false, 'GPNE-RS7-9005-6000', '6000', '9005');
    END IF;

    -- RS7 H1 6000 (Qty: 1)
    IF h1_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM product_bulb_variants WHERE variant_sku = 'GPNE-RS7-H1-6000') THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (rs7_product_id, h1_id, 8500.00, 6000.00, 1, false, 'GPNE-RS7-H1-6000', '6000', 'H1');
    END IF;


    -- ==========================================
    -- PRODUCT 3: GPNE R3
    -- ==========================================
    
    SELECT id INTO r3_product_id FROM products WHERE sku = 'GPNE-R3';
    
    IF r3_product_id IS NULL THEN
        INSERT INTO products (
            sku, name, brand, category_id, 
            selling_price, cost_price, stock_quantity, 
            description, has_variants, 
            specifications
        ) VALUES (
            'GPNE-R3', 'GPNE R3 LED Headlight', 'GPNE',
            headlight_cat_id,
            5000.00, 0.00, 2,
            'GPNE R3 Series.', 
            true,
            '{}'::jsonb
        ) RETURNING id INTO r3_product_id;
    END IF;

    -- R3 H1 (Qty: 2, No Color)
    IF h1_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM product_bulb_variants WHERE variant_sku = 'GPNE-R3-H1') THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (r3_product_id, h1_id, 5000.00, 0.00, 2, true, 'GPNE-R3-H1', NULL, 'H1');
    END IF;

END $$;