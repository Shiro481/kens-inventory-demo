-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create the admins table with a hashed password column
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL, -- Storing HASHED password, never plain text
  full_name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'manager', 'staff')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow super_admins to view/edit this table
-- Regular users (even other admins) should NOT see password hashes
CREATE POLICY "Super admins can manage admins" 
ON public.admins FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admins a
    WHERE a.email = (select auth.jwt() ->> 'email') 
    AND a.role = 'super_admin'
  )
);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON public.admins 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SEED DATA: Insert your main admin account
-- We use crypt() to securely hash the password 'admin123'
INSERT INTO public.admins (email, password_hash, role, full_name, is_active)
VALUES 
  (
    'shaqleeambagan101@gmail.com', 
    crypt('@Shaq481', gen_salt('bf')), -- This creates a secure bcrypt hash
    'super_admin', 
    'System Owner', 
    true
  )
ON CONFLICT (email) DO NOTHING;
