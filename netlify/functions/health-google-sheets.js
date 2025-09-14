/**
 * Netlify Function: Google Sheets Health Check
 * Direct replacement for /api/health/google-sheets
 */

const { createGoogleSheetsService } = require('../../lib/services/google-sheets.js');

exports.handler = async (event, context) => {
  console.log('🏥 Google Sheets health check initiated via Netlify Function');
  
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  const startTime = Date.now();
  
  try {
    console.log('🔍 Checking environment variables...');
    
    // Check environment variables
    const envChecks = {
      GOOGLE_SHEET_ID: !!process.env.GOOGLE_SHEET_ID,
      GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY
    };

    console.log('📋 Environment variables status:', envChecks);
    console.log('🔍 Available env vars with GOOGLE:', Object.keys(process.env).filter(k => k.includes('GOOGLE')));

    const envPassed = Object.values(envChecks).every(Boolean);

    if (!envPassed) {
      const missingVars = Object.entries(envChecks)
        .filter(([_, exists]) => !exists)
        .map(([key]) => key);
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          environment: 'netlify-functions',
          timestamp: new Date().toISOString(),
          checks: {
            environmentVariables: {
              passed: false,
              details: envChecks
            }
          },
          message: `Missing environment variables: ${missingVars.join(', ')}`,
          diagnostic: {
            netlifyContext: true,
            totalEnvironmentVariables: Object.keys(process.env).length,
            googleEnvironmentVariables: Object.keys(process.env).filter(k => k.includes('GOOGLE')),
            missingVariables: missingVars
          }
        })
      };
    }

    console.log('🔗 Testing Google Sheets connection...');
    
    // Test Google Sheets connection
    const googleSheetsService = createGoogleSheetsService();
    const connectionTest = await googleSheetsService.healthCheck();
    
    const result = {
      success: connectionTest,
      environment: 'netlify-functions',
      timestamp: new Date().toISOString(),
      checks: {
        environmentVariables: {
          passed: true,
          details: envChecks
        },
        googleSheetsConnection: {
          passed: connectionTest,
          details: connectionTest ? {
            authenticated: true,
            sheetTitle: 'DirectoryBolt Customers'
          } : {
            error: 'Connection failed'
          }
        }
      },
      message: connectionTest ? `All checks passed in ${Date.now() - startTime}ms` : 'Google Sheets connection failed',
      duration: Date.now() - startTime
    };

    console.log(connectionTest ? '✅ Google Sheets health check PASSED' : '❌ Google Sheets health check FAILED');

    return {
      statusCode: connectionTest ? 200 : 500,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('💥 Health check error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        environment: 'netlify-functions',
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        message: `Health check failed: ${error.message}`,
        duration: Date.now() - startTime
      })
    };
  }
};