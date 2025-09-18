/**
 * Direct Supabase Connection Test
 * Tests Supabase connectivity using the same configuration as production
 */

require('dotenv').config({ path: '.env.netlify' });
const { createSupabaseService } = require('./lib/services/supabase');

async function testSupabaseConnection() {
  console.log('🔍 TESTING: Direct Supabase Connection');
  console.log('Environment variables:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
  console.log('- SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'MISSING');
  
  try {
    const supabaseService = createSupabaseService();
    console.log('✅ Service created successfully');
    
    // Test initialization
    await supabaseService.initialize();
    console.log('✅ Service initialized successfully');
    
    // Test connection
    const testResult = await supabaseService.testConnection();
    console.log('🔍 Connection test result:', testResult);
    
    if (testResult.ok) {
      console.log('✅ Supabase connection successful!');
      console.log('- Has data:', testResult.hasData);
      
      // Test getting customers
      try {
        const customers = await supabaseService.getAllCustomers(5);
        console.log('✅ Customer retrieval test:', {
          success: customers.success,
          total: customers.total,
          error: customers.error
        });
        
        if (customers.success && customers.customers.length > 0) {
          console.log('📊 Sample customer:', {
            customerId: customers.customers[0].customerId,
            businessName: customers.customers[0].businessName,
            packageType: customers.customers[0].packageType,
            status: customers.customers[0].status
          });
        }
      } catch (error) {
        console.error('❌ Customer retrieval failed:', error.message);
      }
      
    } else {
      console.error('❌ Supabase connection failed:', testResult.error);
    }
    
  } catch (error) {
    console.error('💥 Direct test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Test if we can find customers by ID
async function testCustomerLookup() {
  console.log('\n🔍 TESTING: Customer Lookup');
  
  try {
    const supabaseService = createSupabaseService();
    await supabaseService.initialize();
    
    // Get all customers first to find valid IDs
    const allCustomers = await supabaseService.getAllCustomers(10);
    
    if (allCustomers.success && allCustomers.customers.length > 0) {
      const testCustomerId = allCustomers.customers[0].customerId;
      console.log(`🔍 Testing lookup for customer: ${testCustomerId}`);
      
      const customer = await supabaseService.findByCustomerId(testCustomerId);
      
      if (customer) {
        console.log('✅ Customer lookup successful:', {
          customerId: customer.customerId,
          businessName: customer.businessName,
          packageType: customer.packageType,
          status: customer.status
        });
      } else {
        console.log('❌ Customer not found');
      }
    } else {
      console.log('⚠️  No customers found for testing lookup');
    }
    
  } catch (error) {
    console.error('❌ Customer lookup test failed:', error.message);
  }
}

async function runTests() {
  console.log('🚀 STARTING: Direct Supabase Tests');
  console.log('='.repeat(50));
  
  await testSupabaseConnection();
  await testCustomerLookup();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 Direct Supabase Tests Complete');
}

if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testSupabaseConnection, testCustomerLookup };