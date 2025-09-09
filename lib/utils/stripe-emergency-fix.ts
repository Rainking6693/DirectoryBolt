/**
 * EMERGENCY STRIPE CONFIGURATION FIX
 * Provides fallback configuration when environment variables are missing
 */

import Stripe from 'stripe'

export interface EmergencyStripeConfig {
  isConfigured: boolean
  hasValidKeys: boolean
  missingVariables: string[]
  stripe?: Stripe
  errorMessage?: string
}

/**
 * Emergency Stripe client that handles missing configuration gracefully
 */
export function getEmergencyStripeClient(): EmergencyStripeConfig {
  const missingVariables: string[] = []
  
  // Check required environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    missingVariables.push('STRIPE_SECRET_KEY')
  }
  
  if (!process.env.STRIPE_STARTER_PRICE_ID) {
    missingVariables.push('STRIPE_STARTER_PRICE_ID')
  }
  
  if (!process.env.STRIPE_GROWTH_PRICE_ID) {
    missingVariables.push('STRIPE_GROWTH_PRICE_ID')
  }
  
  if (!process.env.STRIPE_PROFESSIONAL_PRICE_ID) {
    missingVariables.push('STRIPE_PROFESSIONAL_PRICE_ID')
  }

  // If critical variables are missing, return error state
  if (missingVariables.length > 0) {
    return {
      isConfigured: false,
      hasValidKeys: false,
      missingVariables,
      errorMessage: `Missing required Stripe environment variables: ${missingVariables.join(', ')}`
    }
  }

  // Validate key format
  const secretKey = process.env.STRIPE_SECRET_KEY!
  if (!secretKey.startsWith('sk_')) {
    return {
      isConfigured: false,
      hasValidKeys: false,
      missingVariables: [],
      errorMessage: 'STRIPE_SECRET_KEY has invalid format (must start with sk_)'
    }
  }

  // Create Stripe client
  try {
    const stripe = new Stripe(secretKey, {
      apiVersion: '2023-08-16',
      typescript: true,
      timeout: 10000,
      maxNetworkRetries: 3,
    })

    return {
      isConfigured: true,
      hasValidKeys: true,
      missingVariables: [],
      stripe
    }
  } catch (error) {
    return {
      isConfigured: false,
      hasValidKeys: false,
      missingVariables: [],
      errorMessage: `Failed to initialize Stripe: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Emergency pricing configuration with fallbacks
 */
export function getEmergencyPricingConfig() {
  return {
    starter: {
      priceId: process.env.STRIPE_STARTER_PRICE_ID || 'price_missing_starter',
      name: 'Starter Intelligence',
      amount: 14900,
      features: [
        'AI Business Profile Analysis',
        '100 Directory Opportunities',
        'Basic SEO Analysis',
        'PDF Export',
        'Email Support'
      ]
    },
    growth: {
      priceId: process.env.STRIPE_GROWTH_PRICE_ID || 'price_missing_growth',
      name: 'Growth Intelligence',
      amount: 29900,
      features: [
        'Complete AI Business Intelligence',
        '250+ Directory Opportunities',
        'Competitive Analysis',
        'Revenue Projections',
        'Priority Support',
        'CSV Export'
      ]
    },
    professional: {
      priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_missing_professional',
      name: 'Professional Intelligence',
      amount: 49900,
      features: [
        'Advanced AI Analysis',
        '400+ Directory Opportunities',
        'Market Insights',
        'White-label Reports',
        'Phone Support',
        'Custom Integrations'
      ]
    },
    enterprise: {
      priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_missing_enterprise',
      name: 'Enterprise Intelligence',
      amount: 79900,
      features: [
        'Enterprise AI Suite',
        '500+ Directory Opportunities',
        'Dedicated Account Manager',
        'Custom Analysis',
        'API Access',
        'Priority Processing'
      ]
    }
  }
}

/**
 * Check if payment system is properly configured
 */
export function isPaymentSystemConfigured(): {
  configured: boolean
  issues: string[]
  canProcessPayments: boolean
} {
  const config = getEmergencyStripeClient()
  const issues: string[] = []

  if (!config.isConfigured) {
    issues.push(config.errorMessage || 'Stripe not configured')
  }

  if (config.missingVariables.length > 0) {
    issues.push(`Missing environment variables: ${config.missingVariables.join(', ')}`)
  }

  // Check for placeholder values
  const pricing = getEmergencyPricingConfig()
  Object.entries(pricing).forEach(([plan, config]) => {
    if (config.priceId.includes('missing')) {
      issues.push(`${plan} price ID not configured`)
    }
  })

  return {
    configured: config.isConfigured && issues.length === 0,
    issues,
    canProcessPayments: config.isConfigured && config.hasValidKeys
  }
}