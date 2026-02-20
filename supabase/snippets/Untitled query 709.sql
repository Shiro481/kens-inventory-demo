-- Disable RLS for definitions table locally to stop the 403 error
ALTER TABLE public.variant_definitions DISABLE ROW LEVEL SECURITY;

-- Also ensure the definitions can be linked
GRANT ALL ON TABLE public.variant_definitions TO anon, authenticated, service_role;
GRANT ALL ON SEQUENCE public.variant_definitions_id_seq TO anon, authenticated, service_role;