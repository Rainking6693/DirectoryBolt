/**
 * Check the job_results table schema
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kolgqfjgncdwddziqloz.supabase.co';
const supabaseKey = 'sb_secret_h23g4IsA-mIMLrI1K7gZnA_PFd9HmZR';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJobResultsSchema() {
  console.log('🔍 Checking job_results table schema...\n');

  try {
    // Check if job_results table exists and get its structure
    const { data: results, error } = await supabase
      .from('job_results')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error querying job_results:', error);
      return;
    }

    if (results && results.length > 0) {
      console.log('✅ job_results table exists');
      console.log('📋 Sample record structure:');
      console.log(JSON.stringify(results[0], null, 2));
    } else {
      console.log('📋 job_results table is empty');
    }

    // Try to get the specific job results without ordering by created_at
    const jobId = 'ff4d836a-4fad-4c3a-8582-a61669e6e947';
    const { data: jobResults, error: jobError } = await supabase
      .from('job_results')
      .select('*')
      .eq('job_id', jobId);

    if (jobError) {
      console.error('❌ Error querying job results:', jobError);
    } else {
      console.log(`\n📊 Job Results for ${jobId}:`);
      console.log(`Found ${jobResults.length} results`);
      
      if (jobResults.length > 0) {
        jobResults.forEach((result, index) => {
          console.log(`   ${index + 1}. ${result.directory_name || 'Unknown'}`);
          console.log(`      Status: ${result.status}`);
          console.log(`      Job ID: ${result.job_id}`);
          console.log();
        });
      } else {
        console.log('   ❌ No results found - this explains why progress isn\'t showing!');
      }
    }

  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

checkJobResultsSchema().catch(console.error);

