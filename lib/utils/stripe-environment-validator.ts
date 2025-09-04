// 🔒 STRIPE ENVIRONMENT VALIDATOR - Comprehensive validation system
// Validates Stripe configuration with fail-fast error handling

export interface StripeEnvironmentConfig {
  secretKey: string;
  publishableKey?: string;
  webhookSecret?: string;
  priceIds: {
    starter: string;
    growth: string;
    professional: string;
    enterprise: string;
  };
  nextAuthUrl: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config?: StripeEnvironmentConfig;
}

/**
 * Comprehensive Stripe environment validation
 * Validates all required environment variables and their formats
 */
export function validateStripeEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

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
    return {
      isValid: false,
      errors,
      warnings
    };
  }

  const secretKey = process.env.STRIPE_SECRET_KEY!;
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const nextAuthUrl = process.env.NEXTAUTH_URL!;

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
    starter: process.env.STRIPE_STARTER_PRICE_ID!,
    growth: process.env.STRIPE_GROWTH_PRICE_ID!,
    professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID!,
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID!
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

  const config: StripeEnvironmentConfig = {
    secretKey,
    publishableKey,
    webhookSecret,
    priceIds,
    nextAuthUrl
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config
  };
}

/**
 * Startup validation - throws error if configuration is invalid
 * Use this to fail fast during application startup
 * Skip validation during build time
 */
export function validateStripeEnvironmentOrThrow(): StripeEnvironmentConfig {
  // Skip validation during build time (when process.env.NODE_ENV is undefined or when building)
  if (!process.env.NODE_ENV || process.env.NODE_ENV === 'test' || process.env.BUILDING) {
    // Return a placeholder config for build time
    return {
      secretKey: 'sk_test_placeholder',
      priceIds: {
        starter: 'price_placeholder_starter',
        growth: 'price_placeholder_growth', 
        professional: 'price_placeholder_professional',
        enterprise: 'price_placeholder_enterprise'
      },
      nextAuthUrl: 'http://localhost:3000'
    };
  }

  const result = validateStripeEnvironment();
  
  if (!result.isValid) {
    const errorMessage = [
      '🚨 STRIPE CONFIGURATION INVALID',
      '',
      'Errors:',
      ...result.errors.map(err => `  ❌ ${err}`),
      '',
      ...(result.warnings.length > 0 ? [
        'Warnings:',
        ...result.warnings.map(warn => `  ⚠️  ${warn}`),
        ''
      ] : []),
      'Please check your environment variables and try again.',
      'See .env.example for the required format.'
    ].join('\n');
    
    throw new Error(errorMessage);
  }

  if (result.warnings.length > 0) {
    console.warn('⚠️  Stripe configuration warnings:');
    result.warnings.forEach(warning => console.warn(`  ⚠️  ${warning}`));
  }

  return result.config!;
}

/**
 * Log validation status for debugging
 */
export function logStripeEnvironmentStatus(): void {
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

/**
 * Runtime environment variable access with validation
 * Use this instead of direct process.env access for Stripe variables
 * Safe for build time usage
 */
export function getStripeConfig(): StripeEnvironmentConfig {
  return validateStripeEnvironmentOrThrow();
}