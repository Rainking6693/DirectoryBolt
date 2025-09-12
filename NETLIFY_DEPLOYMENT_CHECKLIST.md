# 🚀 DirectoryBolt Netlify Deployment Checklist

## ✅ Pre-Deployment Verification

### 1. Environment Variables Setup in Netlify Dashboard
Navigate to: **Site Settings → Environment Variables**

Add these exact variables:

```
GOOGLE_SHEET_ID=1Cc9Ha5MXt_PAFncIz5HN4_BlAHy3egK1OmjBjj7BN0A
GOOGLE_SERVICE_ACCOUNT_EMAIL=directorybolt-service-58@directorybolt.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=[Your complete Google Service Account private key]
```

**Important Notes:**
- `GOOGLE_PRIVATE_KEY` must include the full key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Netlify will automatically handle newlines in the private key
- Ensure no extra quotes or spaces around the variables

### 2. Build Settings Verification
- **Build command**: `npm ci --include=dev && npm run build`
- **Publish directory**: `.next`
- **Functions directory**: `netlify/functions`

### 3. Plugin Configuration
Ensure `@netlify/plugin-nextjs` is enabled in `netlify.toml`

## 🧪 Post-Deployment Testing

### Step 1: Health Check Endpoint
```bash
curl https://YOUR_NETLIFY_DOMAIN.netlify.app/api/health/google-sheets
```

**Expected Response:**
```json
{
  "success": true,
  "environment": "netlify-functions",
  "checks": {
    "environmentVariables": {
      "passed": true,
      "details": {
        "GOOGLE_SHEET_ID": true,
        "GOOGLE_SERVICE_ACCOUNT_EMAIL": true,
        "GOOGLE_PRIVATE_KEY": true
      }
    },
    "googleSheetsConnection": {
      "passed": true,
      "details": {
        "sheetTitle": "DirectoryBolt Customers",
        "authenticated": true
      }
    }
  }
}
```

### Step 2: Extension Validation Test
```bash
curl -X POST https://YOUR_NETLIFY_DOMAIN.netlify.app/api/extension/secure-validate \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "DIR-2025-123456",
    "extensionVersion": "1.0.0"
  }'
```

**Expected Response (if customer exists):**
```json
{
  "valid": true,
  "customerName": "Test Business",
  "packageType": "starter"
}
```

### Step 3: Queue Status Test
```bash
curl https://YOUR_NETLIFY_DOMAIN.netlify.app/api/autobolt/queue-status
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "stats": { ... },
    "isProcessing": false,
    "nextCustomer": null,
    "lastUpdated": "2025-01-XX..."
  }
}
```

### Step 4: Webhook Configuration
1. Go to Stripe Dashboard → Webhooks
2. Update webhook URL to: `https://YOUR_NETLIFY_DOMAIN.netlify.app/api/webhooks/stripe`
3. Ensure these events are selected:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.created`
   - `customer.updated`

## 🔍 Troubleshooting Guide

### Issue: Health Check Fails - Environment Variables
**Symptom:** `environmentVariables.passed: false`

**Solution:**
1. Double-check variable names in Netlify dashboard (case-sensitive)
2. Ensure `GOOGLE_PRIVATE_KEY` includes full key with headers
3. Re-deploy after updating environment variables

### Issue: Health Check Fails - Google Sheets Connection
**Symptom:** `googleSheetsConnection.passed: false`

**Solutions:**
1. Verify Google Sheets API is enabled in Google Cloud Console
2. Check service account has Editor permissions on the spreadsheet
3. Ensure private key is correctly formatted (newlines preserved)
4. Check Google Cloud Console for API quota limits

### Issue: Extension Validation Returns 500 Error
**Solutions:**
1. Check Netlify function logs: `netlify logs`
2. Verify environment variables are set correctly
3. Test Google Sheets connection health check first
4. Check for any private key formatting issues

### Issue: Stripe Webhooks Not Working
**Solutions:**
1. Verify webhook URL is correct in Stripe dashboard
2. Check webhook secret is set in Netlify environment variables
3. Test webhook endpoint manually with cURL
4. Check Netlify function logs for errors

## 📊 Monitoring & Logs

### Netlify Function Logs
```bash
netlify logs --context=production
```

### Real-time Monitoring
- Use the health check endpoint for automated monitoring
- Set up alerts for failed health checks
- Monitor Stripe webhook delivery in Stripe dashboard

## 🎯 Performance Expectations

### Cold Start Times
- **First request**: ~2-3 seconds (includes Google Sheets auth)
- **Subsequent requests**: ~500ms-1s
- **Health check**: ~1-2 seconds

### Memory Usage
- **Google Sheets operations**: ~100-200MB
- **Webhook processing**: ~50-150MB
- **Extension validation**: ~30-80MB

## ✅ Deployment Success Indicators

### All Green ✅
- [ ] Health check endpoint returns `success: true`
- [ ] Extension validation works with test customer ID
- [ ] Queue status endpoint responds correctly
- [ ] Stripe webhooks receive and process events
- [ ] No errors in Netlify function logs
- [ ] Google Sheets data is being read/written correctly

### Deployment Complete! 🎉

Your DirectoryBolt application is now fully deployed and operational on Netlify with Google Sheets integration working correctly in a serverless environment.

## 🔄 Maintenance

### Regular Checks
- Monitor health check endpoint daily
- Check Netlify function logs weekly
- Verify Google Sheets API quota usage monthly
- Test extension validation with real customer IDs

### Updates
- Environment variables changes require re-deployment
- Google Sheets schema changes need service updates
- Stripe webhook events may need handler updates

---

**Need Help?** Check the logs and test each endpoint individually to isolate issues.