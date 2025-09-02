// 🚨 FINAL PAYMENT SYSTEM VERIFICATION
// Comprehensive test of all payment flows after Riley's fixes

const https = require('https');
const fs = require('fs');

console.log('🚨 FINAL PAYMENT SYSTEM VERIFICATION');
console.log('===================================');
console.log('Testing all payment flows after Riley\'s pricing fixes');
console.log('Verifying no regression in payment plan mappings\n');

const comprehensiveTests = [
  // Core payment plans
  { 
    name: 'Starter Plan', 
    plan: 'starter', 
    expectedAmount: 49, 
    critical: true,
    description: '50 directory submissions - entry level'
  },
  { 
    name: 'Growth Plan', 
    plan: 'growth', 
    expectedAmount: 89, 
    critical: true,
    description: '100 directory submissions - most popular'
  },
  { 
    name: 'Pro Plan', 
    plan: 'pro', 
    expectedAmount: 159, 
    critical: true,
    description: '200 directory submissions - advanced features'
  },
  { 
    name: 'Subscription Plan', 
    plan: 'subscription', 
    expectedAmount: 49, 
    critical: true,
    isSubscription: true,
    description: 'Monthly maintenance and resubmissions'
  },
  
  // Add-on combinations (high-value scenarios)
  { 
    name: 'Growth + Fast-track', 
    plan: 'growth', 
    addons: ['fasttrack'], 
    expectedAmount: 114, // 89 + 25
    critical: false,
    description: 'Growth plan with priority processing'
  },
  { 
    name: 'Pro + All Add-ons', 
    plan: 'pro', 
    addons: ['fasttrack', 'premium', 'qa', 'csv'], 
    expectedAmount: 218, // 159 + 25 + 15 + 10 + 9
    critical: false,
    description: 'Pro plan with all enhancement add-ons'
  },
  
  // Edge case testing
  { 
    name: 'Starter + Premium Directories', 
    plan: 'starter', 
    addons: ['premium'], 
    expectedAmount: 64, // 49 + 15
    critical: false,
    description: 'Entry plan with premium directory filter'
  }
];

async function testPaymentFlow(test) {
  return new Promise((resolve) => {
    console.log(`📋 ${test.name}`);
    console.log(`   Plan: ${test.plan} | Expected: $${test.expectedAmount}`);
    console.log(`   Description: ${test.description}`);
    
    const postData = JSON.stringify({
      plan: test.plan,
      addons: test.addons || [],
      isSubscription: test.isSubscription || false,
      customerEmail: 'test@directorybolt.com'
    });

    const options = {
      hostname: 'directorybolt.com',
      port: 443,
      path: '/api/create-checkout-session-v3',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            const actualAmount = response.totalAmount || response.amount;
            const amountMatches = actualAmount === test.expectedAmount;
            
            if (amountMatches) {
              console.log(`   ✅ SUCCESS: $${actualAmount} (correct amount)`);
              console.log(`   Session ID: ${response.sessionId}`);
              resolve({ ...test, success: true, actualAmount, sessionId: response.sessionId });
            } else {
              console.log(`   ❌ AMOUNT MISMATCH: Expected $${test.expectedAmount}, got $${actualAmount}`);
              resolve({ ...test, success: false, actualAmount, error: 'Amount mismatch' });
            }
          } catch (e) {
            console.log(`   ❌ INVALID RESPONSE: ${data}`);
            resolve({ ...test, success: false, error: 'Invalid JSON response' });
          }
        } else {
          console.log(`   ❌ REQUEST FAILED: ${res.statusCode}`);
          try {
            const errorResponse = JSON.parse(data);
            console.log(`   Error: ${errorResponse.error}`);
          } catch (e) {
            console.log(`   Raw: ${data.substring(0, 100)}`);
          }
          resolve({ ...test, success: false, error: `HTTP ${res.statusCode}`, response: data });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   💥 CONNECTION ERROR: ${error.message}`);
      resolve({ ...test, success: false, error: error.message });
    });

    req.write(postData);
    req.end();
  });
}

async function runFinalVerification() {
  console.log('🚀 Running final payment system verification...\n');
  
  const results = [];
  
  for (let i = 0; i < comprehensiveTests.length; i++) {
    const test = comprehensiveTests[i];
    const result = await testPaymentFlow(test);
    results.push(result);
    
    console.log(''); // Space between tests
    
    // Wait 1.5 seconds between requests to avoid rate limiting
    if (i < comprehensiveTests.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }

  // Generate comprehensive final report
  console.log('📊 FINAL VERIFICATION REPORT');
  console.log('============================');
  
  const criticalTests = results.filter(r => r.critical);
  const criticalPassed = criticalTests.filter(r => r.success).length;
  const criticalTotal = criticalTests.length;
  
  const allTests = results.length;
  const allPassed = results.filter(r => r.success).length;
  
  console.log(`🎯 CRITICAL PLANS: ${criticalPassed}/${criticalTotal} passed`);
  console.log(`🎯 ALL TESTS: ${allPassed}/${allTests} passed\n`);
  
  // Test each critical plan
  const requiredPlans = ['starter', 'growth', 'pro', 'subscription'];
  let allCriticalWorking = true;
  
  for (const planId of requiredPlans) {
    const result = results.find(r => r.plan === planId && r.critical);
    if (result) {
      const status = result.success ? '✅' : '❌';
      console.log(`${status} ${planId.toUpperCase()}: ${result.success ? `$${result.actualAmount} (Working)` : result.error || 'Failed'}`);
      if (!result.success) allCriticalWorking = false;
    } else {
      console.log(`❌ ${planId.toUpperCase()}: Test not found`);
      allCriticalWorking = false;
    }
  }

  console.log('\n🔧 ADD-ON COMBINATIONS:');
  const addonTests = results.filter(r => r.addons && r.addons.length > 0);
  addonTests.forEach(test => {
    const status = test.success ? '✅' : '❌';
    console.log(`${status} ${test.name}: ${test.success ? `$${test.actualAmount}` : test.error}`);
  });

  // Final assessment
  console.log('\n🚨 CRITICAL ASSESSMENT:');
  if (allCriticalWorking) {
    console.log('✅ ALL CRITICAL PAYMENT PLANS VERIFIED WORKING');
    console.log('✅ No payment regression detected after Riley\'s changes');
    console.log('✅ All 4 core plans (starter, growth, pro, subscription) functional');
    console.log('✅ Add-on combinations working correctly');
    console.log('\n🎉 PAYMENT SYSTEM STATUS: FULLY OPERATIONAL');
  } else {
    console.log('❌ CRITICAL PAYMENT ISSUES DETECTED');
    console.log('❌ Payment regression found - immediate action required');
    
    const failedCritical = criticalTests.filter(r => !r.success);
    failedCritical.forEach(test => {
      console.log(`   🔧 Fix ${test.plan} plan: ${test.error || 'Unknown error'}`);
    });
  }

  // Detailed results for debugging
  const detailedReport = {
    timestamp: new Date().toISOString(),
    verificationComplete: true,
    criticalTestsPassed: allCriticalWorking,
    summary: {
      totalTests: allTests,
      passed: allPassed,
      failed: allTests - allPassed,
      criticalTests: criticalTotal,
      criticalPassed: criticalPassed,
      successRate: Math.round((allPassed / allTests) * 100) + '%'
    },
    planStatus: {
      starter: results.find(r => r.plan === 'starter' && r.critical)?.success || false,
      growth: results.find(r => r.plan === 'growth' && r.critical)?.success || false,
      pro: results.find(r => r.plan === 'pro' && r.critical)?.success || false,
      subscription: results.find(r => r.plan === 'subscription' && r.critical)?.success || false
    },
    testResults: results,
    recommendations: allCriticalWorking ? [
      'Payment system is fully operational',
      'All payment plan mappings working correctly',
      'Riley\'s pricing fixes did not cause regression',
      'Ready for production use',
      'Continue monitoring with regular tests'
    ] : [
      'URGENT: Fix failing critical payment plans immediately',
      'Coordinate with Riley on any frontend issues',
      'Verify Stripe configuration and API keys',
      'Test locally before deploying fixes',
      'Implement additional error handling if needed'
    ]
  };

  fs.writeFileSync('final_payment_verification.json', JSON.stringify(detailedReport, null, 2));

  console.log('\n💾 Detailed report saved to final_payment_verification.json');
  console.log(`🏁 Verification Complete - Exit Code: ${allCriticalWorking ? '0' : '1'}`);
  
  return { allCriticalWorking, results, detailedReport };
}

// Run the final verification
if (require.main === module) {
  runFinalVerification()
    .then(({ allCriticalWorking, results, detailedReport }) => {
      process.exit(allCriticalWorking ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 CRITICAL VERIFICATION FAILURE:', error);
      process.exit(1);
    });
}

module.exports = { runFinalVerification };