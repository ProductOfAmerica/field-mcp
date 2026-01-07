-- Enable realtime for subscriptions table
alter publication supabase_realtime add table subscriptions;

-- Enable realtime for farmer_connections table
alter publication supabase_realtime add table farmer_connections;

-- Enable realtime for usage_logs table
alter publication supabase_realtime add table usage_logs;
