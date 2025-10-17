/**
 * Reset stuck jobs from in_progress back to pending
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetStuckJobs() {
  try {
    console.log('🔍 Finding stuck jobs (status = in_progress)...');
    
    // Get all in_progress jobs
    const { data: stuckJobs, error: fetchError } = await supabase
      .from('jobs')
      .select('id, customer_id, status, created_at, updated_at')
      .eq('status', 'in_progress');

    if (fetchError) {
      console.error('❌ Error fetching stuck jobs:', fetchError);
      return;
    }

    console.log(`📊 Found ${stuckJobs.length} stuck jobs:`);
    stuckJobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.id} (${job.customer_id}) - Updated: ${job.updated_at}`);
    });

    if (stuckJobs.length === 0) {
      console.log('✅ No stuck jobs found!');
      return;
    }

    console.log();
    console.log('🔄 Resetting stuck jobs to pending status...');

    // Reset all stuck jobs to pending
    const { data: updatedJobs, error: updateError } = await supabase
      .from('jobs')
      .update({ 
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('status', 'in_progress')
      .select('id, customer_id, status');

    if (updateError) {
      console.error('❌ Error updating jobs:', updateError);
      return;
    }

    console.log(`✅ Successfully reset ${updatedJobs.length} jobs to pending status:`);
    updatedJobs.forEach((job, index) => {
      console.log(`${index + 1}. ${job.id} (${job.customer_id}) - Status: ${job.status}`);
    });

    console.log();
    console.log('🎯 Jobs are now available for the Railway worker to process!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

resetStuckJobs();
