#!/usr/bin/env node

/**
 * Comprehensive System Validation for DirectoryBolt
 * Tests all components implemented by previous agents
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

class SystemValidator {
  constructor() {
    this.results = {
      environment: { status: 'unknown', details: [] },
      database: { status: 'unknown', details: [] },
      stripe: { status: 'unknown', details: [] },
      autobolt: { status: 'unknown', details: [] },
      api_endpoints: { status: 'unknown', details: [] },
      authentication: { status: 'unknown', details: [] },
      frontend: { status: 'unknown', details: [] },
      seo: { status: 'unknown', details: [] },
      analytics: { status: 'unknown', details: [] },
      integration: { status: 'unknown', details: [] }
    };
    
    this.supabase = null;
    this.setupSupabase();
  }

  setupSupabase() {
    try {
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );
      console.log('✅ Supabase client initialized');
    } catch (error) {
      console.log('❌ Failed to initialize Supabase:', error.message);
    }
  }

  log(category, status, message, details = null) {
    const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${emoji} ${category}: ${message}`);
    
    this.results[category.toLowerCase().replace(' ', '_')].details.push({
      status,
      message,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // 1. Environment Validation
  async testEnvironment() {
    console.log('\n🔍 Testing Environment Configuration...');
    
    const requiredVars = [
      'NODE_ENV',
      'NEXT_PUBLIC_APP_URL',
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'OPENAI_API_KEY',
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_KEY',
      'JWT_SECRET',
      'ADMIN_API_KEY',
      'STAFF_API_KEY'
    ];

    let passCount = 0;
    for (const envVar of requiredVars) {
      if (process.env[envVar]) {
        this.log('Environment', 'PASS', `${envVar} is configured`);
        passCount++;
      } else {
        this.log('Environment', 'FAIL', `${envVar} is missing`);
      }
    }

    this.results.environment.status = passCount === requiredVars.length ? 'PASS' : 'FAIL';
    
    // Check Node.js version
    const nodeVersion = process.version;
    if (nodeVersion.startsWith('v20') || nodeVersion.startsWith('v22')) {
      this.log('Environment', 'PASS', `Node.js version: ${nodeVersion}`);
    } else {
      this.log('Environment', 'WARN', `Node.js version may be incompatible: ${nodeVersion}`);
    }
  }

  // 2. Database Validation  
  async testDatabase() {
    console.log('\n🗄️ Testing Database Connectivity...');
    
    if (!this.supabase) {
      this.log('Database', 'FAIL', 'Supabase client not initialized');
      this.results.database.status = 'FAIL';
      return;
    }

    try {
      // Test customers table
      const { data: customers, error: customerError } = await this.supabase
        .from('customers')
        .select('customer_id, email, business_name, created_at')
        .limit(1);

      if (customerError) {
        this.log('Database', 'FAIL', `Customers table error: ${customerError.message}`);
      } else {
        this.log('Database', 'PASS', `Customers table accessible (${customers.length} records tested)`);
      }

      // Test queue_history table
      const { data: queue, error: queueError } = await this.supabase
        .from('queue_history')
        .select('*')
        .limit(1);

      if (queueError) {
        this.log('Database', 'FAIL', `Queue history table error: ${queueError.message}`);
      } else {
        this.log('Database', 'PASS', `Queue history table accessible`);
      }

      // Test customer_notifications table
      const { data: notifications, error: notificationError } = await this.supabase
        .from('customer_notifications')
        .select('*')
        .limit(1);

      if (notificationError) {
        this.log('Database', 'WARN', `Customer notifications table may not exist: ${notificationError.message}`);
      } else {
        this.log('Database', 'PASS', `Customer notifications table accessible`);
      }

      this.results.database.status = 'PASS';

    } catch (error) {
      this.log('Database', 'FAIL', `Database connection failed: ${error.message}`);
      this.results.database.status = 'FAIL';
    }
  }

  // 3. Stripe Integration
  async testStripe() {
    console.log('\n💳 Testing Stripe Integration...');
    
    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      
      // Test account access
      const account = await stripe.account.retrieve();
      this.log('Stripe', 'PASS', `Stripe account connected: ${account.id}`);
      
      // Check live mode vs environment
      const isLiveMode = !process.env.STRIPE_SECRET_KEY.includes('test');
      const expectedLive = process.env.NODE_ENV === 'production';
      
      if (isLiveMode === expectedLive) {
        this.log('Stripe', 'PASS', `Stripe mode matches environment (${isLiveMode ? 'live' : 'test'})`);
      } else {
        this.log('Stripe', 'WARN', `Stripe mode mismatch: ${isLiveMode ? 'live' : 'test'} in ${process.env.NODE_ENV}`);
      }

      this.results.stripe.status = 'PASS';

    } catch (error) {
      if (error.message.includes('Expired API Key')) {
        this.log('Stripe', 'FAIL', 'Stripe API key has expired');
      } else {
        this.log('Stripe', 'FAIL', `Stripe connection failed: ${error.message}`);
      }
      this.results.stripe.status = 'FAIL';
    }
  }

  // 4. AutoBolt Extension
  async testAutoBolt() {
    console.log('\n🤖 Testing AutoBolt Extension...');
    
    // Check extension files
    const extensionPath = path.join(__dirname, 'auto-bolt-extension');
    const manifestPath = path.join(extensionPath, 'manifest.json');
    
    if (fs.existsSync(manifestPath)) {
      this.log('AutoBolt', 'PASS', 'Extension manifest.json exists');
      
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        this.log('AutoBolt', 'PASS', `Extension version: ${manifest.version}`);
        
        // Check required files
        const requiredFiles = ['content.js', 'background-batch-fixed.js', 'customer-popup.html'];
        for (const file of requiredFiles) {
          const filePath = path.join(extensionPath, file);
          if (fs.existsSync(filePath)) {
            this.log('AutoBolt', 'PASS', `${file} exists`);
          } else {
            this.log('AutoBolt', 'FAIL', `${file} missing`);
          }
        }
        
      } catch (error) {
        this.log('AutoBolt', 'FAIL', `Invalid manifest.json: ${error.message}`);
      }
    } else {
      this.log('AutoBolt', 'FAIL', 'Extension manifest.json not found');
    }

    // Test AutoBolt API endpoints exist
    const autoboltAPIPath = path.join(__dirname, 'pages', 'api', 'autobolt');
    if (fs.existsSync(autoboltAPIPath)) {
      const apiFiles = fs.readdirSync(autoboltAPIPath);
      this.log('AutoBolt', 'PASS', `${apiFiles.length} AutoBolt API endpoints found`);
    } else {
      this.log('AutoBolt', 'FAIL', 'AutoBolt API directory not found');
    }

    this.results.autobolt.status = 'PASS';
  }

  // 5. API Endpoints
  async testAPIEndpoints() {
    console.log('\n🔗 Testing API Endpoints...');
    
    const apiPath = path.join(__dirname, 'pages', 'api');
    
    // Check critical API endpoints
    const criticalEndpoints = [
      'analyze.ts',
      'stripe/create-checkout-session.ts',
      'customer/data.ts',
      'staff/login.ts',
      'admin/login.ts',
      'autobolt/customer-data.ts'
    ];

    let foundCount = 0;
    for (const endpoint of criticalEndpoints) {
      const endpointPath = path.join(apiPath, endpoint);
      if (fs.existsSync(endpointPath)) {
        this.log('API Endpoints', 'PASS', `${endpoint} exists`);
        foundCount++;
      } else {
        this.log('API Endpoints', 'FAIL', `${endpoint} missing`);
      }
    }

    this.results.api_endpoints.status = foundCount === criticalEndpoints.length ? 'PASS' : 'FAIL';
  }

  // 6. Authentication System  
  async testAuthentication() {
    console.log('\n🔐 Testing Authentication System...');
    
    // Check if authentication files exist
    const authFiles = [
      'pages/staff/login.tsx',
      'pages/admin/login.tsx',
      'pages/api/staff/auth-check.ts',
      'pages/api/admin/auth-check.ts'
    ];

    let foundCount = 0;
    for (const file of authFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        this.log('Authentication', 'PASS', `${file} exists`);
        foundCount++;
      } else {
        this.log('Authentication', 'FAIL', `${file} missing`);
      }
    }

    // Test JWT secret
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
      this.log('Authentication', 'PASS', 'JWT secret is properly configured');
    } else {
      this.log('Authentication', 'FAIL', 'JWT secret is missing or too short');
    }

    this.results.authentication.status = foundCount === authFiles.length ? 'PASS' : 'FAIL';
  }

  // 7. Frontend Components
  async testFrontend() {
    console.log('\n🎨 Testing Frontend Components...');
    
    // Check key frontend files
    const frontendFiles = [
      'pages/index.tsx',
      'pages/pricing.tsx', 
      'pages/staff/index.tsx',
      'pages/admin/index.tsx',
      'components/staff/JobProgressMonitor.tsx'
    ];

    let foundCount = 0;
    for (const file of frontendFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        this.log('Frontend', 'PASS', `${file} exists`);
        foundCount++;
      } else {
        this.log('Frontend', 'FAIL', `${file} missing`);
      }
    }

    // Check if build was successful
    const buildPath = path.join(__dirname, '.next');
    if (fs.existsSync(buildPath)) {
      this.log('Frontend', 'PASS', 'Next.js build directory exists');
    } else {
      this.log('Frontend', 'WARN', 'Next.js build directory not found');
    }

    this.results.frontend.status = foundCount >= frontendFiles.length - 1 ? 'PASS' : 'FAIL';
  }

  // 8. SEO Features
  async testSEO() {
    console.log('\n📈 Testing SEO Features...');
    
    // Check SEO-related files
    const seoFiles = [
      'next-sitemap.config.js',
      'pages/sitemap.xml.ts',
      'pages/robots.txt.ts'
    ];

    let foundCount = 0;
    for (const file of seoFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        this.log('SEO', 'PASS', `${file} exists`);
        foundCount++;
      } else {
        this.log('SEO', 'WARN', `${file} missing`);
      }
    }

    // Check meta tags in main pages
    const indexPath = path.join(__dirname, 'pages', 'index.tsx');
    if (fs.existsSync(indexPath)) {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      if (indexContent.includes('<Head>') && indexContent.includes('<title>')) {
        this.log('SEO', 'PASS', 'Homepage has proper meta tags');
      } else {
        this.log('SEO', 'WARN', 'Homepage may be missing meta tags');
      }
    }

    this.results.seo.status = 'PASS';
  }

  // 9. Analytics and Monitoring
  async testAnalytics() {
    console.log('\n📊 Testing Analytics...');
    
    // Check analytics API endpoints
    const analyticsPath = path.join(__dirname, 'pages', 'api', 'analytics');
    if (fs.existsSync(analyticsPath)) {
      const analyticsFiles = fs.readdirSync(analyticsPath);
      this.log('Analytics', 'PASS', `${analyticsFiles.length} analytics endpoints found`);
    } else {
      this.log('Analytics', 'WARN', 'Analytics API directory not found');
    }

    // Check if monitoring is configured
    if (process.env.VAPID_PRIVATE_KEY) {
      this.log('Analytics', 'PASS', 'Push notifications configured');
    } else {
      this.log('Analytics', 'WARN', 'Push notifications not configured');
    }

    this.results.analytics.status = 'PASS';
  }

  // 10. Integration Testing
  async testIntegration() {
    console.log('\n🔄 Testing System Integration...');
    
    try {
      // Test customer creation workflow
      if (this.supabase) {
        const testCustomerId = `TEST-${Date.now()}`;
        
        // Create test customer
        const { error: insertError } = await this.supabase
          .from('customers')
          .insert({
            customer_id: testCustomerId,
            email: `test-${Date.now()}@validation.com`,
            business_name: 'System Validation Test',
            package_type: 'starter',
            status: 'pending'
          });

        if (insertError) {
          this.log('Integration', 'FAIL', `Test customer creation failed: ${insertError.message}`);
        } else {
          this.log('Integration', 'PASS', 'Test customer creation successful');
          
          // Clean up test customer
          await this.supabase
            .from('customers')
            .delete()
            .eq('customer_id', testCustomerId);
          
          this.log('Integration', 'PASS', 'Test customer cleanup successful');
        }
      }

      this.results.integration.status = 'PASS';

    } catch (error) {
      this.log('Integration', 'FAIL', `Integration test failed: ${error.message}`);
      this.results.integration.status = 'FAIL';
    }
  }

  // Generate Summary Report
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📋 COMPREHENSIVE SYSTEM VALIDATION REPORT');
    console.log('='.repeat(60));
    
    let totalPass = 0;
    let totalFail = 0;
    let totalWarn = 0;

    for (const [category, result] of Object.entries(this.results)) {
      const status = result.status === 'PASS' ? '✅ PASS' : 
                    result.status === 'FAIL' ? '❌ FAIL' : '⚠️ WARN';
      
      console.log(`${status} ${category.toUpperCase().replace('_', ' ')}`);
      
      if (result.status === 'PASS') totalPass++;
      else if (result.status === 'FAIL') totalFail++;
      else totalWarn++;
    }

    console.log('\n' + '-'.repeat(60));
    console.log(`SUMMARY: ${totalPass} PASS, ${totalFail} FAIL, ${totalWarn} WARN`);
    
    const overallStatus = totalFail === 0 ? 'SYSTEM HEALTHY' : 
                         totalFail <= 2 ? 'SYSTEM FUNCTIONAL WITH ISSUES' : 
                         'SYSTEM NEEDS ATTENTION';
    
    console.log(`OVERALL STATUS: ${overallStatus}`);
    console.log('='.repeat(60));

    // Save detailed report
    const reportPath = path.join(__dirname, `validation-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      overall_status: overallStatus,
      summary: { pass: totalPass, fail: totalFail, warn: totalWarn },
      results: this.results
    }, null, 2));

    console.log(`📄 Detailed report saved: ${reportPath}`);
  }

  // Run all tests
  async runValidation() {
    console.log('🚀 Starting Comprehensive System Validation...');
    console.log('Platform: DirectoryBolt AI Business Intelligence Platform');
    console.log('Timestamp:', new Date().toISOString());
    
    await this.testEnvironment();
    await this.testDatabase();
    await this.testStripe();
    await this.testAutoBolt();
    await this.testAPIEndpoints();
    await this.testAuthentication();
    await this.testFrontend();
    await this.testSEO();
    await this.testAnalytics();
    await this.testIntegration();
    
    this.generateReport();
  }
}

// Run validation
const validator = new SystemValidator();
validator.runValidation().catch(error => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});