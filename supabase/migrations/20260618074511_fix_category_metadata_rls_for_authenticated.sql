-- Fix RLS policy on category_metadata to allow authenticated non-admin users to SELECT
CREATE POLICY "Authenticated can read category_metadata" 
  ON category_metadata 
  FOR SELECT 
  TO authenticated 
  USING (true);
