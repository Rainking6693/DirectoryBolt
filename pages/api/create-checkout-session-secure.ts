// 🔒 SECURE STRIPE CHECKOUT SESSION
// Enhanced checkout with CSRF protection and security monitoring

import { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { withCSRFProtection } from '../../lib/security/csrf-protection'
import { withSecurityMonitoring, securityMonitor } from '../../lib/security/security-monitoring'
import { PRICING_TIERS, STRIPE_PRICE_IDS, getTier } from '../../lib/config/pricing'

// Initialize Stripe with environment variable only (secure)
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('STRIPE_SECRET_KEY environment variable is required')
  throw new Error('Stripe configuration error - contact support')
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-08-16',
})

// Use centralized pricing configuration
const PRICING = {
  plans: Object.fromEntries(
    Object.entries(PRICING_TIERS).map(([key, tier]) => [
      key,
      {
        name: `${tier.name} Plan`,
        amount: tier.price * 100, // Convert to cents
        description: tier.description,
        directories: tier.directories,
        features: tier.features.slice(0, 4) // Top 4 features for description
      }
    ])
  )
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const requestId = `secure_checkout_${Date.now()}`
  
  try {
    // Validate request body
    const validation = validateCheckoutRequest(req.body)
    if (!validation.isValid) {
      securityMonitor.logEvent(
        'suspicious_request',
        'medium',
        req,
        { reason: 'invalid_checkout_request', error: validation.error }
      )
      
      return res.status(400).json({ 
        success: false,
        error: validation.error 
      })
    }

    const { 
      plan, 
      addons = [], 
      customerEmail = '',
      successUrl,
      cancelUrl
    } = req.body

    // Security: Validate plan exists
    const selectedPlan = PRICING.plans[plan as keyof typeof PRICING.plans]
    if (!selectedPlan) {
      securityMonitor.logEvent(
        'suspicious_request',
        'medium',
        req,
        { reason: 'invalid_plan_selection', plan }
      )
      
      return res.status(400).json({ 
        success: false,
        error: 'Invalid plan selected',
        availablePlans: Object.keys(PRICING.plans)
      })
    }

    // Skip addon validation for now - addons not implemented in PRICING

    // Set secure default URLs
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://directorybolt.com' 
      : 'http://localhost:3000'
      
    const defaultSuccessUrl = `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&plan=${plan}`
    const defaultCancelUrl = `${baseUrl}/pricing?cancelled=true&plan=${plan}`
    
    const finalSuccessUrl = successUrl || defaultSuccessUrl
    const finalCancelUrl = cancelUrl || defaultCancelUrl

    // Build line items array
    const lineItems = []
    
    // Add main plan
    lineItems.push({
      price_data: {
        currency: 'usd',
        unit_amount: selectedPlan.amount,
        product_data: {
          name: selectedPlan.name,
          description: selectedPlan.description,
          metadata: {
            directories: selectedPlan.directories.toString(),
            features: selectedPlan.features.join(', ')
          }
        }
      },
      quantity: 1
    })

    // Skip addons for now - not implemented in current PRICING structure

    // Calculate total amount
    const totalAmount = lineItems.reduce((sum, item) => 
      sum + (item.price_data.unit_amount * item.quantity), 0
    )

    // Security: Check for unusual amounts
    if (totalAmount > 200000) { // $2000+
      securityMonitor.logEvent(
        'payment_anomaly',
        'high',
        req,
        { reason: 'unusual_amount', amount: totalAmount, plan, addons }
      )
    }

    // Create secure checkout session
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        plan: plan,
        addons: addons.join(','),
        requestId: requestId,
        securityVersion: '2.0'
      },
      // Security enhancements
      payment_intent_data: {
        metadata: {
          plan: plan,
          requestId: requestId,
          securityCheck: 'passed'
        }
      },
      // Billing address collection for fraud prevention
      billing_address_collection: 'required'
    }

    // Add customer email if provided
    if (customerEmail && isValidEmail(customerEmail)) {
      sessionConfig.customer_email = customerEmail
    }

    // Create the session
    const session = await stripe.checkout.sessions.create(sessionConfig)

    // Security logging
    securityMonitor.logEvent(
      'api_key_usage',
      'low',
      req,
      {
        operation: 'create_checkout_session',
        plan: plan,
        amount: totalAmount,
        sessionId: session.id
      }
    )

    console.log('✅ Secure checkout session created', {
      sessionId: session.id,
      requestId,
      plan: selectedPlan.name,
      totalAmount: totalAmount / 100
    })

    // Validate session creation
    if (!session.id || !session.url) {
      throw new Error('Stripe session created but missing required fields')
    }

    // Return secure response
    return res.status(200).json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
      totalAmount: totalAmount / 100,
      requestId,
      plan: {
        name: selectedPlan.name,
        directories: selectedPlan.directories,
        features: selectedPlan.features
      },
      addons: [], // Skipping addons for now
      security: {
        csrfProtected: true,
        monitored: true,
        version: '2.0'
      }
    })

  } catch (error) {
    console.error('❌ Secure checkout session error', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    // Security logging for errors
    securityMonitor.logEvent(
      'suspicious_request',
      'high',
      req,
      { 
        reason: 'checkout_session_error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        requestId 
      }
    )

    // Return secure error response
    return res.status(500).json({
      success: false,
      error: 'Failed to create checkout session',
      requestId,
      support: 'Contact support if this issue persists'
    })
  }
}

/**
 * Validate checkout request
 */
function validateCheckoutRequest(body: any): { isValid: boolean; error?: string } {
  if (!body) {
    return { isValid: false, error: 'Request body is required' }
  }

  if (!body.plan) {
    return { isValid: false, error: 'Plan selection is required' }
  }

  if (typeof body.plan !== 'string') {
    return { isValid: false, error: 'Plan must be a string' }
  }

  if (body.addons && !Array.isArray(body.addons)) {
    return { isValid: false, error: 'Addons must be an array' }
  }

  if (body.customerEmail && !isValidEmail(body.customerEmail)) {
    return { isValid: false, error: 'Invalid email format' }
  }

  // Security: Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\(/i
  ]

  const bodyString = JSON.stringify(body)
  if (suspiciousPatterns.some(pattern => pattern.test(bodyString))) {
    return { isValid: false, error: 'Invalid request content' }
  }

  return { isValid: true }
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

// Export with security middleware
export default withCSRFProtection(withSecurityMonitoring(handler))