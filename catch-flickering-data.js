/**
 * Try to catch the flickering data
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kolgqfjgncdwddziqloz.supabase.co';
const supabaseKey = 'sb_secret_h23g4IsA-mIMLrI1K7gZnA_PFd9HmZR';

const supabase = createClient(supabaseUrl, supabaseKey);

async function catchFlickeringData() {
  console.log('🎯 Trying to catch flickering data...\n');

  const jobId = 'ff4d836a-4fad-4c3a-8582-a61669e6e947';

  // Check multiple times rapidly
  for (let i = 0; i < 10; i++) {
    try {
      console.log(`🔍 Check ${i + 1}/10...`);
      
      // Check job_results
      const { data: jobResults, error: jobResultsError } = await supabase
        .from('job_results')
        .select('*')
        .eq('job_id', jobId);

      if (!jobResultsError && jobResults.length > 0) {
        console.log(`✅ FOUND JOB RESULTS: ${jobResults.length} records`);
        jobResults.forEach((result, index) => {
          console.log(`   ${index + 1}. ${result.directory_name} - ${result.status}`);
        });
      }

      // Check submission logs
      const { data: submissionLogs, error: logsError } = await supabase
        .from('autobolt_submission_logs')
        .select('*')
        .eq('job_id', jobId);

      if (!logsError && submissionLogs.length > 0) {
        console.log(`✅ FOUND SUBMISSION LOGS: ${submissionLogs.length} records`);
        submissionLogs.forEach((log, index) => {
          console.log(`   ${index + 1}. ${log.directory_name} - ${log.success ? 'Success' : 'Failed'}`);
        });
      }

      if (jobResults.length === 0 && submissionLogs.length === 0) {
        console.log('   No data found');
      }

    } catch (error) {
      console.error('❌ Check error:', error);
    }

    // Wait 500ms between checks
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n🎯 Monitoring complete. If data appeared and disappeared, there might be a database trigger or constraint deleting it.');
}

catchFlickeringData().catch(console.error);
