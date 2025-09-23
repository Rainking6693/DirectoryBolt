#!/usr/bin/env node

/**
 * DirectoryBolt External Audit - Phase 1 Comprehensive Testing
 * Tests Backend APIs and Job Queue Validation
 */

const http = require('http');
const fs = require('fs');

console.log('🚀 DirectoryBolt External Audit - Phase 1 Comprehensive Testing');
console.log('================================================================');
console.log('Following EXTERNAL_AUDIT_PROTOCOL_SECURE.md v2.0');
console.log('');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const STAFF_API_KEY = 'DirectoryBolt-Staff-2025-SecureKey'; // From protocol
const TEST_CUSTOMER_ID = 'test-audit-customer';

// Results tracking
const results = {
  phase1_1: { total: 0, passed: 0, failed: 0, tests: [] },
  phase1_2: { total: 0, passed: 0, failed: 0, tests: [] },
  phase1_3: { total: 0, passed: 0, failed: 0, tests: [] },
  overall: { total: 0, passed: 0, failed: 0 }
};

// Function to test API endpoint
function testEndpoint(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DirectoryBolt-Audit/1.0',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ 
            success: true, 
            status: res.statusCode, 
            data: parsed,
            headers: res.headers,
            responseTime: Date.now()
          });
        } catch (error) {
          resolve({ 
            success: false, 
            status: res.statusCode, 
            error: error.message, 
            rawData: responseData,
            responseTime: Date.now()
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message, responseTime: Date.now() });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Function to record test result
function recordTest(phase, testName, result, expected, actual) {
  const passed = result;
  const test = {
    name: testName,
    passed,
    expected,
    actual,
    timestamp: new Date().toISOString()
  };
  
  results[phase].tests.push(test);
  results[phase].total++;
  if (passed) {
    results[phase].passed++;
  } else {
    results[phase].failed++;
  }
  
  results.overall.total++;
  if (passed) {
    results.overall.passed++;
  } else {
    results.overall.failed++;
  }
  
  console.log(`${passed ? '✅' : '❌'} ${testName}: ${passed ? 'PASSED' : 'FAILED'}`);
  if (!passed) {
    console.log(`   Expected: ${expected}`);
    console.log(`   Actual: ${actual}`);
  }
}

async function phase1_1_CoreAPIEndpoints() {
  console.log('\n📊 Phase 1.1: Core API Endpoints Testing');
  console.log('=========================================');
  
  // Test 1: Health Check
  console.log('\n🔍 Testing Health Check Endpoint...');
  const healthResult = await testEndpoint(`${BASE_URL}/api/health`);
  
  recordTest('phase1_1', 'Health Check - Response', 
    healthResult.success && healthResult.status === 200,
    'Status 200 with JSON response',
    `Status ${healthResult.status}, Success: ${healthResult.success}`
  );
  
  if (healthResult.success) {
    recordTest('phase1_1', 'Health Check - Status Field',
      healthResult.data.status === 'healthy',
      'status: "healthy"',
      `status: "${healthResult.data.status}"`
    );
    
    recordTest('phase1_1', 'Health Check - Timestamp',
      !!healthResult.data.timestamp,
      'timestamp field present',
      `timestamp: ${!!healthResult.data.timestamp}`
    );
    
    recordTest('phase1_1', 'Health Check - Environment',
      !!healthResult.data.environment,
      'environment field present',
      `environment: ${healthResult.data.environment}`
    );
  }
  
  // Test 2: System Status
  console.log('\n🔍 Testing System Status Endpoint...');
  const statusResult = await testEndpoint(`${BASE_URL}/api/system-status`);
  
  recordTest('phase1_1', 'System Status - Response',
    statusResult.success && (statusResult.status === 200 || statusResult.status === 503),
    'Status 200 or 503 with JSON response',
    `Status ${statusResult.status}, Success: ${statusResult.success}`
  );
  
  if (statusResult.success) {
    recordTest('phase1_1', 'System Status - Environment Variables',
      !!statusResult.data.environment_variables,
      'environment_variables object present',
      `environment_variables: ${!!statusResult.data.environment_variables}`
    );
    
    recordTest('phase1_1', 'System Status - API Endpoints',
      !!statusResult.data.api_endpoints,
      'api_endpoints object present',
      `api_endpoints: ${!!statusResult.data.api_endpoints}`
    );
  }
  
  // Test 3: Website Analysis API (check existence)
  console.log('\n🔍 Testing Website Analysis API...');
  const analyzeResult = await testEndpoint(`${BASE_URL}/api/analyze`);
  
  recordTest('phase1_1', 'Analyze Endpoint - Existence',
    analyzeResult.status === 405 || analyzeResult.success,
    'Endpoint exists (405 Method Not Allowed for GET is acceptable)',
    `Status ${analyzeResult.status}`
  );
}

async function phase1_2_JobQueueOperations() {
  console.log('\n📊 Phase 1.2: Job Queue Operations Testing');
  console.log('==========================================');
  
  // Test 1: Queue Status Check
  console.log('\n🔍 Testing Queue Status Endpoint...');
  const queueStatusResult = await testEndpoint(`${BASE_URL}/api/queue`, 'GET', null, {
    'x-staff-key': STAFF_API_KEY
  });
  
  recordTest('phase1_2', 'Queue Status - Response',
    queueStatusResult.success && queueStatusResult.status === 200,
    'Status 200 with queue status',
    `Status ${queueStatusResult.status}, Success: ${queueStatusResult.success}`
  );
  
  // Test 2: Queue Operations Endpoint
  console.log('\n🔍 Testing Queue Operations Endpoint...');
  const queueOpsResult = await testEndpoint(`${BASE_URL}/api/queue/operations`, 'GET', null, {
    'x-staff-key': STAFF_API_KEY
  });
  
  recordTest('phase1_2', 'Queue Operations - Response',
    queueOpsResult.success && queueOpsResult.status === 200,
    'Status 200 with operations status',
    `Status ${queueOpsResult.status}, Success: ${queueOpsResult.success}`
  );
  
  // Test 3: Customer Job Creation (POST to batch endpoint)
  console.log('\n🔍 Testing Customer Job Creation...');
  const jobData = {
    customerId: TEST_CUSTOMER_ID,
    businessData: {
      name: 'Test Business LLC',
      email: 'test@audit.com',
      phone: '555-123-4567',
      website: 'https://testbusiness.com'
    },
    selectedDirectories: ['yelp', 'google-business']
  };
  
  const jobCreateResult = await testEndpoint(`${BASE_URL}/api/queue/batch`, 'POST', jobData, {
    'x-staff-key': STAFF_API_KEY
  });
  
  recordTest('phase1_2', 'Job Creation - Response',
    jobCreateResult.success && (jobCreateResult.status === 201 || jobCreateResult.status === 200),
    'Status 201 or 200 with job created',
    `Status ${jobCreateResult.status}, Success: ${jobCreateResult.success}`
  );
}

async function phase1_3_AutoBoltIntegration() {
  console.log('\n📊 Phase 1.3: AutoBolt Integration APIs Testing');
  console.log('===============================================');
  
  // Test 1: AutoBolt Queue Status
  console.log('\n🔍 Testing AutoBolt Queue Status...');
  const autoboltQueueResult = await testEndpoint(`${BASE_URL}/api/autobolt/queue-status`, 'GET', null, {
    'x-staff-key': STAFF_API_KEY
  });
  
  recordTest('phase1_3', 'AutoBolt Queue Status - Response',
    autoboltQueueResult.success && autoboltQueueResult.status === 200,
    'Status 200 with queue status',
    `Status ${autoboltQueueResult.status}, Success: ${autoboltQueueResult.success}`
  );
  
  // Test 2: AutoBolt Customer Status
  console.log('\n🔍 Testing AutoBolt Customer Status...');
  const customerStatusResult = await testEndpoint(`${BASE_URL}/api/autobolt/customer-status/${TEST_CUSTOMER_ID}`, 'GET', null, {
    'x-api-key': 'test-api-key'
  });
  
  recordTest('phase1_3', 'Customer Status - Response',
    customerStatusResult.success || customerStatusResult.status === 404,
    'Status 200 or 404 (customer not found is acceptable)',
    `Status ${customerStatusResult.status}, Success: ${customerStatusResult.success}`
  );
  
  // Test 3: Staff Authentication Check
  console.log('\n🔍 Testing Staff Authentication...');
  const staffAuthResult = await testEndpoint(`${BASE_URL}/api/staff/auth-check`, 'GET', null, {
    'x-staff-key': STAFF_API_KEY
  });
  
  recordTest('phase1_3', 'Staff Authentication - Response',
    staffAuthResult.success && staffAuthResult.status === 200,
    'Status 200 with authentication confirmed',
    `Status ${staffAuthResult.status}, Success: ${staffAuthResult.success}`
  );
  
  // Test 4: Staff Job Progress
  console.log('\n🔍 Testing Staff Job Progress...');
  const jobProgressResult = await testEndpoint(`${BASE_URL}/api/staff/jobs/progress`, 'GET', null, {
    'x-staff-key': STAFF_API_KEY
  });
  
  recordTest('phase1_3', 'Job Progress - Response',
    jobProgressResult.success && jobProgressResult.status === 200,
    'Status 200 with job progress data',
    `Status ${jobProgressResult.status}, Success: ${jobProgressResult.success}`
  );
}

function generateReport() {
  console.log('\n📋 PHASE 1 COMPREHENSIVE AUDIT REPORT');
  console.log('=====================================');
  
  console.log('\n📊 Results Summary:');
  console.log(`Phase 1.1 (Core APIs): ${results.phase1_1.passed}/${results.phase1_1.total} passed`);
  console.log(`Phase 1.2 (Job Queue): ${results.phase1_2.passed}/${results.phase1_2.total} passed`);
  console.log(`Phase 1.3 (AutoBolt): ${results.phase1_3.passed}/${results.phase1_3.total} passed`);
  console.log(`Overall: ${results.overall.passed}/${results.overall.total} passed (${Math.round((results.overall.passed / results.overall.total) * 100)}%)`);
  
  // Detailed results
  console.log('\n📝 Detailed Test Results:');
  ['phase1_1', 'phase1_2', 'phase1_3'].forEach(phase => {
    console.log(`\\n${phase.toUpperCase()}:`);
    results[phase].tests.forEach(test => {
      console.log(`  ${test.passed ? '✅' : '❌'} ${test.name}`);
      if (!test.passed) {
        console.log(`     Expected: ${test.expected}`);
        console.log(`     Actual: ${test.actual}`);
      }
    });
  });
  
  // Pass/Fail determination
  const overallPassRate = (results.overall.passed / results.overall.total) * 100;
  console.log('\\n🎯 Phase 1 Assessment:');
  
  if (overallPassRate >= 90) {
    console.log('✅ EXCELLENT - Phase 1 passes with flying colors');
    console.log('🚀 Ready to proceed to Phase 2: Staff Dashboard and Monitoring');
  } else if (overallPassRate >= 75) {
    console.log('✅ GOOD - Phase 1 passes with minor issues');
    console.log('⚠️  Some endpoints may need attention before production');
    console.log('🚀 Can proceed to Phase 2 with monitoring');
  } else if (overallPassRate >= 50) {
    console.log('⚠️  CONDITIONAL - Phase 1 has significant issues');
    console.log('🔧 Several endpoints need fixing before proceeding');
    console.log('📋 Recommend addressing failures before Phase 2');
  } else {
    console.log('❌ FAILED - Phase 1 has critical issues');
    console.log('🛑 Must fix major issues before proceeding');
    console.log('💡 Check if development server is running and configured properly');
  }
  
  // Save report to file
  const reportData = {
    timestamp: new Date().toISOString(),
    phase: 'Phase 1 - Backend APIs and Job Queue',
    overallPassRate: Math.round(overallPassRate),
    results: results,
    recommendation: overallPassRate >= 75 ? 'PROCEED_TO_PHASE_2' : 'FIX_ISSUES_FIRST'
  };
  
  fs.writeFileSync('phase1-audit-results.json', JSON.stringify(reportData, null, 2));
  console.log('\\n📄 Detailed results saved to: phase1-audit-results.json');
}

async function runPhase1Audit() {
  console.log('🎯 Starting Phase 1 comprehensive audit...');
  console.log('⏱️  This will test all backend APIs and job queue operations');
  console.log('');
  
  try {
    await phase1_1_CoreAPIEndpoints();
    await phase1_2_JobQueueOperations();
    await phase1_3_AutoBoltIntegration();
    
    generateReport();
    
  } catch (error) {
    console.error('💥 Audit execution failed:', error);
    console.log('\\n🔧 Troubleshooting:');
    console.log('1. Ensure development server is running: npm run dev');
    console.log('2. Check if port 3000 is available');
    console.log('3. Verify environment variables are configured');
  }
}

// Run the audit
runPhase1Audit();