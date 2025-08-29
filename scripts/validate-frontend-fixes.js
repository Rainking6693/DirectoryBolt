#!/usr/bin/env node
// Validate Frontend Payment Integration Fixes

require('dotenv').config({ path: ['.env.local', '.env.production', '.env'] });
const fs = require('fs');
const path = require('path');

class FrontendFixValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: []
    };
  }

  log(level, message, details = {}) {
    const prefix = {
      'INFO': '📝',
      'SUCCESS': '✅',
      'ERROR': '❌', 
      'WARNING': '⚠️'
    }[level] || '📝';
    
    console.log(`${prefix} [${level}] ${message}`);
    
    if (details.details) {
      console.log(`   ${JSON.stringify(details.details, null, 2)}`);
    }
    
    if (level === 'ERROR') {
      this.results.failed++;
    } else if (level === 'SUCCESS') {
      this.results.passed++;
    } else if (level === 'WARNING') {
      this.results.warnings++;
    }
    
    this.results.tests.push({ level, message, details });
  }

  checkFileExists(filePath, description) {
    const fullPath = path.resolve(filePath);
    if (fs.existsSync(fullPath)) {
      this.log('SUCCESS', `${description}: ${filePath}`);
      return true;
    } else {
      this.log('ERROR', `Missing file: ${description} (${filePath})`);
      return false;
    }
  }

  validateEnvironmentVariables() {
    this.log('INFO', 'Validating environment variable configuration...');
    
    // Check for required environment variables
    const requiredVars = [
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY', 
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
    ];
    
    const missingVars = [];
    const mockVars = [];
    
    for (const varName of requiredVars) {
      const value = process.env[varName];
      if (!value) {
        missingVars.push(varName);
      } else if (value.includes('mock') || value.includes('test_123') || value.includes('your_key_here')) {
        mockVars.push(varName);
      } else {
        this.log('SUCCESS', `Environment variable set: ${varName}`);
      }
    }
    
    if (missingVars.length > 0) {
      this.log('ERROR', `Missing environment variables: ${missingVars.join(', ')}`);
    }
    
    if (mockVars.length > 0) {
      this.log('WARNING', `Using mock/placeholder values: ${mockVars.join(', ')}`);
    }
    
    // Check consistency between publishable keys
    const stripePublishable = process.env.STRIPE_PUBLISHABLE_KEY;
    const nextPublicPublishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (stripePublishable && nextPublicPublishable) {
      if (stripePublishable === nextPublicPublishable) {
        this.log('SUCCESS', 'Stripe publishable keys are consistent');
      } else {
        this.log('ERROR', 'Publishable key mismatch between STRIPE_PUBLISHABLE_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY');
      }
    }
  }

  validateNextConfig() {
    this.log('INFO', 'Validating Next.js configuration...');
    
    const nextConfigPath = path.resolve('next.config.js');
    if (!fs.existsSync(nextConfigPath)) {
      this.log('ERROR', 'Missing next.config.js file');
      return;
    }
    
    const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
    
    if (nextConfigContent.includes('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')) {
      this.log('SUCCESS', 'Next.js config exposes Stripe publishable key');
    } else {
      this.log('ERROR', 'Next.js config missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY exposure');
    }
  }

  validateNewFiles() {
    this.log('INFO', 'Validating new files created...');
    
    const newFiles = [
      'lib/utils/stripe-client-config.ts',
      'components/ui/PaymentStatusDisplay.tsx', 
      'lib/hooks/useStripeConfig.ts',
      'pages/test-payment.tsx',
      'scripts/test-frontend-payment-integration.js'
    ];
    
    for (const file of newFiles) {
      this.checkFileExists(file, 'New frontend file');
    }
  }

  validateCheckoutButtonUpdates() {
    this.log('INFO', 'Validating CheckoutButton component updates...');
    
    const checkoutButtonPath = path.resolve('components/CheckoutButton.jsx');
    if (!fs.existsSync(checkoutButtonPath)) {
      this.log('ERROR', 'CheckoutButton.jsx not found');
      return;
    }
    
    const content = fs.readFileSync(checkoutButtonPath, 'utf8');
    
    const expectedImports = [
      'PaymentStatusDisplay',
      'getStripeClientConfig',
      'isStripeConfigured',
      'getStripeConfigurationMessage'
    ];
    
    for (const importName of expectedImports) {
      if (content.includes(importName)) {
        this.log('SUCCESS', `CheckoutButton imports ${importName}`);
      } else {
        this.log('ERROR', `CheckoutButton missing import: ${importName}`);
      }
    }
    
    if (content.includes('stripeConfigured') && content.includes('configurationStatus')) {
      this.log('SUCCESS', 'CheckoutButton has configuration state management');
    } else {
      this.log('ERROR', 'CheckoutButton missing configuration state management');
    }
  }

  validateEnvironmentFiles() {
    this.log('INFO', 'Validating environment files...');
    
    const envFiles = ['.env.local', '.env.example'];
    
    for (const envFile of envFiles) {
      if (this.checkFileExists(envFile, 'Environment file')) {
        const content = fs.readFileSync(envFile, 'utf8');
        if (content.includes('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY')) {
          this.log('SUCCESS', `${envFile} contains NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`);
        } else {
          this.log('ERROR', `${envFile} missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`);
        }
      }
    }
  }

  validateTypeScriptFiles() {
    this.log('INFO', 'Validating TypeScript files...');
    
    const tsFiles = [
      'lib/utils/stripe-client-config.ts',
      'lib/hooks/useStripeConfig.ts'
    ];
    
    for (const tsFile of tsFiles) {
      if (fs.existsSync(tsFile)) {
        const content = fs.readFileSync(tsFile, 'utf8');
        
        // Check for proper TypeScript interfaces
        if (content.includes('interface') || content.includes('export function')) {
          this.log('SUCCESS', `${tsFile} has proper TypeScript definitions`);
        } else {
          this.log('WARNING', `${tsFile} may be missing TypeScript definitions`);
        }
      }
    }
  }

  run() {
    console.log('🔍 Frontend Payment Integration Fix Validator');
    console.log('==============================================\n');
    
    this.validateEnvironmentVariables();
    console.log('');
    
    this.validateEnvironmentFiles();
    console.log('');
    
    this.validateNextConfig();
    console.log('');
    
    this.validateNewFiles();
    console.log('');
    
    this.validateCheckoutButtonUpdates();
    console.log('');
    
    this.validateTypeScriptFiles();
    console.log('');
    
    this.printSummary();
  }

  printSummary() {
    console.log('==============================================');
    console.log('📊 VALIDATION SUMMARY');
    console.log('==============================================');
    
    const total = this.results.passed + this.results.failed;
    const successRate = total > 0 ? Math.round((this.results.passed / total) * 100) : 0;
    
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    
    const isReady = this.results.failed === 0;
    console.log(`🚀 Ready for Testing: ${isReady ? 'YES' : 'NO'}\n`);
    
    if (isReady) {
      console.log('✅ All frontend fixes are in place!');
      console.log('');
      console.log('Next Steps:');
      console.log('1. Start development server: npm run dev');
      console.log('2. Visit http://localhost:3000/test-payment');
      console.log('3. Test payment buttons and error handling');
      console.log('4. Replace mock Stripe keys with real keys when ready');
    } else {
      console.log('❌ Some fixes are missing or incomplete.');
      console.log('');
      console.log('Priority Actions:');
      console.log('1. Fix any failed validations above');
      console.log('2. Ensure all new files are created');
      console.log('3. Verify environment variable configuration');
      console.log('4. Check Next.js configuration updates');
    }
  }
}

// Run validation
if (require.main === module) {
  const validator = new FrontendFixValidator();
  validator.run();
}

module.exports = FrontendFixValidator;