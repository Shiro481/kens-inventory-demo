-- Fix: sync_variant_to_normalized trigger uses wrong column names (key/value)
-- The actual table variant_specifications uses spec_key/spec_value

CREATE OR REPLACE FUNCTION public.sync_variant_to_normalized()
RETURNS trigger AS $$
BEGIN
    -- Only run on INSERT or if color_temperature actually changed
    IF (TG_OP = 'INSERT') OR (
        TG_OP = 'UPDATE' AND
        (NEW.color_temperature IS DISTINCT FROM OLD.color_temperature)
    ) THEN
        -- Upsert Color Temp using the correct column names (spec_key, spec_value)
        IF NEW.color_temperature IS NOT NULL THEN
            INSERT INTO variant_specifications (variant_id, spec_key, spec_value)
            VALUES (NEW.id, 'color_temperature', NEW.color_temperature::text)
            ON CONFLICT (variant_id, spec_key) DO UPDATE SET spec_value = EXCLUDED.spec_value;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
