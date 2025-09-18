/**
 * SECURE Extension Customer Validation API
 * Server-side proxy that handles all Supabase communication
 * NO CREDENTIALS EXPOSED TO CLIENT
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createSupabaseService } from '../../../lib/services/supabase'
import { withRateLimit, rateLimiters } from '../../../lib/middleware/rate-limiter'

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

async function validateHandler(
  req: NextApiRequest,
  res: NextApiResponse<SecureValidationResponse>
) {
  // Detect Netlify Functions context
  const isNetlifyFunction = !!process.env.NETLIFY || !!process.env.AWS_LAMBDA_FUNCTION_NAME
  
  console.log('🔒 Secure validation API called:', {
    isNetlify: isNetlifyFunction,
    method: req.method,
    origin: req.headers.origin
  })
  
  // Create response helper
  const createResponse = (statusCode: number, data: SecureValidationResponse) => {
    if (isNetlifyFunction) {
      return {
        statusCode,
        headers: {
          'Access-Control-Allow-Origin': 'chrome-extension://*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Extension-ID',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    } else {
      // Next.js API route response
      res.setHeader('Access-Control-Allow-Origin', 'chrome-extension://*')
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Extension-ID')
      return res.status(statusCode).json(data)
    }
  }

  if (req.method === 'OPTIONS') {
    return createResponse(200, { valid: true })
  }

  if (req.method !== 'POST') {
    return createResponse(405, {
      valid: false,
      error: 'Method not allowed'
    })
  }

  try {
    const { customerId, extensionVersion }: SecureValidationRequest = req.body

    // Validate input
    if (!customerId) {
      return createResponse(400, {
        valid: false,
        error: 'Customer ID is required'
      })
    }

    // Validate customer ID format
    if (!customerId.startsWith('DIR-') && !customerId.startsWith('DB-')) {
      return createResponse(400, {
        valid: false,
        error: 'Invalid Customer ID format'
      })
    }

    console.log('🔒 SECURE: Validating customer via server-side proxy:', customerId)

    // Use secure server-side Supabase service
    const supabaseService = createSupabaseService()
    
    // Health check
    const healthCheck = await supabaseService.healthCheck()
    if (!healthCheck) {
      return createResponse(500, {
        valid: false,
        error: 'Database connection failed'
      })
    }

    // Find customer using secure server-side service
    const customer = await supabaseService.findByCustomerId(customerId.trim())

    if (!customer) {
      console.log(`❌ SECURE: Customer not found: ${customerId}`)
      return createResponse(401, {
        valid: false,
        error: 'Customer not found'
      })
    }

    console.log(`✅ SECURE: Customer validated: ${customer.businessName} (${customerId})`)

    return createResponse(200, {
      valid: true,
      customerName: customer.businessName || `${customer.firstName} ${customer.lastName}`.trim() || 'Customer',
      packageType: customer.packageType || 'basic'
    })

  } catch (error) {
    console.error('❌ SECURE: Validation error:', error)
    
    return createResponse(500, {
      valid: false,
      error: 'Internal server error'
    })
  }
}

// Export with rate limiting applied
export default withRateLimit(validateHandler, rateLimiters.extensionValidation);