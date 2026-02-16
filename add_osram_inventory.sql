-- Import Osram HL Premium Inventory
-- Note: 'K' is stripped from color values.

DO $$
DECLARE
    -- Category ID
    headlight_cat_id INT;
    
    -- Product ID
    osram_product_id BIGINT;
    
    -- Bulb Type Variant IDs
    h7_id INT;
    h11_id INT;
    hb3_hb4_id INT;
    hir2_id INT;
    
    -- Names for fallback
    h11_name TEXT := 'H11';
    hb3_name TEXT := '9005';
    hir2_name TEXT := 'HIR2';
    
BEGIN
    -- 1. Get Category ID
    SELECT id INTO headlight_cat_id FROM product_categories WHERE name = 'Headlight';
    
    IF headlight_cat_id IS NULL THEN
        INSERT INTO product_categories (name) VALUES ('Headlight') RETURNING id INTO headlight_cat_id;
    END IF;

    -- 2. Validate/Get Bulb Types
    -- H7
    SELECT id INTO h7_id FROM bulb_type_variants WHERE variant_name = 'H7' LIMIT 1;
    
    -- H11 (covering H11/H16/H8)
    SELECT id, variant_name INTO h11_id, h11_name FROM bulb_type_variants WHERE variant_name ILIKE '%H11%' LIMIT 1;
    
    -- HB3/HB4 (covering 9005/9006). We'll try to find 9005 first.
    SELECT id, variant_name INTO hb3_hb4_id, hb3_name FROM bulb_type_variants WHERE variant_name ILIKE '%9005%' OR variant_name ILIKE '%HB3%' LIMIT 1;
    
    -- HIR2 (covering HIR2/9012)
    SELECT id, variant_name INTO hir2_id, hir2_name FROM bulb_type_variants WHERE variant_name ILIKE '%HIR2%' OR variant_name ILIKE '%9012%' LIMIT 1;
    
    -- If IDs are null, we might need to handle gracefully, but for now we assume basic types exist or we skip.
    -- We can fallback to fetching ANY id if specific not found? No, better skip to avoid bad data.

    -- 3. Create Product
    SELECT id INTO osram_product_id FROM products WHERE sku = 'OSRAM-HL-PREMIUM';
    
    IF osram_product_id IS NULL THEN
        INSERT INTO products (
            sku, name, brand, category_id, 
            selling_price, cost_price, stock_quantity, 
            description, has_variants, 
            specifications, color_temperature
        ) VALUES (
            'OSRAM-HL-PREMIUM', 'Osram HL Premium 10k Lumens', 'OSRAM',
            headlight_cat_id,
            6500.00, 0.00, 8, -- Sum: 2+1+1+1+2+1 = 8
            'Osram HL Premium 10k Lumens LED (1 Year Warranty)', 
            true,
            '{"warranty": "1 Year"}'::jsonb,
            'Mixed'
        ) RETURNING id INTO osram_product_id;
    END IF;

    -- 4. Insert Variants

    -- H7 4200K -> 4200 (Qty 2)
    IF h7_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM product_bulb_variants WHERE variant_sku = 'OSRAM-HL-PREMIUM-H7-4200') THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (osram_product_id, h7_id, 6500.00, 0.00, 2, true, 'OSRAM-HL-PREMIUM-H7-4200', '4200', 'H7');
    END IF;

    -- H7 6000K -> 6000 (Qty 1)
    IF h7_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM product_bulb_variants WHERE variant_sku = 'OSRAM-HL-PREMIUM-H7-6000') THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (osram_product_id, h7_id, 6500.00, 0.00, 1, false, 'OSRAM-HL-PREMIUM-H7-6000', '6000', 'H7');
    END IF;

    -- H11/H16/H8 4200K -> 4200 (Qty 1)
    IF h11_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM product_bulb_variants WHERE variant_sku = 'OSRAM-HL-PREMIUM-H11-4200') THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (osram_product_id, h11_id, 6500.00, 0.00, 1, false, 'OSRAM-HL-PREMIUM-H11-4200', '4200', 'H11');
    END IF;

    -- H11/H16/H8 6000K -> 6000 (Qty 1)
    IF h11_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM product_bulb_variants WHERE variant_sku = 'OSRAM-HL-PREMIUM-H11-6000') THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (osram_product_id, h11_id, 6500.00, 0.00, 1, false, 'OSRAM-HL-PREMIUM-H11-6000', '6000', 'H11');
    END IF;

    -- HB3/HB4 4200K -> 4200 (Qty 2)
    -- Using hb3_hb4_id (mapped to 9005/HB3 primarily)
    IF hb3_hb4_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM product_bulb_variants WHERE variant_sku = 'OSRAM-HL-PREMIUM-HB3HB4-4200') THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (osram_product_id, hb3_hb4_id, 6500.00, 0.00, 2, false, 'OSRAM-HL-PREMIUM-HB3HB4-4200', '4200', 'HB3/HB4');
    END IF;

    -- HIR2 4200K -> 4200 (Qty 1)
    IF hir2_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM product_bulb_variants WHERE variant_sku = 'OSRAM-HL-PREMIUM-HIR2-4200') THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, cost_price, stock_quantity, is_primary, variant_sku, variant_color, bulb_type)
        VALUES (osram_product_id, hir2_id, 6500.00, 0.00, 1, false, 'OSRAM-HL-PREMIUM-HIR2-4200', '4200', 'HIR2');
    END IF;

END $$;
