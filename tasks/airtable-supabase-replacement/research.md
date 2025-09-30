# Research: Replacing Airtable With Supabase in API Routes

## Current State
- Several API routes (`pages/api/ai/enhanced-analysis.ts`, `pages/api/autobolt/customer-status.ts`, `pages/api/autobolt/queue.ts`) still import from `lib/services/airtable`, which no longer exists after prior cleanup.
- The new `lib/services/customer-service.ts` provides Supabase-backed helpers (`findByCustomerId`, `createOrUpdateCustomer`, `updateDirectoryStats`). Additional capabilities (e.g., looking up pending customers by session/email, updating submission status) are missing.

## Requirements
- Remove all Airtable imports/usages from the affected API routes.
- Introduce or extend Supabase helpers to cover the Airtable functionality (lookup by ID/session/email, status updates, directory stats updates).
- Ensure API responses remain unchanged to avoid breaking clients.

## Considerations
- Supabase rows use snake_case columns; API routes expect camelCase fields. The customer service layer should normalize data.
- Queue workflow depends on finding pending customers by payment session or email; we need dedicated Supabase queries for that.
- Error handling should surface Supabase errors clearly while maintaining existing API semantics.
