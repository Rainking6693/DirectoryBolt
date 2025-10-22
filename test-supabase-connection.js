const { SupabaseService } = require('./lib/services/supabase');
const { createClient } = require('@supabase/supabase-js');

async function testSupabaseConnection() {
  console.log('🔄 Testing Supabase Connection...');
  
  try {
    // Test 1: Direct connection
    console.log('\n1. Testing direct Supabase client connection...');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables');
      console.log('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
      console.log('SUPABASE_SERVICE_KEY:', !!supabaseServiceKey);
      return;
    }
    
    const client = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await client.from('customers').select('customer_id').limit(1);
    
    if (error) {
      console.error('❌ Direct connection failed:', error.message);
    } else {
      console.log('✅ Direct connection successful');
      console.log('   Customers table accessible:', data !== null);
    }
    
    // Test 2: Service class connection
    console.log('\n2. Testing SupabaseService class...');
    const service = new SupabaseService();
    await service.initialize();
    
    const connectionTest = await service.testConnection();
    if (connectionTest.ok) {
      console.log('✅ Service connection successful');
      console.log('   Has existing data:', connectionTest.hasData);
    } else {
      console.error('❌ Service connection failed:', connectionTest.error);
    }
    
    // Test 3: Customer ID generation
    console.log('\n3. Testing customer ID generation...');
    const customerId = service.generateCustomerId();
    console.log('✅ Generated customer ID:', customerId);
    console.log('   Valid format:', service.validateCustomerId(customerId));
    
    // Test 4: Test customer lookup
    console.log('\n4. Testing customer lookup...');
    const testCustomerIds = [
      'DIR-20250917-000001',
      'DIR-20250917-000002',
      'DIR-20250918-123456'
    ];
    
    for (const id of testCustomerIds) {
      const result = await service.getCustomerById(id);
      console.log(`   ${id}: ${result.found ? '✅ Found' : '❌ Not found'}`);
      if (result.found) {
        console.log(`     Name: ${result.customer.firstName} ${result.customer.lastName}`);
        console.log(`     Business: ${result.customer.businessName}`);
        console.log(`     Package: ${result.customer.packageType}`);
      }
    }
    
    // Test 5: Database schema validation
    console.log('\n5. Testing database schema...');
    const { data: tables, error: schemaError } = await client
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['customers', 'queue_history', 'customer_notifications']);
    
    if (schemaError) {
      console.error('❌ Schema validation failed:', schemaError.message);
    } else {
      const tableNames = tables.map(t => t.table_name);
      console.log('✅ Schema validation successful');
      console.log('   Tables found:', tableNames);
      console.log('   Required tables present:', 
        ['customers', 'queue_history', 'customer_notifications'].every(t => tableNames.includes(t))
      );
    }
    
    console.log('\n🎉 Supabase connection test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 5).join('\n')
    });
  }
}

// Run the test
require('dotenv').config({ path: '.env.local' });
testSupabaseConnection();