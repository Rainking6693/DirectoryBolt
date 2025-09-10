#!/usr/bin/env node

/**
 * DirectoryBolt Server Error Diagnostic Tool
 * Systematically tests all components to identify the root cause
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 DirectoryBolt Server Error Diagnostic Tool');
console.log('=' .repeat(60));

const results = {
  environment: {},
  services: {},
  apis: {},
  build: {},
  recommendations: []
};

// Helper function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Helper function to safely read environment variables
function checkEnvVar(varName, required = false) {
  const value = process.env[varName];
  const exists = !!value && value !== 'your_' + varName.toLowerCase() + '_here' && !value.includes('placeholder');
  
  if (required && !exists) {
    results.recommendations.push(`🔴 CRITICAL: Set ${varName} in .env.local`);
  } else if (!exists) {
    results.recommendations.push(`🟡 OPTIONAL: Set ${varName} in .env.local`);
  }
  
  return { exists, hasValue: !!value };
}

// Helper function to test HTTP endpoint
async function testEndpoint(url, description) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return {
      success: response.ok,
      status: response.status,
      data: data,
      error: response.ok ? null : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
}

// 1. Environment Variables Check
console.log('\n📋 1. ENVIRONMENT VARIABLES CHECK');
console.log('-'.repeat(40));

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Critical environment variables
const criticalEnvVars = [
  'STRIPE_SECRET_KEY',
  'OPENAI_API_KEY',
  'SUPABASE_URL'
];

const optionalEnvVars = [
  'ANTHROPIC_API_KEY',
  'AIRTABLE_ACCESS_TOKEN',
  'STRIPE_WEBHOOK_SECRET'
];

console.log('Critical Environment Variables:');
criticalEnvVars.forEach(varName => {
  const check = checkEnvVar(varName, true);
  results.environment[varName] = check;
  console.log(`  ${check.exists ? '✅' : '❌'} ${varName}: ${check.exists ? 'Configured' : 'Missing/Invalid'}`);
});

console.log('\nOptional Environment Variables:');
optionalEnvVars.forEach(varName => {
  const check = checkEnvVar(varName, false);
  results.environment[varName] = check;
  console.log(`  ${check.exists ? '✅' : '⚠️'} ${varName}: ${check.exists ? 'Configured' : 'Not Set'}`);
});

// 2. File System Check
console.log('\n📁 2. FILE SYSTEM CHECK');
console.log('-'.repeat(40));

const criticalFiles = [
  'pages/api/health.ts',
  'pages/api/analyze.ts',
  'pages/index.tsx',
  'next.config.js',
  'package.json'
];

console.log('Critical Files:');
criticalFiles.forEach(filePath => {
  const exists = fileExists(filePath);
  results.build[filePath] = exists;
  console.log(`  ${exists ? '✅' : '❌'} ${filePath}`);
  if (!exists) {
    results.recommendations.push(`🔴 CRITICAL: Missing file ${filePath}`);
  }
});

// 3. Package Dependencies Check
console.log('\n📦 3. PACKAGE DEPENDENCIES CHECK');
console.log('-'.repeat(40));

try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const criticalDeps = ['next', 'react', 'stripe', 'openai', '@supabase/supabase-js'];
  
  console.log('Critical Dependencies:');
  criticalDeps.forEach(dep => {
    const installed = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
    results.build[`dep_${dep}`] = !!installed;
    console.log(`  ${installed ? '✅' : '❌'} ${dep}: ${installed || 'Missing'}`);
    if (!installed) {
      results.recommendations.push(`🔴 CRITICAL: Install missing dependency: npm install ${dep}`);
    }
  });
} catch (error) {
  console.log('  ❌ Error reading package.json:', error.message);
  results.recommendations.push('🔴 CRITICAL: Fix package.json file');
}

// 4. Build Status Check
console.log('\n🔨 4. BUILD STATUS CHECK');
console.log('-'.repeat(40));

try {
  console.log('Checking TypeScript compilation...');
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('  ✅ TypeScript compilation: Success');
  results.build.typescript = true;
} catch (error) {
  console.log('  ❌ TypeScript compilation: Failed');
  console.log('    Error:', error.message.split('\n')[0]);
  results.build.typescript = false;
  results.recommendations.push('🔴 CRITICAL: Fix TypeScript compilation errors');
}

try {
  console.log('Checking Next.js configuration...');
  const nextConfig = require('./next.config.js');
  console.log('  ✅ Next.js config: Loaded successfully');
  results.build.nextConfig = true;
} catch (error) {
  console.log('  ❌ Next.js config: Failed to load');
  console.log('    Error:', error.message);
  results.build.nextConfig = false;
  results.recommendations.push('🔴 CRITICAL: Fix next.config.js file');
}

// 5. Development Server Check
console.log('\n🚀 5. DEVELOPMENT SERVER CHECK');
console.log('-'.repeat(40));

// Check if development server is running
const serverChecks = [
  { url: 'http://localhost:3000/api/health', name: 'Health API' },
  { url: 'http://localhost:3000', name: 'Homepage' }
];

console.log('Testing server endpoints...');
console.log('(Note: This requires the dev server to be running)');

// We'll create a separate script for this since we can't easily test running server from here

// 6. Generate Diagnostic Report
console.log('\n📊 6. DIAGNOSTIC SUMMARY');
console.log('-'.repeat(40));

const criticalIssues = results.recommendations.filter(r => r.includes('🔴 CRITICAL'));
const warnings = results.recommendations.filter(r => r.includes('🟡'));

console.log(`\nIssues Found:`);
console.log(`  🔴 Critical Issues: ${criticalIssues.length}`);
console.log(`  🟡 Warnings: ${warnings.length}`);

if (criticalIssues.length > 0) {
  console.log('\n🔴 CRITICAL ISSUES TO FIX:');
  criticalIssues.forEach(issue => console.log(`  ${issue}`));
}

if (warnings.length > 0) {
  console.log('\n🟡 WARNINGS:');
  warnings.forEach(warning => console.log(`  ${warning}`));
}

// 7. Generate Fix Script
console.log('\n🔧 7. GENERATING FIX SCRIPT');
console.log('-'.repeat(40));

const fixScript = `#!/bin/bash
# DirectoryBolt Server Error Fix Script
# Generated by diagnostic tool

echo "🔧 DirectoryBolt Server Error Fix Script"
echo "========================================"

# 1. Install missing dependencies
echo "📦 Installing/updating dependencies..."
npm install

# 2. Clear Next.js cache
echo "🧹 Clearing Next.js cache..."
rm -rf .next
rm -rf node_modules/.cache

# 3. Rebuild the application
echo "🔨 Rebuilding application..."
npm run build

# 4. Start development server
echo "🚀 Starting development server..."
echo "Server will start at http://localhost:3000"
echo "Press Ctrl+C to stop"
npm run dev
`;

fs.writeFileSync('fix-server-error.sh', fixScript);
fs.chmodSync('fix-server-error.sh', '755');

console.log('✅ Fix script generated: fix-server-error.sh');

// 8. Recommendations
console.log('\n💡 IMMEDIATE RECOMMENDATIONS');
console.log('-'.repeat(40));

console.log(`
1. 🔧 Run the fix script:
   chmod +x fix-server-error.sh
   ./fix-server-error.sh

2. 🔑 Configure environment variables in .env.local:
   - Add your actual Stripe API keys
   - Add your actual OpenAI API key
   - Add your actual Supabase URL and keys

3. 🧪 Test the server:
   npm run dev
   # Then visit http://localhost:3000

4. 🔍 Check browser console for specific errors

5. 📞 If issues persist, check:
   - Browser developer tools (F12)
   - Terminal output where you ran 'npm run dev'
   - Network tab for failed API requests
`);

// Save detailed results
fs.writeFileSync('diagnostic-results.json', JSON.stringify(results, null, 2));
console.log('\n📄 Detailed results saved to: diagnostic-results.json');

console.log('\n✅ Diagnostic complete!');