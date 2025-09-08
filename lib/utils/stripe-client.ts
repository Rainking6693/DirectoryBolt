// 🔒 STRIPE CLIENT - Enhanced Stripe integration with validation and error handling
// Provides a validated Stripe client instance with comprehensive error handling

import Stripe from 'stripe';
import { getStripeConfig, logStripeEnvironmentStatus } from './stripe-environment-validator';
import { log } from './logger';

let stripeInstance: Stripe | null = null;
let configValidated = false;

/**
 * Get a validated Stripe instance
 * Performs environment validation on first access
 */
export function getStripeClient(): Stripe {
  if (!stripeInstance) {
    // Validate environment on first access
    const config = getStripeConfig();
    
    // Log configuration status in development
    if (process.env.NODE_ENV !== 'production') {
      logStripeEnvironmentStatus();
    }
    
    // Create Stripe instance with validated configuration
    stripeInstance = new Stripe(config.secretKey, {
      apiVersion: '2023-08-16',
      typescript: true,
      // Add request timeout and retries for reliability
      timeout: 10000, // 10 second timeout
      maxNetworkRetries: 3,
    });
    
    configValidated = true;
    
    log.info('Stripe client initialized successfully', {
      keyType: config.secretKey.startsWith('sk_live_') ? 'live' : 'test',
      apiVersion: '2023-08-16',
      hasWebhookSecret: !!config.webhookSecret,
      environment: process.env.NODE_ENV
    } as any);
  }
  
  return stripeInstance;
}

/**
 * Test Stripe API connectivity
 * Performs a lightweight API call to verify the connection
 */
export async function testStripeConnection(): Promise<{
  connected: boolean;
  error?: string;
  accountId?: string;
  keyType: 'test' | 'live';
}> {
  try {
    const stripe = getStripeClient();
    
    // Perform a lightweight API call to test connectivity
    const customers = await stripe.customers.list({ limit: 1 });
    
    // Get account information
    const account = await stripe.accounts.retrieve();
    
    return {
      connected: true,
      accountId: account.id,
      keyType: (account as any).livemode ? 'live' : 'test'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    log.error('Stripe connection test failed', {
      error: errorMessage,
      errorType: error instanceof Stripe.errors.StripeError ? error.type : 'unknown'
    } as any);
    
    return {
      connected: false,
      error: errorMessage,
      keyType: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'test'
    };
  }
}

/**
 * Validate that a price exists in Stripe
 */
export async function validateStripePrice(priceId: string): Promise<{
  valid: boolean;
  price?: Stripe.Price;
  error?: string;
}> {
  try {
    const stripe = getStripeClient();
    const price = await stripe.prices.retrieve(priceId);
    
    if (!price.active) {
      return {
        valid: false,
        error: `Price ${priceId} exists but is not active`
      };
    }
    
    return {
      valid: true,
      price
    };
  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      return {
        valid: false,
        error: error.message
      };
    }
    
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Validate all configured price IDs
 */
export async function validateAllPrices(): Promise<{
  valid: boolean;
  results: Record<string, { valid: boolean; error?: string; price?: Stripe.Price }>;
}> {
  const config = getStripeConfig();
  const results: Record<string, { valid: boolean; error?: string; price?: Stripe.Price }> = {};
  
  let allValid = true;
  
  for (const [planName, priceId] of Object.entries(config.priceIds)) {
    const result = await validateStripePrice(priceId);
    results[planName] = result;
    
    if (!result.valid) {
      allValid = false;
    }
  }
  
  return {
    valid: allValid,
    results
  };
}

/**
 * Enhanced Stripe error handling
 * Converts Stripe errors to user-friendly messages
 */
export function handleStripeError(error: unknown, context?: string): {
  userMessage: string;
  errorCode: string;
  statusCode: number;
  shouldRetry: boolean;
} {
  let userMessage = 'Payment system error. Please try again.';
  let errorCode = 'STRIPE_UNKNOWN_ERROR';
  let statusCode = 500;
  let shouldRetry = false;

  if (error instanceof Stripe.errors.StripeError) {
    const stripeError = error;
    
    switch (stripeError.type) {
      case 'StripeCardError':
        userMessage = 'Your payment method was declined. Please try a different payment method.';
        errorCode = 'STRIPE_CARD_ERROR';
        statusCode = 402;
        shouldRetry = false;
        break;
        
      case 'StripeRateLimitError':
        userMessage = 'Too many requests. Please wait a moment and try again.';
        errorCode = 'STRIPE_RATE_LIMIT';
        statusCode = 429;
        shouldRetry = true;
        break;
        
      case 'StripeInvalidRequestError':
        if (stripeError.code === 'resource_missing') {
          userMessage = 'The requested payment plan is not available. Please contact support.';
          errorCode = 'STRIPE_RESOURCE_MISSING';
          statusCode = 404;
        } else {
          userMessage = 'Invalid payment request. Please refresh the page and try again.';
          errorCode = 'STRIPE_INVALID_REQUEST';
          statusCode = 400;
        }
        shouldRetry = false;
        break;
        
      case 'StripeAPIError':
        userMessage = 'Payment system is temporarily unavailable. Please try again in a few minutes.';
        errorCode = 'STRIPE_API_ERROR';
        statusCode = 503;
        shouldRetry = true;
        break;
        
      case 'StripeConnectionError':
        userMessage = 'Unable to connect to payment service. Please check your connection and try again.';
        errorCode = 'STRIPE_CONNECTION_ERROR';
        statusCode = 503;
        shouldRetry = true;
        break;
        
      case 'StripeAuthenticationError':
        userMessage = 'Payment system configuration error. Please contact support.';
        errorCode = 'STRIPE_AUTH_ERROR';
        statusCode = 503;
        shouldRetry = false;
        break;
        
      default:
        userMessage = `Payment system error: ${stripeError.message}`;
        errorCode = 'STRIPE_ERROR';
        statusCode = 502;
        shouldRetry = false;
    }
    
    // Log the error with context
    log.error('Stripe error occurred', {
      context,
      errorType: stripeError.type,
      errorCode: stripeError.code,
      errorMessage: stripeError.message,
      requestId: (stripeError as any).requestId,
      statusCode: (stripeError as any).statusCode
    } as any);
  } else if (error instanceof Error) {
    log.error('Non-Stripe error in payment context', {
      context,
      errorMessage: error.message,
      stack: error.stack
    } as any);
    
    userMessage = 'An unexpected error occurred. Please try again.';
    errorCode = 'PAYMENT_ERROR';
  }
  
  return {
    userMessage,
    errorCode,
    statusCode,
    shouldRetry
  };
}

/**
 * Enhanced webhook signature verification with comprehensive security logging
 * Validates Stripe webhook signatures with support for secret rotation
 */
async function verifyWebhookSignatureEnhanced(
  body: string | Buffer, 
  signature: string, 
  secret: string
): Promise<Stripe.Event> {
  if (!signature) {
    throw new Error('No signature provided');
  }
  
  if (!secret) {
    throw new Error('Webhook secret not configured');
  }
  
  try {
    const stripe = getStripeClient();
    const event = stripe.webhooks.constructEvent(body, signature, secret);
    
    log.info('Webhook signature verified successfully', {
      metadata: {
        eventId: event.id,
        eventType: event.type,
        timestamp: new Date().toISOString(),
        signatureAlgorithm: signature.split(',')[0] || 'unknown'
      }
    } as any);
    
    return event;
  } catch (error) {
    log.error('Webhook signature verification failed', {
      metadata: {
        hasSignature: !!signature,
        hasSecret: !!secret,
        signatureHeader: signature ? signature.substring(0, 20) + '...' : 'missing',
        error: error instanceof Error ? error.message : 'Unknown error',
        secretType: secret.startsWith('whsec_') ? 'valid_format' : 'invalid_format'
      }
    }, error as Error);
    
    throw new Error('Webhook signature verification failed');
  }
}

/**
 * Verify webhook signature with support for multiple secrets (rotation)
 * Attempts verification with primary secret, then fallback secrets
 */
async function verifyWithMultipleSecrets(
  body: string | Buffer, 
  signature: string,
  req?: any
): Promise<Stripe.Event> {
  // Security logging for webhook attempt
  log.info('Webhook security check initiated', {
    metadata: {
      hasSignature: !!signature,
      signatureAlgorithm: signature ? signature.split(',')[0] : 'none',
      timestamp: Date.now(),
      userAgent: req?.headers?.['user-agent'] || 'unknown',
      sourceIP: req?.ip || req?.connection?.remoteAddress || 'unknown',
      contentLength: typeof body === 'string' ? body.length : body?.length || 0
    }
  } as any);

  // Get webhook secrets (primary + rotation support)
  const webhookSecrets = [
    process.env.STRIPE_WEBHOOK_SECRET,
    process.env.STRIPE_WEBHOOK_SECRET_OLD // For rotation scenarios
  ].filter(Boolean);

  if (webhookSecrets.length === 0) {
    log.error('No webhook secrets configured - critical security vulnerability', {
      metadata: {
        availableEnvVars: Object.keys(process.env).filter(key => key.includes('WEBHOOK')),
        nodeEnv: process.env.NODE_ENV
      }
    } as any);
    throw new Error('Webhook secret is not configured');
  }

  let lastError: Error;
  
  for (let i = 0; i < webhookSecrets.length; i++) {
    const secret = webhookSecrets[i];
    try {
      const event = await verifyWebhookSignatureEnhanced(body, signature, secret!);
      
      // Log successful verification with secret used
      log.info('Webhook verification successful', {
        metadata: {
          eventId: event.id,
          eventType: event.type,
          secretIndex: i,
          isRotationSecret: i > 0,
          totalSecretsAvailable: webhookSecrets.length
        }
      } as any);
      
      return event;
    } catch (error) {
      lastError = error as Error;
      
      log.warn('Webhook verification failed with secret', {
        metadata: {
          secretIndex: i,
          isRotationSecret: i > 0,
          error: error instanceof Error ? error.message : 'Unknown error',
          willRetryWithNext: i < webhookSecrets.length - 1
        }
      } as any);
      
      continue;
    }
  }
  
  // All secrets failed
  log.error('Webhook verification failed with all available secrets', {
    metadata: {
      totalSecretsAttempted: webhookSecrets.length,
      finalError: lastError.message,
      securityAlert: 'Potential webhook spoofing attempt detected'
    }
  } as any);
  
  throw lastError;
}

/**
 * Main webhook signature verification function
 * Public API with enhanced security features
 */
export function verifyWebhookSignature(
  body: string | Buffer,
  signature: string,
  webhookSecret?: string,
  req?: any
): Stripe.Event {
  try {
    // If specific secret provided, use single verification
    if (webhookSecret) {
      const stripe = getStripeClient();
      return stripe.webhooks.constructEvent(body, signature, webhookSecret);
    }

    // Use enhanced multi-secret verification
    return verifyWithMultipleSecrets(body, signature, req) as any;
  } catch (error) {
    log.error('Webhook signature verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      hasSignature: !!signature,
      hasCustomSecret: !!webhookSecret,
      securityContext: 'webhook_verification_failure'
    } as any);
    
    throw new Error('Webhook signature verification failed');
  }
}

/**
 * Check if we're in development mode (using test keys)
 */
export function isStripeTestMode(): boolean {
  const config = getStripeConfig();
  return config.secretKey.startsWith('sk_test_');
}

/**
 * Get formatted account info for logging
 */
export async function getStripeAccountInfo(): Promise<{
  accountId: string;
  businessName?: string;
  country: string;
  currency: string;
  livemode: boolean;
}> {
  const stripe = getStripeClient();
  const account = await stripe.accounts.retrieve();
  
  return {
    accountId: account.id,
    businessName: account.business_profile?.name || undefined,
    country: account.country || 'unknown',
    currency: account.default_currency || 'usd',
    livemode: (account as any).livemode
  };
}

// Export the Stripe types for use in other files
export type { Stripe };
export default getStripeClient;