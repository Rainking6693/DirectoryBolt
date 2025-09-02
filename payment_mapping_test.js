// 🚨 CRITICAL PAYMENT MAPPING VERIFICATION TEST
// Testing all payment plans against API mapping

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import fetch from 'node-fetch';

const dev = false;
const app = next({ dev });
const handle = app.getRequestHandler();

console.log('🚨 CRITICAL: Payment Mapping Verification Test');
console.log('==================================================');

const testPlans = [
  { id: 'starter', name: 'Starter Package', price: 49 },
  { id: 'growth', name: 'Growth Package', price: 89 },
  { id: 'pro', name: 'Pro Package', price: 159 },
  { id: 'subscription', name: 'Subscription Plan', price: 49, isSubscription: true }
];

const testAddons = [
  'fasttrack',
  'premium', 
  'qa',
  'csv'
];

async function testPaymentPlan(plan, addons = []) {
  console.log(`\n📋 Testing Plan: ${plan.name} (${plan.id})`);
  console.log('----------------------------------------------');

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const testPayload = {
      plan: plan.id,
      addons: addons,
      isSubscription: plan.isSubscription || false,
      customerEmail: 'test@directorybolt.com',
      successUrl: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan.id}`,
      cancelUrl: `${baseUrl}/pricing?cancelled=true&plan=${plan.id}`
    };

    console.log('🔧 Request Payload:', JSON.stringify(testPayload, null, 2));

    const response = await fetch(`${baseUrl}/api/create-checkout-session-v3`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    const responseText = await response.text();
    
    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📊 Response Headers:`, Object.fromEntries(response.headers));
    
    if (response.status === 200) {
      const data = JSON.parse(responseText);
      console.log('✅ SUCCESS - Payment Session Created');
      console.log(`   Session ID: ${data.sessionId}`);
      console.log(`   Plan: ${data.plan}`);
      console.log(`   Total Amount: $${data.totalAmount}`);
      console.log(`   Checkout URL: ${data.checkoutUrl ? 'Generated' : 'MISSING'}`);
      
      if (addons.length > 0) {
        console.log(`   Add-ons: ${data.addons?.join(', ') || 'NOT FOUND'}`);
      }
      
      return {
        success: true,
        sessionId: data.sessionId,
        plan: data.plan,
        amount: data.totalAmount,
        hasCheckoutUrl: !!data.checkoutUrl
      };
    } else {
      console.log('❌ FAILURE - Payment Session Failed');
      console.log('📋 Response Body:', responseText);
      
      try {
        const errorData = JSON.parse(responseText);
        console.log('🚨 Error Details:');
        console.log(`   Error: ${errorData.error}`);
        console.log(`   Message: ${errorData.message}`);
        console.log(`   Available Plans: ${errorData.availablePlans?.join(', ') || 'None listed'}`);
      } catch (e) {
        console.log('🚨 Raw Error Response:', responseText);
      }
      
      return {
        success: false,
        error: responseText,
        status: response.status
      };
    }

  } catch (error) {
    console.log('💥 CRITICAL ERROR:', error.message);
    console.log('   Stack:', error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

async function runPaymentMappingTests() {
  console.log('🚀 Starting comprehensive payment mapping verification...\n');
  
  const results = [];
  
  // Test each plan individually
  for (const plan of testPlans) {
    const result = await testPaymentPlan(plan);
    results.push({
      planId: plan.id,
      planName: plan.name,
      ...result
    });
    
    // Wait between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test plan with all add-ons
  console.log('\n🎯 Testing Growth Plan with All Add-ons');
  console.log('==========================================');
  const growthWithAddons = await testPaymentPlan(
    testPlans.find(p => p.id === 'growth'), 
    testAddons
  );
  results.push({
    planId: 'growth_with_addons',
    planName: 'Growth with All Add-ons',
    ...growthWithAddons
  });

  // Test plan combinations that commonly fail
  console.log('\n🎯 Testing Common Failure Scenarios');
  console.log('====================================');
  
  // Test invalid plan
  const invalidPlanResult = await testPaymentPlan({ id: 'invalid_plan', name: 'Invalid Plan', price: 99 });
  results.push({
    planId: 'invalid_plan',
    planName: 'Invalid Plan Test',
    ...invalidPlanResult
  });

  // Generate comprehensive report
  console.log('\n📊 COMPREHENSIVE PAYMENT MAPPING TEST RESULTS');
  console.log('==============================================');
  
  let allPassed = true;
  const requiredPlans = ['starter', 'growth', 'pro', 'subscription'];
  
  for (const planId of requiredPlans) {
    const result = results.find(r => r.planId === planId);
    const status = result?.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${planId.toUpperCase()}: ${result?.success ? 'Working' : result?.error || 'Failed'}`);
    
    if (!result?.success) {
      allPassed = false;
    }
  }

  console.log('\n🎯 ADD-ON COMBINATION TEST:');
  const addonResult = results.find(r => r.planId === 'growth_with_addons');
  const addonStatus = addonResult?.success ? '✅ PASS' : '❌ FAIL';
  console.log(`${addonStatus} ALL ADD-ONS: ${addonResult?.success ? 'Working' : addonResult?.error || 'Failed'}`);
  
  if (!addonResult?.success) {
    allPassed = false;
  }

  console.log('\n🚨 CRITICAL ASSESSMENT:');
  if (allPassed) {
    console.log('✅ ALL PAYMENT PLANS WORKING - No regression detected');
    console.log('   ✅ Starter plan: Working');
    console.log('   ✅ Growth plan: Working');  
    console.log('   ✅ Pro plan: Working');
    console.log('   ✅ Subscription plan: Working');
    console.log('   ✅ Add-on combinations: Working');
  } else {
    console.log('❌ PAYMENT REGRESSION DETECTED - Immediate action required');
    console.log('\n🔧 REQUIRED FIXES:');
    
    for (const planId of requiredPlans) {
      const result = results.find(r => r.planId === planId);
      if (!result?.success) {
        console.log(`   ❌ Fix ${planId.toUpperCase()} plan mapping`);
        console.log(`      Error: ${result?.error || 'Unknown error'}`);
      }
    }
    
    if (!addonResult?.success) {
      console.log('   ❌ Fix add-on combination handling');
      console.log(`      Error: ${addonResult?.error || 'Unknown error'}`);
    }
  }

  // Write detailed results to file
  const detailedResults = {
    timestamp: new Date().toISOString(),
    testSummary: {
      totalTests: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      allPassed: allPassed
    },
    planResults: results,
    recommendations: allPassed ? [
      'All payment plans are working correctly',
      'No immediate action required',
      'Continue with regular testing schedule'
    ] : [
      'CRITICAL: Payment system has regressions',
      'Fix failing plan mappings immediately',
      'Test all fixes before deploying',
      'Coordinate with Riley on frontend changes'
    ]
  };

  console.log('\n💾 Saving detailed results to payment_mapping_results.json...');
  
  return {
    allPassed,
    results,
    detailedResults
  };
}

// Export for use in other tests
export { testPaymentPlan, runPaymentMappingTests };

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPaymentMappingTests()
    .then(({ allPassed, results, detailedResults }) => {
      require('fs').writeFileSync(
        'payment_mapping_results.json', 
        JSON.stringify(detailedResults, null, 2)
      );
      
      console.log('\n🏁 Test Complete');
      console.log(`📊 Results saved to payment_mapping_results.json`);
      console.log(`🚨 Exit Code: ${allPassed ? '0 (Success)' : '1 (Failure)'}`);
      
      process.exit(allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 CRITICAL TEST FAILURE:', error);
      process.exit(1);
    });
}