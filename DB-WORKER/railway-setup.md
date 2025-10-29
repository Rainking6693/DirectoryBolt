# Railway Deployment Guide for DB-WORKER Poller

## Prerequisites
- Railway account (sign up at railway.app)
- GitHub account
- Your DB-WORKER code pushed to GitHub

## Step 1: Prepare Your Repository

Your DB-WORKER is now ready for Railway! The following files are configured:
- ✅ `railway.json` - Railway deployment config
- ✅ `nixpacks.toml` - Build configuration with Playwright/Chromium
- ✅ `package.json` - Dependencies and start script
- ✅ `.env.example` - Environment variable template

## Step 2: Push to GitHub

```bash
# If you haven't already, initialize git in DB-WORKER folder
cd DB-WORKER
git init
git add .
git commit -m "Prepare DB-WORKER for Railway deployment"

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/DirectoryBolt-Worker.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Railway

1. **Go to Railway**: https://railway.app
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Choose your repository** (DirectoryBolt or DirectoryBolt-Worker)
5. **Select the DB-WORKER folder** (Railway will auto-detect it)

## Step 4: Set Environment Variables

In Railway dashboard, go to **Variables** tab and add:

```bash
# Supabase Configuration
SUPABASE_URL=https://kolgqfjgncdwddziqloz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbGdxZmpnbmNkd2RkemlxbG96Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjczODc2MSwiZXhwIjoyMDcyMzE0NzYxfQ.xPoR2Q_yey7AQcorPG3iBLKTadzzSEMmK3eM9ZW46Qc

# Worker Configuration
NODE_ENV=production
POLL_INTERVAL=30000
WORKER_ID=railway-worker-1
HEADLESS=true

# AI Services
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# External Services
TWO_CAPTCHA_API_KEY=your_2captcha_key_here
```

**Important**: Replace the API keys with your actual keys!

## Step 5: Deploy!

Railway will automatically:
1. ✅ Install Node.js and Playwright
2. ✅ Install Chromium browser
3. ✅ Install npm dependencies
4. ✅ Start your poller with `node custom-poller.js`

## Step 6: Monitor Your Poller

### View Logs
- Go to **Deployments** tab
- Click on the latest deployment
- View real-time logs to see poller activity

### Check Status
Look for these log messages:
```
✅ Poller starting with WORKER_ID: railway-worker-1
✅ Poll interval: 30000ms, Heartbeat interval: 10000ms
✅ Poller started successfully
```

### Verify It's Working
1. Create a test customer in your Staff Dashboard
2. Check Railway logs - you should see:
   ```
   📋 Found pending job: [job-id]
   🎯 Processing job for customer: [customer-name]
   ```

## Troubleshooting

### Poller Not Starting?
- Check **Logs** tab for errors
- Verify all environment variables are set
- Make sure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct

### Playwright/Chromium Issues?
Railway automatically installs Chromium. If you see browser errors:
- Check that `nixpacks.toml` includes `playwright-driver` and `chromium`
- Verify `HEADLESS=true` is set

### Out of Memory?
- Railway free tier: 512MB RAM
- Upgrade to Hobby plan ($5/mo) for 8GB RAM if needed

## Cost Estimate

**Railway Pricing:**
- **Hobby Plan**: $5/month
  - Includes: 500 hours of execution time
  - Your poller runs 24/7 = 720 hours/month
  - **Total cost**: ~$5-7/month

**Why it's worth it:**
- ✅ Zero maintenance
- ✅ Automatic restarts on crash
- ✅ Built-in logging and monitoring
- ✅ Auto-deploys on git push
- ✅ No server management

## Advanced: Multiple Workers

Want to run multiple pollers for faster processing?

1. Deploy the same code multiple times
2. Give each a unique `WORKER_ID`:
   - `WORKER_ID=railway-worker-1`
   - `WORKER_ID=railway-worker-2`
   - `WORKER_ID=railway-worker-3`

Each worker will independently poll for jobs!

## Support

If you run into issues:
1. Check Railway logs first
2. Verify environment variables
3. Test locally with `npm start` to ensure code works
4. Check Supabase connection with `npm run diagnose`

---

**You're all set!** Your poller will now run 24/7 on Railway. 🚀
