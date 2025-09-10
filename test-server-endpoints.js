#!/usr/bin/env node

/**
 * DirectoryBolt Server Endpoint Tester
 * Tests specific API endpoints to identify the source of server errors
 */

const http = require('http');
const https = require('https');

console.log('🧪 DirectoryBolt Server Endpoint Tester');
console.log('=' .repeat(50));

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DirectoryBolt-Diagnostic/1.0',
        ...options.headers
      },
      timeout: 10000
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            data: jsonData,
            rawData: data,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            statusText: res.statusMessage,
            data: null,
            rawData: data,
            headers: res.headers,
            parseError: error.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        success: false,
        error: error.message,
        code: error.code
      });
    });

    req.on('timeout', () => {
      req.destroy();
      reject({
        success: false,
        error: 'Request timeout',
        code: 'TIMEOUT'
      });
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// Test endpoints
const endpoints = [
  {
    name: 'Health Check',
    url: 'http://localhost:3000/api/health',
    method: 'GET',
    description: 'Basic server health check'
  },
  {
    name: 'Homepage',
    url: 'http://localhost:3000',
    method: 'GET',
    description: 'Main homepage load test'
  },
  {
    name: 'Analyze API (Free)',
    url: 'http://localhost:3000/api/analyze',
    method: 'POST',
    body: {
      url: 'https://example.com',
      tier: 'free'
    },
    description: 'Website analysis API test'
  },
  {
    name: 'Pricing Page',
    url: 'http://localhost:3000/pricing',
    method: 'GET',
    description: 'Pricing page load test'
  }
];

async function testEndpoint(endpoint) {
  console.log(`\n🧪 Testing: ${endpoint.name}`);
  console.log(`   URL: ${endpoint.url}`);
  console.log(`   Method: ${endpoint.method}`);
  
  try {
    const result = await makeRequest(endpoint.url, {
      method: endpoint.method,
      body: endpoint.body
    });

    if (result.success) {
      console.log(`   ✅ SUCCESS (${result.status})`);
      if (endpoint.name === 'Health Check' && result.data) {
        console.log(`      Status: ${result.data.status}`);
        console.log(`      Environment: ${result.data.environment}`);
        console.log(`      Has Stripe: ${result.data.hasStripe}`);
        console.log(`      Has Supabase: ${result.data.hasSupabase}`);
      }
    } else {
      console.log(`   ❌ FAILED (${result.status})`);
      console.log(`      Status: ${result.statusText}`);
      if (result.data && result.data.error) {
        console.log(`      Error: ${result.data.error}`);
      }
      if (result.rawData && result.rawData.length < 500) {
        console.log(`      Response: ${result.rawData}`);
      }
    }

    return result;

  } catch (error) {
    console.log(`   ❌ CONNECTION FAILED`);
    console.log(`      Error: ${error.error}`);
    console.log(`      Code: ${error.code}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log(`      💡 Suggestion: Development server is not running`);
      console.log(`         Run: npm run dev`);
    } else if (error.code === 'TIMEOUT') {
      console.log(`      💡 Suggestion: Server is responding slowly`);
    }

    return error;
  }
}

async function runTests() {
  console.log('\n🚀 Starting endpoint tests...');
  console.log('(Make sure your development server is running: npm run dev)');
  
  const results = {};
  
  for (const endpoint of endpoints) {
    results[endpoint.name] = await testEndpoint(endpoint);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between tests
  }

  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('=' .repeat(50));
  
  const successful = Object.values(results).filter(r => r.success).length;
  const failed = Object.values(results).filter(r => !r.success).length;
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n🔍 FAILURE ANALYSIS:');
    
    const connectionErrors = Object.values(results).filter(r => r.code === 'ECONNREFUSED').length;
    const serverErrors = Object.values(results).filter(r => r.status >= 500).length;
    const clientErrors = Object.values(results).filter(r => r.status >= 400 && r.status < 500).length;
    
    if (connectionErrors > 0) {
      console.log(`🔴 Connection Refused (${connectionErrors}): Development server not running`);
      console.log(`   Solution: Run 'npm run dev' in another terminal`);
    }
    
    if (serverErrors > 0) {
      console.log(`🔴 Server Errors (${serverErrors}): Internal server issues`);
      console.log(`   Solution: Check server logs and environment variables`);
    }
    
    if (clientErrors > 0) {
      console.log(`🟡 Client Errors (${clientErrors}): Request/routing issues`);
      console.log(`   Solution: Check API endpoints and request format`);
    }
  }

  console.log('\n💡 NEXT STEPS:');
  
  if (successful === 0) {
    console.log(`
1. 🚀 Start the development server:
   npm run dev

2. 🔧 If server fails to start, run diagnostics:
   node diagnose-server-error.js

3. 🔑 Check environment variables in .env.local

4. 🧹 Clear cache and rebuild:
   rm -rf .next && npm run build
`);
  } else if (failed > 0) {
    console.log(`
1. 🔍 Check server logs in the terminal where you ran 'npm run dev'

2. 🌐 Open browser developer tools (F12) and check:
   - Console tab for JavaScript errors
   - Network tab for failed requests

3. 🔑 Verify environment variables are properly set

4. 📞 If specific endpoints fail, check the API implementation
`);
  } else {
    console.log(`
🎉 All tests passed! Your server appears to be working correctly.

If you're still seeing "Server error" messages:
1. 🌐 Check the browser developer tools (F12)
2. 🔍 Look for specific error messages in the console
3. 📱 Try refreshing the page or clearing browser cache
4. 🧪 Test different pages/features to isolate the issue
`);
  }

  // Save results
  const fs = require('fs');
  fs.writeFileSync('endpoint-test-results.json', JSON.stringify(results, null, 2));
  console.log('\n📄 Detailed results saved to: endpoint-test-results.json');
}

// Run the tests
runTests().catch(error => {
  console.error('\n💥 Test runner failed:', error);
  process.exit(1);
});