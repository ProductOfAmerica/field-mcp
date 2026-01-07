-- Add indexes for foreign keys on usage_logs table
CREATE INDEX IF NOT EXISTS idx_usage_logs_api_key ON usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_farmer_connection ON usage_logs(farmer_connection_id);
