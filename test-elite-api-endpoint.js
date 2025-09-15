/**
 * ELITE API ENDPOINT TESTING SUITE
 * 
 * Comprehensive testing for the /api/extension/validate endpoint
 * Tests both GET and POST methods with various customer IDs
 */

const https = require('https');
const http = require('http');

// Test configuration
const TEST_CONFIG = {
  // Local testing
  local: {
    host: 'localhost',
    port: 3000,
    protocol: 'http:'
  },
  // Production testing
  production: {
    host: 'directorybolt.com',
    port: 443,
    protocol: 'https:'
  }
};

// Test customer IDs
const TEST_CUSTOMER_IDS = [
  'DIR-20250914-000001',  // Target customer ID from requirements
  'DIR-2025-001234',      // Test customer
  'TEST-CUSTOMER-123',    // Development customer
  'DIR-2025-005678',      // Alternative test customer
  'INVALID-FORMAT',       // Should fail format validation
  '',                     // Should fail - empty
  'DIR-2025-NONEXISTENT'  // Should fail - not found
];

console.log('🧪 ELITE API ENDPOINT TESTING SUITE');
console.log('='.repeat(60));

/**
 * Make HTTP request
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const client = options.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonBody = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (data) {
      req.write(data);
    }
    
    req.end();
  });
}

/**
 * Test GET request
 */
async function testGetRequest(config, customerId) {
  const options = {
    ...config,
    method: 'GET',
    path: `/api/extension/validate?customerId=${encodeURIComponent(customerId)}`,
    headers: {
      'User-Agent': 'ELITE-API-TESTER/1.0'
    }
  };
  
  try {
    const response = await makeRequest(options);
    return response;
  } catch (error) {
    return {
      error: error.message,
      statusCode: 0
    };
  }
}

/**
 * Test POST request
 */
async function testPostRequest(config, customerId) {
  const postData = JSON.stringify({
    customerId: customerId,
    extensionVersion: '3.0.1',
    timestamp: Date.now()
  });
  
  const options = {
    ...config,
    method: 'POST',
    path: '/api/extension/validate',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
      'User-Agent': 'ELITE-API-TESTER/1.0'
    }
  };
  
  try {
    const response = await makeRequest(options, postData);
    return response;
  } catch (error) {
    return {
      error: error.message,
      statusCode: 0
    };
  }
}

/**
 * Test CORS preflight
 */
async function testCorsRequest(config) {
  const options = {
    ...config,
    method: 'OPTIONS',
    path: '/api/extension/validate',
    headers: {
      'Origin': 'chrome-extension://test',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type'
    }
  };
  
  try {
    const response = await makeRequest(options);
    return response;
  } catch (error) {
    return {
      error: error.message,
      statusCode: 0
    };
  }
}

/**
 * Run comprehensive test suite
 */
async function runTestSuite(environment = 'local') {
  const config = TEST_CONFIG[environment];
  console.log(`\n🎯 Testing ${environment} environment: ${config.protocol}//${config.host}:${config.port}`);
  console.log('-'.repeat(50));
  
  // Test CORS preflight
  console.log('\n🔗 Testing CORS preflight...');
  const corsResponse = await testCorsRequest(config);
  console.log(`CORS Status: ${corsResponse.statusCode}`);
  if (corsResponse.headers) {
    console.log('CORS Headers:', {
      'access-control-allow-origin': corsResponse.headers['access-control-allow-origin'],
      'access-control-allow-methods': corsResponse.headers['access-control-allow-methods']
    });
  }
  
  // Test each customer ID with both GET and POST
  for (const customerId of TEST_CUSTOMER_IDS) {
    console.log(`\n📋 Testing Customer ID: "${customerId}"`);
    console.log('-'.repeat(30));
    
    // Test GET request
    console.log('GET Request:');
    const getResponse = await testGetRequest(config, customerId);
    console.log(`  Status: ${getResponse.statusCode}`);
    if (getResponse.body) {
      console.log(`  Valid: ${getResponse.body.valid}`);
      if (getResponse.body.error) {
        console.log(`  Error: ${getResponse.body.error}`);
      }
      if (getResponse.body.customerName) {
        console.log(`  Customer: ${getResponse.body.customerName}`);
      }
      if (getResponse.body.debug) {
        console.log(`  Debug: ${JSON.stringify(getResponse.body.debug)}`);
      }
    }
    
    // Test POST request
    console.log('POST Request:');
    const postResponse = await testPostRequest(config, customerId);
    console.log(`  Status: ${postResponse.statusCode}`);
    if (postResponse.body) {
      console.log(`  Valid: ${postResponse.body.valid}`);
      if (postResponse.body.error) {
        console.log(`  Error: ${postResponse.body.error}`);
      }
      if (postResponse.body.customerName) {
        console.log(`  Customer: ${postResponse.body.customerName}`);
      }
    }
  }
}

/**
 * Test specific customer ID (from requirements)
 */
async function testTargetCustomer(environment = 'local') {
  const config = TEST_CONFIG[environment];
  const targetCustomerId = 'DIR-20250914-000001';
  
  console.log(`\n🎯 TESTING TARGET CUSTOMER: ${targetCustomerId}`);
  console.log('='.repeat(50));
  
  const getResponse = await testGetRequest(config, targetCustomerId);
  
  console.log('GET Response:');
  console.log(`Status Code: ${getResponse.statusCode}`);
  console.log('Response Body:', JSON.stringify(getResponse.body, null, 2));
  
  if (getResponse.body && getResponse.body.valid) {
    console.log('\n✅ SUCCESS: Target customer validation successful!');
    console.log(`Customer Name: ${getResponse.body.customerName}`);
    console.log(`Package Type: ${getResponse.body.packageType}`);
  } else {
    console.log('\n❌ FAILURE: Target customer validation failed');
    if (getResponse.body && getResponse.body.error) {
      console.log(`Error: ${getResponse.body.error}`);
    }
  }
}

/**
 * Main test execution
 */
async function main() {
  try {
    // Test local environment first
    console.log('\n🏠 TESTING LOCAL ENVIRONMENT');
    await runTestSuite('local');
    
    // Test target customer specifically
    await testTargetCustomer('local');
    
    // Uncomment to test production
    // console.log('\n🌐 TESTING PRODUCTION ENVIRONMENT');
    // await runTestSuite('production');
    // await testTargetCustomer('production');
    
    console.log('\n🎉 ELITE API ENDPOINT TESTING COMPLETE');
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
  }
}

// Run tests
if (require.main === module) {
  main();
}

module.exports = {
  testGetRequest,
  testPostRequest,
  testTargetCustomer,
  runTestSuite
};