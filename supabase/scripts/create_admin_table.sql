-- Create the admins table
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id), -- Populated when the user signs up/logs in
  full_name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'manager', 'staff')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 1. Policy: Allow users to read their own admin status (needed for login checks)
CREATE POLICY "Users can see their own admin status" 
ON public.admins FOR SELECT 
USING ( (select auth.jwt() ->> 'email') = email );

-- 2. Policy: Super admins can view/manage all admins
CREATE POLICY "Super admins can manage all" 
ON public.admins FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE email = (select auth.jwt() ->> 'email') 
    AND role = 'super_admin'
  )
);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON public.admins 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SEED DATA: Insert your main admin account automatically
-- Replace this email with your actual login email to gain immediate access
INSERT INTO public.admins (email, role, full_name, is_active)
VALUES 
  ('deviy63349@helesco.com', 'super_admin', 'System Owner', true)
ON CONFLICT (email) DO NOTHING;
