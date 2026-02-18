-- Test the exact query the frontend uses
-- First, let's see what products exist and their IDs
SELECT '=== Products with their IDs ===' as info;
SELECT id, name, sku, brand FROM products 
WHERE name ILIKE '%led%' OR name ILIKE '%headlight%' OR name ILIKE '%fog%'
ORDER BY name;

-- Now test what variants exist for each product
SELECT '=== Test each product ID ===' as info;

-- Replace these with actual product IDs from the query above
-- For example, if you see product IDs like '123e4567-e89b-12d3-a456-426614174000'
-- Test each one:

-- Test with first LED product ID (replace with actual ID)
SELECT 'Testing product ID: [FIRST-PRODUCT-ID-HERE]' as test_info;
SELECT * FROM pos_product_variants 
WHERE product_id = '[FIRST-PRODUCT-ID-HERE]';

-- Test with second LED product ID (replace with actual ID)  
SELECT 'Testing product ID: [SECOND-PRODUCT-ID-HERE]' as test_info;
SELECT * FROM pos_product_variants 
WHERE product_id = '[SECOND-PRODUCT-ID-HERE]';

-- Show all variants with their product IDs
SELECT '=== All variants with product IDs ===' as info;
SELECT product_id, base_name, display_name, final_price, stock_quantity 
FROM pos_product_variants 
ORDER BY base_name, display_name;
