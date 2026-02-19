
-- Shadow Sync: Populate category_metadata from legacy hardcoded configs
INSERT INTO category_metadata (category_id, variant_type_label, fields, suggested_variant_types)
VALUES 
-- Headlight
(1, 'Socket Type', 
 '[{"key": "color_temperature", "label": "Color Temp", "type": "text", "placeholder": "e.g. 6000K", "suffix": "K"}, {"key": "wattage", "label": "Wattage", "type": "number", "placeholder": "e.g. 55", "suffix": "W"}, {"key": "voltage", "label": "Voltage", "type": "number", "placeholder": "e.g. 12", "suffix": "V"}, {"key": "lumens", "label": "Lumens", "type": "number", "placeholder": "e.g. 8000"}]'::jsonb,
 '{"H1", "H3", "H4", "H7", "H8", "H9", "H11", "H13", "H15", "H16", "9005 (HB3)", "9006 (HB4)", "9012 (HIR2)", "880/881", "D1S", "D2S", "D3S", "D4S"}'),
-- Fog Light
(2, 'Socket Type', 
 '[{"key": "color_temperature", "label": "Color Temp", "type": "text", "placeholder": "e.g. 3000K", "suffix": "K"}, {"key": "wattage", "label": "Wattage", "type": "number", "placeholder": "e.g. 35", "suffix": "W"}]'::jsonb,
 '{"H8", "H11", "H16", "9005", "9006", "880", "881"}'),
-- Signal Light
(3, 'Socket Type', 
 '[{"key": "color_temperature", "label": "Color", "type": "text", "placeholder": "e.g. Amber"}]'::jsonb,
 '{"T20 (7440/7443)", "T25 (3156/3157)", "1156 (BA15S)", "1157 (BAY15D)", "BA9S"}'),
-- Interior Light
(4, 'Socket Type', 
 '[{"key": "color_temperature", "label": "Color", "type": "text", "placeholder": "e.g. Cool White"}]'::jsonb,
 '{"T10 (W5W)", "T15 (W16W)", "Festoon 31mm", "Festoon 36mm", "Festoon 39mm", "Festoon 41mm"}'),
-- Brake Light
(5, 'Socket Type', 
 '[{"key": "color_temperature", "label": "Color", "type": "text", "placeholder": "e.g. Red"}]'::jsonb,
 '{"T20 (7440/7443)", "T25 (3156/3157)", "1156 (BA15S)", "1157 (BAY15D)"}'),
-- Wiper
(6, 'Size', 
 '[{"key": "color_temperature", "label": "Color", "type": "text", "placeholder": "e.g. Black"}]'::jsonb,
 '{"14\"", "16\"", "17\"", "18\"", "19\"", "20\"", "21\"", "22\"", "24\"", "26\"", "28\""}'),
-- Horn
(7, 'Tone / Type', 
 '[{"key": "voltage", "label": "Voltage", "type": "number", "placeholder": "e.g. 12", "suffix": "V"}, {"key": "specifications.sound_level", "label": "Sound Level", "type": "text", "placeholder": "e.g. 110dB"}]'::jsonb,
 '{"Electric", "Air Horn", "Snail Type", "Disc Type", "High Tone", "Low Tone", "Set"}'),
-- DEFAULT for others (like Work Light)
(8, 'Type / Size',
 '[{"key": "color_temperature", "label": "Color / Type", "type": "text", "placeholder": "e.g. 6000K"}]'::jsonb,
 '{}')
ON CONFLICT (category_id) DO UPDATE SET
    variant_type_label = EXCLUDED.variant_type_label,
    fields = EXCLUDED.fields,
    suggested_variant_types = EXCLUDED.suggested_variant_types,
    updated_at = now();
