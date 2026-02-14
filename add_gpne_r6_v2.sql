
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

    -- Get Variant IDs (Exact Matches to avoid ambiguity with Universal kits)
    SELECT id INTO h1_id FROM bulb_type_variants WHERE variant_name = 'H1' LIMIT 1;
    SELECT id INTO h4_id FROM bulb_type_variants WHERE variant_name = 'H4/Hb2/9003' LIMIT 1;
    SELECT id INTO h7_id FROM bulb_type_variants WHERE variant_name = 'H7' LIMIT 1;
    SELECT id INTO hb3_9005_id FROM bulb_type_variants WHERE variant_name = '9005/HB3' LIMIT 1;
    SELECT id INTO hb4_9006_id FROM bulb_type_variants WHERE variant_name = '9006/HB4' LIMIT 1;
    SELECT id INTO h11_id FROM bulb_type_variants WHERE variant_name = 'H11/H8/H16' LIMIT 1;

    -- Check if Product exists
    SELECT id INTO r6_product_id FROM products WHERE sku = 'GPNE-R6' LIMIT 1;

    IF r6_product_id IS NULL THEN
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
            'https://m.media-amazon.com/images/I/71r+180k+TL._AC_SL1500_.jpg', 
            true,
            '{"warranty": "2 Years"}'::jsonb,
            'Mixed'
        ) RETURNING id INTO r6_product_id;
    END IF;

    -- Clear existing variants to ensure clean state
    DELETE FROM product_bulb_variants WHERE product_id = r6_product_id;

    -- Link Variants
    
    -- H1 6000K (9)
    IF h1_id IS NOT NULL THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, price_adjustment, stock_quantity, is_primary, variant_sku, variant_color)
        VALUES (r6_product_id, h1_id, 0, 9, false, 'GPNE-R6-H1-6000K', '6000K');
        
        -- H1 4300K (1)
        INSERT INTO product_bulb_variants (product_id, variant_id, price_adjustment, stock_quantity, is_primary, variant_sku, variant_color)
        VALUES (r6_product_id, h1_id, 0, 1, false, 'GPNE-R6-H1-4300K', '4300K');
    END IF;

    -- 9006 6000K (6)
    IF hb4_9006_id IS NOT NULL THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, price_adjustment, stock_quantity, is_primary, variant_sku, variant_color)
        VALUES (r6_product_id, hb4_9006_id, 0, 6, false, 'GPNE-R6-9006-6000K', '6000K');
        
        -- 9006 4300K (2)
        INSERT INTO product_bulb_variants (product_id, variant_id, price_adjustment, stock_quantity, is_primary, variant_sku, variant_color)
        VALUES (r6_product_id, hb4_9006_id, 0, 2, false, 'GPNE-R6-9006-4300K', '4300K');
    END IF;

    -- H11 6000K (4)
    IF h11_id IS NOT NULL THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, price_adjustment, stock_quantity, is_primary, variant_sku, variant_color)
        VALUES (r6_product_id, h11_id, 0, 4, false, 'GPNE-R6-H11-6000K', '6000K');
        
        -- H11 4300K (2)
        INSERT INTO product_bulb_variants (product_id, variant_id, price_adjustment, stock_quantity, is_primary, variant_sku, variant_color)
        VALUES (r6_product_id, h11_id, 0, 2, false, 'GPNE-R6-H11-4300K', '4300K');
    END IF;

    -- 9005 6000K (2)
    IF hb3_9005_id IS NOT NULL THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, price_adjustment, stock_quantity, is_primary, variant_sku, variant_color)
        VALUES (r6_product_id, hb3_9005_id, 0, 2, false, 'GPNE-R6-9005-6000K', '6000K');
        
        -- 9005 4300K (2)
        INSERT INTO product_bulb_variants (product_id, variant_id, price_adjustment, stock_quantity, is_primary, variant_sku, variant_color)
        VALUES (r6_product_id, hb3_9005_id, 0, 2, false, 'GPNE-R6-9005-4300K', '4300K');
    END IF;

    -- H4 6000K (2)
    IF h4_id IS NOT NULL THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, price_adjustment, stock_quantity, is_primary, variant_sku, variant_color)
        VALUES (r6_product_id, h4_id, 0, 2, true, 'GPNE-R6-H4-6000K', '6000K'); 
        
        -- H4 4300K (3)
        INSERT INTO product_bulb_variants (product_id, variant_id, price_adjustment, stock_quantity, is_primary, variant_sku, variant_color)
        VALUES (r6_product_id, h4_id, 0, 3, false, 'GPNE-R6-H4-4300K', '4300K');
    END IF;

    -- H7 4300K (1)
    IF h7_id IS NOT NULL THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, price_adjustment, stock_quantity, is_primary, variant_sku, variant_color)
        VALUES (r6_product_id, h7_id, 0, 1, false, 'GPNE-R6-H7-4300K', '4300K');
    END IF;

END $$;
