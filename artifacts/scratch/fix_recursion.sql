-- Fix for infinite recursion in admins policy
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

DROP POLICY IF EXISTS "Super admins can manage admins" ON public.admins;

CREATE POLICY "Super admins can manage admins" 
ON public.admins FOR ALL 
TO authenticated 
USING ( public.is_super_admin(auth.jwt() ->> 'email') )
WITH CHECK ( public.is_super_admin(auth.jwt() ->> 'email') );
