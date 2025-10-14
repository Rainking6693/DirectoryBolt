#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const STAFF_API_KEY = 'DirectoryBolt-Staff-2025-SecureKey';

async function testCustomerAndJobCreation() {
  console.log('Testing customer and job creation...\n');

  const customerData = {
    business_name: `Test Business ${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    phone: '555-1234',
    website: 'https://testbusiness.com',
    address: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zip: '12345',
    package_type: 'starter',
    directory_limit: 50
  };

  try {
    console.log('1. Creating customer...');
    const response = await axios.post(
      `${BASE_URL}/api/staff/customers/create`,
      customerData,
      {
        headers: {
          'X-Staff-Key': STAFF_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Response:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\n✅ Customer created successfully!');
      console.log('Customer ID:', response.data.data.id);
      console.log('Job ID:', response.data.data.job_id);
      
      if (response.data.data.job_id) {
        console.log('\n✅ Job was created!');
      } else {
        console.log('\n❌ No job was created!');
      }
    } else {
      console.log('\n❌ Customer creation failed:', response.data.error);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testCustomerAndJobCreation();

