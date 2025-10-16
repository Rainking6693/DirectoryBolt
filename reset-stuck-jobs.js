// Reset stuck jobs back to pending status
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function resetStuckJobs() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🔧 Resetting stuck jobs back to pending status...');
    
    // Find all jobs that are stuck in 'in_progress' status
    const { data: stuckJobs, error: stuckError } = await supabase
      .from('jobs')
      .select('id, customer_id, business_name, status, started_at, created_at')
      .eq('status', 'in_progress');

    if (stuckError) {
      console.log('❌ Error fetching stuck jobs:', stuckError);
      return;
    }

    console.log(`📋 Found ${stuckJobs?.length || 0} stuck jobs:`);
    stuckJobs?.forEach((job, index) => {
      console.log(`${index + 1}. ${job.business_name} (${job.customer_id}) - Started: ${job.started_at}`);
    });

    if (!stuckJobs || stuckJobs.length === 0) {
      console.log('✅ No stuck jobs found');
      return;
    }

    // Reset all stuck jobs back to 'pending' status
    const { data: resetJobs, error: resetError } = await supabase
      .from('jobs')
      .update({ 
        status: 'pending',
        started_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('status', 'in_progress')
      .select('id, customer_id, business_name');

    if (resetError) {
      console.log('❌ Error resetting jobs:', resetError);
      return;
    }

    console.log(`✅ Successfully reset ${resetJobs?.length || 0} jobs to pending status:`);
    resetJobs?.forEach((job, index) => {
      console.log(`${index + 1}. ${job.business_name} (${job.customer_id})`);
    });

    console.log('\n🎯 Jobs are now ready for the worker to process!');

  } catch (err) {
    console.error('❌ Error:', err);
  }
}

resetStuckJobs();
