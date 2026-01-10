# Token Encryption

ChaCha20-Poly1305 authenticated encryption for OAuth tokens stored in `farmer_connections`.

## Overview

OAuth tokens (access + refresh) are encrypted at rest using ChaCha20-Poly1305 IETF authenticated encryption via
libsodium. This protects tokens even if the database is compromised.

```
Plaintext Token
    ↓
ChaCha20-Poly1305 Encrypt (with random nonce)
    ↓
[version byte][12-byte nonce][ciphertext + auth tag]
    ↓
Base64 encode → stored in DB
```

## Encryption Format

| Byte Range | Content          | Purpose                                    |
|------------|------------------|--------------------------------------------|
| 0          | Version (1-255)  | Identifies key version for rotation        |
| 1-12       | Nonce (random)   | 96-bit nonce for ChaCha20-Poly1305 IETF    |
| 13+        | Ciphertext + Tag | Encrypted data + 16-byte Poly1305 auth tag |

The entire payload is Base64 encoded for storage in TEXT columns.

**Detection:** Encrypted tokens have version bytes 1-10 (0x01-0x0A). Legacy Base64 tokens start with `eyJ` (Base64
of `{"`). The upper bound of 10 is arbitrary and should be increased if you rotate keys more than 10 times.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Dashboard                                │
│  OAuth Callback → POST /functions/v1/store-tokens               │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    store-tokens Edge Function                   │
│  1. Validate internal secret                                    │
│  2. encryptToken(accessToken)                                   │
│  3. encryptToken(refreshToken)                                  │
│  4. Upsert to farmer_connections                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        PostgreSQL                               │
│  farmer_connections.access_token_encrypted  (ChaCha20-Poly1305) │
│  farmer_connections.refresh_token_encrypted (ChaCha20-Poly1305) │
│  farmer_connections.token_encryption_version (key version)      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Request (token.ts)                       │
│  1. Read encrypted tokens from DB                               │
│  2. decryptTokenCompat() - handles encrypted + legacy           │
│  3. Check expiry, refresh if needed                             │
│  4. Use decrypted token for API call                            │
└─────────────────────────────────────────────────────────────────┘
```

## Components

| File                                              | Purpose                                       |
|---------------------------------------------------|-----------------------------------------------|
| `_shared/core/crypto/token-crypto.ts`             | Encryption/decryption functions (libsodium)   |
| `functions/store-tokens/index.ts`                 | Encrypts + stores new tokens                  |
| `_shared/core/auth/token.ts`                      | Decrypts tokens, on-demand refresh            |
| `migrations/00018_add_vault_access_function.sql`  | RPC function for key access                   |
| `migrations/00019_add_key_rotation_tables.sql`    | Config and audit tables for key rotation      |
| `migrations/00020_add_key_rotation_functions.sql` | Automated key rotation functions              |

## Key Management

### Storage

Encryption keys are stored in Supabase Vault as Base64-encoded 32-byte keys:

```sql
-- Key name: token_encryption_key_v{version}
-- Format: Base64-encoded 32 bytes (256 bits)
SELECT vault.create_secret('<base64-key>', 'token_encryption_key_v1');
```

### Access

Edge Functions cannot query the `vault` schema directly (PostgREST doesn't expose it). Instead, they call an RPC
function:

```typescript
// In token-crypto.ts
const {data} = await supabase.rpc('get_encryption_key', {
    key_name: 'token_encryption_key_v1',
});
```

The `get_encryption_key()` function:

- Runs as `SECURITY DEFINER` (elevated privileges)
- Only allows `token_encryption_key_*` names
- Only accessible by `service_role`

### Caching

Keys are cached in memory per version for the lifetime of the Edge Function isolate:

```typescript
const keyCache = new Map<number, Uint8Array>();

async function getEncryptionKeyByVersion(version: number): Promise<Uint8Array> {
    const cached = keyCache.get(version);
    if (cached) return cached;
    // ... fetch from Vault, cache, return
}
```

### Version Management

The current encryption version is stored in `encryption_key_config`:

```typescript
async function getConfigVersion(): Promise<number> {
    const {data} = await supabase.rpc('get_current_encryption_version');
    return data;
}
```

New tokens are encrypted with the current version. Old tokens can still be decrypted using their stored version.

## Backwards Compatibility

During migration, both formats are supported:

```typescript
export async function decryptTokenCompat(encrypted: string): Promise<string> {
    if (isEncrypted(encrypted)) {
        return decryptToken(encrypted);  // ChaCha20-Poly1305
    }
    return atob(encrypted);  // Legacy Base64
}
```

**Detection logic:**

- Encrypted: Version byte 1-10 (first byte after Base64 decode)
- Legacy: Starts with `eyJ` (JWT header `{"`)

## Key Rotation

Automated key rotation is handled by database functions and pg_cron.

### Tables

| Table                      | Purpose                                        |
|----------------------------|------------------------------------------------|
| `encryption_key_config`    | Singleton with current_version, rotation times |
| `encryption_key_audit_log` | Audit trail for all rotation events            |

### Functions

| Function                          | Purpose                                          |
|-----------------------------------|--------------------------------------------------|
| `rotate_encryption_key()`         | Generate new key, store in Vault, bump version   |
| `cleanup_old_encryption_keys()`   | Delete keys with zero tokens using them          |
| `get_current_encryption_version()`| Helper for Edge Functions to get current version |

**Security:** All functions use `SECURITY DEFINER` with `SET search_path = pg_catalog, vault, extensions, public` to prevent search_path injection attacks and ensure access to `gen_random_bytes()` from pgcrypto.

### Schedule (pg_cron)

| Job                          | Schedule                      | Purpose                      |
|------------------------------|-------------------------------|------------------------------|
| `rotate-encryption-key`      | Quarterly (Jan, Apr, Jul, Oct)| Generate new key version     |
| `cleanup-old-encryption-keys`| Weekly (Sunday midnight)      | Remove unused old keys       |

### Natural Migration

Tokens migrate to the new key version automatically when on-demand token refresh runs (triggered when a token is < 5 minutes from expiry during an MCP request):

1. Token is decrypted using its stored version (e.g., v1)
2. John Deere returns new access/refresh tokens
3. New tokens are encrypted with current version (e.g., v2)
4. `token_encryption_version` is updated to current version

No batch re-encryption is needed. Tokens migrate naturally over time as they're used.

### Manual Rotation

To rotate keys immediately:

```sql
SELECT rotate_encryption_key();
```

To cleanup unused old keys:

```sql
SELECT cleanup_old_encryption_keys();
```

## Crypto Implementation Details

### Edge Functions (libsodium-wrappers)

```typescript
import sodium from 'libsodium-wrappers';

// Encrypt
const ciphertext = sodium.crypto_aead_chacha20poly1305_ietf_encrypt(
  plaintext,      // Uint8Array
  null,           // no AAD
  null,           // secret_nonce (unused, generates random)
  nonce,          // 12 bytes
  key,            // 32 bytes
);

// Decrypt - NOTE: null first arg is secret_nonce (required but unused)
const plaintext = sodium.crypto_aead_chacha20poly1305_ietf_decrypt(
  null,           // secret_nonce (required but unused in IETF variant)
  ciphertext,     // Uint8Array
  null,           // no AAD
  nonce,          // 12 bytes
  key,            // 32 bytes
);
```

### PostgreSQL (key generation only)

```sql
-- Uses pgcrypto extension (in extensions schema)
v_key := gen_random_bytes(32);  -- Cryptographically secure
```

Note: PostgreSQL does not perform encryption/decryption. All crypto operations happen in Edge Functions.

## Setup

### Local Development

After `pnpm supabase:reset`, the seed adds a test key automatically:

```sql
-- In seed.sql (test key only - DO NOT use in production)
SELECT vault.create_secret(
    '<base64-encoded-32-bytes>',
    'token_encryption_key_v1'
);
```

### Production

Generate a secure key and add to Vault:

```bash
# Generate 256-bit key (Base64 encoded)
openssl rand -base64 32
```

Via Supabase Dashboard SQL Editor:

```sql
SELECT vault.create_secret(
    '<your-base64-key>',
    'token_encryption_key_v1'
);

-- Initialize config (if not exists)
INSERT INTO encryption_key_config (id, current_version)
VALUES (1, 1)
ON CONFLICT (id) DO NOTHING;
```

## Verification

### Check Tokens Are Encrypted

```sql
-- Encrypted tokens have version bytes 1-10
SELECT farmer_identifier,
       LEFT(access_token_encrypted, 10) as token_prefix,
       token_encryption_version
FROM farmer_connections;
```

### Check Current Version

```sql
SELECT current_version, last_rotation_at, next_rotation_at
FROM encryption_key_config;
```

### Check Rotation Audit Log

```sql
SELECT event_type, key_version, tokens_affected, created_at
FROM encryption_key_audit_log
ORDER BY created_at DESC
LIMIT 20;
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
  "SELECT farmer_identifier, LEFT(access_token_encrypted, 20), token_encryption_version FROM farmer_connections WHERE farmer_identifier = 'test-encrypt';"

```

### Verify Key Access

```bash
docker exec -i supabase_db_fieldmcp psql -U postgres -c \
  "SELECT name FROM vault.decrypted_secrets WHERE name LIKE 'token_encryption%';"
```

## Troubleshooting

| Symptom                                         | Cause                                    | Fix                                             |
|-------------------------------------------------|------------------------------------------|-------------------------------------------------|
| `Failed to retrieve encryption key v{N}`        | Key not in Vault                         | Add key or run `rotate_encryption_key()`        |
| `Invalid encryption key length`                 | Key not 32 bytes                         | Regenerate with `openssl rand -base64 32`       |
| `Invalid encryption version: {N}`               | Version byte outside valid range         | Token is corrupted, user must reconnect         |
| `Invalid token format`                          | Neither encrypted nor valid Base64       | Token is corrupted, user must reconnect         |
| `Invalid schema: vault`                         | Querying vault directly instead of RPC   | Use `supabase.rpc('get_encryption_key', ...)`   |
| `encryption_key_config not found`               | Config table not initialized             | Run migration 00019 or insert manually          |
| `function gen_random_bytes does not exist`      | extensions schema not in search_path     | Add `extensions` to function's search_path      |