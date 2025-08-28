/**
 * PROPER STRIPE INTEGRATION TEST for DirectoryBolt
 * 
 * Tests Stripe checkout with correct parameters based on the API implementation
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function testStripeIntegrationProperly() {
  console.log('🔧 PROPER STRIPE INTEGRATION TEST');
  console.log('==================================\n');

  // Test all 4 pricing tiers with correct parameters
  const pricingTiers = [
    { plan: 'starter', name: 'Starter', price: '$49' },
    { plan: 'growth', name: 'Growth', price: '$79' },
    { plan: 'professional', name: 'Professional', price: '$129' },
    { plan: 'enterprise', name: 'Enterprise', price: '$299' }
  ];

  console.log('Testing Stripe checkout endpoint with proper parameters...\n');
  
  for (const tier of pricingTiers) {
    try {
      const response = await axios.post(`${BASE_URL}/api/create-checkout-session`, {
        plan: tier.plan,
        user_email: 'test@example.com',
        user_id: 'test_user_123',
        success_url: `${BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${BASE_URL}/cancel`,
        extended_trial: false
      }, {
        timeout: 10000,
        validateStatus: () => true,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log(`${tier.name.toUpperCase()} Tier (${tier.price}/month):`);
      console.log(`  Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`  ✅ Checkout endpoint working`);
        if (response.data.data?.checkout_session?.url) {
          console.log(`  ✅ Stripe checkout URL generated`);
          console.log(`  ✅ Session ID: ${response.data.data.checkout_session.id}`);
        } else {
          console.log(`  ⚠️  No checkout URL in response`);
        }
      } else if (response.status === 500) {
        console.log(`  ❌ Server error (likely missing Stripe env vars)`);
        if (response.data?.error?.message) {
          console.log(`  Error: ${response.data.error.message}`);
        }
      } else {
        console.log(`  ❌ Failed: ${response.statusText}`);
        if (response.data) {
          console.log(`  Response: ${JSON.stringify(response.data).substring(0, 200)}`);
        }
      }
    } catch (error) {
      console.log(`${tier.name.toUpperCase()} Tier (${tier.price}/month):`);
      console.log(`  ❌ Network Error: ${error.message}`);
    }
    console.log(); // Add spacing
  }

  // Test with missing parameters
  console.log('\nTesting error handling with missing parameters...');
  try {
    const response = await axios.post(`${BASE_URL}/api/create-checkout-session`, {
      plan: 'starter'
      // Missing user_email and user_id
    }, {
      timeout: 5000,
      validateStatus: () => true,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status: ${response.status}`);
    if (response.status === 500 && response.data?.error?.message?.includes('required')) {
      console.log('✅ Proper validation for missing parameters');
    } else {
      console.log('⚠️  Error handling may need improvement');
    }
  } catch (error) {
    console.log(`❌ Error validation test failed: ${error.message}`);
  }

  // Test webhook endpoint
  console.log('\nTesting Stripe webhook endpoint...');
  try {
    const response = await axios.post(`${BASE_URL}/api/webhooks/stripe`, {
      type: 'test.event',
      data: { object: { id: 'test' } }
    }, {
      timeout: 5000,
      validateStatus: () => true,
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature'
      }
    });

    console.log(`Status: ${response.status}`);
    if (response.status === 200 || response.status === 400) {
      console.log('✅ Webhook endpoint exists and responds');
    } else if (response.status === 404) {
      console.log('❌ Webhook endpoint not found - needed for Stripe integration');
    }
  } catch (error) {
    console.log(`❌ Webhook test error: ${error.message}`);
  }

  console.log('\n📊 STRIPE INTEGRATION SUMMARY');
  console.log('===============================');
  console.log('Note: 500 errors are expected in dev environment without Stripe keys configured');
  console.log('The important thing is that the endpoints exist and validate parameters correctly.');
}

// Run the test
if (require.main === module) {
  testStripeIntegrationProperly().catch(console.error);
}

module.exports = { testStripeIntegrationProperly };