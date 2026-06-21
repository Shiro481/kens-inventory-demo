-- Remove the legacy 5-argument overload of search_inventory_v2.
-- The new 6-argument version (with p_tags TEXT[] DEFAULT NULL) is the only
-- overload that should exist after the 20260618000002 migration.
DROP FUNCTION IF EXISTS search_inventory_v2(text, integer, integer, text[], text);
