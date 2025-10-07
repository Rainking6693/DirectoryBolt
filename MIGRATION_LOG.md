# Migration Log

- **2025-10-07**: Added business profile fields to `jobs` table (`business_name`, `email`, `phone`, `website`, `address`, `city`, `state`, `zip`, `description`, `category`) plus operational fields `package_type` (default `starter`) and `directory_limit` (default `50`). Migration script lives at `supabase/migrations/20251007_add_business_fields_to_jobs.sql`.
