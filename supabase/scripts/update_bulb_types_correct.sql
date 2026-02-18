-- =====================================================
-- UPDATE BULB TYPES WITH COMPATIBILITY (CORRECTED)
-- =====================================================
-- This script updates existing bulb types to show compatibility

-- First, let's see current bulb types
SELECT 'Current Bulb Types:' as info;
SELECT id, code, description, compatibility_group, base_code FROM bulb_types ORDER BY code;

-- Update existing bulb types with compatibility information
UPDATE bulb_types SET 
    description = 'Standard H4 dual filament headlight bulb',
    compatibility_group = 'H4_GROUP',
    base_code = 'H4',
    is_primary = true,
    notes = 'Standard halogen bulb'
WHERE code = 'H4';

UPDATE bulb_types SET 
    description = 'Standard H7 single filament headlight bulb',
    compatibility_group = 'H7_GROUP',
    base_code = 'H7',
    is_primary = true,
    notes = 'Standard halogen bulb'
WHERE code = 'H7';

UPDATE bulb_types SET 
    description = 'Universal fog light bulb - compatible with H11, H16, and H8',
    compatibility_group = 'H11_GROUP',
    base_code = 'H11',
    is_primary = true,
    notes = 'Cross-compatible with H16 and H8'
WHERE code = 'H11';

UPDATE bulb_types SET 
    description = 'High beam bulb - compatible with 9005 and HB3',
    compatibility_group = '9005_GROUP',
    base_code = '9005',
    is_primary = true,
    notes = 'Also known as HB3'
WHERE code = '9005';

UPDATE bulb_types SET 
    description = 'Low beam bulb - compatible with 9006 and HB4',
    compatibility_group = '9006_GROUP',
    base_code = '9006',
    is_primary = true,
    notes = 'Also known as HB4'
WHERE code = '9006';

UPDATE bulb_types SET 
    description = 'Turn signal bulb - compatible with 7507 and PY21W',
    compatibility_group = '7507_GROUP',
    base_code = '7507',
    is_primary = true,
    notes = 'European turn signal standard'
WHERE code = '7507';

UPDATE bulb_types SET 
    description = 'Brake/tail light bulb - compatible with 1157, 2057, 2357, and 7528',
    compatibility_group = '1157_GROUP',
    base_code = '1157',
    is_primary = true,
    notes = 'Dual filament brake/tail light'
WHERE code = '1157';

UPDATE bulb_types SET 
    description = 'Interior/parking light bulb - compatible with W5W, 194, and 168',
    compatibility_group = 'W5W_GROUP',
    base_code = 'W5W',
    is_primary = true,
    notes = 'Universal interior bulb'
WHERE code = 'W5W';

UPDATE bulb_types SET 
    description = 'HID xenon bulb - compatible with D2S, D1S, D3S, and D4S',
    compatibility_group = 'D2S_GROUP',
    base_code = 'D2S',
    is_primary = true,
    notes = 'High intensity discharge'
WHERE code = 'D2S';

-- Insert LED and enhanced bulb types if they don't exist
INSERT INTO bulb_types (code, description, compatibility_group, base_code, is_primary, notes) VALUES
('H4_LED', 'H4/H7/9005/9006 LED conversion kit', 'UNIVERSAL_LED', 'H4', true, 'Universal LED kit with multiple adapters'),
('H7_LED', 'H7 LED headlight bulb', 'H7_GROUP', 'H7', true, 'Direct H7 LED replacement'),
('H11_LED', 'H11/H8/H16 LED fog light', 'H11_GROUP', 'H11', true, 'Universal LED fog light'),
('W5W_LED', 'W5W/194/168/147/152 LED interior kit', 'W5W_GROUP', 'W5W', true, 'Universal interior LED kit'),
('9005_LED', '9005/HB3/9011/HIR1 LED high beam', '9005_GROUP', '9005', true, 'Universal LED high beam'),
('9006_LED', '9006/HB4/9012/HIR2 LED low beam', '9006_GROUP', '9006', true, 'Universal LED low beam'),
('1157_LED', '1157/2057/2357/7528 LED brake/tail light', '1157_GROUP', '1157', true, 'Universal LED brake/tail light'),
('7507_LED', '7507/PY21W/1156/2357 LED turn signal', '7507_GROUP', '7507', true, 'Universal LED turn signal'),
('D2S_HID', 'D1S/D2S/D3S/D4S HID kit', 'D2S_GROUP', 'D2S', true, 'Multi-voltage HID conversion kit')
ON CONFLICT (code) DO UPDATE SET
    description = EXCLUDED.description,
    compatibility_group = EXCLUDED.compatibility_group,
    base_code = EXCLUDED.base_code,
    is_primary = EXCLUDED.is_primary,
    notes = EXCLUDED.notes;

-- Update products to use the correct bulb types
UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = 'H4_LED')
WHERE sku IN ('GPNE-H4-LED-001', 'GPNE-UNI-LED-001');

UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = 'H7_LED')
WHERE sku = 'GPNE-H7-LED-002';

UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = 'H11_LED')
WHERE sku IN ('GPNE-H11-LED-003', 'GPNE-MULTI-FOG-001');

UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = '9005_LED')
WHERE sku = 'GPNE-MULTI-HIGH-001';

UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = '9006_LED')
WHERE sku = 'GPNE-UNI-LOW-001';

UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = '1157_LED')
WHERE sku = 'GPNE-UNI-BRAKE-001';

UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = '7507_LED')
WHERE sku = 'GPNE-MULTI-SIG-001';

UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = 'W5W_LED')
WHERE sku = 'GPNE-UNI-INT-001';

UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = 'D2S_HID')
WHERE sku = 'GPNE-MULTI-HID-001';

-- Create a view for displaying compatibility in bulb types
CREATE OR REPLACE VIEW bulb_type_display AS
SELECT 
    bt.id,
    bt.code,
    CASE 
        WHEN bt.compatibility_group = 'H11_GROUP' THEN 'H11/H16/H8'
        WHEN bt.compatibility_group = '9005_GROUP' THEN '9005/HB3'
        WHEN bt.compatibility_group = '9006_GROUP' THEN '9006/HB4'
        WHEN bt.compatibility_group = '7507_GROUP' THEN '7507/PY21W'
        WHEN bt.compatibility_group = '1157_GROUP' THEN '1157/2057/2357/7528'
        WHEN bt.compatibility_group = 'W5W_GROUP' THEN 'W5W/194/168'
        WHEN bt.compatibility_group = 'D2S_GROUP' THEN 'D1S/D2S/D3S/D4S'
        WHEN bt.compatibility_group = 'UNIVERSAL_LED' AND bt.code = 'H4_LED' THEN 'H4/H7/9005/9006 LED'
        WHEN bt.compatibility_group = 'UNIVERSAL_LED' AND bt.code = 'H11_LED' THEN 'H11/H8/H16 LED'
        WHEN bt.compatibility_group = 'UNIVERSAL_LED' AND bt.code = 'W5W_LED' THEN 'W5W/194/168/147/152 LED'
        WHEN bt.compatibility_group = 'UNIVERSAL_LED' AND bt.code = '9005_LED' THEN '9005/HB3/9011/HIR1 LED'
        WHEN bt.compatibility_group = 'UNIVERSAL_LED' AND bt.code = '9006_LED' THEN '9006/HB4/9012/HIR2 LED'
        WHEN bt.compatibility_group = 'UNIVERSAL_LED' AND bt.code = '1157_LED' THEN '1157/2057/2357/7528 LED'
        WHEN bt.compatibility_group = 'UNIVERSAL_LED' AND bt.code = '7507_LED' THEN '7507/PY21W/1156/2357 LED'
        WHEN bt.compatibility_group = 'UNIVERSAL_LED' AND bt.code = 'D2S_HID' THEN 'D1S/D2S/D3S/D4S HID'
        ELSE bt.code
    END as display_name,
    bt.description,
    bt.compatibility_group,
    bt.base_code,
    bt.is_primary,
    bt.notes
FROM bulb_types bt;

-- Verification - Show updated bulb types with display names
SELECT 'Updated Bulb Types with Display Names:' as info;
SELECT code, display_name, description FROM bulb_type_display ORDER BY code;

-- Show products with their bulb type display names
SELECT 'Products with Compatibility Display:' as info;
SELECT 
    p.name,
    p.brand,
    p.sku,
    btd.display_name as bulb_type_display,
    p.selling_price,
    p.stock_quantity
FROM products p
LEFT JOIN bulb_type_display btd ON p.bulb_type_id = btd.id
WHERE p.brand IN ('GPNE', 'Philips', 'Osram', 'Aftermarket')
ORDER BY p.brand, p.name;

-- Show multi-compatibility products specifically
SELECT 'Multi-Compatibility Products:' as info;
SELECT 
    p.name,
    p.brand,
    btd.display_name as compatibility_display,
    p.specifications->>'compatible' as spec_compatibility,
    p.selling_price
FROM products p
LEFT JOIN bulb_type_display btd ON p.bulb_type_id = btd.id
WHERE p.specifications::text LIKE '%compatible%'
   OR btd.display_name LIKE '%/%'
ORDER BY p.brand, p.name;
