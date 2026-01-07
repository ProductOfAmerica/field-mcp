-- Fix RLS policies to use (select auth.uid()) for better performance
-- This prevents auth.uid() from being re-evaluated for each row

-- developers table
DROP POLICY IF EXISTS "Developers can view own profile" ON developers;
DROP POLICY IF EXISTS "Developers can update own profile" ON developers;

CREATE POLICY "Developers can view own profile"
  ON developers FOR SELECT
  USING ((select auth.uid()) = id);

CREATE POLICY "Developers can update own profile"
  ON developers FOR UPDATE
  USING ((select auth.uid()) = id);

-- api_keys table
DROP POLICY IF EXISTS "Developers can view own API keys" ON api_keys;
DROP POLICY IF EXISTS "Developers can insert own API keys" ON api_keys;
DROP POLICY IF EXISTS "Developers can update own API keys" ON api_keys;
DROP POLICY IF EXISTS "Developers can delete own API keys" ON api_keys;

CREATE POLICY "Developers can view own API keys"
  ON api_keys FOR SELECT
  USING (developer_id = (select auth.uid()));

CREATE POLICY "Developers can insert own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (developer_id = (select auth.uid()));

CREATE POLICY "Developers can update own API keys"
  ON api_keys FOR UPDATE
  USING (developer_id = (select auth.uid()));

CREATE POLICY "Developers can delete own API keys"
  ON api_keys FOR DELETE
  USING (developer_id = (select auth.uid()));

-- subscriptions table
DROP POLICY IF EXISTS "Developers can view own subscription" ON subscriptions;

CREATE POLICY "Developers can view own subscription"
  ON subscriptions FOR SELECT
  USING (developer_id = (select auth.uid()));

-- farmer_connections table
DROP POLICY IF EXISTS "Developers can view own connections" ON farmer_connections;
DROP POLICY IF EXISTS "Developers can insert own connections" ON farmer_connections;
DROP POLICY IF EXISTS "Developers can update own connections" ON farmer_connections;
DROP POLICY IF EXISTS "Developers can delete own connections" ON farmer_connections;

CREATE POLICY "Developers can view own connections"
  ON farmer_connections FOR SELECT
  USING (developer_id = (select auth.uid()));

CREATE POLICY "Developers can insert own connections"
  ON farmer_connections FOR INSERT
  WITH CHECK (developer_id = (select auth.uid()));

CREATE POLICY "Developers can update own connections"
  ON farmer_connections FOR UPDATE
  USING (developer_id = (select auth.uid()));

CREATE POLICY "Developers can delete own connections"
  ON farmer_connections FOR DELETE
  USING (developer_id = (select auth.uid()));

-- usage_logs table
DROP POLICY IF EXISTS "Developers can view own usage logs" ON usage_logs;

CREATE POLICY "Developers can view own usage logs"
  ON usage_logs FOR SELECT
  USING (developer_id = (select auth.uid()));

-- usage_aggregates table
DROP POLICY IF EXISTS "Developers can view own usage aggregates" ON usage_aggregates;

CREATE POLICY "Developers can view own usage aggregates"
  ON usage_aggregates FOR SELECT
  USING (developer_id = (select auth.uid()));
