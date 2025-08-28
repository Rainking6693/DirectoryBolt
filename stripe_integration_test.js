/**
 * STRIPE INTEGRATION TEST for DirectoryBolt
 * 
 * Tests all 4 pricing tiers and Stripe checkout functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3002';

async function testStripeIntegration() {
  console.log('🔧 TESTING STRIPE INTEGRATION');
  console.log('===============================\n');

  // Test all 4 pricing tiers
  const pricingTiers = [
    { name: 'starter', price: 49, priceId: 'price_starter' },
    { name: 'growth', price: 79, priceId: 'price_growth' },
    { name: 'professional', price: 129, priceId: 'price_professional' },
    { name: 'enterprise', price: 299, priceId: 'price_enterprise' }
  ];

  console.log('Testing Stripe checkout endpoint...');
  
  for (const tier of pricingTiers) {
    try {
      const response = await axios.post(`${BASE_URL}/api/create-checkout-session`, {
        priceId: tier.priceId,
        tier: tier.name,
        price: tier.price
      }, {
        timeout: 10000,
        validateStatus: () => true
      });

      console.log(`\n${tier.name.toUpperCase()} Tier ($${tier.price}/month):`);
      console.log(`  Status: ${response.status}`);
      
      if (response.status === 200) {
        console.log(`  ✅ Checkout endpoint working`);
        if (response.data.url) {
          console.log(`  ✅ Stripe checkout URL generated`);
        } else {
          console.log(`  ⚠️  No checkout URL in response`);
        }
      } else {
        console.log(`  ❌ Failed: ${response.statusText}`);
        if (response.data) {
          console.log(`  Error: ${JSON.stringify(response.data).substring(0, 200)}`);
        }
      }
    } catch (error) {
      console.log(`\n${tier.name.toUpperCase()} Tier ($${tier.price}/month):`);
      console.log(`  ❌ Error: ${error.message}`);
    }
  }

  // Test subscription status endpoint
  console.log('\n\nTesting subscription status endpoint...');
  try {
    const response = await axios.get(`${BASE_URL}/api/subscription-status`, {
      params: { session_id: 'test_session_id' },
      timeout: 5000,
      validateStatus: () => true
    });
    
    console.log(`Status: ${response.status}`);
    if (response.status === 200 || response.status === 400) {
      console.log('✅ Subscription status endpoint exists');
    } else {
      console.log('⚠️  Subscription status endpoint may need implementation');
    }
  } catch (error) {
    console.log(`❌ Subscription status error: ${error.message}`);
  }

  // Test success page with session ID
  console.log('\n\nTesting success page...');
  try {
    const response = await axios.get(`${BASE_URL}/success?session_id=test_session_id`, {
      timeout: 5000,
      validateStatus: () => true
    });
    
    console.log(`Status: ${response.status}`);
    if (response.status === 200) {
      console.log('✅ Success page loads with session ID');
      
      // Check if it contains subscription details
      if (response.data.includes('subscription') || response.data.includes('welcome')) {
        console.log('✅ Success page contains expected content');
      } else {
        console.log('⚠️  Success page may be missing subscription content');
      }
    } else {
      console.log(`⚠️  Success page returned ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Success page error: ${error.message}`);
  }

  console.log('\n📊 STRIPE INTEGRATION SUMMARY');
  console.log('===============================');
  console.log('✅ Test complete - Check results above for any issues');
}

// Run the test
if (require.main === module) {
  testStripeIntegration().catch(console.error);
}

module.exports = { testStripeIntegration };