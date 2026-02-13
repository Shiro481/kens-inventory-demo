-- =====================================================
-- RESET AND POPULATE AUTOMOTIVE LIGHTS PRODUCTS
-- =====================================================
-- This script clears existing products and populates with enhanced data

-- =====================================================
-- STEP 1: CLEAR EXISTING DATA (in correct order to avoid foreign key issues)
-- =====================================================

-- Clear car compatibility first (references products)
DELETE FROM product_car_compatibility;

-- Clear existing products
DELETE FROM products;

-- Reset sequences if needed
-- ALTER SEQUENCE products_id_seq RESTART WITH 1;

-- =====================================================
-- STEP 2: INSERT SAMPLE AUTOMOTIVE LIGHTS PRODUCTS
-- =====================================================

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

-- Halogen Headlights
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
('GPNE-H11-LED-003', '4567890123456', 'GPNE H11/H16/H8 LED Fog Light Kit', 'GPNE', 
 (SELECT id FROM product_categories WHERE name = 'Fog Light'), 
 (SELECT id FROM bulb_types WHERE code = 'H11_LED'), 
 12.0, 24.0, 3000, 2400, 'Fog', 
 32.00, 64.99, 20, 8, 4, 
 'Universal LED fog light compatible with H11, H16, and H8 bases.', 
 'https://example.com/images/gpne-h11-fog-led.jpg',
 '{"color": "3000K Yellow", "lifespan": "50000 hours", "warranty": "2 years", "waterproof": "IP67", "compatible": "H11/H16/H8"}'),

('PHILIPS-H11-001', '5678901234567', 'Philips H11 Standard Fog Light', 'Philips', 
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
('PHILIPS-7507-001', '7890123456789', 'Philips 7507 Amber Turn Signal', 'Philips', 
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
('PHILIPS-W5W-001', '2233445566778', 'Philips W5W LED Parking Light', 'Philips', 
 (SELECT id FROM product_categories WHERE name = 'Parking Light'), 
 (SELECT id FROM bulb_types WHERE code = 'W5W'), 
 12.0, 5.0, 6000, 80, 'Parking', 
 6.00, 12.99, 80, 30, 15, 
 'CAN-bus compatible W5W LED parking light bulb.', 
 'https://example.com/images/philips-w5w.jpg',
 '{"color": "6000K White", "lifespan": "50000 hours", "warranty": "2 years", "canbus": true, "compatible": "W5W/194/168"}');

-- =====================================================
-- STEP 3: ENSURE CAR MODELS EXIST
-- =====================================================

-- Insert car models if they don't exist (to avoid duplicate key errors)
INSERT INTO car_models (brand_id, name, year_from, year_to, variant, body_type) VALUES
((SELECT id FROM car_brands WHERE name = 'Toyota'), 'Corolla', 2020, 2023, 'LE', 'Sedan'),
((SELECT id FROM car_brands WHERE name = 'Toyota'), 'Camry', 2019, 2023, 'SE', 'Sedan'),
((SELECT id FROM car_brands WHERE name = 'Honda'), 'Civic', 2019, 2023, 'Sport', 'Sedan'),
((SELECT id FROM car_brands WHERE name = 'Honda'), 'Accord', 2020, 2023, 'EX', 'Sedan'),
((SELECT id FROM car_brands WHERE name = 'Ford'), 'F-150', 2018, 2023, 'XLT', 'Truck'),
((SELECT id FROM car_brands WHERE name = 'Mitsubishi'), 'Lancer', 2017, 2020, 'ES', 'Sedan')
ON CONFLICT (brand_id, name, year_from, year_to, variant) DO NOTHING;

-- =====================================================
-- STEP 4: ADD CAR COMPATIBILITY
-- =====================================================

-- Add compatibility for Toyota models
INSERT INTO product_car_compatibility (product_id, car_model_id, installation_position, beam_type, fitment_type, is_verified) VALUES
-- GPNE H4 LED compatible with Toyota Corolla
((SELECT id FROM products WHERE sku = 'GPNE-H4-LED-001'), 
 (SELECT id FROM car_models WHERE name = 'Corolla' AND year_from = 2020), 
 'Front Left', 'High/Low', 'Direct Fit', true),

((SELECT id FROM products WHERE sku = 'GPNE-H4-LED-001'), 
 (SELECT id FROM car_models WHERE name = 'Corolla' AND year_from = 2020), 
 'Front Right', 'High/Low', 'Direct Fit', true),

-- GPNE H4 LED compatible with Toyota Camry
((SELECT id FROM products WHERE sku = 'GPNE-H4-LED-001'), 
 (SELECT id FROM car_models WHERE name = 'Camry' AND year_from = 2019), 
 'Front Left', 'High/Low', 'Direct Fit', true),

((SELECT id FROM products WHERE sku = 'GPNE-H4-LED-001'), 
 (SELECT id FROM car_models WHERE name = 'Camry' AND year_from = 2019), 
 'Front Right', 'High/Low', 'Direct Fit', true),

-- GPNE H7 LED compatible with Honda Civic
((SELECT id FROM products WHERE sku = 'GPNE-H7-LED-002'), 
 (SELECT id FROM car_models WHERE name = 'Civic' AND year_from = 2019), 
 'Front Left', 'Low Beam', 'Direct Fit', true),

((SELECT id FROM products WHERE sku = 'GPNE-H7-LED-002'), 
 (SELECT id FROM car_models WHERE name = 'Civic' AND year_from = 2019), 
 'Front Right', 'Low Beam', 'Direct Fit', true),

-- Philips H4 compatible with Honda Accord
((SELECT id FROM products WHERE sku = 'PHILIPS-H4-001'), 
 (SELECT id FROM car_models WHERE name = 'Accord' AND year_from = 2020), 
 'Front Left', 'High/Low', 'Direct Fit', true),

((SELECT id FROM products WHERE sku = 'PHILIPS-H4-001'), 
 (SELECT id FROM car_models WHERE name = 'Accord' AND year_from = 2020), 
 'Front Right', 'High/Low', 'Direct Fit', true),

-- Osram 9005 compatible with Ford F-150
((SELECT id FROM products WHERE sku = 'OSRAM-9005-001'), 
 (SELECT id FROM car_models WHERE name = 'F-150' AND year_from = 2018), 
 'Front Left', 'High Beam', 'Direct Fit', true),

((SELECT id FROM products WHERE sku = 'OSRAM-9005-001'), 
 (SELECT id FROM car_models WHERE name = 'F-150' AND year_from = 2018), 
 'Front Right', 'High Beam', 'Direct Fit', true)
ON CONFLICT (product_id, car_model_id, installation_position, beam_type) DO NOTHING;

-- =====================================================
-- STEP 5: SET SUPPLIER REFERENCES TO NULL
-- =====================================================

-- Set supplier_id to NULL for all products (since existing suppliers don't match lighting brands)
UPDATE products SET supplier_id = NULL;

-- =====================================================
-- STEP 6: VERIFICATION QUERIES
-- =====================================================

-- Run these queries to verify everything was inserted correctly:

-- Count products
-- SELECT COUNT(*) FROM products;

-- View products with categories and bulb types
-- SELECT 
--     p.name, 
--     p.brand, 
--     pc.name as category,
--     bt.code as bulb_type,
--     p.stock_quantity,
--     p.selling_price
-- FROM products p
-- LEFT JOIN product_categories pc ON p.category_id = pc.id
-- LEFT JOIN bulb_types bt ON p.bulb_type_id = bt.id
-- ORDER BY p.name;

-- View compatibility groups
-- SELECT * FROM compatibility_groups ORDER BY display_format;

-- View car compatibility
-- SELECT 
--     p.name as product_name,
--     cb.name as car_brand,
--     cm.name as car_model,
--     pcc.installation_position,
--     pcc.beam_type
-- FROM product_car_compatibility pcc
-- JOIN products p ON pcc.product_id = p.id
-- JOIN car_models cm ON pcc.car_model_id = cm.id
-- JOIN car_brands cb ON cm.brand_id = cb.id
-- ORDER BY p.name, cb.name, cm.name;
