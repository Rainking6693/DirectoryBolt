// 🔧 STRIPE API DEBUGGER - Comprehensive debugging and testing of Stripe checkout API
// This script systematically tests all possible failure scenarios and provides detailed diagnostics

// Load environment variables
require('dotenv').config({ path: ['.env.local', '.env.production', '.env'] });

const axios = require('axios');
const fs = require('fs');
const path = require('path');

class StripeApiDebugger {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = {
      timestamp: new Date().toISOString(),
      baseUrl: baseUrl,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      tests: [],
      summary: {},
      recommendations: []
    };
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, level, message, data };
    
    switch (level) {
      case 'SUCCESS':
        console.log(`✅ ${message}`, data ? JSON.stringify(data, null, 2) : '');
        break;
      case 'ERROR':
        console.error(`❌ ${message}`, data ? JSON.stringify(data, null, 2) : '');
        break;
      case 'WARNING':
        console.warn(`⚠️  ${message}`, data ? JSON.stringify(data, null, 2) : '');
        break;
      case 'INFO':
        console.log(`ℹ️  ${message}`, data ? JSON.stringify(data, null, 2) : '');
        break;
    }
  }

  async runTest(testName, testFunction) {
    this.results.totalTests++;
    const startTime = Date.now();
    
    this.log('INFO', `Running test: ${testName}`);
    
    try {
      const result = await testFunction();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.results.passedTests++;
      this.results.tests.push({
        name: testName,
        status: 'PASSED',
        duration: `${duration}ms`,
        result: result,
        error: null
      });
      
      this.log('SUCCESS', `Test passed: ${testName} (${duration}ms)`);
      return { success: true, result, duration };
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      this.results.failedTests++;
      this.results.tests.push({
        name: testName,
        status: 'FAILED',
        duration: `${duration}ms`,
        result: null,
        error: {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          status: error.response?.status
        }
      });
      
      this.log('ERROR', `Test failed: ${testName} (${duration}ms)`, {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      return { success: false, error, duration };
    }
  }

  async testValidCheckoutRequest() {
    return await this.runTest('Valid Checkout Request', async () => {
      const response = await axios.post(`${this.baseUrl}/api/create-checkout-session`, {
        plan: 'starter',
        user_email: 'test@example.com',
        user_id: 'test_user_123',
        success_url: `${this.baseUrl}/success`,
        cancel_url: `${this.baseUrl}/cancel`
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000
      });

      if (response.status !== 200) {
        throw new Error(`Expected 200, got ${response.status}`);
      }

      if (!response.data.success) {
        throw new Error('Response indicates failure');
      }

      if (!response.data.data.checkout_session) {
        throw new Error('No checkout session in response');
      }

      return {
        status: response.status,
        has_checkout_url: !!response.data.data.checkout_session.url,
        session_id: response.data.data.checkout_session.id,
        plan_details: response.data.data.plan_details
      };
    });
  }

  async testMissingPlanParameter() {
    return await this.runTest('Missing Plan Parameter', async () => {
      const response = await axios.post(`${this.baseUrl}/api/create-checkout-session`, {
        user_email: 'test@example.com',
        user_id: 'test_user_123'
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
        validateStatus: () => true // Don't throw on non-2xx status
      });

      if (response.status === 200) {
        throw new Error('Expected error response, but got 200');
      }

      return {
        status: response.status,
        error_message: response.data.error?.message,
        error_code: response.data.error?.code
      };
    });
  }

  async testInvalidPlan() {
    return await this.runTest('Invalid Plan', async () => {
      const response = await axios.post(`${this.baseUrl}/api/create-checkout-session`, {
        plan: 'invalid_plan',
        user_email: 'test@example.com',
        user_id: 'test_user_123'
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
        validateStatus: () => true
      });

      if (response.status === 200) {
        throw new Error('Expected error response, but got 200');
      }

      return {
        status: response.status,
        error_message: response.data.error?.message,
        error_code: response.data.error?.code
      };
    });
  }

  async testMissingUserData() {
    return await this.runTest('Missing User Data', async () => {
      const response = await axios.post(`${this.baseUrl}/api/create-checkout-session`, {
        plan: 'starter'
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
        validateStatus: () => true
      });

      if (response.status === 200) {
        throw new Error('Expected error response, but got 200');
      }

      return {
        status: response.status,
        error_message: response.data.error?.message,
        error_code: response.data.error?.code
      };
    });
  }

  async testEmptyRequestBody() {
    return await this.runTest('Empty Request Body', async () => {
      const response = await axios.post(`${this.baseUrl}/api/create-checkout-session`, {}, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
        validateStatus: () => true
      });

      if (response.status === 200) {
        throw new Error('Expected error response, but got 200');
      }

      return {
        status: response.status,
        error_message: response.data.error?.message,
        error_code: response.data.error?.code
      };
    });
  }

  async testMalformedJSON() {
    return await this.runTest('Malformed JSON', async () => {
      try {
        const response = await axios.post(`${this.baseUrl}/api/create-checkout-session`, 
          '{"plan": "starter", "malformed": }', // Invalid JSON
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000,
            validateStatus: () => true
          }
        );

        return {
          status: response.status,
          error_message: response.data.error?.message,
          error_code: response.data.error?.code
        };
      } catch (error) {
        // Network/parsing error is expected
        return {
          status: 'NETWORK_ERROR',
          error_message: error.message,
          error_code: error.code
        };
      }
    });
  }

  async testGetMethod() {
    return await this.runTest('GET Method (Should Fail)', async () => {
      const response = await axios.get(`${this.baseUrl}/api/create-checkout-session`, {
        timeout: 5000,
        validateStatus: () => true
      });

      if (response.status === 200) {
        throw new Error('Expected error response for GET method, but got 200');
      }

      return {
        status: response.status,
        error_message: response.data.error?.message,
        allowed_methods: response.headers.allow
      };
    });
  }

  async testAllPlans() {
    const plans = ['starter', 'growth', 'professional', 'enterprise'];
    const planResults = {};

    for (const plan of plans) {
      const result = await this.runTest(`Plan: ${plan}`, async () => {
        const response = await axios.post(`${this.baseUrl}/api/create-checkout-session`, {
          plan: plan,
          user_email: `test-${plan}@example.com`,
          user_id: `test_user_${plan}_123`
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000
        });

        return {
          status: response.status,
          plan_name: response.data.data?.plan_details?.name,
          price: response.data.data?.plan_details?.price,
          checkout_url: response.data.data?.checkout_session?.url
        };
      });

      planResults[plan] = result;
    }

    return planResults;
  }

  async testExtendedTrialParameter() {
    return await this.runTest('Extended Trial Parameter', async () => {
      const response = await axios.post(`${this.baseUrl}/api/create-checkout-session`, {
        plan: 'starter',
        user_email: 'trial-test@example.com',
        user_id: 'trial_user_123',
        extended_trial: true
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      return {
        status: response.status,
        trial_period_days: response.data.data?.trial_period_days,
        checkout_url: response.data.data?.checkout_session?.url
      };
    });
  }

  async testLargePayload() {
    return await this.runTest('Large Payload', async () => {
      const largeString = 'x'.repeat(10000); // 10KB string
      
      const response = await axios.post(`${this.baseUrl}/api/create-checkout-session`, {
        plan: 'starter',
        user_email: 'large-payload@example.com',
        user_id: 'large_payload_user_123',
        large_field: largeString
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15000,
        validateStatus: () => true
      });

      return {
        status: response.status,
        payload_size: JSON.stringify({ large_field: largeString }).length,
        success: response.data.success
      };
    });
  }

  async testRapidRequests() {
    return await this.runTest('Rapid Requests (Rate Limiting)', async () => {
      const promises = [];
      const requestCount = 10;

      for (let i = 0; i < requestCount; i++) {
        promises.push(
          axios.post(`${this.baseUrl}/api/create-checkout-session`, {
            plan: 'starter',
            user_email: `rapid-${i}@example.com`,
            user_id: `rapid_user_${i}`
          }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 5000,
            validateStatus: () => true
          })
        );
      }

      const responses = await Promise.all(promises);
      const statusCodes = responses.map(r => r.status);
      const successCount = statusCodes.filter(code => code === 200).length;
      const rateLimitCount = statusCodes.filter(code => code === 429).length;

      return {
        total_requests: requestCount,
        successful_requests: successCount,
        rate_limited_requests: rateLimitCount,
        status_distribution: statusCodes.reduce((acc, code) => {
          acc[code] = (acc[code] || 0) + 1;
          return acc;
        }, {})
      };
    });
  }

  async testServerStatus() {
    return await this.runTest('Server Health Check', async () => {
      try {
        const response = await axios.get(`${this.baseUrl}/api/health`, {
          timeout: 5000
        });

        return {
          status: response.status,
          server_time: response.data.timestamp,
          uptime: response.data.uptime
        };
      } catch (error) {
        // Try alternative endpoint
        const response = await axios.get(`${this.baseUrl}/`, {
          timeout: 5000
        });

        return {
          status: response.status,
          fallback_endpoint: true
        };
      }
    });
  }

  generateSummary() {
    this.results.summary = {
      total_tests: this.results.totalTests,
      passed: this.results.passedTests,
      failed: this.results.failedTests,
      success_rate: Math.round((this.results.passedTests / this.results.totalTests) * 100),
      test_duration: this.results.tests.reduce((sum, test) => {
        return sum + parseInt(test.duration.replace('ms', ''));
      }, 0)
    };

    // Generate recommendations based on failures
    const failedTests = this.results.tests.filter(test => test.status === 'FAILED');
    
    if (failedTests.length > 0) {
      this.results.recommendations.push({
        priority: 'HIGH',
        category: 'FAILED_TESTS',
        message: `${failedTests.length} tests failed`,
        details: failedTests.map(test => ({
          test: test.name,
          error: test.error?.message,
          status_code: test.error?.status
        }))
      });
    }

    // Check for specific error patterns
    const stripeErrors = failedTests.filter(test => 
      test.error?.message?.includes('Stripe') || 
      test.error?.code?.includes('stripe')
    );

    if (stripeErrors.length > 0) {
      this.results.recommendations.push({
        priority: 'CRITICAL',
        category: 'STRIPE_INTEGRATION',
        message: 'Stripe integration issues detected',
        details: stripeErrors.map(test => test.error)
      });
    }

    return this.results;
  }

  async runAllTests() {
    console.log('🔧 Starting Stripe API Debugging Suite...\n');
    console.log(`Testing endpoint: ${this.baseUrl}/api/create-checkout-session\n`);

    // Run server status check first
    await this.testServerStatus();

    // Basic functionality tests
    await this.testValidCheckoutRequest();
    
    // Error handling tests
    await this.testMissingPlanParameter();
    await this.testInvalidPlan();
    await this.testMissingUserData();
    await this.testEmptyRequestBody();
    await this.testMalformedJSON();
    await this.testGetMethod();
    
    // Plan-specific tests
    await this.testAllPlans();
    
    // Feature tests
    await this.testExtendedTrialParameter();
    
    // Stress tests
    await this.testLargePayload();
    await this.testRapidRequests();

    // Generate final summary
    const summary = this.generateSummary();

    console.log('\n📊 DEBUGGING SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${summary.summary.passed}/${summary.summary.total_tests}`);
    console.log(`❌ Failed: ${summary.summary.failed}/${summary.summary.total_tests}`);
    console.log(`📈 Success Rate: ${summary.summary.success_rate}%`);
    console.log(`⏱️  Total Duration: ${summary.summary.test_duration}ms`);

    if (summary.recommendations.length > 0) {
      console.log('\n🔍 RECOMMENDATIONS:');
      summary.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority}] ${rec.category}: ${rec.message}`);
      });
    }

    // Save detailed report
    const reportPath = path.join(process.cwd(), 'stripe-api-debug-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    return summary;
  }
}

// CLI usage
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  const apiDebugger = new StripeApiDebugger(baseUrl);
  
  apiDebugger.runAllTests()
    .then(results => {
      process.exit(results.summary.success_rate >= 80 ? 0 : 1);
    })
    .catch(error => {
      console.error('Debugging suite failed:', error);
      process.exit(1);
    });
}

module.exports = StripeApiDebugger;