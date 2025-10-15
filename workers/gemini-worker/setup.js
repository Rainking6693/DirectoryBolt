#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Setting up Gemini Computer Use Directory Submitter...\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  fs.copyFileSync(path.join(__dirname, 'env.example'), envPath);
  console.log('✅ .env file created. Please edit it with your API keys.\n');
} else {
  console.log('✅ .env file already exists.\n');
}

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed.\n');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Install Playwright browsers
console.log('🌐 Installing Playwright browsers...');
try {
  execSync('npx playwright install chromium', { stdio: 'inherit' });
  console.log('✅ Playwright browsers installed.\n');
} catch (error) {
  console.error('❌ Failed to install Playwright browsers:', error.message);
  process.exit(1);
}

// Check environment variables
console.log('🔍 Checking environment configuration...');
require('dotenv').config();

const requiredVars = ['GEMINI_API_KEY', 'WORKER_AUTH_TOKEN'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.log('⚠️  Missing required environment variables:');
  missingVars.forEach(varName => console.log(`   - ${varName}`));
  console.log('\n📝 Please edit the .env file and add these variables.\n');
} else {
  console.log('✅ All required environment variables are set.\n');
}

console.log('🎉 Setup complete!');
console.log('\n📋 Next steps:');
console.log('1. Edit .env file with your API keys');
console.log('2. Run "npm test" to test the worker');
console.log('3. Run "npm start" to start processing jobs');
console.log('\n🚀 Ready to revolutionize directory submissions with AI!');
