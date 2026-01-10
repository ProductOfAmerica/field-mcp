# Token Refresh

On-demand OAuth token refresh for John Deere connections.

## How It Works

Token refresh happens automatically during MCP requests when a token is about to expire:

```
MCP Request
    ↓
getToken(developerId, farmerId) [in token.ts]
    ↓
Check token cache → if valid, return cached token
    ↓
Query farmer_connections for encrypted tokens
    ↓
Decrypt tokens (ChaCha20-Poly1305 via libsodium)
    ↓
Check expiration
    ├── Token expires in < 5 minutes → Refresh token
    │     ├── Call John Deere Token API
    │     ├── Encrypt new tokens (with current key version)
    │     ├── Update farmer_connections + cache
    │     └── Return new access token
    │
    └── Token still valid → Cache and return
```

## Refresh Trigger

Tokens are refreshed when they expire within **5 minutes** (300,000ms). This provides a buffer to ensure tokens don't expire mid-request.

```typescript
// In _shared/core/auth/token.ts
if (expiresAt < Date.now() + 300000) {
  // Token expires in < 5 minutes, refresh it
  const refreshed = await refreshAccessToken(refreshToken);
  // ... encrypt and store new tokens
}
```

## Error Handling

If refresh fails (invalid refresh token, network error, etc.):

1. `needs_reauth` is set to `true` on the connection
2. `last_refresh_error` stores the error message
3. Dashboard shows "Needs Re-authentication"
4. User must reconnect via the OAuth flow

## Natural Key Migration

Token refresh also handles encryption key rotation automatically:

1. **Decrypt**: Token is decrypted using its stored version (from `token_encryption_version`)
2. **Refresh**: John Deere returns new access/refresh tokens
3. **Encrypt**: New tokens are encrypted with the **current** key version
4. **Update**: `token_encryption_version` is updated to match

This means tokens naturally migrate to newer encryption keys without batch re-encryption jobs. Active connections migrate within their normal refresh cycle (typically within 1 hour for John Deere tokens, since they're refreshed when < 5 minutes remain).

**Inactive users:** Tokens stay on the old key version until they make a request. Old keys are deleted only when zero active tokens reference them (plus 1 version buffer for safety).

## Caching

Tokens are cached in `cache.token_cache` to avoid repeated database queries:

- **Cache key format:** `token:{developerId}:{farmerId}:john_deere`
- **TTL:** Matches token expiration (up to ~58 minutes)
- **Invalidation:** Cache is updated after successful refresh

A cached token is returned immediately if it won't expire within 60 seconds.

## Troubleshooting

| Symptom                                 | Cause                               | Fix                                             |
|-----------------------------------------|-------------------------------------|-------------------------------------------------|
| `needs_reauth: true`                    | Refresh token invalid               | User must reconnect via dashboard               |
| `Token refresh timed out`               | John Deere auth server slow         | Retry later, check John Deere status            |
| `Token refresh failed: 401`             | Wrong credentials                   | Verify JOHN_DEERE_CLIENT_ID/SECRET              |
| `Failed to retrieve encryption key`     | Missing encryption key in Vault     | See [Token Encryption](./token-encryption.md)   |
| `Connection requires re-authentication` | Token decryption failed or expired  | User must reconnect via dashboard               |

## Related

- [Token Encryption](./token-encryption.md) - How tokens are encrypted at rest
