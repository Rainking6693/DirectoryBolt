#!/usr/bin/env node
/**
 * 🔍 COMPREHENSIVE QA TEST SUITE: DirectoryBolt Stripe Checkout Flow
 * 
 * This script comprehensively tests all aspects of the Stripe checkout integration
 * including pricing plans, add-ons, success/cancel flows, and edge cases.
 * 
 * Author: Claude QA Engineer
 * Date: 2025-08-30
 */

const fs = require('fs');
const https = require('https');
const { URL } = require('url');

// Test Configuration
const TEST_CONFIG = {
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
  TIMEOUT: 10000,
  DEBUG: true,
  OUTPUT_FILE: 'stripe_checkout_qa_report.json'
};

// Expected Pricing Structure (from requirements)
const EXPECTED_PRICING = {
  plans: {
    starter: { price: 49, name: 'Starter' },
    growth: { price: 89, name: 'Growth' },
    pro: { price: 159, name: 'Pro' },
    subscription: { price: 49, name: 'Subscription', recurring: true }
  },
  addons: {
    fasttrack: { price: 25, name: 'Fast-Track Submission' },
    premium: { price: 15, name: 'Premium Directories Only' },
    qa: { price: 10, name: 'Manual QA Review' },
    csv: { price: 9, name: 'CSV Export' }
  }
};

// Test Results Storage
const testResults = {
  timestamp: new Date().toISOString(),
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  tests: [],
  issues: {
    critical: [],
    major: [],
    minor: []
  }
};

/**
 * Utility Functions
 */
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '🔍',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    debug: '🐛'
  };
  
  console.log(`${prefix[type]} [${timestamp}] ${message}`);
  
  if (TEST_CONFIG.DEBUG || type !== 'debug') {
    // Could also write to log file here
  }
}

function addTestResult(testName, status, details = '', issues = []) {
  testResults.summary.total++;
  testResults.summary[status]++;
  
  const result = {
    test: testName,
    status,
    details,
    issues,
    timestamp: new Date().toISOString()
  };
  
  testResults.tests.push(result);
  
  // Add to appropriate issue category
  issues.forEach(issue => {
    if (issue.severity) {
      testResults.issues[issue.severity].push({
        test: testName,
        ...issue
      });
    }
  });
  
  log(`${testName}: ${status.toUpperCase()}${details ? ' - ' + details : ''}`, status === 'passed' ? 'success' : status === 'failed' ? 'error' : 'warning');
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Request timeout after ${TEST_CONFIG.TIMEOUT}ms`));
    }, TEST_CONFIG.TIMEOUT);

    const parsedUrl = new URL(url);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DirectoryBolt-QA-Test/1.0',
        ...options.headers
      }
    };

    const protocol = parsedUrl.protocol === 'https:' ? https : require('http');
    const req = protocol.request(requestOptions, (res) => {
      clearTimeout(timeout);
      let data = '';
      
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    
    req.end();
  });
}

/**
 * Test Suite 1: Pricing Plan Validation
 */
async function testPricingPlansAPI() {
  log('Starting Pricing Plans API Tests...', 'info');
  
  for (const [planId, expectedPlan] of Object.entries(EXPECTED_PRICING.plans)) {
    try {
      const response = await makeRequest(`${TEST_CONFIG.BASE_URL}/api/create-checkout-session-v3`, {
        method: 'POST',
        body: {
          plan: planId,
          customerEmail: 'test@qa.directorybolt.com',
          success_url: `${TEST_CONFIG.BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`,
          cancel_url: `${TEST_CONFIG.BASE_URL}/pricing?cancelled=true&plan=${planId}`
        }
      });
      
      if (response.statusCode === 200 && response.data.success) {
        const issues = [];
        
        // Validate session ID exists
        if (!response.data.sessionId) {
          issues.push({
            severity: 'critical',
            message: 'No session ID returned',
            impact: 'Checkout flow will fail'
          });
        }
        
        // Validate checkout URL exists
        if (!response.data.checkoutUrl) {
          issues.push({
            severity: 'critical',
            message: 'No checkout URL returned',
            impact: 'Users cannot proceed to payment'
          });
        }
        
        // Validate pricing consistency (if available in response)
        if (response.data.totalAmount && response.data.totalAmount !== expectedPlan.price) {
          issues.push({
            severity: 'major',
            message: `Price mismatch: expected $${expectedPlan.price}, got $${response.data.totalAmount}`,
            impact: 'Incorrect pricing shown to customers'
          });
        }
        
        if (issues.length === 0) {
          addTestResult(
            `Checkout Session Creation - ${expectedPlan.name} Plan`,
            'passed',
            `Session created successfully: ${response.data.sessionId}`
          );
        } else {
          addTestResult(
            `Checkout Session Creation - ${expectedPlan.name} Plan`,
            'failed',
            `${issues.length} critical issues found`,
            issues
          );
        }
        
      } else {
        addTestResult(
          `Checkout Session Creation - ${expectedPlan.name} Plan`,
          'failed',
          `API returned error: ${response.data?.error || response.statusCode}`,
          [{
            severity: 'critical',
            message: response.data?.error || `HTTP ${response.statusCode}`,
            impact: 'Checkout completely broken for this plan'
          }]
        );
      }
      
    } catch (error) {
      addTestResult(
        `Checkout Session Creation - ${expectedPlan.name} Plan`,
        'failed',
        `Request failed: ${error.message}`,
        [{
          severity: 'critical',
          message: error.message,
          impact: 'Network/server error preventing checkout'
        }]
      );
    }
  }
}

/**
 * Test Suite 2: Add-on Combinations
 */
async function testAddonCombinations() {
  log('Starting Add-on Combinations Tests...', 'info');
  
  const testCombinations = [
    // Single add-ons
    { plan: 'starter', addons: ['fasttrack'], expectedExtra: 25 },
    { plan: 'growth', addons: ['premium'], expectedExtra: 15 },
    { plan: 'pro', addons: ['qa'], expectedExtra: 10 },
    
    // Multiple add-ons
    { plan: 'growth', addons: ['fasttrack', 'premium'], expectedExtra: 40 },
    { plan: 'pro', addons: ['fasttrack', 'premium', 'qa'], expectedExtra: 50 },
    { plan: 'starter', addons: ['fasttrack', 'premium', 'qa', 'csv'], expectedExtra: 59 },
    
    // Edge case: all add-ons with each plan
    { plan: 'starter', addons: ['fasttrack', 'premium', 'qa', 'csv'], expectedExtra: 59 },
    { plan: 'growth', addons: ['fasttrack', 'premium', 'qa', 'csv'], expectedExtra: 59 },
    { plan: 'pro', addons: ['fasttrack', 'premium', 'qa', 'csv'], expectedExtra: 59 }
  ];
  
  for (const combo of testCombinations) {
    try {
      const response = await makeRequest(`${TEST_CONFIG.BASE_URL}/api/create-checkout-session-v3`, {
        method: 'POST',
        body: {
          plan: combo.plan,
          addons: combo.addons,
          customerEmail: 'test@qa.directorybolt.com'
        }
      });
      
      if (response.statusCode === 200 && response.data.success) {
        const basePlanPrice = EXPECTED_PRICING.plans[combo.plan].price;
        const expectedTotal = basePlanPrice + combo.expectedExtra;
        const actualTotal = response.data.totalAmount;
        
        if (actualTotal === expectedTotal) {
          addTestResult(
            `Add-on Combination - ${combo.plan} + [${combo.addons.join(', ')}]`,
            'passed',
            `Total calculated correctly: $${actualTotal}`
          );
        } else {
          addTestResult(
            `Add-on Combination - ${combo.plan} + [${combo.addons.join(', ')}]`,
            'failed',
            `Price mismatch: expected $${expectedTotal}, got $${actualTotal}`,
            [{
              severity: 'major',
              message: `Incorrect total calculation`,
              impact: 'Customers charged wrong amount'
            }]
          );
        }
      } else {
        addTestResult(
          `Add-on Combination - ${combo.plan} + [${combo.addons.join(', ')}]`,
          'failed',
          `API error: ${response.data?.error || response.statusCode}`,
          [{
            severity: 'major',
            message: 'Add-on combination failed to create session',
            impact: 'Customers cannot purchase add-on combinations'
          }]
        );
      }
      
    } catch (error) {
      addTestResult(
        `Add-on Combination - ${combo.plan} + [${combo.addons.join(', ')}]`,
        'failed',
        `Request failed: ${error.message}`,
        [{
          severity: 'critical',
          message: error.message,
          impact: 'Add-on checkout completely broken'
        }]
      );
    }
  }
}

/**
 * Test Suite 3: Success/Cancel Page Functionality
 */
async function testSuccessCancelPages() {
  log('Starting Success/Cancel Pages Tests...', 'info');
  
  // Test success page with valid session ID format
  try {
    const testSessionId = 'cs_test_' + Math.random().toString(36).substr(2, 9);
    const response = await makeRequest(`${TEST_CONFIG.BASE_URL}/success?session_id=${testSessionId}&plan=growth`);
    
    if (response.statusCode === 200) {
      // Check if page contains expected elements
      const pageContent = response.rawData;
      const checks = [
        { element: 'Payment Successful', found: pageContent.includes('Payment Successful') },
        { element: 'Order ID', found: pageContent.includes('Order ID') || pageContent.includes(testSessionId) },
        { element: 'What happens next', found: pageContent.includes('What happens next') },
        { element: 'Support contact', found: pageContent.includes('support@directorybolt.com') }
      ];
      
      const missingElements = checks.filter(check => !check.found);
      
      if (missingElements.length === 0) {
        addTestResult(
          'Success Page Content',
          'passed',
          'All required elements present'
        );
      } else {
        addTestResult(
          'Success Page Content',
          'failed',
          `Missing elements: ${missingElements.map(e => e.element).join(', ')}`,
          [{
            severity: 'minor',
            message: 'Success page missing some expected content',
            impact: 'Poor user experience after successful payment'
          }]
        );
      }
    } else {
      addTestResult(
        'Success Page Content',
        'failed',
        `HTTP ${response.statusCode}`,
        [{
          severity: 'major',
          message: 'Success page not accessible',
          impact: 'Users see error after successful payment'
        }]
      );
    }
  } catch (error) {
    addTestResult(
      'Success Page Content',
      'failed',
      error.message,
      [{
        severity: 'major',
        message: 'Success page request failed',
        impact: 'Success page completely broken'
      }]
    );
  }
  
  // Test cancel page
  try {
    const response = await makeRequest(`${TEST_CONFIG.BASE_URL}/pricing?cancelled=true&plan=growth`);
    
    if (response.statusCode === 200) {
      addTestResult(
        'Cancel Page Redirect',
        'passed',
        'Pricing page accessible with cancel parameter'
      );
    } else {
      addTestResult(
        'Cancel Page Redirect',
        'failed',
        `HTTP ${response.statusCode}`,
        [{
          severity: 'minor',
          message: 'Cancel redirect not working properly',
          impact: 'Poor user experience when canceling checkout'
        }]
      );
    }
  } catch (error) {
    addTestResult(
      'Cancel Page Redirect',
      'failed',
      error.message,
      [{
        severity: 'minor',
        message: 'Cancel page request failed',
        impact: 'Cancel flow broken'
      }]
    );
  }
}

/**
 * Test Suite 4: Edge Cases and Error Handling
 */
async function testEdgeCases() {
  log('Starting Edge Cases and Error Handling Tests...', 'info');
  
  const edgeCases = [
    {
      name: 'Invalid Plan ID',
      payload: { plan: 'invalid_plan' },
      expectedStatus: 400,
      severity: 'minor'
    },
    {
      name: 'Empty Plan ID',
      payload: { plan: '' },
      expectedStatus: 400,
      severity: 'minor'
    },
    {
      name: 'Missing Plan Parameter',
      payload: {},
      expectedStatus: 400,
      severity: 'minor'
    },
    {
      name: 'Invalid Add-on',
      payload: { plan: 'starter', addons: ['invalid_addon'] },
      expectedStatus: 400,
      severity: 'minor'
    },
    {
      name: 'Malformed Request Body',
      payload: 'invalid json',
      expectedStatus: 400,
      severity: 'minor'
    }
  ];
  
  for (const testCase of edgeCases) {
    try {
      const response = await makeRequest(`${TEST_CONFIG.BASE_URL}/api/create-checkout-session-v3`, {
        method: 'POST',
        body: testCase.payload
      });
      
      const isExpectedError = response.statusCode >= 400 && response.statusCode < 500;
      const hasErrorMessage = response.data && response.data.error;
      
      if (isExpectedError && hasErrorMessage) {
        addTestResult(
          `Edge Case - ${testCase.name}`,
          'passed',
          `Properly handled with ${response.statusCode}: ${response.data.error}`
        );
      } else if (response.statusCode === 200) {
        addTestResult(
          `Edge Case - ${testCase.name}`,
          'failed',
          'Expected error but request succeeded',
          [{
            severity: testCase.severity,
            message: 'Invalid request not properly rejected',
            impact: 'Could lead to unexpected behavior'
          }]
        );
      } else {
        addTestResult(
          `Edge Case - ${testCase.name}`,
          'warning',
          `Unexpected response: ${response.statusCode}`,
          [{
            severity: 'minor',
            message: 'Non-standard error response',
            impact: 'Error handling could be more consistent'
          }]
        );
      }
      
    } catch (error) {
      addTestResult(
        `Edge Case - ${testCase.name}`,
        'failed',
        `Request failed: ${error.message}`,
        [{
          severity: 'major',
          message: 'Edge case handling crashed',
          impact: 'Server errors on invalid input'
        }]
      );
    }
  }
}

/**
 * Test Suite 5: API Performance and Response Times
 */
async function testPerformance() {
  log('Starting Performance Tests...', 'info');
  
  const performanceTests = [];
  
  // Test response time for standard checkout
  for (let i = 0; i < 3; i++) {
    const startTime = Date.now();
    
    try {
      const response = await makeRequest(`${TEST_CONFIG.BASE_URL}/api/create-checkout-session-v3`, {
        method: 'POST',
        body: {
          plan: 'growth',
          addons: ['fasttrack']
        }
      });
      
      const responseTime = Date.now() - startTime;
      performanceTests.push(responseTime);
      
      if (responseTime > 5000) {
        addTestResult(
          `Performance Test ${i + 1}`,
          'warning',
          `Slow response: ${responseTime}ms`,
          [{
            severity: 'minor',
            message: 'Checkout API response time over 5 seconds',
            impact: 'Poor user experience due to slow checkout'
          }]
        );
      } else {
        addTestResult(
          `Performance Test ${i + 1}`,
          'passed',
          `Response time: ${responseTime}ms`
        );
      }
      
    } catch (error) {
      addTestResult(
        `Performance Test ${i + 1}`,
        'failed',
        error.message,
        [{
          severity: 'major',
          message: 'Performance test failed',
          impact: 'Checkout reliability issues'
        }]
      );
    }
  }
  
  if (performanceTests.length > 0) {
    const avgTime = performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length;
    log(`Average response time: ${Math.round(avgTime)}ms`, 'info');
  }
}

/**
 * Test Suite 6: Session Details API
 */
async function testSessionDetailsAPI() {
  log('Starting Session Details API Tests...', 'info');
  
  // Test with mock session ID
  try {
    const testSessionId = 'cs_test_mock_session_id';
    const response = await makeRequest(`${TEST_CONFIG.BASE_URL}/api/checkout-session-details?session_id=${testSessionId}`);
    
    // This will likely fail in testing environment, but we check if API exists and handles errors properly
    if (response.statusCode === 200) {
      addTestResult(
        'Session Details API - Success Case',
        'passed',
        'API returned session details successfully'
      );
    } else if (response.statusCode >= 400 && response.data && response.data.error) {
      addTestResult(
        'Session Details API - Error Handling',
        'passed',
        `Properly handled invalid session: ${response.data.error}`
      );
    } else {
      addTestResult(
        'Session Details API - Error Handling',
        'warning',
        `Unexpected response: ${response.statusCode}`,
        [{
          severity: 'minor',
          message: 'Session details API error handling unclear',
          impact: 'Success page may not show order details properly'
        }]
      );
    }
    
  } catch (error) {
    addTestResult(
      'Session Details API',
      'failed',
      error.message,
      [{
        severity: 'major',
        message: 'Session details API not accessible',
        impact: 'Success page cannot show order information'
      }]
    );
  }
}

/**
 * Generate Comprehensive Report
 */
function generateReport() {
  log('Generating comprehensive QA report...', 'info');
  
  // Calculate success rate
  const successRate = testResults.summary.total > 0 
    ? Math.round((testResults.summary.passed / testResults.summary.total) * 100) 
    : 0;
  
  // Generate summary
  const summary = {
    overview: {
      timestamp: testResults.timestamp,
      totalTests: testResults.summary.total,
      passed: testResults.summary.passed,
      failed: testResults.summary.failed,
      warnings: testResults.summary.warnings,
      successRate: `${successRate}%`
    },
    criticalIssues: testResults.issues.critical.length,
    majorIssues: testResults.issues.major.length,
    minorIssues: testResults.issues.minor.length
  };
  
  // Generate recommendations
  const recommendations = [];
  
  if (testResults.issues.critical.length > 0) {
    recommendations.push('🚨 CRITICAL: Address all critical issues immediately before deployment');
  }
  
  if (testResults.issues.major.length > 0) {
    recommendations.push('⚠️ MAJOR: Fix major issues to ensure proper checkout functionality');
  }
  
  if (successRate < 90) {
    recommendations.push('📊 SUCCESS RATE: Overall test success rate is below 90% - review all failing tests');
  }
  
  if (testResults.summary.failed > 5) {
    recommendations.push('🔧 STABILITY: High number of failed tests indicates system instability');
  }
  
  // Final report structure
  const finalReport = {
    summary,
    recommendations,
    detailedResults: testResults,
    testCategories: {
      pricingPlans: testResults.tests.filter(t => t.test.includes('Checkout Session Creation')),
      addonCombinations: testResults.tests.filter(t => t.test.includes('Add-on Combination')),
      successPages: testResults.tests.filter(t => t.test.includes('Success Page') || t.test.includes('Cancel Page')),
      edgeCases: testResults.tests.filter(t => t.test.includes('Edge Case')),
      performance: testResults.tests.filter(t => t.test.includes('Performance Test')),
      sessionAPI: testResults.tests.filter(t => t.test.includes('Session Details'))
    }
  };
  
  // Write report to file
  try {
    fs.writeFileSync(TEST_CONFIG.OUTPUT_FILE, JSON.stringify(finalReport, null, 2));
    log(`Report saved to ${TEST_CONFIG.OUTPUT_FILE}`, 'success');
  } catch (error) {
    log(`Failed to save report: ${error.message}`, 'error');
  }
  
  return finalReport;
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  log('🚀 Starting Comprehensive DirectoryBolt Stripe Checkout QA Test Suite', 'info');
  log(`Base URL: ${TEST_CONFIG.BASE_URL}`, 'info');
  log(`Timeout: ${TEST_CONFIG.TIMEOUT}ms`, 'info');
  
  const startTime = Date.now();
  
  try {
    // Run all test suites
    await testPricingPlansAPI();
    await testAddonCombinations();
    await testSuccessCancelPages();
    await testEdgeCases();
    await testPerformance();
    await testSessionDetailsAPI();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    log(`All tests completed in ${duration}ms`, 'info');
    
    // Generate and display report
    const report = generateReport();
    
    // Console summary
    console.log('\n' + '='.repeat(80));
    console.log('🎯 DIRECTORYBOLТ STRIPE CHECKOUT QA TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`📊 Tests Run: ${report.summary.overview.totalTests}`);
    console.log(`✅ Passed: ${report.summary.overview.passed}`);
    console.log(`❌ Failed: ${report.summary.overview.failed}`);
    console.log(`⚠️ Warnings: ${report.summary.overview.warnings}`);
    console.log(`📈 Success Rate: ${report.summary.overview.successRate}`);
    console.log(`⏱️ Duration: ${duration}ms`);
    console.log('');
    console.log(`🚨 Critical Issues: ${report.criticalIssues}`);
    console.log(`⚠️ Major Issues: ${report.majorIssues}`);
    console.log(`ℹ️ Minor Issues: ${report.minorIssues}`);
    
    if (report.recommendations.length > 0) {
      console.log('\n📋 RECOMMENDATIONS:');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }
    
    console.log('\n📄 Detailed report saved to:', TEST_CONFIG.OUTPUT_FILE);
    console.log('='.repeat(80));
    
    // Exit with appropriate code
    const hasCtiticalOrMajor = report.criticalIssues > 0 || report.majorIssues > 0;
    process.exit(hasCtiticalOrMajor ? 1 : 0);
    
  } catch (error) {
    log(`Test suite failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
DirectoryBolt Stripe Checkout QA Test Suite

Usage: node comprehensive_stripe_checkout_test.js [options]

Options:
  --help, -h          Show this help message
  --base-url URL      Set base URL for testing (default: http://localhost:3000)
  --timeout MS        Set request timeout in milliseconds (default: 10000)
  --output FILE       Set output file for report (default: stripe_checkout_qa_report.json)
  --no-debug          Disable debug logging

Examples:
  node comprehensive_stripe_checkout_test.js
  node comprehensive_stripe_checkout_test.js --base-url https://directorybolt.com
  node comprehensive_stripe_checkout_test.js --timeout 5000 --output qa-report.json
  `);
  process.exit(0);
}

// Parse command line arguments
args.forEach((arg, index) => {
  if (arg === '--base-url' && args[index + 1]) {
    TEST_CONFIG.BASE_URL = args[index + 1];
  } else if (arg === '--timeout' && args[index + 1]) {
    TEST_CONFIG.TIMEOUT = parseInt(args[index + 1], 10);
  } else if (arg === '--output' && args[index + 1]) {
    TEST_CONFIG.OUTPUT_FILE = args[index + 1];
  } else if (arg === '--no-debug') {
    TEST_CONFIG.DEBUG = false;
  }
});

// Run the tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  TEST_CONFIG,
  testResults
};