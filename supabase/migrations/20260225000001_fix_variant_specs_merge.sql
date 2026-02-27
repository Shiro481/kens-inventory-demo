-- ============================================================
-- Migration: Fix variant specs merge in search_inventory RPC
-- Problem: Variant rows were only returning p.specifications (parent),
--          completely discarding v.specifications (variant-specific data).
--          This caused variant dimensions stored on the variant record
--          (e.g. socket, PCD, custom specs) to be invisible in the UI.
-- Fix: Merge parent + variant specs using JSONB || operator.
--      Variant-specific values take precedence over parent values.
-- ============================================================

CREATE OR REPLACE FUNCTION search_inventory(
  p_search_query TEXT,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0
)
RETURNS TABLE (
  id BIGINT,
  uuid BIGINT,
  name TEXT,
  base_name TEXT,
  sku TEXT,
  price NUMERIC,
  stock BIGINT,
  min_quantity INT,
  category TEXT,
  brand TEXT,
  description TEXT,
  image_url TEXT,
  barcode TEXT,
  cost_price NUMERIC,
  voltage NUMERIC,
  wattage NUMERIC,
  color_temperature TEXT,
  variant_color TEXT,
  lumens NUMERIC,
  beam_type TEXT,
  variant_type TEXT,
  specifications JSONB,
  supplier TEXT,
  has_variants BOOLEAN,
  variant_count INT,
  variant_id BIGINT,
  variant_display_name TEXT,
  is_variant BOOLEAN,
  parent_product_id BIGINT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  tags TEXT[],
  search_rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
#variable_conflict use_column
BEGIN
  RETURN QUERY
  WITH CombinedInventory AS (
    -- 1. PARENT PRODUCTS
    SELECT 
      p.id AS id,
      p.id AS uuid,
      p.name AS name,
      p.name AS base_name,
      p.sku AS sku,
      p.selling_price AS price,
      -- Stock: Sum of variants if any exist, otherwise parent stock
      COALESCE(
        (SELECT SUM(pv.stock_quantity) FROM product_variants pv WHERE pv.product_id = p.id),
        p.stock_quantity
      ) AS stock,
      p.min_stock_level AS min_quantity,
      pc.name AS category,
      p.brand AS brand,
      p.description AS description,
      p.image_url AS image_url,
      p.barcode AS barcode,
      p.cost_price AS cost_price,
      p.voltage AS voltage,
      p.wattage AS wattage,
      p.color_temperature AS color_temperature,
      -- Fallback priority for variant_color
      (p.specifications->>'color')::TEXT AS variant_color,
      p.lumens AS lumens,
      p.beam_type AS beam_type,
      -- Fallback priority for variant_type (socket)
      COALESCE(
        (p.specifications->>'socket')::TEXT, 
        vc.code
      ) AS variant_type,
      p.specifications AS specifications,
      s.name AS supplier,
      (p.has_variants OR (SELECT COUNT(*) FROM product_variants pv WHERE pv.product_id = p.id) > 0) AS has_variants,
      (SELECT COUNT(*)::INT FROM product_variants pv WHERE pv.product_id = p.id) AS variant_count,
      NULL::BIGINT AS variant_id,
      NULL::TEXT AS variant_display_name,
      false AS is_variant,
      NULL::BIGINT AS parent_product_id,
      p.created_at AS created_at,
      p.updated_at AS updated_at,
      (p.specifications->>'internal_notes')::TEXT AS notes,
      ARRAY(SELECT jsonb_array_elements_text(p.specifications->'tags')) AS tags
    FROM products p
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    LEFT JOIN variant_categories vc ON p.variant_type_id = vc.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id

    UNION ALL

    -- 2. PRODUCT VARIANTS
    SELECT
      v.id AS id,
      v.id AS uuid,
      -- Simplistic name merge for SQL, JS side will handle strict cleaning if needed
      (p.name || ' - ' || COALESCE(vd.variant_name, v.variant_type, '')) AS name,
      p.name AS base_name,
      COALESCE(v.variant_sku, p.sku || '-' || v.id) AS sku,
      COALESCE(
        NULLIF(v.selling_price, 0),
        p.selling_price + COALESCE(v.price_adjustment, 0),
        p.selling_price
      ) AS price,
      v.stock_quantity AS stock,
      v.min_stock_level AS min_quantity,
      pc.name AS category,
      p.brand AS brand,
      COALESCE(v.description, p.description) AS description,
      p.image_url AS image_url,
      COALESCE(v.variant_barcode, v.variant_sku) AS barcode,
      v.cost_price AS cost_price,
      p.voltage AS voltage,
      p.wattage AS wattage,
      COALESCE(v.color_temperature, p.color_temperature) AS color_temperature,
      v.variant_color AS variant_color,
      p.lumens AS lumens,
      p.beam_type AS beam_type,
      COALESCE(vd.variant_name, v.variant_type, 'Unknown') AS variant_type,
      -- FIX: Merge parent AND variant specifications.
      -- Variant-specific values take precedence over parent values (right side wins with ||).
      COALESCE(p.specifications, '{}'::jsonb) || COALESCE(v.specifications, '{}'::jsonb) AS specifications,
      s.name AS supplier,
      false AS has_variants,
      0 AS variant_count,
      v.variant_id AS variant_id,
      TRIM(COALESCE(vd.variant_name, v.variant_type, 'Unknown') || ' ' || COALESCE(v.color_temperature::TEXT || 'K', '')) AS variant_display_name,
      true AS is_variant,
      v.product_id AS parent_product_id,
      v.created_at AS created_at,
      p.updated_at AS updated_at,
      (v.specifications->>'internal_notes')::TEXT AS notes,
      CASE 
        WHEN v.specifications->'tags' IS NOT NULL AND jsonb_array_length(v.specifications->'tags') > 0 
        THEN ARRAY(SELECT jsonb_array_elements_text(v.specifications->'tags'))
        ELSE ARRAY(SELECT jsonb_array_elements_text(p.specifications->'tags'))
      END AS tags
    FROM product_variants v
    JOIN products p ON v.product_id = p.id
    LEFT JOIN variant_definitions vd ON v.variant_id = vd.id
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    LEFT JOIN suppliers s ON p.supplier_id = s.id
  )
  SELECT 
    ci.*,
    (
      ts_rank(
        setweight(to_tsvector('simple', unaccent(COALESCE(ci.name, ''))), 'A') ||
        setweight(to_tsvector('simple', unaccent(COALESCE(ci.sku, ''))), 'A') ||
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
    COALESCE(p_search_query, '') = '' OR
    (
      -- Combine FTS and Keyword Multi-Match for maximum robustness
      (
        setweight(to_tsvector('simple', unaccent(COALESCE(ci.name, ''))), 'A') ||
        setweight(to_tsvector('simple', unaccent(COALESCE(ci.sku, ''))), 'A') ||
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
            COALESCE(ci.name, '') || ' ' ||
            COALESCE(ci.sku, '') || ' ' ||
            COALESCE(ci.notes, '') || ' ' ||
            COALESCE(ci.category, '') || ' ' ||
            COALESCE(ci.brand, '') || ' ' ||
            COALESCE(ci.variant_type, '') || ' ' ||
            COALESCE(ci.variant_color, '') || ' ' ||
            COALESCE(ci.color_temperature, '') || ' ' ||
            COALESCE(array_to_string(ci.tags, ' '), '')
          )) LIKE '%' || kw || '%'
        ), true)
        FROM unnest(string_to_array(lower(unaccent(trim(p_search_query))), ' ')) AS kw 
        WHERE kw <> ''
      )
    )
  ORDER BY 
    CASE WHEN COALESCE(p_search_query, '') = '' THEN 0 ELSE 1 END DESC,
    search_rank DESC,
    ci.name ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION search_inventory(TEXT, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION search_inventory(TEXT, INT, INT) TO anon;
