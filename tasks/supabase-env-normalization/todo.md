# TODO - Supabase Env Normalization
- [x] Add lib/server/supabaseEnv.js (+ .d.ts) exposing canonical public/server configs.
- [ ] Refactor shared Supabase clients (lib/services/supabase.js, lib/server/supabaseAdmin.ts, backend/functions/_supabaseClientTyped.ts, lib/database/optimized-queries.ts, lib/database/directories.ts, lib/services/supabase-queue-manager.ts, worker/deployment/scaling/auto-scaler.js) to use helper.
- [ ] Update Next API routes (admin, staff, autobolt, customer, health) to consume helper instead of NEXT_PUBLIC_SUPABASE_*.
- [x] Refresh .env.example notes to clarify usage.
- [x] Run npm run type-check to validate changes.

