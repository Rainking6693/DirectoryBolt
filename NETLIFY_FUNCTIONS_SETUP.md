# Netlify Functions Setup & Configuration Guide

## 🚀 Function Configuration

### Background Function Timeout (15 minutes)
The `process-job-background` function requires a 15-minute timeout for long-running Playwright operations.

**Netlify Dashboard Settings:**
1. Go to your Netlify site dashboard
2. Navigate to **Site settings** → **Functions**
3. Set **Function timeout** to **900 seconds** (15 minutes)
4. Enable **Background functions** if not already enabled

### Memory Allocation
- **Recommended:** 1024 MB (1 GB) for Playwright operations
- **Minimum:** 512 MB
- Playwright with browser automation is memory-intensive

## 📊 Monitoring & Alerting Setup

### 1. Netlify Function Logs
**Access Logs:**
- Netlify Dashboard → **Site settings** → **Functions** → **Function logs**
- Monitor for errors, timeouts, and performance issues

### 2. Error Alerting Configuration

**Environment Variables to Add:**
```bash
# Slack Webhook for alerts (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Custom monitoring webhook (optional)
MONITORING_WEBHOOK_URL=https://your-monitoring-service.com/webhook

# Error reporting service (optional)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### 3. Performance Monitoring

**Memory Usage Tracking:**
- Functions now include memory usage logging
- Monitor heap usage patterns in function logs
- Alert if memory usage consistently exceeds 800MB

**Execution Time Monitoring:**
- Track function execution duration
- Alert on functions exceeding 10 minutes (approaching timeout)

## 🔧 Function-Specific Settings

### process-job-background Function
```toml
[[functions]]
  name = "process-job-background"
  timeout = 900
  max_age = 86400
```

**Purpose:** Long-running background job processing with Playwright
**Timeout:** 15 minutes (900 seconds)
**Memory:** 1024 MB recommended

### trigger-job-processing Function
```toml
[[functions]]
  pattern = "*"
```

**Purpose:** API endpoint for triggering background jobs
**Timeout:** 5 minutes (300 seconds)
**Memory:** 256 MB sufficient

## 🚨 Alert Configuration

### Error Alert Triggers
1. **Function timeouts** - Alert when functions exceed 14 minutes
2. **Memory exhaustion** - Alert when memory usage > 900MB
3. **Repeated failures** - Alert on 3+ consecutive failures
4. **High error rate** - Alert when error rate > 10%

### Alert Channels
- **Primary:** Slack webhook for immediate team notification
- **Secondary:** Email alerts for critical issues
- **Tertiary:** SMS for production-down scenarios

## 📈 Performance Optimization

### Memory Management
- Functions include automatic memory usage tracking
- Browser instances are properly cleaned up
- Large objects are garbage collected

### Timeout Management
- 15-minute timeout allows for complex multi-directory processing
- Progress updates every 30 seconds prevent timeout assumptions
- Graceful degradation on timeout

### Error Recovery
- Automatic retry for transient failures
- Detailed error logging for debugging
- Fallback mechanisms for external service failures

## 🔍 Debugging Functions

### Common Issues & Solutions

**1. Worker.js Not Found**
```
Error: Could not locate worker.js file
```
**Solution:** Check file paths and ensure worker directory exists

**2. Memory Exhaustion**
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
```
**Solution:** Increase memory allocation to 1024MB

**3. Timeout Errors**
```
Task timed out after 5.00 seconds
```
**Solution:** Increase function timeout to 900 seconds for background functions

**4. Missing Environment Variables**
```
Missing ORCHESTRATOR_URL or AUTOBOLT_API_KEY
```
**Solution:** Ensure all required environment variables are set in Netlify

## 📋 Deployment Checklist

- [ ] Function timeout set to 900 seconds in Netlify dashboard
- [ ] Memory allocation set to 1024 MB
- [ ] All environment variables configured
- [ ] Error alerting webhooks configured
- [ ] Function logs accessible and monitored
- [ ] Background functions enabled
- [ ] Build settings configured correctly

## 🔗 Useful Links

- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Netlify Function Configuration](https://docs.netlify.com/functions/configure-functions/)
- [Netlify Environment Variables](https://docs.netlify.com/environment-variables/overview/)
- [Playwright in Serverless Guide](https://playwright.dev/docs/ci#deploying-playwright)