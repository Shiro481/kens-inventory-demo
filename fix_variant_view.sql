-- Fix the pos_product_variants view to include all LED products
-- Remove the specifications filter that's preventing variants from showing

-- Drop the existing view
DROP VIEW IF EXISTS pos_product_variants;

-- Recreate the view without the specifications filter
CREATE VIEW pos_product_variants AS
SELECT 
    p.id as product_id,
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

-- Test the view
SELECT '=== Fixed POS Product Variants View ===' as info;
SELECT product_id, base_name, display_name, final_price, stock_quantity, is_primary 
FROM pos_product_variants 
ORDER BY base_name, is_primary DESC, display_name;

-- Check which products have variants
SELECT '=== Products with Variants ===' as info;
SELECT DISTINCT p.id, p.name, p.sku, p.brand
FROM products p
JOIN product_bulb_variants pbv ON p.id = pbv.product_id
ORDER BY p.name;
