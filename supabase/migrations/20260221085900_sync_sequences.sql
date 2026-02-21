-- Safely resync sequences by looking up their actual system names
-- This protects against sequences still using legacy names after table renames
DO $$
DECLARE
    seq_name text;
BEGIN
    SELECT pg_get_serial_sequence('products', 'id') INTO seq_name;
    IF seq_name IS NOT NULL THEN
        PERFORM setval(seq_name, COALESCE((SELECT MAX(id) FROM products), 1));
    END IF;

    SELECT pg_get_serial_sequence('product_categories', 'id') INTO seq_name;
    IF seq_name IS NOT NULL THEN
        PERFORM setval(seq_name, COALESCE((SELECT MAX(id) FROM product_categories), 1));
    END IF;

    SELECT pg_get_serial_sequence('suppliers', 'id') INTO seq_name;
    IF seq_name IS NOT NULL THEN
        PERFORM setval(seq_name, COALESCE((SELECT MAX(id) FROM suppliers), 1));
    END IF;

    SELECT pg_get_serial_sequence('variant_definitions', 'id') INTO seq_name;
    IF seq_name IS NOT NULL THEN
        PERFORM setval(seq_name, COALESCE((SELECT MAX(id) FROM variant_definitions), 1));
    END IF;
END $$;
