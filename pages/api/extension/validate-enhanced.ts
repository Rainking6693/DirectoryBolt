/**
 * ENHANCED Extension Customer Validation API
 * Bulletproof validation with comprehensive debugging and DB prefix support
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
    },
    request: {
      method: req.method,
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : []
    }
  }

  try {
    console.log('🔍 ENHANCED Extension validation request received')
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

    // Normalize customer ID (trim whitespace, convert to uppercase)
    const normalizedCustomerId = customerId.trim().toUpperCase()
    debugInfo.originalCustomerId = customerId
    debugInfo.normalizedCustomerId = normalizedCustomerId

    // Accept both DIR- and DB- prefixes
    if (!normalizedCustomerId.startsWith('DIR-') && !normalizedCustomerId.startsWith('DB-')) {
      console.log('❌ Invalid customer ID format:', normalizedCustomerId)
      return res.status(400).json({
        valid: false,
        error: 'Invalid Customer ID format. Must start with DIR- or DB-',
        debug: debugInfo
      })
    }

    console.log('🔍 Looking up customer:', normalizedCustomerId)
    debugInfo.lookupCustomerId = normalizedCustomerId

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
        throw new Error('Airtable health check failed - database connection issue')\n      }\n      \n      // Find customer with normalized ID\n      let customer = await airtableService.findByCustomerId(normalizedCustomerId)\n      debugInfo.customerFound = !!customer\n      debugInfo.searchAttempts = [normalizedCustomerId]\n      \n      // If not found with normalized ID, try original ID\n      if (!customer && normalizedCustomerId !== customerId) {\n        console.log('🔍 Trying original customer ID:', customerId)\n        customer = await airtableService.findByCustomerId(customerId)\n        debugInfo.customerFound = !!customer\n        debugInfo.searchAttempts.push(customerId)\n      }\n      \n      // If still not found, try case variations\n      if (!customer) {\n        const variations = [\n          customerId.toLowerCase(),\n          customerId.toUpperCase(),\n          normalizedCustomerId.toLowerCase()\n        ].filter(id => !debugInfo.searchAttempts.includes(id))\n        \n        for (const variation of variations) {\n          console.log('🔍 Trying customer ID variation:', variation)\n          customer = await airtableService.findByCustomerId(variation)\n          debugInfo.searchAttempts.push(variation)\n          if (customer) {\n            debugInfo.customerFound = true\n            break\n          }\n        }\n      }\n      \n      if (!customer) {\n        console.log(`❌ Customer not found after ${debugInfo.searchAttempts.length} attempts:`, debugInfo.searchAttempts)\n        return res.status(401).json({\n          valid: false,\n          error: 'Customer not found in database',\n          debug: debugInfo\n        })\n      }\n\n      console.log('✅ Customer found:', {\n        customerId: customer.customerId,\n        businessName: customer.businessName,\n        status: customer.submissionStatus,\n        packageType: customer.packageType\n      })\n\n      debugInfo.customer = {\n        customerId: customer.customerId,\n        businessName: customer.businessName,\n        status: customer.submissionStatus,\n        packageType: customer.packageType,\n        hasFields: Object.keys(customer).length,\n        allFields: Object.keys(customer)\n      }\n\n      // Check customer status - be more lenient\n      const validStatuses = ['pending', 'in-progress', 'completed', 'failed']\n      if (customer.submissionStatus && !validStatuses.includes(customer.submissionStatus)) {\n        console.log(`❌ Invalid customer status: ${customer.submissionStatus}`)\n        return res.status(401).json({\n          valid: false,\n          error: `Customer account status is invalid: ${customer.submissionStatus}`,\n          debug: debugInfo\n        })\n      }\n\n      // Check if customer has package type - be more lenient\n      if (!customer.packageType) {\n        console.log(`⚠️ Customer has no package type, but allowing: ${customer.customerId}`)\n        debugInfo.warnings = ['No package type found, using default']\n      }\n\n      // Log successful validation\n      console.log(`✅ Extension validation successful: ${customer.businessName} (${customer.customerId})`)\n\n      // Return success response\n      return res.status(200).json({\n        valid: true,\n        customerName: customer.businessName || `${customer.firstName} ${customer.lastName}`.trim() || 'Unknown Customer',\n        packageType: customer.packageType || 'basic',\n        debug: debugInfo\n      })\n\n    } catch (airtableError) {\n      console.error('❌ Airtable service error:', airtableError)\n      debugInfo.airtableError = airtableError instanceof Error ? airtableError.message : String(airtableError)\n      debugInfo.airtableStack = airtableError instanceof Error ? airtableError.stack : undefined\n      \n      return res.status(500).json({\n        valid: false,\n        error: 'Database connection failed',\n        debug: debugInfo\n      })\n    }\n\n  } catch (error) {\n    console.error('❌ Extension validation error:', error)\n    debugInfo.generalError = error instanceof Error ? error.message : String(error)\n    debugInfo.generalStack = error instanceof Error ? error.stack : undefined\n    \n    return res.status(500).json({\n      valid: false,\n      error: 'Internal server error',\n      debug: debugInfo\n    })\n  }\n}"