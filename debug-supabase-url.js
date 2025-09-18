#!/usr/bin/env node

/**
 * DEBUG: Check which Supabase URLs are being used
 */

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const { createSupabaseService } = require('./lib/services/supabase');

async function debugSupabaseUrls() {
  console.log('🔍 DEBUGGING SUPABASE URLs AND CLIENTS');
  console.log('=' .repeat(50));
  
  console.log('\nEnvironment Variables:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('SUPABASE_SERVICE_KEY available:', !!process.env.SUPABASE_SERVICE_KEY);
  console.log('SUPABASE_SERVICE_ROLE_KEY available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  // Test service client configuration
  console.log('\n1. Testing Service Client Configuration...');
  const supabaseService = createSupabaseService();
  await supabaseService.initialize();
  
  console.log('Service client URL:', supabaseService.client.supabaseUrl);
  console.log('Service client key starts with:', supabaseService.client.supabaseKey.substring(0, 20) + '...');
  
  // Test direct client configuration 
  console.log('\n2. Testing Direct Client Configuration...');
  const directClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  );
  
  console.log('Direct client URL:', directClient.supabaseUrl);
  console.log('Direct client key starts with:', directClient.supabaseKey.substring(0, 20) + '...');
  
  // Compare client instances
  console.log('\n3. Client Comparison:');
  console.log('URLs match:', supabaseService.client.supabaseUrl === directClient.supabaseUrl);
  console.log('Keys match:', supabaseService.client.supabaseKey === directClient.supabaseKey);
  
  // Test actual database queries
  console.log('\n4. Testing Database Connections...');
  
  // Service client query
  const { data: serviceData, error: serviceError } = await supabaseService.client
    .from('customers')
    .select('id, customer_id, business_name')
    .limit(1);
    
  console.log('Service client result:', serviceError ? `Error: ${serviceError.message}` : `Success: ${serviceData.length} records`);
  if (serviceData && serviceData.length > 0) {
    console.log('Service sample ID:', serviceData[0].id);
  }
  
  // Direct client query
  const { data: directData, error: directError } = await directClient
    .from('customers')
    .select('id, customer_id, business_name')
    .limit(1);
    
  console.log('Direct client result:', directError ? `Error: ${directError.message}` : `Success: ${directData.length} records`);
  if (directData && directData.length > 0) {
    console.log('Direct sample ID:', directData[0].id);
  }
}

debugSupabaseUrls().catch(console.error);