#!/usr/bin/env node

/**
 * DirectoryBolt Environment Variables Checker
 * Quickly checks if critical environment variables are properly configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔑 DirectoryBolt Environment Variables Checker');
console.log('=' .repeat(55));

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Define critical environment variables
const envVars = {
  critical: {
    'STRIPE_SECRET_KEY': {
      description: 'Stripe payment processing',
      example: 'sk_test_...',
      required: true
    },
    'OPENAI_API_KEY': {
      description: 'OpenAI API for AI analysis',
      example: 'sk-...',
      required: true
    },
    'SUPABASE_URL': {
      description: 'Supabase database URL',
      example: 'https://your-project.supabase.co',
      required: true
    }
  },
  important: {
    'STRIPE_WEBHOOK_SECRET': {
      description: 'Stripe webhook validation',
      example: 'whsec_...',
      required: false
    },
    'SUPABASE_SERVICE_ROLE_KEY': {
      description: 'Supabase admin access',
      example: 'eyJ...',
      required: false
    },
    'ANTHROPIC_API_KEY': {
      description: 'Anthropic AI (optional)',
      example: 'sk-ant-...',
      required: false
    }
  },
  optional: {
    'AIRTABLE_ACCESS_TOKEN': {
      description: 'Airtable integration',
      example: 'pat...',
      required: false
    },
    'SENTRY_DSN': {
      description: 'Error monitoring',
      example: 'https://...',
      required: false
    }
  }
};

function checkEnvVar(varName, config) {
  const value = process.env[varName];
  const hasValue = !!value;
  const isPlaceholder = value && (
    value.includes('your_') || 
    value.includes('_here') || 
    value.includes('placeholder') ||
    value === 'change_me_in_prod'
  );
  const isConfigured = hasValue && !isPlaceholder;

  return {
    name: varName,
    hasValue,
    isPlaceholder,
    isConfigured,
    value: value ? (value.length > 20 ? value.substring(0, 20) + '...' : value) : null,
    config
  };
}

function printSection(title, vars, emoji) {
  console.log(`\n${emoji} ${title.toUpperCase()}`);
  console.log('-'.repeat(50));
  
  const results = [];
  
  Object.entries(vars).forEach(([varName, config]) => {
    const result = checkEnvVar(varName, config);
    results.push(result);
    
    const status = result.isConfigured ? '✅' : (result.hasValue ? '⚠️' : '❌');
    const statusText = result.isConfigured ? 'Configured' : 
                      result.isPlaceholder ? 'Placeholder' : 
                      result.hasValue ? 'Invalid' : 'Missing';
    
    console.log(`${status} ${varName}`);
    console.log(`   Status: ${statusText}`);
    console.log(`   Purpose: ${config.description}`);
    
    if (!result.isConfigured) {
      console.log(`   Example: ${config.example}`);
    }
    
    if (result.hasValue && !result.isConfigured) {
      console.log(`   Current: ${result.value}`);
    }
    
    console.log('');
  });
  
  return results;
}

// Check all environment variables
const criticalResults = printSection('Critical Variables', envVars.critical, '🔴');
const importantResults = printSection('Important Variables', envVars.important, '🟡');
const optionalResults = printSection('Optional Variables', envVars.optional, '🟢');

// Summary
console.log('\n📊 SUMMARY');
console.log('=' .repeat(50));

const allResults = [...criticalResults, ...importantResults, ...optionalResults];
const configured = allResults.filter(r => r.isConfigured).length;
const missing = allResults.filter(r => !r.hasValue).length;
const placeholders = allResults.filter(r => r.isPlaceholder).length;

console.log(`✅ Configured: ${configured}/${allResults.length}`);
console.log(`❌ Missing: ${missing}`);
console.log(`⚠️ Placeholders: ${placeholders}`);

// Critical issues
const criticalIssues = criticalResults.filter(r => !r.isConfigured);
if (criticalIssues.length > 0) {
  console.log('\n🚨 CRITICAL ISSUES');
  console.log('-'.repeat(30));
  console.log('The following critical environment variables need to be configured:');
  criticalIssues.forEach(issue => {
    console.log(`  🔴 ${issue.name}: ${issue.config.description}`);
  });
  
  console.log('\n🔧 HOW TO FIX:');
  console.log('1. Open .env.local in your text editor');
  console.log('2. Replace placeholder values with your actual API keys:');
  criticalIssues.forEach(issue => {
    console.log(`   ${issue.name}=${issue.config.example}`);
  });
  console.log('3. Save the file and restart your development server');
}

// Check if .env.local exists
console.log('\n📁 ENVIRONMENT FILE CHECK');
console.log('-'.repeat(30));

const envFiles = ['.env.local', '.env', '.env.example'];
envFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}: ${exists ? 'Found' : 'Missing'}`);
});

// Generate quick fix commands
if (criticalIssues.length > 0) {
  console.log('\n⚡ QUICK FIX COMMANDS');
  console.log('-'.repeat(30));
  console.log('Run these commands to set up your environment variables:');
  console.log('');
  console.log('# Copy example file if .env.local doesn\'t exist');
  console.log('cp .env.example .env.local');
  console.log('');
  console.log('# Edit the file with your actual values');
  console.log('nano .env.local  # or use your preferred editor');
  console.log('');
  console.log('# Restart development server');
  console.log('npm run dev');
}

// Specific recommendations
console.log('\n💡 RECOMMENDATIONS');
console.log('-'.repeat(30));

if (criticalIssues.length === 0) {
  console.log('✅ All critical environment variables are configured!');
  console.log('Your server error is likely caused by something else.');
  console.log('');
  console.log('Next steps:');
  console.log('1. Run: node test-server-endpoints.js');
  console.log('2. Check browser developer tools (F12)');
  console.log('3. Look at server logs in your terminal');
} else {
  console.log('🔴 Critical environment variables are missing.');
  console.log('This is likely the cause of your server errors.');
  console.log('');
  console.log('Priority actions:');
  console.log('1. Configure missing environment variables');
  console.log('2. Restart your development server');
  console.log('3. Test the application again');
}

console.log('\n✅ Environment check complete!');

// Save results for reference
const results = {
  critical: criticalResults,
  important: importantResults,
  optional: optionalResults,
  summary: {
    total: allResults.length,
    configured,
    missing,
    placeholders,
    criticalIssues: criticalIssues.length
  }
};

fs.writeFileSync('env-check-results.json', JSON.stringify(results, null, 2));
console.log('📄 Detailed results saved to: env-check-results.json');