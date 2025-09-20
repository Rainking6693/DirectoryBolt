-- AutoBolt Tables for Supabase
-- Run this in the Supabase SQL Editor

-- 1. Create autobolt_processing_queue table
CREATE TABLE IF NOT EXISTS autobolt_processing_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    package_type VARCHAR(50) NOT NULL,
    directory_limit INTEGER NOT NULL,
    priority_level INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'paused')),
    action VARCHAR(50) DEFAULT 'start_processing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(100) DEFAULT 'staff_dashboard',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Create autobolt_extension_status table
CREATE TABLE IF NOT EXISTS autobolt_extension_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    extension_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'processing', 'error')),
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_customer_id VARCHAR(50),
    current_queue_id UUID,
    processing_started_at TIMESTAMP WITH TIME ZONE,
    directories_processed INTEGER DEFAULT 0,
    directories_failed INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create autobolt_processing_history table
CREATE TABLE IF NOT EXISTS autobolt_processing_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    queue_id UUID,
    customer_id VARCHAR(50) NOT NULL,
    session_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    session_completed_at TIMESTAMP WITH TIME ZONE,
    total_directories INTEGER NOT NULL,
    directories_completed INTEGER DEFAULT 0,
    directories_failed INTEGER DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    processing_time_seconds INTEGER,
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_autobolt_queue_customer_id ON autobolt_processing_queue(customer_id);
CREATE INDEX IF NOT EXISTS idx_autobolt_queue_status ON autobolt_processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_autobolt_queue_priority ON autobolt_processing_queue(priority_level);
CREATE INDEX IF NOT EXISTS idx_autobolt_queue_created_at ON autobolt_processing_queue(created_at);

CREATE INDEX IF NOT EXISTS idx_extension_status_extension_id ON autobolt_extension_status(extension_id);
CREATE INDEX IF NOT EXISTS idx_extension_status_status ON autobolt_extension_status(status);

CREATE INDEX IF NOT EXISTS idx_processing_history_customer_id ON autobolt_processing_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_processing_history_queue_id ON autobolt_processing_history(queue_id);

-- 5. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_autobolt_queue_updated_at 
    BEFORE UPDATE ON autobolt_processing_queue 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_extension_status_updated_at 
    BEFORE UPDATE ON autobolt_extension_status 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable RLS (Row Level Security)
ALTER TABLE autobolt_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE autobolt_extension_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE autobolt_processing_history ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies (allow service role to access all data)
CREATE POLICY "Service role can access all autobolt data" 
    ON autobolt_processing_queue FOR ALL USING (true);

CREATE POLICY "Service role can access all extension status" 
    ON autobolt_extension_status FOR ALL USING (true);

CREATE POLICY "Service role can access all processing history" 
    ON autobolt_processing_history FOR ALL USING (true);

-- 8. Create helper functions
CREATE OR REPLACE FUNCTION get_queue_stats()
RETURNS TABLE (
    total_queued INTEGER,
    total_processing INTEGER,
    total_completed INTEGER,
    total_failed INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE status = 'queued')::INTEGER as total_queued,
        COUNT(*) FILTER (WHERE status = 'processing')::INTEGER as total_processing,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as total_completed,
        COUNT(*) FILTER (WHERE status = 'failed')::INTEGER as total_failed
    FROM autobolt_processing_queue;
END;
$$ LANGUAGE plpgsql;

-- 9. Test the tables
SELECT 'AutoBolt tables created successfully!' as message;
SELECT * FROM get_queue_stats();
