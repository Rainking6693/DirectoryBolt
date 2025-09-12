/**
 * SECURE Extension Customer Validation API
 * Server-side proxy that handles all Airtable communication
 * NO CREDENTIALS EXPOSED TO CLIENT
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createAirtableService } from '../../../lib/services/airtable'

interface SecureValidationRequest {
  customerId: string
  extensionVersion: string
}

interface SecureValidationResponse {
  valid: boolean
  customerName?: string
  packageType?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SecureValidationResponse>
) {
  // Security headers
  res.setHeader('Access-Control-Allow-Origin', 'chrome-extension://*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Extension-ID')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      valid: false,
      error: 'Method not allowed'
    })
  }

  try {
    const { customerId, extensionVersion }: SecureValidationRequest = req.body

    // Validate input
    if (!customerId) {
      return res.status(400).json({
        valid: false,
        error: 'Customer ID is required'
      })
    }

    // Validate customer ID format
    if (!customerId.startsWith('DIR-') && !customerId.startsWith('DB-')) {
      return res.status(400).json({
        valid: false,
        error: 'Invalid Customer ID format'
      })
    }

    console.log('🔒 SECURE: Validating customer via server-side proxy:', customerId)

    // Use secure server-side Airtable service
    const airtableService = createAirtableService()
    
    // Verify environment variables are properly configured
    if (!process.env.AIRTABLE_ACCESS_TOKEN && !process.env.AIRTABLE_API_KEY) {
      console.error('❌ SECURITY ERROR: No Airtable credentials in environment')
      return res.status(500).json({
        valid: false,
        error: 'Server configuration error'
      })
    }

    // Health check
    const healthCheck = await airtableService.healthCheck()
    if (!healthCheck) {
      return res.status(500).json({
        valid: false,
        error: 'Database connection failed'
      })
    }

    // Find customer using secure server-side service
    const customer = await airtableService.findByCustomerId(customerId.trim())

    if (!customer) {
      console.log(`❌ SECURE: Customer not found: ${customerId}`)
      return res.status(401).json({
        valid: false,
        error: 'Customer not found'
      })
    }

    console.log(`✅ SECURE: Customer validated: ${customer.businessName} (${customerId})`)

    return res.status(200).json({
      valid: true,
      customerName: customer.businessName || `${customer.firstName} ${customer.lastName}`.trim() || 'Customer',
      packageType: customer.packageType || 'basic'
    })

  } catch (error) {
    console.error('❌ SECURE: Validation error:', error)
    
    return res.status(500).json({
      valid: false,
      error: 'Internal server error'
    })
  }
}