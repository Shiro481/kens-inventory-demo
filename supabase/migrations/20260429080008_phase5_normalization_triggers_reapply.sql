-- Phase 5: Automatic Normalization Triggers & Stock Management
-- This migration ensures that the new normalized tables (brands, specifications) 
-- stay in sync with the legacy columns during the transition period.

-- 1. Trigger Function for Product Normalization
CREATE OR REPLACE FUNCTION sync_product_to_normalized()
RETURNS TRIGGER AS $$
DECLARE
    v_brand_id INT;
BEGIN
    -- Sync Brand
    IF NEW.brand IS NOT NULL AND (OLD.brand IS NULL OR NEW.brand <> OLD.brand) THEN
        INSERT INTO brands (name)
        VALUES (TRIM(NEW.brand))
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name -- Just to get the ID
        RETURNING id INTO v_brand_id;
        
        NEW.brand_id := v_brand_id;
    END IF;

    -- Sync EAV Specifications (Product Level)
    -- We only sync if any of the legacy columns changed
    IF (TG_OP = 'INSERT') OR 
       (NEW.voltage IS DISTINCT FROM OLD.voltage) OR
       (NEW.wattage IS DISTINCT FROM OLD.wattage) OR
       (NEW.color_temperature IS DISTINCT FROM OLD.color_temperature) OR
       (NEW.lumens IS DISTINCT FROM OLD.lumens) OR
       (NEW.beam_type IS DISTINCT FROM OLD.beam_type) 
    THEN
        -- Upsert Voltage
        IF NEW.voltage IS NOT NULL THEN
            INSERT INTO product_specifications (product_id, spec_key, spec_value)
            VALUES (NEW.id, 'voltage', NEW.voltage::text)
            ON CONFLICT (product_id, spec_key) DO UPDATE SET spec_value = EXCLUDED.spec_value;
        END IF;

        -- Upsert Wattage
        IF NEW.wattage IS NOT NULL THEN
            INSERT INTO product_specifications (product_id, spec_key, spec_value)
            VALUES (NEW.id, 'wattage', NEW.wattage::text)
            ON CONFLICT (product_id, spec_key) DO UPDATE SET spec_value = EXCLUDED.spec_value;
        END IF;

        -- Upsert Color Temperature
        IF NEW.color_temperature IS NOT NULL THEN
            INSERT INTO product_specifications (product_id, spec_key, spec_value)
            VALUES (NEW.id, 'color_temperature', NEW.color_temperature::text)
            ON CONFLICT (product_id, spec_key) DO UPDATE SET spec_value = EXCLUDED.spec_value;
        END IF;

        -- Upsert Lumens
        IF NEW.lumens IS NOT NULL THEN
            INSERT INTO product_specifications (product_id, spec_key, spec_value)
            VALUES (NEW.id, 'lumens', NEW.lumens::text)
            ON CONFLICT (product_id, spec_key) DO UPDATE SET spec_value = EXCLUDED.spec_value;
        END IF;

        -- Upsert Beam Type
        IF NEW.beam_type IS NOT NULL THEN
            INSERT INTO product_specifications (product_id, spec_key, spec_value)
            VALUES (NEW.id, 'beam_type', NEW.beam_type)
            ON CONFLICT (product_id, spec_key) DO UPDATE SET spec_value = EXCLUDED.spec_value;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger Function for Variant Normalization
CREATE OR REPLACE FUNCTION sync_variant_to_normalized()
RETURNS TRIGGER AS $$
BEGIN
    -- Sync EAV Specifications (Variant Level)
    -- Variant only has color_temperature as a specific field
    IF (TG_OP = 'INSERT') OR 
       (NEW.color_temperature IS DISTINCT FROM OLD.color_temperature)
    THEN
        -- Upsert Color Temp
        IF NEW.color_temperature IS NOT NULL THEN
            INSERT INTO variant_specifications (variant_id, spec_key, spec_value)
            VALUES (NEW.id, 'color_temperature', NEW.color_temperature::text)
            ON CONFLICT (variant_id, spec_key) DO UPDATE SET spec_value = EXCLUDED.spec_value;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Create Triggers
DROP TRIGGER IF EXISTS trigger_sync_product_normalization ON products;
CREATE TRIGGER trigger_sync_product_normalization
BEFORE INSERT OR UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION sync_product_to_normalized();

DROP TRIGGER IF EXISTS trigger_sync_variant_normalization ON product_variants;
CREATE TRIGGER trigger_sync_variant_normalization
BEFORE INSERT OR UPDATE ON product_variants
FOR EACH ROW EXECUTE FUNCTION sync_variant_to_normalized();

-- 4. Stock Management Trigger (The \"Derived Cache\" Logic)
-- This trigger will automatically adjust products.stock_quantity when a sale_item is created.
CREATE OR REPLACE FUNCTION update_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- Update product stock if it's a base product sale
    IF NEW.variant_id IS NULL THEN
        UPDATE products 
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.product_id;
    ELSE
        -- Update variant stock
        UPDATE product_variants
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.product_id; -- Fix: variant_id doesn't match ID directly sometimes in older versions, but here it's the FK
        
        -- Correct logic: update product_variants SET stock_quantity = ... WHERE id = NEW.variant_id
        UPDATE product_variants
        SET stock_quantity = stock_quantity - NEW.quantity
        WHERE id = NEW.variant_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stock_on_sale ON sale_items;
CREATE TRIGGER trigger_update_stock_on_sale
AFTER INSERT ON sale_items
FOR EACH ROW EXECUTE FUNCTION update_stock_on_sale();

-- 5. Redefine process_sale to remove manual stock updates (delegated to trigger)
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
  -- Insert the sale record
  INSERT INTO sales (
    items, subtotal, tax, total, payment_method, customer_name, customer_email, notes, staff_uuid
  )
  VALUES (
    p_items, p_subtotal, p_tax, p_total, p_payment_method, p_customer_name, p_customer_email, p_notes, auth.uid()
  )
  RETURNING id INTO v_sale_id;

  -- Loop through items to validate and insert into sale_items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::int;
    v_id := (v_item->>'id')::bigint;
    v_variant_id := NULLIF(v_item->>'variant_id', 'null')::bigint;
    
    -- Stock Validation Logic
    IF v_variant_id IS NOT NULL THEN
      SELECT stock_quantity INTO v_current_stock
      FROM product_variants
      WHERE id = v_variant_id
      FOR SHARE;
      
      IF v_current_stock < v_qty THEN
        RAISE EXCEPTION 'Insufficient stock for % (Current: %, Needed: %)', v_item->>'name', v_current_stock, v_qty;
      END IF;
    ELSE
      SELECT stock_quantity INTO v_current_stock
      FROM products
      WHERE id = v_id
      FOR SHARE;
      
      IF v_current_stock < v_qty THEN
        RAISE EXCEPTION 'Insufficient stock for % (Current: %, Needed: %)', v_item->>'name', v_current_stock, v_qty;
      END IF;
    END IF;

    -- Insert into normalized sale_items table
    INSERT INTO public.sale_items (
      sale_id, 
      product_id, 
      variant_id, 
      quantity, 
      unit_price, 
      total_price, 
      discount
    )
    VALUES (
      v_sale_id,
      v_id,
      v_variant_id,
      v_qty,
      COALESCE((v_item->>'price')::numeric, 0),
      COALESCE((v_item->>'total')::numeric, (v_qty * COALESCE((v_item->>'price')::numeric, 0))),
      COALESCE((v_item->>'discount')::numeric, 0)
    );
  END LOOP;

  RETURN v_sale_id;
END;
$$;
;
