-- DirectoryBolt Database Schema
-- Execute this SQL in your Supabase SQL Editor to create all required tables

-- =========================================
-- TABLE 1: customers
-- =========================================

CREATE TABLE IF NOT EXISTS customers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id VARCHAR(255) UNIQUE NOT NULL,
    business_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    website VARCHAR(255),
    description TEXT,
    facebook VARCHAR(255),
    instagram VARCHAR(255),
    linkedin VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for customers
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_customers_updated_at_trigger ON customers;
CREATE TRIGGER update_customers_updated_at_trigger
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_customers_updated_at();

-- =========================================
-- TABLE 2: jobs
-- =========================================

CREATE TABLE IF NOT EXISTS jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    package_size INTEGER DEFAULT 50,
    priority_level INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'complete', 'failed')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    business_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip VARCHAR(20),
    description TEXT,
    category VARCHAR(100),
    package_type VARCHAR(50) DEFAULT 'starter',
    directory_limit INTEGER DEFAULT 50
);

-- Create updated_at trigger for jobs
DROP TRIGGER IF EXISTS update_jobs_updated_at_trigger ON jobs;
CREATE TRIGGER update_jobs_updated_at_trigger
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_customers_updated_at();

-- =========================================
-- TABLE 3: job_results
-- =========================================

CREATE TABLE IF NOT EXISTS job_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    directory_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) CHECK (status IN ('pending', 'submitted', 'failed', 'retry')),
    directory_url TEXT,
    directory_category VARCHAR(100),
    directory_tier VARCHAR(50),
    listing_url TEXT,
    response_log JSONB,
    submission_result TEXT,
    rejection_reason TEXT,
    processing_time_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger for job_results
DROP TRIGGER IF EXISTS update_job_results_updated_at_trigger ON job_results;
CREATE TRIGGER update_job_results_updated_at_trigger
    BEFORE UPDATE ON job_results
    FOR EACH ROW
    EXECUTE FUNCTION update_customers_updated_at();

-- =========================================
-- TABLE 4: autobolt_submission_logs
-- =========================================

CREATE TABLE IF NOT EXISTS autobolt_submission_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    directory_name VARCHAR(255),
    action VARCHAR(100),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB,
    screenshot_url TEXT,
    success BOOLEAN,
    processing_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_autobolt_logs_job_id ON autobolt_submission_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_autobolt_logs_customer_id ON autobolt_submission_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_autobolt_logs_timestamp ON autobolt_submission_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_autobolt_logs_success ON autobolt_submission_logs(success);

-- =========================================
-- TABLE 5: directory_overrides
-- =========================================

CREATE TABLE IF NOT EXISTS directory_overrides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    directory_id VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    pacing_min_ms INTEGER DEFAULT 800,
    pacing_max_ms INTEGER DEFAULT 2200,
    max_retries INTEGER DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(directory_id)
);

-- Create updated_at trigger for directory_overrides
DROP TRIGGER IF EXISTS update_directory_overrides_updated_at_trigger ON directory_overrides;
CREATE TRIGGER update_directory_overrides_updated_at_trigger
    BEFORE UPDATE ON directory_overrides
    FOR EACH ROW
    EXECUTE FUNCTION update_customers_updated_at();

-- =========================================
-- TABLE 6: Legacy table support (for existing queries)
-- =========================================

-- Create directory_submissions table if it doesn't exist (for backward compatibility)
CREATE TABLE IF NOT EXISTS directory_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    directory_name VARCHAR(255),
    directory_url TEXT,
    directory_category VARCHAR(100),
    directory_tier VARCHAR(50) DEFAULT 'standard' CHECK (directory_tier IN ('standard', 'premium', 'enterprise')),
    status VARCHAR(50) DEFAULT 'pending',
    listing_url TEXT,
    submission_result TEXT,
    processing_time_seconds INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for directory_submissions
CREATE INDEX IF NOT EXISTS idx_directory_submissions_job_id ON directory_submissions(job_id);
CREATE INDEX IF NOT EXISTS idx_directory_submissions_customer_id ON directory_submissions(customer_id);
CREATE INDEX IF NOT EXISTS idx_directory_submissions_status ON directory_submissions(status);

-- Create updated_at trigger for directory_submissions
DROP TRIGGER IF EXISTS update_directory_submissions_updated_at_trigger ON directory_submissions;
CREATE TRIGGER update_directory_submissions_updated_at_trigger
    BEFORE UPDATE ON directory_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_customers_updated_at();

-- =========================================
-- INSERT SAMPLE DATA FOR TESTING
-- =========================================

-- Insert sample customers for testing
INSERT INTO customers (customer_id, business_name, email, phone, website, description, category)
VALUES
    ('CUST-001', 'Test Business LLC', 'test@example.com', '555-0123', 'https://example.com', 'A test business for DirectoryBolt', 'Technology'),
    ('CUST-002', 'Sample Company Inc', 'sample@company.com', '555-0456', 'https://sample.com', 'Sample business description', 'Healthcare')
ON CONFLICT (customer_id) DO NOTHING;

-- Insert sample jobs for testing
INSERT INTO jobs (customer_id, package_size, status, business_name, email, package_type, directory_limit)
SELECT
    c.id,
    50,
    'pending',
    c.business_name,
    c.email,
    'starter',
    50
FROM customers c
WHERE c.customer_id IN ('CUST-001', 'CUST-002')
ON CONFLICT DO NOTHING;

-- Insert sample directory overrides
INSERT INTO directory_overrides (directory_id, enabled, pacing_min_ms, pacing_max_ms, max_retries)
VALUES
    ('google-business', true, 1500, 3500, 2),
    ('yelp', true, 1200, 3000, 2),
    ('facebook-business', true, 1500, 4000, 2)
ON CONFLICT (directory_id) DO NOTHING;

-- =========================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- =========================================

-- Enable RLS on all tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE autobolt_submission_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your authentication requirements)
-- For now, allowing all operations for service role access

-- =========================================
-- CREATE VIEWS FOR EASIER QUERYING
-- =========================================

-- View for job progress with customer details
CREATE OR REPLACE VIEW job_progress_view AS
SELECT
    j.id as job_id,
    j.customer_id,
    j.status as job_status,
    j.created_at as job_created,
    j.started_at as job_started,
    j.completed_at as job_completed,
    c.business_name,
    c.email,
    COUNT(jr.id) as directories_total,
    COUNT(CASE WHEN jr.status = 'submitted' THEN 1 END) as directories_completed,
    COUNT(CASE WHEN jr.status = 'failed' THEN 1 END) as directories_failed
FROM jobs j
LEFT JOIN customers c ON j.customer_id = c.id
LEFT JOIN job_results jr ON j.id = jr.job_id
GROUP BY j.id, j.customer_id, j.status, j.created_at, j.started_at, j.completed_at, c.business_name, c.email;

-- Grant permissions
GRANT SELECT ON job_progress_view TO authenticated;
GRANT SELECT ON job_progress_view TO service_role;

-- =========================================
-- USEFUL QUERIES FOR DEBUGGING
-- =========================================

-- Check if tables exist and have data:
/*
SELECT 'customers' as table_name, COUNT(*) as count FROM customers
UNION ALL
SELECT 'jobs' as table_name, COUNT(*) as count FROM jobs
UNION ALL
SELECT 'job_results' as table_name, COUNT(*) as count FROM job_results
UNION ALL
SELECT 'autobolt_submission_logs' as table_name, COUNT(*) as count FROM autobolt_submission_logs
UNION ALL
SELECT 'directory_overrides' as table_name, COUNT(*) as count FROM directory_overrides;
*/

-- Check for recent errors:
/*
SELECT
    job_id,
    directory_name,
    error_message,
    timestamp
FROM autobolt_submission_logs
WHERE error_message IS NOT NULL
ORDER BY timestamp DESC
LIMIT 10;
*/

-- Check job status distribution:
/*
SELECT
    status,
    COUNT(*) as count
FROM jobs
GROUP BY status;
*/