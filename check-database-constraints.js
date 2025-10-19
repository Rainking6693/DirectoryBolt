/**
 * Check for database constraints or triggers that might be deleting data
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kolgqfjgncdwddziqloz.supabase.co';
const supabaseKey = 'sb_secret_h23g4IsA-mIMLrI1K7gZnA_PFd9HmZR';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseConstraints() {
  console.log('🔍 Checking database constraints and triggers...\n');

  try {
    // Check if we can insert a simple test record
    console.log('📤 Testing simple insert to job_results...');
    const testJobResult = {
      job_id: 'ff4d836a-4fad-4c3a-8582-a61669e6e947',
      directory_name: 'Test Constraint Check',
      status: 'failed',
      response_log: {},
      submitted_at: null,
      retry_count: 0
    };

    const { data: insertData, error: insertError } = await supabase
      .from('job_results')
      .insert([testJobResult])
      .select();

    if (insertError) {
      console.error('❌ Job results insert failed:', insertError);
    } else {
      console.log('✅ Job results insert successful:', insertData);
      
      // Check if it's still there after 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: verifyData, error: verifyError } = await supabase
        .from('job_results')
        .select('*')
        .eq('job_id', 'ff4d836a-4fad-4c3a-8582-a61669e6e947')
        .eq('directory_name', 'Test Constraint Check');

      if (verifyError) {
        console.error('❌ Verify query failed:', verifyError);
      } else if (verifyData.length === 0) {
        console.log('❌ Data was deleted! There might be a trigger or constraint removing it.');
      } else {
        console.log('✅ Data still exists:', verifyData);
      }
    }

    // Test submission logs
    console.log('\n📤 Testing simple insert to autobolt_submission_logs...');
    const testSubmissionLog = {
      customer_id: 'DB-2025-56MKDC',
      job_id: 'ff4d836a-4fad-4c3a-8582-a61669e6e947',
      directory_name: 'Test Constraint Check',
      action: 'submission_attempt',
      timestamp: new Date().toISOString(),
      success: false,
      error_message: 'Test constraint check'
    };

    const { data: logInsertData, error: logInsertError } = await supabase
      .from('autobolt_submission_logs')
      .insert([testSubmissionLog])
      .select();

    if (logInsertError) {
      console.error('❌ Submission logs insert failed:', logInsertError);
    } else {
      console.log('✅ Submission logs insert successful:', logInsertData);
      
      // Check if it's still there after 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: logVerifyData, error: logVerifyError } = await supabase
        .from('autobolt_submission_logs')
        .select('*')
        .eq('job_id', 'ff4d836a-4fad-4c3a-8582-a61669e6e947')
        .eq('directory_name', 'Test Constraint Check');

      if (logVerifyError) {
        console.error('❌ Log verify query failed:', logVerifyError);
      } else if (logVerifyData.length === 0) {
        console.log('❌ Log data was deleted! There might be a trigger or constraint removing it.');
      } else {
        console.log('✅ Log data still exists:', logVerifyData);
      }
    }

  } catch (error) {
    console.error('❌ Constraint check failed:', error);
  }
}

checkDatabaseConstraints().catch(console.error);


