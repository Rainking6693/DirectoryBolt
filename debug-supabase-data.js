#!/usr/bin/env node

/**
 * DEBUG: Test Supabase data mapping directly
 */

require('dotenv').config({ path: '.env' });
const { createSupabaseService } = require('./lib/services/supabase');

async function debugSupabaseData() {
  console.log('🔍 DEBUGGING SUPABASE DATA MAPPING');
  console.log('=' .repeat(50));
  
  try {
    const supabaseService = createSupabaseService();
    
    // Test connection
    console.log('\n1. Testing Supabase connection...');
    const healthCheck = await supabaseService.testConnection();
    console.log('Health check result:', JSON.stringify(healthCheck, null, 2));
    
    // Get raw customer data
    console.log('\n2. Getting customers via service...');
    const result = await supabaseService.getAllCustomers(3);
    
    if (result.success) {
      console.log(`✅ Found ${result.customers.length} customers`);
      
      result.customers.forEach((customer, index) => {
        console.log(`\n--- Customer ${index + 1} ---`);
        console.log(`Customer ID: ${customer.customerId}`);
        console.log(`Business Name: ${customer.businessName}`);
        console.log(`Email: ${customer.email}`);
        console.log(`Phone: ${customer.phone}`);
        console.log(`Website: ${customer.website}`);
        console.log(`Address: ${customer.address}`);
        console.log(`City: ${customer.city}`);
        console.log(`State: ${customer.state}`);
        console.log(`ZIP: ${customer.zip}`);
        console.log(`Package: ${customer.packageType}`);
        console.log(`Status: ${customer.status}`);
      });
    } else {
      console.log('❌ Failed to get customers:', result.error);
    }
    
    // Compare service query with direct query
    console.log('\n2.5. Running identical query via service client...');
    await supabaseService.initialize();
    
    const { data: serviceData, error: serviceError } = await supabaseService.client
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);
      
    if (serviceError) {
      console.log('❌ Service client query error:', serviceError);
    } else {
      console.log('\n📋 SERVICE CLIENT RAW DATA:');
      serviceData.forEach((record, index) => {
        console.log(`\n--- Service Raw Record ${index + 1} ---`);
        console.log(`ID: ${record.id}`);
        console.log(`Customer ID: ${record.customer_id}`);
        console.log(`Business Name: ${record.business_name}`);
        console.log(`Email: ${record.email}`);
        console.log(`Phone: ${record.phone}`);
        console.log(`Address: ${record.address}`);
        console.log(`Package: ${record.package_type}`);
      });
    }
    
    // Test direct Supabase client
    console.log('\n3. Testing direct Supabase client...');
    await supabaseService.initialize();
    
    const { data: rawData, error } = await supabaseService.client
      .from('customers')
      .select('*')
      .limit(3);
      
    if (error) {
      console.log('❌ Direct query error:', error);
    } else {
      console.log('\n📋 RAW SUPABASE DATA:');
      rawData.forEach((record, index) => {
        console.log(`\n--- Raw Record ${index + 1} ---`);
        console.log(JSON.stringify(record, null, 2));
      });
    }
    
  } catch (error) {
    console.error('💥 Debug failed:', error.message);
    console.error(error.stack);
  }
}

debugSupabaseData();