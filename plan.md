Ready to code?

Here is Claude's plan:
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
Plan: Proactive Token Refresh + Smart Dashboard Status

Summary

Implement proactive background token refresh via pg_cron (every 15 min) with proper dashboard status indicators that distinguish between "will auto-refresh" and "needs manual re-authentication".

 ---
Files to Modify/Create
┌─────────────────────────────────────────────────────────────────────────────┬────────┬─────────────────────────────────────────────────────────────────────────────┐
│                                    File                                     │ Action │                                   Purpose                                   │
├─────────────────────────────────────────────────────────────────────────────┼────────┼─────────────────────────────────────────────────────────────────────────────┤
│ packages/supabase/supabase/migrations/00015_add_token_refresh_tracking.sql  │ Create │ Add needs_reauth, last_refresh_error, last_refresh_at columns + pg_cron job │
├─────────────────────────────────────────────────────────────────────────────┼────────┼─────────────────────────────────────────────────────────────────────────────┤
│ packages/supabase/supabase/functions/refresh-tokens/index.ts                │ Modify │ Implement actual token refresh logic (currently a stub)                     │
├─────────────────────────────────────────────────────────────────────────────┼────────┼─────────────────────────────────────────────────────────────────────────────┤
│ apps/dashboard/src/app/dashboard/connections/realtime-connections-table.tsx │ Modify │ Update status display logic                                                 │
├─────────────────────────────────────────────────────────────────────────────┼────────┼─────────────────────────────────────────────────────────────────────────────┤
│ apps/dashboard/src/app/api/oauth/john-deere/callback/route.ts               │ Modify │ Clear needs_reauth on successful OAuth                                      │
├─────────────────────────────────────────────────────────────────────────────┼────────┼─────────────────────────────────────────────────────────────────────────────┤
│ packages/types/src/database.ts                                              │ Modify │ Add new columns to FarmerConnection type                                    │
└─────────────────────────────────────────────────────────────────────────────┴────────┴─────────────────────────────────────────────────────────────────────────────┘
 ---
Implementation Steps

Step 1: Database Migration

Create packages/supabase/supabase/migrations/00015_add_token_refresh_tracking.sql:

-- Add columns to track refresh status
ALTER TABLE public.farmer_connections
ADD COLUMN IF NOT EXISTS needs_reauth BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_refresh_error TEXT,
ADD COLUMN IF NOT EXISTS last_refresh_at TIMESTAMPTZ;

-- Create index for cron job query (tokens expiring soon)
CREATE INDEX IF NOT EXISTS idx_farmer_connections_token_refresh
ON public.farmer_connections (token_expires_at)
WHERE is_active = true AND needs_reauth = false;

-- Schedule cron job every 15 minutes to refresh expiring tokens
-- Calls the refresh-tokens edge function
SELECT cron.schedule(
'refresh-expiring-tokens',
'*/15 * * * *',
$$
SELECT net.http_post(
url := current_setting('app.supabase_url') || '/functions/v1/refresh-tokens',
headers := jsonb_build_object(
'Authorization', 'Bearer ' || current_setting('app.service_role_key'),
'Content-Type', 'application/json'
),
body := '{}'::jsonb
);
$$
);

Step 2: Implement refresh-tokens Edge Function

Update packages/supabase/supabase/functions/refresh-tokens/index.ts:

// Query connections expiring in next 20 minutes (buffer for 15-min cron)
// For each: attempt refresh
// On success: update tokens, clear needs_reauth, set last_refresh_at
// On failure: set needs_reauth = true, store error in last_refresh_error

Key logic:
- Query: token_expires_at < NOW() + INTERVAL '20 minutes' AND is_active = true AND needs_reauth = false
- Reuse refresh logic from _shared/core/auth/token.ts (the refreshAccessToken function)
- Handle errors gracefully - don't let one failed refresh stop others
- Return count of refreshed/failed tokens

Step 3: Update Dashboard UI

Modify apps/dashboard/src/app/dashboard/connections/realtime-connections-table.tsx:

Current logic (lines 174-176):
const isExpired = conn.token_expires_at && new Date(conn.token_expires_at) < new Date();

New logic:
const needsReauth = conn.needs_reauth;
// If needs_reauth is false, connection is healthy (cron will refresh if needed)
// If needs_reauth is true, user must manually re-authenticate

Status display:
┌──────────────┬────────────────────────────────────────────────────────────────┐
│ needs_reauth │                             Badge                              │
├──────────────┼────────────────────────────────────────────────────────────────┤
│ true         │ ⚠️ "Needs Re-authentication" (amber/red) with Reconnect button │
├──────────────┼────────────────────────────────────────────────────────────────┤
│ false        │ ✅ "Active" (green)                                            │
└──────────────┴────────────────────────────────────────────────────────────────┘
Step 4: Clear needs_reauth on OAuth Success

Modify apps/dashboard/src/app/api/oauth/john-deere/callback/route.ts:

In the upsert operation, add:
needs_reauth: false,
last_refresh_error: null,
last_refresh_at: new Date().toISOString(),

Step 5: Update Types

Modify packages/types/src/database.ts:

Add to FarmerConnection interface:
needs_reauth: boolean;
last_refresh_error: string | null;
last_refresh_at: string | null;

 ---
On-Demand Fallback (Already Exists)

The existing logic in packages/supabase/supabase/functions/_shared/core/auth/token.ts (lines 44-68) already handles on-demand refresh when a request comes in. This remains as a fallback:
- If cron somehow missed a token
- If token expires between cron runs
- First request after seeding with expired access token

Should also update this to set needs_reauth = true on refresh failure.

 ---
Verification

Local Testing

1. Run pnpm supabase:reset to apply new migration
2. Verify columns exist: SELECT needs_reauth, last_refresh_error, last_refresh_at FROM farmer_connections LIMIT 1;
3. Verify cron job scheduled: SELECT * FROM cron.job WHERE jobname = 'refresh-expiring-tokens';
4. Manually invoke refresh function: curl -X POST http://localhost:54321/functions/v1/refresh-tokens -H "Authorization: Bearer <service_role_key>"
5. Check dashboard shows "Active" for valid connections

Test Refresh Failure Handling

1. Manually set invalid refresh token in DB
2. Trigger refresh (via cron or manual curl)
3. Verify needs_reauth = true and error is stored
4. Verify dashboard shows "Needs Re-authentication"
5. Complete OAuth flow, verify needs_reauth cleared

E2E Tests

- Existing E2E tests should continue to pass
- Connection status should show "Active" not "Token expired"

 ---
Notes

- pg_cron is free - it's a Postgres extension, no additional cost
- Edge function invocations: ~2,880/month for 15-min cron (well within free tier)
- 20-minute buffer: Query for tokens expiring in 20 min to ensure 15-min cron catches them
- Graceful degradation: If cron fails, on-demand refresh still works
  ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌

Would you like to proceed?

❯ 1. Yes, and auto-accept edits (shift+tab)
2. Yes, and manually approve edits
3. Type here to tell Claude what to change
