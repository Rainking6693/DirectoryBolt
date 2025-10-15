-- Fix jobs.customer_id to reference customers.customer_id (DB-2025-XXXXXX format)
-- instead of customers.id (UUID format)

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE IF EXISTS jobs 
DROP CONSTRAINT IF EXISTS jobs_customer_id_fkey;

-- Step 2: Change jobs.customer_id from UUID to TEXT
ALTER TABLE IF EXISTS jobs 
ALTER COLUMN customer_id TYPE TEXT USING customer_id::TEXT;

-- Step 3: Update existing job records to use customer_id instead of UUID
-- This converts existing UUIDs to the custom customer_id format
UPDATE jobs 
SET customer_id = customers.customer_id
FROM customers
WHERE jobs.customer_id::UUID = customers.id;

-- Step 4: Add foreign key constraint to reference customers.customer_id
ALTER TABLE IF EXISTS jobs 
ADD CONSTRAINT jobs_customer_id_fkey 
FOREIGN KEY (customer_id) 
REFERENCES customers(customer_id) 
ON DELETE CASCADE;

-- Step 5: Verify the changes
SELECT 
    j.id as job_id,
    j.customer_id as job_customer_id,
    c.customer_id as customer_customer_id,
    c.business_name
FROM jobs j
LEFT JOIN customers c ON j.customer_id = c.customer_id
LIMIT 5;

