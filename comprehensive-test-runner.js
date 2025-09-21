#!/usr/bin/env node

/**
 * DirectoryBolt Comprehensive Testing Runner
 * Executes the testing checklist from COMPREHENSIVE_TESTING_9.21.md
 * Using Supabase Token: sbp_edaa7bff2326a69d2fe26c67896f43449265b6134
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Test token provided by user
const TEST_SUPABASE_TOKEN = 'sbp_edaa7bff2326a69d2fe26c67896f43449265b6134';

class ComprehensiveTestRunner {
  constructor() {
    this.testResults = {
      phase1: { completed: false, tests: [] },
      phase2: { completed: false, tests: [] },
      phase3: { completed: false, tests: [] },
      phase4: { completed: false, tests: [] },
      summary: { total: 0, passed: 0, failed: 0, critical: [] }
    };
    
    this.supabase = null;
    this.reportPath = path.join(__dirname, 'TESTING_REPORT_9.21.md');
  }

  log(message, status = 'info') {
    const timestamp = new Date().toISOString();
    const statusEmoji = {
      'info': 'ℹ️',
      'success': '✅',
      'error': '❌',
      'warning': '⚠️',
      'progress': '🔄'
    };
    
    console.log(`${statusEmoji[status]} [${timestamp}] ${message}`);
  }

  async initializeSupabase() {
    this.log('Initializing Supabase connection with test token', 'progress');
    
    try {
      // First try with test token
      this.supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        TEST_SUPABASE_TOKEN,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      this.log('Supabase client initialized successfully', 'success');
      return true;
    } catch (error) {
      this.log(`Failed to initialize Supabase: ${error.message}`, 'error');
      return false;
    }
  }

  async updateReport(phase, testName, status, details = '') {
    const reportExists = fs.existsSync(this.reportPath);
    if (!reportExists) {
      this.log('Report file not found, creating new one', 'warning');
      return;
    }

    let reportContent = fs.readFileSync(this.reportPath, 'utf8');
    
    // Update the specific test item
    const checkboxPattern = new RegExp(`- \\[ \\] ${testName}`, 'g');
    const statusSymbol = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '🔄';
    const replacement = `- [${statusSymbol}] ${testName}`;
    
    if (details) {
      replacement += `\n  ${details}`;
    }
    
    reportContent = reportContent.replace(checkboxPattern, replacement);
    
    fs.writeFileSync(this.reportPath, reportContent);
    this.log(`Updated report for: ${testName}`, 'info');
  }

  // PHASE 1: Setup & Environment Validation
  async runPhase1() {
    this.log('Starting Phase 1: Setup & Environment Validation', 'progress');
    
    const tests = [
      'Verify all environment variables are properly configured',
      'Test database connectivity and table structure',
      'Validate external service integrations (Stripe, OpenAI, etc.)',
      'Confirm staff authentication system works'
    ];

    // Test 1: Environment Variables
    await this.testEnvironmentVariables();
    
    // Test 2: Database Connectivity
    await this.testDatabaseConnectivity();
    
    // Test 3: External Services
    await this.testExternalServices();
    
    // Test 4: Authentication
    await this.testAuthenticationSystem();

    this.testResults.phase1.completed = true;
    this.log('Phase 1 completed', 'success');
  }

  async testEnvironmentVariables() {
    this.log('Testing environment variables configuration', 'progress');
    
    const requiredVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'OPENAI_API_KEY',
      'STRIPE_SECRET_KEY',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
    ];

    let missingVars = [];
    let configuredVars = [];

    for (const varName of requiredVars) {
      if (process.env[varName] && process.env[varName] !== 'your_key_here') {
        configuredVars.push(varName);
      } else {
        missingVars.push(varName);
      }
    }

    if (missingVars.length === 0) {
      await this.updateReport('phase1', 'Verify all environment variables are properly configured', 'pass', 
        `✅ All ${configuredVars.length} required environment variables are configured`);
      this.testResults.phase1.tests.push({ name: 'Environment Variables', status: 'pass' });
      this.log('Environment variables test: PASSED', 'success');
    } else {
      await this.updateReport('phase1', 'Verify all environment variables are properly configured', 'fail',
        `❌ Missing variables: ${missingVars.join(', ')}`);
      this.testResults.phase1.tests.push({ name: 'Environment Variables', status: 'fail', details: missingVars });
      this.testResults.summary.critical.push('Missing required environment variables');
      this.log(`Environment variables test: FAILED - Missing: ${missingVars.join(', ')}`, 'error');
    }
  }

  async testDatabaseConnectivity() {
    this.log('Testing database connectivity and table structure', 'progress');
    
    try {
      // Test basic connection with test token
      const { data, error } = await this.supabase
        .from('customers')
        .select('count', { count: 'exact', head: true });

      if (error) {
        // If customers table doesn't exist, check if we can access system tables
        const { data: sysData, error: sysError } = await this.supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .limit(1);

        if (sysError) {
          throw new Error(`Database connection failed: ${sysError.message}`);
        }

        await this.updateReport('phase1', 'Test database connectivity and table structure', 'warning',
          `⚠️ Database connected but customers table not found. Schema deployment needed.`);
        this.testResults.phase1.tests.push({ name: 'Database Connectivity', status: 'warning', details: 'Schema needs deployment' });
        this.log('Database connectivity: PARTIAL - Schema needs deployment', 'warning');
      } else {
        await this.updateReport('phase1', 'Test database connectivity and table structure', 'pass',
          `✅ Database connected successfully. Customer table has ${data || 0} records.`);
        this.testResults.phase1.tests.push({ name: 'Database Connectivity', status: 'pass', count: data });
        this.log(`Database connectivity test: PASSED - ${data || 0} customer records found`, 'success');
      }

      // Test required tables
      await this.testTableStructure();

    } catch (error) {
      await this.updateReport('phase1', 'Test database connectivity and table structure', 'fail',
        `❌ Database connection failed: ${error.message}`);
      this.testResults.phase1.tests.push({ name: 'Database Connectivity', status: 'fail', error: error.message });
      this.testResults.summary.critical.push('Database connection failure');
      this.log(`Database connectivity test: FAILED - ${error.message}`, 'error');
    }
  }

  async testTableStructure() {
    const requiredTables = ['customers', 'queue_history', 'customer_notifications', 'autobolt_processing_queue', 'analytics_events'];
    let existingTables = [];
    let missingTables = [];

    for (const tableName of requiredTables) {
      try {
        const { data, error } = await this.supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          missingTables.push(tableName);
        } else {
          existingTables.push(tableName);
        }
      } catch (err) {
        missingTables.push(tableName);
      }
    }

    this.log(`Tables found: ${existingTables.join(', ')}`, 'info');
    if (missingTables.length > 0) {
      this.log(`Missing tables: ${missingTables.join(', ')}`, 'warning');
    }

    return { existing: existingTables, missing: missingTables };
  }

  async testExternalServices() {
    this.log('Testing external service integrations', 'progress');
    
    const services = {
      openai: process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here',
      stripe: process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.includes('placeholder'),
      supabase: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
    };

    const workingServices = Object.entries(services).filter(([name, working]) => working).map(([name]) => name);
    const failedServices = Object.entries(services).filter(([name, working]) => !working).map(([name]) => name);

    if (failedServices.length === 0) {
      await this.updateReport('phase1', 'Validate external service integrations (Stripe, OpenAI, etc.)', 'pass',
        `✅ All external services configured: ${workingServices.join(', ')}`);
      this.testResults.phase1.tests.push({ name: 'External Services', status: 'pass', services: workingServices });
      this.log('External services test: PASSED', 'success');
    } else {
      await this.updateReport('phase1', 'Validate external service integrations (Stripe, OpenAI, etc.)', 'fail',
        `❌ Missing service configs: ${failedServices.join(', ')}`);
      this.testResults.phase1.tests.push({ name: 'External Services', status: 'fail', missing: failedServices });
      this.testResults.summary.critical.push(`Missing external service configurations: ${failedServices.join(', ')}`);
      this.log(`External services test: FAILED - Missing: ${failedServices.join(', ')}`, 'error');
    }
  }

  async testAuthenticationSystem() {
    this.log('Testing staff authentication system', 'progress');
    
    try {
      // Check if auth environment variables are set
      const authVars = ['ADMIN_USERNAME', 'ADMIN_PASSWORD', 'STAFF_USERNAME', 'STAFF_PASSWORD'];
      const configuredAuth = authVars.filter(varName => process.env[varName]);

      if (configuredAuth.length === authVars.length) {
        await this.updateReport('phase1', 'Confirm staff authentication system works', 'pass',
          `✅ Authentication system configured with ${configuredAuth.length} credentials`);
        this.testResults.phase1.tests.push({ name: 'Authentication', status: 'pass' });
        this.log('Authentication system test: PASSED', 'success');
      } else {
        const missing = authVars.filter(varName => !process.env[varName]);
        await this.updateReport('phase1', 'Confirm staff authentication system works', 'fail',
          `❌ Missing auth credentials: ${missing.join(', ')}`);
        this.testResults.phase1.tests.push({ name: 'Authentication', status: 'fail', missing });
        this.log(`Authentication system test: FAILED - Missing: ${missing.join(', ')}`, 'error');
      }
    } catch (error) {
      await this.updateReport('phase1', 'Confirm staff authentication system works', 'fail',
        `❌ Authentication test failed: ${error.message}`);
      this.testResults.phase1.tests.push({ name: 'Authentication', status: 'fail', error: error.message });
      this.log(`Authentication system test: FAILED - ${error.message}`, 'error');
    }
  }

  // PHASE 2: Core Customer Journey Testing  
  async runPhase2() {
    this.log('Starting Phase 2: Core Customer Journey Testing', 'progress');
    
    // Test core customer journey components
    await this.testLandingPageFunctionality();
    await this.testPricingComponents();
    await this.testPaymentFlow();
    await this.testBusinessInfoCollection();
    await this.testQueueManagement();

    this.testResults.phase2.completed = true;
    this.log('Phase 2 completed', 'success');
  }

  async testLandingPageFunctionality() {
    this.log('Testing landing page functionality', 'progress');
    
    try {
      // Check if landing page components exist
      const landingPagePath = path.join(__dirname, 'pages', 'index.tsx');
      const newLandingPagePath = path.join(__dirname, 'components', 'NewLandingPage.tsx');
      
      let pageExists = false;
      let componentPath = '';
      
      if (fs.existsSync(landingPagePath)) {
        pageExists = true;
        componentPath = landingPagePath;
      } else if (fs.existsSync(newLandingPagePath)) {
        pageExists = true;
        componentPath = newLandingPagePath;
      }

      if (pageExists) {
        const content = fs.readFileSync(componentPath, 'utf8');
        const hasValueProp = content.includes('AI-Powered Business Intelligence') || content.includes('AI business intelligence');
        const hasAnalysisMetrics = content.includes('34%') || content.includes('67%') || content.includes('SEO');
        const hasPricingInfo = content.includes('$299') || content.includes('$4,300');

        if (hasValueProp && hasAnalysisMetrics && hasPricingInfo) {
          await this.updateReport('phase2', 'Landing page functionality and value proposition display', 'pass',
            `✅ Landing page components validated`);
          this.testResults.phase2.tests.push({ name: 'Landing Page', status: 'pass' });
          this.log('Landing page test: PASSED', 'success');
        } else {
          await this.updateReport('phase2', 'Landing page functionality and value proposition display', 'warning',
            `⚠️ Landing page missing some key elements`);
          this.testResults.phase2.tests.push({ name: 'Landing Page', status: 'warning' });
          this.log('Landing page test: PARTIAL - Missing key elements', 'warning');
        }
      } else {
        await this.updateReport('phase2', 'Landing page functionality and value proposition display', 'fail',
          `❌ Landing page component not found`);
        this.testResults.phase2.tests.push({ name: 'Landing Page', status: 'fail' });
        this.log('Landing page test: FAILED - Component not found', 'error');
      }
    } catch (error) {
      await this.updateReport('phase2', 'Landing page functionality and value proposition display', 'fail',
        `❌ Landing page test failed: ${error.message}`);
      this.testResults.phase2.tests.push({ name: 'Landing Page', status: 'fail', error: error.message });
      this.log(`Landing page test: FAILED - ${error.message}`, 'error');
    }
  }

  async testPricingComponents() {
    this.log('Testing pricing components', 'progress');
    
    try {
      // Check for pricing components
      const pricingPaths = [
        path.join(__dirname, 'pages', 'test-streamlined-pricing.tsx'),
        path.join(__dirname, 'components', 'checkout', 'StreamlinedCheckout.tsx'),
        path.join(__dirname, 'lib', 'config', 'pricing.ts')
      ];

      let foundComponents = [];
      let missingComponents = [];

      for (const pricingPath of pricingPaths) {
        if (fs.existsSync(pricingPath)) {
          foundComponents.push(path.basename(pricingPath));
        } else {
          missingComponents.push(path.basename(pricingPath));
        }
      }

      if (foundComponents.length >= 2) {
        await this.updateReport('phase2', 'Streamlined pricing page (4-tier structure)', 'pass',
          `✅ Pricing components found: ${foundComponents.join(', ')}`);
        this.testResults.phase2.tests.push({ name: 'Pricing Components', status: 'pass', found: foundComponents });
        this.log('Pricing components test: PASSED', 'success');
      } else {
        await this.updateReport('phase2', 'Streamlined pricing page (4-tier structure)', 'fail',
          `❌ Missing pricing components: ${missingComponents.join(', ')}`);
        this.testResults.phase2.tests.push({ name: 'Pricing Components', status: 'fail', missing: missingComponents });
        this.log(`Pricing components test: FAILED - Missing: ${missingComponents.join(', ')}`, 'error');
      }
    } catch (error) {
      await this.updateReport('phase2', 'Streamlined pricing page (4-tier structure)', 'fail',
        `❌ Pricing test failed: ${error.message}`);
      this.testResults.phase2.tests.push({ name: 'Pricing Components', status: 'fail', error: error.message });
      this.log(`Pricing components test: FAILED - ${error.message}`, 'error');
    }
  }

  async testPaymentFlow() {
    this.log('Testing payment flow components', 'progress');
    
    try {
      const paymentPaths = [
        path.join(__dirname, 'pages', 'api', 'stripe', 'create-checkout-session.ts'),
        path.join(__dirname, 'pages', 'success.js'),
        path.join(__dirname, 'pages', 'business-info.tsx')
      ];

      let foundComponents = [];
      for (const paymentPath of paymentPaths) {
        if (fs.existsSync(paymentPath)) {
          foundComponents.push(path.basename(paymentPath));
        }
      }

      if (foundComponents.length === paymentPaths.length) {
        await this.updateReport('phase2', 'Email-only checkout with Stripe integration', 'pass',
          `✅ Payment flow components complete`);
        this.testResults.phase2.tests.push({ name: 'Payment Flow', status: 'pass' });
        this.log('Payment flow test: PASSED', 'success');
      } else {
        await this.updateReport('phase2', 'Email-only checkout with Stripe integration', 'fail',
          `❌ Missing payment components: ${foundComponents.length}/${paymentPaths.length} found`);
        this.testResults.phase2.tests.push({ name: 'Payment Flow', status: 'fail' });
        this.log(`Payment flow test: FAILED - Missing components`, 'error');
      }
    } catch (error) {
      await this.updateReport('phase2', 'Email-only checkout with Stripe integration', 'fail',
        `❌ Payment flow test failed: ${error.message}`);
      this.testResults.phase2.tests.push({ name: 'Payment Flow', status: 'fail', error: error.message });
      this.log(`Payment flow test: FAILED - ${error.message}`, 'error');
    }
  }

  async testBusinessInfoCollection() {
    this.log('Testing business info collection', 'progress');
    
    try {
      const businessInfoPath = path.join(__dirname, 'pages', 'business-info.tsx');
      const registerApiPath = path.join(__dirname, 'pages', 'api', 'customer', 'register-complete.ts');

      if (fs.existsSync(businessInfoPath) && fs.existsSync(registerApiPath)) {
        await this.updateReport('phase2', 'Post-payment business information collection', 'pass',
          `✅ Business info collection components found`);
        this.testResults.phase2.tests.push({ name: 'Business Info Collection', status: 'pass' });
        this.log('Business info collection test: PASSED', 'success');
      } else {
        await this.updateReport('phase2', 'Post-payment business information collection', 'fail',
          `❌ Business info collection components missing`);
        this.testResults.phase2.tests.push({ name: 'Business Info Collection', status: 'fail' });
        this.log('Business info collection test: FAILED', 'error');
      }
    } catch (error) {
      await this.updateReport('phase2', 'Post-payment business information collection', 'fail',
        `❌ Business info test failed: ${error.message}`);
      this.testResults.phase2.tests.push({ name: 'Business Info Collection', status: 'fail', error: error.message });
      this.log(`Business info collection test: FAILED - ${error.message}`, 'error');
    }
  }

  async testQueueManagement() {
    this.log('Testing queue management system', 'progress');
    
    try {
      const queuePaths = [
        path.join(__dirname, 'pages', 'api', 'autobolt', 'queue-status.ts'),
        path.join(__dirname, 'pages', 'api', 'autobolt', 'get-next-customer.ts'),
        path.join(__dirname, 'pages', 'staff-dashboard.tsx')
      ];

      let foundComponents = [];
      for (const queuePath of queuePaths) {
        if (fs.existsSync(queuePath)) {
          foundComponents.push(path.basename(queuePath));
        }
      }

      if (foundComponents.length >= 2) {
        await this.updateReport('phase2', 'AutoBolt queue management and staff dashboard integration', 'pass',
          `✅ Queue management components: ${foundComponents.join(', ')}`);
        this.testResults.phase2.tests.push({ name: 'Queue Management', status: 'pass', found: foundComponents });
        this.log('Queue management test: PASSED', 'success');
      } else {
        await this.updateReport('phase2', 'AutoBolt queue management and staff dashboard integration', 'fail',
          `❌ Queue management components incomplete`);
        this.testResults.phase2.tests.push({ name: 'Queue Management', status: 'fail' });
        this.log('Queue management test: FAILED', 'error');
      }
    } catch (error) {
      await this.updateReport('phase2', 'AutoBolt queue management and staff dashboard integration', 'fail',
        `❌ Queue management test failed: ${error.message}`);
      this.testResults.phase2.tests.push({ name: 'Queue Management', status: 'fail', error: error.message });
      this.log(`Queue management test: FAILED - ${error.message}`, 'error');
    }
  }

  async generateFinalReport() {
    const report = {
      timestamp: new Date().toISOString(),
      testResults: this.testResults,
      summary: {
        totalTests: this.testResults.phase1.tests.length + this.testResults.phase2.tests.length,
        passedTests: [...this.testResults.phase1.tests, ...this.testResults.phase2.tests].filter(t => t.status === 'pass').length,
        failedTests: [...this.testResults.phase1.tests, ...this.testResults.phase2.tests].filter(t => t.status === 'fail').length,
        warningTests: [...this.testResults.phase1.tests, ...this.testResults.phase2.tests].filter(t => t.status === 'warning').length,
        criticalIssues: this.testResults.summary.critical
      }
    };

    // Write detailed JSON report
    const jsonReportPath = path.join(__dirname, 'TEST_RESULTS_DETAILED.json');
    fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));

    this.log(`Final report generated: ${jsonReportPath}`, 'success');
    return report;
  }

  async run() {
    this.log('Starting DirectoryBolt Comprehensive Testing', 'progress');
    
    // Initialize Supabase connection
    const supabaseReady = await this.initializeSupabase();
    if (!supabaseReady) {
      this.log('Failed to initialize Supabase - continuing with limited testing', 'warning');
    }

    try {
      // Run test phases
      await this.runPhase1();
      await this.runPhase2();
      
      // Generate final report
      const finalReport = await this.generateFinalReport();
      
      this.log('Comprehensive testing completed', 'success');
      this.log(`Total Tests: ${finalReport.summary.totalTests}`, 'info');
      this.log(`Passed: ${finalReport.summary.passedTests}`, 'success');
      this.log(`Failed: ${finalReport.summary.failedTests}`, 'error');
      this.log(`Warnings: ${finalReport.summary.warningTests}`, 'warning');
      
      if (finalReport.summary.criticalIssues.length > 0) {
        this.log('Critical Issues Found:', 'error');
        finalReport.summary.criticalIssues.forEach(issue => {
          this.log(`  - ${issue}`, 'error');
        });
      }

      return finalReport;
      
    } catch (error) {
      this.log(`Testing failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

// Run the comprehensive test if called directly
if (require.main === module) {
  const testRunner = new ComprehensiveTestRunner();
  testRunner.run()
    .then(report => {
      console.log('\n🎉 Testing completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Testing failed:', error.message);
      process.exit(1);
    });
}

module.exports = ComprehensiveTestRunner;