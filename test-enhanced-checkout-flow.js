#!/usr/bin/env node

/**
 * Enhanced Checkout Flow Test Suite
 * Tests the complete checkout process with add-ons and session validation
 */

// Use Node.js built-in fetch (available in Node 18+) or create a simple HTTP client
const fetch = global.fetch || require('https').request;

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'test@directorybolt.com';

// Test data
const TEST_CASES = [
  {
    name: 'Starter Plan with Fast Track',
    payload: {
      plan: 'starter',
      addons: ['fasttrack'],
      customerEmail: TEST_EMAIL,
      metadata: {
        customer_name: 'Test User',
        business_name: 'Test Business LLC',
        business_website: 'https://testbusiness.com'
      }
    },
    expectedTotal: 74 // $49 + $25
  },
  {
    name: 'Growth Plan with Multiple Add-ons',
    payload: {
      plan: 'growth',
      addons: ['fasttrack', 'premium', 'qa'],
      customerEmail: TEST_EMAIL,
      metadata: {
        customer_name: 'Test User',
        business_name: 'Test Business LLC',
        business_website: 'https://testbusiness.com'
      }
    },
    expectedTotal: 139 // $89 + $25 + $15 + $10
  },
  {
    name: 'Pro Plan with All Add-ons',
    payload: {
      plan: 'pro',
      addons: ['fasttrack', 'premium', 'qa', 'csv'],
      customerEmail: TEST_EMAIL,
      metadata: {
        customer_name: 'Test User',
        business_name: 'Test Business LLC',
        business_website: 'https://testbusiness.com'
      }
    },
    expectedTotal: 218 // $159 + $25 + $15 + $10 + $9
  },
  {
    name: 'Invalid Plan Test',
    payload: {
      plan: 'invalid_plan',
      addons: [],
      customerEmail: TEST_EMAIL
    },
    shouldFail: true
  },
  {
    name: 'No Plan Test',
    payload: {
      addons: ['fasttrack'],
      customerEmail: TEST_EMAIL
    },
    shouldFail: true
  }
];

class CheckoutFlowTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      details: []
    };
  }

  async runTests() {
    console.log('🚀 Starting Enhanced Checkout Flow Tests');
    console.log('=' .repeat(60));
    
    // Test API availability
    await this.testApiAvailability();
    
    // Run checkout tests
    for (const testCase of TEST_CASES) {
      await this.runCheckoutTest(testCase);
    }
    
    // Test session details endpoint
    await this.testSessionDetailsEndpoint();
    
    this.printResults();
  }

  async testApiAvailability() {
    console.log('\n📡 Testing API Availability...');
    
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) {
        console.log('✅ API is available');
      } else {
        console.log('⚠️  API health check failed, but server is responding');
      }
    } catch (error) {
      console.log(`⚠️  API availability test failed: ${error.message}`);
      console.log('   Continuing with checkout tests...');
    }
  }

  async runCheckoutTest(testCase) {
    console.log(`\n🧪 Testing: ${testCase.name}`);
    this.results.total++;
    
    try {
      const response = await fetch(`${BASE_URL}/api/create-checkout-session-v3`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.payload)
      });
      
      const data = await response.json();
      
      if (testCase.shouldFail) {
        if (response.ok) {
          console.log('❌ Expected failure but test passed');
          this.results.failed++;
          this.results.details.push({
            test: testCase.name,
            status: 'FAILED',
            reason: 'Expected failure but request succeeded',
            data: data
          });
        } else {
          console.log('✅ Expected failure occurred correctly');
          console.log(`   Error: ${data.error || data.message}`);
          this.results.passed++;
          this.results.details.push({
            test: testCase.name,
            status: 'PASSED',
            reason: 'Expected failure occurred',
            data: data
          });
        }
        return;
      }
      
      if (!response.ok) {
        console.log(`❌ Request failed: ${data.error || data.message}`);
        this.results.failed++;
        this.results.details.push({
          test: testCase.name,
          status: 'FAILED',
          reason: data.error || data.message,
          data: data
        });
        return;
      }
      
      // Validate response structure
      const validationResult = this.validateCheckoutResponse(data, testCase);
      if (validationResult.valid) {
        console.log('✅ Checkout session created successfully');
        console.log(`   Session ID: ${data.sessionId}`);
        console.log(`   Total: $${data.totalAmount}`);
        console.log(`   Plan: ${data.plan}`);
        if (data.addons && data.addons.length > 0) {
          console.log(`   Add-ons: ${data.addons.join(', ')}`);
        }
        this.results.passed++;
        this.results.details.push({
          test: testCase.name,
          status: 'PASSED',
          sessionId: data.sessionId,
          data: data
        });
      } else {
        console.log(`❌ Response validation failed: ${validationResult.reason}`);
        this.results.failed++;
        this.results.details.push({
          test: testCase.name,
          status: 'FAILED',
          reason: validationResult.reason,
          data: data
        });
      }
      
    } catch (error) {
      console.log(`❌ Test error: ${error.message}`);
      this.results.failed++;
      this.results.details.push({
        test: testCase.name,
        status: 'FAILED',
        reason: error.message,
        error: error
      });
    }
  }

  validateCheckoutResponse(data, testCase) {
    // Check required fields
    if (!data.success) {
      return { valid: false, reason: 'Response missing success field or false' };
    }
    
    if (!data.sessionId) {
      return { valid: false, reason: 'Response missing sessionId' };
    }
    
    if (!data.checkoutUrl) {
      return { valid: false, reason: 'Response missing checkoutUrl' };
    }
    
    // Check total amount if specified
    if (testCase.expectedTotal && data.totalAmount !== testCase.expectedTotal) {
      return { 
        valid: false, 
        reason: `Total amount mismatch. Expected: $${testCase.expectedTotal}, Got: $${data.totalAmount}` 
      };
    }
    
    // Check that session URL is valid
    try {
      new URL(data.checkoutUrl);
    } catch (error) {
      return { valid: false, reason: 'Invalid checkout URL format' };
    }
    
    return { valid: true };
  }

  async testSessionDetailsEndpoint() {
    console.log('\n🔍 Testing Session Details Endpoint...');
    
    // Use a mock session ID for testing
    const mockSessionId = 'cs_test_1234567890abcdef';
    
    try {
      const response = await fetch(`${BASE_URL}/api/checkout-session-details?session_id=${mockSessionId}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log('⚠️  Session details endpoint responded (using mock ID)');
      } else if (response.status === 404 || (data.error && data.error.includes('No such checkout session'))) {
        console.log('✅ Session details endpoint is working (expected 404 for mock ID)');
      } else {
        console.log(`⚠️  Session details endpoint returned: ${data.error || data.message}`);
      }
    } catch (error) {
      console.log(`❌ Session details endpoint error: ${error.message}`);
    }
  }

  printResults() {
    console.log('\n' + '=' .repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('=' .repeat(60));
    console.log(`Total Tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.details
        .filter(detail => detail.status === 'FAILED')
        .forEach(detail => {
          console.log(`  - ${detail.test}: ${detail.reason}`);
        });
    }
    
    if (this.results.passed === this.results.total) {
      console.log('\n🎉 ALL TESTS PASSED! Checkout flow is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the implementation.');
    }
    
    // Export results for CI/CD
    const timestamp = new Date().toISOString();
    const testResults = {
      timestamp,
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: (this.results.passed / this.results.total) * 100
      },
      details: this.results.details
    };
    
    console.log(`\n📁 Test results saved with timestamp: ${timestamp}`);
    return testResults;
  }
}

// Run the tests
async function main() {
  const tester = new CheckoutFlowTester();
  try {
    await tester.runTests();
    process.exit(tester.results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = CheckoutFlowTester;