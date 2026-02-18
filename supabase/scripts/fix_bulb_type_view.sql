-- =====================================================
-- FIX BULB TYPE DISPLAY VIEW FOR FRONTEND
-- =====================================================
-- This recreates the view to work properly with Supabase joins

-- Drop the existing view
DROP VIEW IF EXISTS bulb_type_display;

-- Recreate the view with proper structure for Supabase
CREATE OR REPLACE VIEW bulb_type_display AS
SELECT 
    bt.id,
    bt.code,
    CASE 
        WHEN bt.compatibility_group = 'H11_GROUP' THEN 'H11/H16/H8'
        WHEN bt.compatibility_group = '9005_GROUP' THEN '9005/HB3'
        WHEN bt.compatibility_group = '9006_GROUP' THEN '9006/HB4'
        WHEN bt.compatibility_group = '7507_GROUP' THEN '7507/PY21W'
        WHEN bt.compatibility_group = '1157_GROUP' THEN '1157/2057/2357/7528'
        WHEN bt.compatibility_group = 'W5W_GROUP' THEN 'W5W/194/168'
        WHEN bt.compatibility_group = 'D2S_GROUP' THEN 'D1S/D2S/D3S/D4S'
        WHEN bt.compatibility_group = 'UNIVERSAL_LED' AND bt.code = 'H4_LED' THEN 'H4/H7/9005/9006 LED'
        WHEN bt.compatibility_group = 'UNIVERSAL_LED' AND bt.code = 'H11_LED' THEN 'H11/H8/H16 LED'
        WHEN bt.compatibility_group = 'UNIVERSAL_LED' AND bt.code = 'W5W_LED' THEN 'W5W/194/168/147/152 LED'
        WHEN bt.compatibility_group = 'UNIVERSAL_LED' AND bt.code = '9005_LED' THEN '9005/HB3/9011/HIR1 LED'
        WHEN bt.compatibility_group = 'UNIVERSAL_LED' AND bt.code = '9006_LED' THEN '9006/HB4/9012/HIR2 LED'
        WHEN bt.compatibility_group = 'UNIVERSAL_LED' AND bt.code = '1157_LED' THEN '1157/2057/2357/7528 LED'
        WHEN bt.compatibility_group = 'UNIVERSAL_LED' AND bt.code = '7507_LED' THEN '7507/PY21W/1156/2357 LED'
        WHEN bt.compatibility_group = 'UNIVERSAL_LED' AND bt.code = 'D2S_HID' THEN 'D1S/D2S/D3S/D4S HID'
        ELSE bt.code
    END as display_name,
    bt.description,
    bt.compatibility_group,
    bt.base_code,
    bt.is_primary,
    bt.notes
FROM bulb_types bt;

-- Test the view
SELECT 'Testing bulb_type_display view:' as info;
SELECT * FROM bulb_type_display ORDER BY code LIMIT 10;

-- Test the join with products
SELECT 'Testing products join with bulb_type_display:' as info;
SELECT 
    p.name,
    p.brand,
    btd.display_name as bulb_type_display,
    p.selling_price
FROM products p
LEFT JOIN bulb_type_display btd ON p.bulb_type_id = btd.id
WHERE p.brand IN ('GPNE', 'Philips')
ORDER BY p.brand, p.name
LIMIT 5;
