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
    subscription?: string;
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
    'NEXTAUTH_URL'
  ];
  
  // Optional variables (enterprise may be replaced by subscription)
  const optionalVars = [
    'STRIPE_ENTERPRISE_PRICE_ID',
    'STRIPE_SUBSCRIPTION_PRICE_ID'
  ];

  // Check for missing required variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }
  
  // Check if at least one of enterprise or subscription price ID is set
  if (!process.env.STRIPE_ENTERPRISE_PRICE_ID && !process.env.STRIPE_SUBSCRIPTION_PRICE_ID) {
    warnings.push('Neither STRIPE_ENTERPRISE_PRICE_ID nor STRIPE_SUBSCRIPTION_PRICE_ID is set - at least one is recommended');
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

  // Validate price IDs - handle both enterprise and subscription options
  const priceIds = {
    starter: process.env.STRIPE_STARTER_PRICE_ID!,
    growth: process.env.STRIPE_GROWTH_PRICE_ID!,
    professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID!,
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID || process.env.STRIPE_SUBSCRIPTION_PRICE_ID || '',
    ...(process.env.STRIPE_SUBSCRIPTION_PRICE_ID && {
      subscription: process.env.STRIPE_SUBSCRIPTION_PRICE_ID
    })
  };

  for (const [plan, priceId] of Object.entries(priceIds)) {
    // Skip validation for empty enterprise price ID if subscription is provided
    if (plan === 'enterprise' && !priceId && priceIds.subscription) {
      continue;
    }
    
    if (priceId && !priceId.startsWith('price_')) {
      errors.push(`${plan.toUpperCase()}_PRICE_ID must start with "price_"`);
    }

    // Check for mock/placeholder price IDs
    if (priceId && (priceId.includes('test_123') || priceId.includes('mock') || priceId.includes('replace_with_actual'))) {
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
 * Critical security validation for webhook secrets
 * Ensures webhook secrets are properly configured for production
 */
export function validateWebhookSecurity(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Critical: Webhook secret must be configured
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    errors.push('STRIPE_WEBHOOK_SECRET is required for webhook security - critical security vulnerability if missing');
  } else {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    // Validate format
    if (!webhookSecret.startsWith('whsec_')) {
      errors.push('STRIPE_WEBHOOK_SECRET must start with "whsec_" - invalid format detected');
    }
    
    // Check for placeholder values
    if (webhookSecret.includes('test_123') || webhookSecret.includes('mock') || webhookSecret.includes('replace_with_actual')) {
      errors.push('STRIPE_WEBHOOK_SECRET appears to be a placeholder value - critical security risk');
    }
    
    // Minimum length check (Stripe webhook secrets are typically 64+ characters)
    if (webhookSecret.length < 50) {
      errors.push('STRIPE_WEBHOOK_SECRET appears to be too short - may be invalid');
    }
  }

  // Check for optional rotation secret
  if (process.env.STRIPE_WEBHOOK_SECRET_OLD) {
    const oldSecret = process.env.STRIPE_WEBHOOK_SECRET_OLD;
    if (!oldSecret.startsWith('whsec_')) {
      warnings.push('STRIPE_WEBHOOK_SECRET_OLD has invalid format - should start with "whsec_"');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Startup validation - throws error if configuration is invalid
 * Use this to fail fast during application startup
 * Skip validation during build time
 */
export function validateStripeEnvironmentOrThrow(): StripeEnvironmentConfig {
  // Skip validation during build time (when process.env.NODE_ENV is undefined or when building)
  // Also skip when we're in CI/CD environment like Netlify
  if (!process.env.NODE_ENV || 
      process.env.NODE_ENV === 'test' || 
      process.env.BUILDING || 
      process.env.CI || 
      process.env.BUILD_MODE ||
      process.env.NETLIFY ||
      typeof window !== 'undefined') {
    // Return a placeholder config for build time
    return {
      secretKey: 'sk_test_placeholder',
      priceIds: {
        starter: 'price_placeholder_starter',
        growth: 'price_placeholder_growth', 
        professional: 'price_placeholder_professional',
        enterprise: 'price_placeholder_enterprise',
        subscription: process.env.STRIPE_SUBSCRIPTION_PRICE_ID || 'price_placeholder_subscription'
      },
      nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000'
    };
  }

  const result = validateStripeEnvironment();
  
  // Also validate webhook security for production - critical security enforcement
  if (process.env.NODE_ENV === 'production') {
    const securityResult = validateWebhookSecurity();
    result.errors.push(...securityResult.errors);
    result.warnings.push(...securityResult.warnings);
    
    // Add production-specific webhook security enforcement message
    if (securityResult.errors.length > 0) {
      console.error('🚨 CRITICAL: Production webhook security validation failed');
      console.error('Webhook signature verification is mandatory for production security');
    }
  }
  
  if (!result.isValid || result.errors.length > 0) {
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
      'See .env.example for the required format.',
      '',
      '🔒 CRITICAL: Webhook signature verification is required for security.',
      'Without proper webhook secrets, your application is vulnerable to webhook spoofing attacks.'
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