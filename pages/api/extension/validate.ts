/**
 * Extension Customer Validation API
 * Validates that extension users are paying DirectoryBolt customers
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createAirtableService } from '../../../lib/services/airtable'
import { enhancedRateLimit, getClientIP, determineUserTier } from '../../../lib/utils/enhanced-rate-limit'

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
  if (req.method !== 'POST') {
    return res.status(405).json({
      valid: false,
      error: 'Method not allowed. Use POST.'
    })
  }

  try {
    // Apply rate limiting
    const ipAddress = getClientIP(req)
    const userTier = determineUserTier(null, null)
    
    const rateLimitResult = await enhancedRateLimit.checkRateLimit({
      ipAddress,
      userAgent: req.headers['user-agent'] || 'unknown',
      endpoint: '/api/extension/validate',
      tier: userTier,
      timestamp: Date.now()
    })

    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        valid: false,
        error: 'Rate limit exceeded'
      })
    }

    const { customerId, extensionVersion, timestamp }: ValidationRequest = req.body

    // Validate request data
    if (!customerId) {
      return res.status(400).json({
        valid: false,
        error: 'Customer ID is required'
      })
    }

    if (!extensionVersion) {
      return res.status(400).json({
        valid: false,
        error: 'Extension version is required'
      })
    }

    // Check timestamp to prevent replay attacks
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5 minutes
    
    if (!timestamp || Math.abs(now - timestamp) > maxAge) {
      return res.status(400).json({
        valid: false,
        error: 'Invalid or expired timestamp'
      })
    }

    // Validate customer with Airtable
    const airtableService = createAirtableService()
    const customer = await airtableService.findByCustomerId(customerId)

    if (!customer) {
      console.log(`❌ Extension validation failed: Customer ${customerId} not found`)
      return res.status(401).json({
        valid: false,
        error: 'Customer not found'
      })
    }

    // Check customer status
    const validStatuses = ['pending', 'in-progress', 'completed']
    if (!validStatuses.includes(customer.submissionStatus)) {
      console.log(`❌ Extension validation failed: Customer ${customerId} has invalid status: ${customer.submissionStatus}`)
      return res.status(401).json({
        valid: false,
        error: 'Customer account is not active'
      })
    }

    // Check if customer has paid (has a package type)
    if (!customer.packageType) {
      console.log(`❌ Extension validation failed: Customer ${customerId} has no package`)
      return res.status(401).json({
        valid: false,
        error: 'No active package found'
      })
    }

    // Log successful validation
    console.log(`✅ Extension validation successful: ${customer.businessName} (${customerId})`)

    // Return success response
    return res.status(200).json({
      valid: true,
      customerName: customer.businessName,
      packageType: customer.packageType
    })

  } catch (error) {
    console.error('❌ Extension validation error:', error)
    
    return res.status(500).json({
      valid: false,
      error: 'Internal server error'
    })
  }
}