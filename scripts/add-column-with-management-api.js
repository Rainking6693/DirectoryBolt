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

async function addColumnWithManagementAPI() {
  console.log(`📋 Project ID: ${projectId}`);
  console.log('🚀 Adding directories_allocated column using Management API...');

  try {
    // Create the column using SQL
    const addColumnSQL = `
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS directories_allocated INTEGER DEFAULT 0;
    `;

    console.log('📝 Executing SQL to add column...');
    
    // Try to execute the SQL using the Management API
    const { data, error } = await supabase.rpc('exec_sql', { sql: addColumnSQL });
    
    if (error) {
      console.log('❌ Error executing SQL:', error);
      console.log('\n📋 MANUAL STEP REQUIRED:');
      console.log('Please run this SQL in your Supabase SQL Editor:');
      console.log('ALTER TABLE customers ADD COLUMN directories_allocated INTEGER DEFAULT 0;');
      console.log('\nThen run this script again to update the values.');
      return;
    }
    
    console.log('✅ Column added successfully');
    
    // Now update the customer data
    console.log('\n📝 Updating customer directory allocations...');
    
    const packageAllocations = {
      'starter': 25,
      'growth': 75,
      'professional': 150,
      'enterprise': 500
    };
    
    // Get current customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('customer_id, business_name, package_type');
    
    if (customersError) {
      console.log('❌ Error fetching customers:', customersError);
      return;
    }
    
    console.log(`📋 Found ${customers.length} customers to update:`);
    
    for (const customer of customers) {
      const allocation = packageAllocations[customer.package_type] || 25;
      
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
    }
    
    console.log('\n🎉 Column addition and data update completed!');
    
    // Verify the updates
    console.log('\n📊 Verifying updates...');
    const { data: updatedCustomers, error: fetchError } = await supabase
      .from('customers')
      .select('customer_id, business_name, package_type, directories_allocated, status')
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
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error during column addition:', error);
    console.log('\n📋 MANUAL STEP REQUIRED:');
    console.log('Please run this SQL in your Supabase SQL Editor:');
    console.log('ALTER TABLE customers ADD COLUMN directories_allocated INTEGER DEFAULT 0;');
    console.log('\nThen run this script again to update the values.');
  }
}

addColumnWithManagementAPI();
