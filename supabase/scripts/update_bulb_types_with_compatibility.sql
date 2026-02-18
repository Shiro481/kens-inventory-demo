-- =====================================================
-- UPDATE BULB TYPES TO SHOW COMPATIBILITY
-- =====================================================
-- This script creates/updates bulb types to display compatibility info

-- First, let's see current bulb types
SELECT 'Current Bulb Types:' as info;
SELECT code, name FROM bulb_types ORDER BY code;

-- Create or update bulb types with compatibility names
INSERT INTO bulb_types (code, name, description) VALUES
('H4', 'H4', 'Standard H4 dual filament headlight bulb'),
('H7', 'H7', 'Standard H7 single filament headlight bulb'),
('H11', 'H11/H16/H8', 'Universal fog light bulb - compatible with H11, H16, and H8'),
('9005', '9005/HB3', 'High beam bulb - compatible with 9005 and HB3'),
('9006', '9006/HB4', 'Low beam bulb - compatible with 9006 and HB4'),
('7507', '7507/PY21W', 'Turn signal bulb - compatible with 7507 and PY21W'),
('1157', '1157/2057/2357/7528', 'Brake/tail light bulb - compatible with 1157, 2057, 2357, and 7528'),
('W5W', 'W5W/194/168', 'Interior/parking light bulb - compatible with W5W, 194, and 168'),
('D2S', 'D2S/D1S/D3S/D4S', 'HID xenon bulb - compatible with D2S, D1S, D3S, and D4S'),
('H4_LED', 'H4/H7/9005/9006 LED', 'Universal LED conversion kit - compatible with H4, H7, 9005, and 9006'),
('H7_LED', 'H7 LED', 'H7 LED headlight bulb'),
('H11_LED', 'H11/H8/H16 LED', 'Universal LED fog light - compatible with H11, H8, and H16'),
('W5W_LED', 'W5W/194/168/147/152 LED', 'Universal interior LED kit - compatible with W5W, 194, 168, 147, and 152'),
('9005_LED', '9005/HB3/9011/HIR1 LED', 'Universal LED high beam - compatible with 9005, HB3, 9011, and HIR1'),
('9006_LED', '9006/HB4/9012/HIR2 LED', 'Universal LED low beam - compatible with 9006, HB4, 9012, and HIR2'),
('1157_LED', '1157/2057/2357/7528 LED', 'Universal LED brake/tail light - compatible with 1157, 2057, 2357, and 7528'),
('7507_LED', '7507/PY21W/1156/2357 LED', 'Universal LED turn signal - compatible with 7507, PY21W, 1156, and 2357'),
('D2S_HID', 'D1S/D2S/D3S/D4S HID', 'Multi-voltage HID kit - compatible with D1S, D2S, D3S, and D4S')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Update products to use the correct bulb types with compatibility names
UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = 'H4_LED'),
    updated_at = NOW()
WHERE sku IN ('GPNE-H4-LED-001', 'GPNE-UNI-LED-001');

UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = 'H7_LED'),
    updated_at = NOW()
WHERE sku = 'GPNE-H7-LED-002';

UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = 'H11_LED'),
    updated_at = NOW()
WHERE sku IN ('GPNE-H11-LED-003', 'GPNE-MULTI-FOG-001');

UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = '9005_LED'),
    updated_at = NOW()
WHERE sku = 'GPNE-MULTI-HIGH-001';

UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = '9006_LED'),
    updated_at = NOW()
WHERE sku = 'GPNE-UNI-LOW-001';

UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = '1157_LED'),
    updated_at = NOW()
WHERE sku = 'GPNE-UNI-BRAKE-001';

UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = '7507_LED'),
    updated_at = NOW()
WHERE sku = 'GPNE-MULTI-SIG-001';

UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = 'W5W_LED'),
    updated_at = NOW()
WHERE sku = 'GPNE-UNI-INT-001';

UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = 'D2S_HID'),
    updated_at = NOW()
WHERE sku = 'GPNE-MULTI-HID-001';

-- Update standard products to use compatibility bulb types
UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = 'H11'),
    updated_at = NOW()
WHERE sku IN ('PHILIPS-H11-001');

UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = '7507'),
    updated_at = NOW()
WHERE sku IN ('PHILIPS-7507-001', 'GPNE-SIGNAL-LED-005');

UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = '9005'),
    updated_at = NOW()
WHERE sku = 'OSRAM-9005-001';

UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = '1157'),
    updated_at = NOW()
WHERE sku = 'GPNE-UNI-BRAKE-001' AND bulb_type_id IS NULL;

UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = 'W5W'),
    updated_at = NOW()
WHERE sku IN ('GPNE-INTERIOR-001', 'PHILIPS-W5W-001');

UPDATE products SET 
    bulb_type_id = (SELECT id FROM bulb_types WHERE code = 'D2S'),
    updated_at = NOW()
WHERE sku = 'D2S-XENON-001';

-- Verification - Show updated bulb types
SELECT 'Updated Bulb Types:' as info;
SELECT code, name FROM bulb_types ORDER BY code;

-- Show products with their new bulb type names
SELECT 'Products with Compatibility Bulb Types:' as info;
SELECT 
    p.name,
    p.brand,
    p.sku,
    bt.name as bulb_type_display,
    p.selling_price,
    p.stock_quantity
FROM products p
LEFT JOIN bulb_types bt ON p.bulb_type_id = bt.id
WHERE p.brand IN ('GPNE', 'Philips', 'Osram', 'Aftermarket')
ORDER BY p.brand, p.name;

-- Show multi-compatibility products specifically
SELECT 'Multi-Compatibility Products:' as info;
SELECT 
    p.name,
    p.brand,
    bt.name as bulb_type_with_compatibility,
    p.specifications->>'compatible' as spec_compatibility,
    p.selling_price
FROM products p
LEFT JOIN bulb_types bt ON p.bulb_type_id = bt.id
WHERE p.specifications::text LIKE '%compatible%'
   OR bt.name LIKE '%/%'
ORDER BY p.brand, p.name;
