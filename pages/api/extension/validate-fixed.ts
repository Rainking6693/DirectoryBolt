/**
 * FIXED Extension Customer Validation API
 * Bulletproof validation with comprehensive error handling and debugging
 * Updated to use Google Sheets instead of Airtable
 */

import { NextApiRequest, NextApiResponse } from 'next'

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
  debug?: any
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

  const debugInfo: any = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasGoogleSheetId: !!process.env.GOOGLE_SHEET_ID,
      hasServiceAccount: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY
    }
  }

  try {
    console.log('🔍 FIXED Extension validation request received')
    console.log('Request body:', req.body)
    console.log('Environment check:', debugInfo.environment)

    const { customerId, extensionVersion, timestamp }: ValidationRequest = req.body

    // Validate request data
    if (!customerId) {
      console.log('❌ Missing customer ID')
      return res.status(400).json({
        valid: false,
        error: 'Customer ID is required',
        debug: debugInfo
      })
    }

    // FIXED: Accept both DIR- and DB- prefixes during transition period
    if (!customerId.startsWith('DIR-') && !customerId.startsWith('DB-')) {
      return res.status(400).json({
        valid: false,
        error: 'Invalid Customer ID format. Customer ID must start with "DIR-" or "DB-"',
        details: {
          provided: customerId,
          expectedFormat: 'DIR-YYYY-XXXXXX or DB-YYYY-XXXXXX',
          example: 'DIR-2025-123ABC or DB-2025-123ABC'
        }
      })
    }

    // Normalize customer ID (trim whitespace, convert to uppercase)
    const normalizedCustomerId = customerId.trim().toUpperCase()
    debugInfo.originalCustomerId = customerId
    debugInfo.normalizedCustomerId = normalizedCustomerId
    
    console.log('🔍 Looking up customer:', normalizedCustomerId)
    debugInfo.lookupCustomerId = normalizedCustomerId

    // Try to import and use Google Sheets service with comprehensive error handling
    try {
      const { createGoogleSheetsService } = await import('../../../lib/services/google-sheets')
      console.log('✅ Google Sheets service imported successfully')
      
      const googleSheetsService = createGoogleSheetsService()
      console.log('✅ Google Sheets service created successfully')
      
      // Test health check first
      const healthCheck = await googleSheetsService.healthCheck()
      console.log('🔍 Google Sheets health check:', healthCheck)
      debugInfo.healthCheck = healthCheck
      
      if (!healthCheck) {
        throw new Error('Google Sheets health check failed - database connection issue')
      }
      
      // Find customer with normalized ID
      let customer = await googleSheetsService.findByCustomerId(normalizedCustomerId)
      debugInfo.customerFound = !!customer
      debugInfo.searchAttempts = [normalizedCustomerId]
      
      // If not found with normalized ID, try original ID
      if (!customer && normalizedCustomerId !== customerId) {
        console.log('🔍 Trying original customer ID:', customerId)
        customer = await googleSheetsService.findByCustomerId(customerId)
        debugInfo.customerFound = !!customer
        debugInfo.searchAttempts.push(customerId)
      }
      
      // If still not found, try case variations
      if (!customer) {
        const variations = [
          customerId.toLowerCase(),
          customerId.toUpperCase(),
          normalizedCustomerId.toLowerCase()
        ].filter(id => !debugInfo.searchAttempts.includes(id))
        
        for (const variation of variations) {
          console.log('🔍 Trying customer ID variation:', variation)
          customer = await googleSheetsService.findByCustomerId(variation)
          debugInfo.searchAttempts.push(variation)
          if (customer) {
            debugInfo.customerFound = true
            break
          }
        }
      }
      
      debugInfo.totalSearchAttempts = debugInfo.searchAttempts.length
      
      if (!customer) {
        console.log(`❌ Customer not found after ${debugInfo.searchAttempts.length} attempts:`, debugInfo.searchAttempts)
        return res.status(401).json({
          valid: false,
          error: 'Customer not found in database',
          debug: debugInfo
        })
      }

      console.log('✅ Customer found:', {
        customerId: customer.customerId,
        businessName: customer.businessName,
        status: customer.submissionStatus,
        packageType: customer.packageType
      })

      debugInfo.customer = {
        customerId: customer.customerId,
        businessName: customer.businessName,
        status: customer.submissionStatus,
        packageType: customer.packageType,
        hasFields: Object.keys(customer).length
      }

      // Check customer status - be more lenient
      const validStatuses = ['pending', 'in-progress', 'completed', 'failed']
      if (customer.submissionStatus && !validStatuses.includes(customer.submissionStatus)) {
        console.log(`❌ Invalid customer status: ${customer.submissionStatus}`)
        return res.status(401).json({
          valid: false,
          error: `Customer account status is invalid: ${customer.submissionStatus}`,
          debug: debugInfo
        })
      }

      // Check if customer has package type - be more lenient
      if (!customer.packageType) {
        console.log(`⚠️ Customer has no package type, but allowing: ${customerId}`)
        debugInfo.warnings = ['No package type found, using default']
      }

      // Log successful validation
      console.log(`✅ Extension validation successful: ${customer.businessName} (${customerId})`)

      // Return success response
      return res.status(200).json({
        valid: true,
        customerName: customer.businessName || `${customer.firstName} ${customer.lastName}`.trim() || 'Unknown Customer',
        packageType: customer.packageType || 'basic',
        debug: debugInfo
      })

    } catch (googleSheetsError) {
      console.error('❌ Google Sheets service error:', googleSheetsError)
      debugInfo.googleSheetsError = googleSheetsError instanceof Error ? googleSheetsError.message : String(googleSheetsError)
      
      return res.status(500).json({
        valid: false,
        error: 'Database connection failed',
        debug: debugInfo
      })
    }

  } catch (error) {
    console.error('❌ Extension validation error:', error)
    debugInfo.generalError = error instanceof Error ? error.message : String(error)
    
    return res.status(500).json({
      valid: false,
      error: 'Internal server error',
      debug: debugInfo
    })
  }
}