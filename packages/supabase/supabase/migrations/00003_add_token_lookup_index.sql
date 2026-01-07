-- Optimized index for token lookup query
-- Covers: developer_id, farmer_identifier, provider, is_active
CREATE INDEX idx_farmer_connections_token_lookup 
ON farmer_connections(developer_id, farmer_identifier, provider, is_active)
WHERE is_active = true;
