# Research Notes – Staff/Admin Auth Stabilization

## Current Auth Flow Findings
- `lib/auth/constants.ts` reads cookie identifiers and fallback credentials directly from env or hard-coded defaults; no global test-mode flag yet, and `isProductionEnv` only checks `NODE_ENV`.
- Staff endpoints (`pages/api/staff/login.ts`, `auth-check.ts`, `logout.ts`) validate against environment-provided username/password and set the `staff-session` cookie to a static token. There is no differentiation between production and local modes beyond `isProductionEnv` toggling the cookie’s `secure` attribute.
- Admin endpoints mirror this pattern: `pages/api/admin/login.ts` issues `admin-session`, but `auth-check.ts` currently accepts either the admin session cookie, the staff cookie, or a Bearer token matching `ADMIN_API_KEY`/fallback. Logout always flags cookies as secure regardless of environment.
- Critical admin tooling (`pages/api/admin/config-check.ts`) authenticates solely via `Authorization: Bearer <ADMIN_API_KEY>` and fails when the service relies on cookies alone, leading to observed 401s.

## API Usage Impact
- Customer creation (`pages/api/customers/create.ts`) and AutoBolt push (`pages/api/autobolt/push.ts`) share the same Supabase-versus-test-store split introduced earlier. Both accept either staff or admin session cookies and silently fall back to in-memory/test data when Supabase env vars are missing.
- Frontend hook (`hooks/useStaffAuth.ts`; no corresponding `useAdminAuth` helper currently exists) depends on `/api/staff/auth-check` returning a user object when the static cookie matches; there’s no explicit handling for production-vs-test behavior.

## Gaps Identified
- No explicit `TEST_MODE` guard exists—current code treats missing env vars as implicit “test mode,” which conflicts with production hardening goals.
- Admin auth inconsistencies: `auth-check` trusts staff sessions; `config-check` ignores cookies entirely.
- Several APIs instantiate Supabase clients inline and do not differentiate between production/test flips, making behavior unpredictable once env vars are enforced.
- Logout handlers hardcode `secure: true` (admin) or rely solely on `NODE_ENV` (staff), leading to mismatched behavior between local dev and Netlify.
