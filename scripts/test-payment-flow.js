#!/usr/bin/env node

// 🧪 PAYMENT FLOW INTEGRATION TEST
// Tests the complete payment flow with proper environment validation

const { validateStripeEnvironment } = require('../lib/utils/stripe-environment-validator');

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 30000; // 30 seconds

// Test data
const TEST_SCENARIOS = [
  {
    name: 'Starter Plan Checkout',
    plan: 'starter',
    user_email: 'test@directorybolt.com',
    user_id: 'test_user_starter',
    expected_price: 4900
  },
  {
    name: 'Growth Plan Checkout',
    plan: 'growth', 
    user_email: 'test@directorybolt.com',
    user_id: 'test_user_growth',
    expected_price: 7900
  },
  {
    name: 'Professional Plan Checkout',
    plan: 'professional',
    user_email: 'test@directorybolt.com', 
    user_id: 'test_user_professional',
    expected_price: 12900
  },
  {
    name: 'Enterprise Plan Checkout',
    plan: 'enterprise',
    user_email: 'test@directorybolt.com',
    user_id: 'test_user_enterprise', 
    expected_price: 29900
  }
];

async function runTest(scenario) {
  const testStart = Date.now();
  
  try {
    console.log(`\n🧪 Testing: ${scenario.name}`);
    console.log(`   Plan: ${scenario.plan}`);
    console.log(`   Expected Price: $${(scenario.expected_price / 100).toFixed(2)}`);
    
    const response = await fetch(`${BASE_URL}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DirectoryBolt-Test/1.0'
      },
      body: JSON.stringify({
        plan: scenario.plan,
        user_email: scenario.user_email,
        user_id: scenario.user_id,
        success_url: `${BASE_URL}/test-success`,
        cancel_url: `${BASE_URL}/test-cancel`
      })
    });
    
    const responseData = await response.json();
    const duration = Date.now() - testStart;
    
    // Validate response
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseData.error?.message || JSON.stringify(responseData)}`);
    }
    
    // Check response structure
    if (!responseData.success) {
      throw new Error(`API returned success=false: ${responseData.error?.message || 'Unknown error'}`);
    }
    
    if (!responseData.data?.checkout_session?.url) {
      throw new Error('No checkout URL returned');
    }
    
    if (!responseData.data?.plan_details) {
      throw new Error('No plan details returned');
    }
    
    // Validate plan details
    const planDetails = responseData.data.plan_details;
    if (planDetails.price !== scenario.expected_price) {
      throw new Error(`Price mismatch: expected ${scenario.expected_price}, got ${planDetails.price}`);
    }
    
    console.log(`   ✅ PASSED (${duration}ms)`);
    console.log(`      Session ID: ${responseData.data.checkout_session.id}`);
    console.log(`      Checkout URL: ${responseData.data.checkout_session.url.substring(0, 50)}...`);
    console.log(`      Customer ID: ${responseData.data.customer_id}`);
    console.log(`      Trial Days: ${responseData.data.trial_period_days}`);
    
    return {
      success: true,
      duration,
      scenario: scenario.name,
      sessionId: responseData.data.checkout_session.id,
      customerId: responseData.data.customer_id
    };
    
  } catch (error) {
    const duration = Date.now() - testStart;
    console.log(`   ❌ FAILED (${duration}ms)`);
    console.log(`      Error: ${error.message}`);
    
    return {
      success: false,
      duration,
      scenario: scenario.name,
      error: error.message
    };
  }
}

async function testWebhookEndpoint() {
  console.log('\n🔗 Testing Webhook Endpoint');
  
  try {
    const response = await fetch(`${BASE_URL}/api/webhooks/stripe`, {
      method: 'GET'
    });
    
    // Should return 405 Method Not Allowed for GET requests
    if (response.status === 405) {
      console.log('   ✅ Webhook endpoint properly rejects GET requests');
      return true;
    } else {
      console.log(`   ⚠️  Webhook endpoint returned unexpected status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Webhook test failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🧪 PAYMENT FLOW INTEGRATION TEST');
  console.log('=================================\n');
  
  // Load environment variables
  if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config({ path: ['.env.local', '.env.production', '.env'] });
  }
  
  console.log(`Test Target: ${BASE_URL}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Test Timeout: ${TEST_TIMEOUT}ms`);
  
  // Step 1: Environment validation
  console.log('\n📋 STEP 1: Environment Validation');
  console.log('----------------------------------');
  
  const envResult = validateStripeEnvironment();
  
  if (!envResult.isValid) {
    console.log('❌ Environment validation failed:');
    envResult.errors.forEach(error => console.log(`  - ${error}`));
    console.log('\nPlease fix environment issues before running payment tests.');
    process.exit(1);
  }
  
  console.log('✅ Environment validation passed');
  if (envResult.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    envResult.warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  // Step 2: Server connectivity test
  console.log('\n🌐 STEP 2: Server Connectivity');
  console.log('-------------------------------');
  
  try {
    const healthResponse = await fetch(`${BASE_URL}/api/health`, {
      timeout: 5000
    });
    
    if (healthResponse.ok) {
      console.log('✅ Server is responding');
    } else {
      console.log(`⚠️  Server returned status: ${healthResponse.status}`);
    }
  } catch (error) {
    console.log(`❌ Server connectivity failed: ${error.message}`);
    console.log('Please ensure the application is running before testing payment flow.');
    process.exit(1);
  }
  
  // Step 3: Payment flow tests
  console.log('\n💳 STEP 3: Payment Flow Tests');
  console.log('-----------------------------');
  
  const testResults = [];
  
  for (const scenario of TEST_SCENARIOS) {
    const result = await runTest(scenario);
    testResults.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Step 4: Webhook tests
  console.log('\n🔗 STEP 4: Webhook Tests');
  console.log('-------------------------');
  
  const webhookResult = await testWebhookEndpoint();
  
  // Results summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================\n');
  
  const passedTests = testResults.filter(r => r.success).length;
  const totalTests = testResults.length;
  const successRate = Math.round((passedTests / totalTests) * 100);
  
  console.log(`Tests Passed: ${passedTests}/${totalTests} (${successRate}%)`);
  console.log(`Webhook Test: ${webhookResult ? 'PASSED' : 'FAILED'}`);
  
  const avgDuration = testResults.reduce((sum, r) => sum + r.duration, 0) / testResults.length;
  console.log(`Average Response Time: ${Math.round(avgDuration)}ms`);
  
  if (passedTests === totalTests && webhookResult) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('Payment integration is working correctly.');
    
    if (envResult.warnings.length > 0) {
      console.log('\n⚠️  Note: There are configuration warnings that should be addressed:');
      envResult.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    process.exit(0);
  } else {
    console.log('\n❌ SOME TESTS FAILED');
    
    const failedTests = testResults.filter(r => !r.success);
    if (failedTests.length > 0) {
      console.log('\nFailed Tests:');
      failedTests.forEach(test => {
        console.log(`  - ${test.scenario}: ${test.error}`);
      });
    }
    
    if (!webhookResult) {
      console.log('  - Webhook endpoint test failed');
    }
    
    console.log('\nPlease review the errors above and fix the issues.');
    process.exit(1);
  }
}

// Handle timeout
setTimeout(() => {
  console.error('\n❌ TEST TIMEOUT');
  console.error('Tests did not complete within the expected time.');
  process.exit(1);
}, TEST_TIMEOUT);

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('\n❌ UNCAUGHT EXCEPTION:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('\n❌ UNHANDLED REJECTION:', error);
  process.exit(1);
});

// Run tests
main().catch((error) => {
  console.error('\n❌ TEST SUITE FAILED:', error.message);
  process.exit(1);
});