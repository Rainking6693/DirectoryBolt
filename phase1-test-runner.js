#!/usr/bin/env node

/**
 * DirectoryBolt Comprehensive Testing Runner - Safe Version
 * Executes Phase 1 testing first to validate basic functionality
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Test token provided by user
const TEST_SUPABASE_TOKEN = 'sbp_edaa7bff2326a69d2fe26c67896f43449265b6134';

console.log('🧪 DirectoryBolt Comprehensive Testing - Phase 1');
console.log('=' .repeat(60));

async function testEnvironmentVariables() {
  console.log('\n🔧 Phase 1.1: Environment Variables Check');
  console.log('-' .repeat(40));
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY', 
    'OPENAI_API_KEY',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ];

  const results = {};
  let configuredCount = 0;
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value && value !== 'your_key_here' && !value.includes('placeholder')) {
      results[varName] = '✅ Configured';
      configuredCount++;
    } else {
      results[varName] = '❌ Missing/Invalid';
    }
    console.log(`  ${varName}: ${results[varName]}`);
  }
  
  console.log(`\n📊 Environment Variables: ${configuredCount}/${requiredVars.length} configured`);
  return { results, configuredCount, total: requiredVars.length };
}

async function testSupabaseConnectivity() {
  console.log('\n🗄️  Phase 1.2: Database Connectivity Test');
  console.log('-' .repeat(40));
  
  try {
    console.log('  Initializing Supabase client with test token...');
    
    // Initialize with test token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      TEST_SUPABASE_TOKEN,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    console.log('  ✅ Supabase client initialized');
    
    // Test basic connection
    console.log('  Testing database connection...');
    const { data, error } = await supabase
      .from('customers')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('  ⚠️  Customers table not found, testing system access...');
      
      // Try system tables
      const { data: sysData, error: sysError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(1);
        
      if (sysError) {
        throw new Error(`System access failed: ${sysError.message}`);
      }
      
      console.log('  ✅ Database connection works (schema deployment needed)');
      return { status: 'connected', needsSchema: true, customerCount: 0 };
    } else {
      console.log(`  ✅ Database fully operational with ${data || 0} customers`);
      return { status: 'operational', needsSchema: false, customerCount: data || 0 };
    }
    
  } catch (error) {
    console.log(`  ❌ Database connection failed: ${error.message}`);
    return { status: 'failed', error: error.message };
  }
}

async function testTableStructure() {
  console.log('\n📋 Phase 1.3: Table Structure Validation');
  console.log('-' .repeat(40));
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      TEST_SUPABASE_TOKEN,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    const requiredTables = [
      'customers',
      'queue_history', 
      'customer_notifications',
      'autobolt_processing_queue',
      'analytics_events'
    ];
    
    const tableResults = {};
    let existingCount = 0;
    
    for (const tableName of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (error) {
          tableResults[tableName] = '❌ Missing';
        } else {
          tableResults[tableName] = '✅ Exists';
          existingCount++;
        }
      } catch (err) {
        tableResults[tableName] = '❌ Error';
      }
      
      console.log(`  ${tableName}: ${tableResults[tableName]}`);
    }
    
    console.log(`\n📊 Database Tables: ${existingCount}/${requiredTables.length} present`);
    return { tableResults, existingCount, total: requiredTables.length };
    
  } catch (error) {
    console.log(`  ❌ Table validation failed: ${error.message}`);
    return { status: 'failed', error: error.message };
  }
}

async function testFileStructure() {
  console.log('\n📁 Phase 1.4: Critical File Structure Check');
  console.log('-' .repeat(40));
  
  const criticalFiles = [
    'pages/test-streamlined-pricing.tsx',
    'components/checkout/StreamlinedCheckout.tsx', 
    'pages/api/stripe/create-checkout-session.ts',
    'pages/success.js',
    'pages/business-info.tsx',
    'pages/api/customer/register-complete.ts',
    'pages/staff-dashboard.tsx',
    'lib/config/pricing.ts'
  ];
  
  const fileResults = {};
  let existingCount = 0;
  
  for (const filePath of criticalFiles) {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
      fileResults[filePath] = '✅ Exists';
      existingCount++;
    } else {
      fileResults[filePath] = '❌ Missing';
    }
    console.log(`  ${filePath}: ${fileResults[filePath]}`);
  }
  
  console.log(`\n📊 Critical Files: ${existingCount}/${criticalFiles.length} present`);
  return { fileResults, existingCount, total: criticalFiles.length };
}

async function testAPIEndpoints() {
  console.log('\n🌐 Phase 1.5: API Endpoint Structure Check');
  console.log('-' .repeat(40));
  
  const apiEndpoints = [
    'pages/api/analyze.ts',
    'pages/api/stripe/create-checkout-session.ts',
    'pages/api/customer/register-complete.ts',
    'pages/api/staff/queue.ts',
    'pages/api/autobolt/queue-status.ts',
    'pages/api/autobolt/get-next-customer.ts',
    'pages/api/ai/content-gap-analysis.ts'
  ];
  
  const endpointResults = {};
  let existingCount = 0;
  
  for (const endpoint of apiEndpoints) {
    const fullPath = path.join(__dirname, endpoint);
    if (fs.existsSync(fullPath)) {
      endpointResults[endpoint] = '✅ Exists';
      existingCount++;
    } else {
      endpointResults[endpoint] = '❌ Missing';
    }
    console.log(`  ${endpoint}: ${endpointResults[endpoint]}`);
  }
  
  console.log(`\n📊 API Endpoints: ${existingCount}/${apiEndpoints.length} present`);
  return { endpointResults, existingCount, total: apiEndpoints.length };
}

async function generatePhase1Report() {
  console.log('\n📄 Generating Phase 1 Report...');
  
  // Run all Phase 1 tests
  const envTest = await testEnvironmentVariables();
  const dbTest = await testSupabaseConnectivity();
  const tableTest = await testTableStructure();
  const fileTest = await testFileStructure();
  const apiTest = await testAPIEndpoints();
  
  // Calculate overall scores
  const totalTests = 5;
  let passedTests = 0;
  let criticalIssues = [];
  
  // Environment Variables
  if (envTest.configuredCount === envTest.total) {
    passedTests++;
  } else {
    criticalIssues.push('Missing environment variables');
  }
  
  // Database Connectivity
  if (dbTest.status === 'operational') {
    passedTests++;
  } else if (dbTest.status === 'connected') {
    passedTests += 0.5; // Partial credit
    criticalIssues.push('Database schema needs deployment');
  } else {
    criticalIssues.push('Database connection failure');
  }
  
  // Tables
  if (tableTest.existingCount >= 3) {
    passedTests++;
  } else {
    criticalIssues.push('Missing critical database tables');
  }
  
  // Files
  if (fileTest.existingCount >= 6) {
    passedTests++;
  } else {
    criticalIssues.push('Missing critical application files');
  }
  
  // APIs
  if (apiTest.existingCount >= 5) {
    passedTests++;
  } else {
    criticalIssues.push('Missing critical API endpoints');
  }
  
  // Generate report
  const report = {
    timestamp: new Date().toISOString(),
    phase: 'Phase 1 - Setup & Environment Validation',
    summary: {
      totalTests,
      passedTests: Math.floor(passedTests),
      passRate: `${Math.round((passedTests / totalTests) * 100)}%`,
      criticalIssues
    },
    details: {
      environmentVariables: envTest,
      databaseConnectivity: dbTest,
      tableStructure: tableTest,
      fileStructure: fileTest,
      apiEndpoints: apiTest
    }
  };
  
  // Write to file
  const reportPath = path.join(__dirname, 'PHASE_1_TEST_RESULTS.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n🎯 PHASE 1 SUMMARY');
  console.log('=' .repeat(40));
  console.log(`📊 Tests Passed: ${Math.floor(passedTests)}/${totalTests} (${report.summary.passRate})`);
  console.log(`🔧 Environment Variables: ${envTest.configuredCount}/${envTest.total}`);
  console.log(`🗄️  Database: ${dbTest.status}`);
  console.log(`📋 Tables: ${tableTest.existingCount}/${tableTest.total}`);
  console.log(`📁 Files: ${fileTest.existingCount}/${fileTest.total}`);
  console.log(`🌐 APIs: ${apiTest.existingCount}/${apiTest.total}`);
  
  if (criticalIssues.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES FOUND:');
    criticalIssues.forEach((issue, index) => {
      console.log(`  ${index + 1}. ${issue}`);
    });
  }
  
  console.log(`\n📄 Detailed report saved: ${reportPath}`);
  
  return report;
}

// Run Phase 1 testing
if (require.main === module) {
  generatePhase1Report()
    .then(report => {
      if (report.summary.criticalIssues.length === 0) {
        console.log('\n🎉 Phase 1 completed successfully! Ready for Phase 2.');
        process.exit(0);
      } else {
        console.log('\n⚠️  Phase 1 completed with issues. Address critical issues before Phase 2.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Phase 1 testing failed:', error.message);
      process.exit(1);
    });
}

module.exports = { generatePhase1Report, testSupabaseConnectivity };