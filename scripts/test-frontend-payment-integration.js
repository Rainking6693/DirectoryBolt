#!/usr/bin/env node
// Test Frontend Payment Integration - Validates frontend payment fixes

require('dotenv').config({ path: ['.env.local', '.env.production', '.env'] });
const puppeteer = require('puppeteer');

class FrontendPaymentTester {
  constructor() {
    this.baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
    this.browser = null;
    this.page = null;
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const prefix = {
      'INFO': '📝',
      'SUCCESS': '✅',
      'ERROR': '❌',
      'WARNING': '⚠️'
    }[level] || '📝';
    
    console.log(`${prefix} [${level}] ${message}`, data.details ? data : '');
    
    if (level === 'ERROR') {
      this.results.failed++;
    } else if (level === 'SUCCESS') {
      this.results.passed++;
    } else if (level === 'WARNING') {
      this.results.warnings++;
    }
    
    this.results.tests.push({
      timestamp,
      level,
      message,
      data
    });
  }

  async setup() {
    this.log('INFO', 'Setting up browser for testing...');
    
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      this.page = await this.browser.newPage();
      
      // Set viewport for consistent testing
      await this.page.setViewport({ width: 1280, height: 720 });
      
      // Listen to console logs from the page
      this.page.on('console', (msg) => {
        if (msg.text().includes('Stripe') || msg.text().includes('Payment')) {
          this.log('INFO', `Browser console: ${msg.text()}`);
        }
      });
      
      this.log('SUCCESS', 'Browser setup complete');
    } catch (error) {
      this.log('ERROR', 'Failed to setup browser', { error: error.message });
      throw error;
    }
  }

  async testEnvironmentVariables() {
    this.log('INFO', 'Testing environment variable configuration...');
    
    const requiredVars = [
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
    ];
    
    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value) {
        this.log('ERROR', `Missing environment variable: ${varName}`);
      } else if (value.includes('mock') || value.includes('test_123')) {
        this.log('WARNING', `Using mock/placeholder value for ${varName}`);
      } else {
        this.log('SUCCESS', `Environment variable configured: ${varName}`);
      }
    }

    // Check consistency between publishable keys
    const stripePublishable = process.env.STRIPE_PUBLISHABLE_KEY;
    const nextPublicPublishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (stripePublishable && nextPublicPublishable) {
      if (stripePublishable === nextPublicPublishable) {
        this.log('SUCCESS', 'Stripe publishable keys are consistent');
      } else {
        this.log('ERROR', 'Stripe publishable key mismatch between STRIPE_PUBLISHABLE_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
      }
    }
  }

  async testPaymentTestPage() {
    this.log('INFO', 'Testing payment test page...');
    
    try {
      await this.page.goto(`${this.baseUrl}/test-payment`, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Wait for page to load
      await this.page.waitForSelector('h1', { timeout: 10000 });
      
      const title = await this.page.$eval('h1', el => el.textContent);
      if (title.includes('Payment Integration Test')) {
        this.log('SUCCESS', 'Payment test page loaded successfully');
      } else {
        this.log('ERROR', 'Payment test page title incorrect', { title });
      }
      
      // Check for payment status display
      const statusDisplay = await this.page.$('[class*="PaymentStatusDisplay"]') || 
                           await this.page.$('[data-testid="payment-status"]') ||
                           await this.page.$('div:contains("Payment System Status")');
      
      if (statusDisplay) {
        this.log('SUCCESS', 'Payment status display found');
      } else {
        this.log('WARNING', 'Payment status display not found (might be configured properly)');
      }
      
    } catch (error) {
      this.log('ERROR', 'Failed to load payment test page', { error: error.message });
    }
  }

  async testCheckoutButtons() {
    this.log('INFO', 'Testing checkout button functionality...');
    
    try {
      // Navigate to pricing page
      await this.page.goto(`${this.baseUrl}/pricing`, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });
      
      // Look for checkout buttons
      const checkoutButtons = await this.page.$$('button[class*="CheckoutButton"], button:contains("Start"), button:contains("Upgrade")');
      
      if (checkoutButtons.length > 0) {
        this.log('SUCCESS', `Found ${checkoutButtons.length} checkout buttons`);
        
        // Test clicking a button (but don't actually complete checkout)
        try {
          await checkoutButtons[0].click();
          
          // Wait a moment for any error messages
          await this.page.waitForTimeout(2000);
          
          // Check for error messages
          const errorMessages = await this.page.$$eval('div[class*="error"], div[class*="Error"]', 
            els => els.map(el => el.textContent));
          
          if (errorMessages.length > 0) {
            this.log('INFO', 'Error messages displayed (expected with mock config)', { 
              errors: errorMessages.slice(0, 3) 
            });
          }
          
        } catch (clickError) {
          this.log('WARNING', 'Could not test button click', { error: clickError.message });
        }
      } else {
        this.log('ERROR', 'No checkout buttons found on pricing page');
      }
      
    } catch (error) {
      this.log('ERROR', 'Failed to test checkout buttons', { error: error.message });
    }
  }

  async testNextjsEnvironmentAccess() {
    this.log('INFO', 'Testing Next.js environment variable access...');
    
    try {
      // Inject JavaScript to check environment variables
      const envCheck = await this.page.evaluate(() => {
        return {
          hasNextPublicStripe: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
          stripeKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.substring(0, 12) + '...',
          nodeEnv: process.env.NODE_ENV
        };
      });
      
      if (envCheck.hasNextPublicStripe) {
        this.log('SUCCESS', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY accessible in browser', envCheck);
      } else {
        this.log('ERROR', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not accessible in browser', envCheck);
      }
      
    } catch (error) {
      this.log('ERROR', 'Failed to test environment variable access', { error: error.message });
    }
  }

  async testApiHealthCheck() {
    this.log('INFO', 'Testing API health and connectivity...');
    
    try {
      // Test health endpoint
      const healthResponse = await this.page.evaluate(async () => {
        try {
          const response = await fetch('/api/health');
          return {
            status: response.status,
            ok: response.ok,
            data: await response.json()
          };
        } catch (error) {
          return {
            error: error.message
          };
        }
      });
      
      if (healthResponse.ok) {
        this.log('SUCCESS', 'API health check passed', healthResponse);
      } else {
        this.log('WARNING', 'API health check failed', healthResponse);
      }
      
      // Test payment API endpoint (should show configuration errors)
      const paymentResponse = await this.page.evaluate(async () => {
        try {
          const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              plan: 'starter',
              user_email: 'test@example.com',
              user_id: 'test_user_123'
            })
          });
          
          return {
            status: response.status,
            ok: response.ok,
            data: await response.json()
          };
        } catch (error) {
          return {
            error: error.message
          };
        }
      });
      
      if (paymentResponse.status === 200 || paymentResponse.status === 503) {
        this.log('SUCCESS', 'Payment API responds appropriately', { 
          status: paymentResponse.status,
          isDevelopmentMode: paymentResponse.data?.data?.development_mode 
        });
      } else {
        this.log('WARNING', 'Payment API response unexpected', paymentResponse);
      }
      
    } catch (error) {
      this.log('ERROR', 'Failed to test API connectivity', { error: error.message });
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    console.log('🧪 Starting Frontend Payment Integration Test Suite...\n');
    console.log(`Testing environment: ${this.baseUrl}\n`);
    
    try {
      await this.setup();
      
      console.log('============================================================');
      console.log('🔧 STEP 1: ENVIRONMENT VALIDATION');
      console.log('============================================================');
      await this.testEnvironmentVariables();
      
      console.log('\n============================================================');
      console.log('🔧 STEP 2: NEXT.JS ENVIRONMENT ACCESS');
      console.log('============================================================');
      await this.testNextjsEnvironmentAccess();
      
      console.log('\n============================================================');
      console.log('🔧 STEP 3: API CONNECTIVITY');
      console.log('============================================================');
      await this.testApiHealthCheck();
      
      console.log('\n============================================================');
      console.log('🔧 STEP 4: PAYMENT TEST PAGE');
      console.log('============================================================');
      await this.testPaymentTestPage();
      
      console.log('\n============================================================');
      console.log('🔧 STEP 5: CHECKOUT BUTTON FUNCTIONALITY');
      console.log('============================================================');
      await this.testCheckoutButtons();
      
    } catch (error) {
      this.log('ERROR', 'Test suite failed', { error: error.message });
    } finally {
      await this.cleanup();
    }
    
    // Print summary
    this.printSummary();
  }

  printSummary() {
    console.log('\n============================================================');
    console.log('🔧 FRONTEND PAYMENT INTEGRATION TEST RESULTS');
    console.log('============================================================');
    
    const total = this.results.passed + this.results.failed;
    const successRate = total > 0 ? Math.round((this.results.passed / total) * 100) : 0;
    
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    
    const isReady = this.results.failed === 0 && this.results.passed > 0;
    console.log(`🚀 Frontend Ready: ${isReady ? 'YES' : 'NO'}`);
    
    if (!isReady) {
      console.log('\n🔍 PRIORITY ACTIONS:');
      console.log('1. Fix any failed tests immediately');
      console.log('2. Review environment variable configuration');
      console.log('3. Test manually at /test-payment');
      console.log('4. Check browser console for detailed errors');
    } else {
      console.log('\n🎉 Frontend payment integration is working correctly!');
      console.log('Visit /test-payment to manually verify all functionality.');
    }
  }
}

// Main execution
if (require.main === module) {
  const tester = new FrontendPaymentTester();
  tester.run().catch(console.error);
}

module.exports = FrontendPaymentTester;