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
        google_sheets: {
          sheet_id: !!process.env.GOOGLE_SHEET_ID,
          service_account_email: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: !!process.env.GOOGLE_PRIVATE_KEY
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
        google_sheets_connection: false
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

    // Check Google Sheets Configuration
    try {
      if (!process.env.GOOGLE_SHEET_ID) {
        status.critical_issues.push('GOOGLE_SHEET_ID is missing')
      }
      if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
        status.critical_issues.push('GOOGLE_SERVICE_ACCOUNT_EMAIL is missing')
      }
      if (!process.env.GOOGLE_PRIVATE_KEY) {
        status.critical_issues.push('GOOGLE_PRIVATE_KEY is missing')
      }
      
      if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        status.api_endpoints.google_sheets_connection = true
      }
    } catch (error) {
      status.critical_issues.push(`Google Sheets configuration error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Test Extension Validation
    try {
      if (status.api_endpoints.google_sheets_connection) {
        status.api_endpoints.extension_validation = true
      } else {
        status.critical_issues.push('Extension validation will fail - Google Sheets not configured')
      }
    } catch (error) {
      status.critical_issues.push(`Extension validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Generate Recommendations
    if (status.critical_issues.length > 0) {
      status.recommendations.push('Set missing environment variables in Netlify dashboard')
      status.recommendations.push('Verify Stripe account is properly configured')
      status.recommendations.push('Check Google Sheets service account credentials are valid')
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