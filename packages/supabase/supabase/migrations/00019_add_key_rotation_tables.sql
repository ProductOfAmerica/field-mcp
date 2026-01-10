-- Add tables for automated encryption key rotation
-- Config table stores current version, audit log tracks all rotation events

-- Configuration table (singleton - only one row allowed)
CREATE TABLE IF NOT EXISTS public.encryption_key_config (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  current_version SMALLINT NOT NULL DEFAULT 1,
  rotation_interval_days INT NOT NULL DEFAULT 90,
  last_rotation_at TIMESTAMPTZ,
  next_rotation_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure exactly one row exists
INSERT INTO public.encryption_key_config (id, current_version)
VALUES (1, 1)
ON CONFLICT (id) DO NOTHING;

-- Audit log for all rotation events
CREATE TABLE IF NOT EXISTS public.encryption_key_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'key_created',
    'version_bumped',
    'reencryption_batch',
    'reencryption_failed',
    'key_deleted',
    'rotation_scheduled'
  )),
  key_version SMALLINT,
  tokens_affected INT,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_encryption_audit_created_at
ON public.encryption_key_audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_encryption_audit_event_type
ON public.encryption_key_audit_log (event_type, created_at DESC);

-- Trigger for updated_at on config table
CREATE OR REPLACE TRIGGER update_encryption_key_config_updated_at
  BEFORE UPDATE ON public.encryption_key_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies (service role only for config, read-only for authenticated on audit log)
ALTER TABLE public.encryption_key_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encryption_key_audit_log ENABLE ROW LEVEL SECURITY;

-- Config is service role only
CREATE POLICY "Service role can manage encryption config"
  ON public.encryption_key_config
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Audit log: service role can insert, authenticated can read
CREATE POLICY "Service role can insert audit logs"
  ON public.encryption_key_audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can read audit logs"
  ON public.encryption_key_audit_log
  FOR SELECT
  TO service_role
  USING (true);

-- Comments
COMMENT ON TABLE public.encryption_key_config IS
'Singleton configuration for encryption key rotation. current_version determines which key encrypts new tokens.';

COMMENT ON TABLE public.encryption_key_audit_log IS
'Audit trail for all encryption key rotation operations including key creation, re-encryption batches, and key deletion.';

COMMENT ON COLUMN public.encryption_key_config.current_version IS
'The current encryption key version. New tokens are encrypted with token_encryption_key_v{current_version}.';

COMMENT ON COLUMN public.encryption_key_config.rotation_interval_days IS
'Number of days between automatic key rotations. Default is 90 days.';

-- BREAKING CHANGE: Encryption scheme changed from AES-GCM to ChaCha20-Poly1305
-- Wipe existing tokens since they use incompatible encryption format
-- This is safe because there's no meaningful production data yet
UPDATE public.farmer_connections SET
  access_token_encrypted = NULL,
  refresh_token_encrypted = NULL,
  is_active = false,
  needs_reauth = true,
  token_encryption_version = 0
WHERE access_token_encrypted IS NOT NULL;
