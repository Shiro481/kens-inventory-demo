DO $$ 
DECLARE r RECORD; 
BEGIN 
    FOR r IN (SELECT conname FROM pg_constraint WHERE conrelid = 'public.product_bulb_variants'::regclass AND contype = 'u') LOOP 
        RAISE NOTICE 'Dropping unique constraint: %', r.conname;
        EXECUTE 'ALTER TABLE public.product_bulb_variants DROP CONSTRAINT IF EXISTS "' || r.conname || '"'; 
    END LOOP; 
END $$;
