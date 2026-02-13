-- Check the actual structure of bulb_types table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bulb_types' 
ORDER BY ordinal_position;

-- Show current bulb types data
SELECT * FROM bulb_types LIMIT 10;
