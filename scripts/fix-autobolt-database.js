const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function executeDatabaseFix() {
  console.log('🔧 Executing AutoBolt database schema fix...\n');
  
  // Test basic connectivity first
  const { data: testData, error: testError } = await supabase
    .from('customers')
    .select('customer_id')
    .limit(1);
    
  if (testError) {
    console.error('❌ Cannot connect to database:', testError.message);
    return;
  }
  
  console.log('✅ Database connection successful\n');
  
  // Check current schema
  console.log('📋 Checking current schema...\n');
  
  // Check directory_submissions columns
  const { data: dirSub, error: dirSubError } = await supabase
    .from('directory_submissions')
    .select('*')
    .limit(1);
    
  if (dirSubError && dirSubError.message.includes('column')) {
    console.log('⚠️  directory_submissions table missing columns');
  } else {
    console.log('✅ directory_submissions table accessible');
  }
  
  // Check autobolt_processing_queue columns
  const { data: queue, error: queueError } = await supabase
    .from('autobolt_processing_queue')
    .select('*')
    .limit(1);
    
  if (queueError && queueError.message.includes('column')) {
    console.log('⚠️  autobolt_processing_queue table missing columns');
  } else {
    console.log('✅ autobolt_processing_queue table accessible');
  }
  
  console.log('\n📊 Database Schema Status:');
  console.log('================================');
  
  // Note: Supabase doesn't allow direct ALTER TABLE via client
  // The SQL must be executed in Supabase dashboard SQL editor
  
  console.log('\n⚠️  IMPORTANT: Database schema changes must be made in Supabase dashboard');
  console.log('\n📝 Instructions:');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Navigate to SQL Editor');
  console.log('3. Execute the SQL from: EXECUTE_AUTOBOLT_COLUMN_FIX.sql');
  console.log('4. Run this script again to verify the fix\n');
  
  // Try to insert test data to check if columns exist
  console.log('🧪 Testing column existence...\n');
  
  // Test directory_submissions insert
  const testDirSub = {
    customer_id: 'TEST-' + Date.now(),
    directory_name: 'Test Directory',
    submission_status: 'pending',
    directory_category: 'Business',
    directory_tier: 'standard',
    processing_time_seconds: 30
  };
  
  const { error: insertError1 } = await supabase
    .from('directory_submissions')
    .insert([testDirSub]);
    
  if (insertError1) {
    if (insertError1.message.includes('directory_category') || 
        insertError1.message.includes('directory_tier') ||
        insertError1.message.includes('processing_time_seconds')) {
      console.log('❌ directory_submissions missing required columns:');
      console.log('   - directory_category');
      console.log('   - directory_tier');
      console.log('   - processing_time_seconds');
    }
  } else {
    console.log('✅ directory_submissions has all required columns');
    // Clean up test data
    await supabase
      .from('directory_submissions')
      .delete()
      .eq('customer_id', testDirSub.customer_id);
  }
  
  // Test autobolt_processing_queue insert
  const testQueue = {
    customer_id: 'TEST-' + Date.now(),
    business_name: 'Test Business',
    email: 'test@example.com',
    package_type: 'growth',
    directory_limit: 100,
    priority_level: 2,
    status: 'queued',
    started_at: new Date().toISOString(),
    processed_by: 'test-script'
  };
  
  const { error: insertError2 } = await supabase
    .from('autobolt_processing_queue')
    .insert([testQueue]);
    
  if (insertError2) {
    if (insertError2.message.includes('started_at') || 
        insertError2.message.includes('processed_by') ||
        insertError2.message.includes('completed_at')) {
      console.log('❌ autobolt_processing_queue missing required columns:');
      console.log('   - started_at');
      console.log('   - completed_at');
      console.log('   - processed_by');
      console.log('   - error_message');
    }
  } else {
    console.log('✅ autobolt_processing_queue has all required columns');
    // Clean up test data
    await supabase
      .from('autobolt_processing_queue')
      .delete()
      .eq('customer_id', testQueue.customer_id);
  }
  
  console.log('\n================================');
  console.log('🏁 Schema check complete');
  console.log('\nIf you see ❌ errors above, execute the SQL fix in Supabase dashboard.');
}

executeDatabaseFix().catch(console.error);