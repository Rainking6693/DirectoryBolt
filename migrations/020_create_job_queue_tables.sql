-- DirectoryBolt Job Queue System - Phase 1 Database Schema
-- Purpose: Create robust job queue system for AutoBolt Chrome extension
-- Date: 2025-09-22
-- Agent: Shane (Backend Developer)

-- Create jobs table for tracking AutoBolt processing jobs
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Job Identification
    customer_id VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    
    -- Package & Processing Details
    package_type VARCHAR(50) NOT NULL CHECK (package_type IN ('starter', 'growth', 'professional', 'enterprise')),
    directory_limit INTEGER NOT NULL DEFAULT 50,
    priority_level INTEGER NOT NULL DEFAULT 4,
    
    -- Job Status & Lifecycle
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'in_progress', 'completed', 'failed', 'paused', 'cancelled')
    ),
    
    -- Processing Metadata
    directories_to_process INTEGER NOT NULL DEFAULT 0,
    directories_completed INTEGER NOT NULL DEFAULT 0,
    directories_failed INTEGER NOT NULL DEFAULT 0,
    
    -- Business Data for AutoBolt Processing
    business_data JSONB NOT NULL DEFAULT '{}', -- {businessName, website, phone, address, description, etc.}
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Processing Details
    assigned_to VARCHAR(100), -- AutoBolt extension ID
    estimated_completion TIMESTAMP WITH TIME ZONE,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    
    -- Error Handling
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    
    -- Metadata for extensibility
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create job_results table for tracking individual directory submissions
CREATE TABLE IF NOT EXISTS job_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Link to parent job
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    customer_id VARCHAR(50) NOT NULL,
    
    -- Directory Information
    directory_name VARCHAR(255) NOT NULL,
    directory_url VARCHAR(500),
    directory_category VARCHAR(100),
    directory_tier VARCHAR(50) DEFAULT 'standard' CHECK (directory_tier IN ('standard', 'premium', 'enterprise')),
    
    -- Submission Details
    submission_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (
        submission_status IN ('pending', 'processing', 'submitted', 'approved', 'rejected', 'failed', 'skipped')
    ),
    
    -- Result Data
    listing_url VARCHAR(500),
    submission_result TEXT,
    approval_status VARCHAR(50),
    rejection_reason TEXT,
    
    -- Quality Metrics
    domain_authority INTEGER,
    estimated_traffic INTEGER,
    submission_score DECIMAL(3,1), -- 1.0 to 10.0 rating
    
    -- Timing Information
    processing_time_seconds INTEGER,
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Error Handling
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Performance Indexes for jobs table
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_package_type ON jobs(package_type);
CREATE INDEX IF NOT EXISTS idx_jobs_priority_level ON jobs(priority_level);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_to ON jobs(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_status_priority ON jobs(status, priority_level) WHERE status IN ('pending', 'in_progress');

-- Performance Indexes for job_results table
CREATE INDEX IF NOT EXISTS idx_job_results_job_id ON job_results(job_id);
CREATE INDEX IF NOT EXISTS idx_job_results_customer_id ON job_results(customer_id);
CREATE INDEX IF NOT EXISTS idx_job_results_submission_status ON job_results(submission_status);
CREATE INDEX IF NOT EXISTS idx_job_results_directory_name ON job_results(directory_name);
CREATE INDEX IF NOT EXISTS idx_job_results_created_at ON job_results(created_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_jobs_queue_order ON jobs(status, priority_level, created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_job_results_job_status ON job_results(job_id, submission_status);

-- GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_jobs_business_data_gin ON jobs USING GIN (business_data);
CREATE INDEX IF NOT EXISTS idx_jobs_metadata_gin ON jobs USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_job_results_metadata_gin ON job_results USING GIN (metadata);

-- Create or update the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_results_updated_at 
    BEFORE UPDATE ON job_results 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate job progress
CREATE OR REPLACE FUNCTION calculate_job_progress(job_id_param UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_directories INTEGER;
    completed_directories INTEGER;
    progress DECIMAL(5,2);
BEGIN
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE submission_status IN ('submitted', 'approved'))
    INTO total_directories, completed_directories
    FROM job_results 
    WHERE job_id = job_id_param;
    
    IF total_directories = 0 THEN
        RETURN 0.00;
    END IF;
    
    progress := ROUND((completed_directories::DECIMAL / total_directories) * 100, 2);
    
    -- Update the jobs table with calculated progress
    UPDATE jobs 
    SET 
        progress_percentage = progress,
        directories_completed = completed_directories
    WHERE id = job_id_param;
    
    RETURN progress;
END;
$$ LANGUAGE plpgsql;

-- Function to get next job in queue (for AutoBolt API)
CREATE OR REPLACE FUNCTION get_next_job_in_queue()
RETURNS TABLE (
    job_id UUID,
    customer_id VARCHAR,
    customer_name VARCHAR,
    customer_email VARCHAR,
    package_type VARCHAR,
    directory_limit INTEGER,
    business_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id as job_id,
        j.customer_id,
        j.customer_name,
        j.customer_email,
        j.package_type,
        j.directory_limit,
        j.business_data,
        j.created_at
    FROM jobs j
    WHERE j.status = 'pending'
    ORDER BY 
        j.priority_level ASC,  -- Lower number = higher priority
        j.created_at ASC       -- First come, first served within priority
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to mark job as in progress
CREATE OR REPLACE FUNCTION mark_job_in_progress(job_id_param UUID, extension_id VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE jobs 
    SET 
        status = 'in_progress',
        started_at = NOW(),
        assigned_to = extension_id,
        updated_at = NOW()
    WHERE id = job_id_param AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to complete job
CREATE OR REPLACE FUNCTION complete_job(job_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
    job_progress DECIMAL(5,2);
BEGIN
    -- Calculate final progress
    SELECT calculate_job_progress(job_id_param) INTO job_progress;
    
    -- Mark job as completed
    UPDATE jobs 
    SET 
        status = 'completed',
        completed_at = NOW(),
        progress_percentage = 100.00,
        updated_at = NOW()
    WHERE id = job_id_param AND status = 'in_progress';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get job statistics for dashboard
CREATE OR REPLACE FUNCTION get_job_queue_stats()
RETURNS TABLE (
    total_pending INTEGER,
    total_in_progress INTEGER,
    total_completed INTEGER,
    total_failed INTEGER,
    avg_processing_time_minutes DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) FILTER (WHERE status = 'pending')::INTEGER as total_pending,
        COUNT(*) FILTER (WHERE status = 'in_progress')::INTEGER as total_in_progress,
        COUNT(*) FILTER (WHERE status = 'completed')::INTEGER as total_completed,
        COUNT(*) FILTER (WHERE status = 'failed')::INTEGER as total_failed,
        ROUND(
            AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 60) 
            FILTER (WHERE status = 'completed' AND started_at IS NOT NULL), 2
        ) as avg_processing_time_minutes
    FROM jobs;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_results ENABLE ROW LEVEL SECURITY;

-- Allow service role to access all data
CREATE POLICY "Service role can access all jobs" ON jobs FOR ALL USING (true);
CREATE POLICY "Service role can access all job results" ON job_results FOR ALL USING (true);

-- Comments for documentation
COMMENT ON TABLE jobs IS 'Main job queue table for AutoBolt processing with DirectoryBolt customer data';
COMMENT ON TABLE job_results IS 'Individual directory submission results for each job';
COMMENT ON COLUMN jobs.priority_level IS 'Priority level (1=highest, 4=lowest) based on package type';
COMMENT ON COLUMN jobs.business_data IS 'Customer business information for directory submissions';
COMMENT ON COLUMN job_results.submission_score IS 'Quality score for submission (1.0-10.0)';
COMMENT ON FUNCTION get_next_job_in_queue() IS 'Returns the next job in queue ordered by priority and creation time';