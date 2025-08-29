// 🔒 STRIPE SUBSCRIPTION CHECKOUT - Create subscription checkout sessions
// POST /api/create-checkout-session - Create Stripe checkout sessions for subscription plans

import Stripe from 'stripe';
import { handleApiError, ValidationError, ApiError } from '../../lib/utils/errors';
import { log } from '../../lib/utils/logger';

// Validate required environment variables - NO FALLBACKS FOR SECURITY
const requiredEnvVars = [
  'STRIPE_SECRET_KEY',
  'STRIPE_STARTER_PRICE_ID',
  'STRIPE_GROWTH_PRICE_ID', 
  'STRIPE_PROFESSIONAL_PRICE_ID',
  'STRIPE_ENTERPRISE_PRICE_ID'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`${envVar} environment variable is required`);
  }
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

// Subscription plan configuration - matches your product specifications
const SUBSCRIPTION_PLANS = {
  starter: {
    name: 'Starter',
    price: 4900, // $49/month in cents
    directory_limit: 25,
    features: [
      '25 directory submissions per month',
      'Basic analytics',
      'Email support',
      'Standard processing speed'
    ],
    stripe_price_id: process.env.STRIPE_STARTER_PRICE_ID
  },
  growth: {
    name: 'Growth',
    price: 7900, // $79/month in cents
    directory_limit: 50,
    features: [
      '50 directory submissions per month',
      'Advanced analytics',
      'Priority email support',
      'Faster processing',
      'Bulk submission tools'
    ],
    stripe_price_id: process.env.STRIPE_GROWTH_PRICE_ID
  },
  professional: {
    name: 'Professional',
    price: 12900, // $129/month in cents
    directory_limit: 100,
    features: [
      '100+ directory submissions per month',
      'Premium analytics & reporting',
      'Phone & email support',
      'Priority processing',
      'API access',
      'Custom integrations'
    ],
    stripe_price_id: process.env.STRIPE_PROFESSIONAL_PRICE_ID
  },
  enterprise: {
    name: 'Enterprise',
    price: 29900, // $299/month in cents
    directory_limit: 500,
    features: [
      '500+ directory submissions per month',
      'Enterprise analytics & custom reports',
      'Dedicated account manager',
      'White-label options',
      'Full API access',
      'Custom integrations',
      'SLA guarantees'
    ],
    stripe_price_id: process.env.STRIPE_ENTERPRISE_PRICE_ID
  }
};

export default async function handler(req, res) {
  const requestId = `checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Log incoming request for debugging
  console.log('Checkout session request:', {
    method: req.method,
    request_id: requestId,
    body: req.body,
    headers: {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    }
  });
  
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json(handleApiError(
        new Error('Method not allowed'),
        requestId
      ));
    }

    await handleCreateCheckoutSession(req, res, requestId);

  } catch (error) {
    // Enhanced error logging for debugging
    console.error('Checkout session error:', {
      request_id: requestId,
      error_message: error.message,
      error_type: error.constructor.name,
      error_code: error.code,
      error_stack: error.stack,
      request_body: req.body,
      environment: {
        has_stripe_key: !!process.env.STRIPE_SECRET_KEY,
        stripe_key_type: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'test',
        node_env: process.env.NODE_ENV
      }
    });
    
    const errorResponse = handleApiError(error, requestId);
    return res.status(errorResponse.error.statusCode || 500).json(errorResponse);
  }
}

async function handleCreateCheckoutSession(req, res, requestId) {
  // Handle cases where request body might not be parsed correctly
  let parsedBody;
  try {
    parsedBody = req.body;
    if (typeof parsedBody === 'string') {
      parsedBody = JSON.parse(parsedBody);
    }
  } catch (parseError) {
    console.error('JSON parsing error:', {
      request_id: requestId,
      raw_body: req.body,
      parse_error: parseError.message
    });
    throw new ValidationError('Invalid JSON in request body', 'request_body');
  }

  const { plan, user_email, user_id, success_url, cancel_url, extended_trial } = parsedBody || {};

  // Enhanced parameter validation with detailed error messages
  if (!parsedBody) {
    throw new ValidationError('Request body is required', 'request_body');
  }

  if (!plan) {
    console.error('Checkout validation error:', {
      request_id: requestId,
      body: parsedBody,
      missing_field: 'plan',
      available_plans: Object.keys(SUBSCRIPTION_PLANS)
    });
    throw new ValidationError('Plan parameter is required. Available plans: ' + Object.keys(SUBSCRIPTION_PLANS).join(', '), 'plan');
  }

  if (!SUBSCRIPTION_PLANS[plan]) {
    console.error('Checkout validation error:', {
      request_id: requestId,
      invalid_plan: plan,
      available_plans: Object.keys(SUBSCRIPTION_PLANS),
      body: parsedBody
    });
    throw new ValidationError(`Invalid subscription plan: "${plan}". Available plans: ${Object.keys(SUBSCRIPTION_PLANS).join(', ')}`, 'plan');
  }

  if (!user_email || !user_id) {
    console.error('Checkout validation error:', {
      request_id: requestId,
      missing_user_email: !user_email,
      missing_user_id: !user_id,
      body: parsedBody
    });
    throw new ValidationError('User email and ID are required', !user_email ? 'user_email' : 'user_id');
  }

  const selectedPlan = SUBSCRIPTION_PLANS[plan];
  
  // Validate that Stripe price ID is configured
  if (!selectedPlan.stripe_price_id) {
    console.error('Configuration error:', {
      request_id: requestId,
      plan: plan,
      missing_config: 'stripe_price_id',
      available_env_vars: {
        starter: !!process.env.STRIPE_STARTER_PRICE_ID,
        growth: !!process.env.STRIPE_GROWTH_PRICE_ID,
        professional: !!process.env.STRIPE_PROFESSIONAL_PRICE_ID,
        enterprise: !!process.env.STRIPE_ENTERPRISE_PRICE_ID
      }
    });
    throw new ApiError(`Stripe price ID not configured for plan: ${plan}. Environment variable ${plan.toUpperCase()}_PRICE_ID is missing.`, 503, 'STRIPE_CONFIG_MISSING');
  }

  // Additional validation for mock/test price IDs in production
  if (selectedPlan.stripe_price_id.includes('_test_') && process.env.NODE_ENV === 'production') {
    console.error('Production configuration error:', {
      request_id: requestId,
      plan: plan,
      price_id: selectedPlan.stripe_price_id,
      environment: process.env.NODE_ENV
    });
    throw new ApiError(`Production environment detected but using test price ID for plan: ${plan}`, 503, 'STRIPE_PRODUCTION_CONFIG_ERROR');
  }

  // Enhanced development mode detection
  const isDevelopmentMode = !process.env.STRIPE_SECRET_KEY || 
                           process.env.STRIPE_SECRET_KEY === 'sk_test_mock_key_for_testing' ||
                           process.env.STRIPE_SECRET_KEY.startsWith('sk_test_mock_');
                           
  // Log configuration status for debugging
  console.log('Stripe configuration status:', {
    request_id: requestId,
    has_secret_key: !!process.env.STRIPE_SECRET_KEY,
    key_type: process.env.STRIPE_SECRET_KEY ? 
      (process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') ? 'live' : 'test') : 'none',
    development_mode: isDevelopmentMode,
    plan_price_id: selectedPlan.stripe_price_id,
    environment_validation: {
      nextauth_url: !!process.env.NEXTAUTH_URL,
      all_price_ids_set: !![process.env.STRIPE_STARTER_PRICE_ID, process.env.STRIPE_GROWTH_PRICE_ID, process.env.STRIPE_PROFESSIONAL_PRICE_ID, process.env.STRIPE_ENTERPRISE_PRICE_ID].every(Boolean)
    }
  });

  if (isDevelopmentMode) {
    // Return mock checkout session for development
    console.log('Development mode detected - returning mock checkout session:', {
      request_id: requestId,
      plan: plan,
      user_email: user_email
    });

    return res.status(200).json({
      success: true,
      data: {
        checkout_session: {
          id: `cs_mock_${Date.now()}`,
          url: `https://checkout.stripe.com/c/pay/mock_session_${Date.now()}`,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        plan_details: {
          name: selectedPlan.name,
          price: selectedPlan.price,
          directory_limit: selectedPlan.directory_limit,
          features: selectedPlan.features
        },
        customer_id: `cus_mock_${Date.now()}`,
        trial_period_days: extended_trial ? 21 : 14,
        development_mode: true
      },
      requestId
    });
  }

  // Pre-flight validation: Test Stripe connectivity before proceeding
  try {
    // Test Stripe API connectivity with a simple request
    await stripe.customers.list({ limit: 1 });
    console.log('Stripe API connectivity confirmed:', {
      request_id: requestId,
      api_version: stripe.getApiField('version')
    });
  } catch (connectivityError) {
    console.error('Stripe API connectivity test failed:', {
      request_id: requestId,
      error: connectivityError.message,
      error_code: connectivityError.code,
      error_type: connectivityError.type
    });
    
    let userMessage = 'Payment system is temporarily unavailable. Please try again later.';
    let errorCode = 'STRIPE_CONNECTIVITY_ERROR';
    
    if (connectivityError.code === 'api_key_invalid') {
      userMessage = 'Payment system configuration error. Please contact support.';
      errorCode = 'STRIPE_AUTH_ERROR';
    }
    
    throw new ApiError(userMessage, 503, errorCode);
  }

  try {
    // Create or retrieve Stripe customer
    let customer;
    console.log('Looking up customer:', {
      request_id: requestId,
      email: user_email
    });
    
    const existingCustomers = await stripe.customers.list({
      email: user_email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log('Existing customer found:', {
        request_id: requestId,
        customer_id: customer.id,
        created: new Date(customer.created * 1000).toISOString()
      });
      
      // Update customer metadata with current user_id
      customer = await stripe.customers.update(customer.id, {
        metadata: {
          user_id: user_id,
          plan_tier: plan,
          last_updated: new Date().toISOString()
        }
      });
    } else {
      console.log('Creating new customer:', {
        request_id: requestId,
        email: user_email,
        user_id: user_id
      });
      
      // Create new customer
      customer = await stripe.customers.create({
        email: user_email,
        metadata: {
          user_id: user_id,
          plan_tier: plan,
          created_at: new Date().toISOString()
        }
      });
      
      console.log('New customer created:', {
        request_id: requestId,
        customer_id: customer.id
      });
    }

    // Validate price exists before creating session
    try {
      const priceValidation = await stripe.prices.retrieve(selectedPlan.stripe_price_id);
      if (!priceValidation.active) {
        console.error('Inactive price detected:', {
          request_id: requestId,
          price_id: selectedPlan.stripe_price_id,
          plan: plan
        });
        throw new ApiError(`The ${plan} plan is temporarily unavailable. Please contact support.`, 503, 'STRIPE_PRICE_INACTIVE');
      }
      console.log('Price validation successful:', {
        request_id: requestId,
        price_id: selectedPlan.stripe_price_id,
        amount: priceValidation.unit_amount,
        currency: priceValidation.currency
      });
    } catch (priceError) {
      if (priceError.code === 'resource_missing') {
        console.error('Price not found in Stripe:', {
          request_id: requestId,
          price_id: selectedPlan.stripe_price_id,
          plan: plan,
          error: priceError.message
        });
        throw new ApiError(`The ${plan} plan is not properly configured. Please contact support.`, 503, 'STRIPE_PRICE_NOT_FOUND');
      }
      throw priceError; // Re-throw other errors
    }

    console.log('Creating checkout session:', {
      request_id: requestId,
      customer_id: customer.id,
      price_id: selectedPlan.stripe_price_id,
      plan: plan
    });
    
    // Create checkout session for subscription
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: selectedPlan.stripe_price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: success_url || `${process.env.NEXTAUTH_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: cancel_url || `${process.env.NEXTAUTH_URL}/pricing?cancelled=true`,
      metadata: {
        user_id: user_id,
        plan_tier: plan,
        request_id: requestId
      },
      subscription_data: {
        metadata: {
          user_id: user_id,
          plan_tier: plan,
          directory_limit: selectedPlan.directory_limit.toString(),
          extended_trial: extended_trial ? 'true' : 'false'
        },
        trial_period_days: extended_trial ? 21 : 14, // Extended 21-day trial for returning users
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      automatic_tax: {
        enabled: true,
      },
    });

    // Checkout session created successfully
    console.log('Checkout session created successfully:', {
      request_id: requestId,
      session_id: session.id,
      customer_id: customer.id,
      plan: plan,
      expires_at: new Date(session.expires_at * 1000).toISOString(),
      url_length: session.url?.length || 0
    });

    // Validate session URL exists
    if (!session.url) {
      console.error('Checkout session created but no URL returned:', {
        request_id: requestId,
        session_id: session.id,
        session_object: Object.keys(session)
      });
      throw new ApiError('Payment session created but checkout URL is missing. Please contact support.', 500, 'STRIPE_SESSION_URL_MISSING');
    }

    // Return success response
    res.status(200).json({
      success: true,
      data: {
        checkout_session: {
          id: session.id,
          url: session.url,
          expires_at: new Date(session.expires_at * 1000).toISOString()
        },
        plan_details: {
          name: selectedPlan.name,
          price: selectedPlan.price,
          directory_limit: selectedPlan.directory_limit,
          features: selectedPlan.features
        },
        customer_id: customer.id,
        trial_period_days: extended_trial ? 21 : 14
      },
      requestId
    });

  } catch (stripeError) {
    // Stripe API error logged
    
    // Log payment attempt failure
    console.error('Checkout session failed:', {
      user_id: user_id,
      plan: plan,
      error: stripeError.message,
      request_id: requestId,
      stripe_error_code: stripeError.code,
      stripe_error_type: stripeError.type
    });

    // Enhanced Stripe error handling with specific error types
    let userMessage = 'Payment setup failed. Please try again.';
    let errorCode = 'PAYMENT_ERROR';
    let httpStatus = 502;
    
    // Detailed error categorization
    if (stripeError.code) {
      switch (stripeError.code) {
        case 'api_key_invalid':
        case 'authentication_required':
          userMessage = 'Payment system authentication error. Please contact support.';
          errorCode = 'STRIPE_AUTH_ERROR';
          httpStatus = 503;
          break;
        case 'price_not_found':
        case 'resource_missing':
          userMessage = `The ${plan} plan configuration is missing. Please contact support.`;
          errorCode = 'STRIPE_CONFIG_ERROR';
          httpStatus = 503;
          break;
        case 'parameter_invalid_empty':
        case 'parameter_missing':
        case 'parameter_unknown':
          userMessage = 'Invalid payment parameters. Please refresh the page and try again.';
          errorCode = 'STRIPE_VALIDATION_ERROR';
          httpStatus = 400;
          break;
        case 'rate_limit':
          userMessage = 'Too many payment requests. Please wait 30 seconds and try again.';
          errorCode = 'STRIPE_RATE_LIMIT';
          httpStatus = 429;
          break;
        case 'customer_creation_failed':
          userMessage = 'Unable to create customer account. Please check your email and try again.';
          errorCode = 'STRIPE_CUSTOMER_ERROR';
          httpStatus = 400;
          break;
        case 'invalid_request_error':
          userMessage = 'Invalid payment request. Please refresh and try again.';
          errorCode = 'STRIPE_REQUEST_ERROR';
          httpStatus = 400;
          break;
        case 'api_connection_error':
        case 'api_error':
          userMessage = 'Payment system is temporarily unavailable. Please try again in a few minutes.';
          errorCode = 'STRIPE_API_ERROR';
          httpStatus = 503;
          break;
        default:
          userMessage = `Payment system error (${stripeError.code}). Please contact support if this persists.`;
          errorCode = 'STRIPE_UNKNOWN_ERROR';
          httpStatus = 502;
      }
    } else if (stripeError.type) {
      // Handle Stripe error types
      switch (stripeError.type) {
        case 'StripeCardError':
          userMessage = 'Payment method was declined. Please try a different payment method.';
          errorCode = 'STRIPE_CARD_ERROR';
          httpStatus = 402;
          break;
        case 'StripeInvalidRequestError':
          userMessage = 'Invalid payment request. Please refresh and try again.';
          errorCode = 'STRIPE_INVALID_REQUEST';
          httpStatus = 400;
          break;
        case 'StripeAPIError':
          userMessage = 'Payment service is experiencing issues. Please try again shortly.';
          errorCode = 'STRIPE_API_ISSUE';
          httpStatus = 503;
          break;
        case 'StripeConnectionError':
          userMessage = 'Unable to connect to payment service. Please check your connection and try again.';
          errorCode = 'STRIPE_CONNECTION_ERROR';
          httpStatus = 503;
          break;
        case 'StripeAuthenticationError':
          userMessage = 'Payment system authentication error. Please contact support.';
          errorCode = 'STRIPE_AUTH_FAILURE';
          httpStatus = 503;
          break;
      }
    }
    
    throw new ApiError(userMessage, httpStatus, errorCode);
  }
}

// Export plan configuration for use in other parts of the application
export { SUBSCRIPTION_PLANS };