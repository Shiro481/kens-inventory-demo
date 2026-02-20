-- ============================================================
-- Phase 1 Security: Idempotent RLS Lockdown
-- Drops ALL known policy names across all prior migrations.
-- Creates authenticated-only writes; anon reads remain open.
-- ============================================================

-- ── 1. Drop ALL policies across all known prior migration names ───────────────
-- From 20260215123146_remote_schema.sql
DROP POLICY IF EXISTS "Public Read Products"                ON public.products;
DROP POLICY IF EXISTS "Public Write"                        ON public.products;
DROP POLICY IF EXISTS "Public Write Products"               ON public.products;
DROP POLICY IF EXISTS "Public Access"                       ON public.products;
DROP POLICY IF EXISTS "Public Read ProductVariants"         ON public.product_variants;
DROP POLICY IF EXISTS "Public Write ProductVariants"        ON public.product_variants;
DROP POLICY IF EXISTS "Public Access"                       ON public.product_variants;
DROP POLICY IF EXISTS "Public Access"                       ON public.suppliers;
DROP POLICY IF EXISTS "Public Access"                       ON public.product_categories;
DROP POLICY IF EXISTS "Public Access"                       ON public.variant_definitions;
DROP POLICY IF EXISTS "Public Read Variant Definitions"     ON public.variant_definitions;
DROP POLICY IF EXISTS "Public Access"                       ON public.variant_categories;
DROP POLICY IF EXISTS "Public Access"                       ON public.sales;
DROP POLICY IF EXISTS "Public Write Sales"                  ON public.sales;
DROP POLICY IF EXISTS "Public Access"                       ON public.store_settings;
DROP POLICY IF EXISTS "Public Write Settings"               ON public.store_settings;
DROP POLICY IF EXISTS "Allow anon read access"              ON public.admins;

-- From 20260219120000_secure_rls_policies.sql
DROP POLICY IF EXISTS "Garage staff can view products"      ON public.products;
DROP POLICY IF EXISTS "Admins can manage products"          ON public.products;
DROP POLICY IF EXISTS "Garage staff can view variants"      ON public.product_variants;
DROP POLICY IF EXISTS "Admins can manage variants"          ON public.product_variants;
DROP POLICY IF EXISTS "Garage staff can view categories"    ON public.product_categories;
DROP POLICY IF EXISTS "Admins can manage categories"        ON public.product_categories;
DROP POLICY IF EXISTS "Staff can view sales"                ON public.sales;
DROP POLICY IF EXISTS "Sales can be inserted by authenticated" ON public.sales;
DROP POLICY IF EXISTS "Garage staff can view settings"      ON public.store_settings;
DROP POLICY IF EXISTS "Admins can manage settings"          ON public.store_settings;
DROP POLICY IF EXISTS "Admins can view admin list"          ON public.admins;

-- From 20260219121500_relax_rls_for_dev.sql
DROP POLICY IF EXISTS "Allow anon write products"           ON public.products;
DROP POLICY IF EXISTS "Allow anon write variants"           ON public.product_variants;
DROP POLICY IF EXISTS "Allow anon write suppliers"          ON public.suppliers;
DROP POLICY IF EXISTS "Allow anon write categories"         ON public.product_categories;
DROP POLICY IF EXISTS "Allow anon write variant_defs"       ON public.variant_definitions;

-- From 20260219151000_dynamic_category_metadata.sql
DROP POLICY IF EXISTS "Public Access"                       ON public.category_metadata;

-- ── 2. PRODUCTS ───────────────────────────────────────────────
CREATE POLICY "Anon can read products"
  ON public.products FOR SELECT TO anon USING (true);

CREATE POLICY "Auth can manage products"
  ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 3. PRODUCT VARIANTS ───────────────────────────────────────
CREATE POLICY "Anon can read variants"
  ON public.product_variants FOR SELECT TO anon USING (true);

CREATE POLICY "Auth can manage variants"
  ON public.product_variants FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 4. PRODUCT CATEGORIES ─────────────────────────────────────
CREATE POLICY "Anon can read categories"
  ON public.product_categories FOR SELECT TO anon USING (true);

CREATE POLICY "Auth can manage categories"
  ON public.product_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 5. VARIANT DEFINITIONS ────────────────────────────────────
CREATE POLICY "Anon can read variant_definitions"
  ON public.variant_definitions FOR SELECT TO anon USING (true);

CREATE POLICY "Auth can manage variant_definitions"
  ON public.variant_definitions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 6. VARIANT CATEGORIES ─────────────────────────────────────
CREATE POLICY "Anon can read variant_categories"
  ON public.variant_categories FOR SELECT TO anon USING (true);

CREATE POLICY "Auth can manage variant_categories"
  ON public.variant_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 7. SUPPLIERS ──────────────────────────────────────────────
CREATE POLICY "Anon can read suppliers"
  ON public.suppliers FOR SELECT TO anon USING (true);

CREATE POLICY "Auth can manage suppliers"
  ON public.suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 8. SALES ──────────────────────────────────────────────────
CREATE POLICY "Auth can read sales"
  ON public.sales FOR SELECT TO authenticated USING (true);

CREATE POLICY "Auth can insert sales"
  ON public.sales FOR INSERT TO authenticated WITH CHECK (true);

-- ── 9. STORE SETTINGS ─────────────────────────────────────────
CREATE POLICY "Anon can read store_settings"
  ON public.store_settings FOR SELECT TO anon USING (true);

CREATE POLICY "Auth can manage store_settings"
  ON public.store_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 10. CATEGORY METADATA ─────────────────────────────────────
CREATE POLICY "Anon can read category_metadata"
  ON public.category_metadata FOR SELECT TO anon USING (true);

CREATE POLICY "Auth can manage category_metadata"
  ON public.category_metadata FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ── 11. LOCK DOWN process_sale RPC ────────────────────────────
REVOKE EXECUTE ON FUNCTION public.process_sale(jsonb, numeric, numeric, numeric, text, text, text, text)
  FROM anon;

GRANT EXECUTE ON FUNCTION public.process_sale(jsonb, numeric, numeric, numeric, text, text, text, text)
  TO authenticated, service_role;
