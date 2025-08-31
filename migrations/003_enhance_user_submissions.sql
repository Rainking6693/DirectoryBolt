-- Migration: Enhanced User Submissions Table
-- Purpose: Improve submission tracking with batch processing and detailed status
-- Date: 2025-08-31

-- First check if user_submissions table exists, if not create it
CREATE TABLE IF NOT EXISTS user_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Will be foreign key to users table when created
    business_name VARCHAR(255) NOT NULL,
    business_description TEXT,
    business_url VARCHAR(500) NOT NULL,
    business_email VARCHAR(255) NOT NULL,
    business_phone VARCHAR(50),
    business_address TEXT,
    business_category VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns for enhanced tracking
ALTER TABLE user_submissions 
ADD COLUMN IF NOT EXISTS directory_id UUID REFERENCES directories(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS submission_status VARCHAR(30) DEFAULT 'pending' CHECK (
    submission_status IN ('pending', 'in_progress', 'submitted', 'approved', 'rejected', 'needs_review', 'cancelled', 'failed')
),
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS batch_id UUID, -- For tracking bulk submissions
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5), -- 1=highest, 5=lowest
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_retries INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS external_submission_id VARCHAR(255), -- ID from the directory's system
ADD COLUMN IF NOT EXISTS submission_data JSONB DEFAULT '{}', -- Store form data specific to directory
ADD COLUMN IF NOT EXISTS response_data JSONB DEFAULT '{}', -- Store response from directory
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'; -- Additional metadata

-- Update existing records to have default values for new columns
UPDATE user_submissions 
SET submission_status = 'pending' 
WHERE submission_status IS NULL;

-- Create indexes for enhanced performance
CREATE INDEX IF NOT EXISTS idx_user_submissions_user_id ON user_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_submissions_directory_id ON user_submissions(directory_id);
CREATE INDEX IF NOT EXISTS idx_user_submissions_status ON user_submissions(submission_status);
CREATE INDEX IF NOT EXISTS idx_user_submissions_batch_id ON user_submissions(batch_id);
CREATE INDEX IF NOT EXISTS idx_user_submissions_created_at ON user_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_submissions_submitted_at ON user_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_submissions_user_status ON user_submissions(user_id, submission_status);
CREATE INDEX IF NOT EXISTS idx_user_submissions_directory_status ON user_submissions(directory_id, submission_status);
CREATE INDEX IF NOT EXISTS idx_user_submissions_batch_status ON user_submissions(batch_id, submission_status);
CREATE INDEX IF NOT EXISTS idx_user_submissions_retry ON user_submissions(next_retry_at) WHERE next_retry_at IS NOT NULL;

-- GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_user_submissions_data_gin ON user_submissions USING GIN (submission_data);
CREATE INDEX IF NOT EXISTS idx_user_submissions_response_gin ON user_submissions USING GIN (response_data);
CREATE INDEX IF NOT EXISTS idx_user_submissions_metadata_gin ON user_submissions USING GIN (metadata);

-- Create trigger for updated_at
CREATE TRIGGER update_user_submissions_updated_at 
    BEFORE UPDATE ON user_submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create batch_submissions table for tracking bulk operations
CREATE TABLE IF NOT EXISTS batch_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- Foreign key to users table
    batch_name VARCHAR(255),
    total_submissions INTEGER NOT NULL DEFAULT 0,
    successful_submissions INTEGER NOT NULL DEFAULT 0,
    failed_submissions INTEGER NOT NULL DEFAULT 0,
    pending_submissions INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(30) DEFAULT 'pending' CHECK (
        status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'paused')
    ),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    progress_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    error_message TEXT,
    configuration JSONB DEFAULT '{}', -- Batch processing configuration
    results_summary JSONB DEFAULT '{}', -- Summary of results
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for batch_submissions
CREATE INDEX IF NOT EXISTS idx_batch_submissions_user_id ON batch_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_submissions_status ON batch_submissions(status);
CREATE INDEX IF NOT EXISTS idx_batch_submissions_created_at ON batch_submissions(created_at DESC);

-- Trigger for batch_submissions updated_at
CREATE TRIGGER update_batch_submissions_updated_at 
    BEFORE UPDATE ON batch_submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraint for batch_id after creating batch_submissions table
ALTER TABLE user_submissions 
ADD CONSTRAINT fk_user_submissions_batch_id 
FOREIGN KEY (batch_id) REFERENCES batch_submissions(id) ON DELETE SET NULL;

-- Create view for submission analytics
CREATE OR REPLACE VIEW submission_analytics AS
SELECT 
    d.name as directory_name,
    d.category_id,
    c.display_name as category_name,
    COUNT(*) as total_submissions,
    COUNT(*) FILTER (WHERE us.submission_status = 'approved') as approved_count,
    COUNT(*) FILTER (WHERE us.submission_status = 'rejected') as rejected_count,
    COUNT(*) FILTER (WHERE us.submission_status = 'pending') as pending_count,
    ROUND(
        COUNT(*) FILTER (WHERE us.submission_status = 'approved')::numeric / 
        NULLIF(COUNT(*) FILTER (WHERE us.submission_status IN ('approved', 'rejected')), 0) * 100, 
        2
    ) as success_rate_percentage,
    AVG(EXTRACT(EPOCH FROM (us.approved_at - us.submitted_at))/86400) as avg_approval_days
FROM user_submissions us
JOIN directories d ON us.directory_id = d.id
JOIN categories c ON d.category_id = c.id
WHERE us.submission_status IN ('approved', 'rejected', 'pending')
GROUP BY d.id, d.name, d.category_id, c.display_name;

-- Add comprehensive comments
COMMENT ON TABLE user_submissions IS 'Enhanced user submissions with batch processing and detailed status tracking';
COMMENT ON TABLE batch_submissions IS 'Batch processing tracking for bulk directory submissions';
COMMENT ON VIEW submission_analytics IS 'Analytics view for submission performance by directory and category';
COMMENT ON COLUMN user_submissions.directory_id IS 'Reference to the specific directory for this submission';
COMMENT ON COLUMN user_submissions.submission_status IS 'Current status of the submission';
COMMENT ON COLUMN user_submissions.batch_id IS 'Reference to batch if part of bulk submission';
COMMENT ON COLUMN user_submissions.priority IS 'Submission priority (1=highest, 5=lowest)';
COMMENT ON COLUMN user_submissions.retry_count IS 'Number of retry attempts made';
COMMENT ON COLUMN user_submissions.submission_data IS 'Directory-specific form data as JSON';
COMMENT ON COLUMN user_submissions.response_data IS 'Response from directory system as JSON';