\# DirectoryBolt Vercel Migration Plan



\## Project Overview

\*\*Objective:\*\* Migrate DirectoryBolt from Netlify to existing Vercel project to restore deployment capability and resolve build minute limitations.



\*\*Working Directory:\*\* `C:\\Users\\Ben\\OneDrive\\Documents\\GitHub\\DirectoryBolt`

\*\*Vercel Project:\*\* `directorybolt` (existing project)

\*\*Target Domain:\*\* directorybolt.com



\## Infrastructure Access

\- \*\*Vercel API Token:\*\* `vpETvjTsIUzOMbRaBaWoz03W`

\- \*\*GitHub Keys:\*\* Available in .env folder

\- \*\*Netlify Credentials:\*\* Available in .env folder (for environment variable export)



\## Agent Protocol

Emily will coordinate multiple agents with mandatory 10-minute check-ins. \*\*NO AGENT MAY PROCEED TO NEXT ITEM UNTIL CURRENT WORK IS AUDITED BY CORA → ATLAS → HUDSON → APPROVED\*\*



\## Migration Emergency Context

\*\*Issue:\*\* Netlify build minutes exhausted - "This team has exceeded the build minutes limit for the Free plan"

\*\*Solution:\*\* Immediate migration to existing Vercel project to restore deployment capability



---



\## PHASE 1: VERCEL PROJECT CONNECTION

\*\*Agent Assignment:\*\* Quinn (DevOps) + Alex (Full-Stack)



\### Quinn (DevOps Engineer):

\- \[ ] Authenticate with Vercel using API token: `vpETvjTsIUzOMbRaBaWoz03W`

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Connect DirectoryBolt GitHub repo to \*\*existing\*\* `directorybolt` Vercel project

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Configure automatic deployments from main branch to existing project

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Set up custom domain: directorybolt.com → existing Vercel project

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Configure DNS settings and SSL certificates

\- \[ ] \*\*FINAL AUDIT:\*\* Cora → Atlas → Hudson approval required before Phase 2



\### Alex (Full-Stack Engineer):

\- \[ ] Use Vercel API to migrate environment variables from Netlify to existing project

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Migrate Stripe API keys and other service credentials to `directorybolt` project

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Test environment variable access in Vercel Functions context

\- \[ ] \*\*FINAL AUDIT:\*\* Cora → Atlas → Hudson approval required before Phase 2



\### Vercel CLI Commands for Agents:

```bash

\# Authenticate

vercel login --token vpETvjTsIUzOMbRaBaWoz03W



\# Link to EXISTING project

vercel link --yes

\# Select: directorybolt (existing project)



\# Set environment variables on existing project

vercel env add GOOGLE\_SHEET\_ID --scope production

vercel env add GOOGLE\_PRIVATE\_KEY --scope production

vercel env add GOOGLE\_SERVICE\_ACCOUNT\_EMAIL --scope production

vercel env add STRIPE\_SECRET\_KEY --scope production



\# Deploy to existing project

vercel --prod

```



---



\## PHASE 2: API ENDPOINT MIGRATION

\*\*Agent Assignment:\*\* Shane (Backend) + Jason (Database Expert)

\*\*PREREQUISITE:\*\* Phase 1 must be fully audited and approved



\### Shane (Backend Developer):

\- \[ ] Test all API routes in existing Vercel project environment

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Verify /api/extension/validate endpoint with Google Sheets integration

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Ensure customer ID validation works with existing Google Sheets data

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Test payment webhook endpoints and Stripe integration on Vercel

\- \[ ] \*\*FINAL AUDIT:\*\* Cora → Atlas → Hudson approval required before Phase 3



\### Jason (Database Expert):

\- \[ ] Validate Google Sheets authentication in existing Vercel environment

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Test customer data retrieval and storage operations

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Verify database connection stability and performance in production

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Ensure all customer ID formats work correctly with new deployment

\- \[ ] \*\*FINAL AUDIT:\*\* Cora → Atlas → Hudson approval required before Phase 3



\### Success Criteria for Phase 2:

\- \[ ] API endpoint: `https://directorybolt.com/api/extension/validate` returns proper responses

\- \[ ] Google Sheets health check: `https://directorybolt.com/api/health/google-sheets` returns `{ok:true}`

\- \[ ] Customer validation works with real customer IDs from Google Sheets



---



\## PHASE 3: AUTOBOLT EXTENSION INTEGRATION  

\*\*Agent Assignment:\*\* CLIVE/CLAUDE (Extension Specialist)

\*\*PREREQUISITE:\*\* Phase 2 must be fully audited and approved



\### CLIVE/CLAUDE (Extension Engineer):

\- \[ ] Update extension to use new Vercel deployment URL (directorybolt.com)

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Fix JavaScript class dependencies (PackageTierEngine, etc.) causing crashes

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Test customer validation flow with Vercel API endpoints

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Resolve tab communication errors in background script

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Verify extension loads without console errors in Chrome

\- \[ ] \*\*FINAL AUDIT:\*\* Cora → Atlas → Hudson approval required before Phase 4



---



\## PHASE 4: DNS AND DOMAIN MIGRATION

\*\*Agent Assignment:\*\* Quinn (DevOps)

\*\*PREREQUISITE:\*\* Phase 3 must be fully audited and approved



\### Quinn (DevOps Engineer):

\- \[ ] Update DNS records to point directorybolt.com to Vercel

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Configure SSL certificates and security headers

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Test domain propagation and accessibility

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Ensure all redirects and routing work properly

\- \[ ] \*\*FINAL AUDIT:\*\* Cora → Atlas → Hudson approval required before Phase 5



---



\## PHASE 5: COMPREHENSIVE TESTING

\*\*Agent Assignment:\*\* Taylor (QA) + Blake (Build Environment)

\*\*PREREQUISITE:\*\* Phase 4 must be fully audited and approved



\### Taylor (QA Engineer):

\- \[ ] Test complete customer journey on Vercel deployment

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Verify AutoBolt extension validation with real customer IDs

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Test all payment flows and Google Sheets integration

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Validate pricing tiers and package functionality

\- \[ ] \*\*FINAL AUDIT:\*\* Cora → Atlas → Hudson approval required



\### Blake (Build Environment Detective):

\- \[ ] Compare deployment performance vs Netlify

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Verify build reliability and deployment speed  

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Test various deployment scenarios and edge cases

\- \[ ] \*\*AUDIT CHECKPOINT:\*\* Wait for Cora → Atlas → Hudson approval before proceeding

\- \[ ] Confirm no environment-specific regressions

\- \[ ] \*\*FINAL AUDIT:\*\* Cora → Atlas → Hudson approval required



---



\## FINAL SUCCESS CRITERIA

\- \[ ] DirectoryBolt.com successfully migrated to Vercel

\- \[ ] AutoBolt extension validates real customer IDs

\- \[ ] Google Sheets integration fully operational

\- \[ ] All API endpoints returning proper responses

\- \[ ] No build minute limitations or deployment failures



\*\*MANDATORY:\*\* Emily must coordinate agents and enforce audit checkpoints - NO EXCEPTIONS

