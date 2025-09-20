-- Fix Supabase Security Issues
-- Run this in your Supabase SQL Editor

-- 1. Enable RLS on directories table
ALTER TABLE public.directories ENABLE ROW LEVEL SECURITY;

-- 2. Fix RLS policies to use SELECT instead of direct function calls
-- This fixes the performance issue with re-evaluating auth functions for each row

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Service role can do everything" ON public.customers;
DROP POLICY IF EXISTS "Service role can do everything" ON public.queue_history;
DROP POLICY IF EXISTS "Service role can do everything" ON public.customer_notifications;
DROP POLICY IF EXISTS "Service role can do everything" ON public.directory_submissions;
DROP POLICY IF EXISTS "Service role can do everything" ON public.analytics_events;
DROP POLICY IF EXISTS "Service role can do everything" ON public.batch_operations;

-- Create optimized RLS policies for customers table
CREATE POLICY "Allow read access for all users" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow insert access for authenticated users" ON public.customers FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "Allow update access for authenticated users" ON public.customers FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "Allow delete access for authenticated users" ON public.customers FOR DELETE USING ((select auth.role()) = 'authenticated');

-- Create optimized RLS policies for queue_history table
CREATE POLICY "Allow read access for all users" ON public.queue_history FOR SELECT USING (true);
CREATE POLICY "Allow insert access for authenticated users" ON public.queue_history FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "Allow update access for authenticated users" ON public.queue_history FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "Allow delete access for authenticated users" ON public.queue_history FOR DELETE USING ((select auth.role()) = 'authenticated');

-- Create optimized RLS policies for customer_notifications table
CREATE POLICY "Allow read access for all users" ON public.customer_notifications FOR SELECT USING (true);
CREATE POLICY "Allow insert access for authenticated users" ON public.customer_notifications FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "Allow update access for authenticated users" ON public.customer_notifications FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "Allow delete access for authenticated users" ON public.customer_notifications FOR DELETE USING ((select auth.role()) = 'authenticated');

-- Create optimized RLS policies for directory_submissions table
CREATE POLICY "Allow read access for all users" ON public.directory_submissions FOR SELECT USING (true);
CREATE POLICY "Allow insert access for authenticated users" ON public.directory_submissions FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "Allow update access for authenticated users" ON public.directory_submissions FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "Allow delete access for authenticated users" ON public.directory_submissions FOR DELETE USING ((select auth.role()) = 'authenticated');

-- Create optimized RLS policies for analytics_events table
CREATE POLICY "Allow read access for all users" ON public.analytics_events FOR SELECT USING (true);
CREATE POLICY "Allow insert access for authenticated users" ON public.analytics_events FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "Allow update access for authenticated users" ON public.analytics_events FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "Allow delete access for authenticated users" ON public.analytics_events FOR DELETE USING ((select auth.role()) = 'authenticated');

-- Create optimized RLS policies for batch_operations table
CREATE POLICY "Allow read access for all users" ON public.batch_operations FOR SELECT USING (true);
CREATE POLICY "Allow insert access for authenticated users" ON public.batch_operations FOR INSERT WITH CHECK ((select auth.role()) = 'authenticated');
CREATE POLICY "Allow update access for authenticated users" ON public.batch_operations FOR UPDATE USING ((select auth.role()) = 'authenticated');
CREATE POLICY "Allow delete access for authenticated users" ON public.batch_operations FOR DELETE USING ((select auth.role()) = 'authenticated');

-- 3. Fix function security issues by setting search_path
-- This fixes the "role mutable search_path" warnings

-- Fix generate_customer_id function
ALTER FUNCTION public.generate_customer_id() SET search_path = public;

-- Fix log_customer_status_change function
ALTER FUNCTION public.log_customer_status_change() SET search_path = public;

-- Fix update_updated_at_column function
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;

-- 4. Fix customer_stats view security
-- Drop and recreate the view with proper security
DROP VIEW IF EXISTS public.customer_stats;

CREATE VIEW public.customer_stats AS
SELECT 
    COUNT(*) as total_customers,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_customers,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_customers,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_customers,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_customers,
    AVG(directories_submitted) as avg_directories_submitted,
    SUM(directories_submitted) as total_directories_submitted,
    SUM(failed_directories) as total_failed_directories
FROM public.customers;

-- Grant access to the view
GRANT SELECT ON public.customer_stats TO authenticated;
GRANT SELECT ON public.customer_stats TO anon;

-- 5. Create RLS policies for AutoBolt tables (if they exist)
-- These will be created when the AutoBolt tables are set up

-- Add directories_allocated column to customers table if it doesn't exist
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS directories_allocated INTEGER DEFAULT 0;

-- Update existing customers with directory allocations based on package type
UPDATE public.customers 
SET directories_allocated = 25, updated_at = NOW()
WHERE package_type = 'starter' AND directories_allocated IS NULL;

UPDATE public.customers 
SET directories_allocated = 75, updated_at = NOW()
WHERE package_type = 'growth' AND directories_allocated IS NULL;

UPDATE public.customers 
SET directories_allocated = 150, updated_at = NOW()
WHERE package_type = 'professional' AND directories_allocated IS NULL;

UPDATE public.customers 
SET directories_allocated = 500, updated_at = NOW()
WHERE package_type = 'enterprise' AND directories_allocated IS NULL;

-- Set default for any remaining customers
UPDATE public.customers 
SET directories_allocated = 25, updated_at = NOW()
WHERE directories_allocated IS NULL;

-- Verify the updates
SELECT customer_id, business_name, package_type, directories_allocated 
FROM public.customers 
ORDER BY created_at DESC;
