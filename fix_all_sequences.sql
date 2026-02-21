SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 1));
SELECT setval('product_variants_id_seq', COALESCE((SELECT MAX(id) FROM product_variants), 1));
SELECT setval('product_categories_id_seq', COALESCE((SELECT MAX(id) FROM product_categories), 1));
SELECT setval('suppliers_id_seq', COALESCE((SELECT MAX(id) FROM suppliers), 1));
SELECT setval('variant_definitions_id_seq', COALESCE((SELECT MAX(id) FROM variant_definitions), 1));
