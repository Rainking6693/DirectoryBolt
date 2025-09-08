#!/usr/bin/env node

/**
 * 💳 Stripe Integration Test Suite
 * Tests Stripe API connectivity, pricing tiers, and webhook functionality
 */

const Stripe = require('stripe');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function testStripeConnectivity() {
  console.log('🔍 Testing Stripe API Connectivity...\n');
  
  try {
    // Test 1: Basic API connectivity
    console.log('1. Testing basic API connectivity...');
    const account = await stripe.accounts.retrieve();
    console.log('✅ Stripe API connected successfully');
    console.log(`   Account ID: ${account.id}`);
    console.log(`   Country: ${account.country}`);
    console.log(`   Test mode: ${account.livemode ? 'NO (LIVE)' : 'YES (TEST)'}`);
    
    // Test 2: List products
    console.log('\n2. Testing product retrieval...');
    const products = await stripe.products.list({ limit: 10 });
    console.log('✅ Products retrieved successfully');
    console.log(`   Total products: ${products.data.length}`);
    
    products.data.forEach(product => {
      console.log(`   - ${product.name} (${product.id})`);
    });
    
    return {
      success: true,
      connectivity: true,
      account: account.id,
      testMode: !account.livemode,
      productsCount: products.data.length
    };
    
  } catch (error) {
    console.error('❌ Stripe API test failed:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.error('   Issue: Invalid API key');
      console.error('   Solution: Check STRIPE_SECRET_KEY in .env.local');
    } else if (error.type === 'StripePermissionError') {
      console.error('   Issue: Insufficient permissions');
      console.error('   Solution: Check API key permissions');
    }
    
    return {
      success: false,
      error: error.message,
      type: error.type
    };
  }
}

async function testPricingTiers() {
  console.log('\n💰 Testing Pricing Tiers Configuration...\n');
  
  const priceIds = {
    starter: process.env.STRIPE_STARTER_PRICE_ID,
    growth: process.env.STRIPE_GROWTH_PRICE_ID,
    professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID
  };
  
  const results = {
    success: true,
    tiers: {}
  };
  
  try {
    for (const [tier, priceId] of Object.entries(priceIds)) {
      console.log(`${tier.charAt(0).toUpperCase() + tier.slice(1)} tier (${priceId}):`);
      
      if (!priceId || priceId.includes('your_') || priceId.includes('_here')) {
        console.log(`   ❌ Price ID not configured`);
        results.tiers[tier] = { success: false, error: 'Price ID not configured' };
        results.success = false;
        continue;
      }
      
      try {
        const price = await stripe.prices.retrieve(priceId);
        const product = await stripe.products.retrieve(price.product);
        
        console.log(`   ✅ Valid price: $${(price.unit_amount / 100).toFixed(2)} ${price.currency.toUpperCase()}`);
        console.log(`   📦 Product: ${product.name}`);
        console.log(`   🔄 Type: ${price.type}`);
        
        results.tiers[tier] = {
          success: true,
          priceId: price.id,
          amount: price.unit_amount,
          currency: price.currency,
          productName: product.name,
          type: price.type
        };
        
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.tiers[tier] = { success: false, error: error.message };
        results.success = false;
      }
      
      console.log('');
    }
    
    return results;
    
  } catch (error) {
    console.error('❌ Pricing tiers test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function testCheckoutSession() {
  console.log('\n🛒 Testing Checkout Session Creation...\n');
  
  try {
    // Test checkout session creation for Growth plan
    const priceId = process.env.STRIPE_GROWTH_PRICE_ID;
    
    if (!priceId || priceId.includes('your_') || priceId.includes('_here')) {
      throw new Error('Growth plan price ID not configured');
    }
    
    console.log('1. Creating test checkout session...');
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/pricing',
      metadata: {
        plan: 'growth',
        test: 'true'
      }
    });
    
    console.log('✅ Checkout session created successfully');
    console.log(`   Session ID: ${session.id}`);
    console.log(`   Payment status: ${session.payment_status}`);
    console.log(`   Amount: $${(session.amount_total / 100).toFixed(2)}`);
    console.log(`   URL: ${session.url?.substring(0, 50)}...`);
    
    // Test session retrieval
    console.log('\n2. Testing session retrieval...');
    const retrievedSession = await stripe.checkout.sessions.retrieve(session.id);
    console.log('✅ Session retrieved successfully');
    console.log(`   Status: ${retrievedSession.status}`);
    
    return {
      success: true,
      sessionCreated: true,
      sessionRetrieved: true,
      sessionId: session.id,
      amount: session.amount_total,
      url: session.url
    };
    
  } catch (error) {
    console.error('❌ Checkout session test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function testWebhookConfiguration() {
  console.log('\n🔔 Testing Webhook Configuration...\n');
  
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    console.log('1. Checking webhook secret configuration...');
    if (!webhookSecret || webhookSecret.includes('your_') || webhookSecret.includes('_here')) {
      console.log('❌ Webhook secret not configured');
      return {
        success: false,
        error: 'Webhook secret not configured'
      };
    }
    
    console.log('✅ Webhook secret configured');
    console.log(`   Secret: whsec_${webhookSecret.substring(6, 16)}...`);
    
    // Test webhook endpoints list
    console.log('\n2. Listing webhook endpoints...');
    const webhooks = await stripe.webhookEndpoints.list();
    console.log('✅ Webhook endpoints retrieved');
    console.log(`   Total endpoints: ${webhooks.data.length}`);
    
    webhooks.data.forEach(webhook => {
      console.log(`   - ${webhook.url}`);
      console.log(`     Status: ${webhook.status}`);
      console.log(`     Events: ${webhook.enabled_events.length}`);
    });
    
    return {
      success: true,
      secretConfigured: true,
      endpointsCount: webhooks.data.length,
      endpoints: webhooks.data.map(w => ({
        url: w.url,
        status: w.status,
        events: w.enabled_events.length
      }))
    };
    
  } catch (error) {
    console.error('❌ Webhook configuration test failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function runStripeTests() {
  console.log('🚀 DirectoryBolt Stripe Integration Test Suite');
  console.log('=============================================\n');
  
  const results = {
    connectivity: await testStripeConnectivity(),
    pricingTiers: await testPricingTiers(),
    checkoutSession: await testCheckoutSession(),
    webhookConfig: await testWebhookConfiguration()
  };
  
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  
  const connectivitySuccess = results.connectivity.success;
  const pricingSuccess = results.pricingTiers.success;
  const checkoutSuccess = results.checkoutSession.success;
  const webhookSuccess = results.webhookConfig.success;
  
  console.log(`Stripe API Connectivity: ${connectivitySuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Pricing Tiers Configuration: ${pricingSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Checkout Session Creation: ${checkoutSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Webhook Configuration: ${webhookSuccess ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = connectivitySuccess && pricingSuccess && checkoutSuccess && webhookSuccess;
  
  if (allPassed) {
    console.log('\n🎉 ALL STRIPE TESTS PASSED!');
    console.log('✅ Stripe API is working correctly');
    console.log('✅ All pricing tiers are configured');
    console.log('✅ Checkout sessions can be created');
    console.log('✅ Webhooks are properly configured');
    console.log('✅ Ready for production payments');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    if (!connectivitySuccess) {
      console.log('❌ Stripe API connectivity issues');
    }
    if (!pricingSuccess) {
      console.log('❌ Pricing tiers configuration issues');
    }
    if (!checkoutSuccess) {
      console.log('❌ Checkout session creation issues');
    }
    if (!webhookSuccess) {
      console.log('❌ Webhook configuration issues');
    }
  }
  
  return results;
}

// Run tests if called directly
if (require.main === module) {
  runStripeTests().catch(console.error);
}

module.exports = { runStripeTests };