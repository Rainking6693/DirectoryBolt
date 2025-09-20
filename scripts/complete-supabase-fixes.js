const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseManagementApiKey = process.env.SUPABASE_MANAGEMENT_API_KEY;
const projectId = supabaseUrl ? supabaseUrl.split('.')[0].split('//')[1] : null;

if (!supabaseUrl || !supabaseServiceKey || !supabaseManagementApiKey || !projectId) {
  console.error('❌ Missing Supabase configuration. Ensure NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_MANAGEMENT_API_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function completeSupabaseFixes() {
  console.log(`📋 Project ID: ${projectId}`);
  console.log('🚀 Starting comprehensive Supabase fixes...');

  try {
    // Step 1: Add directories_allocated column to customers table
    console.log('\n📝 Step 1: Adding directories_allocated column...');
    
    // Check if column already exists by trying to select it
    const { data: testData, error: testError } = await supabase
      .from('customers')
      .select('directories_allocated')
      .limit(1);
    
    if (testError && testError.code === 'PGRST204') {
      console.log('❌ directories_allocated column does not exist. Please add it manually in Supabase SQL Editor:');
      console.log('ALTER TABLE customers ADD COLUMN directories_allocated INTEGER DEFAULT 0;');
      console.log('\nThen run this script again.');
      return;
    } else if (testError) {
      console.log('❌ Error checking column:', testError);
      return;
    }
    
    console.log('✅ directories_allocated column exists');

    // Step 2: Update customer directory allocations
    console.log('\n📝 Step 2: Updating customer directory allocations...');
    
    const packageAllocations = {
      'starter': 25,
      'growth': 75,
      'professional': 150,
      'enterprise': 500
    };
    
    // Get current customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('customer_id, business_name, package_type, directories_allocated');
    
    if (customersError) {
      console.log('❌ Error fetching customers:', customersError);
      return;
    }
    
    console.log(`📋 Found ${customers.length} customers to update:`);
    
    for (const customer of customers) {
      const allocation = packageAllocations[customer.package_type] || 25;
      
      if (customer.directories_allocated !== allocation) {
        const { error: updateError } = await supabase
          .from('customers')
          .update({ 
            directories_allocated: allocation,
            updated_at: new Date().toISOString()
          })
          .eq('customer_id', customer.customer_id);
        
        if (updateError) {
          console.log(`❌ Error updating ${customer.customer_id}:`, updateError);
        } else {
          console.log(`✅ Updated ${customer.customer_id} (${customer.package_type}) with ${allocation} directories`);
        }
      } else {
        console.log(`✅ ${customer.customer_id} already has correct allocation (${allocation})`);
      }
    }

    // Step 3: Verify AutoBolt tables exist
    console.log('\n📝 Step 3: Verifying AutoBolt tables...');
    
    const autoboltTables = [
      'autobolt_processing_queue',
      'autobolt_extension_status', 
      'autobolt_processing_history',
      'autobolt_submissions'
    ];
    
    for (const tableName of autoboltTables) {
      const { data, error } = await supabase
        .from(tableName)
        .select('id')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table ${tableName} does not exist or is not accessible`);
      } else {
        console.log(`✅ Table ${tableName} exists and is accessible`);
      }
    }

    // Step 4: Test customer data
    console.log('\n📝 Step 4: Testing customer data...');
    
    const { data: updatedCustomers, error: fetchError } = await supabase
      .from('customers')
      .select('customer_id, business_name, package_type, directories_allocated, status, directories_submitted')
      .order('created_at', { ascending: false });
    
    if (fetchError) {
      console.log('❌ Error fetching updated customers:', fetchError);
      return;
    }
    
    console.log('\n📊 Updated Customer Data:');
    updatedCustomers.forEach((customer, index) => {
      console.log(`${index + 1}. ${customer.customer_id} - ${customer.business_name}`);
      console.log(`   Package: ${customer.package_type}`);
      console.log(`   Status: ${customer.status}`);
      console.log(`   Allocated: ${customer.directories_allocated}`);
      console.log(`   Submitted: ${customer.directories_submitted}`);
      console.log('');
    });

    console.log('🎉 Supabase fixes completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Run the security fixes SQL script in Supabase SQL Editor');
    console.log('2. Test the Push to AutoBolt functionality');
    console.log('3. Verify customer progress tracking');

  } catch (error) {
    console.error('❌ Error during Supabase fixes:', error);
    process.exit(1);
  }
}

completeSupabaseFixes();
