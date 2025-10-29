# DB-WORKER Troubleshooting Guide

## Common Issues and Fixes

### Issue 1: Poller Not Finding Jobs

**Symptoms:**
- Poller logs "No pending jobs" continuously
- Jobs exist in database but aren't being processed

**Causes:**
1. Jobs table query is looking for wrong status values
2. `submission_queue_id` foreign key not set on directory_submissions
3. Jobs exist but have no linked submissions

**Fix:**
```bash
# Check if jobs exist
node check-job-submissions.js

# Verify job has submissions linked via submission_queue_id
# Run this query in Supabase SQL editor:
SELECT 
  j.id as job_id, 
  j.status as job_status,
  COUNT(ds.id) as submission_count
FROM jobs j
LEFT JOIN directory_submissions ds ON ds.submission_queue_id = j.id
WHERE j.status IN ('pending', 'in_progress')
GROUP BY j.id, j.status;
```

### Issue 2: Missing API Keys

**Symptoms:**
- Poller crashes on startup
- "API key not set" errors in logs

**Fix:**
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Fill in ALL required keys:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ANTHROPIC_API_KEY=sk-ant-...
   GEMINI_API_KEY=AIza...
   TWO_CAPTCHA_API_KEY=your_2captcha_key (optional)
   ```

3. Run diagnostics:
   ```bash
   node diagnose-connections.js
   ```

### Issue 3: Anthropic SDK Not Installed

**Symptoms:**
- Error: `Cannot find module '@anthropic-ai/sdk'`

**Fix:**
```bash
npm install
# or
npm install @anthropic-ai/sdk
```

### Issue 4: Gemini API Returning Markdown Code Blocks

**Symptoms:**
- Form mapping fails with JSON parse errors
- Logs show "Failed to parse JSON for [url]"
- Falls back to FALLBACK_MAPPING constantly

**Status:** ✅ FIXED in custom-poller.js
- Added `stripMarkdownCodeBlocks()` function
- Improved Gemini prompt to request raw JSON only
- Added retry logic with exponential backoff

### Issue 5: CAPTCHA Solver Crashes

**Symptoms:**
- Error: `Cannot read property 'recaptcha' of null`
- Poller crashes when encountering CAPTCHA

**Status:** ✅ FIXED in custom-poller.js
- Added null check before using solver
- Throws clear error if CAPTCHA detected but solver not configured

### Issue 6: Poller Waits 30 Seconds Before First Job

**Symptoms:**
- Poller starts but doesn't process jobs immediately
- Long delay before first submission

**Status:** ✅ FIXED in custom-poller.js
- Now executes `pollForJobs()` immediately on startup
- Then continues with interval polling

### Issue 7: Database Connection Fails

**Symptoms:**
- "Connection refused" or "Invalid API key" errors
- Supabase queries fail

**Fix:**
1. Verify Supabase URL format:
   ```
   https://abcdefghijklmnop.supabase.co
   ```

2. Use SERVICE_ROLE_KEY, NOT anon key:
   ```bash
   # Wrong (anon key - starts with 'eyJ'):
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   
   # Correct (service role key - longer, different format):
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSJ9...
   ```

3. Test connection:
   ```bash
   node test-supabase-connection.js
   ```

### Issue 8: Jobs Complete But Submissions Stay "Pending"

**Symptoms:**
- Job status changes to "completed" or "failed"
- directory_submissions rows remain in "pending" status

**Cause:**
- Submissions not linked to job via `submission_queue_id`
- Query in `fetchNextJobWithSubmissions()` returns empty array

**Fix:**
```sql
-- Update existing submissions to link to their job
UPDATE directory_submissions ds
SET submission_queue_id = j.id
FROM jobs j
WHERE ds.customer_id = j.customer_id
  AND ds.submission_queue_id IS NULL;
```

### Issue 9: Form Mapping Always Uses Fallback

**Symptoms:**
- Every directory uses generic FALLBACK_MAPPING
- Gemini API calls succeed but JSON parsing fails

**Causes:**
1. Gemini returns markdown code blocks (```json ... ```)
2. Prompt not specific enough
3. API rate limiting

**Status:** ✅ FIXED in custom-poller.js
- Improved prompt with explicit "NO CODE BLOCKS" instruction
- Added markdown stripping function
- Added retry logic with exponential backoff (3 attempts)

### Issue 10: Worker Status Not Updating

**Symptoms:**
- Dashboard shows worker as "offline"
- Heartbeat not visible in Supabase

**Fix:**
1. Verify `worker_status` table exists:
   ```sql
   CREATE TABLE IF NOT EXISTS worker_status (
     worker_id TEXT PRIMARY KEY,
     last_heartbeat TIMESTAMPTZ NOT NULL,
     status TEXT,
     desired_state TEXT DEFAULT 'running'
   );
   ```

2. Check heartbeat logs in poller output

3. Verify WORKER_ID is set:
   ```bash
   echo $WORKER_ID
   # or in .env:
   WORKER_ID=my-worker-1
   ```

## Running Diagnostics

### Full System Check
```bash
node diagnose-connections.js
```

This will test:
- ✓ Supabase connection and tables
- ✓ Anthropic API
- ✓ Gemini API
- ✓ 2Captcha API (optional)
- ✓ Playwright installation
- ✓ Job/submission structure

### Quick Connection Test
```bash
node test-supabase-connection.js
```

### Check Job Structure
```bash
node check-job-submissions.js
```

## Environment Setup Checklist

- [ ] `.env` file created from `.env.example`
- [ ] `SUPABASE_URL` set correctly
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (not anon key!)
- [ ] `ANTHROPIC_API_KEY` set
- [ ] `GEMINI_API_KEY` set
- [ ] `TWO_CAPTCHA_API_KEY` set (optional, for CAPTCHA sites)
- [ ] `npm install` completed successfully
- [ ] Playwright browsers installed (`npm run postinstall`)
- [ ] Database tables exist (jobs, directory_submissions, worker_status, directory_form_mappings)
- [ ] Test job created with linked submissions

## Starting the Poller

### Development (with logs)
```bash
node custom-poller.js
```

### Production (with PM2)
```bash
pm2 start custom-poller.js --name db-worker
pm2 logs db-worker
```

### Docker
```bash
docker build -t db-worker .
docker run --env-file .env db-worker
```

## Monitoring

### Check Poller Logs
```bash
tail -f poller.log
```

### Check Worker Status in Supabase
```sql
SELECT * FROM worker_status ORDER BY last_heartbeat DESC;
```

### Check Job Progress
```sql
SELECT 
  j.id,
  j.customer_id,
  j.status,
  j.started_at,
  COUNT(ds.id) as total_submissions,
  SUM(CASE WHEN ds.status = 'submitted' THEN 1 ELSE 0 END) as completed,
  SUM(CASE WHEN ds.status = 'failed' THEN 1 ELSE 0 END) as failed,
  SUM(CASE WHEN ds.status = 'pending' THEN 1 ELSE 0 END) as pending
FROM jobs j
LEFT JOIN directory_submissions ds ON ds.submission_queue_id = j.id
WHERE j.status IN ('pending', 'in_progress')
GROUP BY j.id, j.customer_id, j.status, j.started_at;
```

## Getting Help

If issues persist after following this guide:

1. Run full diagnostics: `node diagnose-connections.js`
2. Check poller logs: `tail -f poller.log`
3. Verify database schema matches `Current schema in supabase.md`
4. Check that test job has submissions: `node check-job-submissions.js`
5. Review environment variables in `.env`

## Recent Fixes Applied

✅ **Fixed in this update:**
- Added `@anthropic-ai/sdk` to package.json
- Added ANTHROPIC_API_KEY and GEMINI_API_KEY to .env.example
- Changed .env.local to .env for consistency
- Added environment variable validation on startup
- Added null check for CAPTCHA solver
- Added immediate poller execution (no 30s wait)
- Improved error handling throughout
- Added retry logic for Gemini API calls
- Fixed markdown code block stripping
- Added better logging and diagnostics
