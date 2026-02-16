-- Remove the auto-sync trigger that was causing parent products to go out of stock
-- when variants are deleted. Each variant should manage its own stock independently.

DROP TRIGGER IF EXISTS trigger_sync_product_stock ON product_bulb_variants;
DROP FUNCTION IF EXISTS sync_product_stock_from_variants();
