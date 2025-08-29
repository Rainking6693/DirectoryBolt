#!/usr/bin/env node
/**
 * API Response Diagnostic Tool
 * Tests API endpoints to identify HTML vs JSON response issues
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

console.log('🔍 API Response Diagnostic Tool');
console.log(`Testing against: ${BASE_URL}`);
console.log('=' .repeat(50));

async function makeRequest(endpoint, method = 'POST', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const requestModule = isHttps ? https : http;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'API-Diagnostic-Tool/1.0',
      ...headers
    };

    if (body && typeof body === 'object') {
      body = JSON.stringify(body);
      defaultHeaders['Content-Length'] = Buffer.byteLength(body);
    }

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 3000),
      path: url.pathname + url.search,
      method: method,
      headers: defaultHeaders,
      timeout: 10000
    };

    const req = requestModule.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          statusMessage: res.statusMessage,
          headers: res.headers,
          body: data,
          contentType: res.headers['content-type'] || 'unknown'
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(body);
    }
    
    req.end();
  });
}

function analyzeResponse(response, endpoint) {
  const isJsonContentType = response.contentType.includes('application/json');
  const startsWithHtml = response.body.trim().toLowerCase().startsWith('<!doctype') || 
                        response.body.trim().toLowerCase().startsWith('<html');
  
  let parsedBody = null;
  let isValidJson = false;
  
  try {
    parsedBody = JSON.parse(response.body);
    isValidJson = true;
  } catch (e) {
    // Not valid JSON
  }

  console.log(`\n📊 ${endpoint}:`);
  console.log(`   Status: ${response.statusCode} ${response.statusMessage}`);
  console.log(`   Content-Type: ${response.contentType}`);
  console.log(`   Content Length: ${response.body.length} chars`);
  console.log(`   Is JSON Content-Type: ${isJsonContentType}`);
  console.log(`   Is Valid JSON: ${isValidJson}`);
  console.log(`   Starts with HTML: ${startsWithHtml}`);
  
  if (startsWithHtml) {
    console.log(`   🚨 ISSUE: Endpoint returned HTML instead of JSON`);
    console.log(`   First 200 chars: ${response.body.substring(0, 200)}...`);
  }
  
  if (isValidJson && parsedBody) {
    console.log(`   ✅ Valid JSON Response`);
    if (parsedBody.error) {
      console.log(`   ⚠️  JSON contains error: ${parsedBody.error}`);
    }
  }

  return {
    endpoint,
    isJsonResponse: isValidJson,
    isHtmlResponse: startsWithHtml,
    hasCorrectContentType: isJsonContentType,
    statusCode: response.statusCode,
    issue: startsWithHtml ? 'HTML_RESPONSE' : (!isValidJson ? 'INVALID_JSON' : null)
  };
}

async function runDiagnostics() {
  const results = [];
  
  // Test critical API endpoints
  const tests = [
    {
      endpoint: '/api/create-checkout-session',
      method: 'POST',
      body: {
        plan: 'starter',
        user_email: 'test@example.com',
        user_id: 'test_user_123',
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel'
      }
    },
    {
      endpoint: '/api/analyze',
      method: 'POST', 
      body: {
        url: 'https://example.com',
        options: '{}'
      }
    },
    {
      endpoint: '/api/webhooks/stripe',
      method: 'POST',
      body: { type: 'test_event', data: {} },
      headers: {
        'stripe-signature': 'test_signature'
      }
    },
    {
      endpoint: '/api/health',
      method: 'GET',
      body: null
    },
    {
      endpoint: '/api/status',
      method: 'GET', 
      body: null
    }
  ];

  for (const test of tests) {
    try {
      console.log(`\n🧪 Testing ${test.endpoint}...`);
      const response = await makeRequest(test.endpoint, test.method, test.body, test.headers);
      const analysis = analyzeResponse(response, test.endpoint);
      results.push(analysis);
    } catch (error) {
      console.log(`\n❌ ${test.endpoint}:`);
      console.log(`   Error: ${error.message}`);
      results.push({
        endpoint: test.endpoint,
        error: error.message,
        issue: 'REQUEST_FAILED'
      });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📋 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(50));
  
  const issues = results.filter(r => r.issue);
  const working = results.filter(r => !r.issue && !r.error);
  
  console.log(`✅ Working APIs: ${working.length}`);
  console.log(`🚨 APIs with issues: ${issues.length}`);
  console.log(`❌ Failed requests: ${results.filter(r => r.error).length}`);
  
  if (issues.length > 0) {
    console.log('\n🔍 ISSUES FOUND:');
    issues.forEach(issue => {
      console.log(`   ${issue.endpoint}: ${issue.issue}`);
    });
  }

  if (working.length > 0) {
    console.log('\n✅ WORKING ENDPOINTS:');
    working.forEach(w => {
      console.log(`   ${w.endpoint}: Status ${w.statusCode}`);
    });
  }

  return results;
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('\n❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run diagnostics
if (require.main === module) {
  runDiagnostics()
    .then((results) => {
      console.log('\n✅ Diagnostics completed');
      
      // Write results to file for analysis
      const fs = require('fs');
      const resultsFile = 'api-diagnostics-results.json';
      fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
      console.log(`📄 Results saved to: ${resultsFile}`);
      
      // Exit with error code if issues found
      const hasIssues = results.some(r => r.issue || r.error);
      process.exit(hasIssues ? 1 : 0);
    })
    .catch((error) => {
      console.error('\n❌ Diagnostic failed:', error.message);
      process.exit(1);
    });
}

module.exports = { runDiagnostics, analyzeResponse };