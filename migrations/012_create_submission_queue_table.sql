-- Migration: Create Submission Queue Table
-- Purpose: Advanced queue system for directory submission processing with priority and batch support
-- Date: 2025-09-05
-- Phase: 2.1 Database Schema Enhancement

-- Create submission_queue table for processing management
CREATE TABLE IF NOT EXISTS submission_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Customer & Directory References
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    directory_id UUID NOT NULL REFERENCES directories(id) ON DELETE CASCADE,
    batch_id UUID, -- For grouping related submissions
    
    -- Submission Data
    business_data JSONB NOT NULL DEFAULT '{}', -- Business information for this specific submission
    submission_data JSONB NOT NULL DEFAULT '{}', -- Directory-specific form data and requirements
    
    -- Status Tracking
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (
        status IN (
            'pending',      -- Queued for processing
            'processing',   -- Currently being processed
            'completed',    -- Successfully submitted
            'failed',       -- Failed to submit
            'paused',       -- Temporarily paused
            'cancelled',    -- User cancelled
            'retry_needed', -- Needs retry
            'manual_review' -- Requires manual intervention
        )
    ),
    
    -- Priority & Scheduling
    priority INTEGER NOT NULL DEFAULT 3 CHECK (priority >= 1 AND priority <= 5), -- 1=highest, 5=lowest
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Progress Tracking
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    current_step VARCHAR(100), -- Current processing step (e.g., 'form_filling', 'captcha_solving', 'submission')
    estimated_completion_time TIMESTAMP WITH TIME ZONE,
    processing_time_seconds INTEGER, -- Actual time taken to complete
    
    -- Retry Logic
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    retry_delay_seconds INTEGER DEFAULT 300, -- 5 minutes default delay
    
    -- Results & Feedback
    result_data JSONB DEFAULT '{}', -- Success/failure details, submission IDs, screenshots, etc.
    error_message TEXT,
    error_code VARCHAR(50),
    external_submission_id VARCHAR(255), -- ID from the directory's system
    
    -- Processing Context
    worker_id VARCHAR(100), -- ID of the worker/process handling this item
    processing_node VARCHAR(100), -- Server/node processing this item
    automation_method VARCHAR(50) DEFAULT 'chrome_extension' CHECK (
        automation_method IN ('chrome_extension', 'api', 'manual', 'headless_browser')
    ),
    
    -- Quality & Verification
    requires_verification BOOLEAN DEFAULT false,
    verification_status VARCHAR(30) CHECK (
        verification_status IN ('not_required', 'pending', 'passed', 'failed') OR verification_status IS NULL
    ),
    screenshot_url VARCHAR(500), -- URL to submission screenshot
    proof_data JSONB DEFAULT '{}', -- Additional proof of submission
    
    -- Performance Metrics
    queue_wait_time_seconds INTEGER, -- Time spent waiting in queue
    form_complexity_score INTEGER DEFAULT 1 CHECK (form_complexity_score >= 1 AND form_complexity_score <= 10),
    captcha_encountered BOOLEAN DEFAULT false,
    manual_intervention_required BOOLEAN DEFAULT false,
    
    -- Audit & Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'
);

-- Create strategic indexes for queue processing performance
CREATE INDEX IF NOT EXISTS idx_submission_queue_status ON submission_queue(status);
CREATE INDEX IF NOT EXISTS idx_submission_queue_priority_scheduled ON submission_queue(priority, scheduled_for) WHERE status IN ('pending', 'retry_needed');
CREATE INDEX IF NOT EXISTS idx_submission_queue_customer_id ON submission_queue(customer_id);
CREATE INDEX IF NOT EXISTS idx_submission_queue_directory_id ON submission_queue(directory_id);
CREATE INDEX IF NOT EXISTS idx_submission_queue_batch_id ON submission_queue(batch_id) WHERE batch_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_submission_queue_scheduled_for ON submission_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_submission_queue_next_retry ON submission_queue(next_retry_at) WHERE next_retry_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_submission_queue_created_at ON submission_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_submission_queue_worker_id ON submission_queue(worker_id) WHERE worker_id IS NOT NULL;

-- Composite indexes for queue processing queries
CREATE INDEX IF NOT EXISTS idx_submission_queue_processing ON submission_queue(status, priority, scheduled_for) 
    WHERE status IN ('pending', 'retry_needed');
CREATE INDEX IF NOT EXISTS idx_submission_queue_customer_status ON submission_queue(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_submission_queue_directory_status ON submission_queue(directory_id, status);
CREATE INDEX IF NOT EXISTS idx_submission_queue_verification ON submission_queue(requires_verification, verification_status) 
    WHERE requires_verification = true;

-- GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_submission_queue_business_data_gin ON submission_queue USING GIN (business_data);
CREATE INDEX IF NOT EXISTS idx_submission_queue_submission_data_gin ON submission_queue USING GIN (submission_data);
CREATE INDEX IF NOT EXISTS idx_submission_queue_result_data_gin ON submission_queue USING GIN (result_data);
CREATE INDEX IF NOT EXISTS idx_submission_queue_metadata_gin ON submission_queue USING GIN (metadata);

-- Create trigger for updated_at
CREATE TRIGGER update_submission_queue_updated_at 
    BEFORE UPDATE ON submission_queue 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create batch_submissions table for tracking bulk operations
CREATE TABLE IF NOT EXISTS batch_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Customer & Configuration
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    batch_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Batch Status & Progress
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'paused')
    ),
    total_items INTEGER NOT NULL DEFAULT 0,
    completed_items INTEGER NOT NULL DEFAULT 0,
    failed_items INTEGER NOT NULL DEFAULT 0,
    pending_items INTEGER NOT NULL DEFAULT 0,
    
    -- Processing Configuration
    max_concurrent_items INTEGER DEFAULT 5,
    retry_failed_items BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    
    -- Timing & Scheduling
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    estimated_completion_time TIMESTAMP WITH TIME ZONE,
    
    -- Progress Tracking
    progress_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    current_processing_item_id UUID,
    
    -- Results Summary
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    average_processing_time_seconds INTEGER,
    total_processing_time_seconds INTEGER,
    
    -- Configuration & Rules
    processing_rules JSONB DEFAULT '{}', -- Custom processing rules and preferences
    notification_settings JSONB DEFAULT '{
        "notify_on_completion": true,
        "notify_on_failure": true,
        "email_summary": true
    }',
    
    -- Error Handling
    error_message TEXT,
    stop_on_error BOOLEAN DEFAULT false,
    
    -- Audit & Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}'
);

-- Add foreign key for batch_id in submission_queue
ALTER TABLE submission_queue 
ADD CONSTRAINT fk_submission_queue_batch_id 
FOREIGN KEY (batch_id) REFERENCES batch_submissions(id) ON DELETE SET NULL;

-- Create indexes for batch_submissions
CREATE INDEX IF NOT EXISTS idx_batch_submissions_customer_id ON batch_submissions(customer_id);
CREATE INDEX IF NOT EXISTS idx_batch_submissions_status ON batch_submissions(status);
CREATE INDEX IF NOT EXISTS idx_batch_submissions_scheduled_for ON batch_submissions(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_batch_submissions_created_at ON batch_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_batch_submissions_progress ON batch_submissions(progress_percentage) WHERE progress_percentage < 100;

-- GIN indexes for batch_submissions JSONB fields
CREATE INDEX IF NOT EXISTS idx_batch_submissions_processing_rules_gin ON batch_submissions USING GIN (processing_rules);
CREATE INDEX IF NOT EXISTS idx_batch_submissions_metadata_gin ON batch_submissions USING GIN (metadata);

-- Create trigger for batch_submissions updated_at
CREATE TRIGGER update_batch_submissions_updated_at 
    BEFORE UPDATE ON batch_submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to update batch progress automatically
CREATE OR REPLACE FUNCTION update_batch_progress()
RETURNS TRIGGER AS $$
BEGIN
    -- Update batch statistics when a queue item status changes
    IF NEW.batch_id IS NOT NULL AND (TG_OP = 'UPDATE' OR TG_OP = 'INSERT') THEN
        UPDATE batch_submissions 
        SET 
            completed_items = (
                SELECT COUNT(*) 
                FROM submission_queue 
                WHERE batch_id = NEW.batch_id AND status = 'completed'
            ),
            failed_items = (
                SELECT COUNT(*) 
                FROM submission_queue 
                WHERE batch_id = NEW.batch_id AND status IN ('failed', 'cancelled')
            ),
            pending_items = (
                SELECT COUNT(*) 
                FROM submission_queue 
                WHERE batch_id = NEW.batch_id AND status IN ('pending', 'processing', 'retry_needed')
            ),
            progress_percentage = ROUND(
                (SELECT COUNT(*)::numeric FROM submission_queue 
                 WHERE batch_id = NEW.batch_id AND status IN ('completed', 'failed', 'cancelled')) / 
                NULLIF(total_items, 0) * 100, 2
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.batch_id;
        
        -- Update batch status if all items are completed
        UPDATE batch_submissions 
        SET 
            status = CASE 
                WHEN pending_items = 0 AND failed_items = 0 THEN 'completed'
                WHEN pending_items = 0 AND failed_items > 0 THEN 'failed'
                ELSE status
            END,
            completed_at = CASE 
                WHEN pending_items = 0 THEN CURRENT_TIMESTAMP
                ELSE completed_at
            END
        WHERE id = NEW.batch_id AND status IN ('processing', 'pending');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_batch_progress
    AFTER INSERT OR UPDATE OF status ON submission_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_batch_progress();

-- Create function to calculate queue wait time
CREATE OR REPLACE FUNCTION calculate_queue_wait_time()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate queue wait time when processing starts
    IF OLD.status != 'processing' AND NEW.status = 'processing' THEN
        NEW.queue_wait_time_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - NEW.created_at))::INTEGER;
        NEW.started_at = CURRENT_TIMESTAMP;
    END IF;
    
    -- Calculate processing time when completed
    IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
        NEW.completed_at = CURRENT_TIMESTAMP;
        IF NEW.started_at IS NOT NULL THEN
            NEW.processing_time_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - NEW.started_at))::INTEGER;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_queue_wait_time
    BEFORE UPDATE ON submission_queue
    FOR EACH ROW
    EXECUTE FUNCTION calculate_queue_wait_time();

-- Create views for queue monitoring and analytics
CREATE OR REPLACE VIEW queue_dashboard AS
SELECT 
    sq.id,
    sq.status,
    sq.priority,
    sq.scheduled_for,
    sq.progress_percentage,
    sq.current_step,
    c.email as customer_email,
    c.company_name,
    c.subscription_tier,
    d.name as directory_name,
    d.category_id,
    sq.retry_count,
    sq.automation_method,
    sq.requires_verification,
    sq.verification_status,
    sq.created_at,
    sq.estimated_completion_time,
    -- Calculate estimated time remaining
    CASE 
        WHEN sq.estimated_completion_time IS NOT NULL THEN
            EXTRACT(EPOCH FROM (sq.estimated_completion_time - CURRENT_TIMESTAMP))::INTEGER
        ELSE NULL
    END as seconds_remaining
FROM submission_queue sq
JOIN customers c ON sq.customer_id = c.id
JOIN directories d ON sq.directory_id = d.id;

CREATE OR REPLACE VIEW queue_analytics AS
SELECT 
    DATE_TRUNC('hour', created_at) as hour,
    status,
    COUNT(*) as item_count,
    AVG(processing_time_seconds) as avg_processing_time,
    AVG(queue_wait_time_seconds) as avg_wait_time,
    COUNT(*) FILTER (WHERE requires_verification = true) as verification_required_count,
    COUNT(*) FILTER (WHERE captcha_encountered = true) as captcha_count,
    COUNT(*) FILTER (WHERE manual_intervention_required = true) as manual_intervention_count
FROM submission_queue
WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), status
ORDER BY hour DESC, status;

-- Add comprehensive comments
COMMENT ON TABLE submission_queue IS 'Advanced queue system for directory submission processing with priority, batch support, and detailed tracking';
COMMENT ON TABLE batch_submissions IS 'Batch processing management for bulk directory submissions with progress tracking';
COMMENT ON VIEW queue_dashboard IS 'Real-time queue monitoring dashboard with customer and directory details';
COMMENT ON VIEW queue_analytics IS 'Queue performance analytics with processing times and metrics';

COMMENT ON COLUMN submission_queue.business_data IS 'Business information specific to this submission';
COMMENT ON COLUMN submission_queue.submission_data IS 'Directory-specific form data and requirements';
COMMENT ON COLUMN submission_queue.priority IS 'Processing priority (1=highest, 5=lowest)';
COMMENT ON COLUMN submission_queue.progress_percentage IS 'Current processing progress (0-100)';
COMMENT ON COLUMN submission_queue.retry_count IS 'Number of retry attempts made';
COMMENT ON COLUMN submission_queue.automation_method IS 'Method used for submission (chrome_extension, api, etc.)';
COMMENT ON COLUMN submission_queue.verification_status IS 'Manual verification status if required';
COMMENT ON COLUMN submission_queue.screenshot_url IS 'URL to submission proof screenshot';
COMMENT ON COLUMN submission_queue.form_complexity_score IS 'Difficulty score for the form (1-10)';

COMMENT ON COLUMN batch_submissions.max_concurrent_items IS 'Maximum items to process simultaneously';
COMMENT ON COLUMN batch_submissions.processing_rules IS 'Custom rules and preferences for batch processing';
COMMENT ON COLUMN batch_submissions.success_rate IS 'Percentage of successful submissions in batch';