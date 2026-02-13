-- Check the exact product IDs and see what's in the view

-- 1. See what the actual product IDs are in the products table
SELECT '=== Actual Product IDs ===' as info;
SELECT id::text as product_id_text, id::uuid as product_id_uuid, name, sku 
FROM products 
WHERE name ILIKE '%led%' OR name ILIKE '%headlight%' OR name ILIKE '%fog%'
ORDER BY name;

-- 2. See what product IDs are in the fixed view
SELECT '=== View Product IDs ===' as info;
SELECT product_id, base_name, display_name, final_price, stock_quantity 
FROM pos_product_variants 
WHERE base_name ILIKE '%led%' OR base_name ILIKE '%headlight%' OR base_name ILIKE '%fog%'
ORDER BY base_name;

-- 3. Test the exact IDs from the console
SELECT '=== Test Console IDs ===' as info;
SELECT 'Testing ID 18230:' as test;
SELECT * FROM pos_product_variants WHERE product_id = '18230';

SELECT 'Testing ID 309727:' as test;
SELECT * FROM pos_product_variants WHERE product_id = '309727';

-- 4. Check if there are any products with numeric IDs at all
SELECT '=== Check for Numeric IDs ===' as info;
SELECT id::text, name FROM products WHERE id::text ~ '^[0-9]+$' ORDER BY id::text;
