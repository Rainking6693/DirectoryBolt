-- Fix jobs.customer_id to accept text instead of UUID
-- This allows it to reference customers.id which uses the DB-2025-XXXXXX format

-- First, drop the foreign key constraint if it exists
ALTER TABLE IF EXISTS jobs 
DROP CONSTRAINT IF EXISTS jobs_customer_id_fkey;

-- Change the column type from UUID to TEXT
ALTER TABLE IF EXISTS jobs 
ALTER COLUMN customer_id TYPE TEXT;

-- Re-add the foreign key constraint with the correct type
ALTER TABLE IF EXISTS jobs 
ADD CONSTRAINT jobs_customer_id_fkey 
FOREIGN KEY (customer_id) 
REFERENCES customers(id) 
ON DELETE CASCADE;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'jobs' 
AND column_name = 'customer_id';

