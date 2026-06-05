-- ============================================================
-- Internal System Hardening
-- Purpose: Tighten write access so only verified admin-table
--          users can mutate data. Anon retains read-only access
--          for the initial load / POS product display.
--
-- Uses the existing is_garage_admin() SECURITY DEFINER function
-- (created in 20260219120000_secure_rls_policies.sql) so there
-- is zero risk of RLS infinite recursion.
-- ============================================================

-- ── 1. Drop the current "any authenticated user can write" policies ───────────
DROP POLICY IF EXISTS "Auth can manage products"          ON public.products;
DROP POLICY IF EXISTS "Auth can manage variants"          ON public.product_variants;
DROP POLICY IF EXISTS "Auth can manage categories"        ON public.product_categories;
DROP POLICY IF EXISTS "Auth can manage suppliers"         ON public.suppliers;
DROP POLICY IF EXISTS "Auth can manage store_settings"    ON public.store_settings;
DROP POLICY IF EXISTS "Auth can manage category_metadata" ON public.category_metadata;
DROP POLICY IF EXISTS "Auth can manage variant_definitions" ON public.variant_definitions;
DROP POLICY IF EXISTS "Auth can manage variant_categories"  ON public.variant_categories;

-- Also drop the earlier phase that had same-broad pattern
DROP POLICY IF EXISTS "Admins can manage products"        ON public.products;
DROP POLICY IF EXISTS "Admins can manage variants"        ON public.product_variants;
DROP POLICY IF EXISTS "Admins can manage categories"      ON public.product_categories;
DROP POLICY IF EXISTS "Admins can manage settings"        ON public.store_settings;

-- ── 2. Re-create write policies locked to admin-table members only ────────────

-- PRODUCTS
CREATE POLICY "Admin write products"
  ON public.products FOR ALL TO authenticated
  USING (public.is_garage_admin())
  WITH CHECK (public.is_garage_admin());

-- PRODUCT VARIANTS
CREATE POLICY "Admin write variants"
  ON public.product_variants FOR ALL TO authenticated
  USING (public.is_garage_admin())
  WITH CHECK (public.is_garage_admin());

-- PRODUCT CATEGORIES
CREATE POLICY "Admin write categories"
  ON public.product_categories FOR ALL TO authenticated
  USING (public.is_garage_admin())
  WITH CHECK (public.is_garage_admin());

-- SUPPLIERS
CREATE POLICY "Admin write suppliers"
  ON public.suppliers FOR ALL TO authenticated
  USING (public.is_garage_admin())
  WITH CHECK (public.is_garage_admin());

-- STORE SETTINGS
CREATE POLICY "Admin write store_settings"
  ON public.store_settings FOR ALL TO authenticated
  USING (public.is_garage_admin())
  WITH CHECK (public.is_garage_admin());

-- CATEGORY METADATA
CREATE POLICY "Admin write category_metadata"
  ON public.category_metadata FOR ALL TO authenticated
  USING (public.is_garage_admin())
  WITH CHECK (public.is_garage_admin());

-- VARIANT DEFINITIONS
CREATE POLICY "Admin write variant_definitions"
  ON public.variant_definitions FOR ALL TO authenticated
  USING (public.is_garage_admin())
  WITH CHECK (public.is_garage_admin());

-- VARIANT CATEGORIES
CREATE POLICY "Admin write variant_categories"
  ON public.variant_categories FOR ALL TO authenticated
  USING (public.is_garage_admin())
  WITH CHECK (public.is_garage_admin());

-- ── 3. SALES: Keep broad insert (staff can sell), restrict deletes ────────────
-- Sales inserts are handled via the process_sale() RPC which is already
-- restricted to authenticated + service_role (see phase1_secure_rls).
-- No change needed for sales — existing policies are correct.

-- ── 4. BRANDS: Add write protection (table added post-phase1) ────────────────
ALTER TABLE IF EXISTS public.brands ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public Access" ON public.brands;
DROP POLICY IF EXISTS "Auth can manage brands" ON public.brands;

CREATE POLICY "Anon can read brands"
  ON public.brands FOR SELECT TO anon USING (true);
CREATE POLICY "Admin write brands"
  ON public.brands FOR ALL TO authenticated
  USING (public.is_garage_admin())
  WITH CHECK (public.is_garage_admin());
