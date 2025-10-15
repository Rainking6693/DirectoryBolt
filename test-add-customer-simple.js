// Simple test to debug Add Customer button issue
const axios = require('axios');

async function testAddCustomerDirectly() {
  console.log('🧪 Testing Add Customer directly...');
  
  try {
    // Test data
    const customerData = {
      business_name: 'Test Business Direct',
      email: 'test@example.com',
      phone: '555-123-4567',
      website: 'https://testbusiness.com',
      address: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      zip: '12345',
      package_size: 50
    };
    
    console.log('📝 Creating customer with data:', customerData);
    
    // Try without CSRF first to see the exact error
    const response = await axios.post('http://localhost:3000/api/staff/customers/create', customerData, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'staff-session=VALIDTOKEN' // Use test mode
      }
    });
    
    console.log('✅ Success!', response.data);
    
  } catch (error) {
    console.log('❌ Error details:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Headers:', error.response?.headers);
    console.log('Data:', error.response?.data);
    
    // Try to get more specific error info
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

testAddCustomerDirectly().catch(console.error);
