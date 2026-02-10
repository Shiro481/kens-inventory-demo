
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create the User + Admin Entry automatically
DO $$
DECLARE
  new_email TEXT := 'brian@kensgarage.com'; -- 👈 CHANGE THIS
  new_password TEXT := 'admin123';          -- 👈 CHANGE THIS
  new_user_id UUID;
BEGIN
  -- Create the Auth User
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    new_email,
    crypt(new_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- Add to Admins Table
  INSERT INTO "Admins" (id, email, role)
  VALUES (new_user_id, new_email, 'owner');

  RAISE NOTICE 'User % created successfully!', new_email;
END $$;