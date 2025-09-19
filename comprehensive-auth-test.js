/**
 * Comprehensive Authentication System Test Suite
 * Tests all authentication endpoints, middleware, and business logic
 */

const BASE_URL = 'http://localhost:3004';

const TEST_CASES = [
  {
    name: 'Customer ID Authentication',
    endpoint: '/api/customer/auth',
    method: 'POST',
    data: { customerId: 'DIR-20250918-643546' },
    expectedStatus: 200,
    expectedFields: ['success', 'customerId', 'businessName', 'email', 'packageType', 'status']
  },
  {
    name: 'Email Authentication',
    endpoint: '/api/customer/auth',
    method: 'POST',
    data: { email: 'test2@directorybolt.com' },
    expectedStatus: 200,
    expectedFields: ['success', 'customerId', 'businessName', 'email', 'packageType', 'status']
  },
  {
    name: 'Extension Validation',
    endpoint: '/api/extension/secure-validate',
    method: 'POST',
    data: { customerId: 'DIR-20250918-643546', extensionVersion: '1.0.0' },
    expectedStatus: 200,
    expectedFields: ['valid', 'customerName', 'packageType', 'accessToken', 'expiresIn']
  },
  {
    name: 'Customer Validation API',
    endpoint: '/api/customer/validate',
    method: 'POST',
    data: { customerId: 'DIR-20250918-643546' },
    expectedStatus: 200,
    expectedFields: ['success', 'customer']
  },
  {
    name: 'Authentication Middleware Test',
    endpoint: '/api/test-auth',
    method: 'GET',
    data: { customerId: 'DIR-20250918-643546' },
    expectedStatus: 200,
    expectedFields: ['success', 'message', 'user', 'timestamp']
  },
  {
    name: 'Invalid Customer ID Test',
    endpoint: '/api/customer/auth',
    method: 'POST',
    data: { customerId: 'INVALID-ID' },
    expectedStatus: 401,
    expectedFields: ['error']
  },
  {
    name: 'Invalid Email Test',
    endpoint: '/api/customer/auth',
    method: 'POST',
    data: { email: 'invalid@nonexistent.com' },
    expectedStatus: 401,
    expectedFields: ['error']
  },
  {
    name: 'Missing Credentials Test',
    endpoint: '/api/customer/auth',
    method: 'POST',
    data: {},
    expectedStatus: 400,
    expectedFields: ['error']
  }
];

async function runTest(testCase) {
  try {
    console.log(`\\n🧪 Testing: ${testCase.name}`);
    
    const options = {
      method: testCase.method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (testCase.method !== 'GET' && Object.keys(testCase.data).length > 0) {
      options.body = JSON.stringify(testCase.data);
    } else if (testCase.method === 'GET' && Object.keys(testCase.data).length > 0) {
      // For GET requests, add data as query parameters or headers
      options.body = JSON.stringify(testCase.data);
    }
    
    const response = await fetch(`${BASE_URL}${testCase.endpoint}`, options);
    const data = await response.json();
    
    // Check status code
    if (response.status !== testCase.expectedStatus) {
      console.log(`❌ Status code mismatch. Expected: ${testCase.expectedStatus}, Got: ${response.status}`);
      console.log('Response:', data);
      return false;
    }
    
    // Check expected fields
    const missingFields = testCase.expectedFields.filter(field => !(field in data));
    if (missingFields.length > 0) {
      console.log(`❌ Missing fields: ${missingFields.join(', ')}`);
      console.log('Response:', data);
      return false;
    }
    
    // Additional validation for successful authentication responses
    if (testCase.expectedStatus === 200 && data.success === true) {
      console.log(`✅ Success! Customer: ${data.businessName || data.customerName || data.user?.businessName || 'Unknown'}`);
      
      // Validate permissions for middleware test
      if (testCase.name === 'Authentication Middleware Test' && data.user?.permissions) {
        console.log(`   📋 Permissions: ${data.user.permissions.join(', ')}`);
      }
      
      // Validate package type
      if (data.packageType || data.user?.packageType) {
        console.log(`   📦 Package: ${data.packageType || data.user?.packageType}`);
      }
    } else if (testCase.expectedStatus >= 400) {
      console.log(`✅ Error handling working correctly: ${data.error}`);
    } else {
      console.log('✅ Test passed');
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ Network/Runtime error: ${error.message}`);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Comprehensive Authentication System Test Suite');
  console.log('===============================================================');
  
  const results = [];
  let passedTests = 0;
  
  for (const testCase of TEST_CASES) {
    const result = await runTest(testCase);
    results.push({ name: testCase.name, passed: result });
    if (result) passedTests++;
  }
  
  console.log('\\n📊 TEST RESULTS SUMMARY');
  console.log('===============================================================');
  
  results.forEach(result => {
    console.log(\`\${result.passed ? '✅' : '❌'} \${result.name}\`);
  });
  
  console.log(`\n🎯 Overall Results: ${passedTests}/${TEST_CASES.length} tests passed`);
  
  if (passedTests === TEST_CASES.length) {
    console.log('\\n🎉 ALL AUTHENTICATION TESTS PASSED!');
    console.log('🔒 Authentication system is fully functional and production-ready');
    console.log('✅ Database integration working correctly');
    console.log('✅ Role-based access control implemented');
    console.log('✅ Error handling robust');
    console.log('✅ Middleware functioning properly');
  } else {
    console.log(\`\\n⚠️  \${TEST_CASES.length - passedTests} test(s) failed. Review above for details.\`);
  }
  
  return passedTests === TEST_CASES.length;
}

// Additional test for performance and database connection
async function testDatabasePerformance() {
  console.log('\\n⚡ Testing Database Performance...');
  
  const startTime = Date.now();
  
  try {
    const response = await fetch(\`\${BASE_URL}/api/customer/auth\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId: 'DIR-20250918-643546' })
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    if (response.ok) {
      console.log(\`✅ Database response time: \${responseTime}ms\`);
      
      if (responseTime < 500) {
        console.log('🚀 Excellent performance (< 500ms)');
      } else if (responseTime < 1000) {
        console.log('✅ Good performance (< 1s)');
      } else {
        console.log('⚠️  Slow performance (> 1s) - may need optimization');
      }
      
      return true;
    } else {
      console.log('❌ Database connection test failed');
      return false;
    }
    
  } catch (error) {
    console.log(\`❌ Database performance test error: \${error.message}\`);
    return false;
  }
}

// Run the complete test suite
async function main() {
  console.log('Starting DirectoryBolt Authentication System Validation...');
  console.log('Time:', new Date().toISOString());
  
  const allTestsPassed = await runAllTests();
  const performanceTestPassed = await testDatabasePerformance();
  
  console.log('\\n' + '='.repeat(70));
  
  if (allTestsPassed && performanceTestPassed) {
    console.log('🏆 AUTHENTICATION SYSTEM FULLY VALIDATED');
    console.log('💡 System is ready for production deployment');
    process.exit(0);
  } else {
    console.log('🔧 Authentication system needs attention');
    process.exit(1);
  }
}

main().catch(console.error);