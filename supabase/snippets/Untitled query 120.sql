-- Check categories
SELECT * FROM product_categories WHERE name IN ('Headlight', 'Fog Light', 'Brake Light', 'Signal Light', 'Interior Light', 'Parking Light', 'LED Light Bar');

-- Check bulb types  
SELECT * FROM bulb_types WHERE code IN ('H4', 'H7', 'H11', '9005', '7507', 'W5W', 'D2S', 'H4_LED', 'H7_LED', 'H11_LED', '9006', '1157');
