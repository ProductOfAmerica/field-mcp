# Token Refresh

Automatic OAuth token refresh for John Deere connections.

## How It Works

```
pg_cron (every 15 min)
    ↓
call_refresh_tokens_edge_function() [Postgres wrapper]
    ↓
pg_net HTTP POST → /functions/v1/refresh-tokens
    ↓
refresh-tokens Edge Function
    ├── Decrypt tokens (AES-256-GCM)
    ├── Call John Deere Token API
    ├── Encrypt new tokens
    └── Update farmer_connections
```

**Why Edge Function instead of SQL?**

The previous SQL-based approach couldn't handle app-level encryption. Edge Functions can:
- Decrypt tokens using the crypto module
- Re-encrypt refreshed tokens
- Access Vault via RPC for the encryption key

**Two refresh mechanisms:**

| Mechanism | When | Purpose |
|-----------|------|---------|
| pg_cron (proactive) | Every 15 min | Keeps tokens fresh even with no traffic |
| On-demand (`token.ts`) | During MCP requests | Fallback when token is about to expire |

If refresh fails, `needs_reauth` is set to `true` and the dashboard shows "Needs Re-authentication".

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          pg_cron                                 │
│  Schedule: */15 * * * * (every 15 minutes)                      │
│  Job: call_refresh_tokens_edge_function()                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                          pg_net                                  │
│  HTTP POST to Edge Function (async)                              │
│  Auth: Bearer <service_role_key>                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 refresh-tokens Edge Function                     │
│  1. Query tokens expiring in < 20 minutes                        │
│  2. For each: decrypt → refresh → encrypt → update               │
│  3. Mark needs_reauth=true on failure                            │
└─────────────────────────────────────────────────────────────────┘
```

## Setup

### Local Development

Handled automatically by `pnpm supabase:reset` via the seed template. Just ensure these are set in `packages/supabase/.env.local`:

```bash
SUPABASE_URL=http://host.docker.internal:54321
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
JOHN_DEERE_CLIENT_ID=<your-client-id>
JOHN_DEERE_CLIENT_SECRET=<your-client-secret>
```

### Production

Run once via Supabase Dashboard → SQL Editor:

```sql
-- App settings for pg_net
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://<project-ref>.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = '<service-role-key>';

-- John Deere credentials
SELECT vault.create_secret('<client-id>', 'john_deere_client_id');
SELECT vault.create_secret('<client-secret>', 'john_deere_client_secret');
```

## Testing (Local)

### Verify Setup

```bash
# Check cron job exists
docker exec -i supabase_db_fieldmcp psql -U postgres -c \
  "SELECT jobname, schedule FROM cron.job WHERE jobname = 'refresh-expiring-tokens';"

# Check vault secrets exist
docker exec -i supabase_db_fieldmcp psql -U postgres -c \
  "SELECT name FROM vault.decrypted_secrets WHERE name LIKE 'john_deere%';"

# Check app settings configured
docker exec -i supabase_db_fieldmcp psql -U postgres -c \
  "SHOW app.settings.supabase_url;"
```

### Manually Trigger Refresh

```bash
# Call the Edge Function directly
curl -X POST http://127.0.0.1:54321/functions/v1/refresh-tokens \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"

# Check results
docker exec -i supabase_db_fieldmcp psql -U postgres -c \
  "SELECT farmer_identifier, needs_reauth, last_refresh_error, last_refresh_at FROM public.farmer_connections;"
```

### Trigger via pg_cron Wrapper

```bash
# Call the wrapper function (simulates what cron does)
docker exec -i supabase_db_fieldmcp psql -U postgres -c \
  "SELECT call_refresh_tokens_edge_function();"
```

### Check Cron Logs

```bash
docker exec -i supabase_db_fieldmcp psql -U postgres -c \
  "SELECT jobname, status, return_message, start_time
   FROM cron.job_run_details
   ORDER BY start_time DESC LIMIT 10;"
```

## Testing (Production)

Run these queries via **Supabase Dashboard → SQL Editor**:

```sql
-- Check cron job
SELECT jobname, schedule FROM cron.job WHERE jobname = 'refresh-expiring-tokens';

-- Check vault secrets exist (doesn't reveal values)
SELECT name FROM vault.decrypted_secrets WHERE name LIKE 'john_deere%';

-- Check app settings
SHOW app.settings.supabase_url;

-- Trigger wrapper function
SELECT call_refresh_tokens_edge_function();

-- Check connection status
SELECT farmer_identifier, needs_reauth, last_refresh_error, last_refresh_at
FROM public.farmer_connections;

-- Check cron logs
SELECT jobname, status, return_message, start_time
FROM cron.job_run_details
ORDER BY start_time DESC LIMIT 10;
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `app.settings not configured` | Missing ALTER DATABASE settings | Add supabase_url and service_role_key |
| `processed: 0, failed: 0` | No tokens expiring soon | Tokens are fresh, nothing to do |
| `needs_reauth: true` | Refresh token invalid | User must reconnect via dashboard |
| `John Deere credentials not configured` | Missing vault secrets | Add secrets per Setup section |
| `HTTP 401: invalid_client` | Wrong credentials in vault | Verify client ID/secret match John Deere portal |
| `Failed to retrieve encryption key` | Missing encryption key in Vault | See [Token Encryption](./token-encryption.md) setup |
| `Connection requires re-authentication` | Token decryption failed or expired | User must reconnect via dashboard |

## Related

- [Token Encryption](./token-encryption.md) - How tokens are encrypted at rest
