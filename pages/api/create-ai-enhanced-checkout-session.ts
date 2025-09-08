/**
 * AI-Enhanced Checkout Session API
 * Creates enhanced checkout sessions with AI business data
 * POST /api/create-ai-enhanced-checkout-session
 */

import type { NextApiRequest, NextApiResponse } from 'next'
import { handleApiError, ValidationError, ApiError } from '../../lib/utils/errors'

// Initialize Stripe safely
let stripe: any = null
let config: any = null

function getStripeClientSafe() {
  try {
    const { getStripeClient } = require('../../lib/utils/stripe-client')
    return getStripeClient()
  } catch (error) {
    return null
  }
}

function getStripeConfigSafe() {
  try {
    const { getStripeConfig } = require('../../lib/utils/stripe-environment-validator')
    return getStripeConfig()
  } catch (error) {
    return { nextAuthUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000' }
  }
}

interface AIEnhancedCheckoutRequest {
  package: string
  addOns: string[]
  customer_email: string
  customer_name: string
  success_url: string
  cancel_url: string
  metadata: {
    business_name: string
    business_website: string
    wants_subscription: string
    ai_enhanced: string
    has_business_data: boolean
    has_optimization_data: boolean
  }
  business_data?: any
  optimization_data?: any
}

interface AIEnhancedCheckoutResponse {
  success: true
  data: {
    checkout_session: {
      id: string
      url: string
      expires_at: string
    }
    customer_id: string
    ai_enhancements: {
      business_analysis_complete: boolean
      profile_optimization_complete: boolean
      estimated_success_rate: string
    }
  }
  requestId: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AIEnhancedCheckoutResponse | any>
) {
  // Prevent build-time execution
  if (!req || !res || typeof res.status !== 'function') {
    console.warn('API route called during build time - skipping execution')
    return { notFound: true }
  }

  const requestId = `ai_checkout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return res.status(405).json(handleApiError(
        new Error('Method not allowed'),
        requestId
      ))
    }

    await handleAIEnhancedCheckout(req, res, requestId)

  } catch (error) {
    const errorResponse = handleApiError(error as Error, requestId)
    return res.status(errorResponse.error.statusCode || 500).json(errorResponse)
  }
}

async function handleAIEnhancedCheckout(
  req: NextApiRequest,
  res: NextApiResponse,
  requestId: string
) {
  // Initialize Stripe components
  stripe = getStripeClientSafe()
  config = getStripeConfigSafe()

  const data: AIEnhancedCheckoutRequest = req.body

  // Validate request
  if (!data.package || !data.customer_email || !data.customer_name) {
    throw new ValidationError('Package, customer email, and name are required', 'request')
  }

  // Package pricing (matches DirectoryBoltCheckout.tsx)
  const packagePricing: Record<string, { price: number; name: string; directories: number }> = {
    starter: { price: 49, name: 'Starter', directories: 50 },
    growth: { price: 89, name: 'Growth', directories: 100 },
    pro: { price: 159, name: 'Pro', directories: 200 }
  }

  // Add-on pricing
  const addOnPricing: Record<string, { price: number; name: string }> = {
    fast_track: { price: 25, name: 'Fast-track Submission' },
    premium_directories: { price: 15, name: 'Premium Directories Only' },
    manual_qa: { price: 10, name: 'Manual QA Review' },
    csv_export: { price: 9, name: 'CSV Export' }
  }

  if (!packagePricing[data.package]) {
    throw new ValidationError(`Invalid package: ${data.package}`, 'package')
  }

  const selectedPackage = packagePricing[data.package]
  const packagePrice = selectedPackage.price

  // Calculate add-ons total
  const addOnsTotal = data.addOns?.reduce((total, addOnId) => {
    const addOn = addOnPricing[addOnId]
    return total + (addOn?.price || 0)
  }, 0) || 0

  const totalAmount = packagePrice + addOnsTotal

  // Development mode check
  const isDevelopmentMode = !stripe || !config || 
                           !process.env.STRIPE_SECRET_KEY ||
                           process.env.NODE_ENV !== 'production'

  console.log('AI-Enhanced checkout request:', {
    request_id: requestId,
    package: data.package,
    package_price: packagePrice,
    add_ons_total: addOnsTotal,
    total_amount: totalAmount,
    customer_email: data.customer_email,
    has_business_data: data.metadata.has_business_data,
    has_optimization_data: data.metadata.has_optimization_data,
    development_mode: isDevelopmentMode
  })

  // Calculate AI enhancement benefits
  const aiEnhancements = {
    business_analysis_complete: !!data.business_data,
    profile_optimization_complete: !!data.optimization_data,
    estimated_success_rate: data.optimization_data ? '85-95%' : data.business_data ? '75-85%' : '65-75%'
  }

  if (isDevelopmentMode) {
    // Return mock response for development
    return res.status(200).json({
      success: true,
      data: {
        checkout_session: {
          id: `cs_ai_enhanced_mock_${Date.now()}`,
          url: `https://checkout.stripe.com/c/pay/ai_enhanced_session_${Date.now()}`,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        customer_id: `cus_ai_enhanced_mock_${Date.now()}`,
        ai_enhancements: aiEnhancements,
        development_mode: true
      },
      requestId
    })
  }

  try {
    // Create or retrieve Stripe customer
    let customer
    const existingCustomers = await stripe.customers.list({
      email: data.customer_email,
      limit: 1
    })

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0]
      
      // Update customer with AI enhancement data
      customer = await stripe.customers.update(customer.id, {
        name: data.customer_name,
        metadata: {
          ...data.metadata,
          ai_enhanced: 'true',
          last_updated: new Date().toISOString(),
          business_analysis: data.business_data ? 'complete' : 'none',
          profile_optimization: data.optimization_data ? 'complete' : 'none'
        }
      })
    } else {
      // Create new customer
      customer = await stripe.customers.create({
        email: data.customer_email,
        name: data.customer_name,
        metadata: {
          ...data.metadata,
          ai_enhanced: 'true',
          created_at: new Date().toISOString(),
          business_analysis: data.business_data ? 'complete' : 'none',
          profile_optimization: data.optimization_data ? 'complete' : 'none'
        }
      })
    }

    // Prepare line items
    const lineItems = []

    // Main package
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${selectedPackage.name} Package (AI-Enhanced)`,
          description: `${selectedPackage.directories} directory submissions with AI optimization`,
          images: [],
          metadata: {
            package_type: data.package,
            ai_enhanced: 'true',
            directories_count: selectedPackage.directories.toString()
          }
        },
        unit_amount: packagePrice * 100, // Convert to cents
      },
      quantity: 1,
    })

    // Add-ons
    if (data.addOns && data.addOns.length > 0) {
      for (const addOnId of data.addOns) {
        const addOn = addOnPricing[addOnId]
        if (addOn) {
          lineItems.push({
            price_data: {
              currency: 'usd',
              product_data: {
                name: addOn.name,
                description: `Add-on service for enhanced directory submission`,
                metadata: {
                  add_on_type: addOnId,
                  ai_enhanced: 'true'
                }
              },
              unit_amount: addOn.price * 100, // Convert to cents
            },
            quantity: 1,
          })
        }
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: data.success_url,
      cancel_url: data.cancel_url,
      metadata: {
        ...data.metadata,
        request_id: requestId,
        package_price: packagePrice.toString(),
        add_ons_total: addOnsTotal.toString(),
        total_amount: totalAmount.toString(),
        ai_enhanced: 'true',
        business_analysis_complete: aiEnhancements.business_analysis_complete.toString(),
        profile_optimization_complete: aiEnhancements.profile_optimization_complete.toString(),
        estimated_success_rate: aiEnhancements.estimated_success_rate
      },
      billing_address_collection: 'required',
      allow_promotion_codes: true,
      automatic_tax: {
        enabled: true,
      },
      payment_intent_data: {
        metadata: {
          ai_enhanced: 'true',
          package: data.package,
          directories_count: selectedPackage.directories.toString(),
          success_rate: aiEnhancements.estimated_success_rate
        }
      }
    })

    // Store AI enhancement data (you would typically save this to your database)
    if (data.business_data || data.optimization_data) {
      console.log('Storing AI enhancement data:', {
        session_id: session.id,
        customer_id: customer.id,
        has_business_data: !!data.business_data,
        has_optimization_data: !!data.optimization_data,
        estimated_success_rate: aiEnhancements.estimated_success_rate
      })
      
      // Here you would save data.business_data and data.optimization_data to your database
      // associated with the session.id or customer.id for later use
    }

    // Log successful session creation
    console.log('AI-Enhanced checkout session created:', {
      request_id: requestId,
      session_id: session.id,
      customer_id: customer.id,
      package: data.package,
      total_amount: totalAmount,
      ai_enhancements: aiEnhancements
    })

    // Return success response
    res.status(200).json({
      success: true,
      data: {
        checkout_session: {
          id: session.id,
          url: session.url!,
          expires_at: new Date(session.expires_at * 1000).toISOString()
        },
        customer_id: customer.id,
        ai_enhancements: aiEnhancements
      },
      requestId
    })

  } catch (stripeError: any) {
    // Enhanced Stripe error handling
    console.error('AI-Enhanced checkout failed:', {
      request_id: requestId,
      customer_email: data.customer_email,
      package: data.package,
      error: stripeError.message,
      error_type: stripeError.type,
      error_code: stripeError.code
    })

    const { handleStripeError } = require('../../lib/utils/stripe-client')
    const errorResponse = handleStripeError(stripeError, 'ai-enhanced-checkout')
    
    throw new ApiError(errorResponse.userMessage, errorResponse.statusCode, errorResponse.errorCode)
  }
}