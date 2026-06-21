INSERT INTO admins (id, email, password_hash, full_name, role, is_active) 
VALUES ('40cc3ce4-71a5-4df6-8a4d-2fca4514a104', 'user@sample.com', 'dummy_hash', 'User Sample', 'admin', true)
ON CONFLICT (id) DO NOTHING;
