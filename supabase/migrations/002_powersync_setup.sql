-- PowerSync Configuration for Supabase
-- Run this AFTER the initial schema migration

-- Create a dedicated role for PowerSync replication
-- IMPORTANT: Change 'your_secure_password_here' to a secure password!
CREATE ROLE powersync_role WITH REPLICATION BYPASSRLS LOGIN PASSWORD 'your_secure_password_here';

-- Grant SELECT permissions on all tables to PowerSync role
GRANT SELECT ON ALL TABLES IN SCHEMA public TO powersync_role;

-- Grant permissions on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO powersync_role;

-- Create publication for PowerSync replication
CREATE PUBLICATION powersync FOR TABLE tasks, projects, labels, task_labels, reminders;

-- Note: After running this, you need to:
-- 1. Get your database connection string from Supabase Dashboard -> Settings -> Database
-- 2. Replace the password in the connection string with the powersync_role password
-- 3. Use this modified connection string in PowerSync Dashboard
