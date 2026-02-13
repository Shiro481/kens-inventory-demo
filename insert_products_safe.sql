-- =====================================================
-- SAFE INSERT FOR AUTOMOTIVE LIGHTS PRODUCTS
-- =====================================================
-- This script safely inserts products into your existing database
-- Run this in your Supabase SQL Editor

-- =====================================================
-- STEP 1: INSERT ONLY NEW PRODUCTS (skip existing SKUs)
-- =====================================================

-- Insert new products only if they don't already exist
INSERT INTO products (
    sku, 
    barcode, 
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
    description, 
    image_url, 
    specifications
) VALUES
-- LED Headlights (using enhanced bulb types)
('GPNE-H4-LED-001', '1234567890123', 'GPNE H4 LED Headlight Conversion Kit', 'GPNE', 
 (SELECT id FROM product_categories WHERE name = 'Headlight'), 
 (SELECT id FROM bulb_types WHERE code = 'H4_LED'), 
 12.0, 36.0, 6000, 8000, 'High/Low', 
 45.00, 89.99, 25, 10, 5, 
 'Ultra-bright H4 LED headlight conversion kit with fan cooling. Plug and play installation.', 
 'https://example.com/images/gpne-h4-led.jpg',
 '{"color": "6000K White", "lifespan": "50000 hours", "warranty": "2 years", "cooling": "Fan"}'),

('GPNE-H7-LED-002', '1234567890124', 'GPNE H7 LED Headlight Bulbs (Pair)', 'GPNE', 
 (SELECT id FROM product_categories WHERE name = 'Headlight'), 
 (SELECT id FROM bulb_types WHERE code = 'H7_LED'), 
 12.0, 30.0, 6500, 7200, 'Low Beam', 
 38.00, 75.99, 30, 12, 6, 
 'High-performance H7 LED bulbs with superior brightness and clarity.', 
 'https://example.com/images/gpne-h7-led.jpg',
 '{"color": "6500K Cool White", "lifespan": "45000 hours", "warranty": "2 years"}'),

('PHILIPS-H4-001', '2345678901234', 'Philips H4 Standard Halogen Headlight', 'Philips', 
 (SELECT id FROM product_categories WHERE name = 'Headlight'), 
 (SELECT id FROM bulb_types WHERE code = 'H4'), 
 12.0, 60.0, 3200, 1650, 'High/Low', 
 12.00, 24.99, 50, 20, 10, 
 'Standard halogen H4 headlight bulb with reliable performance.', 
 'https://example.com/images/philips-h4.jpg',
 '{"color": "3200K Warm White", "lifespan": "450 hours", "warranty": "1 year"}'),

('OSRAM-9005-001', '3456789012345', 'Osram 9005 Silverstar High Beam', 'Osram', 
 (SELECT id FROM product_categories WHERE name = 'Headlight'), 
 (SELECT id FROM bulb_types WHERE code = '9005'), 
 12.0, 65.0, 3700, 1700, 'High Beam', 
 14.00, 28.99, 40, 15, 8, 
 'Ultra-bright 9005 high beam halogen bulb with enhanced visibility.', 
 'https://example.com/images/osram-9005.jpg',
 '{"color": "3700K Bright White", "lifespan": "400 hours", "warranty": "1 year"}'),

-- H11/H16/H8 Compatible Products
('GPNE-H11-LED-003', '4567890123456', 'GPNE LED Fog Light Kit', 'GPNE', 
 (SELECT id FROM product_categories WHERE name = 'Fog Light'), 
 (SELECT id FROM bulb_types WHERE code = 'H11_LED'), 
 12.0, 24.0, 3000, 2400, 'Fog', 
 32.00, 64.99, 20, 8, 4, 
 'Universal LED fog light compatible with H11, H16, and H8 bases.', 
 'https://example.com/images/gpne-h11-fog-led.jpg',
 '{"color": "3000K Yellow", "lifespan": "50000 hours", "warranty": "2 years", "waterproof": "IP67", "compatible": "H11/H16/H8"}'),

('PHILIPS-H11-001', '5678901234567', 'Philips Standard Fog Light', 'Philips', 
 (SELECT id FROM product_categories WHERE name = 'Fog Light'), 
 (SELECT id FROM bulb_types WHERE code = 'H11'), 
 12.0, 55.0, 3200, 1350, 'Fog', 
 10.00, 19.99, 60, 25, 12, 
 'Standard H11 halogen fog light bulb with wide beam pattern.', 
 'https://example.com/images/philips-h11.jpg',
 '{"color": "3200K Warm White", "lifespan": "400 hours", "warranty": "1 year", "compatible": "H11/H16/H8"}'),

-- LED Brake Lights
('GPNE-BRAKE-LED-004', '6789012345678', 'GPNE LED Brake Light Strip', 'GPNE', 
 (SELECT id FROM product_categories WHERE name = 'Brake Light'), 
 NULL, 
 12.0, 18.0, 6200, 1200, 'Brake', 
 25.00, 49.99, 35, 15, 7, 
 'Universal LED brake light strip with sequential turn signal function.', 
 'https://example.com/images/gpne-brake-led.jpg',
 '{"color": "6200K Red", "lifespan": "60000 hours", "warranty": "3 years", "function": "Sequential"}'),

-- Signal Lights (using 7507 group)
('PHILIPS-7507-001', '7890123456789', 'Philips Amber Turn Signal', 'Philips', 
 (SELECT id FROM product_categories WHERE name = 'Signal Light'), 
 (SELECT id FROM bulb_types WHERE code = '7507'), 
 12.0, 21.0, 3200, 460, 'Signal', 
 8.00, 15.99, 60, 25, 12, 
 'Standard amber turn signal bulb with reliable performance.', 
 'https://example.com/images/philips-7507.jpg',
 '{"color": "3200K Amber", "lifespan": "500 hours", "warranty": "1 year", "compatible": "7507/PY21W"}'),

('GPNE-SIGNAL-LED-005', '8901234567890', 'GPNE LED Turn Signal (Switchback)', 'GPNE', 
 (SELECT id FROM product_categories WHERE name = 'Signal Light'), 
 (SELECT id FROM bulb_types WHERE code = '7507'), 
 12.0, 16.0, 6000, 800, 'Signal', 
 42.00, 84.99, 15, 6, 3, 
 'Switchback LED turn signal - white running light, amber turn signal.', 
 'https://example.com/images/gpne-switchback.jpg',
 '{"color": "6000K White/3200K Amber", "lifespan": "50000 hours", "warranty": "2 years", "function": "Switchback", "compatible": "7507/PY21W"}'),

-- HID Xenon Lights
('D2S-XENON-001', '9012345678901', 'D2S HID Xenon Headlight Bulb', 'Aftermarket', 
 (SELECT id FROM product_categories WHERE name = 'Headlight'), 
 (SELECT id FROM bulb_types WHERE code = 'D2S'), 
 35.0, 35.0, 4300, 3200, 'Low Beam', 
 55.00, 110.00, 12, 5, 2, 
 'High-intensity discharge xenon bulb for projector headlights.', 
 'https://example.com/images/d2s-xenon.jpg',
 '{"color": "4300K White", "lifespan": "2500 hours", "warranty": "1 year", "ballast_required": true}'),

-- LED Light Bars
('GPNE-LIGHTBAR-12', '0123456789012', 'GPNE 12" LED Light Bar', 'GPNE', 
 (SELECT id FROM product_categories WHERE name = 'LED Light Bar'), 
 NULL, 
 12.0, 72.0, 6000, 10800, 'Driving', 
 85.00, 169.99, 8, 3, 1, 
 '12-inch curved LED light bar for off-road and auxiliary lighting.', 
 'https://example.com/images/gpne-lightbar-12.jpg',
 '{"color": "6000K White", "lifespan": "50000 hours", "warranty": "2 years", "beam_pattern": "Spot/Flood Combo", "ip_rating": "IP68"}'),

-- Interior LED Lights
('GPNE-INTERIOR-001', '1122334455667', 'GPNE Interior LED Kit (4 Piece)', 'GPNE', 
 (SELECT id FROM product_categories WHERE name = 'Interior Light'), 
 (SELECT id FROM bulb_types WHERE code = 'W5W'), 
 12.0, 3.0, 4000, 120, 'Interior', 
 15.00, 29.99, 100, 40, 20, 
 'Universal interior LED dome light kit with plug-and-play installation.', 
 'https://example.com/images/gpne-interior.jpg',
 '{"color": "4000K Natural White", "lifespan": "60000 hours", "warranty": "2 years", "quantity": "4 bulbs", "compatible": "W5W/194/168"}'),

-- Parking Lights
('PHILIPS-W5W-001', '2233445566778', 'Philips LED Parking Light', 'Philips', 
 (SELECT id FROM product_categories WHERE name = 'Parking Light'), 
 (SELECT id FROM bulb_types WHERE code = 'W5W'), 
 12.0, 5.0, 6000, 80, 'Parking', 
 6.00, 12.99, 80, 30, 15, 
 'CAN-bus compatible W5W LED parking light bulb.', 
 'https://example.com/images/philips-w5w.jpg',
 '{"color": "6000K White", "lifespan": "50000 hours", "warranty": "2 years", "canbus": true, "compatible": "W5W/194/168"}'),

-- MULTI-COMPATIBILITY PRODUCTS
-- Universal LED Conversion Kit (H4/H7/9005/9006)
('GPNE-UNI-LED-001', '9988776655443', 'GPNE Universal LED Headlight Kit', 'GPNE', 
 (SELECT id FROM product_categories WHERE name = 'Headlight'), 
 (SELECT id FROM bulb_types WHERE code = 'H4_LED'), 
 12.0, 45.0, 6500, 9000, 'High/Low', 
 65.00, 129.99, 15, 5, 2, 
 'Universal LED conversion kit with 4 different adapters for H4, H7, 9005, and 9006 bulbs. Includes CAN-bus decoders and anti-flicker modules.', 
 'https://example.com/images/gpne-universal-led.jpg',
 '{"color": "6500K Cool White", "lifespan": "60000 hours", "warranty": "3 years", "adapters": "H4/H7/9005/9006", "canbus": true, "cooling": "Turbo Fan", "brightness": "9000 lumens"}'),

-- Multi-Fit LED Fog Light (H11/H8/H16)
('GPNE-MULTI-FOG-001', '8877665544332', 'GPNE Multi-Fit LED Fog Light', 'GPNE', 
 (SELECT id FROM product_categories WHERE name = 'Fog Light'), 
 (SELECT id FROM bulb_types WHERE code = 'H11_LED'), 
 12.0, 28.0, 3000, 2800, 'Fog', 
 38.00, 76.99, 25, 8, 4, 
 'Multi-fit LED fog light compatible with H11, H8, and H16 bases. Features adjustable mounting bracket and waterproof design.', 
 'https://example.com/images/gpne-multi-fog.jpg',
 '{"color": "3000K Yellow", "lifespan": "55000 hours", "warranty": "2 years", "compatible": "H11/H8/H16", "waterproof": "IP68", "adjustable": "360-degree rotation", "beam": "120-degree wide"}'),

-- Universal Interior LED Kit (W5W/194/168/147/152)
('GPNE-UNI-INT-001', '7766554433221', 'GPNE Universal Interior LED Kit', 'GPNE', 
 (SELECT id FROM product_categories WHERE name = 'Interior Light'), 
 (SELECT id FROM bulb_types WHERE code = 'W5W'), 
 12.0, 2.5, 4000, 150, 'Interior', 
 22.00, 44.99, 60, 20, 10, 
 'Universal interior LED kit with 10 bulbs and 5 different socket types for complete interior lighting upgrade.', 
 'https://example.com/images/gpne-universal-interior.jpg',
 '{"color": "4000K Natural White", "lifespan": "65000 hours", "warranty": "3 years", "compatible": "W5W/194/168/147/152", "quantity": "10 bulbs", "sockets": "5 types", "voltage": "12V universal", "plug_and_play": true}'),

-- Multi-Compatibility Signal Light (7507/PY21W/1156/2357)
('GPNE-MULTI-SIG-001', '6655443322110', 'GPNE Multi-Fit LED Turn Signal', 'GPNE', 
 (SELECT id FROM product_categories WHERE name = 'Signal Light'), 
 (SELECT id FROM bulb_types WHERE code = '7507'), 
 12.0, 18.0, 3200, 950, 'Signal', 
 35.00, 69.99, 30, 10, 5, 
 'Multi-fit LED turn signal compatible with 7507, PY21W, 1156, and 2357 sockets. Features sequential lighting and load resistors.', 
 'https://example.com/images/gpne-multi-signal.jpg',
 '{"color": "3200K Amber", "lifespan": "50000 hours", "warranty": "2 years", "compatible": "7507/PY21W/1156/2357", "function": "Sequential", "load_resistors": "Included", "canbus": true}'),

-- Universal Brake/Tail Light (1157/2057/2357/7528)
('GPNE-UNI-BRAKE-001', '5544332211009', 'GPNE Universal LED Brake/Tail Light', 'GPNE', 
 (SELECT id FROM product_categories WHERE name = 'Brake Light'), 
 (SELECT id FROM bulb_types WHERE code = '1157'), 
 12.0, 22.0, 6200, 1400, 'Brake/Tail', 
 42.00, 84.99, 20, 6, 3, 
 'Universal LED brake/tail light compatible with 1157, 2057, 2357, and 7528 dual filament bulbs. Red lens technology for maximum brightness.', 
 'https://example.com/images/gpne-universal-brake.jpg',
 '{"color": "6200K Red", "lifespan": "60000 hours", "warranty": "3 years", "compatible": "1157/2057/2357/7528", "function": "Brake/Tail/Reverse", "brightness": "1400 lumens", "red_lens": true}'),

-- Multi-Compatibility High Beam (9005/HB3/9011/HIR1)
('GPNE-MULTI-HIGH-001', '4433221100998', 'GPNE Multi-Fit LED High Beam', 'GPNE', 
 (SELECT id FROM product_categories WHERE name = 'Headlight'), 
 (SELECT id FROM bulb_types WHERE code = '9005'), 
 12.0, 50.0, 6000, 12000, 'High Beam', 
 58.00, 115.99, 18, 6, 3, 
 'Multi-fit LED high beam compatible with 9005, HB3, 9011, and HIR1 sockets. Features focused beam pattern for long-range visibility.', 
 'https://example.com/images/gpne-multi-high.jpg',
 '{"color": "6000K White", "lifespan": "55000 hours", "warranty": "2 years", "compatible": "9005/HB3/9011/HIR1", "beam_pattern": "Focused Spot", "brightness": "12000 lumens", "range": "1500 feet"}'),

-- Universal Low Beam (9006/HB4/9012/HIR2)
('GPNE-UNI-LOW-001', '3322110099887', 'GPNE Universal LED Low Beam', 'GPNE', 
 (SELECT id FROM product_categories WHERE name = 'Headlight'), 
 (SELECT id FROM bulb_types WHERE code = '9006'), 
 12.0, 48.0, 5500, 10500, 'Low Beam', 
 55.00, 109.99, 22, 8, 4, 
 'Universal LED low beam compatible with 9006, HB4, 9012, and HIR2 sockets. Provides excellent cutoff and wide illumination.', 
 'https://example.com/images/gpne-universal-low.jpg',
 '{"color": "5500K Natural White", "lifespan": "55000 hours", "warranty": "2 years", "compatible": "9006/HB4/9012/HIR2", "beam_pattern": "Low Beam Cutoff", "brightness": "10500 lumens", "width": "120-degree coverage"}'),

-- Multi-Voltage HID Kit (D1S/D2S/D3S/D4S)
('GPNE-MULTI-HID-001', '2211009988776', 'GPNE Multi-Voltage HID Kit', 'GPNE', 
 (SELECT id FROM product_categories WHERE name = 'Headlight'), 
 (SELECT id FROM bulb_types WHERE code = 'D2S'), 
 35.0, 42.0, 4300, 4500, 'Low Beam', 
 95.00, 189.99, 8, 3, 1, 
 'Multi-voltage HID kit compatible with D1S, D2S, D3S, and D4S bulbs. Includes smart ballasts that auto-detect bulb type.', 
 'https://example.com/images/gpne-multi-hid.jpg',
 '{"color": "4300K White", "lifespan": "3000 hours", "warranty": "1 year", "compatible": "D1S/D2S/D3S/D4S", "ballast": "Smart Auto-Detect", "voltage": "12V/24V", "ignition": "Fast Start"}')
ON CONFLICT (sku) DO NOTHING;

-- =====================================================
-- STEP 2: SET SUPPLIER REFERENCES TO NULL (to avoid constraint issues)
-- =====================================================

UPDATE products SET supplier_id = NULL WHERE supplier_id IS NOT NULL AND 
(supplier_id NOT IN (SELECT id FROM suppliers) OR supplier_id IS NULL);

-- =====================================================
-- STEP 3: VERIFICATION QUERY
-- =====================================================

-- Check how many products were inserted
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN specifications::text LIKE '%compatible%' THEN 1 END) as multi_compatibility_products,
    COUNT(CASE WHEN brand = 'GPNE' THEN 1 END) as gpne_products,
    COUNT(CASE WHEN brand = 'Philips' THEN 1 END) as philips_products,
    COUNT(CASE WHEN brand = 'Osram' THEN 1 END) as osram_products,
    COUNT(CASE WHEN brand = 'Aftermarket' THEN 1 END) as aftermarket_products
FROM products;

-- Show sample products with compatibility info
SELECT 
    name, 
    brand, 
    sku, 
    selling_price,
    stock_quantity,
    CASE 
        WHEN specifications::text LIKE '%compatible%' THEN 
            specifications->>'compatible'
        ELSE 'Single compatibility'
    END as compatibility_info
FROM products 
ORDER BY brand, name
LIMIT 10;

-- Show all multi-compatibility products with their compatibility details
SELECT 
    name,
    brand,
    sku,
    selling_price,
    specifications->>'compatible' as compatible_types,
    specifications->>'adapters' as adapters,
    specifications->>'function' as special_function
FROM products 
WHERE specifications::text LIKE '%compatible%'
ORDER BY brand, name;
