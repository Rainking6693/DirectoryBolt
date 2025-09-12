/**
 * CLIVE - Environment Variable Debug API
 * Emergency debugging endpoint for Netlify environment variable access
 */

import { NextApiRequest, NextApiResponse } from 'next'

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
  // Security: Only allow with debug key
  const debugKey = req.query.debug_key as string
  if (debugKey !== 'CLIVE_EMERGENCY_DEBUG_2025') {
    return createResponse(res, 403, { error: 'Debug access denied' })
  }

  const envStatus = {
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NETLIFY: !!process.env.NETLIFY,
      AWS_LAMBDA_FUNCTION_NAME: !!process.env.AWS_LAMBDA_FUNCTION_NAME,
      isNetlifyFunction: isNetlifyFunction
    },
    googleSheetsConfig: {
      GOOGLE_SHEET_ID: {
        exists: !!process.env.GOOGLE_SHEET_ID,
        value: process.env.GOOGLE_SHEET_ID ? `${process.env.GOOGLE_SHEET_ID.substring(0, 10)}...` : 'MISSING'
      },
      GOOGLE_SERVICE_ACCOUNT_EMAIL: {
        exists: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        value: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || 'MISSING'
      },
      GOOGLE_PRIVATE_KEY: {
        exists: !!process.env.GOOGLE_PRIVATE_KEY,
        length: (process.env.GOOGLE_PRIVATE_KEY || '').length,
        hasHeaders: (process.env.GOOGLE_PRIVATE_KEY || '').includes('-----BEGIN PRIVATE KEY-----'),
        firstChars: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.substring(0, 50) + '...' : 'MISSING'
      }
    },
    allEnvVars: Object.keys(process.env).filter(key => 
      key.startsWith('GOOGLE_') || 
      key.startsWith('NETLIFY') || 
      key.startsWith('AWS_') ||
      key.includes('SHEET')
    ).reduce((acc, key) => {
      acc[key] = !!process.env[key]
      return acc
    }, {} as Record<string, boolean>)
  }

  console.log('🔍 CLIVE Emergency Debug - Environment Variables Status:', envStatus)

  return createResponse(res, 200, {
    success: true,
    debug: envStatus,
    message: 'Environment variable debug complete'
  })
}