-- Fix the ID mismatch issue
-- The frontend sends numeric IDs but the view expects UUIDs
-- Let's create a new view that handles both

-- Drop the old view
DROP VIEW IF EXISTS pos_product_variants;

-- Create a new view that converts UUID to text for comparison
CREATE VIEW pos_product_variants AS
SELECT 
    p.id::text as product_id,  -- Convert UUID to text
    p.sku,
    p.name as base_name,
    p.brand,
    p.selling_price as base_price,
    btv.id as variant_id,
    btv.display_name,
    btv.compatibility_list,
    btv.description as variant_description,
    p.selling_price + pbv.price_adjustment as final_price,
    pbv.stock_quantity,
    pbv.is_primary,
    pc.name as category,
    p.image_url
FROM products p
JOIN product_bulb_variants pbv ON p.id = pbv.product_id
JOIN bulb_type_variants btv ON pbv.variant_id = btv.id
LEFT JOIN product_categories pc ON p.category_id = pc.id
WHERE btv.is_active = true
ORDER BY p.name, btv.display_name;

-- Test the fixed view
SELECT '=== Fixed View Test ===' as info;
SELECT product_id, base_name, display_name, final_price, stock_quantity 
FROM pos_product_variants 
ORDER BY base_name, display_name;

-- Test with the specific product IDs from console
SELECT '=== Test with Console IDs ===' as info;
SELECT * FROM pos_product_variants WHERE product_id = '18230';
SELECT * FROM pos_product_variants WHERE product_id = '309727';
