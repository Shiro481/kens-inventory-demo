-- Final Hardening for RLS policies to prevent recursion

-- 1. Update helper functions with SECURITY DEFINER and explicit search_path
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE id = user_id AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_email text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE email = user_email 
    AND role = 'super_admin' 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Update admins policy (already done, but re-applying for consistency)
DROP POLICY IF EXISTS "Super admins can manage admins" ON public.admins;
CREATE POLICY "Super admins can manage admins" 
ON public.admins FOR ALL 
TO authenticated 
USING ( public.is_super_admin(auth.jwt() ->> 'email') )
WITH CHECK ( public.is_super_admin(auth.jwt() ->> 'email') );

-- 3. Update other tables that reference admins directly in their policies
-- product_specifications
DROP POLICY IF EXISTS "Allow admin write access to product_specs" ON public.product_specifications;
CREATE POLICY "Allow admin write access to product_specs" 
ON public.product_specifications FOR ALL 
TO authenticated 
USING ( public.is_admin(auth.uid()) )
WITH CHECK ( public.is_admin(auth.uid()) );

-- variant_specifications
DROP POLICY IF EXISTS "Allow admin write access to variant_specs" ON public.variant_specifications;
CREATE POLICY "Allow admin write access to variant_specs" 
ON public.variant_specifications FOR ALL 
TO authenticated 
USING ( public.is_admin(auth.uid()) )
WITH CHECK ( public.is_admin(auth.uid()) );

-- sale_items
DROP POLICY IF EXISTS "Admins have full access to sale_items" ON public.sale_items;
CREATE POLICY "Admins have full access to sale_items" 
ON public.sale_items FOR ALL 
TO authenticated 
USING ( public.is_admin(auth.uid()) )
WITH CHECK ( public.is_admin(auth.uid()) );
