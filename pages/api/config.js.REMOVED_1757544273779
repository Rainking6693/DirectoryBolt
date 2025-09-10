// 🔧 DIRECTORYBOLT CONFIG API
// GET /api/config - Return client-safe configuration for DirectoryBolt frontend

import { 
  CORE_PACKAGES, 
  SUBSCRIPTION_SERVICES, 
  ADD_ONS,
  validateStripeConfiguration 
} from '../../lib/config/directoryBoltProducts';

export default async function handler(req, res) {
  const requestId = `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Set security headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
  
  console.log('Config request:', {
    method: req.method,
    request_id: requestId,
    user_agent: req.headers['user-agent']?.substring(0, 100)
  });

  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ 
        error: 'Method not allowed',
        request_id: requestId 
      });
    }

    // Check Stripe configuration
    const stripeConfig = validateStripeConfiguration();
    
    // Prepare client-safe configuration
    const config = {
      // Stripe public configuration
      stripe: {
        publishable_key: process.env.STRIPE_PUBLISHABLE_KEY || null,
        configured: stripeConfig.configured,
        development_mode: stripeConfig.development_mode || false
      },
      
      // Product configuration (without sensitive Stripe price IDs)
      products: {
        packages: Object.entries(CORE_PACKAGES).reduce((acc, [key, pkg]) => {
          acc[key] = {
            id: pkg.id,
            name: pkg.name,
            price: pkg.price,
            directory_count: pkg.directory_count,
            description: pkg.description,
            features: pkg.features,
            popular: pkg.popular
          };
          return acc;
        }, {}),
        
        subscriptions: Object.entries(SUBSCRIPTION_SERVICES).reduce((acc, [key, svc]) => {
          acc[key] = {
            id: svc.id,
            name: svc.name,
            price: svc.price,
            billing_interval: svc.billing_interval,
            description: svc.description,
            features: svc.features,
            requires_core_package: svc.requires_core_package
          };
          return acc;
        }, {}),
        
        addOns: Object.entries(ADD_ONS).reduce((acc, [key, addon]) => {
          acc[key] = {
            id: addon.id,
            name: addon.name,
            price: addon.price,
            description: addon.description,
            features: addon.features,
            compatible_packages: addon.compatible_packages
          };
          return acc;
        }, {})
      },
      
      // Business configuration
      business: {
        name: 'DirectoryBolt',
        domain: 'directorybolt.com',
        support_email: 'support@directorybolt.com',
        currency: 'USD'
      },
      
      // API endpoints for frontend
      api: {
        base_url: process.env.NEXT_PUBLIC_API_BASE_URL || 
                 (process.env.NODE_ENV === 'production' 
                   ? 'https://directorybolt.com' 
                   : 'http://localhost:3000'),
        endpoints: {
          create_checkout: '/api/create-checkout-session-v2',
          create_subscription: '/api/create-subscription-checkout',
          webhook: '/api/webhook'
        }
      },
      
      // Feature flags
      features: {
        subscriptions_enabled: true,
        add_ons_enabled: true,
        trials_enabled: true,
        promotions_enabled: true,
        automatic_tax: true
      },
      
      // Validation rules for frontend
      validation: {
        email_required: true,
        business_name_required: true,
        business_website_required: true,
        max_add_ons: 4 // All available add-ons
      }
    };

    // Add development warnings if applicable
    if (stripeConfig.development_mode) {
      config.warnings = [
        'Development mode: Some Stripe price IDs may be using test values',
        `Missing price IDs: ${stripeConfig.missing_price_ids?.join(', ') || 'none'}`
      ];
    }

    // Add environment info for debugging (non-sensitive)
    if (process.env.NODE_ENV !== 'production') {
      config.debug = {
        environment: process.env.NODE_ENV,
        has_stripe_keys: {
          publishable: !!process.env.STRIPE_PUBLISHABLE_KEY,
          secret: !!process.env.STRIPE_SECRET_KEY,
          webhook: !!process.env.STRIPE_WEBHOOK_SECRET
        },
        timestamp: new Date().toISOString(),
        request_id: requestId
      };
    }

    console.log('Config response prepared:', {
      request_id: requestId,
      stripe_configured: config.stripe.configured,
      development_mode: config.stripe.development_mode,
      packages_count: Object.keys(config.products.packages).length,
      add_ons_count: Object.keys(config.products.addOns).length
    });

    res.status(200).json({
      success: true,
      data: config,
      requestId
    });

  } catch (error) {
    console.error('Config API error:', {
      request_id: requestId,
      error_message: error.message,
      error_stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to load configuration',
        code: 'CONFIG_ERROR',
        statusCode: 500
      },
      request_id: requestId
    });
  }
}