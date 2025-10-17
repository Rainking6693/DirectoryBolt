# Update Railway Worker Configuration

## Issue
The Railway worker is calling the Netlify app URL instead of the production domain.

## Solution
Update the Railway worker environment variable:

### Current (WRONG):
```
ORCHESTRATOR_URL=https://directorybolt.netlify.app/api
```

### Should be (CORRECT):
```
ORCHESTRATOR_URL=https://www.directorybolt.com/api
```

## Steps to Fix:

1. Go to Railway dashboard: https://railway.app
2. Select your DirectoryBolt worker service
3. Click "Variables" tab
4. Find `ORCHESTRATOR_URL`
5. Change value to: `https://www.directorybolt.com/api`
6. Click "Deploy" or restart the service

## Verify the Change:
After updating, check the Railway logs. You should see API calls to:
```
https://www.directorybolt.com/api/jobs/update
```

Instead of:
```
https://directorybolt.netlify.app/api/jobs/update
```

## All Required Railway Worker Environment Variables:
```bash
ORCHESTRATOR_URL=https://www.directorybolt.com/api
AUTOBOLT_API_KEY=718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622
SUPABASE_URL=https://kolgqfjgncdwddziqloz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_h23g4IsA-mIMLrI1K7gZnA_PFd9HmZR
NODE_ENV=production
POLL_INTERVAL=5000
WORKER_ID=railway-worker-1
HEADLESS=true
TWOCAPTCHA_API_KEY=49c0890fbd8c1506c04b58e5352cf2f
```

## Why This Matters:
- The Netlify app URL might be pointing to a preview branch or outdated code
- Your production site at www.directorybolt.com has the latest deployed code
- API authentication and database connections are configured for the production domain

