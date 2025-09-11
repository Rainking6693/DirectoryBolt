import { NextApiRequest, NextApiResponse } from 'next'
import { verifyAdminAuth } from '../../../lib/auth/admin-auth'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // SECURITY FIX: Require admin authentication for sensitive config access
  if (!(await verifyAdminAuth(req, res))) {
    return // Response already sent by verifyAdminAuth
  }

  try {
    // Check critical environment variables
    const configStatus = {
      airtable: {
        configured: !!(process.env.AIRTABLE_ACCESS_TOKEN && 
                      !process.env.AIRTABLE_ACCESS_TOKEN.includes('your_airtable')),
        baseId: !!process.env.AIRTABLE_BASE_ID,
        tableName: !!process.env.AIRTABLE_TABLE_NAME,
        status: 'unknown'
      },
      stripe: {
        configured: !!(process.env.STRIPE_SECRET_KEY && 
                      !process.env.STRIPE_SECRET_KEY.includes('your_stripe')),
        publishableKey: !!(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && 
                          !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.includes('your_stripe')),
        status: 'unknown'
      },
      openai: {
        configured: !!(process.env.OPENAI_API_KEY && 
                      !process.env.OPENAI_API_KEY.includes('your_openai')),
        status: 'unknown'
      }
    }

    // Determine overall status
    configStatus.airtable.status = configStatus.airtable.configured ? 'configured' : 'missing'
    configStatus.stripe.status = configStatus.stripe.configured ? 'configured' : 'missing'
    configStatus.openai.status = configStatus.openai.configured ? 'configured' : 'missing'

    const overallStatus = {
      ready: configStatus.airtable.configured && configStatus.stripe.configured,
      issues: [],
      recommendations: []
    }

    if (!configStatus.airtable.configured) {
      overallStatus.issues.push('Airtable access token not configured')
      overallStatus.recommendations.push('Set AIRTABLE_ACCESS_TOKEN in .env.local')
    }

    if (!configStatus.stripe.configured) {
      overallStatus.issues.push('Stripe keys not configured')
      overallStatus.recommendations.push('Set STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY in .env.local')
    }

    if (!configStatus.openai.configured) {
      overallStatus.issues.push('OpenAI API key not configured')
      overallStatus.recommendations.push('Set OPENAI_API_KEY in .env.local')
    }

    res.status(200).json({
      success: true,
      data: {
        overall: overallStatus,
        services: configStatus,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Configuration check failed:', error)
    res.status(500).json({
      success: false,
      error: 'Configuration check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}