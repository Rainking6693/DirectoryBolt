/**
 * Monitor database changes in real-time
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kolgqfjgncdwddziqloz.supabase.co';
const supabaseKey = 'sb_secret_h23g4IsA-mIMLrI1K7gZnA_PFd9HmZR';

const supabase = createClient(supabaseUrl, supabaseKey);

async function monitorDatabaseChanges() {
  console.log('👀 Monitoring database changes in real-time...\n');
  console.log('Press Ctrl+C to stop monitoring\n');

  const jobId = 'ff4d836a-4fad-4c3a-8582-a61669e6e947';
  let lastJobResultsCount = 0;
  let lastSubmissionLogsCount = 0;

  const checkChanges = async () => {
    try {
      // Check job_results
      const { data: jobResults, error: jobResultsError } = await supabase
        .from('job_results')
        .select('*')
        .eq('job_id', jobId);

      if (!jobResultsError) {
        const currentJobResultsCount = jobResults.length;
        if (currentJobResultsCount !== lastJobResultsCount) {
          console.log(`📊 Job Results changed: ${lastJobResultsCount} → ${currentJobResultsCount}`);
          if (currentJobResultsCount > 0) {
            jobResults.forEach((result, index) => {
              console.log(`   ${index + 1}. ${result.directory_name} - ${result.status}`);
            });
          }
          lastJobResultsCount = currentJobResultsCount;
        }
      }

      // Check submission logs
      const { data: submissionLogs, error: logsError } = await supabase
        .from('autobolt_submission_logs')
        .select('*')
        .eq('job_id', jobId);

      if (!logsError) {
        const currentSubmissionLogsCount = submissionLogs.length;
        if (currentSubmissionLogsCount !== lastSubmissionLogsCount) {
          console.log(`📊 Submission Logs changed: ${lastSubmissionLogsCount} → ${currentSubmissionLogsCount}`);
          if (currentSubmissionLogsCount > 0) {
            submissionLogs.forEach((log, index) => {
              console.log(`   ${index + 1}. ${log.directory_name} - ${log.success ? 'Success' : 'Failed'}`);
            });
          }
          lastSubmissionLogsCount = currentSubmissionLogsCount;
        }
      }

    } catch (error) {
      console.error('❌ Monitor error:', error);
    }
  };

  // Check every 2 seconds
  const interval = setInterval(checkChanges, 2000);
  
  // Initial check
  await checkChanges();

  // Handle cleanup
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping monitor...');
    clearInterval(interval);
    process.exit(0);
  });
}

monitorDatabaseChanges().catch(console.error);

