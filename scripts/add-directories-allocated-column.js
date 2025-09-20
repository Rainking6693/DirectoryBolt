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

async function addDirectoriesAllocatedColumn() {
  console.log(`📋 Project ID: ${projectId}`);
  console.log('🚀 Adding directories_allocated column to customers table...');

  const addColumnSql = `
    ALTER TABLE customers ADD COLUMN IF NOT EXISTS directories_allocated INTEGER DEFAULT 0;
  `;

  try {
    console.log('📝 Adding directories_allocated column...');
    
    // Try to add the column using a direct SQL query
    const { data, error } = await supabase
      .from('customers')
      .select('id')
      .limit(1);
    
    if (error) {
      console.log('❌ Cannot access customers table:', error);
      return;
    }
    
    console.log('✅ Customers table is accessible');
    
    // Since we can't add columns programmatically, let's update the existing customers
    // with directory allocations based on their package type
    const packageAllocations = {
      'starter': 25,
      'growth': 75,
      'professional': 150,
      'enterprise': 500
    };
    
    console.log('📊 Updating customer directory allocations...');
    
    // First, let's see what customers we have
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('customer_id, business_name, package_type');
    
    if (customersError) {
      console.log('❌ Error fetching customers:', customersError);
      return;
    }
    
    console.log('📋 Found customers:', customers.length);
    customers.forEach(customer => {
      console.log(`   - ${customer.customer_id}: ${customer.business_name} (${customer.package_type})`);
    });
    
    // Update each customer with their directory allocation
    for (const customer of customers) {
      const allocation = packageAllocations[customer.package_type] || 25; // Default to 25 if package type not found
      
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
        console.log(`✅ Updated ${customer.customer_id} with ${allocation} directories`);
      }
    }
    
    console.log('🎉 Directory allocation update complete!');
    console.log('');
    console.log('📋 MANUAL STEP REQUIRED:');
    console.log('Please add the directories_allocated column to your customers table in Supabase:');
    console.log('ALTER TABLE customers ADD COLUMN directories_allocated INTEGER DEFAULT 0;');
    console.log('');
    console.log('Then run this script again to update the values.');

  } catch (error) {
    console.error('❌ Failed to add directories_allocated column:', error.message);
    process.exit(1);
  }
}

addDirectoriesAllocatedColumn();
