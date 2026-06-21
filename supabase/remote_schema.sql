


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "unaccent" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_dashboard_stats"() RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result JSONB;
BEGIN
    WITH SellableItems AS (
        SELECT 
            p.stock_quantity as stock, 
            p.min_stock_level as min_qty
        FROM products p
        WHERE NOT p.has_variants
        UNION ALL
        SELECT 
            v.stock_quantity as stock, 
            v.min_stock_level as min_qty
        FROM product_variants v
    ),
    SalesStats AS (
        SELECT 
            COUNT(*) as sales_count,
            COALESCE(SUM(total), 0) as total_revenue
        FROM sales
        WHERE created_at >= CURRENT_DATE -- Today's stats
    )
    SELECT jsonb_build_object(
        'total_items', (SELECT COUNT(*) FROM SellableItems),
        'low_stock', (SELECT COUNT(*) FROM SellableItems WHERE stock > 0 AND stock < min_qty),
        'out_of_stock', (SELECT COUNT(*) FROM SellableItems WHERE stock <= 0),
        'today_sales_count', (SELECT sales_count FROM SalesStats),
        'today_revenue', (SELECT total_revenue FROM SalesStats)
    ) INTO result;
    
    RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_dashboard_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_revenue_trend_normalized"("time_range_input" "text" DEFAULT 'WEEKLY'::"text") RETURNS TABLE("period" "text", "revenue" numeric, "orders" bigint)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF time_range_input = 'DAILY' THEN
        RETURN QUERY
        SELECT 
            to_char(created_at, 'HH24:00') as period,
            SUM(total)::NUMERIC as revenue,
            COUNT(*)::BIGINT as orders
        FROM sales
        WHERE created_at >= CURRENT_DATE
        GROUP BY 1
        ORDER BY 1;
    ELSIF time_range_input = 'WEEKLY' THEN
        RETURN QUERY
        SELECT 
            to_char(d, 'Dy') as period,
            COALESCE(SUM(s.total), 0)::NUMERIC as revenue,
            COUNT(s.id)::BIGINT as orders
        FROM generate_series(CURRENT_DATE - INTERVAL '6 days', CURRENT_DATE, '1 day'::interval) d
        LEFT JOIN sales s ON date_trunc('day', s.created_at) = d
        GROUP BY d, 1
        ORDER BY d;
    ELSIF time_range_input = 'MONTHLY' THEN
        RETURN QUERY
        SELECT 
            to_char(d, 'DD Mon') as period,
            COALESCE(SUM(s.total), 0)::NUMERIC as revenue,
            COUNT(s.id)::BIGINT as orders
        FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, '1 day'::interval) d
        LEFT JOIN sales s ON date_trunc('day', s.created_at) = d
        GROUP BY d, 1
        ORDER BY d;
    ELSE -- YEARLY
        RETURN QUERY
        SELECT 
            to_char(d, 'Mon') as period,
            COALESCE(SUM(s.total), 0)::NUMERIC as revenue,
            COUNT(s.id)::BIGINT as orders
        FROM generate_series(date_trunc('month', CURRENT_DATE - INTERVAL '11 months'), date_trunc('month', CURRENT_DATE), '1 month'::interval) d
        LEFT JOIN sales s ON date_trunc('month', s.created_at) = d
        GROUP BY d, 1
        ORDER BY d;
    END IF;
END;
$$;


ALTER FUNCTION "public"."get_revenue_trend_normalized"("time_range_input" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_top_products_normalized"("limit_count" integer DEFAULT 10) RETURNS TABLE("name" "text", "qty" bigint, "revenue" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(p.name, si.item_name) as name,
        SUM(si.quantity)::BIGINT as qty,
        SUM(si.subtotal)::NUMERIC as revenue
    FROM sale_items si
    LEFT JOIN products p ON si.product_id = p.id
    GROUP BY COALESCE(p.name, si.item_name)
    ORDER BY revenue DESC
    LIMIT limit_count;
END;
$$;


ALTER FUNCTION "public"."get_top_products_normalized"("limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_garage_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE email = auth.jwt() ->> 'email'
  );
END;
$$;


ALTER FUNCTION "public"."is_garage_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_super_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins
    WHERE email = (SELECT auth.jwt() ->> 'email')
      AND role = 'super_admin'
      AND is_active = true
  );
$$;


ALTER FUNCTION "public"."is_super_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."process_sale"("p_items" "jsonb", "p_subtotal" numeric, "p_tax" numeric, "p_total" numeric, "p_payment_method" "text" DEFAULT 'Cash'::"text", "p_customer_name" "text" DEFAULT NULL::"text", "p_customer_email" "text" DEFAULT NULL::"text", "p_notes" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_sale_id uuid;
  v_item jsonb;
  v_current_stock int;
  v_id bigint;
  v_variant_id bigint;
  v_qty int;
BEGIN
  -- Insert the sale record
  INSERT INTO sales (
    items, subtotal, tax, total, payment_method, customer_name, customer_email, notes, staff_uuid
  )
  VALUES (
    p_items, p_subtotal, p_tax, p_total, p_payment_method, p_customer_name, p_customer_email, p_notes, auth.uid()
  )
  RETURNING id INTO v_sale_id;

  -- Loop through items to validate and insert into sale_items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::int;
    v_id := (v_item->>'id')::bigint;
    v_variant_id := NULLIF(v_item->>'variant_id', 'null')::bigint;
    
    -- Stock Validation Logic
    IF v_variant_id IS NOT NULL THEN
      SELECT stock_quantity INTO v_current_stock
      FROM product_variants
      WHERE id = v_variant_id
      FOR SHARE;
      
      IF v_current_stock < v_qty THEN
        RAISE EXCEPTION 'Insufficient stock for % (Current: %, Needed: %)', v_item->>'name', v_current_stock, v_qty;
      END IF;
    ELSE
      SELECT stock_quantity INTO v_current_stock
      FROM products
      WHERE id = v_id
      FOR SHARE;
      
      IF v_current_stock < v_qty THEN
        RAISE EXCEPTION 'Insufficient stock for % (Current: %, Needed: %)', v_item->>'name', v_current_stock, v_qty;
      END IF;
    END IF;

    -- Insert into normalized sale_items table
    INSERT INTO public.sale_items (
      sale_id, 
      product_id, 
      variant_id, 
      quantity, 
      unit_price, 
      total_price, 
      discount
    )
    VALUES (
      v_sale_id,
      v_id,
      v_variant_id,
      v_qty,
      COALESCE((v_item->>'price')::numeric, 0),
      COALESCE((v_item->>'total')::numeric, (v_qty * COALESCE((v_item->>'price')::numeric, 0))),
      COALESCE((v_item->>'discount')::numeric, 0)
    );
  END LOOP;

  RETURN v_sale_id;
END;
$$;


ALTER FUNCTION "public"."process_sale"("p_items" "jsonb", "p_subtotal" numeric, "p_tax" numeric, "p_total" numeric, "p_payment_method" "text", "p_customer_name" "text", "p_customer_email" "text", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."save_product_with_variants"("p_product" "jsonb", "p_variants" "jsonb", "p_action" "text") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."save_product_with_variants"("p_product" "jsonb", "p_variants" "jsonb", "p_action" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_inventory_v2"("p_search_query" "text", "p_limit" integer DEFAULT 50, "p_offset" integer DEFAULT 0, "p_categories" "text"[] DEFAULT NULL::"text"[], "p_status" "text" DEFAULT 'All'::"text", "p_tags" "text"[] DEFAULT NULL::"text"[]) RETURNS TABLE("id" bigint, "uuid" bigint, "name" "text", "base_name" "text", "sku" "text", "price" numeric, "stock" bigint, "min_quantity" integer, "category" "text", "brand" "text", "description" "text", "image_url" "text", "barcode" "text", "cost_price" numeric, "voltage" numeric, "wattage" numeric, "color_temperature" "text", "variant_color" "text", "lumens" numeric, "beam_type" "text", "variant_type" "text", "specifications" "jsonb", "supplier" "text", "has_variants" boolean, "variant_count" integer, "variant_id" bigint, "variant_display_name" "text", "is_variant" boolean, "parent_product_id" bigint, "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "notes" "text", "tags" "text"[], "search_rank" real, "total_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
#variable_conflict use_column
BEGIN
  RETURN QUERY
  WITH ProductSpecs AS (
    SELECT
      product_id,
      jsonb_object_agg(spec_key, spec_value) AS specs
    FROM product_specifications
    GROUP BY product_id
  ),
  VariantSpecs AS (
    SELECT
      variant_id,
      jsonb_object_agg(spec_key, spec_value) AS specs
    FROM variant_specifications
    GROUP BY variant_id
  ),
  CombinedInventory AS (
    -- 1. PARENT PRODUCTS
    SELECT
      p.id AS id,
      p.id AS uuid,
      p.name AS name,
      p.name AS base_name,
      p.sku AS sku,
      p.selling_price AS price,
      COALESCE(
        (SELECT SUM(pv.stock_quantity) FROM product_variants pv WHERE pv.product_id = p.id),
        p.stock_quantity
      ) AS stock,
      p.min_stock_level AS min_quantity,
      pc.name AS category,
      b.name AS brand,
      p.description AS description,
      p.image_url AS image_url,
      p.barcode AS barcode,
      p.cost_price AS cost_price,
      COALESCE((ps.specs->>'voltage')::numeric,  p.voltage)  AS voltage,
      COALESCE((ps.specs->>'wattage')::numeric,  p.wattage)  AS wattage,
      COALESCE(ps.specs->>'color_temperature',   p.color_temperature) AS color_temperature,
      COALESCE(ps.specs->>'variant_color', (p.specifications->>'color')::text) AS variant_color,
      COALESCE((ps.specs->>'lumens')::numeric,   p.lumens)   AS lumens,
      COALESCE(ps.specs->>'beam_type',           p.beam_type) AS beam_type,
      COALESCE(
        ps.specs->>'socket',
        (p.specifications->>'socket')::text,
        vc.code
      ) AS variant_type,
      COALESCE(p.specifications, '{}'::jsonb) || COALESCE(ps.specs, '{}'::jsonb) AS specifications,
      s.name AS supplier,
      (p.has_variants OR (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id) > 0) AS has_variants,
      (SELECT COUNT(*)::INT FROM product_variants pv WHERE pv.product_id = p.id) AS variant_count,
      NULL::BIGINT AS variant_id,
      NULL::TEXT   AS variant_display_name,
      false        AS is_variant,
      NULL::BIGINT AS parent_product_id,
      p.created_at AS created_at,
      p.updated_at AS updated_at,
      (p.specifications->>'internal_notes')::TEXT AS notes,
      COALESCE(
        (SELECT array_agg(x) FROM jsonb_array_elements_text(
          CASE WHEN jsonb_typeof(p.specifications->'tags') = 'array'
               THEN p.specifications->'tags'
               ELSE '[]'::jsonb END
        ) x),
        ARRAY[]::TEXT[]
      ) AS tags
    FROM products p
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    LEFT JOIN variant_categories vc ON p.variant_type_id = vc.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN ProductSpecs ps ON p.id = ps.product_id

    UNION ALL

    -- 2. PRODUCT VARIANTS
    SELECT
      v.id AS id,
      v.id AS uuid,
      (p.name || ' - ' || COALESCE(vd.variant_name, v.variant_type, '')) AS name,
      p.name AS base_name,
      COALESCE(v.variant_sku, p.sku || '-' || v.id) AS sku,
      COALESCE(
        NULLIF(v.selling_price, 0),
        p.selling_price + COALESCE(v.price_adjustment, 0),
        p.selling_price
      ) AS price,
      v.stock_quantity::BIGINT AS stock,
      v.min_stock_level AS min_quantity,
      pc.name AS category,
      b.name AS brand,
      COALESCE(v.description, p.description) AS description,
      p.image_url AS image_url,
      COALESCE(v.variant_barcode, v.variant_sku) AS barcode,
      v.cost_price AS cost_price,
      COALESCE((ps.specs->>'voltage')::numeric, p.voltage) AS voltage,
      COALESCE((ps.specs->>'wattage')::numeric, p.wattage) AS wattage,
      COALESCE(vs.specs->>'color_temperature', v.color_temperature, ps.specs->>'color_temperature', p.color_temperature) AS color_temperature,
      COALESCE(vs.specs->>'variant_color', v.variant_color) AS variant_color,
      COALESCE((ps.specs->>'lumens')::numeric, p.lumens) AS lumens,
      COALESCE(ps.specs->>'beam_type', p.beam_type) AS beam_type,
      COALESCE(vd.variant_name, v.variant_type, 'Unknown') AS variant_type,
      COALESCE(p.specifications, '{}'::jsonb) || COALESCE(v.specifications, '{}'::jsonb)
        || COALESCE(ps.specs, '{}'::jsonb) || COALESCE(vs.specs, '{}'::jsonb) AS specifications,
      s.name AS supplier,
      false AS has_variants,
      0     AS variant_count,
      v.variant_id AS variant_id,
      TRIM(COALESCE(vd.variant_name, v.variant_type, 'Unknown') || ' ' || COALESCE(v.color_temperature::TEXT || 'K', '')) AS variant_display_name,
      true  AS is_variant,
      v.product_id AS parent_product_id,
      v.created_at AS created_at,
      p.updated_at AS updated_at,
      (v.specifications->>'internal_notes')::TEXT AS notes,
      COALESCE(
        (SELECT array_agg(x) FROM jsonb_array_elements_text(
          CASE
            WHEN jsonb_typeof(v.specifications->'tags') = 'array' THEN v.specifications->'tags'
            WHEN jsonb_typeof(p.specifications->'tags') = 'array' THEN p.specifications->'tags'
            ELSE '[]'::jsonb
          END
        ) x),
        ARRAY[]::TEXT[]
      ) AS tags
    FROM product_variants v
    JOIN products p ON v.product_id = p.id
    LEFT JOIN variant_definitions vd ON v.variant_id = vd.id
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
    LEFT JOIN brands b ON p.brand_id = b.id
    LEFT JOIN ProductSpecs ps ON p.id = ps.product_id
    LEFT JOIN VariantSpecs vs ON v.id = vs.variant_id
  ),
  Filtered AS (
    SELECT
      ci.*,
      (
        ts_rank(
          setweight(to_tsvector('simple', unaccent(COALESCE(ci.name, ''))), 'A') ||
          setweight(to_tsvector('simple', unaccent(COALESCE(ci.sku,  ''))), 'A') ||
          setweight(to_tsvector('simple', unaccent(COALESCE(ci.brand, ''))), 'B') ||
          setweight(to_tsvector('simple', unaccent(COALESCE(ci.variant_color, ''))), 'B') ||
          setweight(to_tsvector('simple', unaccent(COALESCE(ci.color_temperature::TEXT, ''))), 'B') ||
          setweight(to_tsvector('simple', unaccent(COALESCE(ci.category, ''))), 'C') ||
          setweight(to_tsvector('simple', unaccent(COALESCE(ci.variant_type, ''))), 'C') ||
          setweight(to_tsvector('simple', unaccent(COALESCE(ci.notes, ''))), 'C') ||
          setweight(to_tsvector('simple', unaccent(COALESCE(array_to_string(ci.tags, ' '), ''))), 'C'),
          plainto_tsquery('simple', unaccent(COALESCE(p_search_query, '')))
        )
      ) AS search_rank
    FROM CombinedInventory ci
    WHERE
      -- Category filter (server-side)
      (p_categories IS NULL OR ci.category = ANY(p_categories))
      -- Tag filter (server-side, array overlap: item must have at least one matching tag)
      AND (p_tags IS NULL OR ci.tags && p_tags)
      -- Status filter
      AND (
        p_status = 'All'
        OR (p_status = 'Out of Stock' AND ci.stock <= 0)
        OR (p_status = 'Low Stock'    AND ci.stock > 0 AND ci.stock < COALESCE(ci.min_quantity, 10))
        OR (p_status = 'In Stock'     AND ci.stock >= COALESCE(ci.min_quantity, 10))
      )
      -- Full-text + keyword search
      AND (
        COALESCE(p_search_query, '') = '' OR
        (
          (
            setweight(to_tsvector('simple', unaccent(COALESCE(ci.name, ''))), 'A') ||
            setweight(to_tsvector('simple', unaccent(COALESCE(ci.sku,  ''))), 'A') ||
            setweight(to_tsvector('simple', unaccent(COALESCE(ci.brand, ''))), 'B') ||
            setweight(to_tsvector('simple', unaccent(COALESCE(ci.variant_color, ''))), 'B') ||
            setweight(to_tsvector('simple', unaccent(COALESCE(ci.color_temperature::TEXT, ''))), 'B') ||
            setweight(to_tsvector('simple', unaccent(COALESCE(ci.category, ''))), 'C') ||
            setweight(to_tsvector('simple', unaccent(COALESCE(ci.variant_type, ''))), 'C') ||
            setweight(to_tsvector('simple', unaccent(COALESCE(ci.notes, ''))), 'C') ||
            setweight(to_tsvector('simple', unaccent(COALESCE(array_to_string(ci.tags, ' '), ''))), 'C')
          ) @@ plainto_tsquery('simple', unaccent(p_search_query))
          OR
          (
            SELECT COALESCE(bool_and(
              lower(unaccent(
                COALESCE(ci.name, '')          || ' ' ||
                COALESCE(ci.sku, '')           || ' ' ||
                COALESCE(ci.notes, '')         || ' ' ||
                COALESCE(ci.category, '')      || ' ' ||
                COALESCE(ci.brand, '')         || ' ' ||
                COALESCE(ci.variant_type, '')  || ' ' ||
                COALESCE(ci.variant_color, '') || ' ' ||
                COALESCE(ci.color_temperature, '') || ' ' ||
                COALESCE(array_to_string(ci.tags, ' '), '')
              )) LIKE '%' || kw || '%'
            ), true)
            FROM unnest(string_to_array(lower(unaccent(trim(p_search_query))), ' ')) AS kw
            WHERE kw <> ''
          )
        )
      )
  )
  SELECT
    f.id, f.uuid, f.name, f.base_name, f.sku, f.price, f.stock, f.min_quantity,
    f.category, f.brand, f.description, f.image_url, f.barcode, f.cost_price,
    f.voltage, f.wattage, f.color_temperature, f.variant_color, f.lumens,
    f.beam_type, f.variant_type, f.specifications, f.supplier,
    f.has_variants, f.variant_count, f.variant_id, f.variant_display_name,
    f.is_variant, f.parent_product_id, f.created_at, f.updated_at,
    f.notes, f.tags, f.search_rank,
    COUNT(*) OVER () AS total_count   -- total matching rows before LIMIT/OFFSET
  FROM Filtered f
  ORDER BY
    CASE WHEN COALESCE(p_search_query, '') = '' THEN 0 ELSE 1 END DESC,
    f.search_rank DESC,
    f.name ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;


ALTER FUNCTION "public"."search_inventory_v2"("p_search_query" "text", "p_limit" integer, "p_offset" integer, "p_categories" "text"[], "p_status" "text", "p_tags" "text"[]) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_product_stock_from_variants"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    UPDATE products
    SET stock_quantity = (
        SELECT COALESCE(SUM(stock_quantity), 0)
        FROM product_variants
        WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    )
    WHERE id = COALESCE(NEW.product_id, OLD.product_id);
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_product_stock_from_variants"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_product_to_normalized"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    v_brand_id INT;
BEGIN
    -- Sync Brand
    IF NEW.brand IS NOT NULL AND (OLD.brand IS NULL OR NEW.brand <> OLD.brand) THEN
        INSERT INTO brands (name)
        VALUES (TRIM(NEW.brand))
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name -- Just to get the ID
        RETURNING id INTO v_brand_id;
        
        NEW.brand_id := v_brand_id;
    END IF;

    -- Sync EAV Specifications (Product Level)
    -- We only sync if any of the legacy columns changed
    IF (TG_OP = 'INSERT') OR 
       (NEW.voltage IS DISTINCT FROM OLD.voltage) OR
       (NEW.wattage IS DISTINCT FROM OLD.wattage) OR
       (NEW.color_temperature IS DISTINCT FROM OLD.color_temperature) OR
       (NEW.lumens IS DISTINCT FROM OLD.lumens) OR
       (NEW.beam_type IS DISTINCT FROM OLD.beam_type) 
    THEN
        -- Upsert Voltage
        IF NEW.voltage IS NOT NULL THEN
            INSERT INTO product_specifications (product_id, spec_key, spec_value)
            VALUES (NEW.id, 'voltage', NEW.voltage::text)
            ON CONFLICT (product_id, spec_key) DO UPDATE SET spec_value = EXCLUDED.spec_value;
        END IF;

        -- Upsert Wattage
        IF NEW.wattage IS NOT NULL THEN
            INSERT INTO product_specifications (product_id, spec_key, spec_value)
            VALUES (NEW.id, 'wattage', NEW.wattage::text)
            ON CONFLICT (product_id, spec_key) DO UPDATE SET spec_value = EXCLUDED.spec_value;
        END IF;

        -- Upsert Color Temperature
        IF NEW.color_temperature IS NOT NULL THEN
            INSERT INTO product_specifications (product_id, spec_key, spec_value)
            VALUES (NEW.id, 'color_temperature', NEW.color_temperature::text)
            ON CONFLICT (product_id, spec_key) DO UPDATE SET spec_value = EXCLUDED.spec_value;
        END IF;

        -- Upsert Lumens
        IF NEW.lumens IS NOT NULL THEN
            INSERT INTO product_specifications (product_id, spec_key, spec_value)
            VALUES (NEW.id, 'lumens', NEW.lumens::text)
            ON CONFLICT (product_id, spec_key) DO UPDATE SET spec_value = EXCLUDED.spec_value;
        END IF;

        -- Upsert Beam Type
        IF NEW.beam_type IS NOT NULL THEN
            INSERT INTO product_specifications (product_id, spec_key, spec_value)
            VALUES (NEW.id, 'beam_type', NEW.beam_type)
            ON CONFLICT (product_id, spec_key) DO UPDATE SET spec_value = EXCLUDED.spec_value;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_product_to_normalized"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."sync_variant_to_normalized"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Sync EAV Specifications (Variant Level)
    -- Variant only has color_temperature as a specific field
    IF (TG_OP = 'INSERT') OR 
       (NEW.color_temperature IS DISTINCT FROM OLD.color_temperature)
    THEN
        -- Upsert Color Temp
        IF NEW.color_temperature IS NOT NULL THEN
            INSERT INTO variant_specifications (variant_id, spec_key, spec_value)
            VALUES (NEW.id, 'color_temperature', NEW.color_temperature::text)
            ON CONFLICT (variant_id, spec_key) DO UPDATE SET spec_value = EXCLUDED.spec_value;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."sync_variant_to_normalized"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_stock_on_sale"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Update product stock if it's a base product sale
    IF NEW.variant_id IS NULL THEN
        UPDATE products 
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.product_id;
    ELSE
        -- Update variant stock
        UPDATE product_variants
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.product_id; -- Fix: variant_id doesn't match ID directly sometimes in older versions, but here it's the FK
        
        -- Correct logic: update product_variants SET stock_quantity = ... WHERE id = NEW.variant_id
        UPDATE product_variants
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.variant_id;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_stock_on_sale"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admins" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "email" "text" NOT NULL,
    "password_hash" "text" NOT NULL,
    "full_name" "text",
    "role" "text" DEFAULT 'admin'::"text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "admins_role_check" CHECK (("role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text", 'manager'::"text", 'staff'::"text"])))
);


ALTER TABLE "public"."admins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."brands" (
    "id" bigint NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."brands" OWNER TO "postgres";


ALTER TABLE "public"."brands" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."brands_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."variant_definitions" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "base_name" "text" NOT NULL,
    "variant_name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "compatibility_list" "text"[],
    "description" "text",
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."variant_definitions" OWNER TO "postgres";


ALTER TABLE "public"."variant_definitions" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."bulb_type_variants_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."variant_categories" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "code" "text" NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."variant_categories" OWNER TO "postgres";


ALTER TABLE "public"."variant_categories" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."bulb_types_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."category_metadata" (
    "id" bigint NOT NULL,
    "category_id" bigint,
    "variant_type_label" "text" DEFAULT 'Type / Size'::"text",
    "fields" "jsonb" DEFAULT '[]'::"jsonb",
    "suggested_variant_types" "text"[] DEFAULT '{}'::"text"[],
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "variant_dimensions" "jsonb" DEFAULT '[]'::"jsonb"
);


ALTER TABLE "public"."category_metadata" OWNER TO "postgres";


ALTER TABLE "public"."category_metadata" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."category_metadata_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."product_categories" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "name" "text" NOT NULL,
    "description" "text"
);


ALTER TABLE "public"."product_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_variants" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "product_id" bigint,
    "variant_id" bigint,
    "variant_type" "text",
    "color_temperature" "text",
    "variant_sku" "text",
    "variant_barcode" "text",
    "selling_price" numeric(10,2) DEFAULT 0,
    "cost_price" numeric(10,2) DEFAULT 0,
    "stock_quantity" integer DEFAULT 0,
    "min_stock_level" integer DEFAULT 5,
    "is_primary" boolean DEFAULT false,
    "description" "text",
    "price_adjustment" numeric(10,2) DEFAULT 0,
    "variant_color" "text",
    "specifications" "jsonb" DEFAULT '{}'::"jsonb",
    "spec_key" "text",
    "variant_category_id" bigint
);


ALTER TABLE "public"."product_variants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "name" "text" NOT NULL,
    "sku" "text",
    "barcode" "text",
    "brand" "text",
    "category_id" bigint,
    "variant_type_id" bigint,
    "supplier_id" bigint,
    "selling_price" numeric(10,2) DEFAULT 0,
    "cost_price" numeric(10,2) DEFAULT 0,
    "stock_quantity" integer DEFAULT 0,
    "min_stock_level" integer DEFAULT 5,
    "reorder_level" integer DEFAULT 10,
    "description" "text",
    "image_url" "text",
    "voltage" numeric,
    "wattage" numeric,
    "color_temperature" "text",
    "lumens" numeric,
    "beam_type" "text",
    "specifications" "jsonb" DEFAULT '{}'::"jsonb",
    "has_variants" boolean DEFAULT false,
    "brand_id" bigint
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."pos_product_variants" AS
 SELECT "p"."id" AS "product_id",
    "p"."sku",
    "p"."name" AS "base_name",
    "p"."brand",
    "p"."selling_price" AS "base_price",
    "pbv"."id",
    "pbv"."id" AS "variant_id",
    COALESCE("btv"."display_name", "pbv"."variant_type") AS "display_name",
    "btv"."compatibility_list",
    COALESCE("pbv"."description", "btv"."description") AS "variant_description",
        CASE
            WHEN ("pbv"."selling_price" > (0)::numeric) THEN "pbv"."selling_price"
            ELSE ("p"."selling_price" + COALESCE("pbv"."price_adjustment", (0)::numeric))
        END AS "final_price",
    "pbv"."stock_quantity",
    "pbv"."min_stock_level",
    "pbv"."is_primary",
    "pbv"."variant_sku",
    "pc"."name" AS "category",
    "p"."image_url",
    COALESCE("pbv"."variant_color", "p"."color_temperature") AS "color_temperature"
   FROM ((("public"."products" "p"
     JOIN "public"."product_variants" "pbv" ON (("p"."id" = "pbv"."product_id")))
     LEFT JOIN "public"."variant_definitions" "btv" ON (("pbv"."variant_id" = "btv"."id")))
     LEFT JOIN "public"."product_categories" "pc" ON (("p"."category_id" = "pc"."id")))
  WHERE (("p"."has_variants" = true) AND (("btv"."is_active" = true) OR ("btv"."id" IS NULL)))
  ORDER BY "p"."name", COALESCE("btv"."display_name", "pbv"."variant_type");


ALTER VIEW "public"."pos_product_variants" OWNER TO "postgres";


ALTER TABLE "public"."product_variants" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."product_bulb_variants_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."product_categories" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."product_categories_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."product_specifications" (
    "id" bigint NOT NULL,
    "product_id" bigint NOT NULL,
    "spec_key" "text" NOT NULL,
    "spec_value" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."product_specifications" OWNER TO "postgres";


ALTER TABLE "public"."product_specifications" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."product_specifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE "public"."products" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."products_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."sale_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sale_id" "uuid" NOT NULL,
    "product_id" bigint NOT NULL,
    "variant_id" bigint,
    "quantity" integer NOT NULL,
    "unit_price" numeric DEFAULT 0 NOT NULL,
    "total_price" numeric DEFAULT 0 NOT NULL,
    "discount" numeric DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "sale_items_quantity_check" CHECK (("quantity" > 0))
);


ALTER TABLE "public"."sale_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sales" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "items" "jsonb" NOT NULL,
    "subtotal" numeric(10,2) NOT NULL,
    "tax" numeric(10,2) NOT NULL,
    "total" numeric(10,2) NOT NULL,
    "payment_method" "text" DEFAULT 'Cash'::"text",
    "customer_name" "text",
    "customer_email" "text",
    "receipt_number" "text",
    "transaction_status" "text" DEFAULT 'completed'::"text",
    "staff_id" "text",
    "notes" "text",
    "staff_uuid" "uuid"
);


ALTER TABLE "public"."sales" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."store_settings" (
    "id" bigint NOT NULL,
    "store_name" "text" DEFAULT 'Ken''s Auto Parts'::"text",
    "tax_rate" numeric DEFAULT 0.12,
    "low_stock_threshold" integer DEFAULT 5,
    "currency" "text" DEFAULT 'PHP'::"text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."store_settings" OWNER TO "postgres";


ALTER TABLE "public"."store_settings" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."store_settings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."suppliers" (
    "id" bigint NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "name" "text" NOT NULL,
    "contact_person" "text",
    "email" "text",
    "phone" "text",
    "address" "text"
);


ALTER TABLE "public"."suppliers" OWNER TO "postgres";


ALTER TABLE "public"."suppliers" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."suppliers_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."variant_specifications" (
    "id" bigint NOT NULL,
    "variant_id" bigint NOT NULL,
    "spec_key" "text" NOT NULL,
    "spec_value" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "key" "text"
);


ALTER TABLE "public"."variant_specifications" OWNER TO "postgres";


ALTER TABLE "public"."variant_specifications" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."variant_specifications_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."brands"
    ADD CONSTRAINT "brands_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."category_metadata"
    ADD CONSTRAINT "category_metadata_category_id_key" UNIQUE ("category_id");



ALTER TABLE ONLY "public"."category_metadata"
    ADD CONSTRAINT "category_metadata_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."product_categories"
    ADD CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_specifications"
    ADD CONSTRAINT "product_specifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_specifications"
    ADD CONSTRAINT "product_specifications_product_id_spec_key_key" UNIQUE ("product_id", "spec_key");



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."store_settings"
    ADD CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suppliers"
    ADD CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."variant_categories"
    ADD CONSTRAINT "variant_categories_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."variant_categories"
    ADD CONSTRAINT "variant_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."variant_definitions"
    ADD CONSTRAINT "variant_definitions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."variant_specifications"
    ADD CONSTRAINT "variant_specifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."variant_specifications"
    ADD CONSTRAINT "variant_specifications_variant_id_spec_key_key" UNIQUE ("variant_id", "spec_key");



CREATE INDEX "idx_products_brand_trgm" ON "public"."products" USING "gin" ("brand" "public"."gin_trgm_ops");



CREATE INDEX "idx_products_category_id" ON "public"."products" USING "btree" ("category_id");



CREATE INDEX "idx_products_color_temp_trgm" ON "public"."products" USING "gin" ("color_temperature" "public"."gin_trgm_ops");



CREATE INDEX "idx_products_name" ON "public"."products" USING "btree" ("name");



CREATE INDEX "idx_products_name_trgm" ON "public"."products" USING "gin" ("name" "public"."gin_trgm_ops");



CREATE INDEX "idx_products_sku_trgm" ON "public"."products" USING "gin" ("sku" "public"."gin_trgm_ops");



CREATE INDEX "idx_products_supplier_id" ON "public"."products" USING "btree" ("supplier_id");



CREATE INDEX "idx_products_updated_at" ON "public"."products" USING "btree" ("updated_at" DESC);



CREATE INDEX "idx_products_variant_type_id" ON "public"."products" USING "btree" ("variant_type_id");



CREATE INDEX "idx_variants_color_temp_trgm" ON "public"."product_variants" USING "gin" ("color_temperature" "public"."gin_trgm_ops");



CREATE INDEX "idx_variants_color_trgm" ON "public"."product_variants" USING "gin" ("variant_color" "public"."gin_trgm_ops");



CREATE INDEX "idx_variants_product_id" ON "public"."product_variants" USING "btree" ("product_id");



CREATE INDEX "idx_variants_variant_id" ON "public"."product_variants" USING "btree" ("variant_id");



CREATE OR REPLACE TRIGGER "trigger_sync_product_normalization" BEFORE INSERT OR UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."sync_product_to_normalized"();



CREATE OR REPLACE TRIGGER "trigger_sync_variant_normalization" BEFORE INSERT OR UPDATE ON "public"."product_variants" FOR EACH ROW EXECUTE FUNCTION "public"."sync_variant_to_normalized"();



CREATE OR REPLACE TRIGGER "trigger_update_stock_on_sale" AFTER INSERT ON "public"."sale_items" FOR EACH ROW EXECUTE FUNCTION "public"."update_stock_on_sale"();



CREATE OR REPLACE TRIGGER "update_admins_updated_at" BEFORE UPDATE ON "public"."admins" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_category_metadata_updated_at" BEFORE UPDATE ON "public"."category_metadata" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."category_metadata"
    ADD CONSTRAINT "category_metadata_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_specifications"
    ADD CONSTRAINT "product_specifications_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_variant_category_id_fkey" FOREIGN KEY ("variant_category_id") REFERENCES "public"."variant_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variant_definitions"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_bulb_type_id_fkey" FOREIGN KEY ("variant_type_id") REFERENCES "public"."variant_categories"("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id");



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sale_items"
    ADD CONSTRAINT "sale_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."sales"
    ADD CONSTRAINT "sales_staff_uuid_fkey" FOREIGN KEY ("staff_uuid") REFERENCES "public"."admins"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."variant_specifications"
    ADD CONSTRAINT "variant_specifications_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;



CREATE POLICY "Admin write brands" ON "public"."brands" TO "authenticated" USING ("public"."is_garage_admin"()) WITH CHECK ("public"."is_garage_admin"());



CREATE POLICY "Admin write categories" ON "public"."product_categories" TO "authenticated" USING ("public"."is_garage_admin"()) WITH CHECK ("public"."is_garage_admin"());



CREATE POLICY "Admin write category_metadata" ON "public"."category_metadata" TO "authenticated" USING ("public"."is_garage_admin"()) WITH CHECK ("public"."is_garage_admin"());



CREATE POLICY "Admin write products" ON "public"."products" TO "authenticated" USING ("public"."is_garage_admin"()) WITH CHECK ("public"."is_garage_admin"());



CREATE POLICY "Admin write store_settings" ON "public"."store_settings" TO "authenticated" USING ("public"."is_garage_admin"()) WITH CHECK ("public"."is_garage_admin"());



CREATE POLICY "Admin write suppliers" ON "public"."suppliers" TO "authenticated" USING ("public"."is_garage_admin"()) WITH CHECK ("public"."is_garage_admin"());



CREATE POLICY "Admin write variant_categories" ON "public"."variant_categories" TO "authenticated" USING ("public"."is_garage_admin"()) WITH CHECK ("public"."is_garage_admin"());



CREATE POLICY "Admin write variant_definitions" ON "public"."variant_definitions" TO "authenticated" USING ("public"."is_garage_admin"()) WITH CHECK ("public"."is_garage_admin"());



CREATE POLICY "Admin write variants" ON "public"."product_variants" TO "authenticated" USING ("public"."is_garage_admin"()) WITH CHECK ("public"."is_garage_admin"());



CREATE POLICY "Admins have full access to sale_items" ON "public"."sale_items" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."id" = "auth"."uid"()))));



CREATE POLICY "Allow Self Read" ON "public"."admins" FOR SELECT USING (true);



CREATE POLICY "Allow admin write access to brands" ON "public"."brands" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE (("admins"."id" = "auth"."uid"()) AND ("admins"."is_active" = true)))));



CREATE POLICY "Allow authenticated read access" ON "public"."admins" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read access to brands" ON "public"."brands" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read access to product_specs" ON "public"."product_specifications" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated read access to variant_specs" ON "public"."variant_specifications" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anon can read brands" ON "public"."brands" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon can read categories" ON "public"."product_categories" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon can read category_metadata" ON "public"."category_metadata" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon can read products" ON "public"."products" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon can read store_settings" ON "public"."store_settings" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon can read suppliers" ON "public"."suppliers" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon can read variant_categories" ON "public"."variant_categories" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon can read variant_definitions" ON "public"."variant_definitions" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Anon can read variants" ON "public"."product_variants" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Auth can insert sales" ON "public"."sales" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Auth can manage product_specs" ON "public"."product_specifications" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Auth can manage variant_specs" ON "public"."variant_specifications" TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Auth can read sales" ON "public"."sales" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Authenticated users can read sale_items" ON "public"."sale_items" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Public Read" ON "public"."products" FOR SELECT USING (true);



CREATE POLICY "Public Read BulbTypes" ON "public"."variant_categories" FOR SELECT USING (true);



CREATE POLICY "Public Read Categories" ON "public"."product_categories" FOR SELECT USING (true);



CREATE POLICY "Public Read Settings" ON "public"."store_settings" FOR SELECT USING (true);



CREATE POLICY "Public Read Suppliers" ON "public"."suppliers" FOR SELECT USING (true);



CREATE POLICY "Public Read Variants" ON "public"."variant_definitions" FOR SELECT USING (true);



CREATE POLICY "Service role has full access to sale_items" ON "public"."sale_items" TO "service_role" USING (true);



CREATE POLICY "Super admins can manage admins" ON "public"."admins" USING ("public"."is_super_admin"()) WITH CHECK ("public"."is_super_admin"());



ALTER TABLE "public"."admins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."brands" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."category_metadata" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_specifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."product_variants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sale_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sales" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."store_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."suppliers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."variant_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."variant_definitions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."variant_specifications" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."get_dashboard_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_dashboard_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_revenue_trend_normalized"("time_range_input" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_revenue_trend_normalized"("time_range_input" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_revenue_trend_normalized"("time_range_input" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_top_products_normalized"("limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_top_products_normalized"("limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_top_products_normalized"("limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_garage_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_garage_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_garage_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_super_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."process_sale"("p_items" "jsonb", "p_subtotal" numeric, "p_tax" numeric, "p_total" numeric, "p_payment_method" "text", "p_customer_name" "text", "p_customer_email" "text", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_sale"("p_items" "jsonb", "p_subtotal" numeric, "p_tax" numeric, "p_total" numeric, "p_payment_method" "text", "p_customer_name" "text", "p_customer_email" "text", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."save_product_with_variants"("p_product" "jsonb", "p_variants" "jsonb", "p_action" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."save_product_with_variants"("p_product" "jsonb", "p_variants" "jsonb", "p_action" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."save_product_with_variants"("p_product" "jsonb", "p_variants" "jsonb", "p_action" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."search_inventory_v2"("p_search_query" "text", "p_limit" integer, "p_offset" integer, "p_categories" "text"[], "p_status" "text", "p_tags" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."search_inventory_v2"("p_search_query" "text", "p_limit" integer, "p_offset" integer, "p_categories" "text"[], "p_status" "text", "p_tags" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_inventory_v2"("p_search_query" "text", "p_limit" integer, "p_offset" integer, "p_categories" "text"[], "p_status" "text", "p_tags" "text"[]) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_product_stock_from_variants"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_product_stock_from_variants"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_product_stock_from_variants"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_product_to_normalized"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_product_to_normalized"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_product_to_normalized"() TO "service_role";



GRANT ALL ON FUNCTION "public"."sync_variant_to_normalized"() TO "anon";
GRANT ALL ON FUNCTION "public"."sync_variant_to_normalized"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."sync_variant_to_normalized"() TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent"("regdictionary", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent_init"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unaccent_lexize"("internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_stock_on_sale"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_stock_on_sale"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_stock_on_sale"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";


















GRANT ALL ON TABLE "public"."admins" TO "anon";
GRANT ALL ON TABLE "public"."admins" TO "authenticated";
GRANT ALL ON TABLE "public"."admins" TO "service_role";



GRANT ALL ON TABLE "public"."brands" TO "anon";
GRANT ALL ON TABLE "public"."brands" TO "authenticated";
GRANT ALL ON TABLE "public"."brands" TO "service_role";



GRANT ALL ON SEQUENCE "public"."brands_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."brands_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."brands_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."variant_definitions" TO "anon";
GRANT ALL ON TABLE "public"."variant_definitions" TO "authenticated";
GRANT ALL ON TABLE "public"."variant_definitions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bulb_type_variants_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bulb_type_variants_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bulb_type_variants_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."variant_categories" TO "anon";
GRANT ALL ON TABLE "public"."variant_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."variant_categories" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bulb_types_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bulb_types_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bulb_types_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."category_metadata" TO "anon";
GRANT ALL ON TABLE "public"."category_metadata" TO "authenticated";
GRANT ALL ON TABLE "public"."category_metadata" TO "service_role";



GRANT ALL ON SEQUENCE "public"."category_metadata_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."category_metadata_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."category_metadata_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."product_categories" TO "anon";
GRANT ALL ON TABLE "public"."product_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."product_categories" TO "service_role";



GRANT ALL ON TABLE "public"."product_variants" TO "anon";
GRANT ALL ON TABLE "public"."product_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."product_variants" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."pos_product_variants" TO "anon";
GRANT ALL ON TABLE "public"."pos_product_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."pos_product_variants" TO "service_role";



GRANT ALL ON SEQUENCE "public"."product_bulb_variants_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."product_bulb_variants_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."product_bulb_variants_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."product_categories_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."product_categories_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."product_categories_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."product_specifications" TO "anon";
GRANT ALL ON TABLE "public"."product_specifications" TO "authenticated";
GRANT ALL ON TABLE "public"."product_specifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."product_specifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."product_specifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."product_specifications_id_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."products_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."sale_items" TO "anon";
GRANT ALL ON TABLE "public"."sale_items" TO "authenticated";
GRANT ALL ON TABLE "public"."sale_items" TO "service_role";



GRANT ALL ON TABLE "public"."sales" TO "anon";
GRANT ALL ON TABLE "public"."sales" TO "authenticated";
GRANT ALL ON TABLE "public"."sales" TO "service_role";



GRANT ALL ON TABLE "public"."store_settings" TO "anon";
GRANT ALL ON TABLE "public"."store_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."store_settings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."store_settings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."store_settings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."store_settings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."suppliers" TO "anon";
GRANT ALL ON TABLE "public"."suppliers" TO "authenticated";
GRANT ALL ON TABLE "public"."suppliers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."suppliers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."suppliers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."suppliers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."variant_specifications" TO "anon";
GRANT ALL ON TABLE "public"."variant_specifications" TO "authenticated";
GRANT ALL ON TABLE "public"."variant_specifications" TO "service_role";



GRANT ALL ON SEQUENCE "public"."variant_specifications_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."variant_specifications_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."variant_specifications_id_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































