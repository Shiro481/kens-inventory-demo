-- EXPOSE pgcrypto functions to the API so we can call them in RPC if needed
-- (Though querying directly with a filter is often cleaner)

-- Function to verify admin credentials securely
CREATE OR REPLACE FUNCTION verify_admin_password(
    input_email TEXT,
    input_password TEXT
)
RETURNS JSONB AS $$
DECLARE
    admin_record RECORD;
BEGIN
    -- Look up the admin by email
    SELECT id, email, role, full_name, password_hash
    INTO admin_record
    FROM public.admins
    WHERE email = input_email
    AND is_active = true;

    -- If no record found, return null (invalid email)
    IF admin_record IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Invalid email or password');
    END IF;

    -- Verify the password using pgcrypto's crypt() function
    IF admin_record.password_hash = crypt(input_password, admin_record.password_hash) THEN
        -- Password is correct! Return user info (BUT NOT THE HASH)
        RETURN jsonb_build_object(
            'success', true,
            'user', jsonb_build_object(
                'id', admin_record.id,
                'email', admin_record.email,
                'role', admin_record.role,
                'full_name', admin_record.full_name
            )
        );
    ELSE
        -- Password incorrect
        RETURN jsonb_build_object('success', false, 'message', 'Invalid email or password');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to everyone (since it handles its own security)
-- In a real meaningful auth system, you might restrict this, 
-- but since this TABLE-BASED auth bypasses Supabase Auth,
-- we need it effectively "public" to be called during login.
GRANT EXECUTE ON FUNCTION verify_admin_password(text, text) TO anon, authenticated, service_role;
