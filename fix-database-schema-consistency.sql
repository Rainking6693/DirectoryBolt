-- Fix database schema consistency issues
-- This script ensures all foreign keys reference the correct columns

-- First, check current state
SELECT 'jobs table' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'jobs' AND column_name = 'customer_id'
UNION ALL
SELECT 'customers table id column' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers' AND column_name = 'id'
UNION ALL
SELECT 'customers table customer_id column' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers' AND column_name = 'customer_id';

-- Fix jobs.customer_id to properly reference customers.customer_id
-- Step 1: Drop the existing foreign key constraint
ALTER TABLE IF EXISTS jobs 
DROP CONSTRAINT IF EXISTS jobs_customer_id_fkey;

-- Step 2: Ensure jobs.customer_id is TEXT type
ALTER TABLE IF EXISTS jobs 
ALTER COLUMN customer_id TYPE TEXT;

-- Step 3: Update existing records to use customer_id instead of UUID if needed
-- This is a safety check to ensure data consistency
-- First, let's check if the customers table has the id column
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'id') THEN
        -- If customers.id exists, update jobs to use customer_id format
        UPDATE jobs 
        SET customer_id = customers.customer_id
        FROM customers
        WHERE jobs.customer_id = customers.id::TEXT OR jobs.customer_id = customers.id;
    ELSE
        -- If customers.id doesn't exist, we need to handle this differently
        RAISE NOTICE 'customers.id column does not exist, skipping update';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error updating jobs.customer_id: %', SQLERRM;
END $$;

-- Step 4: Add foreign key constraint to reference customers.customer_id
ALTER TABLE IF EXISTS jobs 
ADD CONSTRAINT jobs_customer_id_fkey 
FOREIGN KEY (customer_id) 
REFERENCES customers(customer_id) 
ON DELETE CASCADE;

-- Verify the changes
SELECT 
    j.id as job_id,
    j.customer_id as job_customer_id,
    c.customer_id as customer_customer_id,
    c.business_name
FROM jobs j
LEFT JOIN customers c ON j.customer_id = c.customer_id
LIMIT 5;