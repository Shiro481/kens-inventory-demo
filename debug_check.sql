-- Check if we have variants and verify the data structure
SELECT 
  'PRODUCTS' as table_name,
  p.id,
  p.name,
  p.has_variants,
  p.sku
FROM products p
ORDER BY p.id;

SELECT 
  'VARIANTS' as table_name,
  pbv.id,
  pbv.product_id,
  pbv.bulb_type,
  pbv.variant_color,
  pbv.stock_quantity
FROM product_bulb_variants pbv
ORDER BY pbv.product_id, pbv.id;
