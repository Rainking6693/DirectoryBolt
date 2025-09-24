#!/usr/bin/env node

/**
 * TEST DIRECTORY SUBMISSIONS COLUMNS WITH VALID CUSTOMER ID
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testDirectorySubmissionsColumns() {
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

  console.log('🔍 TESTING: directory_submissions columns with valid customer...');
  
  // First, create a valid test customer
  const testCustomerId = 'TEST-DIR-COLUMNS-' + Date.now();
  
  try {
    // Insert a test customer first
    const { data: customerData, error: customerError } = await supabase
      .from('customers')
      .insert({
        customer_id: testCustomerId,
        business_name: 'Test Directory Columns Business',
        email: 'test-dir-columns@test.com',
        package_type: 'growth',
        status: 'active'
      })
      .select();
    
    if (customerError) {
      console.log('❌ Failed to create test customer:', customerError.message);
      return;
    }
    
    console.log('✅ Test customer created:', testCustomerId);
    
    // Now test each column
    const columnTests = {
      directory_category: 'Business',
      directory_tier: 'standard', 
      processing_time_seconds: 45,
      error_message: null
    };
    
    const results = {};
    
    for (const [columnName, testValue] of Object.entries(columnTests)) {
      try {
        console.log(`\n📝 Testing column: ${columnName}`);
        
        const testData = {
          customer_id: testCustomerId,
          directory_name: `Test ${columnName} Column`,
          submission_status: 'pending'
        };
        
        testData[columnName] = testValue;
        
        const { data, error } = await supabase
          .from('directory_submissions')
          .insert(testData)
          .select();
        
        if (error) {
          if (error.message.includes(`column "${columnName}" of relation`)) {
            console.log(`❌ ${columnName}: COLUMN DOES NOT EXIST`);
            results[columnName] = { exists: false, error: error.message };
          } else {
            console.log(`⚠️ ${columnName}: Other error - ${error.message}`);
            results[columnName] = { exists: 'unknown', error: error.message };
          }
        } else {
          console.log(`✅ ${columnName}: EXISTS and working`);
          console.log(`   📊 Data: ${JSON.stringify(data[0][columnName])}`);
          results[columnName] = { exists: true, data: data[0][columnName] };
          
          // Clean up test submission
          await supabase
            .from('directory_submissions')
            .delete()
            .eq('customer_id', testCustomerId)
            .eq('directory_name', testData.directory_name);
        }
      } catch (err) {
        console.log(`❌ ${columnName}: Exception - ${err.message}`);
        results[columnName] = { exists: false, error: err.message };
      }
    }
    
    // Clean up test customer
    await supabase
      .from('customers')
      .delete()
      .eq('customer_id', testCustomerId);
    
    console.log('\n📊 DIRECTORY SUBMISSIONS COLUMN TEST RESULTS:');
    console.log('='.repeat(50));
    
    const verifiedColumns = Object.entries(results)
      .filter(([_, result]) => result.exists === true).length;
    
    console.log(`✅ Verified columns: ${verifiedColumns}/4`);
    
    Object.entries(results).forEach(([column, result]) => {
      const status = result.exists === true ? '✅ EXISTS' : 
                    result.exists === false ? '❌ MISSING' : '⚠️ UNKNOWN';
      console.log(`   ${status}: ${column}`);
    });
    
    if (verifiedColumns >= 3) {
      console.log('\n🎉 SUCCESS: Most directory_submissions columns are working!');
    } else {
      console.log('\n⚠️ ATTENTION: Some directory_submissions columns may need creation');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Try to cleanup test customer if it exists
    try {
      await supabase
        .from('customers')
        .delete()
        .eq('customer_id', testCustomerId);
    } catch (cleanupError) {
      // Ignore cleanup errors
    }
    
    throw error;
  }
}

if (require.main === module) {
  testDirectorySubmissionsColumns()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { testDirectorySubmissionsColumns };