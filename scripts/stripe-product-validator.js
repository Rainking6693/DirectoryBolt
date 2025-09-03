// 🏷️ STRIPE PRODUCT VALIDATOR - Validates Stripe products, prices, and configuration
// This script checks that all products and prices exist in Stripe and are properly configured

// Load environment variables
require('dotenv').config({ path: ['.env.local', '.env.production', '.env'] });

const fs = require('fs');
const path = require('path');

class StripeProductValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      valid: false,
      score: 0,
      maxScore: 20,
      products: {},
      prices: {},
      issues: [],
      recommendations: []
    };

    // Expected product configuration
    this.expectedPlans = {
      starter: {
        name: 'Starter',
        expectedPrice: 4900, // $49/month in cents
        directoryLimit: 25,
        priceIdEnv: 'STRIPE_STARTER_PRICE_ID'
      },
      growth: {
        name: 'Growth',
        expectedPrice: 7900, // $79/month in cents
        directoryLimit: 50,
        priceIdEnv: 'STRIPE_GROWTH_PRICE_ID'
      },
      professional: {
        name: 'Professional',
        expectedPrice: 12900, // $129/month in cents
        directoryLimit: 100,
        priceIdEnv: 'STRIPE_PROFESSIONAL_PRICE_ID'
      },
      enterprise: {
        name: 'Enterprise',
        expectedPrice: 29900, // $299/month in cents
        directoryLimit: 500,
        priceIdEnv: 'STRIPE_ENTERPRISE_PRICE_ID'
      }
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
        this.results.issues.push({ ...entry, severity: 'error' });
        console.error(`❌ [${category}] ${message}`, data || '');
        break;
      case 'WARNING':
        this.results.issues.push({ ...entry, severity: 'warning' });
        console.warn(`⚠️  [${category}] ${message}`, data || '');
        break;
      case 'INFO':
        console.log(`ℹ️  [${category}] ${message}`, data || '');
        break;
      case 'SUCCESS':
        console.log(`✅ [${category}] ${message}`, data || '');
        this.results.score++;
        break;
    }
  }

  async initializeStripe() {
    this.log('INFO', 'INIT', 'Initializing Stripe connection...');

    const secretKey = process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      this.log('ERROR', 'INIT', 'STRIPE_SECRET_KEY environment variable not set');
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    if (secretKey === 'sk_test_mock_key_for_testing' || secretKey.includes('mock')) {
      this.log('WARNING', 'INIT', 'Using mock Stripe key - cannot validate real products');
      return null;
    }

    try {
      const Stripe = require('stripe');
      this.stripe = new Stripe(secretKey, { 
        apiVersion: '2023-08-16',
        timeout: 10000 
      });

      // Test connection
      await this.stripe.customers.list({ limit: 1 });
      this.log('SUCCESS', 'INIT', 'Stripe connection established');
      return this.stripe;
    } catch (error) {
      this.log('ERROR', 'INIT', 'Failed to initialize Stripe', {
        error: error.message,
        code: error.code,
        type: error.type
      });
      throw error;
    }
  }

  async validateProductExists(productId) {
    if (!this.stripe) {
      this.log('WARNING', 'PRODUCT', `Cannot validate product ${productId} - no Stripe connection`);
      return null;
    }

    try {
      const product = await this.stripe.products.retrieve(productId);
      
      this.log('SUCCESS', 'PRODUCT', `Product found: ${product.name}`, {
        id: product.id,
        name: product.name,
        active: product.active,
        created: new Date(product.created * 1000).toISOString(),
        description: product.description
      });

      return product;
    } catch (error) {
      this.log('ERROR', 'PRODUCT', `Product not found: ${productId}`, {
        error: error.message,
        code: error.code,
        type: error.type
      });
      return null;
    }
  }

  async validatePriceExists(priceId, expectedConfig) {
    if (!this.stripe) {
      this.log('WARNING', 'PRICE', `Cannot validate price ${priceId} - no Stripe connection`);
      return null;
    }

    if (!priceId) {
      this.log('ERROR', 'PRICE', `Price ID not configured for ${expectedConfig.name} plan`, {
        env_var: expectedConfig.priceIdEnv,
        expected_price: expectedConfig.expectedPrice
      });
      return null;
    }

    if (priceId.includes('_test_') || priceId.includes('mock')) {
      this.log('WARNING', 'PRICE', `Mock price ID detected: ${priceId}`, {
        plan: expectedConfig.name
      });
      return null;
    }

    try {
      const price = await this.stripe.prices.retrieve(priceId, {
        expand: ['product']
      });

      // Validate price configuration
      const issues = [];
      
      if (!price.active) {
        issues.push('Price is inactive');
      }

      if (price.unit_amount !== expectedConfig.expectedPrice) {
        issues.push(`Price mismatch: expected ${expectedConfig.expectedPrice}, got ${price.unit_amount}`);
      }

      if (price.currency !== 'usd') {
        issues.push(`Currency mismatch: expected USD, got ${price.currency}`);
      }

      if (price.recurring?.interval !== 'month') {
        issues.push(`Interval mismatch: expected monthly, got ${price.recurring?.interval}`);
      }

      if (issues.length > 0) {
        this.log('ERROR', 'PRICE', `Price configuration issues for ${expectedConfig.name}`, {
          price_id: priceId,
          issues: issues,
          actual_config: {
            amount: price.unit_amount,
            currency: price.currency,
            interval: price.recurring?.interval,
            active: price.active
          },
          expected_config: expectedConfig
        });
      } else {
        this.log('SUCCESS', 'PRICE', `Price correctly configured: ${expectedConfig.name}`, {
          price_id: priceId,
          amount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval,
          product_name: price.product?.name
        });
      }

      return price;
    } catch (error) {
      this.log('ERROR', 'PRICE', `Price not found: ${priceId}`, {
        plan: expectedConfig.name,
        error: error.message,
        code: error.code,
        type: error.type
      });
      return null;
    }
  }

  async listAllProducts() {
    if (!this.stripe) {
      this.log('WARNING', 'LIST', 'Cannot list products - no Stripe connection');
      return [];
    }

    try {
      this.log('INFO', 'LIST', 'Retrieving all Stripe products...');
      
      const products = await this.stripe.products.list({
        limit: 100,
        active: true
      });

      this.log('SUCCESS', 'LIST', `Found ${products.data.length} active products`);

      // Log each product for reference
      products.data.forEach(product => {
        this.log('INFO', 'LIST', `Product: ${product.name}`, {
          id: product.id,
          created: new Date(product.created * 1000).toISOString(),
          description: product.description,
          metadata: product.metadata
        });
      });

      return products.data;
    } catch (error) {
      this.log('ERROR', 'LIST', 'Failed to list products', {
        error: error.message
      });
      return [];
    }
  }

  async listAllPrices() {
    if (!this.stripe) {
      this.log('WARNING', 'LIST', 'Cannot list prices - no Stripe connection');
      return [];
    }

    try {
      this.log('INFO', 'LIST', 'Retrieving all Stripe prices...');
      
      const prices = await this.stripe.prices.list({
        limit: 100,
        active: true,
        expand: ['data.product']
      });

      this.log('SUCCESS', 'LIST', `Found ${prices.data.length} active prices`);

      // Group prices by product
      const pricesByProduct = {};
      prices.data.forEach(price => {
        const productName = price.product?.name || price.product;
        if (!pricesByProduct[productName]) {
          pricesByProduct[productName] = [];
        }
        pricesByProduct[productName].push({
          id: price.id,
          amount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval,
          created: new Date(price.created * 1000).toISOString()
        });
      });

      this.log('INFO', 'LIST', 'Prices by product:', pricesByProduct);
      return prices.data;
    } catch (error) {
      this.log('ERROR', 'LIST', 'Failed to list prices', {
        error: error.message
      });
      return [];
    }
  }

  async validateAllPlans() {
    this.log('INFO', 'PLANS', 'Validating all subscription plans...');

    for (const [planKey, planConfig] of Object.entries(this.expectedPlans)) {
      const priceId = process.env[planConfig.priceIdEnv];
      
      this.log('INFO', 'PLANS', `Validating ${planConfig.name} plan`, {
        plan_key: planKey,
        env_var: planConfig.priceIdEnv,
        price_id: priceId || 'NOT_SET',
        expected_amount: planConfig.expectedPrice
      });

      const price = await this.validatePriceExists(priceId, planConfig);
      
      this.results.prices[planKey] = {
        configured: !!priceId,
        valid: !!price,
        price_id: priceId,
        config: planConfig,
        stripe_data: price ? {
          amount: price.unit_amount,
          currency: price.currency,
          interval: price.recurring?.interval,
          product_name: price.product?.name
        } : null
      };
    }
  }

  async createMissingProducts() {
    if (!this.stripe) {
      this.log('WARNING', 'CREATE', 'Cannot create products - no Stripe connection');
      return;
    }

    this.log('INFO', 'CREATE', 'Checking if products need to be created...');

    for (const [planKey, planConfig] of Object.entries(this.expectedPlans)) {
      const priceId = process.env[planConfig.priceIdEnv];
      
      if (!priceId || priceId.includes('test') || priceId.includes('mock')) {
        this.log('INFO', 'CREATE', `Would create product for ${planConfig.name} plan`, {
          suggested_name: planConfig.name,
          suggested_price: planConfig.expectedPrice,
          suggested_description: `${planConfig.name} plan with ${planConfig.directoryLimit} directory submissions per month`
        });
      }
    }
  }

  generateReport() {
    const errorIssues = this.results.issues.filter(i => i.severity === 'error');
    const warningIssues = this.results.issues.filter(i => i.severity === 'warning');

    const report = {
      ...this.results,
      summary: {
        total_checks: this.results.maxScore,
        passed_checks: this.results.score,
        success_rate: Math.round((this.results.score / this.results.maxScore) * 100),
        errors: errorIssues.length,
        warnings: warningIssues.length,
        stripe_connection: !!this.stripe,
        all_prices_configured: Object.values(this.results.prices).every(p => p.configured && p.valid)
      },
      plan_status: Object.entries(this.results.prices).map(([plan, data]) => ({
        plan,
        configured: data.configured,
        valid: data.valid,
        price_id: data.price_id,
        issues: !data.valid ? ['Price not found or invalid'] : []
      })),
      recommendations: this.generateRecommendations()
    };

    this.results.valid = report.summary.success_rate >= 80;
    return report;
  }

  generateRecommendations() {
    const recommendations = [];

    // Check for unconfigured plans
    const unconfiguredPlans = Object.entries(this.results.prices)
      .filter(([_, data]) => !data.configured)
      .map(([plan, _]) => plan);

    if (unconfiguredPlans.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'CONFIGURATION',
        message: 'Some plans are not configured with price IDs',
        actions: unconfiguredPlans.map(plan => 
          `Set ${this.expectedPlans[plan].priceIdEnv} environment variable`
        )
      });
    }

    // Check for invalid prices
    const invalidPlans = Object.entries(this.results.prices)
      .filter(([_, data]) => data.configured && !data.valid)
      .map(([plan, _]) => plan);

    if (invalidPlans.length > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        category: 'STRIPE_SETUP',
        message: 'Some price IDs are invalid or not found in Stripe',
        actions: [
          'Verify price IDs exist in Stripe dashboard',
          'Check that prices are active',
          'Ensure price configuration matches expected values'
        ]
      });
    }

    if (!this.stripe) {
      recommendations.push({
        priority: 'HIGH',
        category: 'STRIPE_CONNECTION',
        message: 'Cannot connect to Stripe API',
        actions: [
          'Verify STRIPE_SECRET_KEY is set correctly',
          'Check API key permissions',
          'Ensure API key is not revoked'
        ]
      });
    }

    return recommendations;
  }

  async runValidation() {
    console.log('🏷️  Starting Stripe Product Validation...\n');

    try {
      // Initialize Stripe connection
      await this.initializeStripe();

      // List existing products and prices for reference
      await this.listAllProducts();
      await this.listAllPrices();

      // Validate all expected plans
      await this.validateAllPlans();

      // Check if products need to be created
      await this.createMissingProducts();

      // Generate and return report
      const report = this.generateReport();

      console.log('\n📊 VALIDATION SUMMARY');
      console.log('='.repeat(50));
      console.log(`✅ Passed: ${report.summary.passed_checks}/${report.summary.total_checks} checks`);
      console.log(`📈 Success Rate: ${report.summary.success_rate}%`);
      console.log(`🔗 Stripe Connected: ${report.summary.stripe_connection ? 'YES' : 'NO'}`);
      console.log(`💳 All Prices Valid: ${report.summary.all_prices_configured ? 'YES' : 'NO'}`);
      console.log(`❌ Errors: ${report.summary.errors}`);
      console.log(`⚠️  Warnings: ${report.summary.warnings}`);

      if (report.recommendations.length > 0) {
        console.log('\n🔍 RECOMMENDATIONS:');
        report.recommendations.forEach((rec, index) => {
          console.log(`${index + 1}. [${rec.priority}] ${rec.message}`);
          rec.actions.forEach(action => console.log(`   - ${action}`));
        });
      }

      // Save detailed report
      const reportPath = path.join(process.cwd(), 'stripe-product-validation-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);

      return report;
    } catch (error) {
      console.error('Product validation failed:', error);
      throw error;
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new StripeProductValidator();
  validator.runValidation()
    .then(report => {
      process.exit(report.summary.success_rate >= 80 ? 0 : 1);
    })
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}

module.exports = StripeProductValidator;