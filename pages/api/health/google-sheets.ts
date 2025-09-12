/**
 * Google Sheets Health Check API for Netlify Production
 * Tests Google Sheets connection and environment variables
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createGoogleSheetsService } from '../../../lib/services/google-sheets'

interface HealthCheckResponse {
  success: boolean
  environment: string
  timestamp: string
  checks: {
    environmentVariables: {
      passed: boolean
      details: {
        GOOGLE_SHEET_ID: boolean
        GOOGLE_SERVICE_ACCOUNT_EMAIL: boolean
        GOOGLE_PRIVATE_KEY: boolean
      }
    }
    googleSheetsConnection: {
      passed: boolean
      error?: string
      details?: {
        sheetTitle?: string
        rowCount?: number
        authenticated?: boolean
      }
    }
  }
  message: string
  diagnostic?: {
    netlifyContext: boolean
    totalEnvironmentVariables: number
    googleEnvironmentVariables: string[]
    missingVariables: string[]
    nodeEnv: string
    buildId: string
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheckResponse>
) {
  // Detect Netlify Functions context
  const isNetlifyFunction = !!process.env.NETLIFY || !!process.env.AWS_LAMBDA_FUNCTION_NAME
  
  console.log('🏥 Google Sheets health check initiated:', {
    isNetlify: isNetlifyFunction,
    timestamp: new Date().toISOString()
  })

  // Create response helper
  const createResponse = (statusCode: number, data: HealthCheckResponse) => {
    if (isNetlifyFunction) {
      return {
        statusCode,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    } else {
      return res.status(statusCode).json(data)
    }
  }

  const startTime = Date.now()
  
  // Initialize response structure
  const healthCheck: HealthCheckResponse = {
    success: false,
    environment: isNetlifyFunction ? 'netlify-functions' : 'next-api',
    timestamp: new Date().toISOString(),
    checks: {
      environmentVariables: {
        passed: false,
        details: {
          GOOGLE_SHEET_ID: false,
          GOOGLE_SERVICE_ACCOUNT_EMAIL: false,
          GOOGLE_PRIVATE_KEY: false
        }
      },
      googleSheetsConnection: {
        passed: false
      }
    },
    message: ''
  }

  try {
    // Check 1: Environment Variables
    console.log('🔍 Checking environment variables...')
    
    const envChecks = {
      GOOGLE_SHEET_ID: !!process.env.GOOGLE_SHEET_ID,
      GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY
    }

    healthCheck.checks.environmentVariables.details = envChecks
    healthCheck.checks.environmentVariables.passed = Object.values(envChecks).every(Boolean)

    console.log('📋 Environment variables status:', envChecks)

    if (!healthCheck.checks.environmentVariables.passed) {
      const missingVars = Object.entries(envChecks)
        .filter(([_, exists]) => !exists)
        .map(([key]) => key)
      
      // FRANK EMERGENCY: Enhanced error message with diagnostic info
      healthCheck.message = `NETLIFY FUNCTIONS ERROR: Missing environment variables: ${missingVars.join(', ')}. 
      Environment context: ${isNetlifyFunction ? 'Netlify Functions' : 'Next.js API Routes'}. 
      Available env vars with 'GOOGLE': ${Object.keys(process.env).filter(k => k.includes('GOOGLE')).join(', ') || 'NONE'}.
      Total env vars: ${Object.keys(process.env).length}.
      This indicates environment variables are not being properly loaded in the Netlify Functions runtime.`
      
      // Add diagnostic details
      healthCheck.diagnostic = {
        netlifyContext: isNetlifyFunction,
        totalEnvironmentVariables: Object.keys(process.env).length,
        googleEnvironmentVariables: Object.keys(process.env).filter(k => k.includes('GOOGLE')),
        missingVariables: missingVars,
        nodeEnv: process.env.NODE_ENV,
        buildId: process.env.NETLIFY_BUILD_ID || 'N/A'
      }
      
      return createResponse(500, healthCheck)
    }

    // Check 2: Google Sheets Connection
    console.log('🔗 Testing Google Sheets connection...')
    
    const googleSheetsService = createGoogleSheetsService()
    
    try {
      const connectionTest = await googleSheetsService.healthCheck()
      
      if (connectionTest) {
        // Get additional details if connection is successful
        await googleSheetsService.initialize()
        
        healthCheck.checks.googleSheetsConnection = {
          passed: true,
          details: {
            sheetTitle: googleSheetsService.sheet?.title || 'Unknown',
            rowCount: googleSheetsService.sheet?.rowCount || 0,
            authenticated: true
          }
        }
      } else {
        healthCheck.checks.googleSheetsConnection = {
          passed: false,
          error: 'Health check returned false'
        }
      }
    } catch (connectionError) {
      console.error('❌ Google Sheets connection error:', connectionError)
      healthCheck.checks.googleSheetsConnection = {
        passed: false,
        error: connectionError instanceof Error ? connectionError.message : 'Connection failed'
      }
    }

    // Final assessment
    const allChecksPassed = healthCheck.checks.environmentVariables.passed && 
                           healthCheck.checks.googleSheetsConnection.passed

    if (allChecksPassed) {
      healthCheck.success = true
      healthCheck.message = `All checks passed in ${Date.now() - startTime}ms`
      
      console.log('✅ Google Sheets health check PASSED:', {
        environment: healthCheck.environment,
        duration: Date.now() - startTime,
        sheetTitle: healthCheck.checks.googleSheetsConnection.details?.sheetTitle
      })
      
      return createResponse(200, healthCheck)
    } else {
      healthCheck.message = 'Google Sheets connection failed'
      
      console.log('❌ Google Sheets health check FAILED:', {
        environment: healthCheck.environment,
        duration: Date.now() - startTime,
        error: healthCheck.checks.googleSheetsConnection.error
      })
      
      return createResponse(500, healthCheck)
    }

  } catch (error) {
    console.error('💥 Health check error:', error)
    
    healthCheck.message = `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    
    return createResponse(500, healthCheck)
  }
}