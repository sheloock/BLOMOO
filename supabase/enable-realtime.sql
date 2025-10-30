-- Enable Real-Time for Orders Table
-- Run this in your Supabase SQL Editor

-- Enable real-time replication for the orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Verify real-time is enabled
-- Run this query to check:
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Note: You may need to wait a few seconds for the changes to take effect
-- After running this, the admin dashboard will receive real-time notifications
-- whenever a new order is inserted into the orders table.
