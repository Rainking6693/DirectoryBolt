#!/usr/bin/env node

/**
 * Test script to verify customer creation fixes
 * Tests both the "Create Test Customer" button and the "+Add Customer" button
 */

const axios = require('axios');

async function testCreateTestCustomer() {
  console.log('🧪 Testing "Create Test Customer" button fix...\n');
  
  try {
    console.log('Sending request to /api/staff/create-test-customer...');
    
    const response = await axios.post('http://localhost:3000/api/staff/create-test-customer', {}, {
      headers: {
        'Cookie': 'staff-session=VALIDTOKEN' // Use test mode
      }
    });
    
    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      console.log(`\n📋 Customer ID: ${response.data.data.customer_id}`);
      console.log(`📋 Job ID: ${response.data.data.job_id}`);
      console.log('\n✅ "Create Test Customer" button is working correctly!');
      return response.data.data;
    } else {
      console.log('\n❌ Unexpected response format');
      return null;
    }
    
  } catch (error) {
    console.log('❌ Error testing "Create Test Customer" button:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    return null;
  }
}

async function testAddCustomer() {
  console.log('\n🧪 Testing "+Add Customer" button fix...\n');
  
  try {
    // Test data
    const customerData = {
      business_name: 'Test Business Fix',
      email: 'test@example.com',
      phone: '555-123-4567',
      website: 'https://testbusiness.com',
      address: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      zip: '12345',
      package_size: 50
    };
    
    console.log('Sending request to /api/staff/customers/create...');
    console.log('Customer data:', JSON.stringify(customerData, null, 2));
    
    const response = await axios.post('http://localhost:3000/api/staff/customers/create', customerData, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'staff-session=VALIDTOKEN' // Use test mode
      }
    });
    
    console.log('✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      console.log(`\n📋 Customer ID: ${response.data.data.customer_id}`);
      console.log(`📋 Job ID: ${response.data.data.job_id}`);
      console.log('\n✅ "+Add Customer" button is working correctly!');
      return response.data.data;
    } else {
      console.log('\n❌ Unexpected response format');
      return null;
    }
    
  } catch (error) {
    console.log('❌ Error testing "+Add Customer" button:');
    console.log('Status:', error.response?.status);
    console.log('Data:', error.response?.data);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Testing DirectoryBolt Customer Creation Fixes\n');
  console.log('===============================================\n');
  
  // Test both functions
  const testCustomerResult = await testCreateTestCustomer();
  const addCustomerResult = await testAddCustomer();
  
  console.log('\n📋 Summary:');
  console.log('===========');
  console.log(`Create Test Customer: ${testCustomerResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Add Customer: ${addCustomerResult ? '✅ PASS' : '❌ FAIL'}`);
  
  if (testCustomerResult && addCustomerResult) {
    console.log('\n🎉 All tests passed! Both buttons should now work correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the error messages above.');
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testCreateTestCustomer, testAddCustomer };