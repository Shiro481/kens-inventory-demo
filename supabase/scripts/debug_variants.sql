-- Debug script to check variant data and connections

-- 1. Check if bulb type variants exist
SELECT '=== Bulb Type Variants ===' as info;
SELECT id, base_name, display_name, is_active FROM bulb_type_variants ORDER BY base_name;

-- 2. Check if product variants exist
SELECT '=== Product Variants ===' as info;
SELECT id, product_id, variant_id, stock_quantity, is_primary FROM product_bulb_variants ORDER BY product_id;

-- 3. Check what products actually exist
SELECT '=== All Products ===' as info;
SELECT id, name, sku, brand FROM products ORDER BY name;

-- 4. Check the fixed view results
SELECT '=== POS Product Variants View Results ===' as info;
SELECT product_id, base_name, display_name, final_price, stock_quantity, is_primary 
FROM pos_product_variants 
ORDER BY base_name, display_name;

-- 5. Check specific LED products
SELECT '=== LED Products Check ===' as info;
SELECT p.id, p.name, p.sku, 
       CASE WHEN pv.product_id IS NOT NULL THEN 'HAS_VARIANTS' ELSE 'NO_VARIANTS' END as variant_status
FROM products p
LEFT JOIN pos_product_variants pv ON p.id = pv.product_id
WHERE p.name ILIKE '%led%' OR p.name ILIKE '%headlight%' OR p.name ILIKE '%fog%'
ORDER BY p.name;

-- 6. Test the exact query the frontend uses
SELECT '=== Frontend Query Test ===' as info;
-- This simulates: SELECT * FROM pos_product_variants WHERE product_id = [specific_id]
-- Replace 'your-product-id-here' with an actual product ID from the results above
SELECT * FROM pos_product_variants WHERE product_id = 'your-product-id-here';
