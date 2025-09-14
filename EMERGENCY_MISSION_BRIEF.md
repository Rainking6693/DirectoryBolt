# EMERGENCY MISSION BRIEF — AutoBolt + DirectoryBolt Crisis Recovery

Mission Commander: Emily (mission lead — AutoBolt + DirectoryBolt recovery)
Objective: Deliver a fully functional, production-ready AutoBolt extension with all API endpoints, dashboards, and customer journeys validated.

Scope: Follow `UPDATEDPLAN.9.14.md` (master checklist). All other workstreams are halted until mission completion.

---

Teams and responsibilities
- Auth Specialist (Auth): Fix API auth, staff/admin/customer login flows, `admin-auth.ts`, `customer-popup.js` retry logic.
- UI/UX Specialist (UI/UX): Fix `customer-popup.html`, admin/staff dashboard routes, responsive layouts and error displays.
- Background Specialist (Background): Fix background processing scripts like `background-batch.js`, queue retrieval, Google Sheets writes.
- Content Script Specialist (Content): Update extension content scripts and selectors under `/autobolt-extension`, ensure form mappings are current.
- Integration Specialist (Integration): API endpoints, Netlify environment, `netlify.toml`, Google Sheets service account, Stripe webhooks.
- QA Specialist (QA): Write and run E2E tests (Playwright), run customer simulation tests, validate production readiness.

---

Operation rules (strict)
1. 5-minute check-ins: every agent posts a single-line status update to the command center file `MISSION_STATUS.md` every 5 minutes (see format below).
2. Audit chain per section (gating): Cora (technical correctness) → Frank (system stability) → Clive (compliance/security) → Blake (E2E customer sim).
   - No team may mark a section complete or start the next section until all four auditors have explicitly approved the section in `MISSION_APPROVALS.md`.
3. Continuous reporting: `MISSION_STATUS.md` is the live command center; `MISSION_LOG.md` records actions, timestamps, and approvals.
4. Halt other workstreams: create `EMERGENCY_HALT.md` (notice to devs) and ensure CI is blocked from merging to `main` until mission complete (see CI note below).

---

Check-in format (every 5 minutes)
- File: `MISSION_STATUS.md`
- Single-line entries, prefixed by timestamp and agent name.
- Example: `2025-09-14T15:05:00Z | Auth | In-progress: Verifying admin API key; next: rotate ADMIN_API_KEY if invalid; blockers: missing env var SUPABASE_SERVICE_KEY`

---

Approvals & gating format
- File: `MISSION_APPROVALS.md`
- For each checklist section (1..8 as in `UPDATEDPLAN.9.14.md`) record approvals:
  - `Section 1 - Pre-Testing & Setup` — Cora: [YES/NO] — Frank: [YES/NO] — Clive: [YES/NO] — Blake: [YES/NO]
  - Approvals must contain a short comment and timestamp.

---

Initial immediate actions (first 30 minutes)
1. Auth: Verify admin API keys, reproduce `401` and `500` responses listed in Section 2.
2. Integration: Check Netlify build logs and `netlify.toml` for environment variables and functions mapping.
3. Background: Start local run of `background-batch.js` with staging/test queue and validate Google Sheets access.
4. QA: Start Playwright smoke tests (headless) for customer payment → redirect → extension flow.
5. Command center: create `EMERGENCY_HALT.md`, `MISSION_STATUS.md`, `MISSION_APPROVALS.md`, `MISSION_LOG.md`.

---

CI note
- Block merges to `main`. (This requires repository admin action; if you want I can create `EMERGENCY_HALT.md` and a suggested GitHub branch protection rule in this repo's docs to request the block.)

---

Contacts / escalation
- Cora (Technical QA)
- Frank (Operations)
- Clive (Security)
- Blake (E2E)
- Emily (Commander) — final decisions and unblocker

---

Rules acknowledgement
- Agents must append an acknowledgement line to `MISSION_STATUS.md` once they start (first check-in) using: `AGENT ACK | <Agent> | <timestamp> | Acknowledged mission rules and 5-min check-ins`.

---

End of brief. Commander Emily will coordinate and reassign as progress is made. Updates to this brief must be approved by the auditors listed above.
