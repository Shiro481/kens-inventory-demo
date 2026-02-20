-- Relax RLS for local development to ensure saving works
-- This allows anon users to write until they implement proper auth login.
BEGIN;

DROP POLICY IF EXISTS "Public Write Products" ON public.products;
DROP POLICY IF EXISTS "Public Write Variants" ON public.product_variants;
DROP POLICY IF EXISTS "Public Access" ON public.variant_definitions;

CREATE POLICY "Allow anon write products" ON public.products FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon write variants" ON public.product_variants FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon write suppliers" ON public.suppliers FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon write categories" ON public.product_categories FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon write variant_defs" ON public.variant_definitions FOR ALL TO anon USING (true) WITH CHECK (true);

COMMIT;
