# Research: Customer Service Integration

## Existing Supabase Usage
- `lib/services/supabase.js` implements a comprehensive `SupabaseService` with helpers for customers (lookup, add/update, directory stats, status updates) using the service-role key.
- `lib/services/ai-analysis-cache.ts` and other modules already use the lightweight `lib/services/supabase.ts` client for runtime operations.

## Gaps Identified
- No dedicated TypeScript module exposes simple helpers (`findByCustomerId`, `createOrUpdateCustomer`, `updateDirectoryStats`) that rely on the shared Supabase browser/server client.
- `EnhancedAIIntegrationService` still references Airtable types and lacks customer persistence through Supabase.

## Constraints & Considerations
- Need to reuse the singleton client from `lib/services/supabase.ts`.
- Ensure functions return structured results (likely typed) and surface Supabase errors gracefully.
- Maintain compatibility with existing service imports while migrating away from Airtable.
