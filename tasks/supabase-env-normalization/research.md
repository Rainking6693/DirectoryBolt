# Research Notes – Supabase Env Normalization

## Approach
- Searched the repo for SUPABASE references to map how frontend, Next API routes, Netlify functions, and worker scripts consume Supabase environment variables.
- Focused on runtime pathways (Next.js pages/api, lib/services, ackend/functions, worker utilities) that impact production behaviour on Netlify.

## Key Findings
- **Server-side Supabase service (lib/services/supabase.js)**: Initializes with process.env.NEXT_PUBLIC_SUPABASE_URL plus service role key. This module feeds most server APIs via createSupabaseService, so backend currently depends on public env vars.
- **Frontend helper (lib/services/supabase.ts)**: Correctly uses NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY for client-side usage; can stay as-is but should avoid leaking into server code.
- **Next.js API routes**: 35+ handlers (admin, staff, autobolt, customer) instantiate Supabase clients directly with NEXT_PUBLIC_SUPABASE_URL (see e.g. pages/api/autobolt/push.ts, pages/api/admin/alerts.ts, pages/api/staff/analytics.ts). They mix public URL with SUPABASE_SERVICE_ROLE_KEY, causing Netlify deployments to rely on duplicated vars.
- **Typed Netlify helper (ackend/functions/_supabaseClientTyped.ts)**: Prefers SUPABASE_URL but still falls back to NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY, reinforcing duplication.
- **Database managers (lib/database/optimized-queries.ts, lib/database/directories.ts, lib/services/supabase-queue-manager.ts)**: Pull from SUPABASE_URL ?? NEXT_PUBLIC_SUPABASE_URL and sometimes fall back to anon keys, so queued/analytics flows may execute with public credentials.
- **Workers (worker/deployment/scaling/auto-scaler.js)**: Also use process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL; inconsistent with desired separation.
- **Env templates**: .env.example defines both SUPABASE_URL and NEXT_PUBLIC_SUPABASE_URL, but there is no shared accessor enforcing which side should consume which keys.

## Opportunities for Consolidation
- Introduce centralized helpers (e.g. lib/env/supabase.ts) that expose getSupabaseServiceConfig() for server code and getSupabaseClientConfig() for browser, removing ad-hoc process.env usage.
- Update createSupabaseService and all server consumers to rely solely on SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, eliminating fallback to public vars.
- Sweep API routes / Netlify / worker scripts to import the shared server helper instead of referencing env vars directly.
- Align TypeScript definitions / tests to mock only the canonical server vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) and frontend vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY).
