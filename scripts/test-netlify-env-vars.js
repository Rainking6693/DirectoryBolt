#!/usr/bin/env node

/**
 * CLIVE - Netlify Environment Variable Diagnostic Script
 * Tests environment variable access patterns that match Netlify Functions behavior
 */

const { createGoogleSheetsService } = require('../lib/services/google-sheets');

console.log('🔍 CLIVE - Netlify Environment Variable Diagnostic Test');
console.log('=========================================================');

// Test 1: Basic Environment Variable Access
function testBasicEnvAccess() {
  console.log('\n📋 Test 1: Basic Environment Variable Access');
  console.log('----------------------------------------------');
  
  const envVars = {
    'NODE_ENV': process.env.NODE_ENV,
    'NETLIFY': process.env.NETLIFY,
    'AWS_LAMBDA_FUNCTION_NAME': process.env.AWS_LAMBDA_FUNCTION_NAME,
    'BUILDING': process.env.BUILDING,
    'CONTEXT': process.env.CONTEXT,
    'BRANCH': process.env.BRANCH,
    'DEPLOY_ID': process.env.DEPLOY_ID
  };
  
  for (const [key, value] of Object.entries(envVars)) {
    console.log(`  ${key}: ${value || '(undefined)'}`);
  }
  
  return envVars;
}

// Test 2: Google Sheets Environment Variables
function testGoogleSheetsEnvVars() {
  console.log('\n🔑 Test 2: Google Sheets Environment Variables');
  console.log('-----------------------------------------------');
  
  const googleEnvVars = {
    'GOOGLE_SHEET_ID': {
      exists: !!process.env.GOOGLE_SHEET_ID,
      value: process.env.GOOGLE_SHEET_ID,
      length: (process.env.GOOGLE_SHEET_ID || '').length
    },
    'GOOGLE_SERVICE_ACCOUNT_EMAIL': {
      exists: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      value: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      length: (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '').length
    },
    'GOOGLE_PRIVATE_KEY': {
      exists: !!process.env.GOOGLE_PRIVATE_KEY,
      length: (process.env.GOOGLE_PRIVATE_KEY || '').length,
      startsWithBegin: (process.env.GOOGLE_PRIVATE_KEY || '').includes('-----BEGIN PRIVATE KEY-----'),
      endsWithEnd: (process.env.GOOGLE_PRIVATE_KEY || '').includes('-----END PRIVATE KEY-----'),
      hasNewlines: (process.env.GOOGLE_PRIVATE_KEY || '').includes('\n'),
      hasEscapedNewlines: (process.env.GOOGLE_PRIVATE_KEY || '').includes('\\n'),
      firstChars: (process.env.GOOGLE_PRIVATE_KEY || '').substring(0, 50),
      lastChars: (process.env.GOOGLE_PRIVATE_KEY || '').substring(-50)
    }
  };
  
  for (const [key, analysis] of Object.entries(googleEnvVars)) {
    console.log(`\n  ${key}:`);
    if (typeof analysis === 'object') {
      for (const [prop, value] of Object.entries(analysis)) {
        if (prop === 'value' && key === 'GOOGLE_PRIVATE_KEY') {
          console.log(`    ${prop}: [REDACTED for security]`);
        } else {
          console.log(`    ${prop}: ${value}`);
        }
      }
    } else {
      console.log(`    value: ${analysis}`);
    }
  }
  
  return googleEnvVars;
}

// Test 3: Google Sheets Service Initialization
async function testGoogleSheetsService() {
  console.log('\n🔧 Test 3: Google Sheets Service Initialization');
  console.log('------------------------------------------------');
  
  try {
    console.log('  Creating Google Sheets service...');
    const service = createGoogleSheetsService();
    
    console.log('  ✅ Service created successfully');
    console.log('  Attempting initialization...');
    
    await service.initialize();
    
    console.log('  ✅ Service initialized successfully');
    console.log(`  📋 Sheet Title: ${service.sheet?.title || 'Unknown'}`);
    console.log(`  📏 Sheet Rows: ${service.sheet?.rowCount || 0}`);
    
    return { success: true, service };
    
  } catch (error) {
    console.log('  ❌ Service initialization failed');
    console.log(`  Error: ${error.message}`);
    console.log(`  Error Type: ${error.constructor.name}`);
    
    if (error.stack) {
      console.log('  Stack trace (first 500 chars):');
      console.log(`    ${error.stack.substring(0, 500)}...`);
    }
    
    return { success: false, error };
  }
}

// Test 4: Health Check API Pattern
async function testHealthCheckPattern() {
  console.log('\n🏥 Test 4: Health Check API Pattern');
  console.log('-----------------------------------');
  
  try {
    const service = createGoogleSheetsService();
    const healthResult = await service.healthCheck();
    
    console.log(`  Health Check Result: ${healthResult}`);
    
    return { success: healthResult, healthResult };
    
  } catch (error) {
    console.log('  ❌ Health check failed');
    console.log(`  Error: ${error.message}`);
    
    return { success: false, error };
  }
}

// Test 5: Environment Variable Access Timing
function testEnvVarTiming() {
  console.log('\n⏱️  Test 5: Environment Variable Access Timing');
  console.log('----------------------------------------------');
  
  const iterations = 1000;
  const startTime = Date.now();
  
  for (let i = 0; i < iterations; i++) {
    const _ = process.env.GOOGLE_SHEET_ID;
  }
  
  const endTime = Date.now();
  const avgTime = (endTime - startTime) / iterations;
  
  console.log(`  Accessed env var ${iterations} times in ${endTime - startTime}ms`);
  console.log(`  Average access time: ${avgTime.toFixed(4)}ms`);
  
  return { avgTime, totalTime: endTime - startTime };
}

// Test 6: Process Environment Integrity
function testProcessEnvIntegrity() {
  console.log('\n🔍 Test 6: Process Environment Integrity');
  console.log('----------------------------------------');
  
  const envKeys = Object.keys(process.env);
  const googleEnvKeys = envKeys.filter(key => key.startsWith('GOOGLE_'));
  
  console.log(`  Total environment variables: ${envKeys.length}`);
  console.log(`  Google-related variables: ${googleEnvKeys.length}`);
  console.log(`  Google variables found: ${googleEnvKeys.join(', ')}`);
  
  // Test if process.env is modifiable
  const testKey = 'CLIVE_TEST_VAR';
  process.env[testKey] = 'test_value';
  const canModify = process.env[testKey] === 'test_value';
  delete process.env[testKey];
  
  console.log(`  Process.env modifiable: ${canModify}`);
  
  return { 
    totalEnvVars: envKeys.length, 
    googleEnvVars: googleEnvKeys.length,
    canModify 
  };
}

// Main Test Runner
async function runDiagnostics() {
  const startTime = Date.now();
  
  console.log(`🚀 Starting diagnostics at: ${new Date().toISOString()}`);
  console.log(`🖥️  Platform: ${process.platform}`);
  console.log(`🟢 Node Version: ${process.version}`);
  
  const results = {};
  
  try {
    results.basicEnv = testBasicEnvAccess();
    results.googleEnv = testGoogleSheetsEnvVars();
    results.envTiming = testEnvVarTiming();
    results.envIntegrity = testProcessEnvIntegrity();
    results.healthCheck = await testHealthCheckPattern();
    results.serviceInit = await testGoogleSheetsService();
    
  } catch (error) {
    console.log(`\n💥 Critical error during diagnostics: ${error.message}`);
    results.criticalError = error.message;
  }
  
  const endTime = Date.now();
  
  console.log('\n📊 DIAGNOSTIC SUMMARY');
  console.log('=====================');
  console.log(`  Total Runtime: ${endTime - startTime}ms`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'unknown'}`);
  console.log(`  Netlify Context: ${process.env.NETLIFY ? 'Yes' : 'No'}`);
  console.log(`  Lambda Context: ${process.env.AWS_LAMBDA_FUNCTION_NAME ? 'Yes' : 'No'}`);
  
  // Critical checks
  const hasGoogleVars = results.googleEnv?.GOOGLE_SHEET_ID?.exists && 
                       results.googleEnv?.GOOGLE_SERVICE_ACCOUNT_EMAIL?.exists && 
                       results.googleEnv?.GOOGLE_PRIVATE_KEY?.exists;
  
  console.log(`  ✅ Google Environment Variables: ${hasGoogleVars ? 'PRESENT' : 'MISSING'}`);
  console.log(`  ✅ Service Initialization: ${results.serviceInit?.success ? 'SUCCESS' : 'FAILED'}`);
  console.log(`  ✅ Health Check: ${results.healthCheck?.success ? 'PASSED' : 'FAILED'}`);
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS');
  console.log('==================');
  
  if (!hasGoogleVars) {
    console.log('  🔴 CRITICAL: Missing Google Sheets environment variables');
    console.log('      → Check Netlify Dashboard → Site Settings → Environment Variables');
    console.log('      → Ensure GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_PRIVATE_KEY are set');
  }
  
  if (!results.serviceInit?.success) {
    console.log('  🟡 WARNING: Google Sheets service initialization failed');
    console.log('      → Check private key format and permissions');
    console.log('      → Verify service account has access to the sheet');
  }
  
  if (!results.healthCheck?.success) {
    console.log('  🟡 WARNING: Health check failed');
    console.log('      → This may indicate authentication or connectivity issues');
  }
  
  // Environment-specific advice
  if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    console.log('  ℹ️  INFO: Running in serverless environment');
    console.log('      → Environment variables should be available at runtime');
    console.log('      → Check Netlify Function logs for deployment issues');
  } else {
    console.log('  ℹ️  INFO: Running in local environment');
    console.log('      → Create .env.local file with required variables');
    console.log('      → Test with npm run dev before deploying');
  }
  
  console.log('\n🔍 CLIVE Diagnostic Complete');
  console.log('============================');
  
  return results;
}

// Run diagnostics if called directly
if (require.main === module) {
  runDiagnostics().catch(console.error);
}

module.exports = { runDiagnostics };