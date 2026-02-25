-- ============================================================
-- Migration: Add performance indexes for large inventory scale
-- Description: GIN trigram indexes for LIKE searches, B-tree
--   indexes for FK joins. Zero code changes required.
-- ============================================================

-- Required for LIKE '%...%' index optimization
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ── Products table ────────────────────────────────────────────

-- Name is the most-searched field — high priority
CREATE INDEX IF NOT EXISTS idx_products_name_trgm
  ON products USING GIN (name gin_trgm_ops);

-- SKU searches
CREATE INDEX IF NOT EXISTS idx_products_sku_trgm
  ON products USING GIN (sku gin_trgm_ops);

-- Brand filter
CREATE INDEX IF NOT EXISTS idx_products_brand_trgm
  ON products USING GIN (brand gin_trgm_ops);

-- Color temperature (e.g. "6000K")
CREATE INDEX IF NOT EXISTS idx_products_color_temp_trgm
  ON products USING GIN (color_temperature gin_trgm_ops);

-- B-tree indexes for JOIN performance
CREATE INDEX IF NOT EXISTS idx_products_category_id
  ON products (category_id);

CREATE INDEX IF NOT EXISTS idx_products_supplier_id
  ON products (supplier_id);

CREATE INDEX IF NOT EXISTS idx_products_variant_type_id
  ON products (variant_type_id);

-- Sort/filter by name and date
CREATE INDEX IF NOT EXISTS idx_products_name
  ON products (name);

CREATE INDEX IF NOT EXISTS idx_products_updated_at
  ON products (updated_at DESC);

-- ── product_variants table ────────────────────────────────────

-- Variant color searches (e.g. "Red", "Yellow")
CREATE INDEX IF NOT EXISTS idx_variants_color_trgm
  ON product_variants USING GIN (variant_color gin_trgm_ops);

-- Variant color temperature
CREATE INDEX IF NOT EXISTS idx_variants_color_temp_trgm
  ON product_variants USING GIN (color_temperature gin_trgm_ops);

-- FK join to parent product (used in every variant query)
CREATE INDEX IF NOT EXISTS idx_variants_product_id
  ON product_variants (product_id);

-- FK join to variant definition
CREATE INDEX IF NOT EXISTS idx_variants_variant_id
  ON product_variants (variant_id);
