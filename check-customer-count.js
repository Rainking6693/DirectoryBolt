// Check customer count in database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkCustomerCount() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🔍 Checking customer count in database...');
    
    // Check total customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, business_name, email, status, package_type, created_at')
      .order('created_at', { ascending: false });

    if (customersError) {
      console.log('❌ Error fetching customers:', customersError);
      return;
    }

    console.log(`📋 Total customers in database: ${customers?.length || 0}`);
    
    if (customers && customers.length > 0) {
      console.log('\n📋 Recent customers:');
      customers.slice(0, 10).forEach((customer, index) => {
        console.log(`${index + 1}. ${customer.business_name} (${customer.customer_id || customer.id}) - ${customer.status || 'no status'}`);
      });
    }

    // Check customers with jobs
    const { data: customersWithJobs, error: jobsError } = await supabase
      .from('customers')
      .select(`
        id,
        business_name,
        email,
        status,
        package_type,
        created_at,
        jobs!inner(id, status, created_at)
      `)
      .order('created_at', { ascending: false });

    if (jobsError) {
      console.log('❌ Error fetching customers with jobs:', jobsError);
    } else {
      console.log(`\n📊 Customers with jobs: ${customersWithJobs?.length || 0}`);
    }

    // Check jobs count
    const { data: jobs, error: jobsCountError } = await supabase
      .from('jobs')
      .select('id, customer_id, business_name, status, created_at')
      .order('created_at', { ascending: false });

    if (jobsCountError) {
      console.log('❌ Error fetching jobs:', jobsCountError);
    } else {
      console.log(`📊 Total jobs in database: ${jobs?.length || 0}`);
      
      if (jobs && jobs.length > 0) {
        console.log('\n📋 Recent jobs:');
        jobs.slice(0, 5).forEach((job, index) => {
          console.log(`${index + 1}. ${job.business_name} (${job.customer_id}) - ${job.status}`);
        });
      }
    }

  } catch (err) {
    console.error('❌ Error:', err);
  }
}

checkCustomerCount();
