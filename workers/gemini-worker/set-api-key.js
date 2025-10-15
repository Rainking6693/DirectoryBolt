#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const envPath = path.join(__dirname, '.env');

console.log('🔑 Gemini API Key Setup\n');

// Check if .env exists
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found. Creating from template...\n');
  
  // Read main .env.local
  const mainEnvPath = path.join(__dirname, '../../.env.local');
  if (!fs.existsSync(mainEnvPath)) {
    console.error('❌ Main .env.local not found!');
    process.exit(1);
  }
  
  const mainEnv = fs.readFileSync(mainEnvPath, 'utf8');
  const extractVar = (name) => {
    const regex = new RegExp(`^${name}=(.*)$`, 'm');
    const match = mainEnv.match(regex);
    return match ? match[1].trim() : '';
  };

  const template = `# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# DirectoryBolt API Configuration
NETLIFY_FUNCTIONS_URL=http://localhost:3000/api
AUTOBOLT_API_BASE=http://localhost:3000/api
WORKER_AUTH_TOKEN=${extractVar('WORKER_AUTH_TOKEN') || extractVar('AUTOBOLT_API_KEY')}
SUPABASE_SERVICE_ROLE_KEY=${extractVar('SUPABASE_SERVICE_ROLE_KEY')}
WORKER_ID=gemini-worker-001

# Optional: Screenshot storage
SUPABASE_URL=${extractVar('NEXT_PUBLIC_SUPABASE_URL')}
`;
  
  fs.writeFileSync(envPath, template);
  console.log('✅ .env file created!\n');
}

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask for API key
rl.question('📝 Enter your Gemini API Key (from https://aistudio.google.com/apikey): ', (apiKey) => {
  apiKey = apiKey.trim();
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log('\n❌ Invalid API key provided.');
    console.log('Please get your API key from: https://aistudio.google.com/apikey');
    rl.close();
    process.exit(1);
  }
  
  // Read current .env
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Replace the API key
  envContent = envContent.replace(/GEMINI_API_KEY=.*/, `GEMINI_API_KEY=${apiKey}`);
  
  // Write back
  try {
    fs.writeFileSync(envPath, envContent, { encoding: 'utf8', flag: 'w' });
    
    console.log('\n✅ API key saved successfully!');
    console.log('📁 File location:', envPath);
    
    // Verify
    const verify = fs.readFileSync(envPath, 'utf8');
    const keyLine = verify.match(/GEMINI_API_KEY=.*/);
    console.log('🔍 Verified:', keyLine ? keyLine[0].substring(0, 30) + '...' : 'NOT FOUND');
    
    console.log('\n🎉 All set! You can now run:');
    console.log('   npm test');
    
  } catch (error) {
    console.error('\n❌ Error saving API key:', error.message);
    console.log('\n💡 Try running as administrator or check file permissions.');
  }
  
  rl.close();
});

