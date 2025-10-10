#!/usr/bin/env node

/**
 * Alex Quick Fix Script
 * Automated fixes for critical worker issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Alex Quick Fix Script for DirectoryBolt Worker');
console.log('=================================================');
console.log('');

try {
  // Fix 1: Install missing dependencies
  console.log('📦 Step 1: Installing missing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✅ Dependencies installed successfully');
  } catch (error) {
    console.log('❌ Failed to install dependencies:', error.message);
  }
  console.log('');

  // Fix 2: Check Supabase key format
  console.log('🔑 Step 2: Checking Supabase configuration...');
  require('dotenv').config();
  
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseKey) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env');
  } else if (supabaseKey.length < 100) {
    console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY appears to be incomplete');
    console.log(`   Current length: ${supabaseKey.length} characters`);
    console.log('   Expected: 150+ characters for a complete JWT token');
    console.log('');
    console.log('🔧 ACTION REQUIRED:');
    console.log('1. Go to https://supabase.com/dashboard');
    console.log('2. Select DirectoryBolt project');
    console.log('3. Go to Settings > API');
    console.log('4. Copy the complete service_role key (not anon key)');
    console.log('5. Update SUPABASE_SERVICE_ROLE_KEY in worker/.env');
  } else {
    console.log('✅ Supabase key format looks correct');
  }
  console.log('');

  // Fix 3: Test connection after fixes
  console.log('🧪 Step 3: Testing connections...');
  try {
    execSync('node quick-connection-test.js', { stdio: 'inherit' });
  } catch (error) {
    console.log('⚠️  Connection test completed with issues');
  }
  console.log('');

  console.log('🎯 Quick Fix Summary:');
  console.log('====================');
  console.log('✅ Dependencies installation attempted');
  console.log('✅ Supabase configuration checked');
  console.log('✅ Connection test executed');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. If Supabase key needs updating, get complete key from dashboard');
  console.log('2. Run: node comprehensive-validation-test.js');
  console.log('3. Ensure all tests pass before Cora/Hudson audit');
  console.log('');
  console.log('🚀 Ready for Cora and Hudson audit once all tests pass!');

} catch (error) {
  console.error('❌ Quick fix script failed:', error.message);
  process.exit(1);
}