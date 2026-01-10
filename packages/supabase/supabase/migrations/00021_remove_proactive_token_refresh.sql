-- Remove proactive token refresh (keeping on-demand refresh in MCP server)
-- The on-demand refresh in token.ts handles all token refresh needs

-- Unschedule the pg_cron job
SELECT cron.unschedule('refresh-expiring-tokens');

-- Drop the Edge Function wrapper
DROP FUNCTION IF EXISTS call_refresh_tokens_edge_function();
