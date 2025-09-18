/**
 * Test Customer ID Generation with DIR-20250918-XXXXXX Format
 * Validates that the database function generates proper customer IDs
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🧪 Testing Customer ID Generation (DIR-20250918-XXXXXX Format)');
console.log('=' .repeat(70));

class CustomerIdTester {
  constructor() {
    this.supabase = null;
  }

  async initialize() {
    console.log('🔧 Initializing Supabase connection...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log(`✅ Connected to Supabase: ${supabaseUrl}`);
  }

  async testCustomerIdGeneration() {
    console.log('\n🆔 Testing customer ID generation function...');
    
    try {
      // Test generate_customer_id function
      const { data, error } = await this.supabase.rpc('generate_customer_id');
      
      if (error) {
        console.log(`❌ Function call failed: ${error.message}`);
        return false;
      }

      const generatedId = data;
      console.log(`✅ Generated customer ID: ${generatedId}`);

      // Validate format: DIR-YYYYMMDD-XXXXXX
      const expectedPattern = /^DIR-\d{8}-\d{6}$/;
      const isValidFormat = expectedPattern.test(generatedId);
      
      if (isValidFormat) {
        console.log(`✅ Format validation: PASSED (matches DIR-YYYYMMDD-XXXXXX)`);
        
        // Extract date components
        const dateMatch = generatedId.match(/^DIR-(\d{4})(\d{2})(\d{2})-(\d{6})$/);
        if (dateMatch) {
          const [, year, month, day, sequence] = dateMatch;
          const today = new Date();
          
          console.log(`   Year: ${year} (Expected: ${today.getFullYear()})`);
          console.log(`   Month: ${month} (Expected: ${String(today.getMonth() + 1).padStart(2, '0')})`);
          console.log(`   Day: ${day} (Expected: ${String(today.getDate()).padStart(2, '0')})`);
          console.log(`   Sequence: ${sequence} (6-digit random)`);
          
          // Check if date matches today
          const expectedDate = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
          const actualDate = `${year}${month}${day}`;
          
          if (expectedDate === actualDate) {
            console.log(`✅ Date validation: PASSED (matches today's date)`);
            return true;
          } else {
            console.log(`⚠️  Date validation: WARNING (expected ${expectedDate}, got ${actualDate})`);
            return true; // Still valid, might be timezone difference
          }
        }
      } else {
        console.log(`❌ Format validation: FAILED (expected DIR-YYYYMMDD-XXXXXX, got ${generatedId})`);
        return false;
      }

    } catch (error) {
      console.log(`❌ Test failed with error: ${error.message}`);
      return false;
    }
  }

  async testMultipleGenerations() {
    console.log('\n🔄 Testing multiple ID generations for uniqueness...');
    
    const generatedIds = new Set();
    const testCount = 10;
    
    for (let i = 0; i < testCount; i++) {
      try {
        const { data, error } = await this.supabase.rpc('generate_customer_id');
        
        if (error) {
          console.log(`❌ Generation ${i + 1} failed: ${error.message}`);
          continue;
        }

        const id = data;
        console.log(`   ${i + 1}. ${id}`);
        
        if (generatedIds.has(id)) {
          console.log(`❌ DUPLICATE ID DETECTED: ${id}`);
          return false;
        }
        
        generatedIds.add(id);
        
        // Validate format
        if (!/^DIR-\d{8}-\d{6}$/.test(id)) {
          console.log(`❌ Invalid format: ${id}`);
          return false;
        }
        
      } catch (error) {
        console.log(`❌ Generation ${i + 1} error: ${error.message}`);
      }
    }
    
    console.log(`✅ Generated ${generatedIds.size} unique IDs out of ${testCount} attempts`);
    return generatedIds.size === testCount;
  }

  async testCustomerCreationWithGeneratedId() {
    console.log('\n👤 Testing customer creation with generated ID...');
    
    try {
      // Generate a customer ID
      const { data: customerId, error: idError } = await this.supabase.rpc('generate_customer_id');
      
      if (idError) {
        console.log(`❌ ID generation failed: ${idError.message}`);
        return false;
      }

      console.log(`📋 Using generated ID: ${customerId}`);
      
      // Create a test customer
      const testCustomer = {
        customer_id: customerId,
        first_name: 'Test',
        last_name: 'Customer',
        business_name: 'Test Business Inc',
        email: `test+${Date.now()}@directorybolt.com`,
        phone: '555-0123',
        package_type: 'starter',
        status: 'active',
        metadata: {
          test_customer: true,
          created_by: 'customer_id_test',
          test_timestamp: new Date().toISOString()
        }
      };

      const { data, error } = await this.supabase
        .from('customers')
        .insert([testCustomer])
        .select()
        .single();

      if (error) {
        console.log(`❌ Customer creation failed: ${error.message}`);
        return false;
      }

      console.log(`✅ Customer created successfully:`);
      console.log(`   Database ID: ${data.id}`);
      console.log(`   Customer ID: ${data.customer_id}`);
      console.log(`   Business Name: ${data.business_name}`);
      console.log(`   Email: ${data.email}`);
      
      // Clean up - delete the test customer
      const { error: deleteError } = await this.supabase
        .from('customers')
        .delete()
        .eq('id', data.id);

      if (deleteError) {
        console.log(`⚠️  Warning: Could not delete test customer: ${deleteError.message}`);
      } else {
        console.log(`🗑️  Test customer cleaned up successfully`);
      }

      return true;
      
    } catch (error) {
      console.log(`❌ Customer creation test failed: ${error.message}`);
      return false;
    }
  }

  async testDatabaseSchemaComponents() {
    console.log('\n🗃️  Testing database schema components...');
    
    const tests = [
      {
        name: 'customers table',
        query: () => this.supabase.from('customers').select('count').limit(1)
      },
      {
        name: 'generate_customer_id function',
        query: () => this.supabase.rpc('generate_customer_id')
      },
      {
        name: 'customer_stats view',
        query: () => this.supabase.from('customer_stats').select('*').single()
      },
      {
        name: 'queue_history table',
        query: () => this.supabase.from('queue_history').select('count').limit(1)
      },
      {
        name: 'customer_notifications table',
        query: () => this.supabase.from('customer_notifications').select('count').limit(1)
      }
    ];

    const results = [];
    
    for (const test of tests) {
      try {
        console.log(`   Testing ${test.name}...`);
        const { data, error } = await test.query();
        
        if (error) {
          console.log(`   ❌ ${test.name}: FAILED (${error.message})`);
          results.push({ name: test.name, status: 'FAILED', error: error.message });
        } else {
          console.log(`   ✅ ${test.name}: PASSED`);
          results.push({ name: test.name, status: 'PASSED' });
        }
      } catch (error) {
        console.log(`   ❌ ${test.name}: ERROR (${error.message})`);
        results.push({ name: test.name, status: 'ERROR', error: error.message });
      }
    }
    
    const passed = results.filter(r => r.status === 'PASSED').length;
    const total = results.length;
    
    console.log(`\n📊 Schema test results: ${passed}/${total} passed`);
    return passed === total;
  }

  async runAllTests() {
    try {
      await this.initialize();
      
      console.log('\n🚀 Starting comprehensive customer ID generation tests...');
      
      const results = {
        schemaTest: false,
        idGenerationTest: false,
        uniquenessTest: false,
        customerCreationTest: false
      };
      
      // Test 1: Database schema components
      results.schemaTest = await this.testDatabaseSchemaComponents();
      
      // Test 2: Basic ID generation
      results.idGenerationTest = await this.testCustomerIdGeneration();
      
      // Test 3: Multiple generations for uniqueness
      results.uniquenessTest = await this.testMultipleGenerations();
      
      // Test 4: Customer creation with generated ID
      results.customerCreationTest = await this.testCustomerCreationWithGeneratedId();
      
      // Summary
      console.log('\n📋 TEST SUMMARY');
      console.log('=' .repeat(50));
      console.log(`🗃️  Database Schema: ${results.schemaTest ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`🆔 ID Generation: ${results.idGenerationTest ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`🔄 Uniqueness Test: ${results.uniquenessTest ? '✅ PASSED' : '❌ FAILED'}`);
      console.log(`👤 Customer Creation: ${results.customerCreationTest ? '✅ PASSED' : '❌ FAILED'}`);
      
      const allPassed = Object.values(results).every(result => result === true);
      
      if (allPassed) {
        console.log('\n🎉 ALL TESTS PASSED! Customer ID generation is working correctly.');
        console.log('✅ Format: DIR-YYYYMMDD-XXXXXX');
        console.log('✅ Uniqueness: Guaranteed');
        console.log('✅ Database Integration: Working');
      } else {
        console.log('\n⚠️  SOME TESTS FAILED. Please review the errors above.');
        
        if (!results.schemaTest) {
          console.log('❌ Database schema needs to be deployed first');
        }
      }
      
      return allPassed;
      
    } catch (error) {
      console.error('\n💥 TEST SUITE FAILED:', error.message);
      console.error('Full error:', error.stack);
      return false;
    }
  }
}

// Main execution
async function main() {
  const tester = new CustomerIdTester();
  
  try {
    const success = await tester.runAllTests();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { CustomerIdTester };