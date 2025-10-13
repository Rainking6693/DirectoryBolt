-- Reset Stuck Jobs
-- Run this in Supabase SQL Editor to reset jobs that are stuck in "in_progress"

-- Find stuck jobs (in_progress for more than 10 minutes)
SELECT 
    id,
    customer_id,
    status,
    created_at,
    updated_at,
    EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as minutes_stuck
FROM jobs
WHERE status = 'in_progress'
AND updated_at < NOW() - INTERVAL '10 minutes';

-- Reset stuck jobs back to pending so they can be processed again
UPDATE jobs
SET 
    status = 'pending',
    updated_at = NOW()
WHERE status = 'in_progress'
AND updated_at < NOW() - INTERVAL '10 minutes';

-- Show the jobs that were reset
SELECT 
    id,
    customer_id,
    status,
    updated_at
FROM jobs
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;

