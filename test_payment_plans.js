// 🚨 CRITICAL PAYMENT MAPPING TEST
// Simple verification of all payment plan mappings

const https = require('https');

console.log('🚨 CRITICAL: Payment Plan Mapping Test');
console.log('=====================================');

const testPlans = [
  { id: 'starter', name: 'Starter Package', price: 49 },
  { id: 'growth', name: 'Growth Package', price: 89 },
  { id: 'pro', name: 'Pro Package', price: 159 },
  { id: 'subscription', name: 'Subscription Plan', price: 49, isSubscription: true }
];

async function testPlan(plan) {
  return new Promise((resolve) => {
    console.log(`\n📋 Testing: ${plan.name} (${plan.id})`);
    
    const postData = JSON.stringify({
      plan: plan.id,
      addons: [],
      isSubscription: plan.isSubscription || false,
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
      
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`   Status: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          try {
            const response = JSON.parse(data);
            console.log(`   ✅ SUCCESS: Session ${response.sessionId}`);
            console.log(`   Amount: $${response.totalAmount || response.amount}`);
            resolve({ success: true, plan: plan.id, data: response });
          } catch (e) {
            console.log(`   ❌ Invalid JSON response: ${data}`);
            resolve({ success: false, plan: plan.id, error: 'Invalid JSON' });
          }
        } else {
          console.log(`   ❌ FAILED: ${data}`);
          try {
            const errorResponse = JSON.parse(data);
            console.log(`   Error: ${errorResponse.error}`);
            console.log(`   Available: ${errorResponse.availablePlans?.join(', ') || 'None'}`);
          } catch (e) {
            console.log(`   Raw error: ${data.substring(0, 100)}`);
          }
          resolve({ success: false, plan: plan.id, error: data, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   💥 Request Error: ${error.message}`);
      resolve({ success: false, plan: plan.id, error: error.message });
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🚀 Testing all payment plans...\n');
  
  const results = [];
  
  for (const plan of testPlans) {
    const result = await testPlan(plan);
    results.push(result);
    
    // Wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Test with add-ons
  console.log('\n🎯 Testing Growth + All Add-ons');
  const result = await new Promise((resolve) => {
    const postData = JSON.stringify({
      plan: 'growth',
      addons: ['fasttrack', 'premium', 'qa', 'csv'],
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
          const response = JSON.parse(data);
          console.log(`   ✅ SUCCESS: Growth + Add-ons = $${response.totalAmount}`);
          resolve({ success: true, plan: 'growth_addons' });
        } else {
          console.log(`   ❌ FAILED: ${data}`);
          resolve({ success: false, plan: 'growth_addons', error: data });
        }
      });
    });

    req.on('error', (error) => {
      console.log(`   💥 Error: ${error.message}`);
      resolve({ success: false, plan: 'growth_addons', error: error.message });
    });

    req.write(postData);
    req.end();
  });
  
  results.push(result);

  // Generate summary
  console.log('\n📊 FINAL RESULTS');
  console.log('================');
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  let allCriticalPassed = true;
  const requiredPlans = ['starter', 'growth', 'pro', 'subscription'];
  
  for (const planId of requiredPlans) {
    const result = results.find(r => r.plan === planId);
    const status = result?.success ? '✅' : '❌';
    console.log(`${status} ${planId.toUpperCase()}: ${result?.success ? 'Working' : 'FAILED'}`);
    if (!result?.success) allCriticalPassed = false;
  }

  const addonResult = results.find(r => r.plan === 'growth_addons');
  const addonStatus = addonResult?.success ? '✅' : '❌';
  console.log(`${addonStatus} ADD-ONS: ${addonResult?.success ? 'Working' : 'FAILED'}`);

  console.log(`\n🎯 OVERALL: ${passed}/${total} tests passed`);
  
  if (allCriticalPassed) {
    console.log('✅ ALL CRITICAL PLANS WORKING - No action needed');
  } else {
    console.log('❌ PAYMENT SYSTEM HAS ISSUES - Immediate fix required');
  }

  // Save results
  const fs = require('fs');
  fs.writeFileSync('payment_test_results.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    passed: passed,
    total: total,
    allCriticalPassed: allCriticalPassed,
    results: results
  }, null, 2));

  console.log('\n💾 Results saved to payment_test_results.json');
  
  return allCriticalPassed;
}

runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
});