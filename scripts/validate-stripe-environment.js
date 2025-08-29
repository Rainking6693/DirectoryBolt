#!/usr/bin/env node

// 🔍 STRIPE ENVIRONMENT VALIDATION SCRIPT
// Validates Stripe environment configuration before deployment

// Since we're using TypeScript, let's implement the validation directly
// This avoids module compilation issues during validation

function validateStripeEnvironment() {
  const errors = [];
  const warnings = [];

  // Required environment variables
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'STRIPE_STARTER_PRICE_ID',
    'STRIPE_GROWTH_PRICE_ID',
    'STRIPE_PROFESSIONAL_PRICE_ID', 
    'STRIPE_ENTERPRISE_PRICE_ID',
    'NEXTAUTH_URL'
  ];

  // Check for missing required variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }

  // If basic variables are missing, return early
  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const nextAuthUrl = process.env.NEXTAUTH_URL;

  // Validate Stripe Secret Key format
  if (!secretKey.startsWith('sk_')) {
    errors.push('STRIPE_SECRET_KEY must start with "sk_"');
  } else {
    const isLive = secretKey.startsWith('sk_live_');
    const isTest = secretKey.startsWith('sk_test_');
    
    if (!isLive && !isTest) {
      errors.push('STRIPE_SECRET_KEY must be either a live key (sk_live_) or test key (sk_test_)');
    }

    // Check for mock/placeholder keys
    if (secretKey.includes('mock') || secretKey.includes('test_123') || secretKey.includes('your_key_here')) {
      errors.push('STRIPE_SECRET_KEY appears to be a placeholder/mock value. Please use a real Stripe key.');
    }

    // Warn about test keys in production
    if (isTest && process.env.NODE_ENV === 'production') {
      warnings.push('Using test Stripe key in production environment');
    }
  }

  // Validate publishable key if provided
  if (publishableKey) {
    if (!publishableKey.startsWith('pk_')) {
      errors.push('STRIPE_PUBLISHABLE_KEY must start with "pk_"');
    } else {
      const secretIsLive = secretKey.startsWith('sk_live_');
      const publishableIsLive = publishableKey.startsWith('pk_live_');
      
      if (secretIsLive !== publishableIsLive) {
        errors.push('Stripe secret key and publishable key must both be live keys or both be test keys');
      }
    }
  }

  // Validate price IDs
  const priceIds = {
    starter: process.env.STRIPE_STARTER_PRICE_ID,
    growth: process.env.STRIPE_GROWTH_PRICE_ID,
    professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID,
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID
  };

  for (const [plan, priceId] of Object.entries(priceIds)) {
    if (!priceId.startsWith('price_')) {
      errors.push(`${plan.toUpperCase()}_PRICE_ID must start with "price_"`);
    }

    // Check for mock/placeholder price IDs
    if (priceId.includes('test_123') || priceId.includes('mock') || priceId.includes('replace_with_actual')) {
      errors.push(`${plan.toUpperCase()}_PRICE_ID appears to be a placeholder value: ${priceId}`);
    }
  }

  // Validate NextAuth URL
  try {
    new URL(nextAuthUrl);
  } catch {
    errors.push('NEXTAUTH_URL must be a valid URL');
  }

  // Warn about missing webhook secret
  if (!webhookSecret) {
    warnings.push('STRIPE_WEBHOOK_SECRET is not set - webhook signature verification will be disabled');
  } else if (!webhookSecret.startsWith('whsec_')) {
    warnings.push('STRIPE_WEBHOOK_SECRET should start with "whsec_"');
  }

  // Check for localhost in production
  if (process.env.NODE_ENV === 'production' && nextAuthUrl.includes('localhost')) {
    errors.push('NEXTAUTH_URL cannot be localhost in production environment');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config: {
      secretKey,
      publishableKey,
      webhookSecret,
      priceIds,
      nextAuthUrl
    }
  };
}

function logStripeEnvironmentStatus() {
  const result = validateStripeEnvironment();
  
  console.log('🔍 Stripe Environment Validation Status:');
  console.log(`  ✅ Valid: ${result.isValid}`);
  console.log(`  ❌ Errors: ${result.errors.length}`);
  console.log(`  ⚠️  Warnings: ${result.warnings.length}`);
  
  if (result.errors.length > 0) {
    console.log('  Errors:');
    result.errors.forEach(error => console.log(`    ❌ ${error}`));
  }
  
  if (result.warnings.length > 0) {
    console.log('  Warnings:');
    result.warnings.forEach(warning => console.log(`    ⚠️  ${warning}`));
  }

  if (result.isValid && result.config) {
    console.log('  Configuration:');
    console.log(`    Secret Key: ${result.config.secretKey.substring(0, 10)}...`);
    console.log(`    Publishable Key: ${result.config.publishableKey ? result.config.publishableKey.substring(0, 10) + '...' : 'Not set'}`);
    console.log(`    Webhook Secret: ${result.config.webhookSecret ? 'Set' : 'Not set'}`);
    console.log(`    NextAuth URL: ${result.config.nextAuthUrl}`);
    console.log(`    Price IDs configured: ${Object.keys(result.config.priceIds).length}`);
  }
}

async function main() {
  console.log('🔍 STRIPE ENVIRONMENT VALIDATION');
  console.log('================================\n');

  try {
    // Load environment variables
    if (process.env.NODE_ENV !== 'production') {
      require('dotenv').config({ path: ['.env.local', '.env.production', '.env'] });
    }

    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Node Version: ${process.version}`);
    console.log('');

    // Run validation
    logStripeEnvironmentStatus();
    
    const result = validateStripeEnvironment();
    
    if (result.isValid) {
      console.log('\n✅ VALIDATION PASSED');
      console.log('All Stripe environment variables are properly configured.');
      
      if (result.warnings.length > 0) {
        console.log('\n⚠️  WARNINGS:');
        result.warnings.forEach(warning => console.log(`  - ${warning}`));
      }
      
      console.log('\n🚀 Ready for deployment!');
      process.exit(0);
    } else {
      console.log('\n❌ VALIDATION FAILED');
      console.log('The following issues must be resolved:');
      console.log('');
      
      result.errors.forEach(error => console.log(`  ❌ ${error}`));
      
      if (result.warnings.length > 0) {
        console.log('\nWarnings:');
        result.warnings.forEach(warning => console.log(`  ⚠️  ${warning}`));
      }
      
      console.log('\n📚 NEXT STEPS:');
      console.log('1. Check your environment variables in .env.local');
      console.log('2. Verify Stripe keys are real (not mock values)');
      console.log('3. Ensure all required price IDs are set');
      console.log('4. Run this script again to verify fixes');
      console.log('\nSee .env.example for the correct format.');
      
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ VALIDATION SCRIPT ERROR:');
    console.error(error.message);
    console.error('\nThis indicates a critical configuration issue that prevents the application from starting.');
    process.exit(1);
  }
}

// Handle unhandled errors gracefully
process.on('uncaughtException', (error) => {
  console.error('❌ UNCAUGHT EXCEPTION:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ UNHANDLED REJECTION:', error);
  process.exit(1);
});

// Run the validation
main().catch((error) => {
  console.error('❌ SCRIPT FAILED:', error);
  process.exit(1);
});