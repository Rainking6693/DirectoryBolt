/**
 * Clear test data from both tables
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kolgqfjgncdwddziqloz.supabase.co';
const supabaseKey = 'sb_secret_h23g4IsA-mIMLrI1K7gZnA_PFd9HmZR';

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearTestData() {
  console.log('🧹 Clearing test data...\n');

  const jobId = 'ff4d836a-4fad-4c3a-8582-a61669e6e947';

  try {
    // Clear job_results
    console.log('📊 Clearing job_results...');
    const { error: jobResultsError } = await supabase
      .from('job_results')
      .delete()
      .eq('job_id', jobId);

    if (jobResultsError) {
      console.error('❌ Error clearing job_results:', jobResultsError);
    } else {
      console.log('✅ Cleared job_results');
    }

    // Clear autobolt_submission_logs
    console.log('📊 Clearing autobolt_submission_logs...');
    const { error: logsError } = await supabase
      .from('autobolt_submission_logs')
      .delete()
      .eq('job_id', jobId);

    if (logsError) {
      console.error('❌ Error clearing submission logs:', logsError);
    } else {
      console.log('✅ Cleared submission logs');
    }

    console.log('\n🎯 Test data cleared. Now the Railway worker should populate with real directory names.');

  } catch (error) {
    console.error('❌ Clear failed:', error);
  }
}

clearTestData().catch(console.error);

