-- FieldMCP Initial Schema

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Developers table (users of FieldMCP platform)
CREATE TABLE developers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_keys_developer ON api_keys(developer_id);

-- Subscriptions (synced from Stripe)
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'developer', 'startup', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  monthly_request_limit INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_developer ON subscriptions(developer_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

-- Farmer Connections (OAuth tokens)
CREATE TABLE farmer_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  farmer_identifier TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('john_deere', 'climate_fieldview', 'cnhi')),
  provider_user_id TEXT,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  organizations JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(developer_id, farmer_identifier, provider)
);

CREATE INDEX idx_farmer_connections_developer ON farmer_connections(developer_id);
CREATE INDEX idx_farmer_connections_lookup ON farmer_connections(developer_id, farmer_identifier, provider);

-- Usage Logs
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
  farmer_connection_id UUID REFERENCES farmer_connections(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  request_timestamp TIMESTAMPTZ DEFAULT NOW(),
  response_time_ms INTEGER,
  status_code INTEGER,
  error_type TEXT
);

CREATE INDEX idx_usage_logs_developer ON usage_logs(developer_id);
CREATE INDEX idx_usage_logs_timestamp ON usage_logs(request_timestamp);

-- Usage Aggregates (for billing)
CREATE TABLE usage_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_requests INTEGER DEFAULT 0,
  requests_by_provider JSONB,
  requests_by_tool JSONB,
  
  UNIQUE(developer_id, period_start)
);

CREATE INDEX idx_usage_aggregates_developer ON usage_aggregates(developer_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_developers_updated_at
  BEFORE UPDATE ON developers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_farmer_connections_updated_at
  BEFORE UPDATE ON farmer_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_aggregates ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Developers can only access their own data
-- Note: auth.uid() maps to developer.id via Supabase Auth

CREATE POLICY "Developers can view own profile"
  ON developers FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Developers can update own profile"
  ON developers FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Developers can view own API keys"
  ON api_keys FOR SELECT
  USING (developer_id = auth.uid());

CREATE POLICY "Developers can insert own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (developer_id = auth.uid());

CREATE POLICY "Developers can update own API keys"
  ON api_keys FOR UPDATE
  USING (developer_id = auth.uid());

CREATE POLICY "Developers can delete own API keys"
  ON api_keys FOR DELETE
  USING (developer_id = auth.uid());

CREATE POLICY "Developers can view own subscription"
  ON subscriptions FOR SELECT
  USING (developer_id = auth.uid());

CREATE POLICY "Developers can view own connections"
  ON farmer_connections FOR SELECT
  USING (developer_id = auth.uid());

CREATE POLICY "Developers can insert own connections"
  ON farmer_connections FOR INSERT
  WITH CHECK (developer_id = auth.uid());

CREATE POLICY "Developers can update own connections"
  ON farmer_connections FOR UPDATE
  USING (developer_id = auth.uid());

CREATE POLICY "Developers can delete own connections"
  ON farmer_connections FOR DELETE
  USING (developer_id = auth.uid());

CREATE POLICY "Developers can view own usage logs"
  ON usage_logs FOR SELECT
  USING (developer_id = auth.uid());

CREATE POLICY "Developers can view own usage aggregates"
  ON usage_aggregates FOR SELECT
  USING (developer_id = auth.uid());

-- Service role bypass for edge functions and workers
-- (Service key bypasses RLS by default)

-- Function to create developer on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.developers (id, email)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.subscriptions (developer_id, tier, status, monthly_request_limit)
  VALUES (NEW.id, 'free', 'active', 1000);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
