/**
 * Test Extension with Test Customer IDs
 */

const axios = require('axios');

const PRODUCTION_BASE_URL = 'https://directorybolt.netlify.app';

async function testWithTestCustomer() {
  console.log('🔍 TESTING: Extension with Test Customer');
  
  // Test with TEST- prefix (should work without database)
  console.log('\n1. Testing with TEST- prefix:');
  try {
    const response = await axios.post(`${PRODUCTION_BASE_URL}/api/extension/secure-validate`, {
      customerId: 'TEST-12345',
      extensionVersion: '1.0.0'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Extension-ID': 'test'
      },
      timeout: 10000
    });
    
    console.log('✅ Response status:', response.status);
    console.log('✅ Response data:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('❌ Response status:', error.response.status);
      console.log('❌ Response data:', error.response.data);
    } else {
      console.error('❌ Request failed:', error.message);
    }
  }
  
  // Test with specific test ID mentioned in code
  console.log('\n2. Testing with DIR-2025-001234:');
  try {
    const response = await axios.post(`${PRODUCTION_BASE_URL}/api/extension/secure-validate`, {
      customerId: 'DIR-2025-001234',
      extensionVersion: '1.0.0'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Extension-ID': 'test'
      },
      timeout: 10000
    });
    
    console.log('✅ Response status:', response.status);
    console.log('✅ Response data:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('❌ Response status:', error.response.status);
      console.log('❌ Response data:', error.response.data);
    } else {
      console.error('❌ Request failed:', error.message);
    }
  }
  
  // Also test via Netlify function
  console.log('\n3. Testing via Netlify function with TEST- prefix:');
  try {
    const response = await axios.post(`${PRODUCTION_BASE_URL}/.netlify/functions/extension-secure-validate`, {
      customerId: 'TEST-12345',
      extensionVersion: '1.0.0'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Extension-ID': 'test'
      },
      timeout: 10000
    });
    
    console.log('✅ Netlify Response status:', response.status);
    console.log('✅ Netlify Response data:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('❌ Netlify Response status:', error.response.status);
      console.log('❌ Netlify Response data:', error.response.data);
    } else {
      console.error('❌ Netlify Request failed:', error.message);
    }
  }
}

if (require.main === module) {
  testWithTestCustomer().catch(console.error);
}

module.exports = { testWithTestCustomer };