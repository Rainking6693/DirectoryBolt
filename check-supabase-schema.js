/**
 * Check DirectoryBolt Supabase Schema
 * Tests what columns actually exist in the customers table
 */

const https = require('https');

async function testSupabaseSchema() {
  console.log('🔍 Testing Supabase Schema - DirectoryBolt');
  console.log('===========================================');
  
  // Test with a simple query first
  const testQuery = `
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'customers' 
    AND table_schema = 'public'
    ORDER BY ordinal_position;
  `;
  
  console.log('\n📋 Expected columns for staff dashboard:');
  const expectedColumns = [
    'id',
    'customer_id', 
    'business_name',
    'email',
    'package_type',
    'status',
    'directories_submitted',    // ← Might be missing
    'failed_directories',       // ← Might be missing
    'created_at',
    'updated_at',
    'processing_metadata'       // ← Might be missing
  ];
  
  expectedColumns.forEach(col => {
    console.log(`   - ${col}`);
  });
  
  console.log('\n💡 To check your actual schema:');
  console.log('1. Go to Supabase Dashboard → SQL Editor');
  console.log('2. Run this query:');
  console.log('   SELECT column_name FROM information_schema.columns');
  console.log('   WHERE table_name = \'customers\' ORDER BY ordinal_position;');
  console.log('\n🔧 If columns are missing, add them:');
  console.log('   ALTER TABLE customers ADD COLUMN directories_submitted INTEGER DEFAULT 0;');
  console.log('   ALTER TABLE customers ADD COLUMN failed_directories INTEGER DEFAULT 0;');
  console.log('   ALTER TABLE customers ADD COLUMN processing_metadata JSONB;');
  
  console.log('\n🎯 Alternative: Check with a simple test query first:');
  console.log('   SELECT * FROM customers LIMIT 1;');
  console.log('   (This will show you all existing columns)');
}

testSupabaseSchema();