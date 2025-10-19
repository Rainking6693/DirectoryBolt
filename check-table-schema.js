/**
 * Check the actual schema of job_results table
 */
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kolgqfjgncdwddziqloz.supabase.co';
const supabaseKey = 'sb_secret_h23g4IsA-mIMLrI1K7gZnA_PFd9HmZR';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableSchema() {
  console.log('🔍 Checking job_results table schema...\n');

  try {
    // Try to get table info by querying with minimal data
    const { data, error } = await supabase
      .from('job_results')
      .select('*')
      .limit(0);

    if (error) {
      console.error('❌ Error accessing job_results table:', error);
      console.log('\n🔧 This suggests the table might not exist or have wrong permissions');
      return;
    }

    console.log('✅ job_results table exists and is accessible');

    // Try inserting with only basic columns
    const basicData = {
      job_id: 'ff4d836a-4fad-4c3a-8582-a61669e6e947',
      directory_name: 'Test Directory',
      status: 'failed'
    };

    console.log('\n📤 Testing insert with basic columns only:');
    console.log(JSON.stringify(basicData, null, 2));

    const { data: insertData, error: insertError } = await supabase
      .from('job_results')
      .insert([basicData])
      .select();

    if (insertError) {
      console.error('❌ Basic insert failed:', insertError);
      console.log('\n🔧 The table exists but has a different schema than expected');
    } else {
      console.log('✅ Basic insert successful!');
      console.log('📊 Inserted data:', JSON.stringify(insertData, null, 2));
    }

  } catch (error) {
    console.error('❌ Schema check failed:', error);
  }
}

checkTableSchema().catch(console.error);

