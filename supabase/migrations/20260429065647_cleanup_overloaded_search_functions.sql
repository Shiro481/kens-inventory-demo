-- Drop old search_inventory functions
DROP FUNCTION IF EXISTS public.search_inventory(text, integer, integer);
DROP FUNCTION IF EXISTS public.search_inventory(text, integer, integer, text[]);

-- Drop old versions of search_inventory_v2 to resolve overloading conflict
DROP FUNCTION IF EXISTS public.search_inventory_v2(text, integer, integer, text[]);
;
