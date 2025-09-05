-- Migration: Add Foreign Key Constraints and Performance Optimizations
-- Purpose: Add proper foreign key constraints and optimize database performance
-- Date: 2025-09-05
-- Phase: 2.1 Database Schema Enhancement - Final Optimization

-- First, ensure we have proper foreign key constraints between all tables
-- Note: Some constraints may already exist from previous migrations

-- Add foreign key constraints for user_submissions to link with new customers table
-- (This updates the existing user_submissions table to work with the new customers table)
DO $$
BEGIN
    -- Check if the foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_submissions_customer_id' 
        AND table_name = 'user_submissions'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE user_submissions 
        ADD CONSTRAINT fk_user_submissions_customer_id 
        FOREIGN KEY (user_id) REFERENCES customers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Ensure submission_queue has proper foreign key to customers (should exist from migration 012)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'submission_queue_customer_id_fkey' 
        AND table_name = 'submission_queue'
    ) THEN
        ALTER TABLE submission_queue 
        ADD CONSTRAINT submission_queue_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Ensure pending_actions has proper foreign keys (should exist from migration 013)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'pending_actions_customer_id_fkey' 
        AND table_name = 'pending_actions'
    ) THEN
        ALTER TABLE pending_actions 
        ADD CONSTRAINT pending_actions_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Ensure directory_submissions has proper foreign keys (should exist from migration 014)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'directory_submissions_customer_id_fkey' 
        AND table_name = 'directory_submissions'
    ) THEN
        ALTER TABLE directory_submissions 
        ADD CONSTRAINT directory_submissions_customer_id_fkey 
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create additional performance indexes for cross-table queries
-- These indexes optimize common dashboard and analytics queries

-- Customer dashboard optimization indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_subscription_billing 
ON customers(subscription_tier, subscription_status, billing_period_end);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_trial_expiry 
ON customers(subscription_status, trial_ends_at) 
WHERE subscription_status = 'trialing';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_usage_tracking 
ON customers(current_period_usage, credits_limit, billing_period_end);

-- Queue processing optimization indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submission_queue_worker_assignment 
ON submission_queue(status, priority, scheduled_for, worker_id) 
WHERE status IN ('pending', 'retry_needed');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submission_queue_batch_processing 
ON submission_queue(batch_id, status, priority) 
WHERE batch_id IS NOT NULL;

-- Pending actions VA management indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pending_actions_va_dashboard 
ON pending_actions(assigned_to_va_id, status, priority, deadline_at) 
WHERE assigned_to_va_id IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pending_actions_urgent 
ON pending_actions(priority, deadline_at, status) 
WHERE priority <= 2 AND status IN ('pending', 'assigned', 'in_progress');

-- Directory submissions analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_directory_submissions_analytics 
ON directory_submissions(directory_id, status, submitted_at, approved_at) 
WHERE status IN ('approved', 'rejected', 'submitted', 'under_review');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_directory_submissions_customer_analytics 
ON directory_submissions(customer_id, status, created_at, credits_consumed);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_directory_submissions_performance 
ON directory_submissions(automation_method, status, processing_time_seconds) 
WHERE processing_time_seconds IS NOT NULL;

-- Cross-table analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_submissions_join 
ON customers(id, subscription_tier, created_at) 
WHERE is_active = true;

-- Partial indexes for specific business logic
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_expiring_trials 
ON customers(trial_ends_at, email) 
WHERE subscription_status = 'trialing' AND trial_ends_at > CURRENT_TIMESTAMP;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_overdue_billing 
ON customers(billing_period_end, subscription_status) 
WHERE billing_period_end < CURRENT_TIMESTAMP AND subscription_status = 'active';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submission_queue_stuck_items 
ON submission_queue(created_at, status, last_error_timestamp) 
WHERE status = 'processing' AND created_at < CURRENT_TIMESTAMP - INTERVAL '1 hour';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pending_actions_overdue 
ON pending_actions(deadline_at, status, priority) 
WHERE deadline_at < CURRENT_TIMESTAMP AND status NOT IN ('completed', 'cancelled', 'failed');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_directory_submissions_follow_up_due 
ON directory_submissions(follow_up_scheduled_at, follow_up_required, status) 
WHERE follow_up_required = true AND follow_up_scheduled_at <= CURRENT_TIMESTAMP;

-- Create composite indexes for complex dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customer_submission_summary 
ON directory_submissions(customer_id, status, created_at, credits_consumed, quality_score);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_directory_performance_summary 
ON directory_submissions(directory_id, status, approval_time_hours, processing_time_seconds, manual_intervention_required);

-- Create function to update directory statistics
CREATE OR REPLACE FUNCTION update_directory_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update directory success rates and statistics when submissions change
    IF TG_TABLE_NAME = 'directory_submissions' AND 
       (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != NEW.status)) THEN
        
        -- Update the directories table with latest statistics
        UPDATE directories 
        SET 
            success_rate = COALESCE((
                SELECT 
                    COUNT(*) FILTER (WHERE status = 'approved')::numeric / 
                    NULLIF(COUNT(*) FILTER (WHERE status IN ('approved', 'rejected')), 0)
                FROM directory_submissions 
                WHERE directory_id = COALESCE(NEW.directory_id, OLD.directory_id)
            ), 0.70),
            
            avg_approval_time = COALESCE((
                SELECT AVG(approval_time_hours) / 24.0 -- Convert hours to days
                FROM directory_submissions 
                WHERE directory_id = COALESCE(NEW.directory_id, OLD.directory_id) 
                  AND approval_time_hours IS NOT NULL
            ), 3),
            
            last_checked_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
            
        WHERE id = COALESCE(NEW.directory_id, OLD.directory_id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update directory statistics
CREATE TRIGGER trigger_update_directory_statistics
    AFTER INSERT OR UPDATE OR DELETE ON directory_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_directory_statistics();

-- Create function to clean up old data and optimize performance
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS VOID AS $$
BEGIN
    -- Clean up old analytics data (older than 1 year)
    DELETE FROM submission_analytics_daily 
    WHERE analytics_date < CURRENT_DATE - INTERVAL '1 year';
    
    -- Archive completed pending actions older than 6 months
    -- (In a real system, you'd move these to an archive table)
    DELETE FROM pending_actions 
    WHERE status IN ('completed', 'cancelled', 'failed') 
      AND completed_at < CURRENT_TIMESTAMP - INTERVAL '6 months';
    
    -- Clean up old error logs in submission queue
    UPDATE submission_queue 
    SET error_log = '[]'::jsonb,
        last_error_message = NULL,
        last_error_timestamp = NULL
    WHERE status IN ('completed', 'cancelled') 
      AND updated_at < CURRENT_TIMESTAMP - INTERVAL '3 months';
    
    -- Log the cleanup operation
    RAISE NOTICE 'Old data cleanup completed at %', CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate daily analytics
CREATE OR REPLACE FUNCTION generate_daily_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    -- Generate daily analytics for directory submissions
    INSERT INTO submission_analytics_daily (
        analytics_date,
        directory_id,
        customer_id,
        total_submissions,
        successful_submissions,
        failed_submissions,
        pending_submissions,
        approved_submissions,
        rejected_submissions,
        average_approval_time_hours,
        average_processing_time_seconds,
        success_rate,
        approval_rate,
        average_quality_score,
        compliance_rate,
        manual_intervention_rate,
        total_credits_consumed,
        estimated_traffic_generated,
        estimated_leads_generated,
        total_submission_costs_cents,
        average_cost_per_submission_cents,
        automation_success_rate,
        error_rate,
        retry_rate
    )
    SELECT 
        target_date as analytics_date,
        directory_id,
        customer_id,
        COUNT(*) as total_submissions,
        COUNT(*) FILTER (WHERE status IN ('approved', 'submitted', 'under_review')) as successful_submissions,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_submissions,
        COUNT(*) FILTER (WHERE status IN ('pending', 'submitting')) as pending_submissions,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_submissions,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected_submissions,
        AVG(approval_time_hours) as average_approval_time_hours,
        AVG(processing_time_seconds) as average_processing_time_seconds,
        ROUND(
            COUNT(*) FILTER (WHERE status IN ('approved', 'submitted'))::numeric / 
            NULLIF(COUNT(*), 0) * 100, 2
        ) as success_rate,
        ROUND(
            COUNT(*) FILTER (WHERE status = 'approved')::numeric / 
            NULLIF(COUNT(*) FILTER (WHERE status IN ('approved', 'rejected')), 0) * 100, 2
        ) as approval_rate,
        AVG(quality_score) as average_quality_score,
        ROUND(
            COUNT(*) FILTER (WHERE compliance_status = 'compliant')::numeric / 
            NULLIF(COUNT(*), 0) * 100, 2
        ) as compliance_rate,
        ROUND(
            COUNT(*) FILTER (WHERE manual_intervention_required = true)::numeric / 
            NULLIF(COUNT(*), 0) * 100, 2
        ) as manual_intervention_rate,
        SUM(credits_consumed) as total_credits_consumed,
        SUM(traffic_generated_estimate) as estimated_traffic_generated,
        SUM(leads_generated_estimate) as estimated_leads_generated,
        SUM(submission_cost_cents) as total_submission_costs_cents,
        AVG(submission_cost_cents) as average_cost_per_submission_cents,
        ROUND(
            COUNT(*) FILTER (WHERE status IN ('approved', 'submitted') AND automation_method != 'manual')::numeric / 
            NULLIF(COUNT(*) FILTER (WHERE automation_method != 'manual'), 0) * 100, 2
        ) as automation_success_rate,
        ROUND(
            COUNT(*) FILTER (WHERE status = 'failed')::numeric / 
            NULLIF(COUNT(*), 0) * 100, 2
        ) as error_rate,
        ROUND(
            COUNT(*) FILTER (WHERE retry_attempts > 0)::numeric / 
            NULLIF(COUNT(*), 0) * 100, 2
        ) as retry_rate
    FROM directory_submissions
    WHERE DATE(created_at) = target_date
    GROUP BY directory_id, customer_id
    ON CONFLICT (analytics_date, directory_id, customer_id) 
    DO UPDATE SET
        total_submissions = EXCLUDED.total_submissions,
        successful_submissions = EXCLUDED.successful_submissions,
        failed_submissions = EXCLUDED.failed_submissions,
        pending_submissions = EXCLUDED.pending_submissions,
        approved_submissions = EXCLUDED.approved_submissions,
        rejected_submissions = EXCLUDED.rejected_submissions,
        average_approval_time_hours = EXCLUDED.average_approval_time_hours,
        average_processing_time_seconds = EXCLUDED.average_processing_time_seconds,
        success_rate = EXCLUDED.success_rate,
        approval_rate = EXCLUDED.approval_rate,
        average_quality_score = EXCLUDED.average_quality_score,
        compliance_rate = EXCLUDED.compliance_rate,
        manual_intervention_rate = EXCLUDED.manual_intervention_rate,
        total_credits_consumed = EXCLUDED.total_credits_consumed,
        estimated_traffic_generated = EXCLUDED.estimated_traffic_generated,
        estimated_leads_generated = EXCLUDED.estimated_leads_generated,
        total_submission_costs_cents = EXCLUDED.total_submission_costs_cents,
        average_cost_per_submission_cents = EXCLUDED.average_cost_per_submission_cents,
        automation_success_rate = EXCLUDED.automation_success_rate,
        error_rate = EXCLUDED.error_rate,
        retry_rate = EXCLUDED.retry_rate,
        updated_at = CURRENT_TIMESTAMP;
        
    RAISE NOTICE 'Daily analytics generated for % at %', target_date, CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for fast dashboard queries
CREATE MATERIALIZED VIEW IF NOT EXISTS dashboard_summary AS
SELECT 
    -- Customer summary
    COUNT(DISTINCT c.id) as total_customers,
    COUNT(DISTINCT c.id) FILTER (WHERE c.is_active = true) as active_customers,
    COUNT(DISTINCT c.id) FILTER (WHERE c.subscription_status = 'trialing') as trial_customers,
    COUNT(DISTINCT c.id) FILTER (WHERE c.subscription_tier = 'enterprise') as enterprise_customers,
    
    -- Submission summary
    COUNT(DISTINCT ds.id) as total_submissions,
    COUNT(DISTINCT ds.id) FILTER (WHERE ds.status = 'approved') as approved_submissions,
    COUNT(DISTINCT ds.id) FILTER (WHERE ds.created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours') as submissions_last_24h,
    COUNT(DISTINCT ds.id) FILTER (WHERE ds.created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days') as submissions_last_7d,
    
    -- Queue summary
    COUNT(DISTINCT sq.id) as total_queue_items,
    COUNT(DISTINCT sq.id) FILTER (WHERE sq.status = 'pending') as pending_queue_items,
    COUNT(DISTINCT sq.id) FILTER (WHERE sq.status = 'processing') as processing_queue_items,
    
    -- Pending actions summary
    COUNT(DISTINCT pa.id) as total_pending_actions,
    COUNT(DISTINCT pa.id) FILTER (WHERE pa.status = 'pending') as unassigned_actions,
    COUNT(DISTINCT pa.id) FILTER (WHERE pa.deadline_at < CURRENT_TIMESTAMP AND pa.status NOT IN ('completed', 'cancelled')) as overdue_actions,
    
    -- Performance metrics
    ROUND(AVG(ds.approval_time_hours), 2) as avg_approval_time_hours,
    ROUND(
        COUNT(ds.*) FILTER (WHERE ds.status = 'approved')::numeric / 
        NULLIF(COUNT(ds.*), 0) * 100, 2
    ) as overall_success_rate,
    
    -- Financial summary
    SUM(ds.credits_consumed) as total_credits_consumed,
    SUM(ds.submission_cost_cents) as total_revenue_cents,
    
    -- Last updated
    CURRENT_TIMESTAMP as last_updated
FROM customers c
FULL OUTER JOIN directory_submissions ds ON c.id = ds.customer_id
FULL OUTER JOIN submission_queue sq ON c.id = sq.customer_id
FULL OUTER JOIN pending_actions pa ON c.id = pa.customer_id;

-- Create unique index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_dashboard_summary_unique ON dashboard_summary (last_updated);

-- Create function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_summary()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_summary;
    RAISE NOTICE 'Dashboard summary refreshed at %', CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Add comprehensive comments for the new functions and optimizations
COMMENT ON FUNCTION update_directory_statistics() IS 'Automatically updates directory success rates and statistics when submissions change';
COMMENT ON FUNCTION cleanup_old_data() IS 'Cleans up old data to maintain database performance and storage efficiency';
COMMENT ON FUNCTION generate_daily_analytics() IS 'Generates daily aggregated analytics for business intelligence and reporting';
COMMENT ON FUNCTION refresh_dashboard_summary() IS 'Refreshes the materialized view for fast dashboard queries';
COMMENT ON MATERIALIZED VIEW dashboard_summary IS 'Pre-computed summary statistics for dashboard performance optimization';

-- Create view to monitor database health and performance
CREATE OR REPLACE VIEW database_health_monitor AS
SELECT 
    'customers' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours') as rows_added_24h,
    COUNT(*) FILTER (WHERE updated_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours') as rows_updated_24h,
    MAX(created_at) as last_insert,
    MAX(updated_at) as last_update
FROM customers

UNION ALL

SELECT 
    'submission_queue' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours') as rows_added_24h,
    COUNT(*) FILTER (WHERE updated_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours') as rows_updated_24h,
    MAX(created_at) as last_insert,
    MAX(updated_at) as last_update
FROM submission_queue

UNION ALL

SELECT 
    'pending_actions' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours') as rows_added_24h,
    COUNT(*) FILTER (WHERE updated_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours') as rows_updated_24h,
    MAX(created_at) as last_insert,
    MAX(updated_at) as last_update
FROM pending_actions

UNION ALL

SELECT 
    'directory_submissions' as table_name,
    COUNT(*) as total_rows,
    COUNT(*) FILTER (WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours') as rows_added_24h,
    COUNT(*) FILTER (WHERE updated_at >= CURRENT_TIMESTAMP - INTERVAL '24 hours') as rows_updated_24h,
    MAX(created_at) as last_insert,
    MAX(updated_at) as last_update
FROM directory_submissions

ORDER BY table_name;

COMMENT ON VIEW database_health_monitor IS 'Monitor database table health, growth, and activity for performance optimization';

-- Log successful completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 015 completed successfully at %: Foreign key constraints and performance optimizations added', CURRENT_TIMESTAMP;
END $$;