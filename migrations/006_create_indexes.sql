-- Migration: Create Performance Indexes
-- Purpose: Strategic indexing for optimal query performance with 220+ directories
-- Date: 2025-08-31

-- Advanced composite indexes for complex queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_directories_search_optimization 
    ON directories(category_id, da_score DESC, success_rate DESC, is_active) 
    WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_directories_recommendation_engine 
    ON directories(priority_tier, da_score DESC, average_approval_time ASC, is_active) 
    WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_directories_user_filtering 
    ON directories(pricing_model, submission_difficulty, success_rate DESC, is_active) 
    WHERE is_active = true;

-- Text search indexes for directory names and descriptions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_directories_name_trgm 
    ON directories USING gin(name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_directories_description_trgm 
    ON directories USING gin(description gin_trgm_ops);

-- Create extension if not exists for trigram search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Specialized indexes for analytics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_directories_analytics_performance 
    ON directories(category_id, da_score, success_rate, average_approval_time) 
    WHERE is_active = true;

-- Indexes for batch processing optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_submissions_batch_processing 
    ON user_submissions(submission_status, priority DESC, created_at ASC) 
    WHERE submission_status IN ('pending', 'in_progress');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_submissions_retry_queue 
    ON user_submissions(next_retry_at ASC, retry_count, max_retries) 
    WHERE next_retry_at IS NOT NULL AND retry_count < max_retries;

-- Partial indexes for active records only (performance optimization)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_directories_active_high_da 
    ON directories(da_score DESC, success_rate DESC) 
    WHERE is_active = true AND da_score >= 70;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_directories_active_by_difficulty 
    ON directories(submission_difficulty, da_score DESC) 
    WHERE is_active = true;

-- Indexes for API endpoint optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_directories_api_listing 
    ON directories(created_at DESC, updated_at DESC, is_active) 
    WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_directories_popular 
    ON directories(success_rate DESC, da_score DESC, priority_tier) 
    WHERE is_active = true AND success_rate >= 0.7;

-- Category-specific indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_active_sorted 
    ON categories(sort_order ASC, display_name ASC) 
    WHERE is_active = true;

-- User submissions analytical indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_success_analysis 
    ON user_submissions(directory_id, submission_status, submitted_at, approved_at) 
    WHERE submission_status IN ('approved', 'rejected');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_user_history 
    ON user_submissions(user_id, created_at DESC, submission_status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_directory_performance 
    ON user_submissions(directory_id, submission_status, created_at DESC);

-- Batch processing indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_batch_submissions_monitoring 
    ON batch_submissions(status, created_at DESC, user_id) 
    WHERE status IN ('processing', 'pending');

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_batch_submissions_completion_tracking 
    ON batch_submissions(completed_at DESC, status, total_submissions) 
    WHERE status = 'completed';

-- Advanced JSONB indexes for metadata searches
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_directories_business_types_search 
    ON directories USING gin((business_types)) 
    WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_directories_features_search 
    ON directories USING gin((features)) 
    WHERE is_active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_categories_metadata_search 
    ON categories USING gin((metadata)) 
    WHERE is_active = true;

-- Form fields optimization for dynamic form generation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_directories_form_fields_structure 
    ON directories USING gin((form_fields)) 
    WHERE is_active = true AND form_fields IS NOT NULL;

-- Geographic and location-based indexes (if location data is added later)
-- These can be uncommented when location columns are added
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_directories_location 
--     ON directories USING gist(location_point) 
--     WHERE is_active = true AND location_point IS NOT NULL;

-- Statistics optimization indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_directories_stats_aggregation 
    ON directories(category_id, is_active, da_score, success_rate, pricing_model, submission_difficulty);

-- Queue processing indexes for background jobs
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_queue_processing 
    ON user_submissions(submission_status, priority DESC, created_at ASC) 
    WHERE submission_status = 'pending';

-- Real-time analytics indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_realtime_analytics 
    ON user_submissions(created_at DESC, submission_status, directory_id) 
    WHERE created_at >= (CURRENT_TIMESTAMP - INTERVAL '7 days');

-- Cleanup old submissions index (for maintenance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_cleanup_candidates 
    ON user_submissions(created_at ASC, submission_status) 
    WHERE submission_status IN ('completed', 'failed', 'cancelled') 
    AND created_at < (CURRENT_TIMESTAMP - INTERVAL '1 year');

-- Create function to analyze index usage
CREATE OR REPLACE FUNCTION analyze_index_usage()
RETURNS TABLE (
    schemaname text,
    tablename text,
    indexname text,
    idx_scan bigint,
    idx_tup_read bigint,
    idx_tup_fetch bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname::text,
        s.tablename::text,
        s.indexname::text,
        s.idx_scan,
        s.idx_tup_read,
        s.idx_tup_fetch
    FROM pg_stat_user_indexes s
    WHERE s.schemaname = 'public'
    AND (s.tablename IN ('directories', 'categories', 'user_submissions', 'batch_submissions'))
    ORDER BY s.idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Create function to monitor query performance
CREATE OR REPLACE FUNCTION get_slow_queries()
RETURNS TABLE (
    query text,
    calls bigint,
    total_time double precision,
    mean_time double precision,
    stddev_time double precision,
    rows bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pg_stat_statements.query,
        pg_stat_statements.calls,
        pg_stat_statements.total_time,
        pg_stat_statements.mean_time,
        pg_stat_statements.stddev_time,
        pg_stat_statements.rows
    FROM pg_stat_statements
    WHERE pg_stat_statements.query ILIKE '%directories%'
    OR pg_stat_statements.query ILIKE '%categories%'
    OR pg_stat_statements.query ILIKE '%user_submissions%'
    ORDER BY pg_stat_statements.mean_time DESC
    LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Update table statistics for query planner optimization
ANALYZE categories;
ANALYZE directories;
ANALYZE user_submissions;
ANALYZE batch_submissions;

-- Add comments for index documentation
COMMENT ON INDEX idx_directories_search_optimization IS 'Optimized for directory search and filtering by category, DA score, and success rate';
COMMENT ON INDEX idx_directories_recommendation_engine IS 'Powers the directory recommendation algorithm based on priority and performance metrics';
COMMENT ON INDEX idx_directories_user_filtering IS 'Optimizes user-facing filtering by pricing, difficulty, and success rate';
COMMENT ON INDEX idx_user_submissions_batch_processing IS 'Optimizes batch processing queue operations';
COMMENT ON INDEX idx_directories_popular IS 'Supports popular directories API endpoint with high success rate filter';

-- Performance monitoring query
DO $$
DECLARE
    index_count INTEGER;
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO index_count 
    FROM pg_indexes 
    WHERE schemaname = 'public' 
    AND tablename IN ('directories', 'categories', 'user_submissions', 'batch_submissions');
    
    SELECT COUNT(*) INTO table_count 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename IN ('directories', 'categories', 'user_submissions', 'batch_submissions');
    
    RAISE NOTICE 'Created % indexes across % tables for optimal performance', index_count, table_count;
    RAISE NOTICE 'Run SELECT * FROM analyze_index_usage() to monitor index usage';
    RAISE NOTICE 'Run SELECT * FROM get_slow_queries() to identify performance bottlenecks';
END $$;