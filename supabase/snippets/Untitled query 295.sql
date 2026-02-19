-- 1. Check if we can actually see the data
SELECT COUNT(*) as total_categories, MAX(id) as highest_id FROM product_categories;

-- 2. This version is more "forceful"
SELECT setval('product_categories_id_seq', (SELECT MAX(id) FROM product_categories));