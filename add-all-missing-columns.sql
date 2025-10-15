-- Add ALL missing business columns to jobs table
-- Run this in Supabase SQL Editor

ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS business_email TEXT,
ADD COLUMN IF NOT EXISTS business_phone TEXT,
ADD COLUMN IF NOT EXISTS business_address TEXT,
ADD COLUMN IF NOT EXISTS business_city TEXT,
ADD COLUMN IF NOT EXISTS business_state TEXT,
ADD COLUMN IF NOT EXISTS business_zip TEXT,
ADD COLUMN IF NOT EXISTS business_website TEXT,
ADD COLUMN IF NOT EXISTS business_description TEXT,
ADD COLUMN IF NOT EXISTS business_category TEXT,
ADD COLUMN IF NOT EXISTS package_type TEXT DEFAULT 'starter',
ADD COLUMN IF NOT EXISTS directory_limit INTEGER DEFAULT 50;

-- Verify all columns were added
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND (column_name LIKE 'business_%' OR column_name IN ('package_type', 'directory_limit'))
ORDER BY column_name;
