-- Rollback Migration: Drop Submission Queue Table
-- Purpose: Rollback migration 012 - remove submission queue and batch processing
-- Date: 2025-09-05
-- Usage: Run this if you need to rollback migration 012

-- Drop views that depend on submission_queue and batch_submissions
DROP VIEW IF EXISTS queue_dashboard CASCADE;
DROP VIEW IF EXISTS queue_analytics CASCADE;

-- Drop triggers and functions
DROP TRIGGER IF EXISTS trigger_update_batch_progress ON submission_queue;
DROP TRIGGER IF EXISTS trigger_calculate_queue_wait_time ON submission_queue;
DROP TRIGGER IF EXISTS update_batch_submissions_updated_at ON batch_submissions;
DROP TRIGGER IF EXISTS update_submission_queue_updated_at ON submission_queue;

DROP FUNCTION IF EXISTS update_batch_progress() CASCADE;
DROP FUNCTION IF EXISTS calculate_queue_wait_time() CASCADE;

-- Drop foreign key constraint first
ALTER TABLE submission_queue DROP CONSTRAINT IF EXISTS fk_submission_queue_batch_id;

-- Drop the tables (submission_queue first due to foreign key dependency)
DROP TABLE IF EXISTS submission_queue CASCADE;
DROP TABLE IF EXISTS batch_submissions CASCADE;

-- Log rollback completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 012 rollback completed successfully at %: submission_queue and batch_submissions tables dropped', CURRENT_TIMESTAMP;
END $$;