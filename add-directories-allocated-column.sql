-- Add directories_allocated column to customers table
-- Run this in your Supabase SQL Editor

-- Add the column
ALTER TABLE customers ADD COLUMN IF NOT EXISTS directories_allocated INTEGER DEFAULT 0;

-- Update existing customers with directory allocations based on package type
UPDATE customers 
SET directories_allocated = 25, updated_at = NOW()
WHERE package_type = 'starter' AND directories_allocated IS NULL;

UPDATE customers 
SET directories_allocated = 75, updated_at = NOW()
WHERE package_type = 'growth' AND directories_allocated IS NULL;

UPDATE customers 
SET directories_allocated = 150, updated_at = NOW()
WHERE package_type = 'professional' AND directories_allocated IS NULL;

UPDATE customers 
SET directories_allocated = 500, updated_at = NOW()
WHERE package_type = 'enterprise' AND directories_allocated IS NULL;

-- Set default for any remaining customers
UPDATE customers 
SET directories_allocated = 25, updated_at = NOW()
WHERE directories_allocated IS NULL;

-- Verify the updates
SELECT customer_id, business_name, package_type, directories_allocated 
FROM customers 
ORDER BY created_at DESC;
