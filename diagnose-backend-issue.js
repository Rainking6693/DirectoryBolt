/**
 * DirectoryBolt Backend Diagnostics
 * Tests API connectivity and identifies staff dashboard connection issues
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PRODUCTION_URL = 'https://directorybolt.com';

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'DirectoryBolt-Diagnostics/1.0',
        'Accept': 'application/json',
        ...options.headers
      }
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            rawData: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: null,
            rawData: data,
            parseError: e.message
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testEndpoint(name, url, options = {}) {
  console.log(`\n🔍 Testing: ${name}`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await makeRequest(url, options);
    
    console.log(`   Status: ${response.status}`);
    if (response.status >= 200 && response.status < 300) {
      console.log(`   ✅ Success`);
      if (response.data) {
        console.log(`   Response: ${JSON.stringify(response.data, null, 2).substring(0, 200)}...`);
      }
    } else if (response.status === 401) {
      console.log(`   🔒 Authentication Required`);
    } else if (response.status === 404) {
      console.log(`   ❌ Not Found`);
    } else {
      console.log(`   ⚠️  Unexpected Status`);
      if (response.data) {
        console.log(`   Error: ${JSON.stringify(response.data)}`);
      }
    }
    
    return response;
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return null;
  }
}

async function testStaffAuthentication(baseUrl) {
  console.log(`\n🔐 Testing Staff Authentication Flow`);
  
  // Test 1: Check auth-check endpoint without credentials
  await testEndpoint('Staff Auth Check (no credentials)', `${baseUrl}/api/staff/auth-check`);
  
  // Test 2: Try with test mode credentials
  const testHeaders = {
    'Cookie': 'staff-session=VALIDTOKEN'
  };
  await testEndpoint('Staff Auth Check (test credentials)', `${baseUrl}/api/staff/auth-check`, {
    headers: testHeaders
  });
  
  // Test 3: Try with API key
  const apiKeyHeaders = {
    'x-staff-key': 'DirectoryBolt-Staff-2025-SecureKey'
  };
  await testEndpoint('Staff Auth Check (API key)', `${baseUrl}/api/staff/auth-check`, {
    headers: apiKeyHeaders
  });
  
  // Test 4: Staff queue endpoint (requires auth)
  await testEndpoint('Staff Queue (no auth)', `${baseUrl}/api/staff/queue`);
  
  await testEndpoint('Staff Queue (with test auth)', `${baseUrl}/api/staff/queue`, {
    headers: testHeaders
  });
}

async function testSupabaseConnectivity(baseUrl) {
  console.log(`\n💾 Testing Supabase Connectivity`);
  
  // Test health endpoint which should check Supabase
  await testEndpoint('Health Check', `${baseUrl}/api/health`);
  
  // Test Supabase-specific health
  await testEndpoint('Supabase Health', `${baseUrl}/api/health/supabase`);
}

async function testJobQueueEndpoints(baseUrl) {
  console.log(`\n⚙️ Testing Job Queue Endpoints`);
  
  await testEndpoint('Jobs Next', `${baseUrl}/api/jobs/next`);
  await testEndpoint('AutoBolt Jobs Next', `${baseUrl}/api/autobolt/jobs/next`);
  await testEndpoint('Queue Status', `${baseUrl}/api/queue/status`);
}

async function runDiagnostics() {
  console.log('🚀 DirectoryBolt Backend Diagnostics');
  console.log('=====================================');
  
  // Test local development server if running
  console.log('\n📍 Testing Local Development Server');
  try {
    await testEndpoint('Local Health Check', `${BASE_URL}/api/health`);
    await testStaffAuthentication(BASE_URL);
    await testSupabaseConnectivity(BASE_URL);
    await testJobQueueEndpoints(BASE_URL);
  } catch (error) {
    console.log(`❌ Local server not responding: ${error.message}`);
  }
  
  // Test production server
  console.log('\n🌐 Testing Production Server');
  try {
    await testEndpoint('Production Health Check', `${PRODUCTION_URL}/api/health`);
    await testStaffAuthentication(PRODUCTION_URL);
  } catch (error) {
    console.log(`❌ Production server error: ${error.message}`);
  }
  
  // Environment check
  console.log('\n🔧 Environment Check');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
  console.log(`   TEST_MODE: ${process.env.TEST_MODE || 'undefined'}`);
  console.log(`   SUPABASE_URL: ${process.env.SUPABASE_URL ? 'Set' : 'Not set'}`);
  console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set'}`);
  console.log(`   STAFF_API_KEY: ${process.env.STAFF_API_KEY ? 'Set' : 'Not set'}`);
  console.log(`   STAFF_SESSION_TOKEN: ${process.env.STAFF_SESSION_TOKEN ? 'Set' : 'Not set'}`);
  
  console.log('\n📋 Summary & Recommendations');
  console.log('============================');
  console.log('1. Check if the development server is running: npm run dev');
  console.log('2. Verify .env.local file has all required environment variables');
  console.log('3. Check Supabase connection and credentials');
  console.log('4. Test staff authentication with TEST_MODE=true');
  console.log('5. Review server logs for detailed error messages');
  
  console.log('\n🔗 Next Steps:');
  console.log('- If local server isn\'t running: npm run dev');
  console.log('- If auth fails: check STAFF_SESSION_TOKEN in .env.local');
  console.log('- If Supabase fails: verify SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  console.log('- For production issues: check Netlify deployment and environment variables');
}

// Run diagnostics
runDiagnostics().catch(console.error);