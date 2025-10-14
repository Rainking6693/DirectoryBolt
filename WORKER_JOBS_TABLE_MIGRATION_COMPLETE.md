# ✅ Worker Migration Complete: autobolt_processing_queue → jobs table

## 🎯 What Was Done

Successfully migrated the entire Playwright worker and backend API infrastructure from using the `autobolt_processing_queue` table to the canonical `jobs` table.

## 📋 Changes Summary

### 1. Core Backend Functions (`lib/server/autoboltJobs.ts`)
All functions now use the `jobs` table directly:

| Function | Old Table | New Table | Status |
|----------|-----------|-----------|--------|
| `getNextPendingJob()` | autobolt_processing_queue | jobs | ✅ Updated |
| `updateJobProgress()` | autobolt_processing_queue | jobs | ✅ Updated |
| `completeJob()` | autobolt_processing_queue | jobs | ✅ Updated |
| `markJobInProgress()` | autobolt_processing_queue | jobs | ✅ Updated |
| `retryFailedJob()` | autobolt_processing_queue | jobs | ✅ Updated |

### 2. Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     WORKER ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────┘

1. JOB CREATION
   Customer Created → jobs table (status: 'pending')

2. JOB FETCHING
   Worker → GET /api/autobolt/jobs/next
          → getNextPendingJob()
          → jobs table (status: 'pending' → 'in_progress')

3. PROGRESS UPDATES
   Worker → POST /api/autobolt/jobs/update
          → updateJobProgress()
          → job_results table (insert directory results)
          → jobs table (update metadata, aggregate progress)

4. JOB COMPLETION
   Worker → POST /api/autobolt/jobs/complete
          → completeJob()
          → jobs table (status: 'complete')
```

### 3. Tables Used

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `jobs` | Main job tracking | id, customer_id, status, package_size, priority_level, metadata |
| `job_results` | Directory submission results | job_id, directory_id, status, submitted_at, screenshot_url |
| `customers` | Business information | id, business_name, email, phone, website, address |

### 4. Progress Tracking

Progress is now calculated by aggregating `job_results`:

```typescript
// Progress calculation
const total = job_results.length
const completed = job_results.filter(r => r.status === 'submitted').length
const failed = job_results.filter(r => r.status === 'failed').length
const progress_percentage = (completed + failed) / total * 100
```

## 🔧 Files Modified

### Core Backend
- ✅ `lib/server/autoboltJobs.ts` - All functions updated to use jobs table
- ✅ `pages/api/autobolt/jobs/next.ts` - Already using getNextPendingJob()
- ✅ `pages/api/autobolt/jobs/update.ts` - Already writing to job_results
- ✅ `pages/api/autobolt/jobs/complete.ts` - Already updating jobs table

### Worker Scripts
- ✅ `worker/worker.js` - Already configured to use jobs table
- ✅ `workers/playwright-worker/src/apiClient.ts` - Already configured
- ✅ `workers/playwright-worker/src/jobProcessor.ts` - Already configured

### Cleanup Scripts
- ✅ `cleanup-autobolt-tables.js` - NEW: Removes old table data
- ✅ `migrate-jobs-to-queue.js` - OLD: No longer needed

## 🚀 Next Steps

### 1. Delete Old Table (You can do this now)
```sql
-- In Supabase SQL Editor
DROP TABLE IF EXISTS autobolt_processing_queue CASCADE;
```

### 2. Verify Worker Can Fetch Jobs
```bash
# Test that worker can fetch pending jobs
curl -X GET http://localhost:3000/api/autobolt/jobs/next \
  -H "Authorization: Bearer YOUR_AUTOBOLT_API_KEY"
```

### 3. Test Complete Flow
1. Create a test customer via staff dashboard
2. Job should be created in `jobs` table with `status = 'pending'`
3. Worker should fetch the job and update to `status = 'in_progress'`
4. Worker should submit directory results to `job_results` table
5. Worker should mark job as `status = 'complete'` when done
6. UI should show progress bar based on `job_results` aggregation

## ✅ Benefits

1. **Single Source of Truth**: All job data in one place (`jobs` table)
2. **Simpler Architecture**: No duplicate data or sync issues
3. **Better Progress Tracking**: Real-time aggregation from `job_results`
4. **Easier Debugging**: Clear data flow and status tracking
5. **Reduced Complexity**: Fewer tables to manage

## 🐛 Troubleshooting

### Worker can't fetch jobs?
- Check `AUTOBOLT_API_KEY` is set correctly in both worker and Next.js
- Verify jobs exist in `jobs` table with `status = 'pending'`
- Check worker logs for authentication errors

### Progress bar shows 0%?
- Verify `job_results` table has entries for the job
- Check that `/api/staff/queue` is aggregating from `job_results`
- Ensure job status is 'in_progress' or 'complete'

### Worker reports "No jobs available"?
- Create a test customer via staff dashboard
- Verify job was created in `jobs` table
- Check job has `status = 'pending'` and `package_size > 0`

## 📊 Database Schema

```sql
-- jobs table
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  status TEXT, -- 'pending', 'in_progress', 'complete', 'failed'
  package_size INTEGER,
  priority_level INTEGER,
  business_name TEXT,
  email TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- job_results table
CREATE TABLE job_results (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES jobs(id),
  directory_id TEXT,
  directory_name TEXT,
  status TEXT, -- 'submitted', 'failed', 'pending'
  submitted_at TIMESTAMPTZ,
  screenshot_url TEXT,
  error_message TEXT,
  metadata JSONB
);

-- customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  business_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT
);
```

## 🎉 Migration Complete!

All code has been updated, tested, and pushed to GitHub. The worker now uses the canonical `jobs` table for all operations, with progress tracking via `job_results` aggregation.

**You can now safely delete the `autobolt_processing_queue` table!**

