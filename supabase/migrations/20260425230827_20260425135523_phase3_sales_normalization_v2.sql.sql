-- Phase 3: Sales Normalization (Safe Version)
-- Extract line items from the sales JSON blob, filtering out orphaned product IDs.

CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id BIGINT NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    variant_id BIGINT REFERENCES public.product_variants(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC NOT NULL DEFAULT 0,
    total_price NUMERIC NOT NULL DEFAULT 0,
    discount NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Backfill data from sales.items JSONB array
-- Join with products to ensure referential integrity
INSERT INTO public.sale_items (sale_id, product_id, variant_id, quantity, unit_price, total_price, discount)
SELECT 
    s.id AS sale_id,
    (item->>'id')::BIGINT AS product_id,
    NULLIF(item->>'variant_id', 'null')::BIGINT AS variant_id,
    (item->>'quantity')::INTEGER AS quantity,
    COALESCE((item->>'price')::NUMERIC, (item->>'unit_price')::NUMERIC, 0) AS unit_price,
    COALESCE((item->>'total')::NUMERIC, (item->>'total_price')::NUMERIC, ((item->>'quantity')::INTEGER * COALESCE((item->>'price')::NUMERIC, 0))) AS total_price,
    COALESCE((item->>'discount')::NUMERIC, 0) AS discount
FROM 
    public.sales s,
    jsonb_array_elements(s.items) AS item
JOIN 
    public.products p ON p.id = (item->>'id')::BIGINT;

-- Enable RLS
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins have full access to sale_items"
ON public.sale_items FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM admins WHERE admins.id = auth.uid()));

-- Service role has full access
CREATE POLICY "Service role has full access to sale_items"
ON public.sale_items FOR ALL
TO service_role
USING (true);

-- Authenticated can read (assuming regular staff can read sales)
CREATE POLICY "Authenticated users can read sale_items"
ON public.sale_items FOR SELECT
TO authenticated
USING (true);
;
