-- ENHANCED SECURITY: Row Level Security Policies for DirectoryBolt
-- Execute this in Supabase SQL Editor after the initial schema
-- URL: https://supabase.com/dashboard/project/kolgqfjgncdwddziqloz/sql

-- ============================================
-- STEP 1: Drop existing overly permissive policies
-- ============================================

DROP POLICY IF EXISTS "Service role can do everything" ON customers;
DROP POLICY IF EXISTS "Service role can do everything" ON queue_history;
DROP POLICY IF EXISTS "Service role can do everything" ON customer_notifications;
DROP POLICY IF EXISTS "Service role can do everything" ON directory_submissions;
DROP POLICY IF EXISTS "Service role can do everything" ON analytics_events;
DROP POLICY IF EXISTS "Service role can do everything" ON batch_operations;

-- ============================================
-- STEP 2: Create proper customer isolation policies
-- ============================================

-- Customers table: Users can only see their own data
CREATE POLICY "customers_isolation" ON customers
    FOR ALL 
    USING (
        auth.role() = 'service_role' OR 
        (auth.role() = 'authenticated' AND 
         (auth.jwt() ->> 'email') = email)
    );

-- Queue history: Users can only see their own history
CREATE POLICY "queue_history_isolation" ON queue_history
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        customer_id IN (
            SELECT customer_id FROM customers 
            WHERE (auth.jwt() ->> 'email') = email
        )
    );

-- Customer notifications: Users can only see their own notifications
CREATE POLICY "notifications_isolation" ON customer_notifications
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        customer_id IN (
            SELECT customer_id FROM customers 
            WHERE (auth.jwt() ->> 'email') = email
        )
    );

-- Directory submissions: Users can only see their own submissions
CREATE POLICY "submissions_isolation" ON directory_submissions
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        customer_id IN (
            SELECT customer_id FROM customers 
            WHERE (auth.jwt() ->> 'email') = email
        )
    );

-- Analytics events: Users can only see their own events
CREATE POLICY "analytics_isolation" ON analytics_events
    FOR SELECT
    USING (
        auth.role() = 'service_role' OR
        customer_id IN (
            SELECT customer_id FROM customers 
            WHERE (auth.jwt() ->> 'email') = email
        )
    );

-- ============================================
-- STEP 3: Admin role policies
-- ============================================

-- Create admin access policies for staff/admin users
CREATE POLICY "admin_full_access_customers" ON customers
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND 
         auth.jwt() ->> 'role' = 'admin')
    );

CREATE POLICY "admin_full_access_queue" ON queue_history
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND 
         auth.jwt() ->> 'role' = 'admin')
    );

CREATE POLICY "admin_full_access_notifications" ON customer_notifications
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND 
         auth.jwt() ->> 'role' = 'admin')
    );

CREATE POLICY "admin_full_access_submissions" ON directory_submissions
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND 
         auth.jwt() ->> 'role' = 'admin')
    );

CREATE POLICY "admin_full_access_analytics" ON analytics_events
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND 
         auth.jwt() ->> 'role' = 'admin')
    );

CREATE POLICY "admin_batch_operations" ON batch_operations
    FOR ALL
    USING (
        auth.role() = 'service_role' OR
        (auth.role() = 'authenticated' AND 
         auth.jwt() ->> 'role' = 'admin')
    );

-- ============================================
-- STEP 4: Service role bypass (for backend operations)
-- ============================================

-- Service role can bypass RLS for all tables
CREATE POLICY "service_role_bypass_customers" ON customers
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "service_role_bypass_queue" ON queue_history
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "service_role_bypass_notifications" ON customer_notifications
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "service_role_bypass_submissions" ON directory_submissions
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "service_role_bypass_analytics" ON analytics_events
    FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "service_role_bypass_batch" ON batch_operations
    FOR ALL
    USING (auth.role() = 'service_role');

-- ============================================
-- STEP 5: Verify RLS is enabled (safety check)
-- ============================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE directory_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_operations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Run this to verify policies are in place:
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;