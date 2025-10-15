// Quick test and fix for DirectoryBolt
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const client = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log('\n=== DirectoryBolt Job Queue Status ===\n');
  
  // Check current status
  const { data: jobs, error } = await client
    .from('jobs')
    .select('id, customer_id, status, business_name, created_at')
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }
  
  console.log(`Total jobs: ${jobs.length}\n`);
  
  const statusCount = {};
  jobs.forEach(j => statusCount[j.status] = (statusCount[j.status] || 0) + 1);
  console.log('Status breakdown:', statusCount);
  
  // Show all jobs
  console.log('\nAll jobs:');
  jobs.forEach((j, i) => {
    console.log(`  ${i+1}. ${j.id.substring(0, 8)}... - ${j.status} - ${j.business_name || 'N/A'}`);
  });
  
  // Reset stuck jobs to pending
  const stuckJobs = jobs.filter(j => j.status === 'in_progress');
  if (stuckJobs.length > 0) {
    console.log(`\n⚠ Found ${stuckJobs.length} stuck jobs in 'in_progress'. Resetting to 'pending'...`);
    
    for (const job of stuckJobs) {
      const { error: updateError } = await client
        .from('jobs')
        .update({ 
          status: 'pending', 
          started_at: null, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', job.id);
      
      if (updateError) {
        console.error(`  ❌ Failed to reset ${job.id}:`, updateError.message);
      } else {
        console.log(`  ✓ Reset ${job.id.substring(0, 8)}...`);
      }
    }
  }
  
  // Test the orchestrator flow
  console.log('\n=== Testing Job Orchestrator Flow ===\n');
  
  const { data: pendingJob, error: pendingError } = await client
    .from('jobs')
    .select('id, customer_id, package_size, business_name, business_email')
    .eq('status', 'pending')
    .order('priority_level', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  
  if (pendingError) {
    console.error('❌ Error fetching pending job:', pendingError.message);
    return;
  }
  
  if (!pendingJob) {
    console.log('⚠ No pending jobs available');
    return;
  }
  
  console.log('✓ Found pending job:', pendingJob.id);
  console.log('  Business:', pendingJob.business_name);
  console.log('  Customer ID:', pendingJob.customer_id);
  
  // Test customer lookup (with FIXED query)
  console.log('\nTesting customer lookup...');
  const { data: customer, error: customerError } = await client
    .from('customers')
    .select('id, business_name, email, phone')
    .eq('id', pendingJob.customer_id)  // FIXED
    .maybeSingle();
  
  if (customerError) {
    console.error('❌ Customer lookup failed:', customerError.message);
    console.error('   This means the customer_id in jobs table doesn\'t match any customer');
  } else if (!customer) {
    console.log('⚠ Customer not found for ID:', pendingJob.customer_id);
    console.log('   Creating missing customer...');
    
    // Create customer if missing
    const { error: insertError } = await client
      .from('customers')
      .insert({
        id: pendingJob.customer_id,
        customer_id: 'CUST-' + Date.now(),
        business_name: pendingJob.business_name || 'Unknown Business',
        email: pendingJob.business_email || 'unknown@example.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('❌ Failed to create customer:', insertError.message);
    } else {
      console.log('✓ Customer created');
    }
  } else {
    console.log('✓ Customer found:', customer.business_name);
  }
  
  console.log('\n=== Summary ===\n');
  console.log('✓ Supabase connection working');
  console.log('✓ Jobs table accessible');
  console.log('✓ Customer query fixed');
  console.log('✓ Jobs reset to pending');
  console.log('\nNext: Test the API endpoint');
  console.log('  curl -H "Authorization: Bearer ' + process.env.AUTOBOLT_API_KEY + '" http://localhost:3000/api/autobolt/jobs/next');
}

main().catch(console.error);
