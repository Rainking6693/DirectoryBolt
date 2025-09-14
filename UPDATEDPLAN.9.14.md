# 📋 AutoBolt Extension & DirectoryBolt Crisis Checklist
AutoBolt Extension Repo:  C:\Users\Ben\OneDrive\Documents\GitHub\DirectoryBolt\auto-bolt-extension

## 1. Pre-Testing & Setup
- [ ] Install AutoBolt extension from correct path (`/auto-bolt-extension`)
- [ ] Verify permissions across directory domains
- [ ] Confirm DirectoryBolt API endpoints accessible
- [ ] Validate `manifest.json` configured for production
- [ ] Background/content scripts loading properly
- [ ] Customer onboarding flow functional (payment → business form)
- [ ] Google Sheets integration storing customer data
- [ ] Queue management APIs operational
- [ ] Customer status tracking system working
- [ ] Env vars configured properly

---

## 2. API Endpoints
- [ ] https://directorybolt.com/api/health/google-sheets → 500 error
- [ ] https://directorybolt.com/api/customer/validate → 500 error
- [ ] https://directorybolt.com/api/extension/secure-validate → 500 error
- [ ] https://directorybolt.com/api/health → Verify healthy response
- [ ] https://directorybolt.com/api/admin/config-check → 401 Unauthorized (ADMIN_API_KEY)
- [ ] https://directorybolt.com/api/admin/api-keys → 500 error
- [ ] https://directorybolt.com/lib/auth/admin-auth.ts → 404 error

---

## 3. Dashboards & Logins
- [ ] Staff dashboard auth methods failing  
  - [ ] API Key (`x-staff-key` header)  
  - [ ] Session Cookie (`staff-session`)  
  - [ ] Basic Auth (`staff / DirectoryBoltStaff2025!`)  
- [ ] Admin dashboard login URL → 404  
- [ ] Customer login → ID validation broken (any email logs in)

---

## 4. Extension Customer Journey
- [ ] Customer completes payment → redirected to business form  
- [ ] Form validation (all required fields)  
- [ ] Record created in Google Sheets → `submissionStatus="pending"`  
- [ ] Correct `packageType` mapping  
- [ ] Queue → `pending` record in Google Sheets  
- [ ] API endpoints return correct data  
- [ ] Extension loads, retrieves queue, respects priority  
- [ ] Directory submissions automated (form filling, skipping login/CAPTCHA)  
- [ ] Status updates written back to Google Sheets  
- [ ] Customer progress visible, errors logged, retries attempted  

---

## 5. Critical Failures
- [ ] AutoBolt extension customer validation → still broken  
- [ ] Dashboard pages (customer/admin/staff) → 404s  
- [ ] Google Sheets service → cannot auth in production  
- [ ] Env vars in Netlify → inaccessible at runtime  
- [ ] Build/deployment issues → API routes/pages missing

---

## 6. Immediate Action Items
- [ ] Review Netlify build logs for errors  
- [ ] Run Netlify CLI: `netlify dev`, `netlify env:list`, `netlify functions:list`  
- [ ] Inspect `netlify.toml` (`[functions]` + `[build.environment]`)  
- [ ] Verify Google Sheets service account & key formatting  
- [ ] Confirm Next.js build target (static vs serverless)  
- [ ] Consider fallback (Vercel/Doppler/Firebase) if Netlify fails  

---

## 7. Urgent Agent Assignments
- [ ] **Auth Specialist** → `customer-popup.js` login flow, retry logic, error clarity  
- [ ] **UI/UX Specialist** → `customer-popup.html`, responsive layout, error displays  
- [ ] **Background Specialist** → `background-batch.js`, automation speed, reliability  
- [ ] **Content Script Specialist** → update selectors, support new directories  
- [ ] **Integration Specialist** → API integration, dashboard links, secure comms  
- [ ] **QA Specialist** → end-to-end tests, Chrome load, real customer IDs  

---

## 8. System Integrity & Recovery
- [ ] Handle browser crashes, extension restarts  
- [ ] Ensure customer data encrypted, no plain-text logs  
- [ ] Purge customer data after processing  
- [ ] Prevent duplicate/invalid submissions  
- [ ] Verify 95%+ success rate, <10% tech failures  
- [ ] Confirm customer-facing experience seamless  
