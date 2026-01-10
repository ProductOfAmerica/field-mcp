-- Add PL/pgSQL functions for automated encryption key rotation
-- Tokens migrate naturally when OAuth refresh runs (no batch re-encryption needed)

-- 1. rotate_encryption_key()
--    Generate new key using pgcrypto, store in Vault, bump version
CREATE OR REPLACE FUNCTION public.rotate_encryption_key() RETURNS SMALLINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, extensions, vault, public
AS $$
DECLARE
  v_current SMALLINT;
  v_new_version SMALLINT;
  v_key BYTEA;
BEGIN
  -- Lock config row to prevent concurrent rotations
  SELECT current_version INTO v_current
  FROM public.encryption_key_config WHERE id = 1 FOR UPDATE;

  v_new_version := v_current + 1;

  -- Generate 32 random bytes using pgcrypto CSPRNG
  v_key := gen_random_bytes(32);

  -- Store in Vault (base64 encoded for consistency with Edge Functions)
  PERFORM vault.create_secret(
    encode(v_key, 'base64'),
    'token_encryption_key_v' || v_new_version
  );

  -- Bump version and update timestamps
  UPDATE public.encryption_key_config SET
    current_version = v_new_version,
    last_rotation_at = NOW(),
    next_rotation_at = NOW() + (rotation_interval_days || ' days')::INTERVAL,
    updated_at = NOW()
  WHERE id = 1;

  -- Audit log
  INSERT INTO public.encryption_key_audit_log (event_type, key_version)
  VALUES ('key_created', v_new_version);

  RAISE LOG 'Encryption key rotated: v% -> v%', v_current, v_new_version;

  RETURN v_new_version;
END;
$$;

-- 2. cleanup_old_encryption_keys()
--    Delete keys with zero token usage (keeps current and current-1)
CREATE OR REPLACE FUNCTION public.cleanup_old_encryption_keys() RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, vault, public
AS $$
DECLARE
  v_current_version SMALLINT;
  v_version SMALLINT;
  v_deleted INT := 0;
  v_token_count INT;
BEGIN
  -- Get current version
  SELECT current_version INTO v_current_version
  FROM public.encryption_key_config WHERE id = 1;

  -- Only consider versions older than current-1 (keep at least 2 versions)
  IF v_current_version <= 2 THEN
    RAISE LOG 'No keys eligible for cleanup (current version: %)', v_current_version;
    RETURN 0;
  END IF;

  -- Check each old version
  FOR v_version IN 1..(v_current_version - 2) LOOP
    -- Count tokens still using this version
    SELECT COUNT(*) INTO v_token_count
    FROM public.farmer_connections
    WHERE token_encryption_version = v_version
      AND is_active = true;

    IF v_token_count = 0 THEN
      -- Safe to delete - no tokens using this key
      DELETE FROM vault.secrets
      WHERE name = 'token_encryption_key_v' || v_version;

      IF FOUND THEN
        INSERT INTO public.encryption_key_audit_log (event_type, key_version)
        VALUES ('key_deleted', v_version);

        v_deleted := v_deleted + 1;
        RAISE LOG 'Deleted encryption key v%', v_version;
      END IF;
    ELSE
      RAISE LOG 'Retained encryption key v% (% tokens still using it)', v_version, v_token_count;
    END IF;
  END LOOP;

  RETURN v_deleted;
END;
$$;

-- 3. get_current_encryption_version()
--    Helper for Edge Functions to get current version
CREATE OR REPLACE FUNCTION public.get_current_encryption_version() RETURNS SMALLINT
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT current_version FROM public.encryption_key_config WHERE id = 1;
$$;

-- Restrict function access to service_role
REVOKE ALL ON FUNCTION public.rotate_encryption_key() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_old_encryption_keys() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_current_encryption_version() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.rotate_encryption_key() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_encryption_keys() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_current_encryption_version() TO service_role;

-- Schedule cron jobs for automated rotation
-- Quarterly key rotation (1st of Jan, Apr, Jul, Oct at midnight UTC)
SELECT cron.schedule(
  'rotate-encryption-key',
  '0 0 1 1,4,7,10 *',
  $$SELECT public.rotate_encryption_key()$$
);

-- Cleanup old keys weekly (Sunday at midnight UTC)
SELECT cron.schedule(
  'cleanup-old-encryption-keys',
  '0 0 * * 0',
  $$SELECT public.cleanup_old_encryption_keys()$$
);

-- Comments
COMMENT ON FUNCTION public.rotate_encryption_key() IS
'Generates a new encryption key, stores it in Vault, and bumps the current version. Called quarterly by pg_cron.';

COMMENT ON FUNCTION public.cleanup_old_encryption_keys() IS
'Deletes old encryption keys from Vault that have no tokens using them. Always keeps current and current-1 versions.';

COMMENT ON FUNCTION public.get_current_encryption_version() IS
'Returns the current encryption key version from config. Used by Edge Functions.';
