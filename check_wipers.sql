SELECT name, variant_type, sku, specifications 
FROM product_variants 
WHERE name ILIKE '%wiper%' OR variant_type ILIKE '%wiper%'
LIMIT 10;
