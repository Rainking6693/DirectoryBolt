# Troubleshooting Worker Job Failures

## 🚨 **Issue: Jobs Immediately Going to "Failed" Status**

### **Root Cause**
The AI worker was polling the old `/api/autobolt/jobs/next` endpoint, which doesn't exist in the new queue system. This caused jobs to fail immediately without being processed.

### **Solution Applied**
Updated `workers/playwright-worker/src/aiWorker.ts` to poll the new queue system directly via Supabase.

---

## 🔍 **How to Diagnose Job Failures**

### **1. Check Render Logs**
Go to Render.com → Your Worker Service → Logs

Look for these patterns:

**✅ Good (Working):**
```
🔍 Polling for pending jobs...
📋 Found pending job { jobId: 'xxx', customerId: 'xxx' }
📊 Job has 100 pending submissions
🤖 Processing job with AI services
```

**❌ Bad (Failing):**
```
❌ Failed to fetch pending jobs
❌ Job processing failed
❌ API error
```

### **2. Check Supabase Database**

**Query pending jobs:**
```sql
SELECT * FROM jobs WHERE status = 'pending';
```

**Query failed jobs:**
```sql
SELECT id, customer_id, status, error_message, created_at 
FROM jobs 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

**Query pending submissions:**
```sql
SELECT COUNT(*) 
FROM directory_submissions 
WHERE status = 'pending';
```

### **3. Check Environment Variables**

**Required in Render:**
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
NETLIFY_FUNCTIONS_URL=https://directorybolt.com
WORKER_AUTH_TOKEN=your_worker_token_here
```

**Verify they're set:**
```bash
# In Render logs, you should see:
🚀 AI-Enhanced Playwright Worker starting...
📡 Using new queue system with Supabase direct polling
```

---

## 🛠️ **Common Issues & Fixes**

### **Issue 1: "Failed to fetch pending jobs"**

**Cause:** Supabase credentials not set or incorrect

**Fix:**
1. Go to Render → Environment Variables
2. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
3. Check Supabase dashboard for correct values
4. Redeploy worker

### **Issue 2: "Job has no pending submissions"**

**Cause:** Webhook didn't create submission tasks

**Check webhook logs:**
```sql
-- Check if submissions were created
SELECT COUNT(*) 
FROM directory_submissions 
WHERE submission_queue_id = 'your-job-id';
```

**Fix:**
- Ensure webhook completed successfully
- Check Netlify function logs for errors
- Verify `directory_submissions` table exists

### **Issue 3: Jobs stuck in "pending"**

**Cause:** Worker not running or not polling

**Fix:**
1. Check Render logs for worker startup
2. Verify worker is healthy: `curl https://your-worker.onrender.com/health`
3. Check for errors in logs
4. Redeploy if necessary

### **Issue 4: "AI Processor not initialized"**

**Cause:** Missing AI API keys

**Fix:**
1. Set `ANTHROPIC_API_KEY` in Render
2. Set `GEMINI_API_KEY` in Render
3. Redeploy worker

### **Issue 5: TypeScript Compilation Errors**

**Cause:** AI service type mismatches

**Note:** These don't affect runtime in production Docker build

**If needed:**
```bash
cd workers/playwright-worker
npm run build  # Check for errors
```

---

## 📊 **Health Check Commands**

### **1. Check Worker Health**
```bash
curl https://your-worker.onrender.com/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "service": "ai-enhanced-playwright-worker",
  "timestamp": "2025-10-23T...",
  "aiServices": "enabled"
}
```

### **2. Check Database Connection**
```sql
-- Run in Supabase SQL editor
SELECT 
  (SELECT COUNT(*) FROM jobs WHERE status = 'pending') as pending_jobs,
  (SELECT COUNT(*) FROM jobs WHERE status = 'in_progress') as active_jobs,
  (SELECT COUNT(*) FROM directory_submissions WHERE status = 'pending') as pending_submissions;
```

### **3. Test Job Creation**
```bash
# In staff dashboard, create a test customer
# Check logs immediately after
```

---

## 🔄 **Worker Flow Verification**

### **Expected Flow:**
```
1. Worker starts → ✅ "AI-Enhanced Playwright Worker starting..."
2. Polling begins → ✅ "Polling for pending jobs..."
3. Job found → ✅ "Found pending job"
4. Submissions fetched → ✅ "Job has X pending submissions"
5. Processing starts → ✅ "Starting AI-enhanced job processing"
6. Progress updates → ✅ "Processing job with AI services"
7. Job completes → ✅ "Job processing completed successfully"
```

### **If Flow Breaks:**

**At Step 1:**
- Check Render deployment status
- Check environment variables
- Check Docker build logs

**At Step 2:**
- Check Supabase connection
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

**At Step 3:**
- Check if jobs exist in database
- Verify job status is 'pending'
- Check webhook logs

**At Step 4:**
- Verify `directory_submissions` records exist
- Check `submission_queue_id` matches job ID
- Verify status is 'pending'

**At Step 5-7:**
- Check AI service API keys
- Check Playwright browser installation
- Check memory/CPU limits on Render

---

## 🚀 **Quick Fix Checklist**

If jobs are failing, try these in order:

1. **Check Render Logs**
   - [ ] Worker is starting successfully
   - [ ] No environment variable errors
   - [ ] Polling loop is running

2. **Check Database**
   - [ ] Jobs exist with status='pending'
   - [ ] directory_submissions exist with status='pending'
   - [ ] submission_queue_id links match job id

3. **Check Environment Variables**
   - [ ] SUPABASE_URL is set
   - [ ] SUPABASE_SERVICE_ROLE_KEY is set
   - [ ] NETLIFY_FUNCTIONS_URL is set
   - [ ] WORKER_AUTH_TOKEN is set

4. **Redeploy Worker**
   ```bash
   # In Render dashboard
   Manual Deploy → Deploy Latest Commit
   ```

5. **Create Test Job**
   - Use staff dashboard "Create Test Customer"
   - Watch Render logs in real-time
   - Check Supabase for updates

---

## 📞 **Get More Info**

### **Render Logs**
```bash
# Real-time logs
Render Dashboard → Your Service → Logs → [Live Tail]
```

### **Supabase Logs**
```bash
# Query logs
Supabase Dashboard → Database → SQL Editor
SELECT * FROM autobolt_submission_logs ORDER BY created_at DESC LIMIT 100;
```

### **Webhook Logs**
```bash
# Netlify function logs
Netlify Dashboard → Functions → webhook
```

---

## ✅ **Verification Script**

Run this after deploying to verify everything:

```sql
-- 1. Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('jobs', 'directory_submissions', 'directories', 'customers');

-- 2. Check recent jobs
SELECT id, status, customer_id, created_at, error_message 
FROM jobs 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check submissions for latest job
SELECT 
  ds.id,
  ds.status,
  d.name as directory_name,
  ds.created_at
FROM directory_submissions ds
JOIN directories d ON d.id = ds.directory_id
WHERE ds.submission_queue_id = (SELECT id FROM jobs ORDER BY created_at DESC LIMIT 1)
LIMIT 10;

-- 4. Check worker heartbeats
SELECT * FROM worker_heartbeats ORDER BY last_seen DESC LIMIT 1;
```

---

## 🎯 **Expected Behavior After Fix**

1. ✅ Worker polls Supabase directly (no old API calls)
2. ✅ Jobs progress from pending → in_progress → completed
3. ✅ Submissions update as they're processed
4. ✅ Dashboard shows real-time progress
5. ✅ No immediate failures

**The worker is now fully compatible with the new queue system!**

