-- Rollback Migration: Drop Directory Submissions Table
-- Purpose: Rollback migration 014 - remove directory submissions tracking
-- Date: 2025-09-05
-- Usage: Run this if you need to rollback migration 014

-- Drop views that depend on directory_submissions
DROP VIEW IF EXISTS submission_performance_dashboard CASCADE;
DROP VIEW IF EXISTS directory_performance_analytics CASCADE;
DROP VIEW IF EXISTS customer_submission_summary CASCADE;

-- Drop triggers and functions
DROP TRIGGER IF EXISTS trigger_calculate_submission_metrics ON directory_submissions;
DROP TRIGGER IF EXISTS update_submission_analytics_daily_updated_at ON submission_analytics_daily;
DROP FUNCTION IF EXISTS calculate_submission_metrics() CASCADE;

-- Drop the analytics table
DROP TABLE IF EXISTS submission_analytics_daily CASCADE;

-- Drop the main directory_submissions table
DROP TABLE IF EXISTS directory_submissions CASCADE;

-- Log rollback completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 014 rollback completed successfully at %: directory_submissions table and related objects dropped', CURRENT_TIMESTAMP;
END $$;