-- Create functions to check permissions without recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM admins
        WHERE id = user_id AND is_active = true
    );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_super_admin(user_email text)
RETURNS boolean AS $$
    SELECT EXISTS (
        SELECT 1 FROM admins
        WHERE email = user_email AND role = 'super_admin' AND is_active = true
    );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Revoke execute from public/anon to keep it safe
REVOKE ALL ON FUNCTION public.is_admin(uuid) FROM public;
REVOKE ALL ON FUNCTION public.is_super_admin(text) FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_super_admin(text) TO authenticated, service_role;

-- Update admins policies
DROP POLICY IF EXISTS "Super admins can manage admins" ON admins;
CREATE POLICY "Super admins can manage admins" ON admins
    FOR ALL TO authenticated
    USING (public.is_super_admin(auth.jwt() ->> 'email'))
    WITH CHECK (public.is_super_admin(auth.jwt() ->> 'email'));

-- Update brands write policy
DROP POLICY IF EXISTS "Allow admin write access to brands" ON brands;
CREATE POLICY "Allow admin write access to brands" ON brands
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- Also add an anon read policy for brands just in case
DROP POLICY IF EXISTS "Allow anon read access to brands" ON brands;
CREATE POLICY "Allow anon read access to brands" ON brands
    FOR SELECT TO anon, authenticated
    USING (true);

-- Update products write policy to use the new function too
DROP POLICY IF EXISTS "Auth can manage products" ON products;
CREATE POLICY "Auth can manage products" ON products
    FOR ALL TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));
