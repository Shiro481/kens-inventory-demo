ALTER TABLE category_metadata ADD COLUMN IF NOT EXISTS variant_dimensions JSONB DEFAULT '[]'::jsonb;
