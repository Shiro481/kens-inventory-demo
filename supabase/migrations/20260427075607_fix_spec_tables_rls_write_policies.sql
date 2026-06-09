
-- Fix variant_specifications write policy
DROP POLICY IF EXISTS "Allow admin write access to variant_specs" ON public.variant_specifications;

CREATE POLICY "Auth can manage variant_specs"
  ON public.variant_specifications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Fix product_specifications write policy (same issue, proactively fix it too)
DROP POLICY IF EXISTS "Allow admin write access to product_specs" ON public.product_specifications;

CREATE POLICY "Auth can manage product_specs"
  ON public.product_specifications
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
;
