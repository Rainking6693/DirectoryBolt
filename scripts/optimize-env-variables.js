#!/usr/bin/env node

/**
 * Environment Variables Optimization Script
 * Fixes Netlify 4KB environment variable limit by optimizing large variables
 */

const fs = require('fs')
const path = require('path')

function calculateEnvSize(envContent) {
  const lines = envContent.split('\n')
  let totalSize = 0
  const variables = {}
  
  for (const line of lines) {
    if (line.trim() && !line.startsWith('#') && line.includes('=')) {
      const [key, ...valueParts] = line.split('=')
      const value = valueParts.join('=')
      const size = key.length + value.length + 1 // +1 for the = sign
      variables[key.trim()] = {
        value: value.trim(),
        size: size,
        line: line
      }
      totalSize += size
    }
  }
  
  return { totalSize, variables }
}

function optimizeGooglePrivateKey(privateKey) {
  // Remove quotes and normalize line breaks
  let optimized = privateKey.replace(/^[\"']|[\"']$/g, '') // Remove surrounding quotes
  optimized = optimized.replace(/\\\\n/g, '\\n') // Fix double-escaped newlines
  optimized = optimized.replace(/\\n/g, '\n') // Convert to actual newlines
  
  // Remove extra whitespace and normalize
  const lines = optimized.split('\n').map(line => line.trim()).filter(line => line)
  optimized = lines.join('\n')
  
  // Re-escape for environment variable
  optimized = optimized.replace(/\n/g, '\\n')
  
  return `\"${optimized}\"`
}

function createOptimizedEnv() {
  console.log('🔧 Optimizing environment variables for Netlify 4KB limit...')
  
  const envLocalPath = path.join(process.cwd(), '.env.local')
  const envProductionPath = path.join(process.cwd(), '.env.production')
  
  if (!fs.existsSync(envLocalPath)) {\n    console.error('❌ .env.local not found!')\n    process.exit(1)\n  }\n  \n  const envContent = fs.readFileSync(envLocalPath, 'utf8')\n  const { totalSize, variables } = calculateEnvSize(envContent)\n  \n  console.log(`📊 Current environment variables size: ${totalSize} bytes`)\n  \n  if (totalSize <= 4096) {\n    console.log('✅ Environment variables are within 4KB limit')\n    return\n  }\n  \n  console.log('⚠️  Environment variables exceed 4KB limit, optimizing...')\n  \n  // Find largest variables\n  const sortedVars = Object.entries(variables).sort((a, b) => b[1].size - a[1].size)\n  \n  console.log('\\n📋 Largest environment variables:')\n  sortedVars.slice(0, 10).forEach(([key, data]) => {\n    console.log(`   ${key}: ${data.size} bytes`)\n  })\n  \n  // Optimize large variables\n  let optimizedContent = envContent\n  let optimizedSize = totalSize\n  \n  // Optimize GOOGLE_PRIVATE_KEY if it exists\n  if (variables.GOOGLE_PRIVATE_KEY) {\n    console.log('\\n🔑 Optimizing GOOGLE_PRIVATE_KEY...')\n    const originalSize = variables.GOOGLE_PRIVATE_KEY.size\n    const optimizedKey = optimizeGooglePrivateKey(variables.GOOGLE_PRIVATE_KEY.value)\n    const newSize = 'GOOGLE_PRIVATE_KEY'.length + optimizedKey.length + 1\n    \n    optimizedContent = optimizedContent.replace(\n      variables.GOOGLE_PRIVATE_KEY.line,\n      `GOOGLE_PRIVATE_KEY=${optimizedKey}`\n    )\n    \n    optimizedSize = optimizedSize - originalSize + newSize\n    console.log(`   Reduced from ${originalSize} to ${newSize} bytes (saved ${originalSize - newSize} bytes)`)\n  }\n  \n  // Remove non-essential variables for production\n  const nonEssentialVars = [\n    'PUPPETEER_EXECUTABLE_PATH',\n    'DEBUG',\n    'LOG_LEVEL',\n    'VERBOSE',\n    'CI',\n    'GITHUB_SHA',\n    'GITHUB_RUN_NUMBER',\n    'TEST_BASE_URL',\n    'REAL_REQUESTS',\n    'TEST_TIMEOUT',\n    'SAVE_RESULTS',\n    'INTERACTIVE',\n    'OUTPUT_FILE',\n    'OUTPUT_DIR',\n    'RUN_EXTERNAL',\n    'PARALLEL',\n    'TIMEOUT',\n    'MONITOR_INTERVAL',\n    'ALERT_THRESHOLD',\n    'WEBSOCKET_URL',\n    'TRACKING_DASHBOARD_URL',\n    'TRACKING_API_TOKEN'\n  ]\n  \n  console.log('\\n🗑️  Removing non-essential variables for production...')\n  for (const varName of nonEssentialVars) {\n    if (variables[varName]) {\n      const regex = new RegExp(`^${varName}=.*$`, 'm')\n      optimizedContent = optimizedContent.replace(regex, '')\n      optimizedSize -= variables[varName].size\n      console.log(`   Removed ${varName} (${variables[varName].size} bytes)`)\n    }\n  }\n  \n  // Clean up empty lines\n  optimizedContent = optimizedContent.replace(/\\n\\s*\\n/g, '\\n').trim()\n  \n  // Recalculate final size\n  const { totalSize: finalSize } = calculateEnvSize(optimizedContent)\n  \n  console.log(`\\n📊 Optimized size: ${finalSize} bytes`)\n  \n  if (finalSize <= 4096) {\n    console.log('✅ Environment variables now within 4KB limit!')\n    \n    // Write optimized production environment\n    fs.writeFileSync(envProductionPath, optimizedContent)\n    console.log(`📄 Created optimized .env.production (${finalSize} bytes)`)\n    \n    return true\n  } else {\n    console.log('❌ Still exceeds 4KB limit after optimization')\n    console.log('   Consider moving large secrets to Netlify environment variables')\n    return false\n  }\n}\n\nfunction createNetlifyEnvInstructions() {\n  const instructions = `\n# NETLIFY ENVIRONMENT VARIABLES SETUP INSTRUCTIONS\n# =============================================================================\n# Due to 4KB limit, set these large variables directly in Netlify Dashboard:\n# https://app.netlify.com/sites/[your-site]/settings/env\n# =============================================================================\n\n# GOOGLE SHEETS CONFIGURATION\n# Set these in Netlify Dashboard > Site settings > Environment variables:\nGOOGLE_PRIVATE_KEY=[paste the full private key here]\nGOOGLE_SERVICE_ACCOUNT_EMAIL=directorybolt-service-58@directorybolt.iam.gserviceaccount.com\nGOOGLE_SHEET_ID=1Cc9Ha5MXt_PAFncIz5HN4_BlAHy3egK1OmjBjj7BN0A\n\n# STRIPE CONFIGURATION\nSTRIPE_SECRET_KEY=[your stripe secret key]\nSTRIPE_WEBHOOK_SECRET=[your webhook secret]\nNEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=[your publishable key]\n\n# SUPABASE CONFIGURATION\nNEXT_PUBLIC_SUPABASE_URL=https://kolgqfjgndwdziqgloz.supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=[your anon key]\nSUPABASE_SERVICE_KEY=[your service key]\n\n# OPENAI CONFIGURATION\nOPENAI_API_KEY=[your openai key]\n\n# ADMIN AUTHENTICATION\nADMIN_API_KEY=DirectoryBolt-Admin-2025-SecureKey\nADMIN_USERNAME=admin\nADMIN_PASSWORD=DirectoryBolt2025!\n\n# STAFF AUTHENTICATION\nSTAFF_API_KEY=DirectoryBolt-Staff-2025-SecureKey\nSTAFF_USERNAME=staff\nSTAFF_PASSWORD=DirectoryBoltStaff2025!\n\n# =============================================================================\n# INSTRUCTIONS:\n# 1. Go to Netlify Dashboard\n# 2. Select your site\n# 3. Go to Site settings > Environment variables\n# 4. Add each variable above with the actual values\n# 5. Deploy your site\n# =============================================================================\n`\n  \n  fs.writeFileSync(path.join(process.cwd(), 'NETLIFY_ENV_SETUP.md'), instructions)\n  console.log('📋 Created NETLIFY_ENV_SETUP.md with setup instructions')\n}\n\n// Run optimization if called directly\nif (require.main === module) {\n  const success = createOptimizedEnv()\n  createNetlifyEnvInstructions()\n  \n  if (success) {\n    console.log('\\n🎉 Environment optimization completed successfully!')\n    console.log('📋 Next steps:')\n    console.log('   1. Use .env.production for Netlify deployment')\n    console.log('   2. Set large variables directly in Netlify Dashboard')\n    console.log('   3. Follow instructions in NETLIFY_ENV_SETUP.md')\n    process.exit(0)\n  } else {\n    console.log('\\n❌ Environment optimization failed')\n    console.log('   Manual intervention required for Netlify deployment')\n    process.exit(1)\n  }\n}\n\nmodule.exports = { calculateEnvSize, optimizeGooglePrivateKey, createOptimizedEnv }"