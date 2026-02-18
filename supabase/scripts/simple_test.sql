-- Simple test to see what's actually in the database

-- 1. See what products exist
SELECT '=== All Products ===' as info;
SELECT id, name, sku, brand FROM products ORDER BY name;

-- 2. See what variants exist with their product IDs
SELECT '=== All Variants ===' as info;
SELECT product_id, base_name, display_name, final_price, stock_quantity 
FROM pos_product_variants 
ORDER BY base_name, display_name;

-- 3. Check if any product IDs match between tables
SELECT '=== Product ID Match Check ===' as info;
SELECT p.id as product_id, p.name as product_name, 
       CASE WHEN pv.product_id IS NOT NULL THEN 'HAS_VARIANTS' ELSE 'NO_VARIANTS' END as status
FROM products p
LEFT JOIN pos_product_variants pv ON p.id = pv.product_id
ORDER BY p.name;
