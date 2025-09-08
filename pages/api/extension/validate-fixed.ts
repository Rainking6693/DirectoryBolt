/**
 * FIXED Extension Customer Validation API
 * Bulletproof validation with comprehensive error handling and debugging
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
      hasAirtableToken: !!process.env.AIRTABLE_ACCESS_TOKEN || !!process.env.AIRTABLE_API_KEY,
      hasBaseId: !!process.env.AIRTABLE_BASE_ID,
      hasTableName: !!process.env.AIRTABLE_TABLE_NAME
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

    // Accept both DIR- and DB- prefixes
    if (!customerId.startsWith('DIR-') && !customerId.startsWith('DB-')) {
      console.log('❌ Invalid customer ID format:', customerId)
      return res.status(400).json({
        valid: false,
        error: 'Invalid Customer ID format. Must start with DIR- or DB-',
        debug: debugInfo
      })
    }

    console.log('🔍 Looking up customer:', customerId)
    debugInfo.customerId = customerId

    // Try to import and use Airtable service with comprehensive error handling
    try {
      const { createAirtableService } = await import('../../../lib/services/airtable')
      console.log('✅ Airtable service imported successfully')
      
      const airtableService = createAirtableService()
      console.log('✅ Airtable service created successfully')
      
      // Test health check first
      const healthCheck = await airtableService.healthCheck()
      console.log('🔍 Airtable health check:', healthCheck)
      debugInfo.healthCheck = healthCheck
      
      if (!healthCheck) {
        throw new Error('Airtable health check failed')
      }
      
      // Find customer
      const customer = await airtableService.findByCustomerId(customerId)
      debugInfo.customerFound = !!customer
      
      if (!customer) {
        console.log(`❌ Customer not found: ${customerId}`)
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

    } catch (airtableError) {
      console.error('❌ Airtable service error:', airtableError)
      debugInfo.airtableError = airtableError instanceof Error ? airtableError.message : String(airtableError)
      
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