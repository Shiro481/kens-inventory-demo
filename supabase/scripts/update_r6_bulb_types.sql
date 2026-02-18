-- 1. Add bulb_type to product_bulb_variants if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'product_bulb_variants' AND column_name = 'bulb_type') THEN
        ALTER TABLE product_bulb_variants ADD COLUMN bulb_type VARCHAR(50);
    END IF;
END $$;

-- 2. Populate bulb_type for GPNE R6 based on SKU pattern (clean names)
UPDATE product_bulb_variants 
SET bulb_type = 'H1' 
WHERE variant_sku LIKE 'GPNE-R6-H1-%';

UPDATE product_bulb_variants 
SET bulb_type = 'H4' 
WHERE variant_sku LIKE 'GPNE-R6-H4-%';

UPDATE product_bulb_variants 
SET bulb_type = 'H7' 
WHERE variant_sku LIKE 'GPNE-R6-H7-%';

UPDATE product_bulb_variants 
SET bulb_type = '9005' 
WHERE variant_sku LIKE 'GPNE-R6-9005-%';

UPDATE product_bulb_variants 
SET bulb_type = '9006' 
WHERE variant_sku LIKE 'GPNE-R6-9006-%';

UPDATE product_bulb_variants 
SET bulb_type = 'H11' 
WHERE variant_sku LIKE 'GPNE-R6-H11-%';

-- 3. Verify
SELECT id, variant_sku, bulb_type FROM product_bulb_variants WHERE variant_sku LIKE 'GPNE-R6%';
