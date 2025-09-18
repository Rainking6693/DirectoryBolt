-- DirectoryBolt Customers Table Migration
-- Run this SQL in Supabase SQL Editor: https://app.kolgqfjgncdwddziqloz.supabase.co/project/_/sql

-- First, create the update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create customers table with comprehensive business data
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Authentication & Profile
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    
    -- Flexible Business Data Storage
    business_data JSONB DEFAULT '{}', -- {industry, website, phone, address, description, logo_url, etc.}
    
    -- Subscription & Billing
    subscription_tier VARCHAR(20) DEFAULT 'basic' CHECK (
        subscription_tier IN ('basic', 'pro', 'enterprise')
    ),
    stripe_customer_id VARCHAR(255) UNIQUE,
    stripe_subscription_id VARCHAR(255),
    subscription_status VARCHAR(30) DEFAULT 'trialing' CHECK (
        subscription_status IN ('active', 'trialing', 'past_due', 'cancelled', 'unpaid', 'incomplete', 'incomplete_expired')
    ),
    
    -- Usage & Billing Cycle
    credits_remaining INTEGER DEFAULT 100,
    credits_limit INTEGER DEFAULT 100,
    billing_period_start TIMESTAMP WITH TIME ZONE,
    billing_period_end TIMESTAMP WITH TIME ZONE,
    current_period_usage INTEGER DEFAULT 0,
    
    -- Trial Management
    trial_starts_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '14 days'),
    
    -- Account Status & Security
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    
    -- Login Security
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    
    -- Subscription Management
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    subscription_created_at TIMESTAMP WITH TIME ZONE,
    last_portal_access_at TIMESTAMP WITH TIME ZONE,
    
    -- Plan Changes
    pending_plan_change VARCHAR(20) CHECK (
        pending_plan_change IN ('basic', 'pro', 'enterprise') OR pending_plan_change IS NULL
    ),
    plan_change_effective_at TIMESTAMP WITH TIME ZONE,
    
    -- Customer Preferences
    notification_preferences JSONB DEFAULT '{
        "email_notifications": true,
        "submission_updates": true,
        "marketing_emails": false,
        "weekly_reports": true
    }',
    
    -- Onboarding & Experience
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_step INTEGER DEFAULT 0,
    first_submission_completed BOOLEAN DEFAULT false,
    
    -- Audit & Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional metadata for extensibility
    metadata JSONB DEFAULT '{}'
);

-- Create strategic indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_stripe_customer_id ON customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_stripe_subscription_id ON customers(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_customers_subscription_tier ON customers(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_customers_subscription_status ON customers(subscription_status);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_is_verified ON customers(is_verified);
CREATE INDEX IF NOT EXISTS idx_customers_trial_ends ON customers(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_customers_billing_period_end ON customers(billing_period_end);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON customers(company_name) WHERE company_name IS NOT NULL;

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_customers_tier_status ON customers(subscription_tier, subscription_status);
CREATE INDEX IF NOT EXISTS idx_customers_active_verified ON customers(is_active, is_verified);
CREATE INDEX IF NOT EXISTS idx_customers_status_trial ON customers(subscription_status, trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_customers_usage_limit ON customers(current_period_usage, credits_limit);

-- GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_customers_business_data_gin ON customers USING GIN (business_data);
CREATE INDEX IF NOT EXISTS idx_customers_notification_preferences_gin ON customers USING GIN (notification_preferences);
CREATE INDEX IF NOT EXISTS idx_customers_metadata_gin ON customers USING GIN (metadata);

-- Create trigger for updated_at
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically set billing periods based on subscription tier
CREATE OR REPLACE FUNCTION set_customer_billing_period()
RETURNS TRIGGER AS $$
BEGIN
    -- Set billing period based on subscription tier (monthly billing)
    IF NEW.subscription_tier IS NOT NULL AND NEW.billing_period_start IS NULL THEN
        NEW.billing_period_start = CURRENT_TIMESTAMP;
        NEW.billing_period_end = CURRENT_TIMESTAMP + INTERVAL '1 month';
    END IF;
    
    -- Set credits limit based on subscription tier
    IF NEW.subscription_tier IS NOT NULL THEN
        NEW.credits_limit = CASE NEW.subscription_tier
            WHEN 'basic' THEN 100
            WHEN 'pro' THEN 500
            WHEN 'enterprise' THEN 2000
            ELSE 100
        END;
        
        -- Set credits_remaining to limit if it's a new customer
        IF OLD.subscription_tier IS NULL THEN
            NEW.credits_remaining = NEW.credits_limit;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_customer_billing_period
    BEFORE INSERT OR UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION set_customer_billing_period();

-- Create function to reset billing period usage
CREATE OR REPLACE FUNCTION reset_customer_billing_period(customer_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE customers 
    SET 
        current_period_usage = 0,
        billing_period_start = CURRENT_TIMESTAMP,
        billing_period_end = CURRENT_TIMESTAMP + INTERVAL '1 month'
    WHERE id = customer_id;
END;
$$ LANGUAGE plpgsql;

-- Create view for customer dashboard analytics
CREATE OR REPLACE VIEW customer_dashboard AS
SELECT 
    c.id,
    c.email,
    c.full_name,
    c.company_name,
    c.subscription_tier,
    c.subscription_status,
    c.credits_remaining,
    c.credits_limit,
    c.current_period_usage,
    c.billing_period_end,
    c.trial_ends_at,
    c.is_verified,
    c.onboarding_completed,
    c.first_submission_completed,
    c.business_data,
    -- Calculate days remaining in trial
    CASE 
        WHEN c.subscription_status = 'trialing' THEN 
            EXTRACT(DAYS FROM (c.trial_ends_at - CURRENT_TIMESTAMP))
        ELSE NULL 
    END as trial_days_remaining,
    -- Calculate usage percentage
    ROUND(
        (c.current_period_usage::numeric / NULLIF(c.credits_limit, 0)) * 100, 2
    ) as usage_percentage,
    -- Calculate days until billing renewal
    CASE 
        WHEN c.billing_period_end > CURRENT_TIMESTAMP THEN
            EXTRACT(DAYS FROM (c.billing_period_end - CURRENT_TIMESTAMP))
        ELSE 0
    END as days_until_renewal,
    c.created_at
FROM customers c;

-- Add comprehensive comments
COMMENT ON TABLE customers IS 'Enhanced customer management with flexible business data and subscription integration';
COMMENT ON COLUMN customers.business_data IS 'JSONB field for flexible business information storage (industry, website, phone, etc.)';
COMMENT ON COLUMN customers.subscription_tier IS 'Customer subscription level (basic, pro, enterprise)';
COMMENT ON COLUMN customers.stripe_customer_id IS 'Stripe customer ID for payment integration';
COMMENT ON COLUMN customers.credits_remaining IS 'Available credits for directory submissions';
COMMENT ON COLUMN customers.credits_limit IS 'Monthly credit limit based on subscription tier';
COMMENT ON COLUMN customers.current_period_usage IS 'Credits used in current billing period';
COMMENT ON COLUMN customers.trial_ends_at IS 'End date of trial period';
COMMENT ON COLUMN customers.notification_preferences IS 'Customer notification settings as JSON';
COMMENT ON COLUMN customers.onboarding_completed IS 'Whether customer has completed onboarding flow';
COMMENT ON COLUMN customers.business_data IS 'Flexible storage for business profile data';

-- Create initial admin customer for testing (replace with real admin credentials)
INSERT INTO customers (
    email, 
    password_hash, 
    full_name, 
    subscription_tier, 
    is_verified, 
    is_active,
    onboarding_completed,
    business_data
) VALUES (
    'admin@directorybolt.com',
    '$2a$12$LQv3c1yqBWVHxkd0LQ4YCOuLQkAL1J9HU.xQJvvn1aLDnEKJjY5P2', -- 'admin123' hashed
    'Directory Bolt Admin',
    'enterprise',
    true,
    true,
    true,
    '{
        "industry": "Technology",
        "website": "https://directorybolt.com",
        "company_type": "SaaS",
        "description": "Directory submission automation platform"
    }'
) ON CONFLICT (email) DO NOTHING;

-- Verify table creation
SELECT 'Customers table created successfully!' as status;