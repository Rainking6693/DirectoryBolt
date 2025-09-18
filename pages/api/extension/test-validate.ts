/**
 * SIMPLE TEST VALIDATION ENDPOINT
 * For testing authentication fixes without complexity
 */

import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Test validation endpoint called:', req.method, req.body)
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
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
    const { customerId } = req.body

    if (!customerId) {
      return res.status(400).json({
        valid: false,
        error: 'Customer ID is required'
      })
    }

    // Simple validation - accept any DIR- or DB- prefixed ID
    if (customerId.startsWith('DIR-') || customerId.startsWith('DB-')) {
      console.log('✅ Simple validation successful:', customerId)
      return res.status(200).json({
        valid: true,
        customerName: 'Test Customer',
        packageType: 'professional'
      })
    } else {
      console.log('❌ Simple validation failed:', customerId)
      return res.status(401).json({
        valid: false,
        error: 'Invalid Customer ID format'
      })
    }

  } catch (error) {
    console.error('Test validation error:', error)
    return res.status(500).json({
      valid: false,
      error: 'Internal server error'
    })
  }
}