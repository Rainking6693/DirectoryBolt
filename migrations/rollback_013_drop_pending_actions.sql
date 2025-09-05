-- Rollback Migration: Drop Pending Actions Table
-- Purpose: Rollback migration 013 - remove pending actions and VA management
-- Date: 2025-09-05
-- Usage: Run this if you need to rollback migration 013

-- Drop views that depend on pending_actions and virtual_assistants
DROP VIEW IF EXISTS action_center_dashboard CASCADE;
DROP VIEW IF EXISTS va_workload_dashboard CASCADE;

-- Drop triggers and functions
DROP TRIGGER IF EXISTS trigger_auto_assign_action ON pending_actions;
DROP TRIGGER IF EXISTS trigger_update_va_task_counts ON pending_actions;
DROP TRIGGER IF EXISTS update_virtual_assistants_updated_at ON virtual_assistants;
DROP TRIGGER IF EXISTS update_pending_actions_updated_at ON pending_actions;

DROP FUNCTION IF EXISTS auto_assign_action() CASCADE;
DROP FUNCTION IF EXISTS update_va_task_counts() CASCADE;

-- Drop the tables (virtual_assistants first due to foreign key dependency)
DROP TABLE IF EXISTS pending_actions CASCADE;
DROP TABLE IF EXISTS virtual_assistants CASCADE;

-- Log rollback completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 013 rollback completed successfully at %: pending_actions and virtual_assistants tables dropped', CURRENT_TIMESTAMP;
END $$;