// 🔍 STRIPE ENVIRONMENT VALIDATOR - Comprehensive validation of Stripe configuration
// This script validates all Stripe-related environment variables and configuration

// Load environment variables
require('dotenv').config({ path: ['.env.local', '.env.production', '.env'] });

const fs = require('fs');
const path = require('path');

class StripeEnvironmentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
    this.results = {
      valid: false,
      score: 0,
      maxScore: 10,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
  }

  log(level, category, message, data = null) {
    const entry = {
      level,
      category,
      message,
      data,
      timestamp: new Date().toISOString()
    };

    switch (level) {
      case 'ERROR':
        this.errors.push(entry);
        console.error(`❌ [${category}] ${message}`, data || '');
        break;
      case 'WARNING':
        this.warnings.push(entry);
        console.warn(`⚠️  [${category}] ${message}`, data || '');
        break;
      case 'INFO':
        this.info.push(entry);
        console.log(`ℹ️  [${category}] ${message}`, data || '');
        break;
      case 'SUCCESS':
        this.info.push(entry);
        console.log(`✅ [${category}] ${message}`, data || '');
        this.results.score++;
        break;
    }
  }

  async validateEnvironmentFiles() {
    this.log('INFO', 'ENV_FILES', 'Checking environment files...');

    const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
    const foundFiles = [];

    for (const file of envFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath)) {
        foundFiles.push(file);
        this.log('SUCCESS', 'ENV_FILES', `Found environment file: ${file}`);
      }
    }

    if (foundFiles.length === 0) {
      this.log('ERROR', 'ENV_FILES', 'No environment files found', {
        expected: envFiles,
        current_directory: process.cwd()
      });
    }

    return foundFiles;
  }

  validateStripeSecretKey() {
    this.log('INFO', 'SECRET_KEY', 'Validating STRIPE_SECRET_KEY...');

    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      this.log('ERROR', 'SECRET_KEY', 'STRIPE_SECRET_KEY is not set');
      return false;
    }

    if (secretKey === 'sk_test_mock_key_for_testing') {
      this.log('WARNING', 'SECRET_KEY', 'Using mock secret key - API calls will fail');
      return false;
    }

    // Check key format
    if (!secretKey.startsWith('sk_')) {
      this.log('ERROR', 'SECRET_KEY', 'STRIPE_SECRET_KEY does not start with "sk_"', {
        current_prefix: secretKey.substring(0, 10) + '...'
      });
      return false;
    }

    // Determine if test or live key
    const isTestKey = secretKey.startsWith('sk_test_');
    const isLiveKey = secretKey.startsWith('sk_live_');

    if (!isTestKey && !isLiveKey) {
      this.log('ERROR', 'SECRET_KEY', 'STRIPE_SECRET_KEY has invalid format', {
        expected_formats: ['sk_test_...', 'sk_live_...'],
        current_format: secretKey.substring(0, 8) + '...'
      });
      return false;
    }

    this.log('SUCCESS', 'SECRET_KEY', `Valid Stripe secret key found: ${isLiveKey ? 'LIVE' : 'TEST'} mode`, {
      key_type: isLiveKey ? 'live' : 'test',
      key_length: secretKey.length
    });

    return true;
  }

  validateStripePublishableKey() {
    this.log('INFO', 'PUBLISHABLE_KEY', 'Validating STRIPE_PUBLISHABLE_KEY...');

    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

    if (!publishableKey) {
      this.log('ERROR', 'PUBLISHABLE_KEY', 'STRIPE_PUBLISHABLE_KEY is not set');
      return false;
    }

    // Check key format
    if (!publishableKey.startsWith('pk_')) {
      this.log('ERROR', 'PUBLISHABLE_KEY', 'STRIPE_PUBLISHABLE_KEY does not start with "pk_"', {
        current_prefix: publishableKey.substring(0, 10) + '...'
      });
      return false;
    }

    // Determine if test or live key
    const isTestKey = publishableKey.startsWith('pk_test_');
    const isLiveKey = publishableKey.startsWith('pk_live_');

    if (!isTestKey && !isLiveKey) {
      this.log('ERROR', 'PUBLISHABLE_KEY', 'STRIPE_PUBLISHABLE_KEY has invalid format', {
        expected_formats: ['pk_test_...', 'pk_live_...'],
        current_format: publishableKey.substring(0, 8) + '...'
      });
      return false;
    }

    this.log('SUCCESS', 'PUBLISHABLE_KEY', `Valid Stripe publishable key found: ${isLiveKey ? 'LIVE' : 'TEST'} mode`, {
      key_type: isLiveKey ? 'live' : 'test',
      key_length: publishableKey.length
    });

    return isLiveKey ? 'live' : 'test';
  }

  validateKeyConsistency() {
    this.log('INFO', 'KEY_CONSISTENCY', 'Validating key consistency...');

    const secretKey = process.env.STRIPE_SECRET_KEY;
    const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;

    if (!secretKey || !publishableKey) {
      this.log('ERROR', 'KEY_CONSISTENCY', 'Cannot validate consistency - keys missing');
      return false;
    }

    const secretIsLive = secretKey.startsWith('sk_live_');
    const publishableIsLive = publishableKey.startsWith('pk_live_');

    if (secretIsLive !== publishableIsLive) {
      this.log('ERROR', 'KEY_CONSISTENCY', 'Key type mismatch - secret and publishable keys are from different modes', {
        secret_key_type: secretIsLive ? 'live' : 'test',
        publishable_key_type: publishableIsLive ? 'live' : 'test'
      });
      return false;
    }

    this.log('SUCCESS', 'KEY_CONSISTENCY', `Keys are consistent: both are ${secretIsLive ? 'LIVE' : 'TEST'} keys`);
    return true;
  }

  validateStripePriceIds() {
    this.log('INFO', 'PRICE_IDS', 'Validating Stripe price IDs...');

    const priceIdVars = [
      'STRIPE_STARTER_PRICE_ID',
      'STRIPE_GROWTH_PRICE_ID',
      'STRIPE_PROFESSIONAL_PRICE_ID',
      'STRIPE_ENTERPRISE_PRICE_ID'
    ];

    const planNames = ['starter', 'growth', 'professional', 'enterprise'];
    let validPriceIds = 0;

    for (let i = 0; i < priceIdVars.length; i++) {
      const envVar = priceIdVars[i];
      const planName = planNames[i];
      const priceId = process.env[envVar];

      if (!priceId) {
        this.log('ERROR', 'PRICE_IDS', `${envVar} is not set for ${planName} plan`);
        continue;
      }

      if (priceId.startsWith('price_') && priceId.includes('_test_')) {
        this.log('WARNING', 'PRICE_IDS', `${envVar} appears to be a mock/test value`, {
          plan: planName,
          price_id: priceId
        });
        continue;
      }

      if (!priceId.startsWith('price_')) {
        this.log('ERROR', 'PRICE_IDS', `${envVar} does not start with "price_"`, {
          plan: planName,
          current_value: priceId.substring(0, 20) + '...'
        });
        continue;
      }

      this.log('SUCCESS', 'PRICE_IDS', `Valid price ID for ${planName} plan`, {
        plan: planName,
        price_id_length: priceId.length
      });
      validPriceIds++;
    }

    return validPriceIds === 4;
  }

  validateWebhookConfiguration() {
    this.log('INFO', 'WEBHOOKS', 'Validating webhook configuration...');

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      this.log('WARNING', 'WEBHOOKS', 'STRIPE_WEBHOOK_SECRET is not set - webhooks may not work');
      return false;
    }

    if (!webhookSecret.startsWith('whsec_')) {
      this.log('ERROR', 'WEBHOOKS', 'STRIPE_WEBHOOK_SECRET does not start with "whsec_"', {
        current_prefix: webhookSecret.substring(0, 10) + '...'
      });
      return false;
    }

    this.log('SUCCESS', 'WEBHOOKS', 'Valid webhook secret found');
    return true;
  }

  validateNextAuthConfiguration() {
    this.log('INFO', 'NEXTAUTH', 'Validating NextAuth configuration...');

    const nextAuthUrl = process.env.NEXTAUTH_URL;

    if (!nextAuthUrl) {
      this.log('ERROR', 'NEXTAUTH', 'NEXTAUTH_URL is not set - required for Stripe redirects');
      return false;
    }

    try {
      const url = new URL(nextAuthUrl);
      this.log('SUCCESS', 'NEXTAUTH', `Valid NEXTAUTH_URL found: ${url.origin}`);
      return true;
    } catch (error) {
      this.log('ERROR', 'NEXTAUTH', 'NEXTAUTH_URL is not a valid URL', {
        current_value: nextAuthUrl,
        error: error.message
      });
      return false;
    }
  }

  async testStripeConnection() {
    this.log('INFO', 'CONNECTION', 'Testing Stripe API connection...');

    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey || secretKey === 'sk_test_mock_key_for_testing') {
      this.log('WARNING', 'CONNECTION', 'Cannot test connection - invalid or mock secret key');
      return false;
    }

    try {
      const Stripe = require('stripe');
      const stripe = new Stripe(secretKey, { apiVersion: '2023-08-16' });

      // Test API connection by listing customers (limit 1)
      const result = await stripe.customers.list({ limit: 1 });
      
      this.log('SUCCESS', 'CONNECTION', 'Stripe API connection successful', {
        object: result.object,
        has_data: result.data.length > 0
      });
      return true;
    } catch (error) {
      this.log('ERROR', 'CONNECTION', 'Stripe API connection failed', {
        error_code: error.code,
        error_type: error.type,
        error_message: error.message
      });
      return false;
    }
  }

  async validateStripePricesExist() {
    this.log('INFO', 'PRICE_VALIDATION', 'Validating Stripe prices exist...');

    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey || secretKey === 'sk_test_mock_key_for_testing') {
      this.log('WARNING', 'PRICE_VALIDATION', 'Cannot validate prices - invalid or mock secret key');
      return false;
    }

    const priceIds = [
      process.env.STRIPE_STARTER_PRICE_ID,
      process.env.STRIPE_GROWTH_PRICE_ID,
      process.env.STRIPE_PROFESSIONAL_PRICE_ID,
      process.env.STRIPE_ENTERPRISE_PRICE_ID
    ];

    const planNames = ['starter', 'growth', 'professional', 'enterprise'];

    try {
      const Stripe = require('stripe');
      const stripe = new Stripe(secretKey, { apiVersion: '2023-08-16' });

      let validPrices = 0;

      for (let i = 0; i < priceIds.length; i++) {
        const priceId = priceIds[i];
        const planName = planNames[i];

        if (!priceId || priceId.includes('_test_')) {
          this.log('WARNING', 'PRICE_VALIDATION', `Skipping ${planName} - mock/missing price ID`);
          continue;
        }

        try {
          const price = await stripe.prices.retrieve(priceId);
          
          if (price.active) {
            this.log('SUCCESS', 'PRICE_VALIDATION', `${planName} plan price is active`, {
              price_id: priceId,
              amount: price.unit_amount,
              currency: price.currency,
              interval: price.recurring?.interval
            });
            validPrices++;
          } else {
            this.log('ERROR', 'PRICE_VALIDATION', `${planName} plan price is inactive`, {
              price_id: priceId
            });
          }
        } catch (priceError) {
          this.log('ERROR', 'PRICE_VALIDATION', `${planName} plan price not found`, {
            price_id: priceId,
            error: priceError.message
          });
        }
      }

      return validPrices > 0;
    } catch (error) {
      this.log('ERROR', 'PRICE_VALIDATION', 'Failed to validate prices', {
        error: error.message
      });
      return false;
    }
  }

  generateReport() {
    const report = {
      ...this.results,
      summary: {
        total_checks: this.results.maxScore,
        passed_checks: this.results.score,
        success_rate: Math.round((this.results.score / this.results.maxScore) * 100),
        readiness_score: `${this.results.score}/${this.results.maxScore}`,
        launch_ready: this.results.score >= 8
      },
      issues: {
        errors: this.errors.length,
        warnings: this.warnings.length,
        info: this.info.length
      },
      details: {
        errors: this.errors,
        warnings: this.warnings,
        info: this.info
      },
      recommendations: this.generateRecommendations()
    };

    this.results.valid = this.results.score >= 8;
    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.errors.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'ERRORS',
        message: 'Fix all error-level issues before deploying to production',
        actions: this.errors.map(e => `Fix ${e.category}: ${e.message}`)
      });
    }

    if (this.warnings.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'WARNINGS',
        message: 'Address warning-level issues for optimal functionality',
        actions: this.warnings.map(w => `Review ${w.category}: ${w.message}`)
      });
    }

    if (this.results.score < 8) {
      recommendations.push({
        priority: 'HIGH',
        category: 'READINESS',
        message: 'System is not ready for production deployment',
        actions: ['Complete environment variable configuration', 'Test all Stripe integrations', 'Verify webhook setup']
      });
    }

    return recommendations;
  }

  async runValidation() {
    console.log('🔍 Starting Stripe Environment Validation...\n');

    // Run all validations
    await this.validateEnvironmentFiles();
    this.validateStripeSecretKey();
    this.validateStripePublishableKey();
    this.validateKeyConsistency();
    this.validateStripePriceIds();
    this.validateWebhookConfiguration();
    this.validateNextAuthConfiguration();
    await this.testStripeConnection();
    await this.validateStripePricesExist();

    // Generate and save report
    const report = this.generateReport();
    
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${report.summary.passed_checks}/${report.summary.total_checks} checks`);
    console.log(`📈 Success Rate: ${report.summary.success_rate}%`);
    console.log(`🚀 Launch Ready: ${report.summary.launch_ready ? 'YES' : 'NO'}`);
    console.log(`❌ Errors: ${report.issues.errors}`);
    console.log(`⚠️  Warnings: ${report.issues.warnings}`);

    // Save detailed report
    const reportPath = path.join(process.cwd(), 'stripe-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    return report;
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new StripeEnvironmentValidator();
  validator.runValidation()
    .then(report => {
      process.exit(report.summary.launch_ready ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

module.exports = StripeEnvironmentValidator;