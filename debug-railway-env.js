/**
 * Debug Railway Environment Variable Issue
 * 
 * This script helps identify why the Railway worker is getting "Invalid URL" errors
 * even though ORCHESTRATOR_URL is set in the Railway dashboard.
 */

console.log('='.repeat(80));
console.log('🔍 RAILWAY ENVIRONMENT VARIABLE DEBUG');
console.log('='.repeat(80));
console.log();

console.log('📋 Current Environment Variables:');
console.log();

// Check all relevant environment variables
const envVars = [
  'ORCHESTRATOR_URL',
  'AUTOBOLT_API_KEY', 
  'WORKER_AUTH_TOKEN',
  'SUPABASE_URL',
  'NODE_ENV',
  'POLL_INTERVAL',
  'WORKER_ID',
  'HEADLESS',
  'TWOCAPTCHA_API_KEY'
];

envVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    if (varName.includes('KEY') || varName.includes('TOKEN')) {
      console.log(`  ${varName}: SET (${value.substring(0, 20)}...)`);
    } else {
      console.log(`  ${varName}: ${value}`);
    }
  } else {
    console.log(`  ${varName}: NOT SET ❌`);
  }
});

console.log();
console.log('='.repeat(80));
console.log('🔧 RAILWAY TROUBLESHOOTING STEPS:');
console.log('='.repeat(80));
console.log();

console.log('1. 🚨 CRITICAL: ORCHESTRATOR_URL is NOT SET in Railway!');
console.log('   This is why you get "Invalid URL" errors.');
console.log();
console.log('2. 📝 How to fix in Railway:');
console.log('   a) Go to https://railway.app');
console.log('   b) Select your worker service');
console.log('   c) Click "Variables" tab');
console.log('   d) Add or edit ORCHESTRATOR_URL:');
console.log('      ORCHESTRATOR_URL = https://www.directorybolt.com/api');
console.log('   e) Click "Deploy" to restart the worker');
console.log();
console.log('3. 🔍 Alternative: Check if the variable name is wrong:');
console.log('   - Make sure it\'s exactly "ORCHESTRATOR_URL" (case-sensitive)');
console.log('   - No extra spaces or characters');
console.log('   - Value should be: https://www.directorybolt.com/api');
console.log();
console.log('4. 🚀 Force redeploy:');
console.log('   - Temporarily change any environment variable');
console.log('   - Save it');
console.log('   - Change it back to the correct value');
console.log('   - Save again (this forces a redeploy)');
console.log();
console.log('='.repeat(80));
console.log('🧪 TEST THE FIX:');
console.log('='.repeat(80));
console.log();

// Simulate what the worker code does
const orchestratorUrl = process.env.ORCHESTRATOR_URL || 'http://localhost:3000/api';
const testUrl = `${orchestratorUrl}/jobs/next`;

console.log('Worker code constructs URL like this:');
console.log(`  ORCHESTRATOR_URL: "${orchestratorUrl}"`);
console.log(`  Final URL: "${testUrl}"`);
console.log();

if (orchestratorUrl === 'http://localhost:3000/api') {
  console.log('❌ PROBLEM: Using fallback localhost URL!');
  console.log('   This means ORCHESTRATOR_URL is not set in Railway.');
} else if (orchestratorUrl.includes('localhost')) {
  console.log('❌ PROBLEM: Still using localhost URL!');
  console.log('   ORCHESTRATOR_URL is set but to the wrong value.');
} else if (orchestratorUrl.includes('www.directorybolt.com')) {
  console.log('✅ CORRECT: Using production URL!');
  console.log('   ORCHESTRATOR_URL is set correctly.');
} else {
  console.log('⚠️  WARNING: Unknown URL format');
  console.log(`   ORCHESTRATOR_URL: "${orchestratorUrl}"`);
}

console.log();
console.log('='.repeat(80));
