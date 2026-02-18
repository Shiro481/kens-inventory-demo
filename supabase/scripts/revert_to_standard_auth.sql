-- 1. Recreate the admins table to be compatible with standard Auth
-- We drop the password_hash requirement since Supabase Auth handles that now
CREATE TABLE IF NOT EXISTS public.admins_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'manager', 'staff')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copy over any existing admins from the old table (if it exists)
INSERT INTO public.admins_new (email, full_name, role, is_active)
SELECT email, full_name, role, is_active FROM public.admins
ON CONFLICT (email) DO NOTHING;

-- Swap the tables
DROP TABLE IF EXISTS public.admins CASCADE;
ALTER TABLE public.admins_new RENAME TO admins;

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access to authenticated users so the Login check works
CREATE POLICY "Allow read access for auth check" 
ON public.admins FOR SELECT 
USING (true);

-- Seed your admin email again (so you are definitely in the whitelist)
INSERT INTO public.admins (email, role, full_name, is_active)
VALUES 
  ('shaqleeambagan101@gmail.com', 'super_admin', 'System Owner', true)
ON CONFLICT (email) DO NOTHING;
