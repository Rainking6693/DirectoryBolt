import { NextApiRequest, NextApiResponse } from 'next'
import { createGoogleSheetsService } from '../../../lib/services/google-sheets'

/**
 * CLIVE - Customer Validation API for Extension (Netlify Functions Compatible)
 * Validates customer authentication using Google Sheets backend
 */

// CLIVE FIX: Detect Netlify Functions context
const isNetlifyFunction = !!(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME)

// CLIVE FIX: Universal response helper for both Next.js and Netlify Functions
const createResponse = (res: NextApiResponse, statusCode: number, data: any): any => {
  if (isNetlifyFunction) {
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      },
      body: JSON.stringify(data)
    }
  } else {
    return res.status(statusCode).json(data)
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return createResponse(res, 405, { error: 'Method not allowed' })
  }

  try {
    const { customerId } = req.body

    if (!customerId) {
      return createResponse(res, 400, { error: 'Customer ID required' })
    }

    console.log('🔍 CLIVE - Validating customer with Google Sheets:', customerId)
    console.log('🔍 CLIVE Debug - Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      NETLIFY: !!process.env.NETLIFY,
      LAMBDA: !!process.env.AWS_LAMBDA_FUNCTION_NAME,
      GOOGLE_SHEET_ID: !!process.env.GOOGLE_SHEET_ID,
      GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_PRIVATE_KEY_LENGTH: (process.env.GOOGLE_PRIVATE_KEY || '').length
    })

    // CLIVE MIGRATION: Enhanced customer lookup using Google Sheets service
    const googleSheetsService = createGoogleSheetsService()
    let customer = await googleSheetsService.findByCustomerId(customerId)
    
    if (!customer) {
      // Try alternative ID formats
      const alternatives = generateAlternativeIds(customerId)
      
      for (const altId of alternatives) {
        console.log('🔄 Trying alternative ID:', altId)
        customer = await googleSheetsService.findByCustomerId(altId)
        if (customer) {
          console.log('✅ Found customer with alternative ID:', altId)
          break
        }
      }
    }

    if (customer) {
      return createResponse(res, 200, {
        success: true,
        customer: {
          customerId: customer.customerID || customer.customerId,
          businessName: customer.businessName || 'Unknown Business',
          email: customer.email || '',
          packageType: customer.packageType || 'starter',
          submissionStatus: customer.submissionStatus || 'active',
          purchaseDate: customer.purchaseDate || null
        }
      })
    }

    // CLIVE FIX: Handle test customers for development
    if (customerId.startsWith('TEST-') || customerId.startsWith('DIR-2025-001234')) {
      return createResponse(res, 200, {
        success: true,
        customer: {
          customerId: customerId,
          businessName: 'Test Business',
          email: 'test@example.com',
          packageType: '25 Directories',
          submissionStatus: 'active',
          isTestCustomer: true,
          note: 'Test customer for development'
        }
      })
    }

    // Customer not found
    console.log('❌ Customer not found:', customerId)
    return createResponse(res, 404, {
      error: 'Customer not found',
      message: 'Customer ID not found in database. Please verify your ID starts with "DIR-" or contact support.'
    })

  } catch (error) {
    console.error('💥 Customer validation error:', error)
    
    if (error.message?.includes('authentication') || error.message?.includes('401')) {
      return createResponse(res, 401, {
        error: 'Authentication failed',
        message: 'Unable to connect to customer database'
      })
    }

    return createResponse(res, 500, {
      error: 'Validation failed',
      message: 'Please try again later'
    })
  }
}

// Helper function removed - now using Google Sheets service directly

function generateAlternativeIds(customerId: string): string[] {
  const alternatives: string[] = []
  
  // Try different date formats for DIR- IDs
  if (customerId.startsWith('DIR-2025')) {
    const base = customerId.replace('DIR-2025', '')
    alternatives.push(`DIR-202509${base}`)
    alternatives.push(`DIR-20259${base}`)
    alternatives.push(`DIR-25${base}`)
  }
  
  // Try without prefix
  if (customerId.startsWith('DIR-')) {
    alternatives.push(customerId.replace('DIR-', ''))
  }
  
  // Try with DB prefix (alternative format)
  if (customerId.startsWith('DIR-')) {
    alternatives.push(customerId.replace('DIR-', 'DB-'))
  }
  
  return alternatives
}