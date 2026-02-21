SELECT setval('variant_definitions_id_seq', COALESCE((SELECT MAX(id) FROM variant_definitions), 1));
