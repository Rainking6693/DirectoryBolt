// Check job progress in the database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkJobProgress() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🔍 Checking job progress in database...');
    
    // Check jobs table
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (jobsError) {
      console.log('❌ Error fetching jobs:', jobsError);
      return;
    }

    console.log(`📋 Found ${jobs?.length || 0} jobs:`);
    jobs?.forEach((job, index) => {
      console.log(`\n${index + 1}. Job ${job.id}:`);
      console.log(`   Customer: ${job.customer_id}`);
      console.log(`   Business: ${job.business_name}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Package Size: ${job.package_size}`);
      console.log(`   Created: ${job.created_at}`);
      console.log(`   Started: ${job.started_at || 'Not started'}`);
      console.log(`   Completed: ${job.completed_at || 'Not completed'}`);
      console.log(`   Metadata:`, job.metadata);
    });

    // Check job_results table
    const { data: jobResults, error: resultsError } = await supabase
      .from('job_results')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (resultsError) {
      console.log('❌ Error fetching job results:', resultsError);
      return;
    }

    console.log(`\n📊 Found ${jobResults?.length || 0} job results:`);
    jobResults?.forEach((result, index) => {
      console.log(`\n${index + 1}. Result ${result.id}:`);
      console.log(`   Job ID: ${result.job_id}`);
      console.log(`   Directory: ${result.directory_name}`);
      console.log(`   Status: ${result.status}`);
      console.log(`   Created: ${result.created_at}`);
      console.log(`   Submitted: ${result.submitted_at || 'Not submitted'}`);
    });

    // Check if there are any in_progress jobs
    const { data: inProgressJobs, error: inProgressError } = await supabase
      .from('jobs')
      .select('*')
      .eq('status', 'in_progress');

    if (inProgressError) {
      console.log('❌ Error fetching in-progress jobs:', inProgressError);
      return;
    }

    console.log(`\n🔄 Found ${inProgressJobs?.length || 0} in-progress jobs:`);
    inProgressJobs?.forEach((job, index) => {
      console.log(`\n${index + 1}. In-Progress Job ${job.id}:`);
      console.log(`   Customer: ${job.customer_id}`);
      console.log(`   Business: ${job.business_name}`);
      console.log(`   Started: ${job.started_at}`);
      console.log(`   Metadata:`, job.metadata);
    });

  } catch (err) {
    console.error('❌ Error:', err);
  }
}

checkJobProgress();
