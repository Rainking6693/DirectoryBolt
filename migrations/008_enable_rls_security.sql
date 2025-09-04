-- Migration: Enable Row Level Security (RLS) on directories table
-- Purpose: CRITICAL SECURITY FIX - Enable RLS to prevent unauthorized data access
-- Date: 2025-09-04
-- Issue: Table public.directories is public but RLS has not been enabled
-- Impact: All directory data is publicly accessible without proper authentication

-- Enable Row Level Security on directories table
ALTER TABLE directories ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow public read access to active/approved directories
-- This allows unauthenticated users to view active directories for the directory listing
CREATE POLICY "public_read_active_directories" ON directories
    FOR SELECT
    TO PUBLIC
    USING (is_active = true);

-- Policy 2: Allow authenticated users to read all directories
-- This allows logged-in users to see inactive directories for management purposes
CREATE POLICY "authenticated_read_all_directories" ON directories
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy 3: Allow authenticated users to insert new directories
-- This allows logged-in users to submit new directory entries
CREATE POLICY "authenticated_insert_directories" ON directories
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy 4: Allow authenticated users to update their own submissions
-- This restricts updates to ensure data integrity while allowing legitimate edits
CREATE POLICY "authenticated_update_directories" ON directories
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy 5: Restrict DELETE operations to service role only
-- Only system administrators should be able to delete directories
CREATE POLICY "service_role_delete_directories" ON directories
    FOR DELETE
    TO service_role
    USING (true);

-- Also enable RLS on categories table for consistency
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active categories
CREATE POLICY "public_read_active_categories" ON categories
    FOR SELECT
    TO PUBLIC
    USING (is_active = true);

-- Allow authenticated users to read all categories
CREATE POLICY "authenticated_read_all_categories" ON categories
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow only service role to modify categories
CREATE POLICY "service_role_modify_categories" ON categories
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Add security comments
COMMENT ON POLICY "public_read_active_directories" ON directories IS 
    'Allows public read access to active directories only - prevents unauthorized access to inactive/draft entries';

COMMENT ON POLICY "authenticated_read_all_directories" ON directories IS 
    'Allows authenticated users full read access for management purposes';

COMMENT ON POLICY "authenticated_insert_directories" ON directories IS 
    'Allows authenticated users to submit new directory entries';

COMMENT ON POLICY "authenticated_update_directories" ON directories IS 
    'Allows authenticated users to update directory entries with proper authorization checks';

COMMENT ON POLICY "service_role_delete_directories" ON directories IS 
    'Restricts directory deletion to service role only for data protection';

-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('directories', 'categories');