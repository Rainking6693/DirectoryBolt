-- SIMPLIFIED SECURITY: Row Level Security Policies for DirectoryBolt
-- Service-role-only access for maximum security and simplicity
-- Execute this in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/kolgqfjgncdwddziqloz/sql

-- ============================================
-- STEP 1: Drop ALL existing policies (clean slate)
-- ============================================

DO $$ 
DECLARE
    pol RECORD;
BEGIN
    -- Drop all policies on our tables
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('customers', 'queue_history', 'customer_notifications', 
                          'directory_submissions', 'analytics_events', 'batch_operations')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
                      pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- ============================================
-- STEP 2: Enable RLS on all tables
-- ============================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_operations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 3: Create SINGLE service role policy per table
-- Only the backend with service role key can access data
-- ============================================

-- Customers table: Service role only
CREATE POLICY "service_role_all_access" ON customers
    FOR ALL 
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Queue history: Service role only  
CREATE POLICY "service_role_all_access" ON queue_history
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Customer notifications: Service role only
CREATE POLICY "service_role_all_access" ON customer_notifications
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Directory submissions: Service role only
CREATE POLICY "service_role_all_access" ON directory_submissions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Analytics events: Service role only
CREATE POLICY "service_role_all_access" ON analytics_events
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Batch operations: Service role only
CREATE POLICY "service_role_all_access" ON batch_operations
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ============================================
-- STEP 4: Explicitly DENY access to anon and authenticated roles
-- This ensures only service role can access data
-- ============================================

-- Create explicit deny policies for anon role (optional but clear)
CREATE POLICY "deny_anon_access" ON customers
    FOR ALL
    TO anon
    USING (false);

CREATE POLICY "deny_anon_access" ON queue_history
    FOR ALL
    TO anon
    USING (false);

CREATE POLICY "deny_anon_access" ON customer_notifications
    FOR ALL
    TO anon
    USING (false);

CREATE POLICY "deny_anon_access" ON directory_submissions
    FOR ALL
    TO anon
    USING (false);

CREATE POLICY "deny_anon_access" ON analytics_events
    FOR ALL
    TO anon
    USING (false);

CREATE POLICY "deny_anon_access" ON batch_operations
    FOR ALL
    TO anon
    USING (false);

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('customers', 'queue_history', 'customer_notifications', 
                  'directory_submissions', 'analytics_events', 'batch_operations');

-- Verify policies are correctly configured
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Test that only service role can access data
-- This should return results when run with service role key
-- and fail when run with anon key
SELECT COUNT(*) as customer_count FROM customers;

-- ============================================
-- SUMMARY
-- ============================================
-- This simplified approach ensures:
-- 1. ONLY backend services with service_role key can access data
-- 2. No complex JWT token parsing or role checking
-- 3. No risk of misconfigured customer isolation
-- 4. Clear and maintainable security model
-- 5. All API access goes through authenticated backend endpoints
-- ============================================