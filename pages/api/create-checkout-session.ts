// 💳 ENHANCED STRIPE CHECKOUT SESSION CREATION
// Complete payment flow with real Stripe integration and tier management

import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { logger } from '../../lib/utils/logger'
import { getEmergencyStripeClient, getEmergencyPricingConfig, isPaymentSystemConfigured } from '../../lib/utils/stripe-emergency-fix'

// Emergency Stripe initialization with fallback handling
let stripeClient: Stripe | null = null
let configurationError: string | null = null

function getStripeClient(): Stripe {
  if (!stripeClient) {
    const config = getEmergencyStripeClient()
    if (!config.isConfigured || !config.stripe) {
      configurationError = config.errorMessage || 'Stripe not configured'
      throw new Error(configurationError)
    }
    stripeClient = config.stripe
  }
  return stripeClient
}

// Get pricing configuration with emergency fallbacks
const PRICING_CONFIG = getEmergencyPricingConfig()

interface CheckoutRequest {
  plan: keyof typeof PRICING_CONFIG
  successUrl: string
  cancelUrl: string
  customerEmail?: string
  metadata?: Record<string, string>
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Check payment system configuration first
  const paymentStatus = isPaymentSystemConfigured()
  if (!paymentStatus.configured) {
    return res.status(503).json({
      error: 'Payment system is not configured',
      message: 'Payment functionality is temporarily unavailable',
      issues: paymentStatus.issues,
      recommendation: 'Contact support to resolve payment configuration'
    })
  }

  try {
    const stripe = getStripeClient()
    const { plan, successUrl, cancelUrl, customerEmail, metadata = {} }: CheckoutRequest = req.body

    // Validate input
    if (!plan || !PRICING_CONFIG[plan]) {
      return res.status(400).json({ error: 'Invalid plan selected' })
    }

    if (!successUrl || !cancelUrl) {
      return res.status(400).json({ error: 'Success and cancel URLs are required' })
    }

    // Validate URLs
    try {
      new URL(successUrl)
      new URL(cancelUrl)
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URLs provided' })
    }

    const planConfig = PRICING_CONFIG[plan]

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment', // One-time payment
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: planConfig.name,
              description: `DirectoryBolt ${planConfig.name} - AI Business Intelligence Analysis`,
              images: ['https://directorybolt.com/logo-stripe.png'], // Add your logo URL
              metadata: {
                plan: plan,
                features: planConfig.features.join(', ')
              }
            },
            unit_amount: planConfig.amount,
          },
          quantity: 1,
        },
      ],
      customer_email: customerEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        plan: plan,
        planName: planConfig.name,
        amount: planConfig.amount.toString(),
        timestamp: new Date().toISOString(),
        ...metadata
      },
      payment_intent_data: {
        metadata: {
          plan: plan,
          planName: planConfig.name,
          ...metadata
        }
      },
      // Enhanced checkout configuration
      billing_address_collection: 'auto',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'ES', 'IT', 'NL', 'SE', 'NO', 'DK', 'FI']
      },
      phone_number_collection: {
        enabled: true
      },
      custom_text: {
        submit: {
          message: 'Complete your AI Business Intelligence purchase and receive your analysis within 48 hours.'
        }
      },
      // Automatic tax calculation (if enabled in Stripe)
      automatic_tax: {
        enabled: true
      },
      // Invoice creation for business customers
      invoice_creation: {
        enabled: true,
        invoice_data: {
          description: `DirectoryBolt ${planConfig.name} - AI Business Intelligence Analysis`,
          metadata: {
            plan: plan,
            planName: planConfig.name
          },
          custom_fields: [
            {
              name: 'Analysis Type',
              value: planConfig.name
            },
            {
              name: 'Delivery Timeline',
              value: '48 hours'
            }
          ]
        }
      },
      // Consent collection
      consent_collection: {
        terms_of_service: 'required'
      },
      // Customer creation
      customer_creation: 'always',
      // Expires in 24 hours
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    })

    logger.info('Stripe checkout session created', {
      metadata: {
        sessionId: session.id,
        plan: plan,
        amount: planConfig.amount,
        customerEmail: customerEmail || 'not provided'
      }
    })

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
      plan: plan,
      planName: planConfig.name,
      amount: planConfig.amount,
      features: planConfig.features
    })

  } catch (error) {
    logger.error('Stripe checkout session creation failed', {}, error as Error)
    
    if (error instanceof Stripe.errors.StripeError) {
      return res.status(400).json({
        error: 'Payment processing error',
        message: error.message,
        type: error.type
      })
    }
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create checkout session'
    })
  }
}

// Export pricing config for use in other components
export { PRICING_CONFIG }