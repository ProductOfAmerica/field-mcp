-- Grant permissions on cache schema to service_role and authenticated users

-- Grant usage on the cache schema
GRANT USAGE ON SCHEMA cache TO service_role;
GRANT USAGE ON SCHEMA cache TO authenticated;
GRANT USAGE ON SCHEMA cache TO anon;

-- Grant all privileges on cache tables to service_role
GRANT ALL ON ALL TABLES IN SCHEMA cache TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA cache TO service_role;

-- Grant select/insert/update/delete on cache tables to authenticated (for edge functions)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA cache TO authenticated;

-- Ensure future tables in cache schema get the same permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA cache GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA cache GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
