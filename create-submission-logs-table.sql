-- Migration: Create autobolt_submission_logs table
-- Date: 2025-10-29
-- Purpose: Fix "Failed to fetch logs" and "Failed to fetch 2FA queue" errors

-- Create the submission logs table
CREATE TABLE IF NOT EXISTS public.autobolt_submission_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT,
  job_id UUID,
  directory_name TEXT NOT NULL,
  action TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  details JSONB DEFAULT '{}'::jsonb,
  screenshot_url TEXT,
  success BOOLEAN DEFAULT false,
  processing_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_submission_logs_customer 
  ON public.autobolt_submission_logs(customer_id);

CREATE INDEX IF NOT EXISTS idx_submission_logs_job 
  ON public.autobolt_submission_logs(job_id);

CREATE INDEX IF NOT EXISTS idx_submission_logs_timestamp 
  ON public.autobolt_submission_logs(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_submission_logs_directory 
  ON public.autobolt_submission_logs(directory_name);

-- Add foreign key constraints (optional - only if you want referential integrity)
-- Uncomment these if you want strict FK enforcement:

-- ALTER TABLE public.autobolt_submission_logs
--   ADD CONSTRAINT fk_submission_logs_job 
--   FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;

-- Add comment for documentation
COMMENT ON TABLE public.autobolt_submission_logs IS 
  'Logs all directory submission attempts with timing, success status, and error details';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT ON public.autobolt_submission_logs TO authenticated;
-- GRANT ALL ON public.autobolt_submission_logs TO service_role;

-- Verify table was created
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'autobolt_submission_logs'
ORDER BY ordinal_position;
