# Netlify Dashboard Configuration Guide

## 🚀 Required Settings for DirectoryBolt Deployment

### **Function Configuration**
**Location:** https://app.netlify.com/sites/directorybolt/settings/functions

#### **1. Function Timeout**
- **Setting:** Function timeout
- **Value:** `900 seconds` (15 minutes)
- **Reason:** Required for background job processing with Playwright automation

#### **2. Background Functions**
- **Setting:** Background functions toggle
- **Value:** `Enabled`
- **Reason:** Enables long-running background job processing

#### **3. Memory Allocation**
- **Setting:** Memory limit
- **Value:** `1024 MB` (1 GB)
- **Reason:** Playwright browser automation requires significant memory

### **Environment Variables**
**Location:** https://app.netlify.com/sites/directorybolt/settings/env-vars

#### **Required Variables:**
```bash
# API Configuration
ORCHESTRATOR_URL=https://directorybolt.netlify.app/api
AUTOBOLT_API_KEY=your-api-key-here
WORKER_AUTH_TOKEN=your-worker-token-here

# Database Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# 2Captcha Configuration (Optional)
TWOCAPTCHA_API_KEY=your-2captcha-key-here
TWO_CAPTCHA_KEY=your-2captcha-key-here

# Worker Configuration
WORKER_ID=worker-001
NODE_ENV=production

# Performance Settings
TUNE_MIN_DELAY_MS=800
TUNE_MAX_DELAY_MS=2200
DIR_MAX_RETRIES=2

# Monitoring (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
MONITORING_WEBHOOK_URL=https://your-monitoring-service.com/webhook
```

### **Build Settings**
**Location:** https://app.netlify.com/sites/directorybolt/settings/build

#### **Build Command:**
```bash
npm run build
```

#### **Publish Directory:**
```bash
.next
```

#### **Node Version:**
```bash
18.20.0
```

### **Domain & HTTPS**
**Location:** https://app.netlify.com/sites/directorybolt/settings/domain

- Ensure your domain is properly configured
- SSL/TLS certificate should be active
- Custom domains should be verified

## 📋 Deployment Checklist

### **Pre-Deployment:**
- [ ] Function timeout set to 900 seconds ✅
- [ ] Background functions enabled ✅
- [ ] Memory allocation set to 1024 MB ✅
- [ ] All environment variables configured ✅
- [ ] Node.js version set to 18.20.0 ✅
- [ ] Build command configured ✅
- [ ] Publish directory set to `.next` ✅

### **Post-Deployment:**
- [ ] Verify site builds successfully
- [ ] Check function logs for errors
- [ ] Test API endpoints are accessible
- [ ] Confirm background functions are working
- [ ] Monitor memory usage in function logs

## 🔧 Function-Specific Settings

### **Background Function (process-job-background)**
- **Timeout:** 900 seconds (configured in dashboard)
- **Memory:** 1024 MB (configured in dashboard)
- **Purpose:** Long-running Playwright automation jobs

### **Trigger Function (trigger-job-processing)**
- **Timeout:** 300 seconds (default)
- **Memory:** 256 MB (default sufficient)
- **Purpose:** API endpoint for triggering background jobs

## 🚨 Troubleshooting

### **Common Issues:**

**1. Function Timeout Errors**
```
Error: Function timed out after 300 seconds
```
**Solution:** Increase function timeout to 900 seconds in dashboard

**2. Memory Exhaustion**
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
```
**Solution:** Increase memory allocation to 1024 MB in dashboard

**3. Missing Environment Variables**
```
Error: Missing ORCHESTRATOR_URL or AUTOBOLT_API_KEY
```
**Solution:** Add all required environment variables in Netlify dashboard

**4. Worker.js Not Found**
```
Error: Could not locate worker.js file
```
**Solution:** Ensure worker directory and files are committed to repository

## 📊 Monitoring Setup

### **Function Logs Access:**
1. Go to Netlify Dashboard → Functions
2. Click on specific function to view logs
3. Monitor for errors, timeouts, and performance issues

### **Performance Metrics:**
- Track function execution duration
- Monitor memory usage patterns
- Alert on functions exceeding 14 minutes (approaching timeout)

## 🔗 Quick Access Links

- **Site Dashboard:** https://app.netlify.com/sites/directorybolt
- **Function Settings:** https://app.netlify.com/sites/directorybolt/settings/functions
- **Environment Variables:** https://app.netlify.com/sites/directorybolt/settings/env-vars
- **Build Settings:** https://app.netlify.com/sites/directorybolt/settings/build
- **Domain Settings:** https://app.netlify.com/sites/directorybolt/settings/domain

## ⚡ Quick Setup Commands

After configuring the dashboard settings, run these commands to verify everything is working:

```bash
# Test local build
npm run build

# Test function deployment
npm run test:production

# Verify environment variables
node scripts/validate-env.js
```

## 🎯 Production Readiness

Once all dashboard settings are configured:

1. **Deploy:** The site should build and deploy successfully
2. **Test Functions:** Verify API endpoints are accessible
3. **Monitor:** Check function logs for proper operation
4. **Scale:** Monitor resource usage and adjust as needed

The Netlify functions should now work correctly with the dashboard-configured timeouts and memory allocation!