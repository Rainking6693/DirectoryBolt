# MISSION_ASSIGNMENTS — AutoBolt Crisis Recovery

Commander: Emily

Check-in enforcement: All agents (Auth, UI/UX, Background, Content, Integration, QA) must post a status line to MISSION_STATUS.md every 5 minutes. Format: <timestamp> | <Agent> | <status>

Audit gating: No agent may proceed to the next checklist section until approvals for the current section are recorded in MISSION_APPROVALS.md by Cora (Technical), Frank (Stability), Clive (Security), and Blake (E2E).

Assignment mapping (owners and first-step tasks)

Section 1 — Pre-Testing & Setup
- Owner team: Integration
- Lead: Integration
- Tasks:
  - Verify extension path `/auto-bolt-extension` and `manifest.json` prod config
  - Confirm env vars present (Netlify/Local) — `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `OPENAI_API_KEY`, `STRIPE_SECRET_KEY`
  - Check Google Sheets service account key formatting
- Acceptance criteria: extension loads locally; env vars validated; queue APIs return test data

Section 2 — API Endpoints
- Owner team: Auth + Integration
- Leads: Auth (Lead), Integration (Co-Lead)
- Tasks:
  - Reproduce 500/401 errors for listed endpoints and capture logs
  - Inspect `pages/api/analyze.ts`, `pages/api/health`, `pages/api/admin/*` routes for error handling
  - Validate `lib/auth/admin-auth.ts` existence and pathing
- Acceptance criteria: endpoints return expected status (200/401 as appropriate). Admin endpoints require ADMIN_API_KEY and give 401 when missing.

Section 3 — Dashboards & Logins
- Owner team: UI/UX + Auth
- Leads: UI/UX (Lead), Auth (Co-Lead)
- Tasks:
  - Verify staff/admin login flows (`x-staff-key`, `staff-session`, basic auth)
  - Fix 404s for admin dashboard routes
  - Ensure ID validation for customer login is strict
- Acceptance criteria: staff and admin login flows succeed with proper credentials only, customer login validates email properly

Section 4 — Extension Customer Journey
- Owner team: Content + Background + QA
- Leads: Background (Lead), Content (Co-Lead), QA (Co-Lead)
- Tasks:
  - Ensure payment -> redirect -> business form works end-to-end
  - Validate Google Sheets writes: `submissionStatus="pending"` and `packageType` mapping
  - Verify extension queue retrieval respects priority and writes status back
- Acceptance criteria: simulated customer completes journey; queue shows pending and then processed records; statuses update in sheets

Section 5 — Critical Failures
- Owner team: Integration + Background
- Leads: Integration (Lead), Background (Co-Lead)
- Tasks:
  - Fix production Google Sheets auth; validate Netlify env var availability
  - Resolve API routes/pages missing in build
- Acceptance criteria: production builds complete; Google Sheets service authenticates; API routes reachable

Section 6 — Immediate Action Items
- Owner team: Integration
- Lead: Integration
- Tasks:
  - Run `netlify dev`, `netlify env:list`, `netlify functions:list` locally and capture errors
  - Inspect `netlify.toml` and build target
- Acceptance criteria: Netlify dev runs locally, functions list accessible

Section 7 — Urgent Agent Assignments
- Owner team: QA + Content
- Leads: QA (Lead), Content (Co-Lead)
- Tasks:
  - QA runs E2E tests for Chrome extension and dashboards
  - Content updates selectors and mappings for directories
- Acceptance criteria: E2E passes; content scripts map to directory forms correctly

Section 8 — System Integrity & Recovery
- Owner team: Background + Integration + Auth
- Leads: Background (Lead), Integration (Co-Lead), Auth (Co-Lead)
- Tasks:
  - Ensure data encryption, purge flows, dedupe protections, retry logic
  - Confirm >95% success rate in test runs
- Acceptance criteria: no plaintext customer data in logs; dedupe protection in place; success rate above threshold

---

Reassignments & escalations: Commander Emily will reassign if progress stalls. All agents must participate in the 5-minute check-ins and use `MISSION_STATUS.md` and `MISSION_APPROVALS.md` for gating.
