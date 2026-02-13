-- =====================================================
-- SAFE BULB TYPES ENHANCEMENT (NO DATA LOSS)
-- =====================================================
-- This script adds compatibility features without deleting existing data

-- =====================================================
-- STEP 1: ADD NEW COLUMNS TO BULB_TYPES TABLE
-- =====================================================

-- Add compatibility grouping columns (IF NOT EXISTS prevents errors if already added)
ALTER TABLE bulb_types ADD COLUMN IF NOT EXISTS compatibility_group VARCHAR(50);
ALTER TABLE bulb_types ADD COLUMN IF NOT EXISTS base_code VARCHAR(20);
ALTER TABLE bulb_types ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT false;
ALTER TABLE bulb_types ADD COLUMN IF NOT EXISTS notes TEXT;

-- =====================================================
-- STEP 2: CREATE BULB TYPE COMPATIBILITY JUNCTION TABLE
-- =====================================================

-- Table to store cross-compatibility between bulb types
CREATE TABLE IF NOT EXISTS bulb_type_compatibility (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_bulb_type_id UUID NOT NULL REFERENCES bulb_types(id) ON DELETE CASCADE,
    compatible_bulb_type_id UUID NOT NULL REFERENCES bulb_types(id) ON DELETE CASCADE,
    compatibility_type VARCHAR(50) NOT NULL, -- 'direct', 'with_adapter', 'modified'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate relationships
    UNIQUE(primary_bulb_type_id, compatible_bulb_type_id),
    
    -- Prevent self-compatibility
    CHECK (primary_bulb_type_id != compatible_bulb_type_id)
);

-- =====================================================
-- STEP 3: CREATE INDEXES
-- =====================================================

-- Indexes for bulb type compatibility
CREATE INDEX IF NOT EXISTS idx_bulb_compatibility_primary ON bulb_type_compatibility(primary_bulb_type_id);
CREATE INDEX IF NOT EXISTS idx_bulb_compatibility_compatible ON bulb_type_compatibility(compatible_bulb_type_id);
CREATE INDEX IF NOT EXISTS idx_bulb_compatibility_type ON bulb_type_compatibility(compatibility_type);

-- Indexes for enhanced bulb types
CREATE INDEX IF NOT EXISTS idx_bulb_types_group ON bulb_types(compatibility_group);
CREATE INDEX IF NOT EXISTS idx_bulb_types_base_code ON bulb_types(base_code);
CREATE INDEX IF NOT EXISTS idx_bulb_types_primary ON bulb_types(is_primary);

-- =====================================================
-- STEP 4: UPDATE EXISTING BULB TYPES WITH COMPATIBILITY INFO
-- =====================================================

-- Update existing bulb types with compatibility groups
-- First, set base_code to code for existing types
UPDATE bulb_types SET base_code = code WHERE base_code IS NULL;

-- Set compatibility groups for existing types
UPDATE bulb_types SET 
    compatibility_group = 'H4_GROUP',
    is_primary = true,
    notes = 'Standard dual filament headlight'
WHERE code = 'H4';

UPDATE bulb_types SET 
    compatibility_group = 'H7_GROUP',
    is_primary = true,
    notes = 'Single filament low beam'
WHERE code = 'H7';

UPDATE bulb_types SET 
    compatibility_group = '9005_GROUP',
    base_code = '9005',
    is_primary = true,
    notes = 'Single filament high beam (HB3)'
WHERE code = '9005';

UPDATE bulb_types SET 
    compatibility_group = '9006_GROUP',
    base_code = '9006',
    is_primary = true,
    notes = 'Single filament low beam (HB4)'
WHERE code = '9006';

UPDATE bulb_types SET 
    compatibility_group = '9007_GROUP',
    base_code = '9007',
    is_primary = true,
    notes = 'Dual filament headlight (HB5)'
WHERE code = '9007';

UPDATE bulb_types SET 
    compatibility_group = 'D2_GROUP',
    base_code = 'D2S',
    is_primary = true,
    notes = 'HID xenon for projectors'
WHERE code = 'D2S';

-- =====================================================
-- STEP 5: ADD MISSING BULB TYPES (without deleting existing)
-- =====================================================

-- Add H11, H16, H8 types if they don't exist
INSERT INTO bulb_types (code, description, base_type, compatibility_group, base_code, is_primary, notes) VALUES
('H11', 'Single filament low beam', 'PGJ19-2', 'H11_GROUP', 'H11', true, 'Primary type for H11/H16/H8 group'),
('H16', 'Single filament low beam', 'PGJ19-2', 'H11_GROUP', 'H11', false, 'Compatible with H11 base'),
('H8', 'Single filament fog/driving light', 'PGJ19-2', 'H11_GROUP', 'H11', false, 'Compatible with H11 base'),
('HB3', 'Single filament high beam', 'P20d', '9005_GROUP', '9005', false, 'Alternative name for 9005'),
('HB4', 'Single filament low beam', 'P22d', '9006_GROUP', '9006', false, 'Alternative name for 9006'),
('HB5', 'Dual filament high/low beam', 'P29t', '9007_GROUP', '9007', false, 'Alternative name for 9007'),
('D2R', 'HID xenon bulb', 'P32d-5', 'D2_GROUP', 'D2S', false, 'HID for reflectors'),
('H4_LED', 'LED replacement for H4', 'Custom', 'H4_GROUP', 'H4', false, 'LED conversion for H4'),
('H7_LED', 'LED replacement for H7', 'Custom', 'H7_GROUP', 'H7', false, 'LED conversion for H7'),
('H11_LED', 'LED replacement for H11', 'Custom', 'H11_GROUP', 'H11', false, 'LED conversion for H11'),
('W5W', 'Sidemarker/Interior light', 'W2.1x9.5d', 'W5W_GROUP', 'W5W', true, 'Small wedge base'),
('194', 'Instrument/Marker light', 'W2.1x9.5d', 'W5W_GROUP', 'W5W', false, 'Alternative to W5W'),
('168', 'Instrument/Marker light', 'W2.1x9.5d', 'W5W_GROUP', 'W5W', false, 'Alternative to W5W'),
('7507', 'Turn signal amber', 'BAU15s', '7507_GROUP', '7507', true, 'European turn signal'),
('PY21W', 'Turn signal amber', 'BAU15s', '7507_GROUP', '7507', false, 'Alternative to 7507'),
('P21W', 'Turn signal/Brake clear', 'BA15s', 'P21W_GROUP', 'P21W', true, 'Single filament signal'),
('1157', 'Brake/Tail light dual', 'BAY15d', '1157_GROUP', '1157', true, 'Dual filament brake/tail')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- STEP 6: ADD COMPATIBILITY RELATIONSHIPS
-- =====================================================

-- Add compatibility relationships (only if they don't exist)
INSERT INTO bulb_type_compatibility (primary_bulb_type_id, compatible_bulb_type_id, compatibility_type, notes) VALUES
-- H11 Group Compatibility
((SELECT id FROM bulb_types WHERE code = 'H11'), (SELECT id FROM bulb_types WHERE code = 'H16'), 'direct', 'H16 can replace H11 in most applications'),
((SELECT id FROM bulb_types WHERE code = 'H11'), (SELECT id FROM bulb_types WHERE code = 'H8'), 'direct', 'H8 can replace H11 with minor modifications'),
((SELECT id FROM bulb_types WHERE code = 'H16'), (SELECT id FROM bulb_types WHERE code = 'H8'), 'direct', 'H16 and H8 are directly compatible'),

-- HB3/HB4 Group (alternative names)
((SELECT id FROM bulb_types WHERE code = '9005'), (SELECT id FROM bulb_types WHERE code = 'HB3'), 'direct', 'HB3 is alternative name for 9005'),
((SELECT id FROM bulb_types WHERE code = '9006'), (SELECT id FROM bulb_types WHERE code = 'HB4'), 'direct', 'HB4 is alternative name for 9006'),

-- 9007 Group
((SELECT id FROM bulb_types WHERE code = '9007'), (SELECT id FROM bulb_types WHERE code = 'HB5'), 'direct', 'HB5 is alternative name for 9007'),

-- D2 Group
((SELECT id FROM bulb_types WHERE code = 'D2S'), (SELECT id FROM bulb_types WHERE code = 'D2R'), 'with_adapter', 'D2S and D2R need different fixtures'),

-- W5W Group (cross-compatible)
((SELECT id FROM bulb_types WHERE code = 'W5W'), (SELECT id FROM bulb_types WHERE code = '194'), 'direct', '194 is direct replacement for W5W'),
((SELECT id FROM bulb_types WHERE code = 'W5W'), (SELECT id FROM bulb_types WHERE code = '168'), 'direct', '168 is direct replacement for W5W'),
((SELECT id FROM bulb_types WHERE code = '194'), (SELECT id FROM bulb_types WHERE code = '168'), 'direct', '194 and 168 are interchangeable'),

-- 7507 Group
((SELECT id FROM bulb_types WHERE code = '7507'), (SELECT id FROM bulb_types WHERE code = 'PY21W'), 'direct', 'PY21W is European equivalent of 7507')
ON CONFLICT (primary_bulb_type_id, compatible_bulb_type_id) DO NOTHING;

-- =====================================================
-- STEP 7: CREATE VIEWS FOR BULB TYPE ORGANIZATION
-- =====================================================

-- View showing bulb types with their compatibility groups
CREATE OR REPLACE VIEW bulb_type_groups AS
SELECT 
    bt.*,
    COUNT(btc.compatible_bulb_type_id) as compatible_types_count,
    ARRAY_AGG(
        CASE WHEN btc.compatible_bulb_type_id IS NOT NULL 
        THEN (SELECT code FROM bulb_types WHERE id = btc.compatible_bulb_type_id) 
        END
    ) FILTER (WHERE btc.compatible_bulb_type_id IS NOT NULL) as compatible_types
FROM bulb_types bt
LEFT JOIN bulb_type_compatibility btc ON bt.id = btc.primary_bulb_type_id
GROUP BY bt.id, bt.code, bt.description, bt.base_type, bt.compatibility_group, 
         bt.base_code, bt.is_primary, bt.notes, bt.created_at;

-- View showing all compatible bulb types for each group
CREATE OR REPLACE VIEW compatibility_groups AS
SELECT 
    compatibility_group,
    base_code,
    ARRAY_AGG(code ORDER BY is_primary DESC, code) as all_codes,
    ARRAY_AGG(code ORDER BY is_primary DESC, code) FILTER (WHERE is_primary = true) as primary_codes,
    STRING_AGG(code, '/' ORDER BY is_primary DESC, code) as display_format
FROM bulb_types
WHERE compatibility_group IS NOT NULL
GROUP BY compatibility_group, base_code
ORDER BY base_code;

-- =====================================================
-- STEP 8: SAMPLE QUERIES FOR TESTING
-- =====================================================

-- Test query to see bulb type groups
/*
SELECT 
    display_format,
    all_codes,
    primary_codes
FROM compatibility_groups
ORDER BY display_format;
*/

-- Test query to see compatibility for a specific bulb
/*
SELECT 
    bt.code as primary_type,
    btc.compatibility_type,
    btc2.code as compatible_type,
    btc2.description,
    btc.notes
FROM bulb_type_compatibility btc
JOIN bulb_types bt ON btc.primary_bulb_type_id = bt.id
JOIN bulb_types btc2 ON btc.compatible_bulb_type_id = btc2.id
WHERE bt.code = 'H11';
*/
