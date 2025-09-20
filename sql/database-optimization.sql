-- Create read replica configuration for Supabase
-- This should be implemented via Supabase dashboard or CLI for production

-- Create materialized views for frequently accessed data
CREATE MATERIALIZED VIEW mv_user_submission_summary AS
SELECT 
  u.id as user_id,
  u.email,
  p.subscription_tier,
  COUNT(s.id) as total_submissions,
  COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as successful_submissions,
  COUNT(CASE WHEN s.status = 'failed' THEN 1 END) as failed_submissions,
  AVG(CASE WHEN s.status = 'completed' THEN 1.0 ELSE 0.0 END) as success_rate,
  MAX(s.created_at) as last_submission,
  SUM(s.credits_used) as total_credits_used
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN submissions s ON u.id = s.user_id
WHERE s.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.email, p.subscription_tier;

-- Create unique index for faster lookups
CREATE UNIQUE INDEX idx_mv_user_submission_summary_user_id 
ON mv_user_submission_summary(user_id);

-- Create index for filtering by subscription tier
CREATE INDEX idx_mv_user_submission_summary_tier 
ON mv_user_submission_summary(subscription_tier);

-- Create materialized view for directory performance analytics
CREATE MATERIALIZED VIEW mv_directory_performance AS
SELECT 
  d.id as directory_id,
  d.name as directory_name,
  d.category,
  d.domain_authority,
  COUNT(s.id) as total_submissions,
  COUNT(CASE WHEN s.status = 'completed' THEN 1 END) as successful_submissions,
  COUNT(CASE WHEN s.status = 'failed' THEN 1 END) as failed_submissions,
  AVG(CASE WHEN s.status = 'completed' THEN 1.0 ELSE 0.0 END) as success_rate,
  AVG(s.processing_time_ms) as avg_processing_time,
  MAX(s.created_at) as last_submission
FROM directories d
LEFT JOIN submissions s ON d.id = s.directory_id
WHERE s.created_at >= NOW() - INTERVAL '90 days'
GROUP BY d.id, d.name, d.category, d.domain_authority;

-- Create indexes for directory performance view
CREATE UNIQUE INDEX idx_mv_directory_performance_directory_id 
ON mv_directory_performance(directory_id);

CREATE INDEX idx_mv_directory_performance_category 
ON mv_directory_performance(category);

CREATE INDEX idx_mv_directory_performance_success_rate 
ON mv_directory_performance(success_rate DESC);

-- Create partitioned table for submission logs (for better performance with large datasets)
CREATE TABLE submission_logs_partitioned (
  id BIGSERIAL,
  submission_id UUID NOT NULL REFERENCES submissions(id),
  log_level VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions for the last 12 months and future months
DO $$
DECLARE
  start_date DATE;
  end_date DATE;
  table_name TEXT;
BEGIN
  -- Create partitions for last 12 months and next 3 months
  FOR i IN -12..3 LOOP
    start_date := DATE_TRUNC('month', NOW() + (i || ' months')::INTERVAL);
    end_date := start_date + INTERVAL '1 month';
    table_name := 'submission_logs_' || TO_CHAR(start_date, 'YYYY_MM');
    
    EXECUTE FORMAT('
      CREATE TABLE IF NOT EXISTS %I PARTITION OF submission_logs_partitioned
      FOR VALUES FROM (%L) TO (%L)
    ', table_name, start_date, end_date);
    
    -- Create indexes on each partition
    EXECUTE FORMAT('
      CREATE INDEX IF NOT EXISTS %I ON %I (submission_id, created_at)
    ', 'idx_' || table_name || '_submission_created', table_name);
    
    EXECUTE FORMAT('
      CREATE INDEX IF NOT EXISTS %I ON %I (log_level, created_at)
    ', 'idx_' || table_name || '_level_created', table_name);
  END LOOP;
END $$;

-- Create function to automatically create new partitions
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS VOID AS $$
DECLARE
  start_date DATE;
  end_date DATE;
  table_name TEXT;
BEGIN
  start_date := DATE_TRUNC('month', NOW() + INTERVAL '1 month');
  end_date := start_date + INTERVAL '1 month';
  table_name := 'submission_logs_' || TO_CHAR(start_date, 'YYYY_MM');
  
  EXECUTE FORMAT('
    CREATE TABLE IF NOT EXISTS %I PARTITION OF submission_logs_partitioned
    FOR VALUES FROM (%L) TO (%L)
  ', table_name, start_date, end_date);
  
  -- Create indexes on the new partition
  EXECUTE FORMAT('
    CREATE INDEX IF NOT EXISTS %I ON %I (submission_id, created_at)
  ', 'idx_' || table_name || '_submission_created', table_name);
  
  EXECUTE FORMAT('
    CREATE INDEX IF NOT EXISTS %I ON %I (log_level, created_at)
  ', 'idx_' || table_name || '_level_created', table_name);
END;
$$ LANGUAGE plpgsql;

-- Create automated cleanup function for old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS VOID AS $$
BEGIN
  -- Archive submissions older than 2 years to separate table
  INSERT INTO submissions_archive 
  SELECT * FROM submissions 
  WHERE created_at < NOW() - INTERVAL '2 years'
  ON CONFLICT (id) DO NOTHING;
  
  -- Delete archived submissions from main table
  DELETE FROM submissions 
  WHERE created_at < NOW() - INTERVAL '2 years';
  
  -- Drop old partition tables (older than 12 months)
  DECLARE
    partition_name TEXT;
    cutoff_date DATE := DATE_TRUNC('month', NOW() - INTERVAL '12 months');
  BEGIN
    FOR partition_name IN
      SELECT schemaname||'.'||tablename 
      FROM pg_tables 
      WHERE tablename LIKE 'submission_logs_%'
      AND tablename < 'submission_logs_' || TO_CHAR(cutoff_date, 'YYYY_MM')
    LOOP
      EXECUTE 'DROP TABLE IF EXISTS ' || partition_name;
    END LOOP;
  END;
  
  -- Refresh materialized views
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_submission_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_directory_performance;
  
  -- Update statistics
  ANALYZE submissions;
  ANALYZE directories;
  ANALYZE profiles;
END;
$$ LANGUAGE plpgsql;

-- Create archive table for old submissions
CREATE TABLE IF NOT EXISTS submissions_archive (
  LIKE submissions INCLUDING ALL
);

-- Create indexes on archive table
CREATE INDEX IF NOT EXISTS idx_submissions_archive_user_created 
ON submissions_archive(user_id, created_at);

CREATE INDEX IF NOT EXISTS idx_submissions_archive_status_created 
ON submissions_archive(status, created_at);

-- Schedule automatic cleanup (this would typically be done via pg_cron extension)
-- For Supabase, this should be implemented as a scheduled function

-- Performance optimization indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_user_status_created 
ON submissions(user_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_directory_status 
ON submissions(directory_id, status) 
WHERE created_at >= NOW() - INTERVAL '30 days';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_subscription_created 
ON profiles(subscription_tier, created_at);

-- Optimize frequently used queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_usage_user_feature_date 
ON api_usage(user_id, feature, date);

-- Create composite index for dashboard queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_submissions_dashboard 
ON submissions(user_id, created_at DESC, status) 
WHERE created_at >= NOW() - INTERVAL '7 days';

-- Add database connection pooling recommendations (implementation in application layer)
-- These optimizations should be implemented in the application code:

COMMENT ON SCHEMA public IS '
Database Optimization Notes:

1. Connection Pooling:
   - Use PgBouncer or Supabase built-in pooling
   - Set max pool size based on expected concurrent users
   - Use transaction-level pooling for better resource utilization

2. Query Optimization:
   - Use prepared statements for frequently executed queries
   - Implement query result caching (Redis recommended)
   - Use EXPLAIN ANALYZE to monitor query performance

3. Read Replica Strategy:
   - Route analytics queries to read replicas
   - Use read replicas for heavy reporting operations
   - Implement automatic failover for high availability

4. Monitoring:
   - Set up alerts for long-running queries (>500ms)
   - Monitor connection pool utilization
   - Track cache hit rates and optimize accordingly

5. Maintenance:
   - Schedule VACUUM and ANALYZE operations
   - Monitor index usage and remove unused indexes
   - Implement automated partition management
';

-- Create view for database health monitoring
CREATE OR REPLACE VIEW database_health_metrics AS
SELECT 
  'user_submission_summary' as metric_name,
  'materialized_view' as metric_type,
  pg_size_pretty(pg_total_relation_size('mv_user_submission_summary')) as size,
  (SELECT COUNT(*) FROM mv_user_submission_summary) as row_count,
  (SELECT MAX(last_submission) FROM mv_user_submission_summary) as last_updated
UNION ALL
SELECT 
  'directory_performance' as metric_name,
  'materialized_view' as metric_type,
  pg_size_pretty(pg_total_relation_size('mv_directory_performance')) as size,
  (SELECT COUNT(*) FROM mv_directory_performance) as row_count,
  (SELECT MAX(last_submission) FROM mv_directory_performance) as last_updated
UNION ALL
SELECT 
  'submissions_main' as metric_name,
  'table' as metric_type,
  pg_size_pretty(pg_total_relation_size('submissions')) as size,
  (SELECT COUNT(*) FROM submissions) as row_count,
  (SELECT MAX(created_at) FROM submissions) as last_updated
UNION ALL
SELECT 
  'submissions_archive' as metric_name,
  'archive_table' as metric_type,
  pg_size_pretty(pg_total_relation_size('submissions_archive')) as size,
  (SELECT COUNT(*) FROM submissions_archive) as row_count,
  (SELECT MAX(created_at) FROM submissions_archive) as last_updated;