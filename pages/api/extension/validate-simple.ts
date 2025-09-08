/**
 * SIMPLIFIED Extension Customer Validation API
 * Validates extension users without complex rate limiting
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createAirtableService } from '../../../lib/services/airtable'

interface ValidationRequest {
  customerId: string
  extensionVersion: string
  timestamp: number
}

interface ValidationResponse {
  valid: boolean
  customerName?: string
  packageType?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ValidationResponse>
) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      valid: false,
      error: 'Method not allowed. Use POST.'
    })
  }

  try {
    console.log('🔍 Extension validation request received')
    console.log('Request body:', req.body)

    const { customerId, extensionVersion, timestamp }: ValidationRequest = req.body

    // Validate request data
    if (!customerId) {
      console.log('❌ Missing customer ID')
      return res.status(400).json({
        valid: false,
        error: 'Customer ID is required'
      })
    }

    // Accept both DIR- and DB- prefixes
    if (!customerId.startsWith('DIR-') && !customerId.startsWith('DB-')) {
      console.log('❌ Invalid customer ID format:', customerId)
      return res.status(400).json({
        valid: false,
        error: 'Invalid Customer ID format. Must start with DIR- or DB-'
      })
    }

    console.log('🔍 Looking up customer:', customerId)

    // Validate customer with Airtable
    const airtableService = createAirtableService()
    const customer = await airtableService.findByCustomerId(customerId)

    if (!customer) {
      console.log(`❌ Customer not found: ${customerId}`)
      return res.status(401).json({
        valid: false,
        error: 'Customer not found'
      })
    }

    console.log('✅ Customer found:', {
      customerId: customer.customerId,
      businessName: customer.businessName,
      status: customer.submissionStatus,
      packageType: customer.packageType
    })

    // Check customer status - be more lenient
    const validStatuses = ['pending', 'in-progress', 'completed', 'failed']
    if (customer.submissionStatus && !validStatuses.includes(customer.submissionStatus)) {
      console.log(`❌ Invalid customer status: ${customer.submissionStatus}`)
      return res.status(401).json({
        valid: false,
        error: 'Customer account status is invalid'
      })
    }

    // Check if customer has package type - be more lenient
    if (!customer.packageType) {
      console.log(`⚠️ Customer has no package type, but allowing: ${customerId}`)
      // Don't fail, just warn
    }

    // Log successful validation
    console.log(`✅ Extension validation successful: ${customer.businessName} (${customerId})`)

    // Return success response
    return res.status(200).json({
      valid: true,
      customerName: customer.businessName || customer.firstName + ' ' + customer.lastName,
      packageType: customer.packageType || 'basic'
    })

  } catch (error) {
    console.error('❌ Extension validation error:', error)
    
    return res.status(500).json({
      valid: false,
      error: 'Internal server error'
    })
  }
}