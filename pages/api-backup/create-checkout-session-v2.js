// 🚀 DIRECTORYBOLT CHECKOUT SESSIONS V2
// POST /api/create-checkout-session-v2 - Create Stripe checkout sessions for DirectoryBolt packages
// Handles one-time payments for core packages with optional add-ons

import { handleApiError, ValidationError, ApiError } from '../../lib/utils/errors';
import { log } from '../../lib/utils/logger';
import { 
  CORE_PACKAGES, 
  ADD_ONS,
  calculateTotalPrice,
  validatePackageConfiguration,
  getCheckoutLineItems,
  getOrderSummary,
  validateStripeConfiguration
} from '../../lib/config/directoryBoltProducts';

// Initialize Stripe client safely
let stripe = null;

function getStripeClientSafe() {
  try {
    const { getStripeClient } = require('../../lib/utils/stripe-client');
    return getStripeClient();
  } catch (error) {
    return null;
  }
}

export default async function handler(req, res) {
  const requestId = `checkout_v2_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Set security headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Log incoming request for debugging
  console.log('DirectoryBolt checkout request:', {
    method: req.method,
    request_id: requestId,
    body: req.body,
    user_agent: req.headers['user-agent']?.substring(0, 100)
  });

  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json(handleApiError(
        new Error('Method not allowed'),
        requestId
      ));
    }

    // Initialize Stripe at request time
    stripe = getStripeClientSafe();
    
    if (!stripe) {
      console.log('Stripe not configured - returning development mode response');
      return res.status(200).json({
        success: true,
        development_mode: true,
        data: {
          checkout_session: {
            id: `cs_mock_${Date.now()}`,
            url: `https://checkout.stripe.com/c/pay/mock_session_${Date.now()}`,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          },
          note: 'Development mode - Stripe not configured'
        },
        requestId
      });
    }

    await handleCreateDirectoryBoltCheckout(req, res, requestId);

  } catch (error) {
    console.error('Checkout session error:', {
      request_id: requestId,
      error_message: error.message,
      error_type: error.constructor.name,
      error_stack: error.stack
    });
    
    const errorResponse = handleApiError(error, requestId);
    return res.status(errorResponse.error.statusCode || 500).json(errorResponse);
  }
}

async function handleCreateDirectoryBoltCheckout(req, res, requestId) {
  // Parse and validate request body
  let parsedBody;
  try {
    parsedBody = req.body;
    if (typeof parsedBody === 'string') {
      parsedBody = JSON.parse(parsedBody);
    }
  } catch (parseError) {
    console.error('JSON parsing error:', {
      request_id: requestId,
      parse_error: parseError.message
    });
    throw new ValidationError('Invalid JSON in request body', 'request_body');
  }

  const {
    package: packageId,
    addOns = [],
    customer_email,
    customer_name,
    success_url,
    cancel_url,
    metadata = {}
  } = parsedBody || {};

  // Validate required parameters
  if (!parsedBody) {
    throw new ValidationError('Request body is required', 'request_body');
  }

  if (!packageId) {
    throw new ValidationError(
      `Package parameter is required. Available packages: ${Object.keys(CORE_PACKAGES).join(', ')}`,
      'package'
    );
  }

  if (!customer_email) {
    throw new ValidationError('Customer email is required', 'customer_email');
  }

  // Validate package configuration
  const configValidation = validatePackageConfiguration(packageId, addOns);
  if (!configValidation.valid) {
    console.error('Package configuration validation failed:', {
      request_id: requestId,
      package: packageId,
      addOns: addOns,
      errors: configValidation.errors
    });
    throw new ValidationError(
      `Invalid package configuration: ${configValidation.errors.join(', ')}`,
      'package_configuration'
    );
  }

  // Check Stripe configuration
  const stripeConfig = validateStripeConfiguration();
  if (!stripeConfig.configured) {
    console.error('Stripe configuration error:', {
      request_id: requestId,
      missing: stripeConfig.missing,
      message: stripeConfig.message
    });
    throw new ApiError(stripeConfig.message, 503, 'STRIPE_CONFIG_MISSING');
  }

  // Log development mode warning if applicable
  if (stripeConfig.development_mode) {
    console.warn('Development mode detected - some price IDs may be missing:', {
      request_id: requestId,
      missing_price_ids: stripeConfig.missing_price_ids
    });
  }

  try {
    // Test Stripe connectivity
    const { testStripeConnection } = require('../../lib/utils/stripe-client');
    const connectionTest = await testStripeConnection();
    if (!connectionTest.connected) {
      throw new Error(connectionTest.error || 'Connection test failed');
    }

    console.log('Stripe API connectivity confirmed:', {
      request_id: requestId,
      account_id: connectionTest.accountId,
      key_type: connectionTest.keyType
    });

    // Create or retrieve Stripe customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: customer_email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
      console.log('Existing customer found:', {
        request_id: requestId,
        customer_id: customer.id
      });
      
      // Update customer metadata
      customer = await stripe.customers.update(customer.id, {
        name: customer_name || customer.name,
        metadata: {
          ...customer.metadata,
          package_type: packageId,
          add_ons: addOns.join(','),
          last_updated: new Date().toISOString()
        }
      });
    } else {
      console.log('Creating new customer:', {
        request_id: requestId,
        email: customer_email,
        name: customer_name
      });

      customer = await stripe.customers.create({
        email: customer_email,
        name: customer_name,
        metadata: {
          package_type: packageId,
          add_ons: addOns.join(','),
          created_at: new Date().toISOString()
        }
      });
    }

    // Get line items for checkout
    const lineItems = getCheckoutLineItems(packageId, addOns);
    const orderSummary = getOrderSummary(packageId, addOns);

    console.log('Creating checkout session:', {
      request_id: requestId,
      customer_id: customer.id,
      package: packageId,
      addOns: addOns,
      total_price: orderSummary.totalPrice,
      line_items: lineItems.length
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment', // One-time payment
      success_url: success_url || `https://directorybolt.com/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `https://directorybolt.com/pricing?cancelled=true`,
      
      // Enhanced metadata for tracking
      metadata: {
        package_id: packageId,
        add_ons: addOns.join(','),
        total_directories: orderSummary.totalDirectories.toString(),
        request_id: requestId,
        ...metadata
      },
      
      // Payment options
      payment_intent_data: {
        metadata: {
          package_id: packageId,
          add_ons: addOns.join(','),
          customer_email: customer_email,
          total_directories: orderSummary.totalDirectories.toString()
        }
      },
      
      // UI customizations
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'CH', 'AT']
      },
      
      // Tax calculation
      automatic_tax: {
        enabled: true
      },
      
      // Allow promotion codes
      allow_promotion_codes: true,
      
      // Custom fields for business information
      custom_fields: [
        {
          key: 'business_name',
          label: {
            type: 'text',
            text: 'Business Name'
          },
          type: 'text',
          optional: false
        },
        {
          key: 'business_website',
          label: {
            type: 'text', 
            text: 'Business Website URL'
          },
          type: 'text',
          optional: false
        }
      ]
    });

    console.log('Checkout session created successfully:', {
      request_id: requestId,
      session_id: session.id,
      customer_id: customer.id,
      expires_at: new Date(session.expires_at * 1000).toISOString()
    });

    // Validate session URL exists
    if (!session.url) {
      throw new ApiError(
        'Payment session created but checkout URL is missing. Please contact support.',
        500,
        'STRIPE_SESSION_URL_MISSING'
      );
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
        order_summary: orderSummary,
        customer_id: customer.id
      },
      requestId
    });

  } catch (stripeError) {
    // Enhanced Stripe error handling
    const { handleStripeError } = require('../../lib/utils/stripe-client');
    const errorResponse = handleStripeError(stripeError, 'checkout-session-creation');
    
    console.error('DirectoryBolt checkout failed:', {
      package: packageId,
      addOns: addOns,
      customer_email: customer_email,
      error: stripeError.message,
      request_id: requestId,
      user_message: errorResponse.userMessage,
      error_code: errorResponse.errorCode
    });
    
    throw new ApiError(errorResponse.userMessage, errorResponse.statusCode, errorResponse.errorCode);
  }
}

// Export for testing
export { handleCreateDirectoryBoltCheckout };