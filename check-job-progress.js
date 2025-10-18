/**
 * Check Job Progress
 */
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mwufqpzxsbzrxehbqrpc.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkJobProgress() {
  console.log('🔍 Checking job progress...\n');

  // Get the most recent job
  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('❌ Error fetching jobs:', error);
    return;
  }

  if (!jobs || jobs.length === 0) {
    console.log('No jobs found');
    return;
  }

  console.log(`📊 Recent Jobs (${jobs.length}):\n`);
  
  jobs.forEach((job, index) => {
    console.log(`${index + 1}. Job ID: ${job.id}`);
    console.log(`   Customer: ${job.customer_id}`);
    console.log(`   Business: ${job.business_name}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Package Size: ${job.package_size}`);
    console.log(`   Priority: ${job.priority_level}`);
    console.log(`   Created: ${new Date(job.created_at).toLocaleString()}`);
    
    if (job.metadata) {
      const meta = typeof job.metadata === 'string' ? JSON.parse(job.metadata) : job.metadata;
      console.log(`   Progress: ${meta.directories_completed || 0} completed, ${meta.directories_failed || 0} failed`);
      console.log(`   Percentage: ${meta.progress_percentage || 0}%`);
    }
    console.log('');
  });

  // Get job results for the most recent in-progress job
  const inProgressJob = jobs.find(j => j.status === 'in_progress');
  if (inProgressJob) {
    console.log(`\n📋 Results for in-progress job ${inProgressJob.id}:\n`);
    
    const { data: results, error: resultsError } = await supabase
      .from('job_results')
      .select('*')
      .eq('job_id', inProgressJob.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (resultsError) {
      console.error('❌ Error fetching results:', resultsError);
    } else if (results && results.length > 0) {
      results.forEach((result, index) => {
        console.log(`${index + 1}. ${result.directory_name}`);
        console.log(`   Status: ${result.status}`);
        console.log(`   Message: ${result.message || 'N/A'}`);
        console.log(`   Time: ${new Date(result.created_at).toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('No results yet for this job');
    }
  }
}

checkJobProgress().catch(console.error);
