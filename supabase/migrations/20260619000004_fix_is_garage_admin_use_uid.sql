-- Fix: is_garage_admin() was checking auth.jwt() ->> 'email' but Supabase can
-- suppress the email claim from JWTs ("Protect email in JWT" project setting),
-- making it always return null. auth.uid() reads from the 'sub' claim which is
-- always present in Supabase Auth JWTs.
-- All admin IDs are confirmed to match auth.users IDs, so this is safe.

CREATE OR REPLACE FUNCTION public.is_garage_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admins
    WHERE id = auth.uid()
    AND is_active = true
  );
END;
$$;
