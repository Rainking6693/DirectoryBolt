# DEBUG LOG

This log documents the new instrumentation added to diagnose queue/worker latency.

## Environment Verification
- `supabaseAdmin.createSupabaseAdminClient` logs the presence of `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` along with the resolved host.
- Failures to instantiate the Supabase client emit `supabaseAdmin.createSupabaseAdminClient` error logs with serialized stack traces.

## API Handlers
- `/api/jobs-next`, `/api/jobs-update`, `/api/jobs-complete`, and `/api/jobs-retry` now emit the following sequence on every request:
  1. `[timestamp] [*.handler] Handler invoked` with method/URL metadata.
  2. `[timestamp] [*.authorize] Authorization evaluated` with boolean outcome.
  3. Step-specific progress logs (authorization success, payload inspection, downstream calls).
  4. Each downstream call into `autoboltJobs` emits additional logs (see below).
  5. Errors bubble up with `[*.handler] Unhandled error` including serialized stack traces.

## Supabase Job Helpers
- `autoboltJobs` functions (`getNextPendingJob`, `updateJobProgress`, `completeJob`, `getQueueSnapshot`, `markJobInProgress`, `retryFailedJob`) log:
  - Function entry: `[timestamp] [function] Started ...`
  - Every Supabase query via `executeSupabaseQuery` logs `Executing query` and `Query completed` with duration and row counts.
  - Query timeouts (>10s) surface as `Query failed` with `Query timeout after 10000ms`.
  - Business logic checkpoints (e.g., job claimed, results upserted, completion summaries) log with relevant metadata.

## Test Endpoint
- `/api/test-supabase` isolates connection checks and reports duration/count for a head request against `jobs`.

## Expected Console Flow (Successful Worker Fetch)
1. `[...][jobs-next.handler] Handler invoked`
2. `[...][jobs-next.authorize] Authorization evaluated`
3. `[...][autoboltJobs.getNextPendingJob] Started`
4. `[...][autoboltJobs.getNextPendingJob] Executing query: jobs.select pending limit 1`
5. `[...][autoboltJobs.getNextPendingJob] Query completed: jobs.select pending limit 1`
6. Additional entries for updates/customer fetch; total >5 lines per request.

Any hang should now reveal the last emitted log line, highlighting the exact query/step in-flight.
- getNextPendingJob logs job row metadata (businessName/packageType) before yielding to workers.
