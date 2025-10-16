# Railway Deployment Guide

## Step 1: Push to GitHub

```bash
cd C:\Users\Ben\OneDrive\Documents\GitHub\DirectoryBolt
git add workers/playwright-worker
git commit -m "Add Playwright worker for Railway deployment"
git push origin master
```

## Step 2: Create Railway Project

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your `DirectoryBolt` repository
4. Railway will detect the `workers/playwright-worker` folder

## Step 3: Configure Root Directory

In Railway dashboard:
1. Click on your service
2. Go to "Settings" tab
3. Under "Service" section
4. Set **Root Directory**: `workers/playwright-worker`
5. Under "Build" section
6. Set **Builder**: Dockerfile (it should auto-detect, but verify)
7. **DO NOT** set a custom start command - it's defined in the Dockerfile

## Step 4: Add Environment Variables

In Railway dashboard, go to "Variables" tab and add:

```
AUTOBOLT_API_BASE=https://directorybolt.netlify.app
AUTOBOLT_API_KEY=718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622
SUPABASE_URL=https://kolgqfjgncdwddziqloz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_h23g4IsA-mIMLrI1K7gZnA_PFd9HmZR
NODE_ENV=production
POLL_INTERVAL=5000
WORKER_ID=railway-worker-1
HEADLESS=true
TWOCAPTCHA_API_KEY=49c0890fbd8c1506c04b58e53752cf2f
```

## Step 5: Deploy

Railway will automatically deploy! Monitor logs in the "Deployments" tab.

## Verify It's Working

1. Check Railway logs - should see "Playwright Worker starting..."
2. Check "Polling for jobs..." every 5 seconds
3. Create a test job on your website
4. Watch worker pick it up and process!

## Cost

- **$5/month** flat rate
- Includes all compute, no hidden fees
- Worker runs 24/7 automatically

## Monitoring

- View logs in real-time in Railway dashboard
- Set up alerts for crashes
- Auto-restarts on failure (configured in railway.json)
