-- Reset the ID counter for variant types
SELECT setval('public.variant_definitions_id_seq', (SELECT MAX(id) FROM public.variant_definitions));

-- Just in case, reset it for product variants as well
SELECT setval('public.product_variants_id_seq', (SELECT MAX(id) FROM public.product_variants));