// Test Add Customer functionality with proper authentication
const axios = require('axios');

async function testAddCustomerWithAuth() {
  console.log('🧪 Testing Add Customer with proper authentication...');
  
  try {
    // Step 1: Login to get session cookie
    console.log('🔐 Logging in to get session cookie...');
    const loginResponse = await axios.post('http://localhost:3000/api/staff/login', {
      username: 'staffuser',
      password: 'DirectoryBoltStaff2025!'
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.error);
    }
    
    console.log('✅ Login successful');
    
    // Extract cookies from login response
    const cookies = loginResponse.headers['set-cookie'];
    if (!cookies) {
      throw new Error('No session cookie received from login');
    }
    
    // Step 2: Get CSRF token
    console.log('🔐 Getting CSRF token...');
    const csrfResponse = await axios.get('http://localhost:3000/api/csrf-token', {
      withCredentials: true,
      headers: {
        'Cookie': cookies.join('; ')
      }
    });
    
    if (!csrfResponse.data.success) {
      throw new Error('Failed to get CSRF token: ' + csrfResponse.data.error);
    }
    
    console.log('✅ CSRF token received');
    
    // Step 3: Create customer with proper authentication
    console.log('👤 Creating customer...');
    const customerData = {
      business_name: 'Test Business With Auth',
      email: 'test@example.com',
      phone: '555-123-4567',
      website: 'https://testbusiness.com',
      address: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      zip: '12345',
      package_size: 50
    };
    
    const createResponse = await axios.post('http://localhost:3000/api/staff/customers/create', customerData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfResponse.data.csrfToken,
        'Cookie': cookies.join('; ')
      }
    });
    
    if (!createResponse.data.success) {
      throw new Error('Customer creation failed: ' + createResponse.data.error);
    }
    
    console.log('✅ Customer created successfully!');
    console.log('📋 Response:', createResponse.data);
    
  } catch (error) {
    console.log('❌ Error details:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Headers:', error.response?.headers);
    console.log('Data:', error.response?.data);
    
    if (error.response?.data) {
      try {
        const errorData = typeof error.response.data === 'string' ? 
          JSON.parse(error.response.data) : error.response.data;
        console.log('Parsed error data:', errorData);
      } catch (e) {
        console.log('Could not parse error data as JSON');
      }
    }
  }
}

testAddCustomerWithAuth().catch(console.error);
