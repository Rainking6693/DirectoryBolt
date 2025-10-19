/**
 * Test database insert to job_results table
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kolgqfjgncdwddziqloz.supabase.co';
const supabaseKey = 'sb_secret_h23g4IsA-mIMLrI1K7gZnA_PFd9HmZR';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseInsert() {
  console.log('🧪 Testing database insert to job_results...\n');

  try {
    // Test data similar to what the API should insert
    const testData = {
      job_id: 'ff4d836a-4fad-4c3a-8582-a61669e6e947',
      directory_name: 'Test Directory',
      status: 'failed',
      directory_url: 'https://test.com',
      listing_url: null,
      response_log: null,
      rejection_reason: 'Test failure'
    };

    console.log('📤 Inserting test data:', JSON.stringify(testData, null, 2));
    console.log();

    const { data, error } = await supabase
      .from('job_results')
      .insert([testData])
      .select();

    if (error) {
      console.error('❌ Insert failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
    } else {
      console.log('✅ Insert successful!');
      console.log('📊 Inserted data:', JSON.stringify(data, null, 2));
    }

    // Check if the insert actually worked
    const { data: verifyData, error: verifyError } = await supabase
      .from('job_results')
      .select('*')
      .eq('job_id', 'ff4d836a-4fad-4c3a-8582-a61669e6e947');

    if (verifyError) {
      console.error('❌ Verify query failed:', verifyError);
    } else {
      console.log(`\n📋 Verification: Found ${verifyData.length} records`);
      if (verifyData.length > 0) {
        console.log('✅ Data is in the database!');
        console.log(JSON.stringify(verifyData, null, 2));
      } else {
        console.log('❌ Data was not inserted');
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDatabaseInsert().catch(console.error);


