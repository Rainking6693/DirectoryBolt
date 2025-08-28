// 🔒 STRIPE SUBSCRIPTION CHECKOUT - Create subscription checkout sessions
// POST /api/create-checkout-session - Create Stripe checkout sessions for subscription plans

import Stripe from 'stripe';
import { handleApiError, ValidationError, ApiError } from '../../lib/utils/errors';

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key_for_testing', {
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
    stripe_price_id: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_test_123', // Fallback for testing
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
    stripe_price_id: process.env.STRIPE_GROWTH_PRICE_ID || 'price_growth_test_123', // Fallback for testing
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
    stripe_price_id: process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_professional_test_123', // Fallback for testing
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
    stripe_price_id: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_test_123', // Fallback for testing
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
      error_stack: error.stack,
      request_body: req.body
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
      missing_config: 'stripe_price_id'
    });
    throw new ApiError(`Stripe price ID not configured for plan: ${plan}. Please check environment variables.`, 503, 'STRIPE_CONFIG_MISSING');
  }

  // Check if we're in development mode with mock Stripe keys
  const isDevelopmentMode = process.env.STRIPE_SECRET_KEY === undefined || 
                           process.env.STRIPE_SECRET_KEY === 'sk_test_mock_key_for_testing';

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

  try {
    // Create or retrieve Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: user_email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      
      // Update customer metadata with current user_id
      customer = await stripe.customers.update(customer.id, {
        metadata: {
          user_id: user_id,
          plan_tier: plan,
          last_updated: new Date().toISOString()
        }
      });
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email: user_email,
        metadata: {
          user_id: user_id,
          plan_tier: plan,
          created_at: new Date().toISOString()
        }
      });
    }

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

    throw new Error(`Payment system error: ${stripeError.message}`);
  }
}

// Export plan configuration for use in other parts of the application
export { SUBSCRIPTION_PLANS };