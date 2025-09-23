-- CRITICAL FIX: Add missing columns to AutoBolt tables
-- Execute this SQL in your Supabase SQL Editor to fix the missing database schema

-- =========================================
-- FIX 1: Add missing columns to directory_submissions table
-- =========================================

-- Add directory_category column
ALTER TABLE directory_submissions 
ADD COLUMN IF NOT EXISTS directory_category VARCHAR(100);

-- Add directory_tier column with constraint
ALTER TABLE directory_submissions 
ADD COLUMN IF NOT EXISTS directory_tier VARCHAR(50) DEFAULT 'standard';

-- Add the tier constraint if it doesn't exist
ALTER TABLE directory_submissions 
DROP CONSTRAINT IF EXISTS directory_submissions_directory_tier_check;

ALTER TABLE directory_submissions 
ADD CONSTRAINT directory_submissions_directory_tier_check 
CHECK (directory_tier IN ('standard', 'premium', 'enterprise'));

-- Add processing_time_seconds column
ALTER TABLE directory_submissions 
ADD COLUMN IF NOT EXISTS processing_time_seconds INTEGER;

-- Add error_message column if it doesn't exist
ALTER TABLE directory_submissions 
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- =========================================
-- FIX 2: Add missing columns to autobolt_processing_queue table
-- =========================================

-- Add error_message column
ALTER TABLE autobolt_processing_queue 
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add started_at timestamp
ALTER TABLE autobolt_processing_queue 
ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE;

-- Add completed_at timestamp
ALTER TABLE autobolt_processing_queue 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add processed_by column
ALTER TABLE autobolt_processing_queue 
ADD COLUMN IF NOT EXISTS processed_by VARCHAR(100);

-- =========================================
-- FIX 3: Ensure the updated_at trigger function exists
-- =========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Ensure trigger exists on directory_submissions
DROP TRIGGER IF EXISTS update_directory_submissions_updated_at ON directory_submissions;
CREATE TRIGGER update_directory_submissions_updated_at 
    BEFORE UPDATE ON directory_submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Ensure trigger exists on autobolt_processing_queue
DROP TRIGGER IF EXISTS update_autobolt_queue_updated_at ON autobolt_processing_queue;
CREATE TRIGGER update_autobolt_queue_updated_at 
    BEFORE UPDATE ON autobolt_processing_queue 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- FIX 4: Add indexes for the new columns
-- =========================================

CREATE INDEX IF NOT EXISTS idx_directory_submissions_category 
ON directory_submissions(directory_category);

CREATE INDEX IF NOT EXISTS idx_directory_submissions_tier 
ON directory_submissions(directory_tier);

CREATE INDEX IF NOT EXISTS idx_autobolt_queue_started_at 
ON autobolt_processing_queue(started_at);

CREATE INDEX IF NOT EXISTS idx_autobolt_queue_completed_at 
ON autobolt_processing_queue(completed_at);

-- =========================================
-- FIX 5: Test the new columns work correctly
-- =========================================

-- Test directory_submissions with all new columns
INSERT INTO directory_submissions (
    customer_id,
    directory_name,
    directory_category,
    directory_tier,
    submission_status,
    processing_time_seconds,
    error_message
) VALUES (
    'TEST-COLUMNS-001',
    'Test Directory',
    'Business',
    'standard',
    'pending',
    30,
    NULL
) ON CONFLICT DO NOTHING;

-- Test autobolt_processing_queue with new columns
INSERT INTO autobolt_processing_queue (
    customer_id,
    business_name,
    email,
    package_type,
    directory_limit,
    priority_level,
    status,
    started_at,
    error_message,
    processed_by
) VALUES (
    'TEST-QUEUE-001',
    'Test Business',
    'test@example.com',
    'growth',
    100,
    2,
    'queued',
    NOW(),
    NULL,
    'autobolt-extension'
) ON CONFLICT DO NOTHING;

-- Clean up test data
DELETE FROM directory_submissions WHERE customer_id = 'TEST-COLUMNS-001';
DELETE FROM autobolt_processing_queue WHERE customer_id = 'TEST-QUEUE-001';

-- =========================================
-- FIX 6: Verify all columns exist
-- =========================================

-- Check directory_submissions columns
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'directory_submissions' 
  AND table_schema = 'public'
  AND column_name IN ('directory_category', 'directory_tier', 'processing_time_seconds', 'error_message')
ORDER BY column_name;

-- Check autobolt_processing_queue columns  
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'autobolt_processing_queue' 
  AND table_schema = 'public'
  AND column_name IN ('error_message', 'started_at', 'completed_at', 'processed_by')
ORDER BY column_name;

-- =========================================
-- SUCCESS MESSAGE
-- =========================================

-- This should show 'AutoBolt schema fix completed successfully'
SELECT 'AutoBolt schema fix completed successfully' AS status;