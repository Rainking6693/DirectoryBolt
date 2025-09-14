# ✅ DirectoryBolt Issue Checklist

## API Endpoints
- [ ] https://directorybolt.com/api/health/google-sheets → 500 error
- [ ] https://directorybolt.com/api/customer/validate → 500 error
- [ ] https://directorybolt.com/api/extension/secure-validate → 500 error
- [ ] https://directorybolt.com/api/health → Verify healthy response
- [ ] https://directorybolt.com/api/admin/config-check → 401 Unauthorized (missing ADMIN_API_KEY)
- [ ] https://directorybolt.com/api/admin/api-keys → 500 error
- [ ] https://directorybolt.com/lib/auth/admin-auth.ts → 404 error

## Dashboards & Logins
- [ ] https://directorybolt.com/staff-dashboard → Authentication methods not working  
  - [ ] API Key: Add `x-staff-key` header  
  - [ ] Session Cookie: `staff-session`  
  - [ ] Basic Auth: `staff / DirectoryBoltStaff2025!`
- [ ] https://directorybolt.com/login?redirect=/admin-dashboard → 404 error
- [ ] https://directorybolt.com/customer-login → Customer ID login fails (any email logs in to test company data)

## Critical Failures (from Report)
- [ ] AutoBolt Extension Customer Validation → Still broken
- [ ] Dashboard pages (customer/admin/staff portals) → Return 404
- [ ] Google Sheets service → Cannot authenticate in production
- [ ] Environment variables in Netlify → Not accessible at runtime
- [ ] Build & Deployment issues → API routes/pages not deploying correctly

## Immediate Action Items
- [ ] Review Netlify build logs for errors
- [ ] Test with Netlify CLI: `netlify dev`, `netlify env:list`, `netlify functions:list`
- [ ] Check `netlify.toml` for `[functions]` directory and `[build.environment]`
- [ ] Verify Google Sheets service account permissions & key formatting
- [ ] Confirm if Next.js build target is correct (static vs serverless)
- [ ] Consider fallback: Vercel / Doppler / Firebase if Netlify issues persist

