/**
 * STRIPE DIAGNOSTIC API
 * Quick diagnostic endpoint to verify Stripe configuration
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { getEmergencyStripeClient, isPaymentSystemConfigured } from '../../lib/utils/stripe-emergency-fix'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const timestamp = new Date().toISOString()
    
    // Check payment system configuration
    const paymentStatus = isPaymentSystemConfigured()
    
    // Check Stripe client
    const stripeConfig = getEmergencyStripeClient()
    
    // Environment variable check
    const envCheck = {
      STRIPE_SECRET_KEY: {
        present: !!process.env.STRIPE_SECRET_KEY,
        format: process.env.STRIPE_SECRET_KEY?.startsWith('sk_') || false,
        type: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 
              process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'test' : 'invalid'
      },
      STRIPE_STARTER_PRICE_ID: {
        present: !!process.env.STRIPE_STARTER_PRICE_ID,
        format: process.env.STRIPE_STARTER_PRICE_ID?.startsWith('price_') || false
      },
      STRIPE_GROWTH_PRICE_ID: {
        present: !!process.env.STRIPE_GROWTH_PRICE_ID,
        format: process.env.STRIPE_GROWTH_PRICE_ID?.startsWith('price_') || false
      },
      STRIPE_PROFESSIONAL_PRICE_ID: {
        present: !!process.env.STRIPE_PROFESSIONAL_PRICE_ID,
        format: process.env.STRIPE_PROFESSIONAL_PRICE_ID?.startsWith('price_') || false
      },
      STRIPE_WEBHOOK_SECRET: {
        present: !!process.env.STRIPE_WEBHOOK_SECRET,
        format: process.env.STRIPE_WEBHOOK_SECRET?.startsWith('whsec_') || false
      }
    }

    // Test Stripe connection if configured
    let connectionTest = null
    if (stripeConfig.isConfigured && stripeConfig.stripe) {
      try {
        // Simple test - retrieve account info
        const account = await stripeConfig.stripe.accounts.retrieve()
        connectionTest = {
          success: true,
          accountId: account.id,
          livemode: (account as any).livemode,
          country: account.country
        }
      } catch (error) {
        connectionTest = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    const diagnostic = {
      timestamp,
      status: paymentStatus.configured ? 'configured' : 'not_configured',
      
      configuration: {
        isConfigured: paymentStatus.configured,
        canProcessPayments: paymentStatus.canProcessPayments,
        issues: paymentStatus.issues
      },
      
      environment: envCheck,
      
      stripeClient: {
        initialized: stripeConfig.isConfigured,
        hasValidKeys: stripeConfig.hasValidKeys,
        errorMessage: stripeConfig.errorMessage
      },
      
      connectionTest,
      
      recommendations: []
    }

    // Generate recommendations
    if (!paymentStatus.configured) {
      diagnostic.recommendations.push('Set missing Stripe environment variables in Netlify')
    }
    
    if (!envCheck.STRIPE_SECRET_KEY.present) {
      diagnostic.recommendations.push('Add STRIPE_SECRET_KEY to Netlify environment variables')
    } else if (!envCheck.STRIPE_SECRET_KEY.format) {
      diagnostic.recommendations.push('STRIPE_SECRET_KEY must start with "sk_"')
    }
    
    if (!envCheck.STRIPE_WEBHOOK_SECRET.present) {
      diagnostic.recommendations.push('Add STRIPE_WEBHOOK_SECRET for webhook security')
    }
    
    if (connectionTest && !connectionTest.success) {
      diagnostic.recommendations.push('Verify Stripe API keys are correct and active')
    }

    // Set appropriate status code
    const statusCode = paymentStatus.configured ? 200 : 503

    return res.status(statusCode).json(diagnostic)

  } catch (error) {
    return res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Stripe diagnostic failed'
    })
  }
}