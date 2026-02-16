-- Final Import Script for OSRAM HL Premium (10k Lumens)
-- Data source: Shared Image
-- Rule: Color temperature numeric only (e.g., 4200K -> 4200)

DO $$
DECLARE
    cat_id INT;
    p_id BIGINT;
    
    -- Bulb Type IDs (fetched from your existing bulb_type_variants table)
    h7_id INT;
    h11_id INT;
    hb_combo_id INT; -- For HB3/HB4
    hir2_id INT;
BEGIN
    -- 1. Setup Category
    SELECT id INTO cat_id FROM product_categories WHERE name = 'Headlight';
    IF cat_id IS NULL THEN
        INSERT INTO product_categories (name) VALUES ('Headlight') RETURNING id INTO cat_id;
    END IF;

    -- 2. Fetch required variant IDs
    SELECT id INTO h7_id FROM bulb_type_variants WHERE variant_name = 'H7' LIMIT 1;
    SELECT id INTO h11_id FROM bulb_type_variants WHERE variant_name ILIKE '%H11%' LIMIT 1;
    SELECT id INTO hb_combo_id FROM bulb_type_variants WHERE variant_name ILIKE '%9005%' OR variant_name ILIKE '%HB3%' LIMIT 1;
    SELECT id INTO hir2_id FROM bulb_type_variants WHERE variant_name ILIKE '%HIR2%' OR variant_name ILIKE '%9012%' LIMIT 1;

    -- 3. Create/Retrieve Base Product
    -- Using 'OSRAM-HL-10K' as a unique identifier for this specific line
    SELECT id INTO p_id FROM products WHERE sku = 'OSRAM-HL-10K';
    
    IF p_id IS NULL THEN
        INSERT INTO products (
            sku, name, brand, category_id, 
            selling_price, cost_price, stock_quantity, 
            description, image_url, has_variants, 
            specifications, color_temperature
        ) VALUES (
            'OSRAM-HL-10K', 'OSRAM HL Premium 10k Lumens', 'OSRAM',
            cat_id, 6500.00, 0.00, 8, 
            'OSRAM HL Premium LED, 10,000 Lumens series. 1 year warranty.', 
            NULL, true, 
            '{"warranty": "1 Year", "lumens": "10000"}'::jsonb,
            'Mixed'
        ) RETURNING id INTO p_id;
    END IF;

    -- 4. Clean up existing variants for this product to prevent duplicates (Optional but safer)
    DELETE FROM product_bulb_variants WHERE product_id = p_id;

    -- 5. Insert Variants (Mappings from Image)
    
    -- Row 1: H7 | 4200 | Qty 2
    IF h7_id IS NOT NULL THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, stock_quantity, variant_sku, variant_color, bulb_type)
        VALUES (p_id, h7_id, 6500.00, 2, 'OSRAM-HL-10K-H7-4200', '4200', 'H7');
    END IF;

    -- Row 2: H7 | 6000 | Qty 1
    IF h7_id IS NOT NULL THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, stock_quantity, variant_sku, variant_color, bulb_type)
        VALUES (p_id, h7_id, 6500.00, 1, 'OSRAM-HL-10K-H7-6000', '6000', 'H7');
    END IF;

    -- Row 3: H11/H16/H8 | 4200 | Qty 1
    IF h11_id IS NOT NULL THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, stock_quantity, variant_sku, variant_color, bulb_type)
        VALUES (p_id, h11_id, 6500.00, 1, 'OSRAM-HL-10K-H11-4200', '4200', 'H11/H16/H8');
    END IF;

    -- Row 4: H11/H16/H8 | 6000 | Qty 1
    IF h11_id IS NOT NULL THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, stock_quantity, variant_sku, variant_color, bulb_type)
        VALUES (p_id, h11_id, 6500.00, 1, 'OSRAM-HL-10K-H11-6000', '6000', 'H11/H16/H8');
    END IF;

    -- Row 5: HB3/HB4 | 4200 | Qty 2
    IF hb_combo_id IS NOT NULL THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, stock_quantity, variant_sku, variant_color, bulb_type)
        VALUES (p_id, hb_combo_id, 6500.00, 2, 'OSRAM-HL-10K-HB3HB4-4200', '4200', 'HB3/HB4');
    END IF;

    -- Row 6: HIR2 | 4200 | Qty 1
    IF hir2_id IS NOT NULL THEN
        INSERT INTO product_bulb_variants (product_id, variant_id, selling_price, stock_quantity, variant_sku, variant_color, bulb_type)
        VALUES (p_id, hir2_id, 6500.00, 1, 'OSRAM-HL-10K-HIR2-4200', '4200', 'HIR2');
    END IF;

END $$;