# 🤖 AI-Enhanced Playwright Worker - Complete Deployment Guide

## 📋 **Overview**

The AI-Enhanced Playwright Worker is a **ground-up implementation** that uses **ALL** your AI services from `/lib/ai-services/` for intelligent directory submissions:

### ✨ **Key Features**
- **AIFormMapper**: Intelligently maps business data to directory forms
- **AI Submission Orchestrator**: Coordinates all AI services  
- **Success Probability Calculator**: Predicts submission success rates
- **Timing Optimizer**: Optimizes submission timing for best results
- **Description Customizer**: Tailors descriptions per directory
- **Intelligent Retry Analyzer**: Smart failure recovery
- **Queue Management**: Respects pause/resume states
- **Health Monitoring**: Regular heartbeat with Supabase

---

## 🚀 **Deployment to Render.com**

### **Step 1: Create New Service**

1. Go to [Render.com Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `Rainking6693/DirectoryBolt`
4. Configure service:
   - **Name**: `ai-enhanced-playwright-worker`
   - **Environment**: **Docker** (CRITICAL!)
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Dockerfile Path**: `./workers/playwright-worker/Dockerfile`
   - **Docker Context**: `./` (root directory)

### **Step 2: Set Environment Variables**

Copy and paste these variables into Render's environment variable editor:

```bash
# Basic Configuration
NODE_ENV=production
PORT=3000
POLL_INTERVAL=5000
WORKER_ID=ai-enhanced-worker-1

# API Configuration - REQUIRED
AUTOBOLT_API_KEY=718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622
AUTOBOLT_API_BASE=https://directorybolt.netlify.app
NETLIFY_FUNCTIONS_URL=https://directorybolt.netlify.app
WORKER_AUTH_TOKEN=718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622

# Playwright Configuration
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_TIMEOUT=30000
HEADLESS=true

# AI Services - REQUIRED for full functionality
ANTHROPIC_API_KEY=your_anthropic_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# CAPTCHA Service
TWO_CAPTCHA_API_KEY=49c0890fbd8c1506c04b58e53752cf2f

# Database Configuration - REQUIRED
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Logging
LOG_LEVEL=info
```

**Critical Variables:**
- `ANTHROPIC_API_KEY` - Get from [Anthropic Console](https://console.anthropic.com/)
- `GEMINI_API_KEY` - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- `SUPABASE_URL` - From your Supabase project settings
- `SUPABASE_SERVICE_ROLE_KEY` - From your Supabase project settings (NOT the anon key!)

### **Step 3: Configure Health Check**

- **Health Check Path**: `/health`
- **Health Check Timeout**: 30 seconds
- **Health Check Interval**: 60 seconds

### **Step 4: Deploy**

1. Click **"Create Web Service"**
2. Wait for Docker build to complete (5-10 minutes first time)
3. Monitor logs for:
   ```
   🤖 Initializing AI-Enhanced Job Processor...
   ✅ AI-Enhanced Job Processor initialized successfully
   💓 Worker heartbeat sent
   🔄 Starting job polling loop...
   ```

---

## 🔧 **Required Supabase Tables**

The AI worker needs these Supabase tables to function:

### **1. `system_settings` Table**
```sql
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert queue pause flag
INSERT INTO system_settings (key, value)
VALUES ('queue_paused', 'false')
ON CONFLICT (key) DO NOTHING;
```

### **2. `worker_heartbeats` Table**
```sql
CREATE TABLE IF NOT EXISTS worker_heartbeats (
  worker_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  last_seen TIMESTAMPTZ NOT NULL,
  ai_services_enabled BOOLEAN DEFAULT false,
  jobs_processed INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### **3. Enable Row Level Security (Optional)**
```sql
-- Allow worker to update its own heartbeat
ALTER TABLE worker_heartbeats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workers can update their own heartbeat"
  ON worker_heartbeats
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

## 📊 **Monitoring & Health Checks**

### **Worker Health**
Check worker status at: `https://your-render-url.onrender.com/health`

Expected response:
```json
{
  "status": "healthy",
  "service": "ai-enhanced-playwright-worker",
  "timestamp": "2025-10-21T...",
  "aiServices": "enabled"
}
```

### **Worker Heartbeat**
Query Supabase to see worker status:
```sql
SELECT 
  worker_id,
  status,
  last_seen,
  ai_services_enabled,
  jobs_processed,
  metadata
FROM worker_heartbeats
WHERE worker_id = 'ai-enhanced-worker-1';
```

### **Queue Status**
Check if queue is paused:
```sql
SELECT value
FROM system_settings
WHERE key = 'queue_paused';
```

---

## 🎯 **Testing the AI Worker**

### **Test 1: Basic Health Check**
```bash
curl https://your-render-url.onrender.com/health
```

### **Test 2: Create Test Customer**
1. Go to your staff dashboard
2. Click **"Create Test Customer"**
3. Watch Render logs for:
   ```
   📋 Job received
   🤖 Processing job with AI services
   🔍 Analyzing form structure with AI Form Mapper
   ✅ Form analysis complete
   📝 Filling field: businessName
   ✅ Form filling complete
   🎉 AI-enhanced job processing completed successfully
   ```

### **Test 3: Pause/Resume Queue**
```sql
-- Pause queue
UPDATE system_settings
SET value = 'true'
WHERE key = 'queue_paused';

-- Check logs (should show):
-- ⏸️ Queue is paused, waiting...

-- Resume queue
UPDATE system_settings
SET value = 'false'
WHERE key = 'queue_paused';
```

---

## 🐛 **Troubleshooting**

### **Worker Not Starting**
1. Check Render logs for errors
2. Verify all environment variables are set
3. Confirm Dockerfile path is correct
4. Ensure Docker is selected (not Node.js)

### **AI Services Failing**
1. Verify `ANTHROPIC_API_KEY` is valid
2. Check `GEMINI_API_KEY` has credits
3. Test API keys in [Anthropic Console](https://console.anthropic.com/)

### **Form Mapping Errors**
1. Check `AIFormMapper` logs
2. Verify page HTML is accessible
3. Increase `confidenceThreshold` if needed

### **Database Connection Issues**
1. Verify `SUPABASE_URL` is correct
2. Ensure `SUPABASE_SERVICE_ROLE_KEY` (not anon key!)
3. Check Supabase connection limits
4. Verify tables exist (run SQL above)

### **Worker Not Polling**
1. Check `AUTOBOLT_API_KEY` matches Netlify env var
2. Verify `NETLIFY_FUNCTIONS_URL` is correct
3. Check API endpoint logs on Netlify
4. Test `/api/autobolt/jobs/next` manually

---

## 📈 **Performance Optimization**

### **Increase Polling Speed**
```bash
POLL_INTERVAL=3000  # Poll every 3 seconds instead of 5
```

### **Adjust Batch Size**
The worker processes directories one at a time with AI optimization. To process multiple jobs in parallel, deploy multiple workers:

```bash
# Worker 1
WORKER_ID=ai-enhanced-worker-1

# Worker 2 (separate Render service)
WORKER_ID=ai-enhanced-worker-2
```

### **Optimize AI Response Time**
- Use Anthropic Claude 3 Haiku for faster responses
- Cache form mappings for repeated directories
- Reduce `confidenceThreshold` for faster mapping (0.7 instead of 0.8)

---

## 🔐 **Security Best Practices**

1. **Never commit API keys** to Git
2. **Rotate keys regularly** (every 90 days)
3. **Use service role key** for Supabase (not anon key)
4. **Enable RLS** on Supabase tables
5. **Monitor worker logs** for suspicious activity
6. **Set up alerts** for failed authentications

---

## 📝 **API Compatibility**

The AI worker is **100% compatible** with existing API endpoints:
- ✅ `GET /api/autobolt/jobs/next`
- ✅ `POST /api/autobolt/jobs/update`
- ✅ `POST /api/autobolt/jobs/complete`

**No changes needed** to your Netlify API or Supabase Edge Functions!

See `AI-ENHANCED-WORKER-API-COMPATIBILITY.md` for detailed compatibility audit.

---

## 🎉 **Success Checklist**

- [ ] Render service created with Docker environment
- [ ] All environment variables set (especially AI API keys)
- [ ] Supabase tables created (`system_settings`, `worker_heartbeats`)
- [ ] Worker health check returns 200 OK
- [ ] Worker heartbeat visible in Supabase
- [ ] Test customer processed successfully
- [ ] AI Form Mapper logs show form analysis
- [ ] Directory submissions completing
- [ ] No errors in Render logs

---

## 📞 **Support**

If you encounter issues:
1. Check Render deployment logs
2. Verify all environment variables
3. Test API endpoints manually
4. Review `AI-ENHANCED-WORKER-API-COMPATIBILITY.md`
5. Check Supabase connection and tables

---

**Deployed:** 2025-10-21  
**Version:** 2.0.0 AI-Enhanced  
**Status:** Production Ready ✅
