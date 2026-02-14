-- Update cost and selling prices for all GPNE R6 variants
-- Based on the product base price (6000 Sell, 4500 Cost)
UPDATE product_bulb_variants 
SET 
    selling_price = 6000.00,
    cost_price = 4500.00
WHERE variant_sku LIKE 'GPNE-R6-%';
