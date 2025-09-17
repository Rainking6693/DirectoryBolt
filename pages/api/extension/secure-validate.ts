/**
 * SECURE Extension Customer Validation API
 * Server-side proxy that handles all Google Sheets communication
 * NO CREDENTIALS EXPOSED TO CLIENT
 */

import { NextApiRequest, NextApiResponse } from 'next'
const { createGoogleSheetsService } = require('../../../lib/services/google-sheets.js')

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

    // Use secure server-side Google Sheets service
    const googleSheetsService = createGoogleSheetsService()
    
    // EMILY FIX: Verify service account file or environment variables are properly configured
    const fs = require('fs')
    const path = require('path')
    const serviceAccountPath = path.join(process.cwd(), 'config', 'directorybolt-Googlesheetskey.json')
    
    let hasValidConfig = false
    let configMethod = 'unknown'
    
    if (fs.existsSync(serviceAccountPath)) {
      hasValidConfig = true
      configMethod = 'service-account-file'
      console.log('✅ SECURE: Using service account file for validation')
    } else if (process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      hasValidConfig = true
      configMethod = 'environment-variables'
      console.log('✅ SECURE: Using environment variables for validation')
    }
    
    if (!hasValidConfig) {
      console.error('❌ SECURITY ERROR: Google Sheets credentials missing - no service account file or environment variables')
      return createResponse(500, {
        valid: false,
        error: 'Server configuration error'
      })
    }
    
    console.log(`🔒 SECURE: Using ${configMethod} for Google Sheets authentication`)

    // Health check
    const healthCheck = await googleSheetsService.healthCheck()
    if (!healthCheck) {
      return createResponse(500, {
        valid: false,
        error: 'Database connection failed'
      })
    }

    // Find customer using secure server-side service
    const customer = await googleSheetsService.findByCustomerId(customerId.trim())

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