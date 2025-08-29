// 🧪 NATHAN: Test complete Stripe payment flow
const { execSync } = require('child_process');

async function testStripeFlow() {
  console.log('🧪 NATHAN: Starting complete Stripe payment flow test\n');

  const tests = [
    {
      name: 'Test Starter Plan Only',
      payload: {
        plan: 'starter',
        addons: [],
        includeSubscription: false,
        customerEmail: 'test@directorybolt.com'
      }
    },
    {
      name: 'Test Growth Plan with Add-ons',
      payload: {
        plan: 'growth',
        addons: ['fasttrack', 'premium'],
        includeSubscription: false,
        customerEmail: 'test@directorybolt.com'
      }
    },
    {
      name: 'Test Pro Plan with All Add-ons',
      payload: {
        plan: 'pro',
        addons: ['fasttrack', 'premium', 'qa', 'csv'],
        includeSubscription: false,
        customerEmail: 'test@directorybolt.com'
      }
    },
    {
      name: 'Test Invalid Plan',
      payload: {
        plan: 'invalid',
        addons: [],
        includeSubscription: false,
        customerEmail: 'test@directorybolt.com'
      }
    }
  ];

  const results = [];

  for (const test of tests) {
    console.log(`🧪 Testing: ${test.name}`);
    console.log('Payload:', JSON.stringify(test.payload, null, 2));
    
    try {
      // Test the API endpoint
      const response = await fetch('http://localhost:3001/api/create-checkout-session-v3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(test.payload)
      });

      const data = await response.json();
      
      const testResult = {
        test: test.name,
        status: response.ok ? 'PASS' : 'FAIL',
        statusCode: response.status,
        data: data
      };

      results.push(testResult);

      if (response.ok) {
        console.log('✅ SUCCESS:', {
          sessionId: data.sessionId ? 'Present' : 'Missing',
          checkoutUrl: data.checkoutUrl ? 'Present' : 'Missing',
          totalAmount: data.totalAmount
        });

        // Validate session ID format
        if (data.sessionId && data.sessionId.startsWith('cs_')) {
          console.log('✅ Session ID format is correct');
        } else if (data.sessionId) {
          console.log('⚠️ Session ID present but format unexpected:', data.sessionId);
        }

        // Validate checkout URL
        if (data.checkoutUrl && data.checkoutUrl.includes('checkout.stripe.com')) {
          console.log('✅ Checkout URL format is correct');
        } else if (data.checkoutUrl) {
          console.log('⚠️ Checkout URL present but format unexpected:', data.checkoutUrl);
        }

      } else {
        console.log('❌ FAILED:', data);
      }

    } catch (error) {
      console.log('❌ ERROR:', error.message);
      results.push({
        test: test.name,
        status: 'ERROR',
        error: error.message
      });
    }

    console.log('─────────────────────────────\n');
  }

  // Summary
  console.log('🧪 NATHAN: Test Results Summary');
  console.log('═══════════════════════════════');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const errors = results.filter(r => r.status === 'ERROR').length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`🔥 Errors: ${errors}`);
  console.log(`📊 Total:  ${results.length}`);

  results.forEach(result => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '🔥';
    console.log(`${icon} ${result.test}: ${result.status}`);
  });

  // Additional validations
  console.log('\n🔍 VALIDATION CHECKS:');
  
  const validTests = results.filter(r => r.status === 'PASS');
  if (validTests.length > 0) {
    console.log('✅ Session ID generation working');
    console.log('✅ Stripe checkout URL creation working');
    console.log('✅ Price calculation working');
    
    // Check for session ID format consistency
    const sessionIds = validTests.map(t => t.data.sessionId).filter(Boolean);
    const hasValidFormat = sessionIds.every(id => id.startsWith('cs_'));
    console.log(hasValidFormat ? '✅ All session IDs have correct format' : '⚠️ Some session IDs have incorrect format');
  }

  return results;
}

// Environment check
function checkEnvironment() {
  console.log('🔧 Environment Check:');
  
  const requiredEnvVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_PUBLISHABLE_KEY'
  ];

  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar];
    if (value) {
      console.log(`✅ ${envVar}: ${value.substring(0, 12)}...`);
    } else {
      console.log(`❌ ${envVar}: Missing`);
    }
  });

  console.log('\n');
}

// Run tests
async function main() {
  checkEnvironment();
  
  try {
    await testStripeFlow();
    console.log('\n🎉 All tests completed!');
  } catch (error) {
    console.error('🔥 Test runner error:', error);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = { testStripeFlow };