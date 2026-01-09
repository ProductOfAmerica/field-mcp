-- Migration: Add cache tables for Edge Functions
-- Replaces Cloudflare KV namespaces and Durable Objects

CREATE SCHEMA IF NOT EXISTS cache;

-- Rate limit cache (replaces RATE_LIMITS KV)
CREATE TABLE cache.rate_limits (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_rate_limits_expires_at ON cache.rate_limits (expires_at);

-- API key cache (replaces API_KEY_CACHE KV)
CREATE TABLE cache.api_key_cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_api_key_cache_expires_at ON cache.api_key_cache (expires_at);

-- Token cache (replaces TOKEN_CACHE KV)
CREATE TABLE cache.token_cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_token_cache_expires_at ON cache.token_cache (expires_at);

-- Monthly usage counter (replaces Durable Object MonthlyUsageCounter)
CREATE TABLE cache.monthly_usage (
  developer_id TEXT NOT NULL,
  month TEXT NOT NULL,
  count INT NOT NULL DEFAULT 0,
  seeded BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (developer_id, month)
);

-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup job to run every 5 minutes
SELECT cron.schedule(
  'clean-expired-cache',
  '*/5 * * * *',
  $$
    DELETE FROM cache.rate_limits WHERE expires_at < NOW();
    DELETE FROM cache.api_key_cache WHERE expires_at < NOW();
    DELETE FROM cache.token_cache WHERE expires_at < NOW();
  $$
);

-- Atomic increment function for monthly usage with limit check
CREATE OR REPLACE FUNCTION increment_monthly_usage(
  p_developer_id TEXT,
  p_month TEXT,
  p_limit INT
)
RETURNS TABLE(allowed BOOLEAN, count INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_count INT;
BEGIN
  UPDATE cache.monthly_usage
  SET count = cache.monthly_usage.count + 1
  WHERE developer_id = p_developer_id
    AND month = p_month
    AND cache.monthly_usage.count < p_limit
  RETURNING cache.monthly_usage.count INTO v_count;

  IF v_count IS NOT NULL THEN
    RETURN QUERY SELECT TRUE, v_count;
  ELSE
    SELECT cache.monthly_usage.count INTO v_count
    FROM cache.monthly_usage
    WHERE developer_id = p_developer_id AND month = p_month;
    
    RETURN QUERY SELECT FALSE, COALESCE(v_count, 0);
  END IF;
END;
$$;

COMMENT ON SCHEMA cache IS 'Cache tables for Edge Functions - replaces Cloudflare KV';
COMMENT ON TABLE cache.rate_limits IS 'Per-minute and auth failure rate limit counters';
COMMENT ON TABLE cache.api_key_cache IS 'Validated API key cache with developer/subscription info';
COMMENT ON TABLE cache.token_cache IS 'OAuth token cache for provider connections';
COMMENT ON TABLE cache.monthly_usage IS 'Monthly request counter per developer';
