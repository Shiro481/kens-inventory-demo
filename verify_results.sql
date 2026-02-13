-- =====================================================
-- VERIFICATION OF BULB TYPE UPDATES
-- =====================================================

-- Check current bulb types with their compatibility groups
SELECT '=== Current Bulb Types ===' as info;
SELECT 
    id,
    code,
    description,
    compatibility_group,
    base_code,
    is_primary,
    notes
FROM bulb_types 
ORDER BY code;

-- Check the display view
SELECT '=== Bulb Type Display View ===' as info;
SELECT 
    code,
    display_name,
    description,
    compatibility_group
FROM bulb_type_display 
ORDER BY code;

-- Check products with their bulb type display
SELECT '=== Products with Bulb Type Display ===' as info;
SELECT 
    p.name,
    p.brand,
    p.sku,
    p.selling_price,
    p.stock_quantity,
    btd.display_name as bulb_type_display,
    bt.code as original_bulb_code
FROM products p
LEFT JOIN bulb_type_display btd ON p.bulb_type_id = btd.id
LEFT JOIN bulb_types bt ON p.bulb_type_id = bt.id
WHERE p.brand IN ('GPNE', 'Philips', 'Osram', 'Aftermarket')
ORDER BY p.brand, p.name;

-- Show only multi-compatibility products
SELECT '=== Multi-Compatibility Products ===' as info;
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

-- Count summary
SELECT '=== Summary Counts ===' as info;
SELECT 
    COUNT(*) as total_products,
    COUNT(CASE WHEN p.specifications::text LIKE '%compatible%' THEN 1 END) as multi_compatibility_products,
    COUNT(CASE WHEN btd.display_name LIKE '%/%' THEN 1 END) as products_with_compatibility_display,
    COUNT(CASE WHEN p.brand = 'GPNE' THEN 1 END) as gpne_products,
    COUNT(CASE WHEN p.brand = 'Philips' THEN 1 END) as philips_products
FROM products p
LEFT JOIN bulb_type_display btd ON p.bulb_type_id = btd.id;
