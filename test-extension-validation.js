/**
 * Test Extension Validation Endpoint
 * Tests the secure validation endpoint for Chrome extension
 */

const axios = require('axios');

const PRODUCTION_BASE_URL = 'https://directorybolt.netlify.app';

async function testExtensionValidation() {
  console.log('🔍 TESTING: Extension Validation Endpoint');
  
  // Test 1: Valid format, non-existent customer
  console.log('\n1. Testing non-existent customer with valid format:');
  try {
    const response = await axios.post(`${PRODUCTION_BASE_URL}/api/extension/secure-validate`, {
      customerId: 'DB-TEST-123456',
      extensionVersion: '1.0.0'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Extension-ID': 'test'
      },
      timeout: 10000
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    } else {
      console.error('Request failed:', error.message);
    }
  }
  
  // Test 2: Invalid customer ID format
  console.log('\n2. Testing invalid customer ID format:');
  try {
    const response = await axios.post(`${PRODUCTION_BASE_URL}/api/extension/secure-validate`, {
      customerId: 'INVALID-123',
      extensionVersion: '1.0.0'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Extension-ID': 'test'
      },
      timeout: 10000
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    } else {
      console.error('Request failed:', error.message);
    }
  }
  
  // Test 3: Missing customer ID
  console.log('\n3. Testing missing customer ID:');
  try {
    const response = await axios.post(`${PRODUCTION_BASE_URL}/api/extension/secure-validate`, {
      extensionVersion: '1.0.0'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-Extension-ID': 'test'
      },
      timeout: 10000
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
  } catch (error) {
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    } else {
      console.error('Request failed:', error.message);
    }
  }
  
  // Test 4: OPTIONS request (CORS preflight)
  console.log('\n4. Testing CORS preflight (OPTIONS):');
  try {
    const response = await axios.options(`${PRODUCTION_BASE_URL}/api/extension/secure-validate`, {
      headers: {
        'Origin': 'chrome-extension://test-extension-id',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      },
      timeout: 10000
    });
    
    console.log('Response status:', response.status);
    console.log('CORS headers:', {
      'Access-Control-Allow-Origin': response.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': response.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': response.headers['access-control-allow-headers']
    });
  } catch (error) {
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response headers:', error.response.headers);
    } else {
      console.error('Request failed:', error.message);
    }
  }
}

if (require.main === module) {
  testExtensionValidation().catch(console.error);
}

module.exports = { testExtensionValidation };