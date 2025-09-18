-- Migration: Add Customer ID Generation Function
-- Purpose: Add auto-generating customer IDs in DIR-YYYYMMDD-XXXXXX format
-- Date: 2025-09-18
-- Phase: 2.2 Customer Management Enhancement

-- Create sequence for customer ID generation
CREATE SEQUENCE IF NOT EXISTS customer_id_sequence START 1;

-- Create function to generate customer IDs in DIR-YYYYMMDD-XXXXXX format
CREATE OR REPLACE FUNCTION generate_customer_id()
RETURNS TEXT AS $$
DECLARE
    date_part TEXT;
    sequence_part TEXT;
    customer_id TEXT;
    attempts INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    -- Format: DIR-YYYYMMDD-XXXXXX
    date_part := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    LOOP
        -- Get next sequence value and format as 6-digit number
        sequence_part := LPAD(nextval('customer_id_sequence')::TEXT, 6, '0');
        customer_id := 'DIR-' || date_part || '-' || sequence_part;
        
        -- Check if this ID already exists (should be rare due to sequence)
        IF NOT EXISTS (SELECT 1 FROM customers WHERE customer_id = customer_id) THEN
            RETURN customer_id;
        END IF;
        
        -- Safety check to prevent infinite loop
        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique customer ID after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add customer_id column to existing customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_id VARCHAR(20) UNIQUE;

-- Create index for customer_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);

-- Create trigger to auto-generate customer_id on insert
CREATE OR REPLACE FUNCTION set_customer_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate customer_id if not provided
    IF NEW.customer_id IS NULL OR NEW.customer_id = '' THEN
        NEW.customer_id = generate_customer_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS trigger_set_customer_id ON customers;
CREATE TRIGGER trigger_set_customer_id
    BEFORE INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION set_customer_id();

-- Backfill existing customers with customer_ids
UPDATE customers 
SET customer_id = generate_customer_id() 
WHERE customer_id IS NULL OR customer_id = '';

-- Make customer_id NOT NULL after backfill
ALTER TABLE customers ALTER COLUMN customer_id SET NOT NULL;

-- Add additional columns to match Google Sheets structure
ALTER TABLE customers ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS package_type VARCHAR(50) DEFAULT 'basic';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS submission_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_name VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS website VARCHAR(500);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS industry VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS country VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS business_description TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS target_keywords TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS submission_results JSONB DEFAULT '{}';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS directory_data JSONB DEFAULT '{}';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS assigned_staff VARCHAR(255);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS estimated_completion_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE customers ADD COLUMN IF NOT EXISTS payment_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS refund_status VARCHAR(50);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS refund_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_source VARCHAR(100);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS referral_code VARCHAR(50);

-- Create indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_customers_first_name ON customers(first_name) WHERE first_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_last_name ON customers(last_name) WHERE last_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_package_type ON customers(package_type);
CREATE INDEX IF NOT EXISTS idx_customers_submission_status ON customers(submission_status);
CREATE INDEX IF NOT EXISTS idx_customers_business_name ON customers(business_name) WHERE business_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_industry ON customers(industry) WHERE industry IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_payment_status ON customers(payment_status);
CREATE INDEX IF NOT EXISTS idx_customers_assigned_staff ON customers(assigned_staff) WHERE assigned_staff IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_customer_source ON customers(customer_source) WHERE customer_source IS NOT NULL;

-- GIN indexes for new JSONB fields
CREATE INDEX IF NOT EXISTS idx_customers_submission_results_gin ON customers USING GIN (submission_results);
CREATE INDEX IF NOT EXISTS idx_customers_directory_data_gin ON customers USING GIN (directory_data);

-- Function to split full_name into first_name and last_name if they're null
CREATE OR REPLACE FUNCTION split_customer_names()
RETURNS TRIGGER AS $$
BEGIN
    -- Split full_name into first_name and last_name if they're not provided
    IF NEW.first_name IS NULL AND NEW.last_name IS NULL AND NEW.full_name IS NOT NULL THEN
        -- Simple split on first space
        NEW.first_name = SPLIT_PART(NEW.full_name, ' ', 1);
        NEW.last_name = TRIM(SUBSTRING(NEW.full_name FROM LENGTH(SPLIT_PART(NEW.full_name, ' ', 1)) + 2));
        
        -- If no space found, put everything in first_name
        IF NEW.last_name = '' THEN
            NEW.last_name = NULL;
        END IF;
    END IF;
    
    -- Update full_name if first_name or last_name are provided but full_name is null
    IF NEW.full_name IS NULL AND (NEW.first_name IS NOT NULL OR NEW.last_name IS NOT NULL) THEN
        NEW.full_name = TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, ''));
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for name splitting
DROP TRIGGER IF EXISTS trigger_split_customer_names ON customers;
CREATE TRIGGER trigger_split_customer_names
    BEFORE INSERT OR UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION split_customer_names();

-- Create comprehensive view for customer management
CREATE OR REPLACE VIEW customer_management AS
SELECT 
    c.id,
    c.customer_id,
    c.email,
    c.first_name,
    c.last_name,
    c.full_name,
    c.business_name,
    c.company_name, -- legacy field
    c.phone,
    c.website,
    c.industry,
    c.address,
    c.city,
    c.state,
    c.country,
    c.zip_code,
    c.business_description,
    c.target_keywords,
    c.package_type,
    c.subscription_tier, -- legacy field
    c.submission_status,
    c.payment_status,
    c.payment_date,
    c.refund_status,
    c.refund_date,
    c.customer_source,
    c.referral_code,
    c.assigned_staff,
    c.estimated_completion_date,
    c.notes,
    c.logo_url,
    c.submission_results,
    c.directory_data,
    c.is_verified,
    c.is_active,
    c.created_at,
    c.updated_at,
    -- Calculate completion percentage based on submission_results
    CASE 
        WHEN c.submission_results IS NOT NULL AND jsonb_typeof(c.submission_results) = 'object' THEN
            COALESCE(
                (c.submission_results->>'completion_percentage')::numeric,
                CASE 
                    WHEN (c.submission_results->>'total_directories')::integer > 0 THEN
                        ROUND(
                            (COALESCE((c.submission_results->>'completed_directories')::integer, 0)::numeric / 
                             (c.submission_results->>'total_directories')::integer) * 100, 2
                        )
                    ELSE 0
                END
            )
        ELSE 0
    END as completion_percentage,
    -- Calculate days since creation
    EXTRACT(DAYS FROM (CURRENT_TIMESTAMP - c.created_at))::integer as days_since_creation
FROM customers c;

-- Test the customer ID generation
DO $$
DECLARE
    test_customer_id TEXT;
BEGIN
    -- Test the function
    test_customer_id := generate_customer_id();
    RAISE NOTICE 'Generated test customer ID: %', test_customer_id;
    
    -- Verify format
    IF test_customer_id ~ '^DIR-\d{8}-\d{6}$' THEN
        RAISE NOTICE 'Customer ID format is correct: %', test_customer_id;
    ELSE
        RAISE EXCEPTION 'Customer ID format is incorrect: %', test_customer_id;
    END IF;
END $$;

-- Add comprehensive comments
COMMENT ON FUNCTION generate_customer_id() IS 'Generates unique customer IDs in DIR-YYYYMMDD-XXXXXX format';
COMMENT ON FUNCTION set_customer_id() IS 'Trigger function to auto-generate customer_id on insert';
COMMENT ON FUNCTION split_customer_names() IS 'Automatically splits full_name into first_name and last_name';
COMMENT ON VIEW customer_management IS 'Comprehensive view for customer management with calculated fields';

COMMENT ON COLUMN customers.customer_id IS 'Unique customer ID in DIR-YYYYMMDD-XXXXXX format';
COMMENT ON COLUMN customers.first_name IS 'Customer first name';
COMMENT ON COLUMN customers.last_name IS 'Customer last name';
COMMENT ON COLUMN customers.package_type IS 'Type of package purchased (basic, pro, enterprise)';
COMMENT ON COLUMN customers.submission_status IS 'Current status of directory submissions';
COMMENT ON COLUMN customers.business_name IS 'Legal business name';
COMMENT ON COLUMN customers.submission_results IS 'JSONB field containing submission results and progress';
COMMENT ON COLUMN customers.directory_data IS 'JSONB field containing directory-specific data and preferences';
COMMENT ON COLUMN customers.assigned_staff IS 'Staff member assigned to this customer';
COMMENT ON COLUMN customers.customer_source IS 'How the customer found us (Google, referral, etc.)';
COMMENT ON COLUMN customers.referral_code IS 'Referral code used by customer';

-- Create sample customer for testing
INSERT INTO customers (
    email, 
    password_hash, 
    first_name,
    last_name,
    business_name,
    phone,
    website,
    industry,
    package_type,
    submission_status,
    business_description,
    is_verified,
    is_active
) VALUES (
    'test@example.com',
    '$2a$12$LQv3c1yqBWVHxkd0LQ4YCOuLQkAL1J9HU.xQJvvn1aLDnEKJjY5P2',
    'John',
    'Doe',
    'Acme Corp',
    '+1-555-123-4567',
    'https://example.com',
    'Technology',
    'pro',
    'in_progress',
    'A technology company specializing in web development',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

RAISE NOTICE 'Migration 016 completed successfully - Customer ID generation added';