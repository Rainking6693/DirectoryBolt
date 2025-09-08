/**
 * DEBUG Extension Customer Validation API
 * Comprehensive debugging for extension authentication issues
 */

import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    console.log('🔍 DEBUG: Extension validation debug request')
    console.log('Method:', req.method)
    console.log('Headers:', req.headers)
    console.log('Body:', req.body)
    console.log('Query:', req.query)

    // Check environment variables
    const envCheck = {
      AIRTABLE_ACCESS_TOKEN: !!process.env.AIRTABLE_ACCESS_TOKEN,
      AIRTABLE_API_KEY: !!process.env.AIRTABLE_API_KEY,
      AIRTABLE_BASE_ID: !!process.env.AIRTABLE_BASE_ID,
      AIRTABLE_TABLE_NAME: !!process.env.AIRTABLE_TABLE_NAME,
      NODE_ENV: process.env.NODE_ENV
    }

    console.log('🔍 Environment variables:', envCheck)

    // Test Airtable import
    let airtableImportError = null
    let airtableServiceError = null
    
    try {
      const { createAirtableService } = await import('../../../lib/services/airtable')
      console.log('✅ Airtable service imported successfully')
      
      try {
        const airtableService = createAirtableService()
        console.log('✅ Airtable service created successfully')
        
        // Test health check
        const healthCheck = await airtableService.healthCheck()
        console.log('🔍 Airtable health check:', healthCheck)
        
      } catch (serviceError) {
        console.error('❌ Airtable service creation failed:', serviceError)
        airtableServiceError = serviceError instanceof Error ? serviceError.message : String(serviceError)
      }
      
    } catch (importError) {
      console.error('❌ Airtable import failed:', importError)
      airtableImportError = importError instanceof Error ? importError.message : String(importError)
    }

    // Test customer ID if provided
    let customerTestResult = null
    const { customerId } = req.method === 'GET' ? req.query : req.body
    
    if (customerId) {
      console.log('🔍 Testing Customer ID:', customerId)
      
      try {
        const { createAirtableService } = await import('../../../lib/services/airtable')
        const airtableService = createAirtableService()
        const customer = await airtableService.findByCustomerId(customerId as string)
        
        customerTestResult = {
          found: !!customer,
          customerId: customer?.customerId,
          businessName: customer?.businessName,
          packageType: customer?.packageType,
          submissionStatus: customer?.submissionStatus
        }
        
        console.log('🔍 Customer test result:', customerTestResult)
        
      } catch (testError) {
        console.error('❌ Customer test failed:', testError)
        customerTestResult = {
          error: testError instanceof Error ? testError.message : String(testError)
        }
      }
    }

    return res.status(200).json({
      debug: true,
      timestamp: new Date().toISOString(),
      environment: envCheck,
      airtableImportError,
      airtableServiceError,
      customerTestResult,
      request: {
        method: req.method,
        hasBody: !!req.body,
        bodyKeys: req.body ? Object.keys(req.body) : [],
        queryKeys: Object.keys(req.query)
      }
    })

  } catch (error) {
    console.error('❌ Debug API error:', error)
    
    return res.status(500).json({
      debug: true,
      error: 'Debug API failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}