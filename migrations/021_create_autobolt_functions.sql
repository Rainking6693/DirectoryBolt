-- 021_create_autobolt_functions.sql
-- Critical AutoBolt functions for API endpoints
-- This migration adds the missing database functions that are causing 503 errors

-- First, ensure the AutoBolt tables exist
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, queue_id, directory_name)
);

-- Critical function for getting the next job in queue
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

-- Critical function for staff dashboard progress monitoring
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

-- Function for completing AutoBolt jobs
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
    
    RETURN job_exists;
END;
$$ LANGUAGE plpgsql;

-- Function for updating job progress
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_autobolt_queue_status ON autobolt_processing_queue(status);
CREATE INDEX IF NOT EXISTS idx_autobolt_queue_priority ON autobolt_processing_queue(priority_level);
CREATE INDEX IF NOT EXISTS idx_directory_submissions_queue_id ON directory_submissions(queue_id);
CREATE INDEX IF NOT EXISTS idx_directory_submissions_status ON directory_submissions(submission_status);

-- Enable RLS if not already enabled
ALTER TABLE autobolt_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'autobolt_processing_queue' 
        AND policyname = 'Service role can access all autobolt data'
    ) THEN
        CREATE POLICY "Service role can access all autobolt data" ON autobolt_processing_queue FOR ALL USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'directory_submissions' 
        AND policyname = 'Service role can access all directory submissions'
    ) THEN
        CREATE POLICY "Service role can access all directory submissions" ON directory_submissions FOR ALL USING (true);
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'AutoBolt functions created successfully - API endpoints should now work';
END $$;