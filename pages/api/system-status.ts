/**
 * EMERGENCY SYSTEM STATUS API
 * Comprehensive system diagnostics for DirectoryBolt
 */

import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const status = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      
      // Environment Variables Check
      environment_variables: {
        stripe: {
          secret_key: !!process.env.STRIPE_SECRET_KEY,
          secret_key_format: process.env.STRIPE_SECRET_KEY?.startsWith('sk_') || false,
          publishable_key: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
          webhook_secret: !!process.env.STRIPE_WEBHOOK_SECRET,
          starter_price: !!process.env.STRIPE_STARTER_PRICE_ID,
          growth_price: !!process.env.STRIPE_GROWTH_PRICE_ID,
          professional_price: !!process.env.STRIPE_PROFESSIONAL_PRICE_ID,
          enterprise_price: !!process.env.STRIPE_ENTERPRISE_PRICE_ID
        },
        airtable: {
          access_token: !!process.env.AIRTABLE_ACCESS_TOKEN,
          api_key: !!process.env.AIRTABLE_API_KEY,
          base_id: !!process.env.AIRTABLE_BASE_ID,
          table_name: !!process.env.AIRTABLE_TABLE_NAME
        },
        ai: {
          openai_key: !!process.env.OPENAI_API_KEY,
          anthropic_key: !!process.env.ANTHROPIC_API_KEY
        },
        urls: {
          nextauth_url: process.env.NEXTAUTH_URL,
          base_url: process.env.BASE_URL,
          app_url: process.env.NEXT_PUBLIC_APP_URL
        }
      },

      // API Endpoints Status
      api_endpoints: {
        payment_configured: false,
        extension_validation: false,
        airtable_connection: false
      },

      // Critical Issues
      critical_issues: [],
      warnings: [],
      
      // Recommendations
      recommendations: []
    }

    // Check Stripe Configuration
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        status.critical_issues.push('STRIPE_SECRET_KEY is missing')
      } else if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
        status.critical_issues.push('STRIPE_SECRET_KEY has invalid format')
      } else {
        status.api_endpoints.payment_configured = true
      }

      if (!process.env.STRIPE_STARTER_PRICE_ID) {
        status.critical_issues.push('STRIPE_STARTER_PRICE_ID is missing')
      }
      if (!process.env.STRIPE_GROWTH_PRICE_ID) {
        status.critical_issues.push('STRIPE_GROWTH_PRICE_ID is missing')
      }
      if (!process.env.STRIPE_PROFESSIONAL_PRICE_ID) {
        status.critical_issues.push('STRIPE_PROFESSIONAL_PRICE_ID is missing')
      }

      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        status.warnings.push('STRIPE_WEBHOOK_SECRET is missing - webhooks will not work')
      }
    } catch (error) {
      status.critical_issues.push(`Stripe configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Check Airtable Configuration
    try {
      if (!process.env.AIRTABLE_ACCESS_TOKEN && !process.env.AIRTABLE_API_KEY) {
        status.critical_issues.push('AIRTABLE_ACCESS_TOKEN or AIRTABLE_API_KEY is missing')
      } else {
        status.api_endpoints.airtable_connection = true
      }

      if (!process.env.AIRTABLE_BASE_ID) {
        status.critical_issues.push('AIRTABLE_BASE_ID is missing')
      }
      if (!process.env.AIRTABLE_TABLE_NAME) {
        status.critical_issues.push('AIRTABLE_TABLE_NAME is missing')
      }
    } catch (error) {
      status.critical_issues.push(`Airtable configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Test Extension Validation
    try {
      if (status.api_endpoints.airtable_connection) {
        status.api_endpoints.extension_validation = true
      } else {
        status.critical_issues.push('Extension validation will fail - Airtable not configured')
      }
    } catch (error) {
      status.critical_issues.push(`Extension validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Generate Recommendations
    if (status.critical_issues.length > 0) {
      status.recommendations.push('Set missing environment variables in Netlify dashboard')
      status.recommendations.push('Verify Stripe account is properly configured')
      status.recommendations.push('Check Airtable Personal Access Token (PAT) is valid')
    }

    if (!status.api_endpoints.payment_configured) {
      status.recommendations.push('Payment system is not functional - customers cannot purchase')
    }

    if (!status.api_endpoints.extension_validation) {
      status.recommendations.push('Extension authentication is not functional - customers cannot use extension')
    }

    // Set appropriate status code
    const statusCode = status.critical_issues.length > 0 ? 503 : 200

    return res.status(statusCode).json(status)

  } catch (error) {
    return res.status(500).json({
      error: 'System status check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}