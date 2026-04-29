BEGIN;
-- Set session variables to simulate Supabase auth
SET LOCAL role authenticated;
SET LOCAL "request.jwt.claims" TO '{"email": "staff@example.com", "sub": "88888888-8888-8888-8888-888888888888"}';

-- This should trigger RLS evaluation on admins
SELECT * FROM admins;

-- This should trigger WITH CHECK evaluation
UPDATE admins SET full_name = 'Modified' WHERE id = '88888888-8888-8888-8888-888888888888';

ROLLBACK;
