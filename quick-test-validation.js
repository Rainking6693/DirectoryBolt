#!/usr/bin/env node

/**
 * 🧪 Quick Test Validation
 * Validates the current setup with updated Stripe price IDs
 */

const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

async function validateEnvironment() {
  console.log('🔧 Validating Environment Configuration...\n');
  
  const requiredVars = [
    'OPENAI_API_KEY',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'STRIPE_STARTER_PRICE_ID',
    'STRIPE_GROWTH_PRICE_ID',
    'STRIPE_PROFESSIONAL_PRICE_ID',
    'STRIPE_ENTERPRISE_PRICE_ID'
  ];
  
  let allConfigured = true;
  
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    const isConfigured = value && 
                        !value.includes('your_') && 
                        !value.includes('_here') && 
                        !value.includes('placeholder') &&
                        value.length > 10;
    
    if (isConfigured) {
      console.log(`✅ ${varName}: Configured`);
    } else {
      console.log(`❌ ${varName}: Not configured or placeholder`);
      allConfigured = false;
    }
  });
  
  return allConfigured;
}

async function testOpenAI() {
  console.log('\n🤖 Testing OpenAI API...\n');
  
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    console.log('1. Testing API connectivity...');
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: 'Respond with exactly: "DirectoryBolt AI test successful"'
        }
      ],
      max_tokens: 50,
      temperature: 0
    });
    
    const response = completion.choices[0]?.message?.content;
    console.log(`✅ OpenAI Response: ${response}`);
    console.log(`✅ Tokens used: ${completion.usage?.total_tokens}`);
    
    return { success: true, response, tokens: completion.usage?.total_tokens };
    
  } catch (error) {
    console.error(`❌ OpenAI test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testStripe() {
  console.log('\n💳 Testing Stripe API...\n');
  
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    console.log('1. Testing API connectivity...');
    const account = await stripe.accounts.retrieve();
    console.log(`✅ Stripe Account: ${account.id}`);
    console.log(`✅ Test Mode: ${!account.livemode ? 'YES' : 'NO'}`);
    
    console.log('\n2. Testing price IDs...');
    const priceIds = {
      starter: process.env.STRIPE_STARTER_PRICE_ID,
      growth: process.env.STRIPE_GROWTH_PRICE_ID,
      professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
      enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID
    };
    
    const results = {};
    
    for (const [tier, priceId] of Object.entries(priceIds)) {
      try {
        const price = await stripe.prices.retrieve(priceId);
        const product = await stripe.products.retrieve(price.product);
        
        console.log(`✅ ${tier.charAt(0).toUpperCase() + tier.slice(1)}: $${(price.unit_amount / 100).toFixed(2)} - ${product.name}`);
        results[tier] = { success: true, amount: price.unit_amount, name: product.name };
        
      } catch (error) {
        console.log(`❌ ${tier.charAt(0).toUpperCase() + tier.slice(1)}: ${error.message}`);
        results[tier] = { success: false, error: error.message };
      }
    }
    
    const allPricesValid = Object.values(results).every(r => r.success);
    
    return { 
      success: allPricesValid, 
      account: account.id, 
      testMode: !account.livemode,
      prices: results 
    };
    
  } catch (error) {
    console.error(`❌ Stripe test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testCheckoutSession() {
  console.log('\n🛒 Testing Checkout Session Creation...\n');
  
  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    const priceId = process.env.STRIPE_GROWTH_PRICE_ID;
    
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
        test: 'validation'
      }
    });
    
    console.log(`✅ Checkout session created: ${session.id}`);
    console.log(`✅ Amount: $${(session.amount_total / 100).toFixed(2)}`);
    console.log(`✅ Status: ${session.status}`);
    
    return { 
      success: true, 
      sessionId: session.id, 
      amount: session.amount_total,
      status: session.status 
    };
    
  } catch (error) {
    console.error(`❌ Checkout session test failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runQuickValidation() {
  console.log('🚀 DirectoryBolt Quick Test Validation');
  console.log('=====================================\n');
  
  const startTime = Date.now();
  
  // Test environment
  const envValid = await validateEnvironment();
  
  if (!envValid) {
    console.log('\n❌ Environment configuration incomplete. Please check your .env.local file.');
    return;
  }
  
  // Test OpenAI
  const openaiResult = await testOpenAI();
  
  // Test Stripe
  const stripeResult = await testStripe();
  
  // Test checkout (only if Stripe is working)
  let checkoutResult = { success: false, skipped: true };
  if (stripeResult.success) {
    checkoutResult = await testCheckoutSession();
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(1);
  
  // Summary
  console.log('\n📊 VALIDATION RESULTS');
  console.log('=====================');
  
  const envStatus = envValid ? '✅ PASS' : '❌ FAIL';
  const openaiStatus = openaiResult.success ? '✅ PASS' : '❌ FAIL';
  const stripeStatus = stripeResult.success ? '✅ PASS' : '❌ FAIL';
  const checkoutStatus = checkoutResult.success ? '✅ PASS' : checkoutResult.skipped ? '⏭️ SKIP' : '❌ FAIL';
  
  console.log(`Environment Configuration: ${envStatus}`);
  console.log(`OpenAI API Integration: ${openaiStatus}`);
  console.log(`Stripe API Integration: ${stripeStatus}`);
  console.log(`Checkout Session Creation: ${checkoutStatus}`);
  
  const passedTests = [envValid, openaiResult.success, stripeResult.success, checkoutResult.success].filter(Boolean).length;
  const totalTests = 4;
  
  console.log(`\nOverall Success Rate: ${passedTests}/${totalTests} (${(passedTests/totalTests*100).toFixed(0)}%)`);
  console.log(`Validation Duration: ${duration}s`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL VALIDATIONS PASSED!');
    console.log('✅ DirectoryBolt is fully configured and ready');
    console.log('✅ OpenAI AI analysis is working');
    console.log('✅ Stripe payments are configured');
    console.log('✅ Checkout sessions can be created');
    console.log('\n🚀 READY TO RUN COMPREHENSIVE TESTS!');
    console.log('\nNext step: npm run test:protocol');
  } else {
    console.log('\n⚠️ SOME VALIDATIONS FAILED');
    
    if (!openaiResult.success) {
      console.log('🤖 OpenAI Issue: Check API key and credits');
    }
    if (!stripeResult.success) {
      console.log('💳 Stripe Issue: Check API keys and price IDs');
    }
    if (!checkoutResult.success && !checkoutResult.skipped) {
      console.log('🛒 Checkout Issue: Check price IDs and Stripe configuration');
    }
  }
  
  return {
    success: passedTests === totalTests,
    results: {
      environment: envValid,
      openai: openaiResult,
      stripe: stripeResult,
      checkout: checkoutResult
    },
    duration,
    passedTests,
    totalTests
  };
}

// Run validation if called directly
if (require.main === module) {
  runQuickValidation().catch(console.error);
}

module.exports = { runQuickValidation };