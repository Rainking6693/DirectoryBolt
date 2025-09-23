const http = require('http');

console.log('🚀 DirectoryBolt External Audit - Phase 1 Testing');
console.log('==================================================');

// Function to test API endpoint
function testEndpoint(url, method = 'GET', data = null) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DirectoryBolt-Audit/1.0'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ 
            success: true, 
            status: res.statusCode, 
            data: parsed,
            headers: res.headers
          });
        } catch (error) {
          resolve({ 
            success: false, 
            status: res.statusCode, 
            error: error.message, 
            rawData: responseData 
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({ success: false, error: error.message });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function runAudit() {
  console.log('\n📊 Phase 1.1: Core API Endpoints Testing');
  console.log('=========================================');
  
  // Test 1: Health Check
  console.log('\n🔍 Testing Health Check Endpoint...');
  const healthResult = await testEndpoint('http://localhost:3000/api/health');
  
  if (healthResult.success) {
    console.log('✅ Health Check: PASSED');
    console.log(`   Status: ${healthResult.status}`);
    console.log(`   Environment: ${healthResult.data.environment}`);
    console.log(`   Has Stripe: ${healthResult.data.hasStripe}`);
    console.log(`   Has Supabase: ${healthResult.data.hasSupabase}`);
  } else {
    console.log('❌ Health Check: FAILED');
    console.log(`   Error: ${healthResult.error}`);
    if (healthResult.rawData) {
      console.log(`   Response: ${healthResult.rawData.substring(0, 200)}`);
    }
  }
  
  // Test 2: System Status
  console.log('\n🔍 Testing System Status Endpoint...');
  const statusResult = await testEndpoint('http://localhost:3000/api/system-status');
  
  if (statusResult.success) {
    console.log('✅ System Status: PASSED');
    console.log(`   Status: ${statusResult.status}`);
    console.log(`   Environment: ${statusResult.data.environment}`);
    console.log(`   Critical Issues: ${statusResult.data.critical_issues?.length || 0}`);
    console.log(`   Warnings: ${statusResult.data.warnings?.length || 0}`);
    
    if (statusResult.data.critical_issues?.length > 0) {
      console.log('\n⚠️  Critical Issues Found:');
      statusResult.data.critical_issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
    }
    
    if (statusResult.data.warnings?.length > 0) {
      console.log('\n⚠️  Warnings Found:');
      statusResult.data.warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. ${warning}`);
      });
    }
  } else {
    console.log('❌ System Status: FAILED');
    console.log(`   Error: ${statusResult.error}`);
    if (statusResult.rawData) {
      console.log(`   Response: ${statusResult.rawData.substring(0, 200)}`);
    }
  }
  
  // Test 3: Analyze Endpoint (check if exists)
  console.log('\n🔍 Testing Analyze Endpoint (GET for existence check)...');
  const analyzeResult = await testEndpoint('http://localhost:3000/api/analyze');
  
  if (analyzeResult.success || analyzeResult.status === 405) {
    console.log('✅ Analyze Endpoint: EXISTS');
    console.log(`   Status: ${analyzeResult.status} (405 Method Not Allowed is expected for GET)`);
  } else if (analyzeResult.status === 404) {
    console.log('❌ Analyze Endpoint: NOT FOUND');
  } else {
    console.log('⚠️  Analyze Endpoint: UNKNOWN STATUS');
    console.log(`   Status: ${analyzeResult.status}`);
    console.log(`   Error: ${analyzeResult.error}`);
  }
  
  // Summary
  console.log('\n📋 Phase 1.1 Results Summary:');
  console.log('============================');
  console.log(`Health Check: ${healthResult.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`System Status: ${statusResult.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Analyze Endpoint: ${analyzeResult.success || analyzeResult.status === 405 ? '✅ EXISTS' : '❌ MISSING'}`);
  
  const passCount = [
    healthResult.success,
    statusResult.success,
    analyzeResult.success || analyzeResult.status === 405
  ].filter(Boolean).length;
  
  console.log(`\nOverall Score: ${passCount}/3 tests passed`);
  
  if (passCount === 3) {
    console.log('🎉 Phase 1.1: ALL TESTS PASSED - Ready for Phase 1.2');
  } else if (passCount >= 2) {
    console.log('⚠️  Phase 1.1: MOSTLY PASSING - Some issues to investigate');
  } else {
    console.log('❌ Phase 1.1: MULTIPLE FAILURES - Server may not be running');
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Make sure development server is running: npm run dev');
    console.log('   2. Check if port 3000 is available');
    console.log('   3. Verify environment variables are set');
  }
  
  console.log('\n🎯 Next Steps:');
  console.log('- Continue with Phase 1.2: Job Queue Operations');
  console.log('- Test staff authentication endpoints');
  console.log('- Validate AutoBolt integration APIs');
}

// Run the audit
runAudit().catch(console.error);