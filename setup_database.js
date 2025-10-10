#!/usr/bin/env node

/**
 * DirectoryBolt Database Setup Script
 *
 * This script helps set up the required database tables for DirectoryBolt to function properly.
 *
 * Usage:
 * 1. Copy the contents of database_schema.sql
 * 2. Run it in your Supabase SQL Editor
 * 3. Or use this script to validate your setup
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 DirectoryBolt Database Setup Helper');
console.log('=====================================');

try {
  // Check if database schema file exists
  const schemaPath = path.join(__dirname, 'database_schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log('✅ Database schema file found');
    console.log(`📄 Schema file size: ${schema.length} characters`);

    // Count expected tables
    const tableMatches = schema.match(/CREATE TABLE IF NOT EXISTS (\w+)/g) || [];
    console.log(`📋 Expected tables: ${tableMatches.map(m => m.split(' ')[4]).join(', ')}`);

    console.log('\n📋 Next Steps:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the contents of database_schema.sql');
    console.log('4. Run the SQL script');
    console.log('5. Verify tables are created in Table Editor');

  } else {
    console.log('❌ Database schema file not found');
    console.log('Expected location:', schemaPath);
  }

} catch (error) {
  console.error('❌ Error reading database schema:', error.message);
}

console.log('\n🔧 Environment Variables to Verify:');
console.log('- SUPABASE_URL');
console.log('- SUPABASE_SERVICE_ROLE_KEY');
console.log('- NEXT_PUBLIC_SUPABASE_URL');
console.log('- AUTOBOLT_API_KEY');
console.log('- WORKER_AUTH_TOKEN');

console.log('\n🎯 Expected Database Tables:');
console.log('- customers (customer data)');
console.log('- jobs (job queue management)');
console.log('- job_results (individual directory submission results)');
console.log('- autobolt_submission_logs (submission activity logs)');
console.log('- directory_overrides (directory configuration overrides)');
console.log('- directory_submissions (legacy compatibility)');

console.log('\n✨ After Setup:');
console.log('- Directory Settings should load without errors');
console.log('- Submission Activity should show logs');
console.log('- Manual / 2FA Queue should fetch data');
console.log('- AutoBolt Monitor should show real queue status');
console.log('- Delete customer buttons should work');
console.log('- Create test customer should function properly');

console.log('\n🔍 Troubleshooting:');
console.log('If you still see errors after running the schema:');
console.log('1. Check Supabase logs for detailed error messages');
console.log('2. Verify RLS policies aren\'t blocking queries');
console.log('3. Confirm environment variables are correctly set');
console.log('4. Check if the service role key has expired');