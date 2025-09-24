-- HUDSON'S APPROVED DATABASE MIGRATION SCRIPT
-- Mission: Rename Emily's tables to specification-compliant names
-- Agent: Shane (Backend Developer)
-- Phase: 1 - Database Schema Migration

-- =============================================================================
-- CRITICAL MIGRATION: AUTOBOLT_PROCESSING_QUEUE → JOBS
-- =============================================================================

-- Step 1: Rename autobolt_processing_queue to jobs
ALTER TABLE autobolt_processing_queue RENAME TO jobs;

-- Step 2: Rename directory_submissions to job_results  
ALTER TABLE directory_submissions RENAME TO job_results;

-- Step 3: Update foreign key column name in job_results
ALTER TABLE job_results RENAME COLUMN queue_id TO job_id;

-- =============================================================================
-- UPDATE INDEXES TO MATCH NEW TABLE NAMES
-- =============================================================================

-- Drop old indexes
DROP INDEX IF EXISTS idx_autobolt_queue_customer_id;
DROP INDEX IF EXISTS idx_autobolt_queue_status;
DROP INDEX IF EXISTS idx_autobolt_queue_priority;
DROP INDEX IF EXISTS idx_autobolt_queue_created_at;
DROP INDEX IF EXISTS idx_directory_submissions_customer_id;
DROP INDEX IF EXISTS idx_directory_submissions_queue_id;
DROP INDEX IF EXISTS idx_directory_submissions_status;

-- Create new indexes with correct names
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_priority ON jobs(priority_level);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_job_results_customer_id ON job_results(customer_id);
CREATE INDEX IF NOT EXISTS idx_job_results_job_id ON job_results(job_id);
CREATE INDEX IF NOT EXISTS idx_job_results_status ON job_results(submission_status);

-- =============================================================================
-- UPDATE DATABASE FUNCTIONS TO USE NEW TABLE NAMES
-- =============================================================================

-- Update get_queue_stats function to use jobs table
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
    FROM jobs;
END;
$$ LANGUAGE plpgsql;

-- Update get_next_job_in_queue function
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
    FROM jobs 
    WHERE status = 'queued'
    ORDER BY priority_level DESC, created_at ASC
    LIMIT 1;
    
    IF job_record.id IS NOT NULL THEN
        -- Update status to processing
        UPDATE jobs 
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

-- Update get_job_progress_for_staff function
CREATE OR REPLACE FUNCTION get_job_progress_for_staff()
RETURNS TABLE (
    job_id UUID,
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
        j.id as job_id,
        j.customer_id,
        j.business_name,
        j.status,
        j.priority_level,
        j.directory_limit as total_directories,
        COALESCE(jr_stats.completed_count, 0)::INTEGER as completed_directories,
        COALESCE(jr_stats.failed_count, 0)::INTEGER as failed_directories,
        CASE 
            WHEN j.directory_limit > 0 THEN
                ROUND((COALESCE(jr_stats.completed_count, 0)::DECIMAL / j.directory_limit) * 100, 2)
            ELSE 0.00
        END as progress_percentage,
        CASE 
            WHEN j.status = 'processing' AND jr_stats.completed_count > 0 THEN
                NOW() + INTERVAL '1 minute' * ((j.directory_limit - COALESCE(jr_stats.completed_count, 0)) * 2)
            ELSE NULL
        END as estimated_completion,
        j.created_at,
        j.updated_at
    FROM jobs j
    LEFT JOIN (
        SELECT 
            job_id,
            COUNT(*) FILTER (WHERE submission_status IN ('approved', 'submitted')) as completed_count,
            COUNT(*) FILTER (WHERE submission_status = 'failed') as failed_count
        FROM job_results
        GROUP BY job_id
    ) jr_stats ON j.id = jr_stats.job_id
    WHERE j.status IN ('queued', 'processing', 'completed', 'failed')
    ORDER BY j.priority_level DESC, j.created_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Update complete_autobolt_job function
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
    UPDATE jobs 
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
            j.id,
            j.customer_id,
            j.started_at,
            NOW(),
            j.directory_limit,
            COALESCE(jr_stats.completed_count, 0),
            COALESCE(jr_stats.failed_count, 0),
            final_status_param,
            error_message_param
        FROM jobs j
        LEFT JOIN (
            SELECT 
                job_id,
                COUNT(*) FILTER (WHERE submission_status IN ('approved', 'submitted')) as completed_count,
                COUNT(*) FILTER (WHERE submission_status = 'failed') as failed_count
            FROM job_results
            GROUP BY job_id
        ) jr_stats ON j.id = jr_stats.job_id
        WHERE j.id = job_id_param;
    END IF;
    
    RETURN job_exists;
END;
$$ LANGUAGE plpgsql;

-- Update update_job_progress function
CREATE OR REPLACE FUNCTION update_job_progress(
    job_id_param UUID,
    directory_name_param VARCHAR,
    submission_status_param VARCHAR,
    listing_url_param VARCHAR DEFAULT NULL,
    error_message_param TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    job_record RECORD;
BEGIN
    -- Get job record
    SELECT customer_id INTO job_record
    FROM jobs 
    WHERE id = job_id_param;
    
    IF job_record.customer_id IS NOT NULL THEN
        -- Insert or update job result
        INSERT INTO job_results (
            customer_id,
            job_id,
            directory_name,
            submission_status,
            listing_url,
            submitted_at,
            error_message
        ) VALUES (
            job_record.customer_id,
            job_id_param,
            directory_name_param,
            submission_status_param,
            listing_url_param,
            CASE WHEN submission_status_param IN ('submitted', 'approved') THEN NOW() ELSE NULL END,
            error_message_param
        )
        ON CONFLICT (customer_id, job_id, directory_name) 
        DO UPDATE SET
            submission_status = submission_status_param,
            listing_url = listing_url_param,
            submitted_at = CASE WHEN submission_status_param IN ('submitted', 'approved') THEN NOW() ELSE job_results.submitted_at END,
            error_message = error_message_param,
            updated_at = NOW();
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- UPDATE TRIGGERS FOR NEW TABLE NAMES
-- =============================================================================

-- Drop old triggers
DROP TRIGGER IF EXISTS update_autobolt_queue_updated_at ON autobolt_processing_queue;
DROP TRIGGER IF EXISTS update_directory_submissions_updated_at ON directory_submissions;

-- Create new triggers
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_results_updated_at 
    BEFORE UPDATE ON job_results 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- UPDATE RLS POLICIES FOR NEW TABLE NAMES
-- =============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Service role can access all autobolt data" ON autobolt_processing_queue;
DROP POLICY IF EXISTS "Service role can access all directory submissions" ON directory_submissions;

-- Create new policies
CREATE POLICY "Service role can access all jobs data" ON jobs FOR ALL USING (true);
CREATE POLICY "Service role can access all job results" ON job_results FOR ALL USING (true);

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Verify tables exist with new names
SELECT 'jobs' as table_name, COUNT(*) as record_count FROM jobs
UNION ALL
SELECT 'job_results' as table_name, COUNT(*) as record_count FROM job_results;

-- Verify functions work
SELECT * FROM get_queue_stats();

-- Verify indexes exist
SELECT indexname, tablename FROM pg_indexes 
WHERE tablename IN ('jobs', 'job_results') 
ORDER BY tablename, indexname;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Log migration completion
INSERT INTO autobolt_processing_history (
    queue_id,
    customer_id,
    session_started_at,
    session_completed_at,
    total_directories,
    directories_completed,
    directories_failed,
    status,
    error_message,
    metadata
) VALUES (
    gen_random_uuid(),
    'MIGRATION-SYSTEM',
    NOW(),
    NOW(),
    0,
    0,
    0,
    'completed',
    'Database migration from autobolt_processing_queue to jobs completed successfully',
    '{"migration_type": "table_rename", "agent": "Shane", "supervisor": "Hudson"}'::jsonb
);

SELECT 'Database migration completed successfully!' as status;