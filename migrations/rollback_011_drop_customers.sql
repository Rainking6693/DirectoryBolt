-- Rollback Migration: Drop Customers Table
-- Purpose: Rollback migration 011 - remove customers table and related objects
-- Date: 2025-09-05
-- Usage: Run this if you need to rollback migration 011

-- Drop views that depend on customers table
DROP VIEW IF EXISTS customer_dashboard CASCADE;

-- Drop triggers and functions
DROP TRIGGER IF EXISTS trigger_set_customer_billing_period ON customers;
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;

DROP FUNCTION IF EXISTS set_customer_billing_period() CASCADE;
DROP FUNCTION IF EXISTS reset_customer_billing_period(UUID) CASCADE;

-- Drop the customers table
DROP TABLE IF EXISTS customers CASCADE;

-- Log rollback completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 011 rollback completed successfully at %: customers table and related objects dropped', CURRENT_TIMESTAMP;
END $$;