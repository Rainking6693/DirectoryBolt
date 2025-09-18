/**
 * Debug Database Schema
 * Check actual Supabase database schema to understand column names
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function debugDatabaseSchema() {
  console.log('🔍 Debugging Supabase Database Schema');
  console.log('=' .repeat(60));

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Query to get a sample record to see actual schema
    console.log('\n📋 Checking customers table schema...');
    
    // First, let's try to get any record with minimal selection
    const { data: samples, error: sampleError } = await supabase
      .from('customers')
      .select('*')
      .limit(3);

    if (sampleError) {
      console.error('❌ Error querying customers table:', sampleError);
      return;
    }

    if (samples && samples.length > 0) {
      console.log('✅ Found sample records');
      console.log('Available columns:');
      
      const firstRecord = samples[0];
      Object.keys(firstRecord).forEach(column => {
        console.log(`   - ${column}: ${typeof firstRecord[column]} (value: ${JSON.stringify(firstRecord[column])?.substring(0, 100)})`);
      });

      console.log(`\n📊 Total records found: ${samples.length}`);
      console.log('Sample customer IDs:');
      samples.forEach((record, index) => {
        console.log(`   ${index + 1}. ${record.customer_id || record.id || 'Unknown ID'}`);
      });

    } else {
      console.log('⚠️ No customer records found in database');
      
      // Let's check if table exists by trying to get table info
      console.log('\n🔍 Checking if customers table exists...');
      const { data: tableInfo, error: tableError } = await supabase
        .from('customers')
        .select('customer_id')
        .limit(1);
        
      if (tableError) {
        console.error('❌ Table access error:', tableError);
      } else {
        console.log('✅ Customers table exists but is empty');
      }
    }

  } catch (error) {
    console.error('💥 Database debug failed:', error);
  }
}

// Run the debug
debugDatabaseSchema()
  .then(() => {
    console.log('\n✅ Database schema debug completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Debug script crashed:', error);
    process.exit(1);
  });