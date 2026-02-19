-- SQL Script to pre-configure category metadata with dimensions
-- Run this in your Supabase SQL Editor

DO $$
DECLARE
    cat_id BIGINT;
BEGIN
    -- Headlight
    SELECT id INTO cat_id FROM product_categories WHERE name = 'Headlight';
    IF cat_id IS NOT NULL THEN
        INSERT INTO category_metadata (category_id, variant_type_label, variant_dimensions, suggested_variant_types, fields)
        VALUES (
            cat_id, 
            'Socket Type', 
            '[{"label": "Socket Type", "column": "variant_type", "active": true}, {"label": "Color Temp", "column": "color_temperature", "active": true}]'::jsonb,
            '{"H1", "H3", "H4", "H7", "H8", "H9", "H11", "H13", "H15", "H16", "9005 (HB3)", "9006 (HB4)", "9012 (HIR2)", "880/881", "D1S", "D2S", "D3S", "D4S"}'::text[],
            '[{"key": "wattage", "label": "Wattage", "type": "number", "suffix": "W"}, {"key": "voltage", "label": "Voltage", "type": "number", "suffix": "V"}, {"key": "lumens", "label": "Lumens", "type": "number"}]'::jsonb
        ) ON CONFLICT (category_id) DO UPDATE SET 
            variant_type_label = EXCLUDED.variant_type_label,
            variant_dimensions = EXCLUDED.variant_dimensions,
            suggested_variant_types = EXCLUDED.suggested_variant_types,
            fields = EXCLUDED.fields;
    END IF;

    -- Fog Light
    SELECT id INTO cat_id FROM product_categories WHERE name = 'Fog Light';
    IF cat_id IS NOT NULL THEN
        INSERT INTO category_metadata (category_id, variant_type_label, variant_dimensions, suggested_variant_types, fields)
        VALUES (
            cat_id, 
            'Socket Type', 
            '[{"label": "Socket Type", "column": "variant_type", "active": true}, {"label": "Color Temp", "column": "color_temperature", "active": true}]'::jsonb,
            '{"H8", "H11", "H16", "9005", "9006", "880", "881"}'::text[],
            '[{"key": "wattage", "label": "Wattage", "type": "number", "suffix": "W"}]'::jsonb
        ) ON CONFLICT (category_id) DO UPDATE SET 
            variant_type_label = EXCLUDED.variant_type_label,
            variant_dimensions = EXCLUDED.variant_dimensions,
            suggested_variant_types = EXCLUDED.suggested_variant_types,
            fields = EXCLUDED.fields;
    END IF;

    -- Signal Light
    SELECT id INTO cat_id FROM product_categories WHERE name = 'Signal Light';
    IF cat_id IS NOT NULL THEN
        INSERT INTO category_metadata (category_id, variant_type_label, variant_dimensions, suggested_variant_types, fields)
        VALUES (
            cat_id, 
            'Socket Type', 
            '[{"label": "Socket Type", "column": "variant_type", "active": true}, {"label": "Color", "column": "variant_color", "active": true}]'::jsonb,
            '{"T20 (7440/7443)", "T25 (3156/3157)", "1156 (BA15S)", "1157 (BAY15D)", "BA9S"}'::text[],
            '[]'::jsonb
        ) ON CONFLICT (category_id) DO UPDATE SET 
            variant_type_label = EXCLUDED.variant_type_label,
            variant_dimensions = EXCLUDED.variant_dimensions,
            suggested_variant_types = EXCLUDED.suggested_variant_types,
            fields = EXCLUDED.fields;
    END IF;

    -- Wiper
    SELECT id INTO cat_id FROM product_categories WHERE name = 'Wiper';
    IF cat_id IS NOT NULL THEN
        INSERT INTO category_metadata (category_id, variant_type_label, variant_dimensions, suggested_variant_types, fields)
        VALUES (
            cat_id, 
            'Size', 
            '[{"label": "Size", "column": "variant_type", "active": true}, {"label": "Color", "column": "variant_color", "active": true}]'::jsonb,
            '{"14\"", "16\"", "17\"", "18\"", "19\"", "20\"", "21\"", "22\"", "24\"", "26\"", "28\""}'::text[],
            '[]'::jsonb
        ) ON CONFLICT (category_id) DO UPDATE SET 
            variant_type_label = EXCLUDED.variant_type_label,
            variant_dimensions = EXCLUDED.variant_dimensions,
            suggested_variant_types = EXCLUDED.suggested_variant_types,
            fields = EXCLUDED.fields;
    END IF;

    -- Horn
    SELECT id INTO cat_id FROM product_categories WHERE name = 'Horn';
    IF cat_id IS NOT NULL THEN
        INSERT INTO category_metadata (category_id, variant_type_label, variant_dimensions, suggested_variant_types, fields)
        VALUES (
            cat_id, 
            'Tone / Type', 
            '[{"label": "Tone / Type", "column": "variant_type", "active": true}, {"label": "Voltage", "column": "spec_voltage", "active": true}]'::jsonb,
            '{"Electric", "Air Horn", "Snail Type", "Disc Type", "High Tone", "Low Tone", "Set"}'::text[],
            '[{"key": "specifications.sound_level", "label": "Sound Level", "type": "text"}]'::jsonb
        ) ON CONFLICT (category_id) DO UPDATE SET 
            variant_type_label = EXCLUDED.variant_type_label,
            variant_dimensions = EXCLUDED.variant_dimensions,
            suggested_variant_types = EXCLUDED.suggested_variant_types,
            fields = EXCLUDED.fields;
    END IF;
END $$;
