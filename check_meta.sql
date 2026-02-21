\pset pager off
SELECT pc.name AS cat_name, cm.variant_dimensions
FROM category_metadata cm
JOIN product_categories pc ON cm.category_id = pc.id
WHERE cm.is_active = true
ORDER BY pc.name;
