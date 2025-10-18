/**
 * Check both job_results and autobolt_submission_logs tables
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kolgqfjgncdwddziqloz.supabase.co';
const supabaseKey = 'sb_secret_h23g4IsA-mIMLrI1K7gZnA_PFd9HmZR';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBothTables() {
  console.log('🔍 Checking both tables for data...\n');

  const jobId = 'ff4d836a-4fad-4c3a-8582-a61669e6e947';

  try {
    // Check job_results table
    console.log('📊 Job Results Table:');
    const { data: jobResults, error: jobResultsError } = await supabase
      .from('job_results')
      .select('*')
      .eq('job_id', jobId);

    if (jobResultsError) {
      console.error('❌ Job results error:', jobResultsError);
    } else {
      console.log(`   Found ${jobResults.length} records`);
      jobResults.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.directory_name} - ${result.status}`);
      });
    }

    console.log('\n📊 Submission Logs Table:');
    const { data: submissionLogs, error: logsError } = await supabase
      .from('autobolt_submission_logs')
      .select('*')
      .eq('job_id', jobId);

    if (logsError) {
      console.error('❌ Submission logs error:', logsError);
    } else {
      console.log(`   Found ${submissionLogs.length} records`);
      submissionLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.directory_name} - ${log.success ? 'Success' : 'Failed'}`);
        if (log.error_message) {
          console.log(`      Error: ${log.error_message}`);
        }
      });
    }

    console.log('\n🎯 Summary:');
    console.log(`   Job Results: ${jobResults?.length || 0} records`);
    console.log(`   Submission Logs: ${submissionLogs?.length || 0} records`);
    
    if (submissionLogs && submissionLogs.length > 0) {
      console.log('   ✅ Submission Activity dashboard should now show data!');
    } else {
      console.log('   ❌ Submission Activity dashboard will still show 0s');
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkBothTables().catch(console.error);
