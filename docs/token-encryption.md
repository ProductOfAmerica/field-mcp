# Token Encryption

AES-256-GCM encryption for OAuth tokens stored in `farmer_connections`.

## Overview

OAuth tokens (access + refresh) are encrypted at rest using AES-256-GCM authenticated encryption. This protects tokens even if the database is compromised.

```
Plaintext Token
    ↓
AES-256-GCM Encrypt (with random IV)
    ↓
[version byte][12-byte IV][ciphertext + auth tag]
    ↓
Base64 encode → stored in DB
```

## Encryption Format

| Byte Range | Content | Purpose |
|------------|---------|---------|
| 0 | Version (0x01) | Identifies key version for rotation |
| 1-12 | IV (random) | 96-bit initialization vector |
| 13+ | Ciphertext + Tag | Encrypted data + 16-byte GCM auth tag |

The entire payload is Base64 encoded for storage in TEXT columns.

**Detection:** Encrypted tokens start with `AQ` (Base64 of version byte 0x01). Legacy Base64 tokens start with `eyJ` (Base64 of `{"`).

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Dashboard                                 │
│  OAuth Callback → POST /functions/v1/store-tokens               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    store-tokens Edge Function                    │
│  1. Validate internal secret                                     │
│  2. encryptToken(accessToken)                                    │
│  3. encryptToken(refreshToken)                                   │
│  4. Upsert to farmer_connections                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        PostgreSQL                                │
│  farmer_connections.access_token_encrypted  (AES-256-GCM)       │
│  farmer_connections.refresh_token_encrypted (AES-256-GCM)       │
│  farmer_connections.token_encryption_version (key version)       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Request (token.ts)                        │
│  1. Read encrypted tokens from DB                                │
│  2. decryptTokenCompat() - handles encrypted + legacy            │
│  3. Check expiry, refresh if needed                              │
│  4. Use decrypted token for API call                             │
└─────────────────────────────────────────────────────────────────┘
```

## Components

| File | Purpose |
|------|---------|
| `_shared/core/crypto/token-crypto.ts` | Encryption/decryption functions |
| `functions/store-tokens/index.ts` | Encrypts + stores new tokens |
| `functions/refresh-tokens/index.ts` | Refreshes expiring tokens (called by pg_cron) |
| `_shared/core/auth/token.ts` | Decrypts tokens for API requests |
| `migrations/00018_add_vault_access_function.sql` | RPC function for key access |

## Key Management

### Storage

The encryption key is stored in Supabase Vault:

```sql
-- Key name: token_encryption_key_v1
-- Format: 64-character hex string (32 bytes = 256 bits)
SELECT vault.create_secret('<hex-key>', 'token_encryption_key_v1');
```

### Access

Edge Functions cannot query the `vault` schema directly (PostgREST doesn't expose it). Instead, they call an RPC function:

```typescript
// In token-crypto.ts
const { data } = await supabase.rpc('get_encryption_key', {
  key_name: 'token_encryption_key_v1',
});
```

The `get_encryption_key()` function:
- Runs as `SECURITY DEFINER` (elevated privileges)
- Only allows `token_encryption_key_*` names
- Only accessible by `service_role`

### Caching

The key is cached in memory for the lifetime of the Edge Function isolate:

```typescript
let cachedKey: CryptoKey | null = null;

async function getEncryptionKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  // ... fetch from Vault, cache, return
}
```

## Backwards Compatibility

During migration, both formats are supported:

```typescript
export async function decryptTokenCompat(encrypted: string): Promise<string> {
  if (isEncrypted(encrypted)) {
    return decryptToken(encrypted);  // AES-256-GCM
  }
  return atob(encrypted);  // Legacy Base64
}
```

**Detection logic:**
- Encrypted: Starts with version byte 0x01 → `AQ...` in Base64
- Legacy: Starts with `eyJ` (JWT header `{"`)

## Key Rotation

The `token_encryption_version` column tracks which key encrypted each token:

```sql
ALTER TABLE farmer_connections
ADD COLUMN token_encryption_version SMALLINT DEFAULT 1;
```

**Rotation process:**
1. Add new key to Vault: `token_encryption_key_v2`
2. Update `VERSION_BYTE` in crypto module to `0x02`
3. New tokens encrypted with v2, old tokens still decrypt with v1
4. Run migration script to re-encrypt old tokens
5. Remove old key from Vault

## Setup

### Local Development

After `pnpm supabase:reset`, the seed adds a test key automatically:

```sql
-- In seed.sql (test key only - DO NOT use in production)
SELECT vault.create_secret(
  'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
  'token_encryption_key_v1'
);
```

### Production

Generate a secure key and add to Vault:

```bash
# Generate 256-bit key
openssl rand -hex 32
```

Via Supabase Dashboard → SQL Editor:

```sql
SELECT vault.create_secret(
  '<your-64-char-hex-key>',
  'token_encryption_key_v1'
);
```

## Verification

### Check Tokens Are Encrypted

```sql
-- Encrypted tokens start with 'AQ' (version byte 0x01)
SELECT
  farmer_identifier,
  LEFT(access_token_encrypted, 10) as token_prefix,
  token_encryption_version
FROM farmer_connections;
```

### Test Encryption Round-Trip

```bash
# Call store-tokens to encrypt
curl -X POST http://127.0.0.1:54321/functions/v1/store-tokens \
  -H "Content-Type: application/json" \
  -H "X-Internal-Secret: $INTERNAL_SECRET" \
  -d '{
    "developerId": "00000000-0000-0000-0000-000000000001",
    "farmerId": "test-encrypt",
    "provider": "john_deere",
    "accessToken": "test-access-token",
    "refreshToken": "test-refresh-token",
    "expiresIn": 3600,
    "scopes": ["ag1", "ag2"]
  }'

# Verify in DB
docker exec -i supabase_db_fieldmcp psql -U postgres -c \
  "SELECT farmer_identifier, LEFT(access_token_encrypted, 20) FROM farmer_connections WHERE farmer_identifier = 'test-encrypt';"
```

### Verify Key Access

```bash
docker exec -i supabase_db_fieldmcp psql -U postgres -c \
  "SELECT name FROM vault.decrypted_secrets WHERE name LIKE 'token_encryption%';"
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Failed to retrieve encryption key from Vault` | Key not in Vault | Add key per Setup section |
| `Invalid encryption key length` | Key not 32 bytes (64 hex chars) | Regenerate with `openssl rand -hex 32` |
| `Unsupported encryption version` | Token encrypted with unknown key version | Check `token_encryption_version` column |
| `Invalid token format` | Neither encrypted nor valid Base64 | Token is corrupted, user must reconnect |
| `Invalid schema: vault` | Querying vault directly instead of RPC | Use `supabase.rpc('get_encryption_key', ...)` |
