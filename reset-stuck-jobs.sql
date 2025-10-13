-- Reset Stuck Jobs - Run this in Supabase SQL Editor

-- Find stuck jobs (in_progress for more than 5 minutes)
SELECT
    id,
    customer_id,
    business_name,
    status,
    created_at,
    updated_at,
    EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as minutes_stuck
FROM jobs
WHERE status = 'in_progress'
AND updated_at < NOW() - INTERVAL '5 minutes';

-- Reset stuck jobs back to pending so they can be processed again
UPDATE jobs
SET
    status = 'pending',
    updated_at = NOW()
WHERE status = 'in_progress'
AND updated_at < NOW() - INTERVAL '5 minutes';

-- Also reset any jobs that have been in_progress for too long (over 1 hour)
UPDATE jobs
SET
    status = 'failed',
    error_message = 'Job stuck in progress for over 1 hour',
    updated_at = NOW()
WHERE status = 'in_progress'
AND updated_at < NOW() - INTERVAL '1 hour';

-- Show current job status
SELECT
    status,
    COUNT(*) as count
FROM jobs
GROUP BY status;

-- Show the most recent jobs
SELECT
    id,
    customer_id,
    business_name,
    status,
    created_at,
    updated_at
FROM jobs
ORDER BY created_at DESC
LIMIT 10;

