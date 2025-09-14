# 📋 SECTION 6 - IMMEDIATE ACTION ITEMS - NETLIFY VERIFICATION

**Mission Commander:** Emily  
**Section:** 6 - Immediate Action Items  
**Status:** EXECUTING VERIFICATION COMMANDS

## NETLIFY CLI VERIFICATION COMMANDS

### 1. Netlify Development Server Test
```bash
cd C:\Users\Ben\OneDrive\Documents\GitHub\DirectoryBolt
netlify dev
```
**Expected Result:** Local development server starts on port 3000  
**Purpose:** Verify local Netlify Functions work correctly

### 2. Environment Variables List
```bash
netlify env:list
```
**Expected Result:** List of all environment variables configured in Netlify  
**Purpose:** Verify which environment variables are missing in production

### 3. Netlify Functions List
```bash
netlify functions:list
```
**Expected Result:** List of all serverless functions deployed  
**Purpose:** Verify API routes are properly deployed as Netlify Functions

### 4. Build Configuration Check
```bash
netlify build
```
**Expected Result:** Successful build with no errors  
**Purpose:** Verify build process works locally

### 5. Site Information
```bash
netlify status
```
**Expected Result:** Site deployment status and configuration  
**Purpose:** Verify site is properly connected to Netlify

## NETLIFY.TOML CONFIGURATION ANALYSIS

### Current Configuration Status:
✅ **Build Command:** `npm ci --include=dev && npm run build`  
✅ **Publish Directory:** `.next`  
✅ **Node Version:** `20.18.1`  
✅ **Functions Directory:** `netlify/functions`  
✅ **Next.js Plugin:** `@netlify/plugin-nextjs` configured  
✅ **Environment Contexts:** Production, deploy-preview, branch-deploy configured  
✅ **Security Headers:** Properly configured for API routes  
✅ **Redirects:** API routes properly mapped to Netlify Functions  

### Potential Issues Identified:
❌ **Environment Variables:** Not visible in netlify.toml (configured in dashboard)  
❌ **Functions Bundler:** Using `esbuild` - may have compatibility issues with imports  
❌ **Build Environment:** Missing environment variable validation in build process  

## VERIFICATION CHECKLIST

### Pre-Environment Variable Configuration:
- [ ] `netlify dev` - Local development server starts
- [ ] `netlify env:list` - Shows missing production environment variables
- [ ] `netlify functions:list` - Shows deployed functions
- [ ] `netlify build` - Build completes successfully
- [ ] `netlify status` - Site status is healthy

### Post-Environment Variable Configuration:
- [ ] API endpoints return 200 instead of 500/401
- [ ] Google Sheets health check passes
- [ ] Admin/Staff authentication works
- [ ] Customer validation functional
- [ ] Extension can authenticate customers

## EXPECTED NETLIFY ENV:LIST OUTPUT (AFTER FIX)

```
Environment variables for site: directorybolt

Production:
- ADMIN_API_KEY
- ADMIN_PASSWORD
- ADMIN_SESSION_TOKEN
- ADMIN_USERNAME
- GOOGLE_PRIVATE_KEY
- GOOGLE_SERVICE_ACCOUNT_EMAIL
- GOOGLE_SHEET_ID
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- NEXT_PUBLIC_SUPABASE_URL
- STAFF_API_KEY
- STAFF_PASSWORD
- STAFF_SESSION_TOKEN
- STAFF_USERNAME
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- SUPABASE_SERVICE_KEY
```

## TROUBLESHOOTING COMMANDS

### If Functions Fail to Deploy:
```bash
netlify functions:build
netlify deploy --functions
```

### If Environment Variables Don't Load:
```bash
netlify env:get ADMIN_API_KEY
netlify env:set ADMIN_API_KEY "DirectoryBolt-Admin-2025-SecureKey"
```

### If Build Fails:
```bash
netlify build --debug
npm run build
```

### If Site Won't Deploy:
```bash
netlify deploy --prod --debug
```

## SUCCESS CRITERIA

✅ All Netlify CLI commands execute without errors  
✅ Environment variables are properly configured  
✅ Functions deploy and are accessible  
✅ Build process completes successfully  
✅ Site deploys to production without issues  

---

**Next Step:** Execute these commands and configure missing environment variables in Netlify Dashboard