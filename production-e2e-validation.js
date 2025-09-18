/**
 * CRITICAL E2E PRODUCTION VALIDATION SCRIPT
 * Tests all critical DirectoryBolt APIs against live production environment
 * Post-Supabase migration validation
 */

const axios = require('axios');
const crypto = require('crypto');

const PRODUCTION_BASE_URL = 'https://directorybolt.netlify.app';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
const STAFF_API_KEY = process.env.STAFF_API_KEY;

// Test tracking
let testResults = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  critical: 0,
  warnings: 0,
  details: []
};

// Helper functions
function logTest(name, status, message, level = 'info') {
  testResults.totalTests++;
  
  const result = {
    test: name,
    status,
    message,
    level,
    timestamp: new Date().toISOString()
  };
  
  testResults.details.push(result);
  
  if (status === 'PASS') {
    testResults.passed++;
    console.log(`✅ ${name}: ${message}`);
  } else if (status === 'FAIL') {
    testResults.failed++;
    if (level === 'critical') testResults.critical++;
    console.log(`❌ ${name}: ${message}`);
  } else {
    testResults.warnings++;
    console.log(`⚠️  ${name}: ${message}`);
  }
}

function generateTestCustomerId() {
  return `DB-TEST-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function makeRequest(endpoint, options = {}) {
  const url = `${PRODUCTION_BASE_URL}${endpoint}`;
  
  try {
    const response = await axios({
      url,
      timeout: 30000,
      ...options
    });
    return { success: true, data: response.data, status: response.status, headers: response.headers };
  } catch (error) {
    return { 
      success: false, 
      error: error.message, 
      status: error.response?.status,
      data: error.response?.data 
    };
  }
}

// Test Suite 1: Basic Health Checks
async function testHealthEndpoints() {
  console.log('\n🔍 TESTING: Health Endpoints');
  
  // Test general health
  const health = await makeRequest('/api/health');
  if (health.success && health.status === 200) {
    logTest('Health Check', 'PASS', 'General health endpoint responsive');
  } else {
    logTest('Health Check', 'FAIL', `Health endpoint failed: ${health.error}`, 'critical');
  }
  
  // Test Supabase health
  const supabaseHealth = await makeRequest('/api/health/supabase');
  if (supabaseHealth.success && supabaseHealth.data?.ok) {
    logTest('Supabase Health', 'PASS', 'Supabase connection healthy');
  } else {
    logTest('Supabase Health', 'FAIL', `Supabase health failed: ${supabaseHealth.error || supabaseHealth.data?.reason}`, 'critical');
  }
  
  // Test system status
  const systemStatus = await makeRequest('/api/system-status');
  if (systemStatus.success && systemStatus.status === 200) {
    logTest('System Status', 'PASS', 'System status endpoint responsive');
  } else {
    logTest('System Status', 'FAIL', `System status failed: ${systemStatus.error}`);
  }
}

// Test Suite 2: Customer Data Operations (CRUD)
async function testCustomerDataOperations() {
  console.log('\n🔍 TESTING: Customer Data Operations (CRUD)');
  
  if (!ADMIN_API_KEY) {
    logTest('Customer API Auth', 'FAIL', 'ADMIN_API_KEY not configured', 'critical');
    return;
  }
  
  const authHeaders = { 'Authorization': `Bearer ${ADMIN_API_KEY}` };
  
  // Test GET all customers
  const getCustomers = await makeRequest('/api/customer/data-operations', {
    method: 'GET',
    headers: authHeaders
  });
  
  if (getCustomers.success && getCustomers.data?.ok) {
    logTest('Get Customers', 'PASS', `Retrieved ${getCustomers.data.customers?.length || 0} customers`);
  } else {
    logTest('Get Customers', 'FAIL', `Failed to get customers: ${getCustomers.error}`, 'critical');
  }
  
  // Test POST - Create test customer
  const testCustomer = {
    customerId: generateTestCustomerId(),
    firstName: 'E2E',
    lastName: 'Test',
    businessName: 'E2E Test Business',
    email: 'e2e-test@directorybolt.com',
    packageType: 'basic',
    status: 'pending'
  };
  
  const createCustomer = await makeRequest('/api/customer/data-operations', {
    method: 'POST',
    headers: { ...authHeaders, 'Content-Type': 'application/json' },
    data: testCustomer
  });
  
  if (createCustomer.success && createCustomer.data?.ok) {
    logTest('Create Customer', 'PASS', `Created test customer: ${testCustomer.customerId}`);
    
    // Test GET specific customer
    const getSpecificCustomer = await makeRequest(`/api/customer/data-operations?customerId=${testCustomer.customerId}`, {
      method: 'GET',
      headers: authHeaders
    });
    
    if (getSpecificCustomer.success && getSpecificCustomer.data?.customer) {
      logTest('Get Specific Customer', 'PASS', `Retrieved customer data for ${testCustomer.customerId}`);
    } else {
      logTest('Get Specific Customer', 'FAIL', `Failed to retrieve specific customer: ${getSpecificCustomer.error}`);
    }
  } else {
    logTest('Create Customer', 'FAIL', `Failed to create customer: ${createCustomer.error}`, 'critical');
  }
}

// Test Suite 3: Extension Validation
async function testExtensionValidation() {
  console.log('\n🔍 TESTING: Chrome Extension Validation');
  
  // Test with invalid customer ID
  const invalidValidation = await makeRequest('/api/extension/secure-validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: { customerId: 'INVALID-123', extensionVersion: '1.0.0' }
  });
  
  if (invalidValidation.success && !invalidValidation.data?.valid) {
    logTest('Extension Invalid Customer', 'PASS', 'Correctly rejected invalid customer ID');
  } else {
    logTest('Extension Invalid Customer', 'FAIL', 'Should have rejected invalid customer ID', 'critical');
  }
  
  // Test with valid customer format but non-existent
  const nonExistentValidation = await makeRequest('/api/extension/secure-validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: { customerId: 'DB-NONEXISTENT-12345', extensionVersion: '1.0.0' }
  });
  
  if (nonExistentValidation.success && !nonExistentValidation.data?.valid) {
    logTest('Extension Non-existent Customer', 'PASS', 'Correctly rejected non-existent customer');
  } else {
    logTest('Extension Non-existent Customer', 'FAIL', 'Should have rejected non-existent customer');
  }
  
  // Test CORS headers for extension
  const corsTest = await makeRequest('/api/extension/secure-validate', {
    method: 'OPTIONS',
    headers: { 'Origin': 'chrome-extension://test' }
  });
  
  if (corsTest.success && corsTest.headers['access-control-allow-origin']) {
    logTest('Extension CORS', 'PASS', 'Extension CORS headers configured');
  } else {
    logTest('Extension CORS', 'FAIL', 'Extension CORS headers missing', 'critical');
  }
}

// Test Suite 4: API Authentication & Security
async function testApiSecurity() {
  console.log('\n🔍 TESTING: API Authentication & Security');
  
  // Test unauthenticated access to protected endpoint
  const unauthenticated = await makeRequest('/api/customer/data-operations', {
    method: 'GET'
  });
  
  if (!unauthenticated.success && unauthenticated.status === 401) {
    logTest('Unauthenticated Access Block', 'PASS', 'Correctly blocked unauthenticated access');
  } else {
    logTest('Unauthenticated Access Block', 'FAIL', 'Should block unauthenticated access', 'critical');
  }
  
  // Test with invalid auth token
  const invalidAuth = await makeRequest('/api/customer/data-operations', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer invalid-token' }
  });
  
  if (!invalidAuth.success && invalidAuth.status === 401) {
    logTest('Invalid Token Block', 'PASS', 'Correctly blocked invalid auth token');
  } else {
    logTest('Invalid Token Block', 'FAIL', 'Should block invalid auth token', 'critical');
  }
  
  // Test method not allowed
  const methodNotAllowed = await makeRequest('/api/customer/data-operations', {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${ADMIN_API_KEY}` }
  });
  
  if (!methodNotAllowed.success && methodNotAllowed.status === 405) {
    logTest('Method Not Allowed', 'PASS', 'Correctly blocked unsupported HTTP method');
  } else {
    logTest('Method Not Allowed', 'FAIL', 'Should block unsupported HTTP methods');
  }
}

// Test Suite 5: Performance & Load Testing
async function testPerformance() {
  console.log('\n🔍 TESTING: Performance & Load');
  
  const startTime = Date.now();
  
  // Test multiple concurrent requests
  const concurrentRequests = Array.from({ length: 5 }, () => 
    makeRequest('/api/health')
  );
  
  try {
    const results = await Promise.all(concurrentRequests);
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const successCount = results.filter(r => r.success).length;
    
    if (successCount === 5 && duration < 10000) {
      logTest('Concurrent Load', 'PASS', `Handled 5 concurrent requests in ${duration}ms`);
    } else if (successCount === 5) {
      logTest('Concurrent Load', 'WARN', `Handled requests but slow: ${duration}ms`);
    } else {
      logTest('Concurrent Load', 'FAIL', `Only ${successCount}/5 requests succeeded`);
    }
  } catch (error) {
    logTest('Concurrent Load', 'FAIL', `Concurrent request test failed: ${error.message}`);
  }
  
  // Test response time for critical endpoints
  const criticalEndpoints = [
    '/api/health',
    '/api/health/supabase',
    '/api/extension/secure-validate'
  ];
  
  for (const endpoint of criticalEndpoints) {
    const start = Date.now();
    let requestConfig = { method: 'GET' };
    
    if (endpoint.includes('secure-validate')) {
      requestConfig = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        data: { customerId: 'DB-TEST-123', extensionVersion: '1.0.0' }
      };
    }
    
    const result = await makeRequest(endpoint, requestConfig);
    const responseTime = Date.now() - start;
    
    if (result.success && responseTime < 3000) {
      logTest(`${endpoint} Response Time`, 'PASS', `Responded in ${responseTime}ms`);
    } else if (result.success) {
      logTest(`${endpoint} Response Time`, 'WARN', `Slow response: ${responseTime}ms`);
    } else {
      logTest(`${endpoint} Response Time`, 'FAIL', `Failed to respond: ${result.error}`);
    }
  }
}

// Test Suite 6: Error Handling
async function testErrorHandling() {
  console.log('\n🔍 TESTING: Error Handling & Fallbacks');
  
  // Test malformed JSON
  const malformedJson = await makeRequest('/api/extension/secure-validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: 'invalid-json'
  });
  
  if (!malformedJson.success && malformedJson.status >= 400) {
    logTest('Malformed JSON Handling', 'PASS', 'Correctly handled malformed JSON');
  } else {
    logTest('Malformed JSON Handling', 'FAIL', 'Should handle malformed JSON gracefully');
  }
  
  // Test missing required fields
  const missingFields = await makeRequest('/api/customer/data-operations', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${ADMIN_API_KEY}`,
      'Content-Type': 'application/json' 
    },
    data: { firstName: 'Test' } // Missing required fields
  });
  
  if (!missingFields.success && missingFields.status === 400) {
    logTest('Missing Fields Validation', 'PASS', 'Correctly validated required fields');
  } else {
    logTest('Missing Fields Validation', 'FAIL', 'Should validate required fields');
  }
  
  // Test invalid email format
  const invalidEmail = await makeRequest('/api/customer/data-operations', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${ADMIN_API_KEY}`,
      'Content-Type': 'application/json' 
    },
    data: {
      firstName: 'Test',
      lastName: 'User',
      businessName: 'Test Business',
      email: 'invalid-email',
      packageType: 'basic'
    }
  });
  
  if (!invalidEmail.success && invalidEmail.status === 400) {
    logTest('Email Validation', 'PASS', 'Correctly validated email format');
  } else {
    logTest('Email Validation', 'FAIL', 'Should validate email format');
  }
}

// Main test runner
async function runProductionE2ETests() {
  console.log('🚀 STARTING: DirectoryBolt Production E2E Validation');
  console.log(`🎯 Target: ${PRODUCTION_BASE_URL}`);
  console.log(`📅 Time: ${new Date().toISOString()}\n`);
  
  try {
    await testHealthEndpoints();
    await testCustomerDataOperations();
    await testExtensionValidation();
    await testApiSecurity();
    await testPerformance();
    await testErrorHandling();
    
    // Generate summary report
    console.log('\n' + '='.repeat(80));
    console.log('🎯 PRODUCTION E2E VALIDATION SUMMARY');
    console.log('='.repeat(80));
    console.log(`📊 Total Tests: ${testResults.totalTests}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`🔥 Critical Failures: ${testResults.critical}`);
    console.log(`⚠️  Warnings: ${testResults.warnings}`);
    
    const successRate = ((testResults.passed / testResults.totalTests) * 100).toFixed(1);
    console.log(`📈 Success Rate: ${successRate}%`);
    
    if (testResults.critical > 0) {
      console.log('\n🚨 CRITICAL ISSUES DETECTED - PRODUCTION NOT READY');
      console.log('Critical failures must be resolved before going live!');
    } else if (testResults.failed > 0) {
      console.log('\n⚠️  MINOR ISSUES DETECTED - REVIEW RECOMMENDED');
      console.log('Non-critical failures detected, review recommended.');
    } else {
      console.log('\n🎉 ALL TESTS PASSED - PRODUCTION READY');
      console.log('System validated and ready for production traffic!');
    }
    
    // Write detailed report
    const reportPath = `production-e2e-report-${Date.now()}.json`;
    require('fs').writeFileSync(reportPath, JSON.stringify({
      summary: {
        timestamp: new Date().toISOString(),
        target: PRODUCTION_BASE_URL,
        totalTests: testResults.totalTests,
        passed: testResults.passed,
        failed: testResults.failed,
        critical: testResults.critical,
        warnings: testResults.warnings,
        successRate: successRate + '%'
      },
      details: testResults.details
    }, null, 2));
    
    console.log(`\n📄 Detailed report saved: ${reportPath}`);
    
  } catch (error) {
    console.error('💥 E2E Test Suite Failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  runProductionE2ETests().catch(console.error);
}

module.exports = { runProductionE2ETests };