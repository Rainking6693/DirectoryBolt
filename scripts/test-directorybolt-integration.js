// 🧪 DIRECTORYBOLT STRIPE INTEGRATION TEST SUITE
// Comprehensive testing for DirectoryBolt payment system

const axios = require('axios');
const { validateStripeConfiguration } = require('../lib/config/directoryBoltProducts');

class DirectoryBoltIntegrationTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async runAllTests() {
    console.log('🚀 Starting DirectoryBolt Integration Tests...\n');
    console.log(`Base URL: ${this.baseUrl}\n`);

    try {
      // Test configuration and environment
      await this.testConfiguration();
      await this.testStripeEnvironment();
      
      // Test API endpoints
      await this.testConfigEndpoint();
      await this.testOneTimeCheckoutEndpoint();
      await this.testSubscriptionCheckoutEndpoint();
      await this.testWebhookEndpoint();
      
      // Test product configurations
      await this.testProductValidation();
      await this.testAddOnCompatibility();
      
      // Test error handling
      await this.testErrorHandling();
      
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async testConfiguration() {
    this.logTest('Configuration Validation');
    
    try {
      const config = validateStripeConfiguration();
      
      this.assert(
        config.configured || config.development_mode,
        'Stripe configuration should be valid or in development mode'
      );
      
      if (!config.configured && !config.development_mode) {
        console.warn('⚠️  Stripe not fully configured - using development mode');
      }
      
      console.log('✅ Configuration test passed');
      
    } catch (error) {
      this.recordError('Configuration test failed', error);
    }
  }

  async testStripeEnvironment() {
    this.logTest('Stripe Environment Variables');
    
    try {
      const requiredVars = [
        'STRIPE_SECRET_KEY',
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
      ];
      
      const optionalVars = [
        'STRIPE_STARTER_PRICE_ID',
        'STRIPE_GROWTH_PRICE_ID', 
        'STRIPE_PRO_PRICE_ID',
        'STRIPE_AUTO_UPDATE_PRICE_ID'
      ];
      
      // Check required variables
      for (const varName of requiredVars) {
        const value = process.env[varName];
        if (!value) {
          console.warn(`⚠️  Missing ${varName} - development mode will be used`);
        } else {
          console.log(`✅ ${varName} is set`);
        }
      }
      
      // Check optional variables
      for (const varName of optionalVars) {
        const value = process.env[varName];
        if (!value) {
          console.log(`ℹ️  ${varName} not set - will use mock value`);
        } else {
          console.log(`✅ ${varName} is set`);
        }
      }
      
      console.log('✅ Environment variables test completed');
      
    } catch (error) {
      this.recordError('Environment variables test failed', error);
    }
  }

  async testConfigEndpoint() {
    this.logTest('Config API Endpoint');
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/config`);
      
      this.assert(response.status === 200, 'Config endpoint should return 200');
      this.assert(response.data.success === true, 'Config should return success: true');
      this.assert(response.data.data, 'Config should contain data object');
      this.assert(response.data.data.products, 'Config should contain products');
      this.assert(response.data.data.stripe, 'Config should contain stripe config');
      
      const { products } = response.data.data;
      
      // Test package structure
      this.assert(products.packages, 'Products should contain packages');
      this.assert(products.packages.starter, 'Should have starter package');
      this.assert(products.packages.growth, 'Should have growth package');
      this.assert(products.packages.pro, 'Should have pro package');
      
      // Test subscription structure
      this.assert(products.subscriptions, 'Products should contain subscriptions');
      this.assert(products.subscriptions.auto_update, 'Should have auto_update subscription');
      
      // Test add-ons structure
      this.assert(products.addOns, 'Products should contain addOns');
      this.assert(products.addOns.fast_track, 'Should have fast_track add-on');
      this.assert(products.addOns.premium_directories, 'Should have premium_directories add-on');
      
      console.log('✅ Config endpoint test passed');
      
    } catch (error) {
      this.recordError('Config endpoint test failed', error);
    }
  }

  async testOneTimeCheckoutEndpoint() {
    this.logTest('One-time Checkout Endpoint');
    
    const testCases = [
      {
        name: 'Starter package without add-ons',
        payload: {
          package: 'starter',
          addOns: [],
          customer_email: 'test@directorybolt.com',
          customer_name: 'Test User'
        }
      },
      {
        name: 'Growth package with fast-track add-on',
        payload: {
          package: 'growth',
          addOns: ['fast_track'],
          customer_email: 'test@directorybolt.com',
          customer_name: 'Test User'
        }
      },
      {
        name: 'Pro package with multiple add-ons',
        payload: {
          package: 'pro', 
          addOns: ['fast_track', 'premium_directories', 'manual_qa'],
          customer_email: 'test@directorybolt.com',
          customer_name: 'Test User'
        }
      }
    ];
    
    for (const testCase of testCases) {
      try {
        console.log(`  Testing: ${testCase.name}`);
        
        const response = await axios.post(
          `${this.baseUrl}/api/create-checkout-session-v2`,
          testCase.payload,
          { headers: { 'Content-Type': 'application/json' } }
        );
        
        this.assert(response.status === 200, 'Checkout should return 200');
        this.assert(response.data.success === true, 'Checkout should return success: true');
        this.assert(response.data.data.checkout_session, 'Should contain checkout_session');
        this.assert(response.data.data.checkout_session.url, 'Should contain checkout URL');
        this.assert(response.data.data.order_summary, 'Should contain order_summary');
        
        const { order_summary } = response.data.data;
        this.assert(order_summary.package, 'Order summary should contain package');
        this.assert(order_summary.totalPrice > 0, 'Order summary should have positive total price');
        this.assert(order_summary.totalDirectories > 0, 'Order summary should have positive directory count');
        
        console.log(`  ✅ ${testCase.name} - passed`);
        
      } catch (error) {
        this.recordError(`One-time checkout test failed: ${testCase.name}`, error);
      }
    }
    
    console.log('✅ One-time checkout endpoint tests completed');
  }

  async testSubscriptionCheckoutEndpoint() {
    this.logTest('Subscription Checkout Endpoint');
    
    try {
      const payload = {
        service: 'auto_update',
        customer_email: 'test@directorybolt.com',
        customer_name: 'Test User',
        trial_period_days: 7
      };
      
      const response = await axios.post(
        `${this.baseUrl}/api/create-subscription-checkout`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      this.assert(response.status === 200, 'Subscription checkout should return 200');
      this.assert(response.data.success === true, 'Subscription checkout should return success: true');
      this.assert(response.data.data.checkout_session, 'Should contain checkout_session');
      this.assert(response.data.data.checkout_session.url, 'Should contain checkout URL');
      this.assert(response.data.data.service_details, 'Should contain service_details');
      this.assert(response.data.data.trial_period_days === 7, 'Should have 7-day trial');
      
      console.log('✅ Subscription checkout endpoint test passed');
      
    } catch (error) {
      this.recordError('Subscription checkout endpoint test failed', error);
    }
  }

  async testWebhookEndpoint() {
    this.logTest('Webhook Endpoint');
    
    try {
      // Test webhook endpoint accessibility (should reject without signature)
      const response = await axios.post(
        `${this.baseUrl}/api/webhook`,
        { test: 'data' },
        { 
          headers: { 'Content-Type': 'application/json' },
          validateStatus: () => true // Don't throw on 4xx/5xx
        }
      );
      
      // Should return 400 due to missing/invalid signature
      this.assert(
        response.status === 400,
        'Webhook should return 400 for invalid signature'
      );
      
      console.log('✅ Webhook endpoint security test passed');
      
    } catch (error) {
      this.recordError('Webhook endpoint test failed', error);
    }
  }

  async testProductValidation() {
    this.logTest('Product Configuration Validation');
    
    try {
      const { 
        validatePackageConfiguration, 
        CORE_PACKAGES, 
        ADD_ONS 
      } = require('../lib/config/directoryBoltProducts');
      
      // Test valid configurations
      const validTests = [
        { package: 'starter', addOns: [] },
        { package: 'growth', addOns: ['fast_track'] },
        { package: 'pro', addOns: ['fast_track', 'premium_directories'] }
      ];
      
      for (const test of validTests) {
        const result = validatePackageConfiguration(test.package, test.addOns);
        this.assert(result.valid === true, `${test.package} with ${test.addOns.join(',')} should be valid`);
      }
      
      // Test invalid configurations
      const invalidTests = [
        { package: 'invalid_package', addOns: [] },
        { package: 'starter', addOns: ['invalid_addon'] }
      ];
      
      for (const test of invalidTests) {
        const result = validatePackageConfiguration(test.package, test.addOns);
        this.assert(result.valid === false, `${test.package} with ${test.addOns.join(',')} should be invalid`);
      }
      
      console.log('✅ Product validation test passed');
      
    } catch (error) {
      this.recordError('Product validation test failed', error);
    }
  }

  async testAddOnCompatibility() {
    this.logTest('Add-On Compatibility');
    
    try {
      const { ADD_ONS } = require('../lib/config/directoryBoltProducts');
      
      // Test that all add-ons are compatible with all packages
      const packages = ['starter', 'growth', 'pro'];
      const addOns = Object.keys(ADD_ONS);
      
      for (const addOn of addOns) {
        const addOnConfig = ADD_ONS[addOn];
        
        this.assert(
          addOnConfig.compatible_packages, 
          `Add-on ${addOn} should have compatible_packages`
        );
        
        for (const pkg of packages) {
          this.assert(
            addOnConfig.compatible_packages.includes(pkg),
            `Add-on ${addOn} should be compatible with ${pkg} package`
          );
        }
      }
      
      console.log('✅ Add-on compatibility test passed');
      
    } catch (error) {
      this.recordError('Add-on compatibility test failed', error);
    }
  }

  async testErrorHandling() {
    this.logTest('Error Handling');
    
    const errorTests = [
      {
        name: 'Missing package parameter',
        endpoint: '/api/create-checkout-session-v2',
        payload: {
          customer_email: 'test@example.com'
          // Missing package
        },
        expectedStatus: 400
      },
      {
        name: 'Invalid package',
        endpoint: '/api/create-checkout-session-v2',
        payload: {
          package: 'invalid_package',
          customer_email: 'test@example.com'
        },
        expectedStatus: 400
      },
      {
        name: 'Missing customer email',
        endpoint: '/api/create-checkout-session-v2',
        payload: {
          package: 'starter'
          // Missing customer_email
        },
        expectedStatus: 400
      },
      {
        name: 'Invalid add-on',
        endpoint: '/api/create-checkout-session-v2',
        payload: {
          package: 'starter',
          addOns: ['invalid_addon'],
          customer_email: 'test@example.com'
        },
        expectedStatus: 400
      }
    ];
    
    for (const test of errorTests) {
      try {
        console.log(`  Testing: ${test.name}`);
        
        const response = await axios.post(
          `${this.baseUrl}${test.endpoint}`,
          test.payload,
          {
            headers: { 'Content-Type': 'application/json' },
            validateStatus: () => true // Don't throw on error status
          }
        );
        
        this.assert(
          response.status === test.expectedStatus,
          `${test.name} should return status ${test.expectedStatus}`
        );
        
        this.assert(
          response.data.error || (response.data.success === false),
          `${test.name} should return error response`
        );
        
        console.log(`  ✅ ${test.name} - passed`);
        
      } catch (error) {
        this.recordError(`Error handling test failed: ${test.name}`, error);
      }
    }
    
    console.log('✅ Error handling tests completed');
  }

  logTest(testName) {
    console.log(`\n📋 Testing: ${testName}`);
    console.log('─'.repeat(50));
  }

  assert(condition, message) {
    this.testResults.total++;
    
    if (condition) {
      this.testResults.passed++;
    } else {
      this.testResults.failed++;
      this.testResults.errors.push(message);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  recordError(testName, error) {
    this.testResults.total++;
    this.testResults.failed++;
    this.testResults.errors.push(`${testName}: ${error.message}`);
    console.error(`❌ ${testName}: ${error.message}`);
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 DIRECTORYBOLT TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${this.testResults.total}`);
    console.log(`Passed: ${this.testResults.passed}`);
    console.log(`Failed: ${this.testResults.failed}`);
    
    if (this.testResults.failed > 0) {
      console.log('\n❌ Failures:');
      this.testResults.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
      console.log('\n💡 Check the setup guide: DIRECTORYBOLT_STRIPE_SETUP_GUIDE.md');
    } else {
      console.log('\n🎉 All tests passed! Your DirectoryBolt integration is ready.');
    }
    
    const successRate = Math.round((this.testResults.passed / this.testResults.total) * 100);
    console.log(`\nSuccess Rate: ${successRate}%`);
    console.log('='.repeat(60));
  }
}

// Run tests if called directly
if (require.main === module) {
  const baseUrl = process.argv[2] || 'http://localhost:3000';
  const tester = new DirectoryBoltIntegrationTester(baseUrl);
  
  tester.runAllTests().catch((error) => {
    console.error('Test suite crashed:', error);
    process.exit(1);
  });
}

module.exports = DirectoryBoltIntegrationTester;