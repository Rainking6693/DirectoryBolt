-- DirectoryBolt Customer Management Database Schema
-- Execute this in Supabase SQL Editor
-- Date: 2025-09-18

-- ============================================================================
-- 1. BASIC SETUP FUNCTIONS
-- ============================================================================

-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 2. CUSTOMER ID GENERATION SYSTEM
-- ============================================================================

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

-- ============================================================================
-- 3. ENHANCE CUSTOMERS TABLE
-- ============================================================================

-- Add customer_id column to existing customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_id VARCHAR(20);

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

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);
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

-- ============================================================================
-- 4. CUSTOMER ID TRIGGER SETUP
-- ============================================================================

-- Create trigger function to auto-generate customer_id
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

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trigger_set_customer_id ON customers;
CREATE TRIGGER trigger_set_customer_id
    BEFORE INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION set_customer_id();

-- Function to split full_name into first_name and last_name
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

-- ============================================================================
-- 5. SUPPORTING TABLES
-- ============================================================================

-- Create customer_submissions table
CREATE TABLE IF NOT EXISTS customer_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    directory_id UUID REFERENCES directories(id) ON DELETE SET NULL,
    submission_url VARCHAR(500),
    directory_name VARCHAR(255) NOT NULL,
    directory_category VARCHAR(100),
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (
        status IN (
            'pending', 'in_progress', 'submitted', 'approved', 'rejected', 
            'failed', 'requires_verification', 'cancelled'
        )
    ),
    submitted_data JSONB DEFAULT '{}',
    submission_response JSONB DEFAULT '{}',
    approval_date TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    automation_method VARCHAR(50) DEFAULT 'manual' CHECK (
        automation_method IN ('manual', 'api', 'chrome_extension', 'headless_browser')
    ),
    submission_proof_url VARCHAR(500),
    quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10),
    requires_follow_up BOOLEAN DEFAULT false,
    follow_up_date TIMESTAMP WITH TIME ZONE,
    follow_up_notes TEXT,
    processing_time_seconds INTEGER,
    retry_count INTEGER DEFAULT 0,
    assigned_staff VARCHAR(255),
    reviewed_by VARCHAR(255),
    review_date TIMESTAMP WITH TIME ZONE,
    review_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Create customer_progress table
CREATE TABLE IF NOT EXISTS customer_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    total_directories_selected INTEGER DEFAULT 0,
    directories_submitted INTEGER DEFAULT 0,
    directories_approved INTEGER DEFAULT 0,
    directories_rejected INTEGER DEFAULT 0,
    directories_pending INTEGER DEFAULT 0,
    completion_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    estimated_completion_date TIMESTAMP WITH TIME ZONE,
    actual_completion_date TIMESTAMP WITH TIME ZONE,
    average_quality_score DECIMAL(3,2),
    approval_rate DECIMAL(5,2) DEFAULT 0.00,
    project_start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_submission_date TIMESTAMP WITH TIME ZONE,
    next_milestone_date TIMESTAMP WITH TIME ZONE,
    overall_status VARCHAR(50) DEFAULT 'active' CHECK (
        overall_status IN ('active', 'paused', 'completed', 'cancelled', 'on_hold')
    ),
    project_manager VARCHAR(255),
    assigned_team JSONB DEFAULT '[]',
    last_update_sent TIMESTAMP WITH TIME ZONE,
    next_update_due TIMESTAMP WITH TIME ZONE,
    communication_frequency VARCHAR(20) DEFAULT 'weekly' CHECK (
        communication_frequency IN ('daily', 'weekly', 'bi_weekly', 'monthly', 'as_needed')
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Create customer_communications table
CREATE TABLE IF NOT EXISTS customer_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    related_submission_id UUID REFERENCES customer_submissions(id) ON DELETE SET NULL,
    communication_type VARCHAR(50) NOT NULL CHECK (
        communication_type IN (
            'email', 'phone', 'chat', 'internal_note', 'system_notification',
            'sms', 'support_ticket', 'status_update', 'welcome_message'
        )
    ),
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound', 'internal')),
    subject VARCHAR(255),
    message TEXT NOT NULL,
    formatted_message JSONB,
    status VARCHAR(30) DEFAULT 'sent' CHECK (
        status IN ('draft', 'sent', 'delivered', 'read', 'failed', 'bounced')
    ),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (
        priority IN ('low', 'normal', 'high', 'urgent')
    ),
    staff_member VARCHAR(255),
    automated BOOLEAN DEFAULT false,
    template_used VARCHAR(100),
    requires_response BOOLEAN DEFAULT false,
    response_due_date TIMESTAMP WITH TIME ZONE,
    responded_at TIMESTAMP WITH TIME ZONE,
    response_id UUID REFERENCES customer_communications(id),
    external_message_id VARCHAR(255),
    thread_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- Create customer_payments table
CREATE TABLE IF NOT EXISTS customer_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    payment_id VARCHAR(255) NOT NULL,
    payment_method VARCHAR(50) CHECK (
        payment_method IN ('card', 'bank_transfer', 'paypal', 'crypto', 'manual', 'refund')
    ),
    amount_cents INTEGER NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    amount_decimal DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(50) NOT NULL CHECK (
        payment_status IN (
            'pending', 'processing', 'succeeded', 'failed', 'cancelled',
            'refunded', 'partially_refunded', 'dispute_created', 'dispute_resolved'
        )
    ),
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    payment_date TIMESTAMP WITH TIME ZONE,
    stripe_payment_intent_id VARCHAR(255),
    stripe_charge_id VARCHAR(255),
    external_transaction_id VARCHAR(255),
    package_type VARCHAR(50),
    service_description TEXT,
    billing_period_start TIMESTAMP WITH TIME ZONE,
    billing_period_end TIMESTAMP WITH TIME ZONE,
    refund_amount_cents INTEGER DEFAULT 0,
    refund_reason TEXT,
    refund_date TIMESTAMP WITH TIME ZONE,
    refund_reference VARCHAR(255),
    invoice_id VARCHAR(255),
    invoice_url VARCHAR(500),
    receipt_url VARCHAR(500),
    payment_notes TEXT,
    staff_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Customer submissions indexes
CREATE INDEX IF NOT EXISTS idx_customer_submissions_customer_id ON customer_submissions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_submissions_directory_id ON customer_submissions(directory_id);
CREATE INDEX IF NOT EXISTS idx_customer_submissions_status ON customer_submissions(status);
CREATE INDEX IF NOT EXISTS idx_customer_submissions_submission_date ON customer_submissions(submission_date);
CREATE INDEX IF NOT EXISTS idx_customer_submissions_assigned_staff ON customer_submissions(assigned_staff) WHERE assigned_staff IS NOT NULL;

-- Customer progress indexes
CREATE INDEX IF NOT EXISTS idx_customer_progress_customer_id ON customer_progress(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_progress_overall_status ON customer_progress(overall_status);
CREATE INDEX IF NOT EXISTS idx_customer_progress_completion_date ON customer_progress(estimated_completion_date);

-- Customer communications indexes
CREATE INDEX IF NOT EXISTS idx_customer_communications_customer_id ON customer_communications(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_communications_type ON customer_communications(communication_type);
CREATE INDEX IF NOT EXISTS idx_customer_communications_created_at ON customer_communications(created_at);

-- Customer payments indexes
CREATE INDEX IF NOT EXISTS idx_customer_payments_customer_id ON customer_payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_payments_payment_status ON customer_payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_customer_payments_transaction_date ON customer_payments(transaction_date);

-- ============================================================================
-- 7. TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Create triggers for updated_at columns
CREATE TRIGGER update_customer_submissions_updated_at 
    BEFORE UPDATE ON customer_submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_progress_updated_at 
    BEFORE UPDATE ON customer_progress 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_communications_updated_at 
    BEFORE UPDATE ON customer_communications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_payments_updated_at 
    BEFORE UPDATE ON customer_payments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. VIEWS FOR CUSTOMER MANAGEMENT
-- ============================================================================

-- Comprehensive customer management view
CREATE OR REPLACE VIEW customer_management AS
SELECT 
    c.id,
    c.customer_id,
    c.email,
    c.first_name,
    c.last_name,
    c.full_name,
    c.business_name,
    c.company_name,
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
    c.subscription_tier,
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
    EXTRACT(DAYS FROM (CURRENT_TIMESTAMP - c.created_at))::integer as days_since_creation
FROM customers c;

-- Customer overview with progress metrics
CREATE OR REPLACE VIEW customer_overview AS
SELECT 
    c.id,
    c.customer_id,
    c.email,
    c.first_name,
    c.last_name,
    c.business_name,
    c.package_type,
    c.submission_status,
    c.payment_status,
    c.created_at,
    COALESCE(cp.directories_submitted, 0) as directories_submitted,
    COALESCE(cp.directories_approved, 0) as directories_approved,
    COALESCE(cp.directories_rejected, 0) as directories_rejected,
    COALESCE(cp.directories_pending, 0) as directories_pending,
    COALESCE(cp.completion_percentage, 0) as completion_percentage,
    COALESCE(cp.approval_rate, 0) as approval_rate,
    cp.estimated_completion_date,
    cp.project_manager,
    cp.overall_status as project_status
FROM customers c
LEFT JOIN customer_progress cp ON c.id = cp.customer_id;

-- ============================================================================
-- 9. BACKFILL EXISTING DATA
-- ============================================================================

-- Generate customer_ids for existing customers
UPDATE customers 
SET customer_id = generate_customer_id() 
WHERE customer_id IS NULL OR customer_id = '';

-- Make customer_id NOT NULL after backfill
ALTER TABLE customers ALTER COLUMN customer_id SET NOT NULL;

-- Create unique constraint
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_customer_id_key;
ALTER TABLE customers ADD CONSTRAINT customers_customer_id_key UNIQUE (customer_id);

-- Create initial progress records for existing customers
INSERT INTO customer_progress (customer_id)
SELECT id FROM customers 
WHERE id NOT IN (SELECT customer_id FROM customer_progress);

-- ============================================================================
-- 10. TEST DATA
-- ============================================================================

-- Create a test customer to verify everything works
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
    'test-customer@directorybolt.com',
    '$2a$12$LQv3c1yqBWVHxkd0LQ4YCOuLQkAL1J9HU.xQJvvn1aLDnEKJjY5P2',
    'John',
    'Doe',
    'Acme Technology Corp',
    '+1-555-123-4567',
    'https://acmetech.example.com',
    'Technology',
    'pro',
    'in_progress',
    'A technology company specializing in innovative web solutions and digital transformation services.',
    true,
    true
) ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

-- Display success message
SELECT 'DirectoryBolt customer management schema setup completed successfully!' as status;

-- Show a test customer ID generation
SELECT 'Test customer ID: ' || generate_customer_id() as test_result;