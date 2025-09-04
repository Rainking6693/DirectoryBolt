-- Migration: Fix Function Security Vulnerability
-- Purpose: CRITICAL SECURITY FIX - Set secure search_path for update_updated_at_column function
-- Date: 2025-09-04
-- Issue: Function update_updated_at_column has a mutable search_path
-- Impact: Vulnerable to schema injection attacks

-- Drop and recreate the function with secure settings
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Recreate function with secure, immutable search_path
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Explicitly set the search_path to prevent injection attacks
    -- Using only pg_catalog and public schemas
    SET LOCAL search_path = pg_catalog, public;
    
    -- Update the updated_at column with current timestamp
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql 
   SECURITY DEFINER
   SET search_path = pg_catalog, public;

-- Add security comment explaining the fix
COMMENT ON FUNCTION update_updated_at_column() IS 
    'Trigger function to update updated_at column. SECURITY: Uses fixed search_path to prevent schema injection attacks. SECURITY DEFINER ensures consistent execution context.';

-- Verify the function has the correct security settings
SELECT 
    proname as function_name,
    proconfig as function_config,
    prosecdef as security_definer
FROM pg_proc 
WHERE proname = 'update_updated_at_column';

-- Also create a more secure version for future use that's even more restrictive
CREATE OR REPLACE FUNCTION secure_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- Ultra-secure version with minimal search_path
    SET LOCAL search_path = pg_catalog;
    
    -- Use fully qualified function calls for maximum security
    NEW.updated_at = pg_catalog.now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql 
   SECURITY DEFINER
   SET search_path = pg_catalog;

COMMENT ON FUNCTION secure_update_timestamp() IS 
    'Ultra-secure timestamp update function with minimal search_path for maximum security';

-- Note: The existing triggers will continue to use update_updated_at_column()
-- but the function is now secured. Future triggers should consider using secure_update_timestamp()