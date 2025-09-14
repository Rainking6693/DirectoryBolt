# 🚨 NETLIFY ENVIRONMENT CONFIGURATION - EMERGENCY FIX

**Mission Commander:** Emily  
**Priority:** CRITICAL - System non-functional without these variables  
**Status:** IMMEDIATE ACTION REQUIRED

## CRITICAL ENVIRONMENT VARIABLES MISSING IN NETLIFY PRODUCTION

### 1. Google Sheets Integration (CRITICAL)
```bash
GOOGLE_SHEET_ID=1Cc9Ha5MXt_PAFncIz5HN4_BlAHy3egK1OmjBjj7BN0A
GOOGLE_SERVICE_ACCOUNT_EMAIL=directorybolt-service-58@directorybolt.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDckqPCWtKV9wOo
BwSWuFkNC7Trt9giuilMWRDZYhMm9X85/EeP3gPddHdH/FGcIpBgfEBZK3+mc7Bf
/iaTnuWii+4gHIQ6WzTtR3lntPAMAv2cPC0Mt1z98a4L+3Dy7r2SGOAVAN6PdY0J
[... FULL PRIVATE KEY FROM .env.local ...]
-----END PRIVATE KEY-----"
```

### 2. Admin Dashboard Authentication (CRITICAL)
```bash
ADMIN_API_KEY=DirectoryBolt-Admin-2025-SecureKey
ADMIN_SESSION_TOKEN=DirectoryBolt-Session-2025
ADMIN_USERNAME=admin
ADMIN_PASSWORD=DirectoryBolt2025!
```

### 3. Staff Dashboard Authentication (CRITICAL)
```bash
STAFF_API_KEY=DirectoryBolt-Staff-2025-SecureKey
STAFF_SESSION_TOKEN=DirectoryBolt-Staff-Session-2025
STAFF_USERNAME=staff
STAFF_PASSWORD=DirectoryBoltStaff2025!
```

### 4. Stripe Configuration (ALREADY CONFIGURED)
```bash
STRIPE_SECRET_KEY=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
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51RyJPcPQdMywmVkHwdLQtTRV8YV9fXjdJtrxEwnYCFTn3Wqt4q82g0o1UMhP4Nr3GchadbVvUKXAMkKvxijlRRoF00Zm32Fgms
STRIPE_WEBHOOK_SECRET=whsec_hh8b4JD6g7BcJ4TB9BheJDIgDcvu3T9B
```

### 5. Supabase Configuration (ALREADY CONFIGURED)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://kolgqfjgndwdziqgloz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs1sInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbGdxZmpnbmN3ZGR6aXFsb3oiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcyNTU2MzQwNSwiZXhwIjoyMDQxMTM5NDA1fQ.YWt9b4E4kZFMdEQsGj1L_gCKXCCrY8jTfh1gXWJKFZg
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbGdxZmpnbmNkd2RkemlxbG96Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjczODc2MSwiZXhwIjoyMDcyMzE0NzYxfQ.xPoR2Q_yey7AQcorPG3iBLKTadzzSEMmK3eM9ZW46Qc
```

## NETLIFY DASHBOARD CONFIGURATION STEPS

### Step 1: Access Netlify Dashboard
1. Go to https://app.netlify.com/
2. Navigate to DirectoryBolt site
3. Go to **Site settings** → **Environment variables**

### Step 2: Add Missing Variables
For each variable above, click **Add variable** and enter:
- **Key:** Variable name (e.g., `GOOGLE_SHEET_ID`)
- **Value:** Variable value (copy exactly from above)
- **Scopes:** Select **All deploy contexts**

### Step 3: Special Handling for GOOGLE_PRIVATE_KEY
⚠️ **CRITICAL:** The private key must be entered as a single line with `\n` for newlines:
```
-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDckqPCWtKV9wOo\nBwSWuFkNC7Trt9giuilMWRDZYhMm9X85/EeP3gPddHdH/FGcIpBgfEBZK3+mc7Bf\n[...continue with \n for each line break...]\n-----END PRIVATE KEY-----
```

### Step 4: Trigger Redeploy
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**
3. Wait for deployment to complete

## VERIFICATION STEPS

After deployment, test these endpoints:

### 1. Health Check
```bash
curl https://directorybolt.com/api/health
# Should return: {"status":"healthy","hasStripe":true,"hasSupabase":true}
```

### 2. Google Sheets Health
```bash
curl https://directorybolt.com/api/health/google-sheets
# Should return: {"success":true,"checks":{"environmentVariables":{"passed":true}}}
```

### 3. Admin Config Check
```bash
curl -H "x-admin-key: DirectoryBolt-Admin-2025-SecureKey" https://directorybolt.com/api/admin/config-check
# Should return: {"success":true,"environment":"production"}
```

### 4. Customer Validation
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"customerId":"TEST-123"}' \
  https://directorybolt.com/api/customer/validate
# Should return: {"success":true,"customer":{...}}
```

## EXPECTED RESULTS AFTER FIX

✅ **All API endpoints functional**  
✅ **AutoBolt extension customer validation working**  
✅ **Google Sheets integration operational**  
✅ **Admin/Staff dashboards accessible**  
✅ **Customer journey end-to-end functional**

## ROLLBACK PLAN

If issues occur:
1. Remove problematic environment variables
2. Redeploy site
3. Check logs in Netlify Functions tab
4. Verify variable formatting and retry

---

**⚠️ SECURITY NOTE:** These credentials are for production use. Ensure they are only accessible to authorized personnel and never committed to version control.