-- Drop redundant single-column index on developer_id
-- This index has 0 scans and is fully covered by composite indexes:
--   - idx_farmer_connections_lookup (developer_id, farmer_identifier, provider)
--   - idx_farmer_connections_token_lookup (developer_id, farmer_identifier, provider, is_active)
-- PostgreSQL can use leftmost prefix of composite indexes for developer_id-only queries

DROP INDEX IF EXISTS idx_farmer_connections_developer;