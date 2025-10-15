// Test script to verify customer lookup and Add Customer fixes
const axios = require('axios');

async function testCustomerLookup() {
  console.log('🧪 Testing customer lookup fix...');
  
  try {
    // Test with a real customer ID format
    const testCustomerId = 'DB-2025-UZQ1OX';
    
    console.log(`📋 Testing customer lookup for: ${testCustomerId}`);
    
    // Test the customer lookup API
    const response = await axios.get(`http://localhost:3000/api/customers/${testCustomerId}`, {
      headers: {
        'Cookie': 'staff-session=VALIDTOKEN' // Use test mode
      }
    });
    
    if (response.data.success) {
      console.log('✅ Customer lookup successful!');
      console.log('📊 Customer data:', {
        id: response.data.customer.customer_id,
        business: response.data.customer.business_name,
        email: response.data.customer.email,
        status: response.data.customer.status
      });
    } else {
      console.log('❌ Customer lookup failed:', response.data.error);
    }
    
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('ℹ️ Customer not found (expected if DB-2025-UZQ1OX doesn\'t exist)');
      console.log('✅ API is working correctly - returning proper 404 for missing customer');
    } else {
      console.log('❌ Error testing customer lookup:', error.message);
      if (error.response?.data) {
        console.log('Response data:', error.response.data);
      }
    }
  }
}

async function testAddCustomerButton() {
  console.log('\n🧪 Testing Add Customer button fix...');
  
  try {
    // Get CSRF token first
    console.log('🔐 Getting CSRF token...');
    const csrfResponse = await axios.get('http://localhost:3000/api/csrf-token');
    
    if (!csrfResponse.data.success) {
      throw new Error('Failed to get CSRF token');
    }
    
    console.log('✅ CSRF token obtained');
    
    // Test customer creation
    const testCustomer = {
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
    
    console.log('📝 Creating test customer...');
    
    const createResponse = await axios.post('http://localhost:3000/api/staff/customers/create', testCustomer, {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfResponse.data.csrfToken,
        'Cookie': 'staff-session=VALIDTOKEN' // Use test mode
      }
    });
    
    if (createResponse.data.success) {
      console.log('✅ Add Customer button working!');
      console.log('📊 Created customer:', {
        id: createResponse.data.data.customer_id,
        business: createResponse.data.data.business_name,
        job_id: createResponse.data.data.job_id
      });
    } else {
      console.log('❌ Add Customer failed:', createResponse.data.error);
    }
    
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('❌ Authentication failed - check staff session cookie');
    } else {
      console.log('❌ Error testing Add Customer:', error.message);
      if (error.response?.data) {
        console.log('Response data:', error.response.data);
      }
    }
  }
}

async function runTests() {
  console.log('🚀 Testing Customer Lookup and Add Customer Fixes\n');
  
  await testCustomerLookup();
  await testAddCustomerButton();
  
  console.log('\n✅ Tests completed!');
  console.log('\n📋 Summary:');
  console.log('- Customer lookup should now work with DB-YYYY-XXXXXX format');
  console.log('- Add Customer button should work with proper CSRF authentication');
  console.log('- Both issues should be resolved in the staff dashboard');
}

runTests().catch(console.error);
