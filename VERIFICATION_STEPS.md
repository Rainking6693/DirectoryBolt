## Verification Steps

Use this checklist to validate the Playwright Worker migration end-to-end.

### 1) Netlify Functions
- [ ] POST /.netlify/functions/jobs-next → 200, returns job or empty
- [ ] POST /.netlify/functions/jobs-update with sample results → 200
- [ ] POST /.netlify/functions/jobs-complete with summary → 200

### 2) Orchestrator
- [ ] lib/server/autoboltJobs.ts: getNextPendingJob, updateJobProgress, completeJob work via pages/api/* wrappers

### 3) Worker Local
- [ ] Set workers/playwright-worker/.env
- [ ] npm run build; node dist/index.js
- [ ] Logs show polling and API calls

### 4) Single Directory Trial
- [ ] Create one test job in Supabase
- [ ] Observe worker submit 1 directory and update job_results

### 5) Dashboard
- [ ] Staff dashboard reflects job and progress from new tables

### 6) Docker
- [ ] docker build + docker compose up
- [ ] Scale to multiple workers and observe concurrent processing
