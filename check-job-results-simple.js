// Check job results table structure and data
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkJobResults() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🔍 Checking job_results table...');
    
    // First, let's see what columns exist
    const { data: columns, error: columnsError } = await supabase
      .from('job_results')
      .select('*')
      .limit(1);

    if (columnsError) {
      console.log('❌ Error accessing job_results table:', columnsError);
      return;
    }

    console.log('📋 job_results table structure:', columns?.length > 0 ? Object.keys(columns[0]) : 'No data');

    // Check if there are any job results
    const { data: results, error: resultsError } = await supabase
      .from('job_results')
      .select('*');

    if (resultsError) {
      console.log('❌ Error fetching job results:', resultsError);
      return;
    }

    console.log(`📊 Found ${results?.length || 0} job results total`);
    
    if (results && results.length > 0) {
      console.log('\n📋 Sample job results:');
      results.slice(0, 3).forEach((result, index) => {
        console.log(`\n${index + 1}. Result ${result.id}:`);
        console.log(`   Job ID: ${result.job_id}`);
        console.log(`   Directory: ${result.directory_name}`);
        console.log(`   Status: ${result.submission_status || result.status}`);
        console.log(`   Submitted: ${result.submitted_at || 'Not submitted'}`);
      });
    } else {
      console.log('❌ No job results found - this explains why progress bars are not moving!');
      console.log('   The worker is not submitting to directories or not sending progress updates.');
    }

  } catch (err) {
    console.error('❌ Error:', err);
  }
}

checkJobResults();
