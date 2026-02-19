ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;
