# 🚀 Render.com Setup - Step by Step

## Step 1: Create Render Account (2 minutes)

1. Go to **https://render.com**
2. Click **"Get Started"** or **"Sign Up"**
3. Choose **"Sign up with GitHub"**
4. Authorize Render to access your repositories

---

## Step 2: Create New Web Service (1 minute)

1. Click **"New +"** in top right
2. Select **"Web Service"**
3. Find and select **"DirectoryBolt"** from your repos
4. Click **"Connect"**

---

## Step 3: Configure Build Settings

Render should auto-detect your `render.yaml`, but if it asks:

### **Fill in these fields:**

| Field | Value |
|-------|-------|
| **Name** | `playwright-worker` (or any name you want) |
| **Environment** | `Docker` |
| **Region** | Choose closest to you (e.g., `Oregon (US West)`) |
| **Branch** | `main` |
| **Root Directory** | Leave **blank** |
| **Dockerfile Path** | `./workers/playwright-worker/Dockerfile` |
| **Docker Context** | `./` |
| **Docker Build Context Path** | Leave **blank** |

### **Advanced Settings:**

| Field | Value |
|-------|-------|
| **Build Command** | Leave **blank** (Docker handles it) |
| **Start Command** | Leave **blank** (Dockerfile has `CMD`) |
| **Health Check Path** | `/health` |
| **Instance Type** | `Free` |
| **Auto-Deploy** | ✅ **Yes** (deploys on git push) |

---

## Step 4: Add Environment Variables (BULK UPLOAD)

### **Method 1: Bulk Paste (Easiest)**

1. Scroll down to **"Environment Variables"** section
2. Look for **"Add from .env"** or **"Bulk Edit"** button
3. Click it and paste this entire block:

```bash
NODE_ENV=production
PORT=3000
POLL_INTERVAL=5000
WORKER_ID=render-worker-1
AUTOBOLT_API_BASE=https://YOUR-ACTUAL-NETLIFY-URL.netlify.app
AUTOBOLT_API_KEY=your-actual-api-key-from-netlify
NETLIFY_FUNCTIONS_URL=https://YOUR-ACTUAL-NETLIFY-URL.netlify.app
WORKER_AUTH_TOKEN=your-actual-api-key-from-netlify
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT=30000
LOG_LEVEL=info
```

4. **IMPORTANT**: Replace these values:
   - `YOUR-ACTUAL-NETLIFY-URL` → Your actual Netlify site URL
   - `your-actual-api-key-from-netlify` → Your actual API key

### **Method 2: One by One**

If there's no bulk option, click **"Add Environment Variable"** for each:

| Key | Value | Secret? |
|-----|-------|---------|
| `NODE_ENV` | `production` | No |
| `PORT` | `3000` | No |
| `POLL_INTERVAL` | `5000` | No |
| `WORKER_ID` | `render-worker-1` | No |
| `AUTOBOLT_API_BASE` | `https://YOUR-NETLIFY-URL.netlify.app` | No |
| `AUTOBOLT_API_KEY` | `your-api-key` | ✅ **Yes** |
| `NETLIFY_FUNCTIONS_URL` | `https://YOUR-NETLIFY-URL.netlify.app` | No |
| `WORKER_AUTH_TOKEN` | `your-api-key` | ✅ **Yes** |
| `PLAYWRIGHT_HEADLESS` | `true` | No |
| `PLAYWRIGHT_TIMEOUT` | `30000` | No |
| `LOG_LEVEL` | `info` | No |

---

## Step 5: Deploy! (3-5 minutes)

1. Click **"Create Web Service"** at the bottom
2. Render will start building your Docker container
3. Watch the build logs in real-time
4. Wait for **"Live"** status (green indicator)

### **Build Steps You'll See:**

```
✅ Cloning repository
✅ Building Docker image
✅ Installing npm dependencies
✅ Compiling TypeScript
✅ Installing Playwright browsers
✅ Starting container
✅ Health check passed
🟢 Live!
```

---

## Step 6: Verify Deployment

### **Check Health:**

1. Go to your service URL (Render will show it)
2. Visit: `https://your-app.onrender.com/health`
3. You should see:
   ```json
   {
     "status": "healthy",
     "service": "playwright-worker",
     "timestamp": "2024-..."
   }
   ```

### **Check Logs:**

1. Click **"Logs"** tab in Render dashboard
2. You should see:
   ```
   Simple Playwright Worker starting...
   Health check server listening on port 3000
   Polling for jobs...
   ```

---

## What Environment Variables Do?

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `AUTOBOLT_API_BASE` | Your Netlify app URL where the worker gets jobs | ✅ **Yes** |
| `AUTOBOLT_API_KEY` | API key to authenticate with your Netlify app | ✅ **Yes** |
| `PORT` | Port for health checks (Render needs this) | ✅ **Yes** |
| `POLL_INTERVAL` | How often to check for new jobs (milliseconds) | No (defaults to 5000) |
| `WORKER_ID` | Identifier for this worker instance | No (for tracking) |
| `NODE_ENV` | Sets production mode | ✅ **Yes** |
| `PLAYWRIGHT_HEADLESS` | Run browser without GUI | No (defaults to true) |
| `LOG_LEVEL` | How verbose the logs are | No (defaults to info) |

---

## Where to Get Your Values

### **1. Netlify URL:**
- Go to your Netlify dashboard
- Click on your DirectoryBolt site
- Copy the URL (e.g., `https://directorybolt.netlify.app`)

### **2. API Key:**
- This should be the same key your extension uses
- Check your Netlify environment variables for `AUTOBOLT_API_KEY` or `WORKER_AUTH_TOKEN`
- Or generate a new one in your Netlify dashboard

---

## Troubleshooting

### **Build Fails:**
- Click into the **"Logs"** tab
- Look for red error messages
- Common issues:
  - ❌ Docker image pull timeout → Retry deploy
  - ❌ npm ci fails → Check package-lock.json is committed

### **Health Check Fails:**
- Make sure `PORT=3000` is set
- Check logs for startup errors
- Verify the container started successfully

### **Worker Not Polling:**
- Check `AUTOBOLT_API_BASE` is correct
- Verify `AUTOBOLT_API_KEY` matches your Netlify key
- Look at logs for API connection errors

---

## Next Steps After Deployment

1. ✅ Verify health check works
2. ✅ Check logs show "Polling for jobs..."
3. ✅ Create a test job from your Netlify app
4. ✅ Verify worker picks it up (check logs)

---

## Render Dashboard Tips

### **Useful Tabs:**
- **Events**: See deploy history
- **Logs**: Real-time worker output
- **Metrics**: CPU/Memory usage
- **Settings**: Change env vars, scaling

### **Useful Features:**
- **Manual Deploy**: Redeploy without git push
- **Suspend Service**: Pause worker (saves hours)
- **Shell**: SSH into running container

---

## Free Tier Limits

- ✅ **750 hours/month** free (enough for 1 always-on service)
- ✅ **Spins down after 15 min of inactivity** (restarts automatically)
- ✅ **512 MB RAM** (plenty for this worker)
- ✅ **0.1 CPU** (shared)

**Tips to stay in free tier:**
- Use only 1 worker instance
- Worker auto-sleeps when no jobs (no charge)
- Wakes up in ~30 seconds when job arrives

---

## Ready to Deploy?

**Checklist:**
- [ ] Render account created
- [ ] Repository connected
- [ ] Environment variables ready
- [ ] Netlify URL and API key handy

**👉 Go to: https://dashboard.render.com/select-repo**

Then follow Steps 1-6 above! 🚀

