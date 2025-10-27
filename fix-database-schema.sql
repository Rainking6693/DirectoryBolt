-- DirectoryBolt Database Schema Fixes
-- This script fixes all schema issues identified by the verification script
-- Run this in Supabase SQL Editor or via psql

-- ============================================================
-- Fix #1: Add UUID id column to customers table
-- ============================================================

-- Add id column if it doesn't exist
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS id uuid DEFAULT uuid_generate_v4();

-- Create unique constraint on id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'customers_id_unique' 
    AND conrelid = 'customers'::regclass
  ) THEN
    ALTER TABLE customers ADD CONSTRAINT customers_id_unique UNIQUE (id);
  END IF;
END $$;

-- ============================================================
-- Fix #2: Add correct_submission_url alias to directories
-- ============================================================

-- Add column if it doesn't exist
ALTER TABLE directories 
ADD COLUMN IF NOT EXISTS correct_submission_url text;

-- Copy data from submission_url
UPDATE directories 
SET correct_submission_url = submission_url 
WHERE correct_submission_url IS NULL;

-- Add unique constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'directories_correct_submission_url_key' 
    AND conrelid = 'directories'::regclass
  ) THEN
    ALTER TABLE directories 
    ADD CONSTRAINT directories_correct_submission_url_key 
    UNIQUE (correct_submission_url);
  END IF;
END $$;

-- ============================================================
-- Fix #3: Add status column to customers (if not exists)
-- ============================================================

ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' 
CHECK (status IN ('active', 'inactive', 'suspended'));

-- Update existing customers
UPDATE customers 
SET status = 'active' 
WHERE status IS NULL;

-- ============================================================
-- Fix #4: Add Performance Indexes
-- ============================================================

-- Directories table indexes
CREATE INDEX IF NOT EXISTS idx_directories_id 
ON directories (id);

CREATE INDEX IF NOT EXISTS idx_directories_name 
ON directories (name);

CREATE INDEX IF NOT EXISTS idx_directories_submission_url 
ON directories (submission_url);

CREATE INDEX IF NOT EXISTS idx_directories_correct_submission_url 
ON directories (correct_submission_url);

CREATE INDEX IF NOT EXISTS idx_directories_category 
ON directories (category);

CREATE INDEX IF NOT EXISTS idx_directories_active 
ON directories (active);

CREATE INDEX IF NOT EXISTS idx_directories_tier_required 
ON directories (tier_required);

-- Customers table indexes
CREATE INDEX IF NOT EXISTS idx_customers_id 
ON customers (id);

CREATE INDEX IF NOT EXISTS idx_customers_customer_id 
ON customers (customer_id);

CREATE INDEX IF NOT EXISTS idx_customers_email 
ON customers (email);

CREATE INDEX IF NOT EXISTS idx_customers_business_name 
ON customers (business_name);

CREATE INDEX IF NOT EXISTS idx_customers_status 
ON customers (status);

CREATE INDEX IF NOT EXISTS idx_customers_created_at 
ON customers (created_at DESC);

-- Jobs table indexes
CREATE INDEX IF NOT EXISTS idx_jobs_id 
ON jobs (id);

CREATE INDEX IF NOT EXISTS idx_jobs_customer_id 
ON jobs (customer_id);

CREATE INDEX IF NOT EXISTS idx_jobs_status 
ON jobs (status);

CREATE INDEX IF NOT EXISTS idx_jobs_package_type 
ON jobs (package_type);

CREATE INDEX IF NOT EXISTS idx_jobs_created_at 
ON jobs (created_at DESC);

-- Directory submissions indexes
CREATE INDEX IF NOT EXISTS idx_directory_submissions_id 
ON directory_submissions (id);

CREATE INDEX IF NOT EXISTS idx_directory_submissions_job_id 
ON directory_submissions (job_id);

CREATE INDEX IF NOT EXISTS idx_directory_submissions_customer_id 
ON directory_submissions (customer_id);

CREATE INDEX IF NOT EXISTS idx_directory_submissions_status 
ON directory_submissions (status);

CREATE INDEX IF NOT EXISTS idx_directory_submissions_created_at 
ON directory_submissions (created_at DESC);

-- ============================================================
-- Fix #5: Add Missing Columns to Customers (if needed)
-- ============================================================

-- Add stripe_customer_id if it doesn't exist
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- Add stripe_subscription_id if it doesn't exist
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Add subscription_status if it doesn't exist
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS subscription_status text;

-- ============================================================
-- Optimize Tables
-- ============================================================

-- Update table statistics for query planner
ANALYZE directories;
ANALYZE customers;
ANALYZE jobs;
ANALYZE directory_submissions;

-- Vacuum tables to reclaim space and update statistics
VACUUM ANALYZE directories;
VACUUM ANALYZE customers;
VACUUM ANALYZE jobs;
VACUUM ANALYZE directory_submissions;

-- ============================================================
-- Verification Queries
-- ============================================================

-- Check customers table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'customers'
ORDER BY ordinal_position;

-- Check directories table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'directories'
ORDER BY ordinal_position;

-- Check indexes on customers
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'customers'
ORDER BY indexname;

-- Check indexes on directories
SELECT 
  indexname, 
  indexdef 
FROM pg_indexes 
WHERE tablename = 'directories'
ORDER BY indexname;

-- Count records
SELECT 
  'directories' as table_name, 
  COUNT(*) as row_count 
FROM directories
UNION ALL
SELECT 
  'customers' as table_name, 
  COUNT(*) as row_count 
FROM customers
UNION ALL
SELECT 
  'jobs' as table_name, 
  COUNT(*) as row_count 
FROM jobs
UNION ALL
SELECT 
  'directory_submissions' as table_name, 
  COUNT(*) as row_count 
FROM directory_submissions;

-- ============================================================
-- Success Message
-- ============================================================

DO $$ 
BEGIN
  RAISE NOTICE '✅ Database schema fixes applied successfully!';
  RAISE NOTICE '📊 Run verification queries above to confirm changes';
  RAISE NOTICE '🚀 Your database is now optimized and ready to use';
END $$;
