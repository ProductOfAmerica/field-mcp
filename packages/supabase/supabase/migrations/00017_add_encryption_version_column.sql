-- Add column to track encryption version for each token
-- This enables key rotation by allowing different tokens to be encrypted with different keys

ALTER TABLE public.farmer_connections
ADD COLUMN IF NOT EXISTS token_encryption_version SMALLINT DEFAULT 1;

-- Index for finding tokens that need re-encryption during key rotation
CREATE INDEX IF NOT EXISTS idx_farmer_connections_encryption_version
ON public.farmer_connections (token_encryption_version)
WHERE is_active = true;

COMMENT ON COLUMN public.farmer_connections.token_encryption_version IS
'Version of the encryption key used to encrypt this token. Used for key rotation.';
