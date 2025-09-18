/**
 * Production Performance & Load Testing
 * Tests site responsiveness under typical usage patterns
 */

const axios = require('axios');

const PRODUCTION_BASE_URL = 'https://directorybolt.netlify.app';

// Test tracking
let performanceResults = {
  endpoints: [],
  loadTests: [],
  summary: {
    totalTests: 0,
    passed: 0,
    warnings: 0,
    failed: 0
  }
};

function logPerformanceTest(name, responseTime, status, details = {}) {
  const result = {
    endpoint: name,
    responseTime,
    status,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  performanceResults.endpoints.push(result);
  performanceResults.summary.totalTests++;
  
  if (status === 'PASS') {
    performanceResults.summary.passed++;
    console.log(`✅ ${name}: ${responseTime}ms - ${details.message || 'OK'}`);
  } else if (status === 'WARN') {
    performanceResults.summary.warnings++;
    console.log(`⚠️  ${name}: ${responseTime}ms - ${details.message || 'Slow'}`);
  } else {
    performanceResults.summary.failed++;
    console.log(`❌ ${name}: ${responseTime}ms - ${details.message || 'Failed'}`);
  }
}

async function testSingleEndpoint(name, config) {
  const startTime = Date.now();
  
  try {
    const response = await axios({
      url: `${PRODUCTION_BASE_URL}${config.endpoint}`,
      method: config.method || 'GET',
      timeout: config.timeout || 10000,
      ...config.options
    });
    
    const responseTime = Date.now() - startTime;
    const expectedTime = config.expectedMaxMs || 3000;
    
    if (responseTime < expectedTime) {
      logPerformanceTest(name, responseTime, 'PASS', {
        statusCode: response.status,
        message: 'Fast response'
      });
    } else if (responseTime < expectedTime * 2) {
      logPerformanceTest(name, responseTime, 'WARN', {
        statusCode: response.status,
        message: 'Acceptable but slow'
      });
    } else {
      logPerformanceTest(name, responseTime, 'FAIL', {
        statusCode: response.status,
        message: 'Too slow'
      });
    }
    
    return { success: true, responseTime, status: response.status };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    logPerformanceTest(name, responseTime, 'FAIL', {
      statusCode: error.response?.status || 0,
      message: error.message,
      error: true
    });
    
    return { success: false, responseTime, error: error.message };
  }
}

async function testConcurrentLoad(endpointName, config, concurrency = 5) {
  console.log(`\n🔄 Testing concurrent load: ${endpointName} (${concurrency} concurrent requests)`);
  
  const startTime = Date.now();
  const requests = Array.from({ length: concurrency }, () => 
    testSingleEndpoint(`${endpointName}-concurrent`, config)
  );
  
  try {
    const results = await Promise.all(requests);
    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    
    const loadResult = {
      endpoint: endpointName,
      concurrency,
      totalTime,
      successCount,
      failureCount: concurrency - successCount,
      avgResponseTime,
      maxResponseTime: Math.max(...results.map(r => r.responseTime)),
      minResponseTime: Math.min(...results.map(r => r.responseTime))
    };
    
    performanceResults.loadTests.push(loadResult);
    
    if (successCount === concurrency && totalTime < 10000) {
      console.log(`✅ Concurrent load test passed: ${successCount}/${concurrency} succeeded in ${totalTime}ms`);
    } else if (successCount >= concurrency * 0.8) {
      console.log(`⚠️  Concurrent load test acceptable: ${successCount}/${concurrency} succeeded in ${totalTime}ms`);
    } else {
      console.log(`❌ Concurrent load test failed: ${successCount}/${concurrency} succeeded in ${totalTime}ms`);
    }
    
    console.log(`   📊 Avg response: ${Math.round(avgResponseTime)}ms, Range: ${loadResult.minResponseTime}-${loadResult.maxResponseTime}ms`);
    
  } catch (error) {
    console.error(`❌ Concurrent load test error: ${error.message}`);
  }
}

async function runPerformanceTests() {
  console.log('🚀 STARTING: Production Performance Tests');
  console.log(`🎯 Target: ${PRODUCTION_BASE_URL}`);
  console.log(`📅 Time: ${new Date().toISOString()}\n`);
  
  // Test 1: Critical endpoints response time
  console.log('🔍 Testing Critical Endpoint Response Times:');
  
  const criticalEndpoints = [
    {
      name: 'Homepage',
      endpoint: '/',
      expectedMaxMs: 2000
    },
    {
      name: 'Health Check',
      endpoint: '/api/health',
      expectedMaxMs: 1000
    },
    {
      name: 'System Status',
      endpoint: '/api/system-status',
      expectedMaxMs: 2000
    },
    {
      name: 'Extension Test Validation',
      endpoint: '/api/extension/secure-validate',
      method: 'POST',
      expectedMaxMs: 1500,
      options: {
        headers: { 'Content-Type': 'application/json' },
        data: { customerId: 'TEST-12345', extensionVersion: '1.0.0' }
      }
    },
    {
      name: 'Guides API',
      endpoint: '/api/guides',
      expectedMaxMs: 2000
    },
    {
      name: 'Directories API',
      endpoint: '/api/directories',
      expectedMaxMs: 3000
    }
  ];
  
  for (const endpoint of criticalEndpoints) {
    await testSingleEndpoint(endpoint.name, endpoint);
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between tests
  }
  
  // Test 2: Concurrent load testing
  console.log('\n🔍 Testing Concurrent Load Handling:');
  
  await testConcurrentLoad('Health Check', {
    endpoint: '/api/health',
    expectedMaxMs: 1000
  }, 5);
  
  await testConcurrentLoad('Extension Validation', {
    endpoint: '/api/extension/secure-validate',
    method: 'POST',
    expectedMaxMs: 1500,
    options: {
      headers: { 'Content-Type': 'application/json' },
      data: { customerId: 'TEST-12345', extensionVersion: '1.0.0' }
    }
  }, 3);
  
  // Test 3: Static assets performance
  console.log('\n🔍 Testing Static Assets Performance:');
  
  const staticAssets = [
    {
      name: 'Favicon',
      endpoint: '/favicon.ico',
      expectedMaxMs: 1000
    },
    {
      name: 'Robots.txt',
      endpoint: '/robots.txt',
      expectedMaxMs: 500
    },
    {
      name: 'Sitemap',
      endpoint: '/sitemap.xml',
      expectedMaxMs: 1000
    }
  ];
  
  for (const asset of staticAssets) {
    await testSingleEndpoint(asset.name, asset);
  }
  
  // Test 4: Form endpoints performance
  console.log('\n🔍 Testing Form Submission Endpoints:');
  
  // Test OPTIONS for CORS
  await testSingleEndpoint('Extension CORS Preflight', {
    endpoint: '/api/extension/secure-validate',
    method: 'OPTIONS',
    expectedMaxMs: 500
  });
  
  // Test 5: Error handling performance
  console.log('\n🔍 Testing Error Handling Performance:');
  
  await testSingleEndpoint('404 Page Performance', {
    endpoint: '/this-page-does-not-exist',
    expectedMaxMs: 2000
  });
  
  // Generate summary report
  console.log('\n' + '='.repeat(80));
  console.log('📊 PRODUCTION PERFORMANCE SUMMARY');
  console.log('='.repeat(80));
  console.log(`📈 Total Tests: ${performanceResults.summary.totalTests}`);
  console.log(`✅ Passed: ${performanceResults.summary.passed}`);
  console.log(`⚠️  Warnings: ${performanceResults.summary.warnings}`);
  console.log(`❌ Failed: ${performanceResults.summary.failed}`);
  
  const successRate = ((performanceResults.summary.passed / performanceResults.summary.totalTests) * 100).toFixed(1);
  console.log(`📊 Success Rate: ${successRate}%`);
  
  // Calculate average response times
  const responseTimes = performanceResults.endpoints.map(e => e.responseTime);
  const avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
  const maxResponseTime = Math.max(...responseTimes);
  const minResponseTime = Math.min(...responseTimes);
  
  console.log(`⏱️  Response Times: Avg ${avgResponseTime}ms, Range ${minResponseTime}-${maxResponseTime}ms`);
  
  // Load test summary
  if (performanceResults.loadTests.length > 0) {
    console.log('\n📊 Load Test Results:');
    performanceResults.loadTests.forEach(test => {
      console.log(`   ${test.endpoint}: ${test.successCount}/${test.concurrency} succeeded, avg ${Math.round(test.avgResponseTime)}ms`);
    });
  }
  
  // Performance recommendations
  console.log('\n💡 Performance Analysis:');
  if (performanceResults.summary.failed === 0 && avgResponseTime < 2000) {
    console.log('🎉 Excellent performance! Site is production ready.');
  } else if (performanceResults.summary.failed <= 2 && avgResponseTime < 4000) {
    console.log('✅ Good performance with minor issues to address.');
  } else {
    console.log('⚠️  Performance issues detected. Review slow endpoints.');
  }
  
  // Identify slowest endpoints
  const slowestEndpoints = performanceResults.endpoints
    .filter(e => e.responseTime > 3000)
    .sort((a, b) => b.responseTime - a.responseTime)
    .slice(0, 3);
  
  if (slowestEndpoints.length > 0) {
    console.log('\n🐌 Slowest Endpoints:');
    slowestEndpoints.forEach(endpoint => {
      console.log(`   ${endpoint.endpoint}: ${endpoint.responseTime}ms`);
    });
  }
  
  // Save detailed report
  const reportPath = `production-performance-report-${Date.now()}.json`;
  require('fs').writeFileSync(reportPath, JSON.stringify({
    summary: {
      timestamp: new Date().toISOString(),
      target: PRODUCTION_BASE_URL,
      ...performanceResults.summary,
      avgResponseTime,
      maxResponseTime,
      minResponseTime,
      successRate: successRate + '%'
    },
    endpoints: performanceResults.endpoints,
    loadTests: performanceResults.loadTests
  }, null, 2));
  
  console.log(`\n📄 Detailed performance report saved: ${reportPath}`);
}

if (require.main === module) {
  runPerformanceTests().catch(console.error);
}

module.exports = { runPerformanceTests };