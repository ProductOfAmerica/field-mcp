-- Create a function to safely access encryption keys from the vault
-- This is needed because Edge Functions can't directly query the vault schema via PostgREST

CREATE OR REPLACE FUNCTION public.get_encryption_key(key_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_secret TEXT;
BEGIN
  -- Only allow specific key names for security
  IF key_name NOT LIKE 'token_encryption_key_%' THEN
    RAISE EXCEPTION 'Invalid key name: only token_encryption_key_* keys are allowed';
  END IF;

  SELECT decrypted_secret INTO v_secret
  FROM vault.decrypted_secrets
  WHERE name = key_name;

  IF v_secret IS NULL THEN
    RAISE EXCEPTION 'Encryption key not found: %', key_name;
  END IF;

  RETURN v_secret;
END;
$$;

-- Only service role can call this function
REVOKE ALL ON FUNCTION public.get_encryption_key(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_encryption_key(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.get_encryption_key(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_encryption_key(TEXT) TO service_role;

COMMENT ON FUNCTION public.get_encryption_key(TEXT) IS
'Securely retrieves an encryption key from the vault. Only accessible by service_role.';
