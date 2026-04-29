-- End-to-end smoke test for variant saving

BEGIN;

-- 1. Get the test product (must exist in products table)
DO $$
DECLARE
    test_product_id bigint;
    test_variant_id bigint;
BEGIN
    -- Get any product that has_variants
    SELECT id INTO test_product_id FROM products WHERE has_variants = true LIMIT 1;

    IF test_product_id IS NULL THEN
        -- Use any product
        SELECT id INTO test_product_id FROM products LIMIT 1;
    END IF;

    RAISE NOTICE 'Testing with product_id: %', test_product_id;

    -- 2. Insert a test variant (this will fire the trigger)
    INSERT INTO product_variants (
        product_id, variant_type, cost_price, selling_price, 
        stock_quantity, color_temperature
    )
    VALUES (
        test_product_id, 'TEST_TYPE', 10.00, 20.00, 5, '3000K'
    )
    RETURNING id INTO test_variant_id;

    RAISE NOTICE 'Created test variant_id: %', test_variant_id;

    -- 3. Verify the trigger populated variant_specifications
    PERFORM id FROM variant_specifications 
    WHERE variant_id = test_variant_id AND spec_key = 'color_temperature';
    
    IF FOUND THEN
        RAISE NOTICE 'SUCCESS: variant_specifications was populated correctly!';
    ELSE
        RAISE WARNING 'ISSUE: variant_specifications was NOT populated by trigger.';
    END IF;

    -- 4. Clean up
    DELETE FROM product_variants WHERE id = test_variant_id;
    RAISE NOTICE 'Cleaned up test variant.';
END $$;

ROLLBACK;
