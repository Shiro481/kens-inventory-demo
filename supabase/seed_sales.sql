-- Seed dummy sales data for the last 7 days
DO $$
DECLARE
    v_product_id BIGINT;
    v_sale_id UUID;
    v_date TIMESTAMP;
    v_qty INT;
    v_price NUMERIC;
    v_total NUMERIC;
BEGIN
    -- Product 44: Grid
    -- Product 45: Six
    
    FOR i IN 0..6 LOOP
        v_date := CURRENT_TIMESTAMP - (i || ' days')::interval;
        v_qty := (RANDOM() * 5 + 1)::INT;
        
        -- Sale 1
        INSERT INTO sales (created_at, total, subtotal, tax, payment_method, items)
        VALUES (v_date, 17500 * v_qty, 17500 * v_qty, 0, 'Cash', 
                jsonb_build_array(jsonb_build_object('id', 44, 'name', 'Grid', 'price', 17500, 'quantity', v_qty, 'total', 17500 * v_qty)))
        RETURNING id INTO v_sale_id;
        
        INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price)
        VALUES (v_sale_id, 44, v_qty, 17500, 17500 * v_qty);
        
        -- Sale 2
        v_qty := (RANDOM() * 3 + 1)::INT;
        INSERT INTO sales (created_at, total, subtotal, tax, payment_method, items)
        VALUES (v_date - interval '2 hours', 18750 * v_qty, 18750 * v_qty, 0, 'Card', 
                jsonb_build_array(jsonb_build_object('id', 45, 'name', 'Six', 'price', 18750, 'quantity', v_qty, 'total', 18750 * v_qty)))
        RETURNING id INTO v_sale_id;
        
        INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price)
        VALUES (v_sale_id, 45, v_qty, 18750, 18750 * v_qty);
    END LOOP;
END $$;
