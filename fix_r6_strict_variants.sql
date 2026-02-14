-- Create exact simple variants provided by user
-- H1
INSERT INTO bulb_type_variants (base_name, variant_name, compatibility_list, display_name, description, is_active)
SELECT 'Simple Bulb', 'H1', ARRAY['H1'], 'H1', 'Standard H1', true
WHERE NOT EXISTS (SELECT 1 FROM bulb_type_variants WHERE variant_name = 'H1' AND display_name = 'H1');

-- H4
INSERT INTO bulb_type_variants (base_name, variant_name, compatibility_list, display_name, description, is_active)
SELECT 'Simple Bulb', 'H4', ARRAY['H4'], 'H4', 'Standard H4', true
WHERE NOT EXISTS (SELECT 1 FROM bulb_type_variants WHERE variant_name = 'H4' AND display_name = 'H4');

-- H7
INSERT INTO bulb_type_variants (base_name, variant_name, compatibility_list, display_name, description, is_active)
SELECT 'Simple Bulb', 'H7', ARRAY['H7'], 'H7', 'Standard H7', true
WHERE NOT EXISTS (SELECT 1 FROM bulb_type_variants WHERE variant_name = 'H7' AND display_name = 'H7');

-- 9005
INSERT INTO bulb_type_variants (base_name, variant_name, compatibility_list, display_name, description, is_active)
SELECT 'Simple Bulb', '9005', ARRAY['9005'], '9005', 'Standard 9005', true
WHERE NOT EXISTS (SELECT 1 FROM bulb_type_variants WHERE variant_name = '9005' AND display_name = '9005');

-- 9006
INSERT INTO bulb_type_variants (base_name, variant_name, compatibility_list, display_name, description, is_active)
SELECT 'Simple Bulb', '9006', ARRAY['9006'], '9006', 'Standard 9006', true
WHERE NOT EXISTS (SELECT 1 FROM bulb_type_variants WHERE variant_name = '9006' AND display_name = '9006');

-- H11
INSERT INTO bulb_type_variants (base_name, variant_name, compatibility_list, display_name, description, is_active)
SELECT 'Simple Bulb', 'H11', ARRAY['H11'], 'H11', 'Standard H11', true
WHERE NOT EXISTS (SELECT 1 FROM bulb_type_variants WHERE variant_name = 'H11' AND display_name = 'H11');

-- Update GPNE R6 product variants to point to these new exact bulb types
DO $$
DECLARE
    h1_id INT;
    h4_id INT;
    h7_id INT;
    id_9005 INT;
    id_9006 INT;
    h11_id INT;
BEGIN
    SELECT id INTO h1_id FROM bulb_type_variants WHERE variant_name = 'H1' AND display_name = 'H1' LIMIT 1;
    SELECT id INTO h4_id FROM bulb_type_variants WHERE variant_name = 'H4' AND display_name = 'H4' LIMIT 1;
    SELECT id INTO h7_id FROM bulb_type_variants WHERE variant_name = 'H7' AND display_name = 'H7' LIMIT 1;
    SELECT id INTO id_9005 FROM bulb_type_variants WHERE variant_name = '9005' AND display_name = '9005' LIMIT 1;
    SELECT id INTO id_9006 FROM bulb_type_variants WHERE variant_name = '9006' AND display_name = '9006' LIMIT 1;
    SELECT id INTO h11_id FROM bulb_type_variants WHERE variant_name = 'H11' AND display_name = 'H11' LIMIT 1;

    -- Update
    UPDATE product_bulb_variants SET variant_id = h1_id, bulb_type = 'H1' WHERE variant_sku LIKE 'GPNE-R6-H1-%' AND h1_id IS NOT NULL;
    UPDATE product_bulb_variants SET variant_id = h4_id, bulb_type = 'H4' WHERE variant_sku LIKE 'GPNE-R6-H4-%' AND h4_id IS NOT NULL;
    UPDATE product_bulb_variants SET variant_id = h7_id, bulb_type = 'H7' WHERE variant_sku LIKE 'GPNE-R6-H7-%' AND h7_id IS NOT NULL;
    UPDATE product_bulb_variants SET variant_id = id_9005, bulb_type = '9005' WHERE variant_sku LIKE 'GPNE-R6-9005-%' AND id_9005 IS NOT NULL;
    UPDATE product_bulb_variants SET variant_id = id_9006, bulb_type = '9006' WHERE variant_sku LIKE 'GPNE-R6-9006-%' AND id_9006 IS NOT NULL;
    UPDATE product_bulb_variants SET variant_id = h11_id, bulb_type = 'H11' WHERE variant_sku LIKE 'GPNE-R6-H11-%' AND h11_id IS NOT NULL;
END $$;
