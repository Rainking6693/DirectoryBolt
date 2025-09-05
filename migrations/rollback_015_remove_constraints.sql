-- Rollback Migration: Remove Foreign Key Constraints and Performance Optimizations
-- Purpose: Rollback migration 015 - remove constraints and performance optimizations
-- Date: 2025-09-05
-- Usage: Run this if you need to rollback migration 015

-- Drop materialized view and related objects
DROP MATERIALIZED VIEW IF EXISTS dashboard_summary CASCADE;
DROP VIEW IF EXISTS database_health_monitor CASCADE;

-- Drop functions created in migration 015
DROP FUNCTION IF EXISTS update_directory_statistics() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_data() CASCADE;
DROP FUNCTION IF EXISTS generate_daily_analytics(DATE) CASCADE;
DROP FUNCTION IF EXISTS refresh_dashboard_summary() CASCADE;

-- Drop performance indexes created in migration 015
DROP INDEX CONCURRENTLY IF EXISTS idx_customers_subscription_billing;
DROP INDEX CONCURRENTLY IF EXISTS idx_customers_trial_expiry;
DROP INDEX CONCURRENTLY IF EXISTS idx_customers_usage_tracking;
DROP INDEX CONCURRENTLY IF EXISTS idx_submission_queue_worker_assignment;
DROP INDEX CONCURRENTLY IF EXISTS idx_submission_queue_batch_processing;
DROP INDEX CONCURRENTLY IF EXISTS idx_pending_actions_va_dashboard;
DROP INDEX CONCURRENTLY IF EXISTS idx_pending_actions_urgent;
DROP INDEX CONCURRENTLY IF EXISTS idx_directory_submissions_analytics;
DROP INDEX CONCURRENTLY IF EXISTS idx_directory_submissions_customer_analytics;
DROP INDEX CONCURRENTLY IF EXISTS idx_directory_submissions_performance;
DROP INDEX CONCURRENTLY IF EXISTS idx_customers_submissions_join;
DROP INDEX CONCURRENTLY IF EXISTS idx_customers_expiring_trials;
DROP INDEX CONCURRENTLY IF EXISTS idx_customers_overdue_billing;
DROP INDEX CONCURRENTLY IF EXISTS idx_submission_queue_stuck_items;
DROP INDEX CONCURRENTLY IF EXISTS idx_pending_actions_overdue;
DROP INDEX CONCURRENTLY IF EXISTS idx_directory_submissions_follow_up_due;
DROP INDEX CONCURRENTLY IF EXISTS idx_customer_submission_summary;
DROP INDEX CONCURRENTLY IF EXISTS idx_directory_performance_summary;

-- Remove foreign key constraints (keeping table structure intact)
ALTER TABLE user_submissions DROP CONSTRAINT IF EXISTS fk_user_submissions_customer_id;
ALTER TABLE submission_queue DROP CONSTRAINT IF EXISTS submission_queue_customer_id_fkey;
ALTER TABLE pending_actions DROP CONSTRAINT IF EXISTS pending_actions_customer_id_fkey;
ALTER TABLE directory_submissions DROP CONSTRAINT IF EXISTS directory_submissions_customer_id_fkey;

-- Log rollback completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 015 rollback completed successfully at %', CURRENT_TIMESTAMP;
END $$;