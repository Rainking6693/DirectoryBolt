-- DirectoryBolt Database Schema Fixes
-- Run these SQL commands in Supabase SQL Editor

-- ============================================
-- FIX 1: Add missing columns to jobs table
-- ============================================

ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS business_phone TEXT,
ADD COLUMN IF NOT EXISTS business_category TEXT,
ADD COLUMN IF NOT EXISTS package_type TEXT DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS directory_limit INTEGER DEFAULT 50;

-- ============================================
-- FIX 2: Add indexes for better performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_jobs_status_priority 
ON jobs(status, priority_level, created_at);

CREATE INDEX IF NOT EXISTS idx_jobs_customer_id 
ON jobs(customer_id);

CREATE INDEX IF NOT EXISTS idx_job_results_job_id 
ON job_results(job_id);

-- ============================================
-- FIX 3: Disable RLS temporarily for testing
-- ============================================

ALTER TABLE jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE job_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- ============================================
-- FIX 4: Create proper RLS policies (run after testing)
-- ============================================

-- Uncomment these after confirming the system works without RLS

/*
-- Re-enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role full access to jobs"
ON jobs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access to job_results"
ON job_results
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role full access to customers"
ON customers
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
*/

-- ============================================
-- FIX 5: Verify table structures
-- ============================================

-- Check jobs table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'jobs'
ORDER BY ordinal_position;

-- Check customers table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;

-- Check job_results table columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'job_results'
ORDER BY ordinal_position;

-- ============================================
-- FIX 6: Create test customer and job
-- ============================================

-- Create test customer
INSERT INTO customers (
  id,
  customer_id,
  business_name,
  email,
  phone,
  address,
  city,
  state,
  zip,
  website,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'TEST-' || to_char(now(), 'YYYYMMDD-HH24MISS'),
  'Test Business Inc',
  'test@directorybolt.com',
  '555-0123',
  '123 Test Street',
  'Los Angeles',
  'CA',
  '90210',
  'https://testbusiness.com',
  now(),
  now()
) 
ON CONFLICT (customer_id) DO NOTHING
RETURNING id, customer_id;

-- After running above, copy the 'id' (UUID) and use it below
-- Replace 'YOUR_CUSTOMER_UUID_HERE' with the actual UUID

INSERT INTO jobs (
  id,
  customer_id,
  package_size,
  priority_level,
  status,
  business_name,
  business_email,
  business_phone,
  business_address,
  business_city,
  business_state,
  business_zip,
  business_website,
  business_description,
  business_category,
  package_type,
  directory_limit,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'YOUR_CUSTOMER_UUID_HERE',  -- Replace with customer UUID from above
  50,
  1,
  'pending',
  'Test Business Inc',
  'test@directorybolt.com',
  '555-0123',
  '123 Test Street',
  'Los Angeles',
  'CA',
  '90210',
  'https://testbusiness.com',
  'A test business for automated directory submissions. This is used to verify the job queue system is working correctly.',
  'Business Services',
  'starter',
  50,
  now(),
  now()
);

-- ============================================
-- FIX 7: Verify data exists
-- ============================================

-- Check if test customer was created
SELECT id, customer_id, business_name, email 
FROM customers 
WHERE business_name = 'Test Business Inc';

-- Check if test job was created
SELECT id, customer_id, status, package_size, business_name
FROM jobs 
WHERE business_name = 'Test Business Inc';

-- Check all pending jobs
SELECT id, customer_id, status, package_size, priority_level, business_name, created_at
FROM jobs 
WHERE status = 'pending'
ORDER BY priority_level ASC, created_at ASC;

-- ============================================
-- FIX 8: Check for orphaned jobs
-- ============================================

-- Find jobs with missing customers
SELECT j.id, j.customer_id, j.business_name, j.status
FROM jobs j
LEFT JOIN customers c ON j.customer_id = c.id
WHERE c.id IS NULL;
