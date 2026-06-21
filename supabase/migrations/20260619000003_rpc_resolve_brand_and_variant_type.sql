-- Fix: direct client upserts to `brands` and `variant_categories` fail with RLS
-- because `is_garage_admin()` returns false for direct table operations in some
-- session contexts. Move those resolutions inside the SECURITY DEFINER RPC so
-- they run as the function owner and bypass RLS entirely.
--
-- Also adds `public.upsert_variant_definition` for the variant-update path,
-- which has the same RLS restriction on direct INSERT into variant_definitions.

-- ── 1. Updated save_product_with_variants ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.save_product_with_variants(
  p_product  JSONB,
  p_variants JSONB,
  p_action   TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id       BIGINT;
  v_brand_id         BIGINT;
  v_variant_type_id  BIGINT;
BEGIN
  IF NOT public.is_garage_admin() THEN
    RETURN jsonb_build_object('product_id', NULL, 'error', 'Permission denied: admin access required');
  END IF;

  -- Resolve brand: prefer supplied brand_id; otherwise upsert by name
  IF (p_product->>'brand_id') IS NOT NULL THEN
    v_brand_id := (p_product->>'brand_id')::bigint;
  ELSIF (p_product->>'brand') IS NOT NULL AND (p_product->>'brand') <> '' THEN
    INSERT INTO public.brands (name)
    VALUES (p_product->>'brand')
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_brand_id;
  END IF;

  -- Resolve variant_type: prefer supplied variant_type_id; otherwise upsert by code
  IF (p_product->>'variant_type_id') IS NOT NULL THEN
    v_variant_type_id := (p_product->>'variant_type_id')::bigint;
  ELSIF (p_product->>'variant_type') IS NOT NULL AND (p_product->>'variant_type') <> '' THEN
    INSERT INTO public.variant_categories (code, description)
    VALUES (p_product->>'variant_type', 'Created via App')
    ON CONFLICT (code) DO UPDATE SET description = COALESCE(
      NULLIF(variant_categories.description, 'Created via App'),
      EXCLUDED.description
    )
    RETURNING id INTO v_variant_type_id;
  END IF;

  -- ── INSERT ──────────────────────────────────────────────────────────────────
  IF p_action = 'insert' THEN

    INSERT INTO public.products (
      name, sku, barcode, brand, brand_id,
      category_id, variant_type_id, supplier_id,
      selling_price, cost_price,
      stock_quantity, min_stock_level, reorder_level,
      description, image_url, beam_type,
      has_variants, specifications
    )
    VALUES (
      p_product->>'name',
      NULLIF(p_product->>'sku', ''),
      NULLIF(p_product->>'barcode', ''),
      NULLIF(p_product->>'brand', ''),
      v_brand_id,
      (p_product->>'category_id')::bigint,
      v_variant_type_id,
      (p_product->>'supplier_id')::bigint,
      COALESCE((p_product->>'selling_price')::numeric,  0),
      COALESCE((p_product->>'cost_price')::numeric,     0),
      COALESCE((p_product->>'stock_quantity')::integer, 0),
      COALESCE((p_product->>'min_stock_level')::integer, 5),
      COALESCE((p_product->>'reorder_level')::integer,  10),
      NULLIF(p_product->>'description', ''),
      NULLIF(p_product->>'image_url', ''),
      NULLIF(p_product->>'beam_type', ''),
      COALESCE((p_product->>'has_variants')::boolean, false),
      COALESCE(p_product->'specifications', '{}'::jsonb)
    )
    RETURNING id INTO v_product_id;

  -- ── UPDATE ──────────────────────────────────────────────────────────────────
  ELSIF p_action = 'update' THEN

    UPDATE public.products SET
      name            = COALESCE(p_product->>'name',            name),
      sku             = NULLIF(p_product->>'sku', ''),
      barcode         = NULLIF(p_product->>'barcode', ''),
      brand           = NULLIF(p_product->>'brand', ''),
      brand_id        = v_brand_id,
      category_id     = (p_product->>'category_id')::bigint,
      variant_type_id = v_variant_type_id,
      supplier_id     = (p_product->>'supplier_id')::bigint,
      selling_price   = COALESCE((p_product->>'selling_price')::numeric,  selling_price),
      cost_price      = COALESCE((p_product->>'cost_price')::numeric,     cost_price),
      stock_quantity  = COALESCE((p_product->>'stock_quantity')::integer,  stock_quantity),
      min_stock_level = COALESCE((p_product->>'min_stock_level')::integer, min_stock_level),
      reorder_level   = COALESCE((p_product->>'reorder_level')::integer,   reorder_level),
      description     = NULLIF(p_product->>'description', ''),
      image_url       = NULLIF(p_product->>'image_url', ''),
      beam_type       = NULLIF(p_product->>'beam_type', ''),
      has_variants    = COALESCE((p_product->>'has_variants')::boolean, has_variants),
      specifications  = COALESCE(p_product->'specifications', specifications)
    WHERE id = (p_product->>'id')::bigint
    RETURNING id INTO v_product_id;

    IF v_product_id IS NULL THEN
      RETURN jsonb_build_object(
        'product_id', NULL,
        'error', format('Product not found or no rows updated (id=%s)', p_product->>'id')
      );
    END IF;

  ELSE
    RETURN jsonb_build_object('product_id', NULL, 'error', format('Unknown action: %s', p_action));
  END IF;

  -- ── VARIANT INSERT (same transaction) ───────────────────────────────────────
  IF jsonb_array_length(COALESCE(p_variants, '[]'::jsonb)) > 0 THEN
    INSERT INTO public.product_variants (
      product_id,
      variant_id, variant_type, color_temperature,
      variant_sku, variant_barcode,
      selling_price, cost_price,
      stock_quantity, min_stock_level,
      description, variant_color,
      specifications, spec_key
    )
    SELECT
      v_product_id,
      (v->>'variant_id')::bigint,
      NULLIF(v->>'variant_type', ''),
      NULLIF(v->>'color_temperature', ''),
      NULLIF(v->>'variant_sku', ''),
      NULLIF(v->>'variant_barcode', ''),
      COALESCE((v->>'selling_price')::numeric,  0),
      COALESCE((v->>'cost_price')::numeric,     0),
      COALESCE((v->>'stock_quantity')::integer, 0),
      COALESCE((v->>'min_stock_level')::integer, 5),
      NULLIF(v->>'description', ''),
      NULLIF(v->>'variant_color', ''),
      COALESCE(v->'specifications', '{}'::jsonb),
      NULLIF(v->>'spec_key', '')
    FROM jsonb_array_elements(p_variants) AS v
    WHERE p_action = 'insert'
       OR COALESCE((v->>'is_temp')::boolean, false) = true;
  END IF;

  RETURN jsonb_build_object('product_id', v_product_id, 'error', NULL);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('product_id', NULL, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_product_with_variants(JSONB, JSONB, TEXT) TO authenticated;


-- ── 2. Helper for variant_definitions (used when updating an existing variant) ─
-- variant_definitions has no UNIQUE constraint on variant_name, so we SELECT
-- first and INSERT only when the name doesn't already exist.
CREATE OR REPLACE FUNCTION public.upsert_variant_definition(
  p_base_name    TEXT,
  p_variant_name TEXT,
  p_display_name TEXT
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id BIGINT;
BEGIN
  IF NOT public.is_garage_admin() THEN
    RAISE EXCEPTION 'Permission denied: admin access required';
  END IF;

  SELECT id INTO v_id
  FROM public.variant_definitions
  WHERE variant_name = p_variant_name
  LIMIT 1;

  IF v_id IS NULL THEN
    INSERT INTO public.variant_definitions (base_name, variant_name, display_name, is_active)
    VALUES (p_base_name, p_variant_name, p_display_name, true)
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_variant_definition(TEXT, TEXT, TEXT) TO authenticated;
