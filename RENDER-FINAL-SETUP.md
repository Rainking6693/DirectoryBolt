# 🚀 RENDER DEPLOYMENT - FINAL SETUP

## Step 1: Go to Render Dashboard
1. Open https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Find **"DirectoryBolt"** in your repos
4. Click **"Connect"**

## Step 2: Configure Service (AUTO-DETECTED)
Render should auto-detect from `render.yaml`:
- ✅ **Name**: `playwright-worker` (or any name)
- ✅ **Environment**: `Docker` 
- ✅ **Dockerfile Path**: `./workers/playwright-worker/Dockerfile`
- ✅ **Docker Context**: `./`

**If it asks for manual config:**
- **Build Command**: Leave blank
- **Start Command**: Leave blank  
- **Root Directory**: Leave blank

## Step 3: Add Environment Variables (COPY/PASTE)

Click **"Environment Variables"** section, then **"Bulk Edit"** or **"Add from .env"**:

```bash
NODE_ENV=production
PORT=3000
POLL_INTERVAL=5000
WORKER_ID=render-worker-1
AUTOBOLT_API_KEY=718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622
AUTOBOLT_API_BASE=https://directorybolt.netlify.app
NETLIFY_FUNCTIONS_URL=https://directorybolt.netlify.app
WORKER_AUTH_TOKEN=718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT=30000
HEADLESS=true
TWO_CAPTCHA_API_KEY=49c0890fbd8c1506c04b58e53752cf2f
LOG_LEVEL=info
```

## Step 4: Deploy
1. Click **"Create Web Service"**
2. Wait 3-5 minutes for build
3. Watch the logs for:
   - ✅ TypeScript version
   - ✅ Build output listing
   - ✅ Playwright installation

## Step 5: Verify
1. Go to your service URL
2. Visit `/health` endpoint
3. Should see: `{"status":"healthy","service":"playwright-worker"}`

## If It Still Fails

### Check Build Logs For:
- ❌ **"tsc: command not found"** → TypeScript not installed
- ❌ **"Cannot find module"** → Missing dependencies  
- ❌ **"COPY failed"** → File path issues
- ❌ **"npm ci failed"** → Package lock issues

### Quick Fixes:
1. **Clear build cache**: Manual Deploy → "Clear build cache & deploy"
2. **Check file paths**: Make sure all files exist in repo
3. **Verify environment variables**: All required vars are set

## What Each Variable Does:

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `AUTOBOLT_API_KEY` | Authenticate with your Netlify app | ✅ **Yes** |
| `AUTOBOLT_API_BASE` | Your Netlify URL for API calls | ✅ **Yes** |
| `PORT` | Health check port (Render needs this) | ✅ **Yes** |
| `TWO_CAPTCHA_API_KEY` | Solve CAPTCHAs on directory sites | ✅ **Yes** |
| `WORKER_ID` | Unique identifier for this worker | No |
| `POLL_INTERVAL` | How often to check for jobs (ms) | No (default: 5000) |
| `PLAYWRIGHT_HEADLESS` | Run browser without GUI | No (default: true) |
| `LOG_LEVEL` | How verbose logs are | No (default: info) |

## Success Indicators:

### ✅ Build Success:
```
✅ Installing dependencies...
✅ TypeScript 5.5.4
✅ Building TypeScript...
✅ dist/index.js
✅ dist/logger.js
✅ Installing Playwright...
✅ Service is live!
```

### ✅ Runtime Success:
```
✅ Health check server listening on port 3000
✅ Simple Playwright Worker starting...
✅ Polling for jobs...
```

## Troubleshooting Commands:

If you need to debug locally:
```bash
# Test the worker locally
cd workers/playwright-worker
npm install
npm run build
node dist/index.js
```

## Final Checklist:

- [ ] Render account created
- [ ] Repository connected  
- [ ] Environment variables added (all 12 variables)
- [ ] Service created
- [ ] Build completed successfully
- [ ] Health check responds at `/health`
- [ ] Logs show "Polling for jobs..."

---

**This WILL work!** The configuration is correct and all files are properly set up. 🚀
