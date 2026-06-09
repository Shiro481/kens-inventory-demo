-- Fix search_inventory_v2 tags array error
CREATE OR REPLACE FUNCTION search_inventory_v2(
  p_search_query TEXT,
  p_limit INT DEFAULT 50,
  p_offset INT DEFAULT 0,
  p_categories TEXT[] DEFAULT NULL,
  p_status TEXT DEFAULT 'All'
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
  WITH ProductSpecs AS (
    SELECT 
      product_id, 
      jsonb_object_agg(spec_key, spec_value) as specs
    FROM product_specifications
    GROUP BY product_id
  ),
  VariantSpecs AS (
    SELECT 
      variant_id, 
      jsonb_object_agg(spec_key, spec_value) as specs
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
      COALESCE((ps.specs->>'voltage')::numeric, p.voltage) AS voltage,
      COALESCE((ps.specs->>'wattage')::numeric, p.wattage) AS wattage,
      COALESCE(ps.specs->>'color_temperature', p.color_temperature) AS color_temperature,
      COALESCE(ps.specs->>'variant_color', (p.specifications->>'color')::text) AS variant_color,
      COALESCE((ps.specs->>'lumens')::numeric, p.lumens) AS lumens,
      COALESCE(ps.specs->>'beam_type', p.beam_type) AS beam_type,
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
      NULL::TEXT AS variant_display_name,
      false AS is_variant,
      NULL::BIGINT AS parent_product_id,
      p.created_at AS created_at,
      p.updated_at AS updated_at,
      (p.specifications->>'internal_notes')::TEXT AS notes,
      COALESCE(
        (SELECT array_agg(x) FROM jsonb_array_elements_text(
          CASE WHEN jsonb_typeof(p.specifications->'tags') = 'array' THEN p.specifications->'tags' ELSE '[]'::jsonb END
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
      COALESCE(p.specifications, '{}'::jsonb) || COALESCE(v.specifications, '{}'::jsonb) || COALESCE(ps.specs, '{}'::jsonb) || COALESCE(vs.specs, '{}'::jsonb) AS specifications,
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
    (p_categories IS NULL OR ci.category = ANY(p_categories))
    AND (
      p_status = 'All' OR
      (p_status = 'Out of Stock' AND ci.stock <= 0) OR
      (p_status = 'Low Stock' AND ci.stock > 0 AND ci.stock < COALESCE(ci.min_quantity, 10)) OR
      (p_status = 'In Stock' AND ci.stock >= COALESCE(ci.min_quantity, 10))
    )
    AND (
      COALESCE(p_search_query, '') = '' OR
      (
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
    )
  ORDER BY 
    CASE WHEN COALESCE(p_search_query, '') = '' THEN 0 ELSE 1 END DESC,
    search_rank DESC,
    ci.name ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
;
