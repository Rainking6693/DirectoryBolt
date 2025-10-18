/**
 * Check the autobolt_submission_logs table
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kolgqfjgncdwddziqloz.supabase.co';
const supabaseKey = 'sb_secret_h23g4IsA-mIMLrI1K7gZnA_PFd9HmZR';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSubmissionLogsTable() {
  console.log('🔍 Checking autobolt_submission_logs table...\n');

  try {
    // Check if the table exists
    const { data, error } = await supabase
      .from('autobolt_submission_logs')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error accessing autobolt_submission_logs:', error);
      console.log('\n🔧 This table might not exist');
      return;
    }

    console.log('✅ autobolt_submission_logs table exists');
    console.log(`📊 Found ${data.length} records`);

    if (data.length > 0) {
      console.log('📋 Sample record:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('📋 Table is empty - this explains why Submission Activity shows 0s');
    }

    // Check the table schema by trying to insert a test record
    const testData = {
      customer_id: 'DB-2025-56MKDC',
      job_id: 'ff4d836a-4fad-4c3a-8582-a61669e6e947',
      directory_name: 'Test Directory',
      action: 'submission_attempt',
      timestamp: new Date().toISOString(),
      success: false,
      error_message: 'Test error'
    };

    console.log('\n📤 Testing insert to autobolt_submission_logs:');
    console.log(JSON.stringify(testData, null, 2));

    const { data: insertData, error: insertError } = await supabase
      .from('autobolt_submission_logs')
      .insert([testData])
      .select();

    if (insertError) {
      console.error('❌ Insert failed:', insertError);
    } else {
      console.log('✅ Insert successful!');
      console.log('📊 Inserted data:', JSON.stringify(insertData, null, 2));
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkSubmissionLogsTable().catch(console.error);
