-- Check what categories and bulb types exist so we can use proper UUIDs

SELECT '=== Product Categories ===' as info;
SELECT id, name FROM product_categories ORDER BY name;

SELECT '=== Bulb Types ===' as info;
SELECT id, code, description FROM bulb_types ORDER BY code;

-- Also check what products already exist
SELECT '=== Current Products ===' as info;
SELECT id, name, sku, brand FROM products ORDER BY name;
