-- Test Queue System Integration
-- Run this after deploying to verify the complete flow

-- 1. Check if tables exist
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'customers'
) as customers_exists,
EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'jobs'
) as jobs_exists,
EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'directory_submissions'
) as directory_submissions_exists,
EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'directories'
) as directories_exists;

-- 2. Check current queue status
SELECT 
  'Pending Jobs' as metric,
  COUNT(*) as count
FROM jobs
WHERE status = 'pending'
UNION ALL
SELECT 
  'In Progress Jobs',
  COUNT(*)
FROM jobs
WHERE status = 'in_progress'
UNION ALL
SELECT 
  'Pending Submissions',
  COUNT(*)
FROM directory_submissions
WHERE status = 'pending'
UNION ALL
SELECT 
  'Active Directories',
  COUNT(*)
FROM directories
WHERE is_active = true;

-- 3. View recent jobs with their submission counts
SELECT 
  j.id,
  j.customer_id,
  c.company_name,
  c.email,
  j.package_type,
  j.directory_limit,
  j.directories_to_process,
  j.directories_completed,
  j.status,
  j.created_at,
  (
    SELECT COUNT(*) 
    FROM directory_submissions ds 
    WHERE ds.submission_queue_id = j.id
  ) as submissions_created
FROM jobs j
LEFT JOIN customers c ON c.id::text = j.customer_id
ORDER BY j.created_at DESC
LIMIT 10;

-- 4. View pending submissions for AI worker
SELECT 
  ds.id as submission_id,
  ds.customer_id,
  c.company_name,
  c.email,
  d.name as directory_name,
  d.website as directory_website,
  ds.status,
  ds.created_at,
  j.id as master_job_id
FROM directory_submissions ds
JOIN customers c ON c.id = ds.customer_id
JOIN directories d ON d.id = ds.directory_id
LEFT JOIN jobs j ON j.id = ds.submission_queue_id
WHERE ds.status = 'pending'
ORDER BY ds.created_at ASC
LIMIT 20;

-- 5. Check directory tier distribution
SELECT 
  priority_tier,
  COUNT(*) as directory_count,
  ROUND(AVG(da_score), 2) as avg_da_score
FROM directories
WHERE is_active = true
GROUP BY priority_tier
ORDER BY priority_tier;

-- 6. Simulate what the worker will see (first pending submission)
SELECT 
  ds.*,
  c.company_name,
  c.business_data,
  d.name as directory_name,
  d.website as directory_url,
  d.submission_requirements,
  d.form_fields
FROM directory_submissions ds
JOIN customers c ON c.id = ds.customer_id
JOIN directories d ON d.id = ds.directory_id
WHERE ds.status = 'pending'
ORDER BY ds.created_at ASC
LIMIT 1;

-- 7. Check package tier access
SELECT 
  'Starter (tier 1)' as package,
  COUNT(*) as available_directories
FROM directories
WHERE is_active = true AND priority_tier <= 1
UNION ALL
SELECT 
  'Growth (tier 2)',
  COUNT(*)
FROM directories
WHERE is_active = true AND priority_tier <= 2
UNION ALL
SELECT 
  'Professional (tier 3)',
  COUNT(*)
FROM directories
WHERE is_active = true AND priority_tier <= 3
UNION ALL
SELECT 
  'Enterprise (all)',
  COUNT(*)
FROM directories
WHERE is_active = true;

