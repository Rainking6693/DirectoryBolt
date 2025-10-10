#!/usr/bin/env node

/**
 * Install Dependencies Script
 * Ensures all required dependencies are installed for the DirectoryBolt Worker
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📦 Installing DirectoryBolt Worker Dependencies');
console.log('===============================================');

try {
  // Check if we're in the worker directory
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    console.error('❌ package.json not found. Make sure you\'re in the worker directory.');
    process.exit(1);
  }

  // Install dependencies
  console.log('Installing npm dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Install Playwright browsers
  console.log('\nInstalling Playwright browsers...');
  execSync('npx playwright install chromium', { stdio: 'inherit' });

  console.log('\n✅ All dependencies installed successfully!');
  console.log('\nNext steps:');
  console.log('1. Run validation test: node comprehensive-validation-test.js');
  console.log('2. Run worker tests: npm test');
  console.log('3. Start worker: npm start');

} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}