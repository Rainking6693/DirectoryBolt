// 🔧 SHANE: Fixed Stripe Checkout Session with inline pricing
// No product IDs required - using price_data directly

import Stripe from 'stripe';

// Initialize Stripe with the live key from environment
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Pricing configuration (in cents)
const PRICING = {
  plans: {
    starter: {
      name: 'Starter Package',
      amount: 4900, // $49
      description: '50 directory submissions',
      directories: 50
    },
    growth: {
      name: 'Growth Package', 
      amount: 8900, // $89
      description: '100 directory submissions',
      directories: 100
    },
    pro: {
      name: 'Pro Package',
      amount: 15900, // $159
      description: '200 directory submissions',
      directories: 200
    }
  },
  subscription: {
    name: 'Auto Update & Resubmission',
    amount: 4900, // $49/month
    description: 'Monthly automatic updates and resubmissions',
    interval: 'month'
  },
  addons: {
    fasttrack: {
      name: 'Fast-track Submission',
      amount: 2500, // $25
      description: 'Priority processing within 24 hours'
    },
    premium: {
      name: 'Premium Directories Only',
      amount: 1500, // $15
      description: 'Focus on high-authority directories'
    },
    qa: {
      name: 'Manual QA Review',
      amount: 1000, // $10
      description: 'Human verification of all submissions'
    },
    csv: {
      name: 'CSV Export',
      amount: 900, // $9
      description: 'Export submission results to CSV'
    }
  }
};

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const requestId = `checkout_${Date.now()}`;
  
  console.log('🔧 SHANE: Creating checkout session', {
    requestId,
    body: req.body
  });

  try {
    const { 
      plan, 
      addons = [], 
      includeSubscription = false,
      customerEmail = '',
      successUrl = 'https://directorybolt.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl = 'https://directorybolt.com/cancel'
    } = req.body;

    // Validate plan selection
    if (!plan || !PRICING.plans[plan]) {
      console.error('Invalid plan selected:', plan);
      return res.status(400).json({ 
        error: 'Invalid plan selected',
        availablePlans: Object.keys(PRICING.plans)
      });
    }

    // Build line items array
    const lineItems = [];
    
    // Add main package
    const selectedPlan = PRICING.plans[plan];
    lineItems.push({
      price_data: {
        currency: 'usd',
        unit_amount: selectedPlan.amount,
        product_data: {
          name: selectedPlan.name,
          description: selectedPlan.description,
        }
      },
      quantity: 1
    });

    console.log('Added main plan to cart:', selectedPlan.name);

    // Add selected add-ons
    if (addons && addons.length > 0) {
      for (const addonKey of addons) {
        if (PRICING.addons[addonKey]) {
          const addon = PRICING.addons[addonKey];
          lineItems.push({
            price_data: {
              currency: 'usd',
              unit_amount: addon.amount,
              product_data: {
                name: addon.name,
                description: addon.description,
              }
            },
            quantity: 1
          });
          console.log('Added addon to cart:', addon.name);
        }
      }
    }

    // Calculate total for one-time payment
    const totalAmount = lineItems.reduce((sum, item) => 
      sum + (item.price_data.unit_amount * item.quantity), 0
    );

    console.log('Total amount (one-time):', totalAmount / 100, 'USD');

    // Create checkout session for one-time payment
    let sessionConfig = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment', // One-time payment mode
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        plan: plan,
        addons: addons.join(','),
        requestId: requestId
      }
    };

    // Add customer email if provided
    if (customerEmail) {
      sessionConfig.customer_email = customerEmail;
    }

    // Create the session
    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('✅ SHANE: Checkout session created successfully', {
      sessionId: session.id,
      requestId,
      checkoutUrl: session.url ? 'URL generated' : 'NO URL',
      totalAmount: totalAmount / 100
    });

    // Validate that we have a session ID and URL
    if (!session.id) {
      throw new Error('Stripe session created but no ID returned');
    }

    if (!session.url) {
      console.error('⚠️ Session created but no checkout URL:', {
        sessionId: session.id,
        sessionKeys: Object.keys(session)
      });
      throw new Error('Stripe session created but no checkout URL returned');
    }

    // Return the session details
    return res.status(200).json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
      totalAmount: totalAmount / 100,
      requestId,
      plan: selectedPlan.name,
      addons: addons.map(key => PRICING.addons[key]?.name).filter(Boolean)
    });

  } catch (error) {
    console.error('❌ SHANE: Checkout session error', {
      requestId,
      error: error.message,
      stack: error.stack,
      stripeError: error.raw
    });

    // Return user-friendly error
    return res.status(500).json({
      success: false,
      error: 'Failed to create checkout session',
      message: error.message,
      requestId
    });
  }
}

// Also create a subscription checkout endpoint
export async function createSubscriptionCheckout(req, res) {
  const requestId = `sub_checkout_${Date.now()}`;
  
  console.log('🔧 SHANE: Creating subscription checkout', { requestId });

  try {
    const { 
      customerEmail = '',
      successUrl = 'https://directorybolt.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancelUrl = 'https://directorybolt.com/cancel'
    } = req.body;

    // Create subscription checkout session
    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          unit_amount: PRICING.subscription.amount,
          recurring: {
            interval: PRICING.subscription.interval
          },
          product_data: {
            name: PRICING.subscription.name,
            description: PRICING.subscription.description,
          }
        },
        quantity: 1
      }],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        type: 'subscription',
        requestId: requestId
      }
    };

    // Add customer email if provided
    if (customerEmail) {
      sessionConfig.customer_email = customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    console.log('✅ SHANE: Subscription session created', {
      sessionId: session.id,
      requestId
    });

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
      requestId,
      subscription: true,
      amount: PRICING.subscription.amount / 100
    });

  } catch (error) {
    console.error('❌ SHANE: Subscription checkout error', {
      requestId,
      error: error.message
    });

    return res.status(500).json({
      success: false,
      error: 'Failed to create subscription checkout',
      message: error.message,
      requestId
    });
  }
}