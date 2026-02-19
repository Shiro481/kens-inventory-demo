-- RPC function to process sales atomically
CREATE OR REPLACE FUNCTION process_sale(
  p_items jsonb,
  p_subtotal numeric,
  p_tax numeric,
  p_total numeric,
  p_payment_method text DEFAULT 'Cash',
  p_customer_name text DEFAULT NULL,
  p_customer_email text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sale_id uuid;
  v_item jsonb;
  v_current_stock int;
  v_id bigint;
  v_variant_id bigint;
  v_qty int;
BEGIN
  -- 1. Loop through items to validate and deduct stock
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::int;
    
    IF v_item->>'variant_id' IS NOT NULL AND v_item->>'variant_id' != 'null' THEN
      v_variant_id := (v_item->>'variant_id')::bigint;
      
      -- Lock row for update to prevent race conditions
      SELECT stock_quantity INTO v_current_stock
      FROM product_variants
      WHERE id = v_variant_id
      FOR UPDATE;
      
      IF v_current_stock < v_qty THEN
        RAISE EXCEPTION 'Insufficient stock for % (Current: %, Needed: %)', v_item->>'name', v_current_stock, v_qty;
      END IF;
      
      UPDATE product_variants
      SET stock_quantity = stock_quantity - v_qty
      WHERE id = v_variant_id;
      
    ELSE
      v_id := (v_item->>'id')::bigint;
      
      SELECT stock_quantity INTO v_current_stock
      FROM products
      WHERE id = v_id
      FOR UPDATE;
      
      IF v_current_stock < v_qty THEN
        RAISE EXCEPTION 'Insufficient stock for % (Current: %, Needed: %)', v_item->>'name', v_current_stock, v_qty;
      END IF;
      
      UPDATE products
      SET stock_quantity = stock_quantity - v_qty
      WHERE id = v_id;
    END IF;
  END LOOP;

  -- 2. Insert the sale record
  INSERT INTO sales (
    items, subtotal, tax, total, payment_method, customer_name, customer_email, notes
  )
  VALUES (
    p_items, p_subtotal, p_tax, p_total, p_payment_method, p_customer_name, p_customer_email, p_notes
  )
  RETURNING id INTO v_sale_id;

  RETURN v_sale_id;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION process_sale TO anon;
GRANT EXECUTE ON FUNCTION process_sale TO authenticated;
GRANT EXECUTE ON FUNCTION process_sale TO service_role;
