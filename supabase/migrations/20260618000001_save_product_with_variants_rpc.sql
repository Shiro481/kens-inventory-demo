-- Fix 1: Atomic product + variant save
-- Wraps the product INSERT/UPDATE and variant INSERT in a single plpgsql
-- transaction, eliminating the partial-write risk where a product row is
-- created but its variant rows fail to insert.

CREATE OR REPLACE FUNCTION public.save_product_with_variants(
  p_product  JSONB,  -- product column payload (brand_id, category_id, etc. pre-resolved)
  p_variants JSONB,  -- array of variant row payloads; pass '[]' when there are none
  p_action   TEXT    -- 'insert' | 'update'
)
RETURNS JSONB        -- { product_id: bigint | null, error: text | null }
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id BIGINT;
BEGIN
  -- Only active admins may mutate product data
  IF NOT public.is_garage_admin() THEN
    RETURN jsonb_build_object('product_id', NULL, 'error', 'Permission denied: admin access required');
  END IF;

  -- ── INSERT ────────────────────────────────────────────────────────────────────
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
      (p_product->>'brand_id')::bigint,
      (p_product->>'category_id')::bigint,
      (p_product->>'variant_type_id')::bigint,
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

  -- ── UPDATE ────────────────────────────────────────────────────────────────────
  ELSIF p_action = 'update' THEN

    UPDATE public.products SET
      name            = COALESCE(p_product->>'name',            name),
      sku             = NULLIF(p_product->>'sku', ''),
      barcode         = NULLIF(p_product->>'barcode', ''),
      brand           = NULLIF(p_product->>'brand', ''),
      brand_id        = (p_product->>'brand_id')::bigint,
      category_id     = (p_product->>'category_id')::bigint,
      variant_type_id = (p_product->>'variant_type_id')::bigint,
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

  -- ── VARIANT INSERT (runs inside the same transaction) ─────────────────────────
  -- For 'insert': insert all supplied variants.
  -- For 'update': insert only variants flagged with is_temp = true.
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
  -- Any error rolls back both the product and variant inserts
  RETURN jsonb_build_object('product_id', NULL, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_product_with_variants(JSONB, JSONB, TEXT) TO authenticated;
