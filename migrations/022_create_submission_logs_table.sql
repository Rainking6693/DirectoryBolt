-- Create submission logs table for tracking worker activity
-- This table stores detailed logs of directory submissions from workers

CREATE TABLE IF NOT EXISTS autobolt_submission_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Job and Customer References
    job_id UUID NOT NULL,
    customer_id VARCHAR(50) NOT NULL,
    
    -- Directory Information
    directory_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'submit', 'captcha_solve', 'form_fill', etc.
    details TEXT NOT NULL, -- Detailed description of what happened
    
    -- Result Information
    success BOOLEAN NOT NULL DEFAULT false,
    screenshot_url TEXT, -- URL to screenshot if available
    processing_time_ms INTEGER, -- Time taken to process this action
    error_message TEXT, -- Error message if failed
    
    -- Timestamps
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_autobolt_submission_logs_job_id ON autobolt_submission_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_autobolt_submission_logs_customer_id ON autobolt_submission_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_autobolt_submission_logs_timestamp ON autobolt_submission_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_autobolt_submission_logs_success ON autobolt_submission_logs(success);

-- Create function to create table if it doesn't exist (for API use)
CREATE OR REPLACE FUNCTION create_submission_logs_table_if_not_exists()
RETURNS void AS $$
BEGIN
    -- This function is called by the API to ensure the table exists
    -- The table creation is handled by the migration above
    -- This is just a placeholder function that always succeeds
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Add comments
COMMENT ON TABLE autobolt_submission_logs IS 'Detailed logs of directory submissions from AutoBolt workers';
COMMENT ON COLUMN autobolt_submission_logs.action IS 'Type of action performed (submit, captcha_solve, form_fill, etc.)';
COMMENT ON COLUMN autobolt_submission_logs.details IS 'Detailed description of what happened during this action';
COMMENT ON COLUMN autobolt_submission_logs.screenshot_url IS 'URL to screenshot taken during this action';
COMMENT ON COLUMN autobolt_submission_logs.processing_time_ms IS 'Time taken to process this action in milliseconds';
