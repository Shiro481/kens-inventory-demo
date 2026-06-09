
-- 1. Drop the recursive policy
DROP POLICY IF EXISTS "Super admins can manage admins" ON public.admins;

-- 2. Create a SECURITY DEFINER helper function that bypasses RLS when checking roles.
--    This breaks the recursion by running as the function owner (postgres), not the caller.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins
    WHERE email = (SELECT auth.jwt() ->> 'email')
      AND role = 'super_admin'
      AND is_active = true
  );
$$;

-- 3. Re-create the policy using the safe helper function
CREATE POLICY "Super admins can manage admins"
  ON public.admins
  FOR ALL
  TO public
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
;
