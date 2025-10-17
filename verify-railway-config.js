/**
 * Verify Railway Worker Configuration
 * 
 * This script checks if the Railway worker environment variables are set correctly.
 */

// Expected Railway environment variables
const EXPECTED_CONFIG = {
  ORCHESTRATOR_URL: 'https://www.directorybolt.com/api',
  AUTOBOLT_API_KEY: '718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622',
  SUPABASE_URL: 'https://kolgqfjgncdwddziqloz.supabase.co',
  NODE_ENV: 'production',
  POLL_INTERVAL: '5000',
  WORKER_ID: 'railway-worker-1',
  HEADLESS: 'true',
  TWOCAPTCHA_API_KEY: '49c0890fbd8c1506c04b58e5352cf2f'
}

console.log('='.repeat(80))
console.log('🔍 RAILWAY WORKER CONFIGURATION CHECK')
console.log('='.repeat(80))
console.log()

console.log('📋 Expected Railway Environment Variables:')
console.log()
Object.entries(EXPECTED_CONFIG).forEach(([key, value]) => {
  const displayValue = key.includes('KEY') || key.includes('SECRET') 
    ? value.substring(0, 20) + '...' 
    : value
  console.log(`  ${key}=${displayValue}`)
})

console.log()
console.log('='.repeat(80))
console.log('🔧 HOW TO FIX IN RAILWAY:')
console.log('='.repeat(80))
console.log()
console.log('1. Go to https://railway.app')
console.log('2. Select your DirectoryBolt worker service')
console.log('3. Click "Variables" tab')
console.log('4. Verify or set these variables:')
console.log()
console.log('   ORCHESTRATOR_URL = https://www.directorybolt.com/api')
console.log('   (This is the most critical one!)')
console.log()
console.log('5. Click "Deploy" to restart the worker')
console.log()
console.log('='.repeat(80))
console.log('🧪 TEST THE WORKER URL:')
console.log('='.repeat(80))
console.log()

const testUrl = `${EXPECTED_CONFIG.ORCHESTRATOR_URL}/jobs/next`
console.log(`The worker should call: ${testUrl}`)
console.log()
console.log('Test this endpoint:')
console.log(`  curl -X GET "${testUrl}" \\`)
console.log(`    -H "Authorization: Bearer ${EXPECTED_CONFIG.AUTOBOLT_API_KEY.substring(0, 20)}..." \\`)
console.log(`    -H "X-Worker-ID: ${EXPECTED_CONFIG.WORKER_ID}"`)
console.log()

console.log('='.repeat(80))
console.log('⚠️  CURRENT ERROR ANALYSIS:')
console.log('='.repeat(80))
console.log()
console.log('Error: "Invalid URL"')
console.log('Cause: ORCHESTRATOR_URL is empty, undefined, or malformed')
console.log()
console.log('The worker is trying to call: "/api/jobs/next"')
console.log('But it should call: "https://www.directorybolt.com/api/jobs/next"')
console.log()
console.log('This means ORCHESTRATOR_URL is NOT set correctly in Railway!')
console.log()
console.log('='.repeat(80))

