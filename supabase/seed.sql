
-- 1. Insert Categories
INSERT INTO public.product_categories (name, description) VALUES
('Headlight', 'Main front lighting'),
('Fog Light', 'Auxiliary fog lights'),
('Signal Light', 'Turn signals'),
('Interior Light', 'Cabin lighting'),
('Brake Light', 'Rear brake lights'),
('Wiper', 'Windshield wipers'),
('Horn', 'Automotive horns'),
('Work Light', 'Off-road work lights')
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Core Bulb Types (For reference)
INSERT INTO public.variant_categories (code, description) VALUES
('H1', 'Single filament'),
('H3', 'Fog light type'),
('H4', 'Dual filament Hi/Lo'),
('H7', 'Single filament'),
('H8', 'Fog light type'),
('H9', 'High beam type'),
('H11', 'Single filament'),
('H16', 'Low wattage fog'),
('9005', 'HB3 High beam'),
('9006', 'HB4 Low beam'),
('9012', 'HIR2'),
('880', 'Fog light'),
('881', 'Fog light'),
('D1S', 'HID Xenon'),
('D2S', 'HID Xenon'),
('D3S', 'HID Xenon'),
('D4S', 'HID Xenon'),
('T10', 'W5W Wedge'),
('T15', 'W16W Wedge'),
('T20', '7440/7443 Wedge'),
('T25', '3156/3157 Wedge'),
('1156', 'BA15S Bayonet'),
('1157', 'BAY15D Bayonet')
ON CONFLICT (code) DO NOTHING;

-- 3. Insert Smart Bulb Variants ( The "Menu" Options )
-- These act as the "Variant Types" you select when creating products
INSERT INTO public.variant_definitions (base_name, variant_name, compatibility_list, display_name, description) VALUES
-- Headlights
('LED Headlight Kit', 'H4/H7/9005/9006', ARRAY['H4', 'H7', '9005', '9006'], 'Universal Kit (H4/H7/9005/9006)', 'Fits multiple sockets with adapters'),
('LED Headlight Kit', 'H4/Hb2/9003', ARRAY['H4', 'Hb2', '9003'], 'Hi/Lo Beam (H4)', 'Standard high/low beam'),
('LED Headlight Kit', 'H7', ARRAY['H7'], 'Low Beam (H7)', 'Standard low beam'),
('LED Headlight Kit', 'H11/H8/H9', ARRAY['H11', 'H8', 'H9'], 'Single Beam (H11)', 'Standard single beam'),
('LED Headlight Kit', '9005/HB3', ARRAY['9005', 'HB3'], 'High Beam (9005)', 'Standard high beam'),
('LED Headlight Kit', '9006/HB4', ARRAY['9006', 'HB4'], 'Low Beam (9006)', 'Standard low beam'),
('LED Headlight Kit', '9012/HIR2', ARRAY['9012', 'HIR2'], 'Single Beam (9012)', 'Accessory light'),

-- Fogs
('LED Fog Light', 'H11/H8/H16', ARRAY['H11', 'H8', 'H16'], 'Fog Universal (H11/H8/H16)', 'Universal fog light fitment'),
('LED Fog Light', '880/881', ARRAY['880', '881'], 'Fog (880/881)', 'Small fog light'),

-- Signals / Brake
('LED Signal', '1156/BA15S', ARRAY['1156', 'BA15S'], 'Single Contact (1156)', 'Turn signal / Reverse'),
('LED Signal', '7440/T20', ARRAY['7440', 'T20'], 'Wedge Base (7440)', 'Turn signal'),
('LED Brake', '1157/BAY15D', ARRAY['1157', 'BAY15D'], 'Double Contact (1157)', 'Brake/Tail light'),
('LED Brake', '7443/T20', ARRAY['7443', 'T20'], 'Wedge Double (7443)', 'Brake/Tail light'),

-- Interior
('Interior LED', 'T10/194/168', ARRAY['T10', '194', '168'], 'Wedge T10 (Universal)', 'Parking/Interior/Plate'),
('Interior LED', 'Festoon 31mm', ARRAY['31mm'], 'Festoon 31mm', 'Dome light'),
('Interior LED', 'Festoon 36mm', ARRAY['36mm'], 'Festoon 36mm', 'Dome light')
ON CONFLICT DO NOTHING;

-- 4. Insert Default Store Settings
INSERT INTO public.store_settings (id, store_name, currency, tax_rate, low_stock_threshold)
VALUES (1, 'Ken''s Auto Parts', 'PHP', 0.12, 5)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Super Admin User
-- Email: shaqleeambagan101@gmail.com
-- Password: admin123
INSERT INTO public.admins (email, password_hash, role, full_name, is_active)
VALUES 
  (
    'shaqleeambagan101@gmail.com', 
    extensions.crypt('admin123', extensions.gen_salt('bf')), 
    'super_admin', 
    'System Owner', 
    true
  )
ON CONFLICT (email) DO NOTHING;
