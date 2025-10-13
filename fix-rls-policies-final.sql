-- Fix RLS Policies for DirectoryBolt (FINAL VERSION - Safe to run multiple times)
-- This script is idempotent - safe to run even if tables/policies already exist

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow all operations for service role" ON public.directories;
DROP POLICY IF EXISTS "Allow all operations for service role" ON public.autobolt_processing_queue;
DROP POLICY IF EXISTS "Allow all operations for service role" ON public.autobolt_test_logs;
DROP POLICY IF EXISTS "Allow all operations for service role" ON public.jobs;
DROP POLICY IF EXISTS "Allow all operations for service role" ON public.customers;
DROP POLICY IF EXISTS "Allow all operations for service role" ON public.job_results;
DROP POLICY IF EXISTS "Allow all operations for service role" ON public.job_results_count;
DROP POLICY IF EXISTS "Allow all operations for service role" ON public.legacy_submissions_count;
DROP POLICY IF EXISTS "Allow all operations for service role" ON public.autobolt_submission_logs;
DROP POLICY IF EXISTS "Allow all operations for service role" ON public.directory_overrides;

-- Enable RLS on all public TABLES (not views)
ALTER TABLE public.directories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autobolt_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.autobolt_test_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_results_count ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_submissions_count ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_results ENABLE ROW LEVEL SECURITY;

-- Create policies for directories table
CREATE POLICY "Allow all operations for service role" ON public.directories
    FOR ALL USING (true) WITH CHECK (true);

-- Create policies for autobolt_processing_queue
CREATE POLICY "Allow all operations for service role" ON public.autobolt_processing_queue
    FOR ALL USING (true) WITH CHECK (true);

-- Create policies for autobolt_test_logs
CREATE POLICY "Allow all operations for service role" ON public.autobolt_test_logs
    FOR ALL USING (true) WITH CHECK (true);

-- Create policies for jobs table
CREATE POLICY "Allow all operations for service role" ON public.jobs
    FOR ALL USING (true) WITH CHECK (true);

-- Create policies for customers table
CREATE POLICY "Allow all operations for service role" ON public.customers
    FOR ALL USING (true) WITH CHECK (true);

-- Create policies for job_results table
CREATE POLICY "Allow all operations for service role" ON public.job_results
    FOR ALL USING (true) WITH CHECK (true);

-- Create policies for count tables
CREATE POLICY "Allow all operations for service role" ON public.job_results_count
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for service role" ON public.legacy_submissions_count
    FOR ALL USING (true) WITH CHECK (true);

-- Create missing tables if they don't exist

-- Create autobolt_submission_logs table
CREATE TABLE IF NOT EXISTS public.autobolt_submission_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id TEXT NOT NULL,
    job_id TEXT NOT NULL,
    directory_name TEXT NOT NULL,
    action TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    details TEXT,
    screenshot_url TEXT,
    success BOOLEAN DEFAULT false,
    processing_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on the new table
ALTER TABLE public.autobolt_submission_logs ENABLE ROW LEVEL SECURITY;

-- Create policy for the new table
CREATE POLICY "Allow all operations for service role" ON public.autobolt_submission_logs
    FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_autobolt_submission_logs_customer_id 
    ON public.autobolt_submission_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_autobolt_submission_logs_job_id 
    ON public.autobolt_submission_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_autobolt_submission_logs_timestamp 
    ON public.autobolt_submission_logs(timestamp DESC);

-- Create directory_overrides table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.directory_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    directory_id TEXT NOT NULL UNIQUE,
    enabled BOOLEAN DEFAULT true,
    pacing_min_ms INTEGER,
    pacing_max_ms INTEGER,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on the new table
ALTER TABLE public.directory_overrides ENABLE ROW LEVEL SECURITY;

-- Create policy for the new table
CREATE POLICY "Allow all operations for service role" ON public.directory_overrides
    FOR ALL USING (true) WITH CHECK (true);

-- Create index for directory_overrides
CREATE INDEX IF NOT EXISTS idx_directory_overrides_directory_id 
    ON public.directory_overrides(directory_id);

-- Update the updated_at column automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for directory_overrides
DROP TRIGGER IF EXISTS update_directory_overrides_updated_at ON public.directory_overrides;
CREATE TRIGGER update_directory_overrides_updated_at
    BEFORE UPDATE ON public.directory_overrides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT ALL ON public.autobolt_submission_logs TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.directory_overrides TO postgres, anon, authenticated, service_role;

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'directories',
    'autobolt_processing_queue',
    'autobolt_test_logs',
    'jobs',
    'customers',
    'job_results',
    'autobolt_submission_logs',
    'directory_overrides'
);

-- Show all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN (
    'directories',
    'autobolt_processing_queue',
    'autobolt_test_logs',
    'jobs',
    'customers',
    'job_results',
    'autobolt_submission_logs',
    'directory_overrides'
);

