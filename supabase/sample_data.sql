
-- 1. Insert Categories (Upsert)
INSERT INTO product_categories (name, description) VALUES
('Headlight', 'Main forward lighting'),
('Fog Light', 'Auxiliary fog lamps'),
('Signal Light', 'Turn indicators and park lights'),
('Interior Light', 'Cabin and dome lights'),
('Horns', 'Automotive horns and sirens'),
('Wipers', 'Windshield wipers')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Bulb Types (Upsert)
INSERT INTO bulb_types (code, description) VALUES
('H1', 'Single beam'),
('H4', 'Hi/Low beam'),
('H7', 'Single beam'),
('H11', 'Single beam (Fog/Low)'),
('9005', 'HB3 High beam'),
('9006', 'HB4 Low beam'),
('9012', 'HIR2 Single beam'),
('T10', 'W5W Mini wedge'),
('T15', 'W16W Reverse light'),
('T20', '7440/7443 Wedge'),
('1156', 'BA15S Single contact'),
('1157', 'BAY15D Double contact'),
('D2S', 'HID Xenon generic')
ON CONFLICT (code) DO NOTHING;

-- 3. Insert Suppliers (Upsert)
-- Note: suppliers table doesn't have unique constraint on name in schema, so we check first or just insert if empty.
-- For script robustness, we'll try to select first.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'GPNE Official') THEN
        INSERT INTO suppliers (name, contact_person) VALUES ('GPNE Official', 'Mr. Wu');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Osram PH') THEN
        INSERT INTO suppliers (name, contact_person) VALUES ('Osram PH', 'Sales Dept');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM suppliers WHERE name = 'Bosch Automotive') THEN
        INSERT INTO suppliers (name) VALUES ('Bosch Automotive');
    END IF;
END $$;

-- 4. TRIM DATA (Optional - Clear existing products to avoid duplicates? No, safer to append)

-- 5. Insert Products & Variants
DO $$
DECLARE
    -- IDs
    cat_hl bigint;
    cat_sig bigint;
    cat_horn bigint;
    sup_gpne bigint;
    sup_osram bigint;
    sup_bosch bigint;
    
    prod_id bigint;
BEGIN
    -- Get IDs
    SELECT id INTO cat_hl FROM product_categories WHERE name = 'Headlight';
    SELECT id INTO cat_sig FROM product_categories WHERE name = 'Signal Light';
    SELECT id INTO cat_horn FROM product_categories WHERE name = 'Horns';
    
    SELECT id INTO sup_gpne FROM suppliers WHERE name = 'GPNE Official';
    SELECT id INTO sup_osram FROM suppliers WHERE name = 'Osram PH';
    SELECT id INTO sup_bosch FROM suppliers WHERE name = 'Bosch Automotive';

    -------------------------------------------------------
    -- PRODUCT 1: GPNE R6 (LED Headlight) - Multi-Variant
    -------------------------------------------------------
    -- Check if exists to prevent duplicate parents
    IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'GPNE R6 Series') THEN
        
        INSERT INTO products (
            name, sku, brand, category_id, supplier_id, 
            selling_price, cost_price, stock_quantity, 
            description, has_variants, image_url,
            specifications
        ) VALUES (
            'GPNE R6 Series', 'GPNE-R6-BASE', 'GPNE', cat_hl, sup_gpne,
            3500.00, 2200.00, 50, -- Aggregate stock
            'High performance LED headlight, 6000K pure white, 300% brighter than halogen.', true, 
             'https://m.media-amazon.com/images/I/71wI-C4e-iL._AC_SL1500_.jpg', -- Placeholder image
            '{"lumens": 12000, "wattage": 60, "lifespan": "30000hrs"}'::jsonb
        ) RETURNING id INTO prod_id;

        -- Variants for GPNE R6
        INSERT INTO product_bulb_variants (
            product_id, bulb_type, variant_sku, selling_price, cost_price, stock_quantity, variant_color, description
        ) VALUES 
        (prod_id, 'H4',   'GPNE-R6-H4',   3500, 2200, 10, '6000K', 'Hi/Low Beam'),
        (prod_id, 'H7',   'GPNE-R6-H7',   3500, 2200, 8,  '6000K', 'Single Beam for Projectors'),
        (prod_id, 'H11',  'GPNE-R6-H11',  3500, 2200, 12, '6000K', 'Fog/Low Beam'),
        (prod_id, '9005', 'GPNE-R6-9005', 3500, 2200, 10, '6000K', 'High Beam HB3'),
        (prod_id, '9012', 'GPNE-R6-9012', 3500, 2200, 10, '6000K', 'HIR2 Projector');

    END IF;

    -------------------------------------------------------
    -- PRODUCT 2: Osram T10 LED (Park Light) - Color Variants
    -------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Osram T10 LED') THEN
        
        INSERT INTO products (
            name, sku, brand, category_id, supplier_id, 
            selling_price, cost_price, stock_quantity, 
            description, has_variants, bulb_type_id
        ) VALUES (
            'Osram T10 LED', 'OSRAM-T10-BASE', 'Osram', cat_sig, sup_osram,
            450.00, 250.00, 30,
            'Premium T10 W5W LED for park light, interior, or plate light.', true,
            (SELECT id FROM bulb_types WHERE code = 'T10') -- Parent knows it's T10 family
        ) RETURNING id INTO prod_id;

        INSERT INTO product_bulb_variants (
            product_id, bulb_type, variant_sku, stock_quantity, variant_color, color_temperature
        ) VALUES 
        (prod_id, 'T10', 'OSRAM-T10-WHT', 15, 'White', 6000),
        (prod_id, 'T10', 'OSRAM-T10-AMB', 10, 'Amber', 3000),
        (prod_id, 'T10', 'OSRAM-T10-RED', 5,  'Red',   NULL);

    END IF;

    -------------------------------------------------------
    -- PRODUCT 3: Bosch Europa Silver (Single Item)
    -------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Bosch Europa Silver') THEN
        
        INSERT INTO products (
            name, sku, brand, category_id, supplier_id, 
            selling_price, cost_price, stock_quantity, 
            description, has_variants, image_url
        ) VALUES (
            'Bosch Europa Silver', 'BOSCH-EURO-SIL', 'Bosch', cat_horn, sup_bosch,
            2800.00, 1900.00, 5,
            'Review mirror finish, loud distinct european sound. 12V.', false,
            'https://ph-test-11.slatic.net/p/Showcase/d20626379566276856c2069796016f49.jpg'
        );

    END IF;
    
    -------------------------------------------------------
    -- PRODUCT 4: Generic 1156 Signal (Budget)
    -------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Generic Signal Light 1156') THEN
        
        INSERT INTO products (
            name, sku, brand, category_id, supplier_id, 
            selling_price, cost_price, stock_quantity, 
            description, has_variants
        ) VALUES (
            'Generic Signal Light 1156', 'GEN-1156-BASE', 'Generic', cat_sig, NULL,
            150.00, 50.00, 100,
            'Standard replacement signal bulb.', true
        ) RETURNING id INTO prod_id;

        INSERT INTO product_bulb_variants (
            product_id, bulb_type, variant_sku, stock_quantity, variant_color
        ) VALUES 
        (prod_id, '1156', 'GEN-1156-BA15S', 50, 'BA15S'),
        (prod_id, '1156', 'GEN-1156-BAU15S', 50, 'BAU15S (Offset pins)');

    END IF;

END $$;
