/**
 * Test Customer ID Generation - DirectoryBolt
 * CRITICAL: Test that customer ID generation works in DIR-YYYYMMDD-XXXXXX format
 */

require('dotenv').config({ path: '.env.local' });
const { createSupabaseService } = require('./lib/services/supabase.js');

console.log('🧪 Testing Customer ID Generation');
console.log('=' .repeat(40));

async function testCustomerIdGeneration() {
  try {
    // Test the local generator
    console.log('\n1. Testing local ID generation...');
    const supabaseService = createSupabaseService();
    
    const generatedIds = [];
    for (let i = 0; i < 5; i++) {
      const id = supabaseService.generateCustomerId();
      generatedIds.push(id);
      console.log(`   Generated: ${id}`);
      
      // Validate format
      const isValid = supabaseService.validateCustomerId(id);
      console.log(`   Valid format: ${isValid ? '✅' : '❌'}`);
      
      if (!isValid) {
        console.log(`   ❌ Invalid format! Expected: DIR-YYYYMMDD-XXXXXX`);
      }
    }

    // Test uniqueness
    const uniqueIds = new Set(generatedIds);
    const uniquenessCheck = uniqueIds.size === generatedIds.length;
    console.log(`\n2. Uniqueness test: ${uniquenessCheck ? '✅' : '❌'}`);
    console.log(`   Generated: ${generatedIds.length}, Unique: ${uniqueIds.size}`);

    // Test date format
    console.log('\n3. Testing date format...');
    const now = new Date();
    const expectedYear = now.getFullYear().toString();
    const expectedMonth = String(now.getMonth() + 1).padStart(2, '0');
    const expectedDay = String(now.getDate()).padStart(2, '0');
    const expectedDatePart = expectedYear + expectedMonth + expectedDay;

    console.log(`   Expected date part: ${expectedDatePart}`);
    
    const allMatchDate = generatedIds.every(id => {
      const datePart = id.split('-')[1];
      return datePart === expectedDatePart;
    });
    
    console.log(`   All IDs match today's date: ${allMatchDate ? '✅' : '❌'}`);

    // Test format components
    console.log('\n4. Testing format components...');
    for (const id of generatedIds.slice(0, 2)) {
      const parts = id.split('-');
      console.log(`   ID: ${id}`);
      console.log(`     Parts: [${parts.join(', ')}]`);
      console.log(`     Prefix: ${parts[0]} (should be 'DIR')`);
      console.log(`     Date: ${parts[1]} (should be ${expectedDatePart})`);
      console.log(`     Random: ${parts[2]} (should be 6 digits)`);
      
      const formatChecks = {
        prefix: parts[0] === 'DIR',
        dateLength: parts[1].length === 8,
        randomLength: parts[2].length === 6,
        randomIsNumeric: /^\d{6}$/.test(parts[2])
      };
      
      const allValid = Object.values(formatChecks).every(Boolean);
      console.log(`     Format valid: ${allValid ? '✅' : '❌'}`);
      
      if (!allValid) {
        console.log(`     Failed checks:`, Object.entries(formatChecks)
          .filter(([key, value]) => !value)
          .map(([key, value]) => key)
        );
      }
    }

    // Test Supabase connection and schema
    console.log('\n5. Testing Supabase connection...');
    await supabaseService.initialize();
    const connectionTest = await supabaseService.testConnection();
    
    console.log(`   Connection: ${connectionTest.ok ? '✅' : '❌'}`);
    if (connectionTest.error) {
      console.log(`   Error: ${connectionTest.error}`);
    }
    if (connectionTest.hasData) {
      console.log(`   Has existing data: ✅`);
    }

    console.log('\n6. Testing customer ID formats that should exist...');
    const testIds = [
      'DIR-20250917-000001',
      'DIR-20250917-000002'
    ];
    
    for (const testId of testIds) {
      const result = await supabaseService.getCustomerById(testId);
      console.log(`   ${testId}: ${result.found ? '✅ Found' : '❌ Not Found'}`);
      if (result.found) {
        console.log(`     Business: ${result.customer.businessName}`);
        console.log(`     Email: ${result.customer.email}`);
      } else if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
    }

    console.log('\n🎉 CUSTOMER ID GENERATION TESTS COMPLETE');
    
    if (uniquenessCheck && allMatchDate) {
      console.log('✅ All tests passed - Customer ID generation is working correctly');
      return true;
    } else {
      console.log('❌ Some tests failed - Please check the issues above');
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    console.error('Full error:', error.stack);
    return false;
  }
}

// Run the test
testCustomerIdGeneration().then(success => {
  process.exit(success ? 0 : 1);
});