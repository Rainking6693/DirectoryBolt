#!/usr/bin/env node

/**
 * Test Database with Production Supabase Keys
 * This will test using the actual configured environment variables
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🗄️  Testing Database with Production Configuration');
console.log('=' .repeat(50));

async function testProductionDatabase() {
  try {
    console.log('🔗 Using production Supabase configuration...');
    console.log(`   URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    console.log(`   Service Key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configured' : '❌ Missing'}`);
    
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
    
    console.log('\n🧪 Testing basic database operations...');
    
    // Test 1: System tables access
    console.log('  Testing system table access...');
    const { data: sysData, error: sysError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);
    
    if (sysError) {
      throw new Error(`System access failed: ${sysError.message}`);
    }
    
    console.log(`  ✅ System access successful. Found ${sysData.length} public tables:`);
    sysData.forEach(table => {
      console.log(`     - ${table.table_name}`);
    });
    
    // Test 2: Check for customers table specifically
    console.log('\n  Testing customers table access...');
    const { data: customerData, error: customerError, count } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    if (customerError) {
      console.log(`  ⚠️  Customers table issue: ${customerError.message}`);
      console.log('      This indicates the database schema may need to be deployed');
    } else {
      console.log(`  ✅ Customers table exists with ${count || 0} records`);
    }
    
    // Test 3: Check all required tables
    console.log('\n  Testing all required tables...');
    const requiredTables = ['customers', 'queue_history', 'customer_notifications', 'autobolt_processing_queue', 'analytics_events'];
    const tableStatus = {};
    
    for (const tableName of requiredTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          tableStatus[tableName] = '❌ Missing/Inaccessible';
        } else {
          tableStatus[tableName] = '✅ Accessible';
        }
      } catch (err) {
        tableStatus[tableName] = '❌ Error';
      }
      
      console.log(`     ${tableName}: ${tableStatus[tableName]}`);
    }
    
    // Summary
    const accessibleTables = Object.values(tableStatus).filter(status => status.includes('✅')).length;
    const totalTables = requiredTables.length;
    
    console.log('\n📊 DATABASE STATUS SUMMARY:');
    console.log('=' .repeat(30));
    console.log(`🔗 Connection: ✅ Successful`);
    console.log(`🛡️  Authentication: ✅ Valid`);
    console.log(`📋 System Access: ✅ Working`);
    console.log(`📊 Required Tables: ${accessibleTables}/${totalTables} accessible`);
    
    if (accessibleTables === 0) {
      console.log('\n🔧 RECOMMENDATION: Deploy database schema');
      console.log('   The database connection is working but no application tables exist.');
      console.log('   This suggests the schema needs to be deployed manually.');
      
      return {
        status: 'connection_ok_schema_needed',
        tablesAccessible: accessibleTables,
        totalTables: totalTables,
        recommendation: 'Deploy database schema'
      };
    } else if (accessibleTables < totalTables) {
      console.log('\n⚠️  PARTIAL DEPLOYMENT: Some tables are missing');
      return {
        status: 'partial_deployment',
        tablesAccessible: accessibleTables,
        totalTables: totalTables,
        recommendation: 'Complete schema deployment'
      };
    } else {
      console.log('\n🎉 FULLY OPERATIONAL: All systems ready');
      return {
        status: 'fully_operational',
        tablesAccessible: accessibleTables,
        totalTables: totalTables,
        recommendation: 'Ready for production testing'
      };
    }
    
  } catch (error) {
    console.log(`\n❌ Database test failed: ${error.message}`);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('   1. Check if SUPABASE_SERVICE_ROLE_KEY is correct');
    console.log('   2. Verify NEXT_PUBLIC_SUPABASE_URL is accessible');
    console.log('   3. Ensure Supabase project is not paused');
    
    return {
      status: 'connection_failed',
      error: error.message,
      recommendation: 'Fix database configuration'
    };
  }
}

// Run the test
if (require.main === module) {
  testProductionDatabase()
    .then(result => {
      console.log(`\n🏁 Test completed with status: ${result.status}`);
      
      if (result.status === 'fully_operational') {
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test runner failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testProductionDatabase };