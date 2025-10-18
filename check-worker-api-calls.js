/**
 * Check if the Railway worker is actually calling the API
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kolgqfjgncdwddziqloz.supabase.co';
const supabaseKey = 'sb_secret_h23g4IsA-mIMLrI1K7gZnA_PFd9HmZR';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWorkerApiCalls() {
  console.log('🔍 Checking if Railway worker is calling the API...\n');

  const jobId = 'ff4d836a-4fad-4c3a-8582-a61669e6e947';

  try {
    // Check job_results for any new entries
    console.log('📊 Job Results Table:');
    const { data: jobResults, error: jobResultsError } = await supabase
      .from('job_results')
      .select('*')
      .eq('job_id', jobId);

    if (jobResultsError) {
      console.error('❌ Job results error:', jobResultsError);
    } else {
      console.log(`   Found ${jobResults.length} records`);
      if (jobResults.length > 0) {
        jobResults.forEach((result, index) => {
          console.log(`   ${index + 1}. ${result.directory_name} - ${result.status}`);
        });
      } else {
        console.log('   ❌ No records - worker is not calling the API');
      }
    }

    // Check submission logs
    console.log('\n📊 Submission Logs Table:');
    const { data: submissionLogs, error: logsError } = await supabase
      .from('autobolt_submission_logs')
      .select('*')
      .eq('job_id', jobId);

    if (logsError) {
      console.error('❌ Submission logs error:', logsError);
    } else {
      console.log(`   Found ${submissionLogs.length} records`);
      if (submissionLogs.length > 0) {
        submissionLogs.forEach((log, index) => {
          console.log(`   ${index + 1}. ${log.directory_name} - ${log.success ? 'Success' : 'Failed'}`);
        });
      } else {
        console.log('   ❌ No records - worker is not calling the API');
      }
    }

    // Check job metadata
    console.log('\n📊 Job Metadata:');
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('status, metadata, updated_at')
      .eq('id', jobId)
      .single();

    if (jobError) {
      console.error('❌ Job query error:', jobError);
    } else {
      console.log(`   Status: ${job.status}`);
      console.log(`   Updated: ${job.updated_at}`);
      console.log(`   Metadata:`, JSON.stringify(job.metadata, null, 2));
    }

    console.log('\n🎯 Analysis:');
    if (jobResults.length === 0 && submissionLogs.length === 0) {
      console.log('   ❌ Worker is NOT calling the API - this is the problem!');
      console.log('   🔧 The worker is processing directories but not sending results to the API');
    } else {
      console.log('   ✅ Worker is calling the API and saving data');
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkWorkerApiCalls().catch(console.error);
