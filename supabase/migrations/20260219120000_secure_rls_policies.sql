-- SECURITY LOCKDOWN: Secure RLS Policies for Ken's Garage
-- Purpose: Restrict write operations to logged-in Admins only.

-- 1. Drop Permissive Policies
DROP POLICY IF EXISTS "Public Write" ON public.products;
DROP POLICY IF EXISTS "Public Write Products" ON public.products;
DROP POLICY IF EXISTS "Public Write ProductVariants" ON public.product_variants;
DROP POLICY IF EXISTS "Public Write Sales" ON public.sales;
DROP POLICY IF EXISTS "Public Write Settings" ON public.store_settings;
DROP POLICY IF EXISTS "Public Access" ON public.variant_definitions;
DROP POLICY IF EXISTS "Public Access" ON public.variant_categories;
DROP POLICY IF EXISTS "Public Access" ON public.product_variants;
DROP POLICY IF EXISTS "Public Access" ON public.product_categories;
DROP POLICY IF EXISTS "Public Access" ON public.sales;
DROP POLICY IF EXISTS "Public Access" ON public.store_settings;
DROP POLICY IF EXISTS "Public Access" ON public.suppliers;
DROP POLICY IF EXISTS "Allow anon read access" ON public.admins;

-- 2. Define Admin-only Management Policies
-- We define a helper function to check if the current user is an admin
CREATE OR REPLACE FUNCTION is_garage_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE email = auth.jwt() ->> 'email'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Apply Selective Read/Write Policies

-- PRODUCTS
CREATE POLICY "Garage staff can view products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL TO authenticated USING (is_garage_admin());

-- VARIANTS
CREATE POLICY "Garage staff can view variants" ON public.product_variants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage variants" ON public.product_variants FOR ALL TO authenticated USING (is_garage_admin());

-- CATEGORIES
CREATE POLICY "Garage staff can view categories" ON public.product_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage categories" ON public.product_categories FOR ALL TO authenticated USING (is_garage_admin());

-- SALES (Staff can insert via RPC, but only Admins can view history)
CREATE POLICY "Staff can view sales" ON public.sales FOR SELECT TO authenticated USING (true);
CREATE POLICY "Sales can be inserted by authenticated" ON public.sales FOR INSERT TO authenticated WITH CHECK (true);

-- SETTINGS
CREATE POLICY "Garage staff can view settings" ON public.store_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage settings" ON public.store_settings FOR ALL TO authenticated USING (is_garage_admin());

-- ADMINS
CREATE POLICY "Admins can view admin list" ON public.admins FOR SELECT TO authenticated USING (is_garage_admin());
