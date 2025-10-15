#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Copying environment variables from main .env.local...\n');

// Read main .env.local
const mainEnvPath = path.join(__dirname, '../../.env.local');
const geminiEnvPath = path.join(__dirname, '.env');

if (!fs.existsSync(mainEnvPath)) {
  console.error('❌ Main .env.local file not found at:', mainEnvPath);
  console.log('\n📝 Please create .env file manually with:');
  console.log('   - GEMINI_API_KEY (get from https://aistudio.google.com/apikey)');
  console.log('   - WORKER_AUTH_TOKEN (from your main .env.local)');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY (from your main .env.local)');
  process.exit(1);
}

// Read main .env.local
const mainEnv = fs.readFileSync(mainEnvPath, 'utf8');

// Extract needed variables
const extractVar = (name) => {
  const regex = new RegExp(`^${name}=(.*)$`, 'm');
  const match = mainEnv.match(regex);
  return match ? match[1].trim() : '';
};

const workerAuthToken = extractVar('WORKER_AUTH_TOKEN') || extractVar('AUTOBOLT_API_KEY');
const supabaseServiceRoleKey = extractVar('SUPABASE_SERVICE_ROLE_KEY');
const supabaseUrl = extractVar('NEXT_PUBLIC_SUPABASE_URL');

// Create .env content
const envContent = `# Gemini API Configuration
# Get your API key from: https://aistudio.google.com/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# DirectoryBolt API Configuration (copied from main .env.local)
NETLIFY_FUNCTIONS_URL=http://localhost:3000/api
AUTOBOLT_API_BASE=http://localhost:3000/api
WORKER_AUTH_TOKEN=${workerAuthToken}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceRoleKey}
WORKER_ID=gemini-worker-001

# Optional: Screenshot storage
SUPABASE_URL=${supabaseUrl}
`;

// Write .env file
fs.writeFileSync(geminiEnvPath, envContent);

console.log('✅ Environment variables copied!\n');
console.log('📋 Copied from main .env.local:');
console.log('   ✅ WORKER_AUTH_TOKEN');
console.log('   ✅ SUPABASE_SERVICE_ROLE_KEY');
console.log('   ✅ SUPABASE_URL');

console.log('\n⚠️  IMPORTANT: You still need to add GEMINI_API_KEY!\n');
console.log('📝 Steps:');
console.log('   1. Go to: https://aistudio.google.com/apikey');
console.log('   2. Create an API key');
console.log('   3. Edit .env file and replace "your_gemini_api_key_here" with your actual key');
console.log('\n💡 Run this command to edit .env:');
console.log('   notepad .env');

