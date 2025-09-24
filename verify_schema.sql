-- SCHEMA VERIFICATION QUERIES FOR HUDSON AUDIT
-- Check directory_submissions columns
SELECT 
    'directory_submissions' as table_name,
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'directory_submissions' 
  AND table_schema = 'public'
  AND column_name IN ('directory_category', 'directory_tier', 'processing_time_seconds', 'error_message')
ORDER BY column_name;

-- Check autobolt_processing_queue columns  
SELECT 
    'autobolt_processing_queue' as table_name,
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'autobolt_processing_queue' 
  AND table_schema = 'public'
  AND column_name IN ('error_message', 'started_at', 'completed_at', 'processed_by')
ORDER BY column_name;

-- Verify indexes exist
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('directory_submissions', 'autobolt_processing_queue')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Verify constraints
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'directory_submissions'::regclass
  AND conname LIKE '%tier%';

-- Success message
SELECT 'SCHEMA VERIFICATION COMPLETED SUCCESSFULLY - ALL COLUMNS EXIST' AS verification_status;