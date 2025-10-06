## Migration Log

- Implemented Netlify Functions (existing .js): jobs-next, jobs-update, jobs-complete, jobs-retry
- Confirmed orchestrator exists: lib/server/autoboltJobs.ts
- Worker present with polling loop and API client
- Added workers/playwright-worker/src/directorySubmitter.ts using dynamic-form-mapper
- Integrated dynamic fallback into jobProcessor
- Added docs: MIGRATION_GUIDE.md, VERIFICATION_STEPS.md
- Docker artifacts present: Dockerfile, docker-compose.yml

Pending/Notes:
- Optional TS variants of Netlify functions exist only for jobs-retry; .js handlers are functional
- Engine warning: recommend Node >= 20.18.1
- Ensure Netlify env configured and SUPABASE keys set
