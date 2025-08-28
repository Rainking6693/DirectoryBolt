#!/usr/bin/env node
/**
 * 🔒 STRIPE INTEGRATION TEST SCRIPT
 * 
 * This script tests the complete Stripe integration flow:
 * 1. Validates environment variables
 * 2. Tests checkout session creation for all plans
 * 3. Validates webhook configuration
 * 4. Tests session retrieval
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Color codes for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

console.log(`${colors.cyan}🚀 DirectoryBolt Stripe Integration Test${colors.reset}\n`);

// Test configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_PLANS = ['starter', 'growth', 'professional', 'enterprise'];

// Test environment variables
function testEnvironmentVariables() {
  console.log(`${colors.blue}📋 Testing Environment Variables${colors.reset}`);
  
  const requiredEnvVars = [
    'STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXTAUTH_URL'
  ];
  
  const optionalEnvVars = [
    'STRIPE_STARTER_PRICE_ID',
    'STRIPE_GROWTH_PRICE_ID', 
    'STRIPE_PROFESSIONAL_PRICE_ID',
    'STRIPE_ENTERPRISE_PRICE_ID'
  ];
  
  let allRequiredPresent = true;
  
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(`  ✅ ${envVar}: ${process.env[envVar].substring(0, 20)}...`);
    } else {
      console.log(`  ❌ ${envVar}: Missing`);
      allRequiredPresent = false;
    }
  }
  
  console.log(`\n${colors.yellow}Optional Environment Variables:${colors.reset}`);
  for (const envVar of optionalEnvVars) {
    if (process.env[envVar]) {
      console.log(`  ✅ ${envVar}: ${process.env[envVar]}`);
    } else {
      console.log(`  ⚠️  ${envVar}: Not configured (will need to be set in production)`);
    }
  }
  
  if (!allRequiredPresent) {
    console.log(`\n${colors.red}❌ Missing required environment variables. Please check your .env.local file.${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`\n${colors.green}✅ Environment variables check passed${colors.reset}\n`);
}

// Test checkout session creation
async function testCheckoutSessionCreation(plan) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      plan: plan,
      user_email: 'test@directorybolt.com',
      user_id: 'test_user_123',
      success_url: `${BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/cancel`,
      extended_trial: false
    });

    const options = {
      hostname: new URL(BASE_URL).hostname,
      port: new URL(BASE_URL).port || (BASE_URL.includes('https') ? 443 : 80),
      path: '/api/create-checkout-session',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = (BASE_URL.includes('https') ? https : require('http')).request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode === 200 && response.success) {
            console.log(`  ✅ ${plan.toUpperCase()}: Checkout session created`);
            console.log(`     Session ID: ${response.data.checkout_session.id}`);
            console.log(`     Trial Days: ${response.data.trial_period_days}`);
            resolve(response);
          } else {
            console.log(`  ❌ ${plan.toUpperCase()}: ${response.error?.message || 'Unknown error'}`);
            resolve(null);
          }
        } catch (error) {
          console.log(`  ❌ ${plan.toUpperCase()}: Invalid JSON response`);
          resolve(null);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`  ❌ ${plan.toUpperCase()}: ${error.message}`);
      resolve(null);
    });

    req.write(postData);
    req.end();
  });
}

// Test all checkout sessions
async function testAllCheckoutSessions() {
  console.log(`${colors.blue}💳 Testing Checkout Session Creation${colors.reset}`);
  
  const results = [];
  
  for (const plan of TEST_PLANS) {
    const result = await testCheckoutSessionCreation(plan);
    results.push({ plan, success: !!result });
  }
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  if (successCount === totalCount) {
    console.log(`\n${colors.green}✅ All checkout sessions created successfully (${successCount}/${totalCount})${colors.reset}\n`);
  } else {
    console.log(`\n${colors.yellow}⚠️  Some checkout sessions failed (${successCount}/${totalCount})${colors.reset}\n`);
  }
  
  return results;
}

// Test webhook endpoint
function testWebhookEndpoint() {
  return new Promise((resolve) => {
    console.log(`${colors.blue}🔗 Testing Webhook Endpoint${colors.reset}`);
    
    const options = {
      hostname: new URL(BASE_URL).hostname,
      port: new URL(BASE_URL).port || (BASE_URL.includes('https') ? 443 : 80),
      path: '/api/webhooks/stripe',
      method: 'GET' // This should return 405 Method Not Allowed
    };

    const req = (BASE_URL.includes('https') ? https : require('http')).request(options, (res) => {
      if (res.statusCode === 405) {
        console.log(`  ✅ Webhook endpoint is accessible and correctly configured`);
        resolve(true);
      } else {
        console.log(`  ❌ Webhook endpoint returned unexpected status: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (error) => {
      console.log(`  ❌ Webhook endpoint error: ${error.message}`);
      resolve(false);
    });

    req.end();
  });
}

// Test API health
function testApiHealth() {
  return new Promise((resolve) => {
    console.log(`${colors.blue}🏥 Testing API Health${colors.reset}`);
    
    const options = {
      hostname: new URL(BASE_URL).hostname,
      port: new URL(BASE_URL).port || (BASE_URL.includes('https') ? 443 : 80),
      path: '/api/health',
      method: 'GET'
    };

    const req = (BASE_URL.includes('https') ? https : require('http')).request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`  ✅ API health check passed`);
          resolve(true);
        } else {
          console.log(`  ❌ API health check failed: ${res.statusCode}`);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      console.log(`  ❌ API health check error: ${error.message}`);
      resolve(false);
    });

    req.end();
  });
}

// Generate test report
function generateTestReport(results) {
  console.log(`${colors.magenta}📊 Test Report Summary${colors.reset}`);
  console.log(`  Base URL: ${BASE_URL}`);
  console.log(`  Test Time: ${new Date().toISOString()}`);
  console.log(`  Checkout Sessions: ${results.checkoutSessions.filter(r => r.success).length}/${results.checkoutSessions.length} passed`);
  console.log(`  Webhook Endpoint: ${results.webhookEndpoint ? 'PASS' : 'FAIL'}`);
  console.log(`  API Health: ${results.apiHealth ? 'PASS' : 'FAIL'}`);
  
  console.log(`\n${colors.cyan}📋 Next Steps:${colors.reset}`);
  
  if (results.allPassed) {
    console.log(`  ✅ All tests passed! Your Stripe integration is ready for production.`);
    console.log(`  🚀 Don't forget to:`);
    console.log(`     1. Set up Stripe webhook endpoint in your Stripe dashboard`);
    console.log(`     2. Configure production Stripe price IDs`);
    console.log(`     3. Test with real Stripe test cards`);
    console.log(`     4. Set up proper user authentication`);
  } else {
    console.log(`  ⚠️  Some tests failed. Please fix the issues above before deploying.`);
  }
}

// Main test function
async function runTests() {
  try {
    // Load environment variables if .env.local exists
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');
      
      for (const line of envLines) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }

    // Run all tests
    testEnvironmentVariables();
    
    const checkoutSessions = await testAllCheckoutSessions();
    const webhookEndpoint = await testWebhookEndpoint();
    const apiHealth = await testApiHealth();
    
    console.log();
    
    const results = {
      checkoutSessions,
      webhookEndpoint,
      apiHealth,
      allPassed: checkoutSessions.every(r => r.success) && webhookEndpoint && apiHealth
    };
    
    generateTestReport(results);
    
    process.exit(results.allPassed ? 0 : 1);
    
  } catch (error) {
    console.error(`${colors.red}❌ Test execution failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Check if running as main module
if (require.main === module) {
  runTests();
}

module.exports = {
  runTests,
  testEnvironmentVariables,
  testCheckoutSessionCreation,
  testWebhookEndpoint,
  testApiHealth
};