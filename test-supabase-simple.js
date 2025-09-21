#!/usr/bin/env node

/**
 * Simple Supabase Connection Test
 * Tests basic Supabase functionality without complex queries
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔗 Simple Supabase Connection Test');
console.log('=' .repeat(40));

async function testSimpleConnection() {
  try {
    console.log('🔧 Initializing Supabase client...');
    console.log(`   URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    console.log('✅ Supabase client created');
    
    // Test 1: Try to access customers table (expected to fail if not deployed)
    console.log('\n🧪 Testing customers table access...');
    try {
      const { data, error, count } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ⚠️  Customers table: ${error.message}`);
        if (error.message.includes('does not exist')) {
          console.log('   💡 This is expected - table needs to be created');
          return { 
            status: 'connection_ok_schema_needed', 
            issue: 'Tables not deployed',
            recommendation: 'Deploy database schema manually' 
          };
        } else {
          throw error;
        }
      } else {
        console.log(`   ✅ Customers table accessible with ${count || 0} records`);
        return { 
          status: 'fully_operational', 
          customerCount: count,
          recommendation: 'Database is ready for testing' 
        };
      }
    } catch (tableError) {
      console.log(`   ❌ Table access error: ${tableError.message}`);
      
      // Try a simpler test - checking if we can make any valid request
      console.log('\n🔍 Testing basic Supabase response...');
      try {
        // Try to access a non-existent table to see if we get a proper error response
        const { error: testError } = await supabase
          .from('test_connection_table')
          .select('*')
          .limit(1);
        
        if (testError && testError.message.includes('does not exist')) {
          console.log('   ✅ Supabase is responding properly');
          console.log('   💡 Database connection is working - schema needs deployment');
          return { 
            status: 'connection_ok_schema_needed',
            issue: 'Schema not deployed',
            recommendation: 'Deploy database schema manually'
          };
        } else {
          throw new Error('Unexpected response from Supabase');
        }
      } catch (basicError) {
        throw new Error(`Basic connection failed: ${basicError.message}`);
      }
    }
    
  } catch (error) {
    console.log(`\n❌ Connection test failed: ${error.message}`);
    return { 
      status: 'connection_failed', 
      error: error.message,
      recommendation: 'Check Supabase configuration' 
    };
  }
}

async function checkApplicationFiles() {
  console.log('\n📁 Checking critical application files...');
  
  const fs = require('fs');
  const path = require('path');
  
  const criticalFiles = [
    'pages/api/analyze.ts',
    'pages/test-streamlined-pricing.tsx',
    'components/checkout/StreamlinedCheckout.tsx',
    'lib/config/pricing.ts'
  ];
  
  let existingFiles = 0;
  
  for (const file of criticalFiles) {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      console.log(`   ✅ ${file}`);
      existingFiles++;
    } else {
      console.log(`   ❌ ${file}`);
    }
  }
  
  console.log(`\n📊 Application Files: ${existingFiles}/${criticalFiles.length} present`);
  return { existingFiles, totalFiles: criticalFiles.length };
}

async function generateStatusReport() {
  console.log('\n📄 Generating Status Report...');
  
  const dbTest = await testSimpleConnection();
  const fileTest = await checkApplicationFiles();
  
  const report = {
    timestamp: new Date().toISOString(),
    database: dbTest,
    files: fileTest,
    overallStatus: (dbTest.status === 'connection_ok_schema_needed' && fileTest.existingFiles >= 3) 
      ? 'ready_for_schema_deployment'
      : dbTest.status === 'fully_operational' && fileTest.existingFiles >= 3
      ? 'fully_ready'
      : 'needs_attention'
  };
  
  console.log('\n🎯 STATUS SUMMARY');
  console.log('=' .repeat(25));
  console.log(`🗄️  Database: ${dbTest.status}`);
  console.log(`📁 Files: ${fileTest.existingFiles}/${fileTest.totalFiles}`);
  console.log(`🏁 Overall: ${report.overallStatus}`);
  console.log(`💡 Recommendation: ${dbTest.recommendation}`);
  
  // Write report to file
  const fs = require('fs');
  const path = require('path');
  const reportPath = path.join(__dirname, 'SUPABASE_STATUS_REPORT.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved: ${reportPath}`);
  
  return report;
}

// Run the test
if (require.main === module) {
  generateStatusReport()
    .then(report => {
      if (report.overallStatus === 'ready_for_schema_deployment') {
        console.log('\n🎉 Ready for database schema deployment!');
        console.log('📋 Next step: Deploy the database schema manually in Supabase dashboard');
        process.exit(0);
      } else if (report.overallStatus === 'fully_ready') {
        console.log('\n🎉 System is fully operational!');
        process.exit(0);
      } else {
        console.log('\n⚠️  System needs attention before proceeding');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Status check failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testSimpleConnection, checkApplicationFiles };