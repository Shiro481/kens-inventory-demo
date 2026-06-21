-- is_garage_admin() checks `WHERE email = auth.jwt() ->> 'email'`.
-- If the calling user's email is not in the admins table the RPC returns
-- "Permission denied: admin access required".  This migration upserts the
-- system-owner row so that save_product_with_variants (and all RLS policies
-- that call is_garage_admin) work for the primary account.

INSERT INTO public.admins (id, email, password_hash, full_name, role, is_active)
VALUES (
  -- Use the real Supabase Auth UUID when the user already exists in auth.users;
  -- fall back to the seed UUID otherwise.
  COALESCE(
    (SELECT id FROM auth.users WHERE email = 'shaqleeambagan101@gmail.com' LIMIT 1),
    '377c371a-8174-43a4-888c-3db452e19c0d'::uuid
  ),
  'shaqleeambagan101@gmail.com',
  'supabase-auth-managed',
  'System Owner',
  'super_admin',
  true
)
ON CONFLICT (email) DO UPDATE SET
  role      = 'super_admin',
  is_active = true;
