/**
 * TEST API - Check if Customer ID exists in database
 * For debugging extension authentication issues
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createAirtableService } from '../../../lib/services/airtable'

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
    const { customerId } = req.method === 'GET' ? req.query : req.body

    if (!customerId) {
      return res.status(400).json({
        error: 'Customer ID is required',
        usage: 'GET /api/extension/test-customer?customerId=DB-2024-1234 or POST with customerId in body'
      })
    }

    console.log('🔍 Testing Customer ID:', customerId)

    // Check Airtable
    const airtableService = createAirtableService()
    const customer = await airtableService.findByCustomerId(customerId as string)

    if (!customer) {
      return res.status(404).json({
        found: false,
        customerId,
        message: 'Customer ID not found in Airtable database',
        suggestion: 'Check if Customer ID is correct or if customer record exists'
      })
    }

    // Return customer details for debugging
    return res.status(200).json({
      found: true,
      customerId: customer.customerId,
      businessName: customer.businessName,
      email: customer.email,
      packageType: customer.packageType,
      submissionStatus: customer.submissionStatus,
      recordId: customer.recordId,
      message: 'Customer found successfully'
    })

  } catch (error) {
    console.error('❌ Test customer API error:', error)
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: 'Check server logs for more information'
    })
  }
}