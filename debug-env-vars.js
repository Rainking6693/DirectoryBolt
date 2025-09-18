#!/usr/bin/env node

/**
 * DEBUG: Check environment variables
 */

require('dotenv').config({ path: '.env.local' });

console.log('🔍 DEBUGGING ENVIRONMENT VARIABLES');
console.log('=' .repeat(50));

console.log('\nSupabase Configuration:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');

if (process.env.SUPABASE_SERVICE_KEY) {
  console.log('SUPABASE_SERVICE_KEY starts with:', process.env.SUPABASE_SERVICE_KEY.substring(0, 20) + '...');
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('SUPABASE_SERVICE_ROLE_KEY starts with:', process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...');
}

console.log('\nAll Supabase-related env vars:');
Object.keys(process.env).filter(key => key.includes('SUPABASE')).forEach(key => {
  console.log(`${key}: ${process.env[key] ? 'SET' : 'NOT SET'}`);
});