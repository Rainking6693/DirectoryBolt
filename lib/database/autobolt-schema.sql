-- AutoBolt Integration Schema
-- Tables for managing AutoBolt Chrome extension processing

-- AutoBolt Processing Queue
-- Tracks customers that have been manually pushed to AutoBolt for processing
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

-- Directory Submissions Tracking
-- Tracks individual directory submissions for each customer
CREATE TABLE IF NOT EXISTS directory_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    queue_id UUID REFERENCES autobolt_processing_queue(id),
    directory_name VARCHAR(255) NOT NULL,
    directory_url VARCHAR(500),
    directory_category VARCHAR(100),
    directory_tier VARCHAR(50) DEFAULT 'standard' CHECK (directory_tier IN ('standard', 'premium', 'enterprise')),
    submission_status VARCHAR(50) DEFAULT 'pending' CHECK (submission_status IN ('pending', 'submitted', 'approved', 'rejected', 'processing', 'failed')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    listing_url VARCHAR(500),
    rejection_reason TEXT,
    domain_authority INTEGER,
    estimated_traffic INTEGER,
    processing_time_seconds INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AutoBolt Extension Status
-- Tracks the status of the AutoBolt Chrome extension
CREATE TABLE IF NOT EXISTS autobolt_extension_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    extension_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'processing', 'error')),
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_customer_id VARCHAR(50),
    current_queue_id UUID REFERENCES autobolt_processing_queue(id),
    processing_started_at TIMESTAMP WITH TIME ZONE,
    directories_processed INTEGER DEFAULT 0,
    directories_failed INTEGER DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Processing History
-- Tracks the history of AutoBolt processing sessions
CREATE TABLE IF NOT EXISTS autobolt_processing_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    queue_id UUID REFERENCES autobolt_processing_queue(id),
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

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_autobolt_queue_customer_id ON autobolt_processing_queue(customer_id);
CREATE INDEX IF NOT EXISTS idx_autobolt_queue_status ON autobolt_processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_autobolt_queue_priority ON autobolt_processing_queue(priority_level);
CREATE INDEX IF NOT EXISTS idx_autobolt_queue_created_at ON autobolt_processing_queue(created_at);

CREATE INDEX IF NOT EXISTS idx_directory_submissions_customer_id ON directory_submissions(customer_id);
CREATE INDEX IF NOT EXISTS idx_directory_submissions_queue_id ON directory_submissions(queue_id);
CREATE INDEX IF NOT EXISTS idx_directory_submissions_status ON directory_submissions(submission_status);

CREATE INDEX IF NOT EXISTS idx_extension_status_extension_id ON autobolt_extension_status(extension_id);
CREATE INDEX IF NOT EXISTS idx_extension_status_status ON autobolt_extension_status(status);

CREATE INDEX IF NOT EXISTS idx_processing_history_customer_id ON autobolt_processing_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_processing_history_queue_id ON autobolt_processing_history(queue_id);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_autobolt_queue_updated_at BEFORE UPDATE ON autobolt_processing_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_directory_submissions_updated_at BEFORE UPDATE ON directory_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_extension_status_updated_at BEFORE UPDATE ON autobolt_extension_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies (Row Level Security)
ALTER TABLE autobolt_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE autobolt_extension_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE autobolt_processing_history ENABLE ROW LEVEL SECURITY;

-- Allow service role to access all data
CREATE POLICY "Service role can access all autobolt data" ON autobolt_processing_queue FOR ALL USING (true);
CREATE POLICY "Service role can access all directory submissions" ON directory_submissions FOR ALL USING (true);
CREATE POLICY "Service role can access all extension status" ON autobolt_extension_status FOR ALL USING (true);
CREATE POLICY "Service role can access all processing history" ON autobolt_processing_history FOR ALL USING (true);

-- Helper functions
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

CREATE OR REPLACE FUNCTION get_customer_progress(customer_id_param VARCHAR)
RETURNS TABLE (
    customer_id VARCHAR,
    total_directories INTEGER,
    completed_directories INTEGER,
    failed_directories INTEGER,
    success_rate DECIMAL,
    estimated_completion TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ds.customer_id,
        COUNT(*)::INTEGER as total_directories,
        COUNT(*) FILTER (WHERE ds.submission_status = 'approved')::INTEGER as completed_directories,
        COUNT(*) FILTER (WHERE ds.submission_status = 'failed')::INTEGER as failed_directories,
        ROUND(
            (COUNT(*) FILTER (WHERE ds.submission_status = 'approved')::DECIMAL / COUNT(*)) * 100, 2
        ) as success_rate,
        NOW() + INTERVAL '1 hour' * (COUNT(*) - COUNT(*) FILTER (WHERE ds.submission_status = 'approved')) as estimated_completion
    FROM directory_submissions ds
    WHERE ds.customer_id = customer_id_param
    GROUP BY ds.customer_id;
END;
$$ LANGUAGE plpgsql;

-- Critical functions for AutoBolt API endpoints
CREATE OR REPLACE FUNCTION get_next_job_in_queue()
RETURNS TABLE (
    id UUID,
    customer_id VARCHAR,
    business_name VARCHAR,
    email VARCHAR,
    package_type VARCHAR,
    directory_limit INTEGER,
    priority_level INTEGER,
    status VARCHAR,
    action VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
) AS $$
DECLARE
    job_record RECORD;
BEGIN
    -- Get the highest priority queued job
    SELECT * INTO job_record
    FROM autobolt_processing_queue 
    WHERE status = 'queued'
    ORDER BY priority_level DESC, created_at ASC
    LIMIT 1;
    
    IF job_record.id IS NOT NULL THEN
        -- Update status to processing
        UPDATE autobolt_processing_queue 
        SET status = 'processing', 
            started_at = NOW(),
            updated_at = NOW()
        WHERE id = job_record.id;
        
        -- Return the job
        RETURN QUERY
        SELECT 
            job_record.id,
            job_record.customer_id,
            job_record.business_name,
            job_record.email,
            job_record.package_type,
            job_record.directory_limit,
            job_record.priority_level,
            'processing'::VARCHAR as status,
            job_record.action,
            job_record.created_at,
            job_record.metadata;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_job_progress_for_staff()
RETURNS TABLE (
    queue_id UUID,
    customer_id VARCHAR,
    business_name VARCHAR,
    status VARCHAR,
    priority_level INTEGER,
    total_directories INTEGER,
    completed_directories INTEGER,
    failed_directories INTEGER,
    progress_percentage DECIMAL,
    estimated_completion TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        apq.id as queue_id,
        apq.customer_id,
        apq.business_name,
        apq.status,
        apq.priority_level,
        apq.directory_limit as total_directories,
        COALESCE(ds_stats.completed_count, 0)::INTEGER as completed_directories,
        COALESCE(ds_stats.failed_count, 0)::INTEGER as failed_directories,
        CASE 
            WHEN apq.directory_limit > 0 THEN
                ROUND((COALESCE(ds_stats.completed_count, 0)::DECIMAL / apq.directory_limit) * 100, 2)
            ELSE 0.00
        END as progress_percentage,
        CASE 
            WHEN apq.status = 'processing' AND ds_stats.completed_count > 0 THEN
                NOW() + INTERVAL '1 minute' * ((apq.directory_limit - COALESCE(ds_stats.completed_count, 0)) * 2)
            ELSE NULL
        END as estimated_completion,
        apq.created_at,
        apq.updated_at
    FROM autobolt_processing_queue apq
    LEFT JOIN (
        SELECT 
            queue_id,
            COUNT(*) FILTER (WHERE submission_status IN ('approved', 'submitted')) as completed_count,
            COUNT(*) FILTER (WHERE submission_status = 'failed') as failed_count
        FROM directory_submissions
        GROUP BY queue_id
    ) ds_stats ON apq.id = ds_stats.queue_id
    WHERE apq.status IN ('queued', 'processing', 'completed', 'failed')
    ORDER BY apq.priority_level DESC, apq.created_at ASC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION complete_autobolt_job(
    job_id_param UUID,
    final_status_param VARCHAR DEFAULT 'completed',
    error_message_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    job_exists BOOLEAN := FALSE;
BEGIN
    -- Check if job exists and update it
    UPDATE autobolt_processing_queue 
    SET 
        status = final_status_param,
        completed_at = NOW(),
        updated_at = NOW(),
        error_message = error_message_param
    WHERE id = job_id_param
    AND status = 'processing';
    
    GET DIAGNOSTICS job_exists = FOUND;
    
    IF job_exists THEN
        -- Insert processing history record
        INSERT INTO autobolt_processing_history (
            queue_id,
            customer_id,
            session_started_at,
            session_completed_at,
            total_directories,
            directories_completed,
            directories_failed,
            status,
            error_message
        )
        SELECT 
            apq.id,
            apq.customer_id,
            apq.started_at,
            NOW(),
            apq.directory_limit,
            COALESCE(ds_stats.completed_count, 0),
            COALESCE(ds_stats.failed_count, 0),
            final_status_param,
            error_message_param
        FROM autobolt_processing_queue apq
        LEFT JOIN (
            SELECT 
                queue_id,
                COUNT(*) FILTER (WHERE submission_status IN ('approved', 'submitted')) as completed_count,
                COUNT(*) FILTER (WHERE submission_status = 'failed') as failed_count
            FROM directory_submissions
            GROUP BY queue_id
        ) ds_stats ON apq.id = ds_stats.queue_id
        WHERE apq.id = job_id_param;
    END IF;
    
    RETURN job_exists;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_job_progress(
    job_id_param UUID,
    directory_name_param VARCHAR,
    submission_status_param VARCHAR,
    listing_url_param VARCHAR DEFAULT NULL,
    error_message_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    queue_record RECORD;
BEGIN
    -- Get queue record
    SELECT customer_id INTO queue_record
    FROM autobolt_processing_queue 
    WHERE id = job_id_param;
    
    IF queue_record.customer_id IS NOT NULL THEN
        -- Insert or update directory submission
        INSERT INTO directory_submissions (
            customer_id,
            queue_id,
            directory_name,
            submission_status,
            listing_url,
            submitted_at,
            error_message
        ) VALUES (
            queue_record.customer_id,
            job_id_param,
            directory_name_param,
            submission_status_param,
            listing_url_param,
            CASE WHEN submission_status_param IN ('submitted', 'approved') THEN NOW() ELSE NULL END,
            error_message_param
        )
        ON CONFLICT (customer_id, queue_id, directory_name) 
        DO UPDATE SET
            submission_status = submission_status_param,
            listing_url = listing_url_param,
            submitted_at = CASE WHEN submission_status_param IN ('submitted', 'approved') THEN NOW() ELSE directory_submissions.submitted_at END,
            error_message = error_message_param,
            updated_at = NOW();
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
