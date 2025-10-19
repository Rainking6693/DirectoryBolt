/**
 * Check if progress data is actually being saved to the database
 */
const { createClient } = require('@supabase/supabase-js');

// Use the actual Supabase credentials from .env.local
const supabaseUrl = 'https://kolgqfjgncdwddziqloz.supabase.co';
const supabaseKey = 'sb_secret_h23g4IsA-mIMLrI1K7gZnA_PFd9HmZR';

if (!supabaseKey) {
  console.error('❌ No Supabase key found. Please set SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseProgress() {
  console.log('🔍 Checking database for progress data...\n');

  try {
    // Check the specific job from the logs
    const jobId = 'ff4d836a-4fad-4c3a-8582-a61669e6e947';
    
    console.log(`📊 Checking job: ${jobId}\n`);

    // 1. Check job status and metadata
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, status, metadata, created_at, updated_at')
      .eq('id', jobId)
      .single();

    if (jobError) {
      console.error('❌ Job query error:', jobError);
      return;
    }

    console.log('📋 Job Details:');
    console.log(`   Status: ${job.status}`);
    console.log(`   Created: ${job.created_at}`);
    console.log(`   Updated: ${job.updated_at}`);
    console.log(`   Metadata:`, JSON.stringify(job.metadata, null, 2));
    console.log();

    // 2. Check job_results for this job
    const { data: results, error: resultsError } = await supabase
      .from('job_results')
      .select('*')
      .eq('job_id', jobId);

    if (resultsError) {
      console.error('❌ Results query error:', resultsError);
      return;
    }

    console.log(`📈 Job Results (${results.length} entries):`);
    if (results.length === 0) {
      console.log('   ❌ No results found - this is the problem!');
    } else {
      results.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.directory_name}`);
        console.log(`      Status: ${result.status}`);
        console.log(`      Created: ${result.created_at}`);
        console.log();
      });
    }

    // 3. Check all recent jobs
    console.log('📊 Recent Jobs Summary:');
    const { data: allJobs, error: allJobsError } = await supabase
      .from('jobs')
      .select('id, status, customer_id, metadata')
      .order('created_at', { ascending: false })
      .limit(5);

    if (allJobsError) {
      console.error('❌ All jobs query error:', allJobsError);
      return;
    }

    allJobs.forEach((job, index) => {
      const meta = job.metadata || {};
      console.log(`   ${index + 1}. ${job.customer_id} - ${job.status}`);
      console.log(`      Progress: ${meta.directories_completed || 0}/${meta.directories_total || 0}`);
      console.log(`      Percentage: ${meta.progress_percentage || 0}%`);
      console.log();
    });

  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

checkDatabaseProgress().catch(console.error);
