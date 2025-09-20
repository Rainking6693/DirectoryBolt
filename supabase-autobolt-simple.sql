-- Simplified AutoBolt Tables for Supabase
-- Run this in the Supabase SQL Editor

-- 1. Create autobolt_processing_queue table
CREATE TABLE autobolt_processing_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    package_type VARCHAR(50) NOT NULL,
    directory_limit INTEGER NOT NULL,
    priority_level INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'queued',
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
CREATE TABLE autobolt_extension_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    extension_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'offline',
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
CREATE TABLE autobolt_processing_history (
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
    status VARCHAR(50) DEFAULT 'in_progress',
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX idx_autobolt_queue_customer_id ON autobolt_processing_queue(customer_id);
CREATE INDEX idx_autobolt_queue_status ON autobolt_processing_queue(status);
CREATE INDEX idx_autobolt_queue_priority ON autobolt_processing_queue(priority_level);
CREATE INDEX idx_extension_status_extension_id ON autobolt_extension_status(extension_id);
CREATE INDEX idx_processing_history_customer_id ON autobolt_processing_history(customer_id);

-- 5. Enable RLS (Row Level Security)
ALTER TABLE autobolt_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE autobolt_extension_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE autobolt_processing_history ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies (allow service role to access all data)
CREATE POLICY "Service role can access all autobolt data" 
    ON autobolt_processing_queue FOR ALL USING (true);

CREATE POLICY "Service role can access all extension status" 
    ON autobolt_extension_status FOR ALL USING (true);

CREATE POLICY "Service role can access all processing history" 
    ON autobolt_processing_history FOR ALL USING (true);

-- 7. Test the tables
SELECT 'AutoBolt tables created successfully!' as message;
