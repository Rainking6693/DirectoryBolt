## Playwright Worker Migration Guide

This guide explains how to run and validate the new Playwright Worker System alongside the legacy Chrome Extension, and how to switch over with zero downtime.

### Components
- Netlify Functions API: `netlify/functions/jobs-next.js`, `jobs-update.js`, `jobs-complete.js`, `jobs-retry.js`
- Orchestrator: `lib/server/autoboltJobs.ts`
- Worker: `workers/playwright-worker/` (TypeScript, Playwright, Docker)

### Zero-Downtime Strategy
1) Keep legacy extension running.
2) Enable Playwright worker in parallel using Netlify Functions API only.
3) Compare processing and success rates; when equal or better, move traffic fully to worker.

### Prerequisites
- Node >= 20.18.1 recommended
- Supabase env in the Next.js app and Netlify environment
- For worker: `.env` in `workers/playwright-worker/` with:
  - `NETLIFY_FUNCTIONS_URL=https://<site>.netlify.app/.netlify/functions`
  - `SUPABASE_SERVICE_ROLE_KEY=...`

### API Validation (before running worker)
- POST `jobs-next` → returns next job or empty
- POST `jobs-update` → accepts `{ jobId, directoryResults }`
- POST `jobs-complete` → accepts `{ jobId, finalStatus, summary }`

### Run Worker Locally
```
cd workers/playwright-worker
npm i
npm run build
node dist/index.js
```

### Docker
```
cd workers/playwright-worker
docker build -t directorybolt-worker:latest .
docker compose up --scale worker=3
```

### Switch Over
1) Pause legacy extension batching.
2) Scale workers as needed (`docker-compose.yml`).
3) Monitor dashboard and Supabase metrics.
