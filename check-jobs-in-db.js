// Check if there are any jobs in the Supabase database
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJobs() {
  console.log('🔍 Checking jobs in database...\n');
  
  // Check all jobs
  const { data: allJobs, error: allError } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (allError) {
    console.error('❌ Error fetching jobs:', allError);
    return;
  }
  
  console.log(`📊 Total recent jobs: ${allJobs.length}\n`);
  
  if (allJobs.length === 0) {
    console.log('⚠️  NO JOBS FOUND in the database!');
    console.log('   The worker is polling but there are no jobs to process.');
    return;
  }
  
  // Show job details
  allJobs.forEach((job, i) => {
    console.log(`Job ${i + 1}:`);
    console.log(`  ID: ${job.id}`);
    console.log(`  Customer: ${job.customer_id}`);
    console.log(`  Status: ${job.status}`);
    console.log(`  Package Size: ${job.package_size}`);
    console.log(`  Created: ${job.created_at}`);
    console.log(`  Started: ${job.started_at || 'Not started'}`);
    console.log(`  Completed: ${job.completed_at || 'Not completed'}`);
    console.log('');
  });
  
  // Check pending jobs specifically
  const { data: pendingJobs, error: pendingError } = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'pending')
    .limit(5);
  
  if (pendingError) {
    console.error('❌ Error fetching pending jobs:', pendingError);
    return;
  }
  
  console.log(`\n🔄 Pending jobs: ${pendingJobs.length}`);
  
  if (pendingJobs.length === 0) {
    console.log('⚠️  No pending jobs available for the worker to pick up.');
  } else {
    console.log('✅ Pending jobs are available:');
    pendingJobs.forEach(job => {
      console.log(`   - ${job.id} (Customer: ${job.customer_id})`);
    });
  }
}

checkJobs().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});

