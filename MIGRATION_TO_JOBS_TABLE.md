# Migration from autobolt_processing_queue to jobs table

## Summary
Successfully migrated all worker and API code from using `autobolt_processing_queue` to the canonical `jobs` table.

## Changes Made

### 1. Updated Core Functions (`lib/server/autoboltJobs.ts`)
- ✅ `getNextPendingJob()` - Now queries `jobs` table directly
- ✅ `updateJobProgress()` - Updates `jobs` table
- ✅ `completeJob()` - Marks jobs as complete in `jobs` table
- ✅ `markJobInProgress()` - Updates `jobs` table
- ✅ `retryFailedJob()` - Resets jobs in `jobs` table

### 2. Flow Architecture
```
Worker → /api/autobolt/jobs/next → getNextPendingJob() → jobs table
Worker → /api/autobolt/jobs/update → updateJobProgress() → jobs table + job_results table
Worker → /api/autobolt/jobs/complete → completeJob() → jobs table (status = 'complete')
```

### 3. Data Flow
1. **Job Creation**: Customer created → Job created in `jobs` table with `status = 'pending'`
2. **Job Processing**: Worker fetches next pending job from `jobs` table, updates to `status = 'in_progress'`
3. **Progress Updates**: Worker submits directory results to `job_results` table, aggregates progress from there
4. **Job Completion**: Worker marks job as `status = 'complete'` in `jobs` table

### 4. Tables Used
- **`jobs`**: Main job tracking (status, metadata, timestamps)
- **`job_results`**: Individual directory submission results (aggregated for progress)
- **`customers`**: Customer business information

### 5. Cleanup Scripts
- Created `cleanup-autobolt-tables.js` to remove any remaining data from `autobolt_processing_queue`
- Old migration script `migrate-jobs-to-queue.js` is no longer needed

## Next Steps
1. ✅ Delete `autobolt_processing_queue` table in Supabase dashboard
2. ✅ All worker processes now use `jobs` table
3. ✅ UI progress bars read from `job_results` aggregation

## Benefits
- Single source of truth for job status
- Simpler architecture (no duplicate data)
- Progress tracking via `job_results` aggregation
- Easier to debug and maintain

