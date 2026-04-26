-- =================================================================================
-- UNIFIED BACKFILL SCRIPT
-- Re-syncs legacy columns to normalized tables for Phases 1-3
-- =================================================================================

-- 1. PHASE 1: Brands
INSERT INTO public.brands (name)
SELECT DISTINCT brand 
FROM public.products
WHERE brand IS NOT NULL AND brand != ''
ON CONFLICT (name) DO NOTHING;

UPDATE public.products p 
SET brand_id = b.id 
FROM public.brands b 
WHERE p.brand = b.name;

-- 2. PHASE 1: Variant Category FK
UPDATE public.product_variants pv
SET variant_category_id = vc.id
FROM public.variant_categories vc
WHERE pv.variant_type = vc.code;

-- 3. PHASE 2: Product Specifications (EAV)
-- Voltage
INSERT INTO public.product_specifications (product_id, spec_key, spec_value)
SELECT id, 'voltage', voltage::text 
FROM public.products 
WHERE voltage IS NOT NULL
ON CONFLICT (product_id, spec_key) DO UPDATE SET spec_value = EXCLUDED.spec_value;

-- Wattage
INSERT INTO public.product_specifications (product_id, spec_key, spec_value)
SELECT id, 'wattage', wattage::text 
FROM public.products 
WHERE wattage IS NOT NULL
ON CONFLICT (product_id, spec_key) DO UPDATE SET spec_value = EXCLUDED.spec_value;

-- Color Temp
INSERT INTO public.product_specifications (product_id, spec_key, spec_value)
SELECT id, 'color_temperature', color_temperature 
FROM public.products 
WHERE color_temperature IS NOT NULL
ON CONFLICT (product_id, spec_key) DO UPDATE SET spec_value = EXCLUDED.spec_value;

-- Lumens
INSERT INTO public.product_specifications (product_id, spec_key, spec_value)
SELECT id, 'lumens', lumens::text 
FROM public.products 
WHERE lumens IS NOT NULL
ON CONFLICT (product_id, spec_key) DO UPDATE SET spec_value = EXCLUDED.spec_value;

-- Beam Type
INSERT INTO public.product_specifications (product_id, spec_key, spec_value)
SELECT id, 'beam_type', beam_type 
FROM public.products 
WHERE beam_type IS NOT NULL
ON CONFLICT (product_id, spec_key) DO UPDATE SET spec_value = EXCLUDED.spec_value;

-- 4. PHASE 2: Variant Specifications (EAV)
-- Voltage (from variants if any, but we saw they don't have columns, so we skip column-to-table)
-- We'll extract from the `specifications` JSONB blob if it exists
INSERT INTO public.variant_specifications (variant_id, spec_key, spec_value)
SELECT 
    pv.id, 
    kv.key as spec_key, 
    kv.value::text as spec_value
FROM public.product_variants pv,
     jsonb_each_text(pv.specifications) as kv
WHERE pv.specifications != '{}'::jsonb AND kv.value IS NOT NULL
ON CONFLICT (variant_id, spec_key) DO UPDATE SET spec_value = EXCLUDED.spec_value;

-- 5. PHASE 3: Sales Items
INSERT INTO public.sale_items (
    sale_id, product_id, variant_id, quantity, unit_price, total_price, discount
)
SELECT 
    s.id as sale_id,
    (item->>'id')::bigint as product_id,
    NULLIF(item->>'variant_id', 'null')::bigint as variant_id,
    (item->>'quantity')::int as quantity,
    COALESCE((item->>'price')::numeric, 0) as unit_price,
    COALESCE((item->>'total')::numeric, ((item->>'quantity')::int * COALESCE((item->>'price')::numeric, 0))) as total_price,
    COALESCE((item->>'discount')::numeric, 0) as discount
FROM public.sales s,
     jsonb_array_elements(s.items) as item
ON CONFLICT DO NOTHING;
