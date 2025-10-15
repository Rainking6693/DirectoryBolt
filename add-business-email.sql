-- Additional column fix for jobs table
-- Run this in Supabase SQL Editor

-- Add business_email column (was missing from first fix)
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS business_email TEXT;

-- Verify all business columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND column_name LIKE 'business_%'
ORDER BY column_name;

-- Expected columns:
-- business_address
-- business_category
-- business_city
-- business_description
-- business_email (NEW)
-- business_name
-- business_phone
-- business_state
-- business_website
-- business_zip
