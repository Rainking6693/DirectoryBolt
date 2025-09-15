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
    console.log('🔍 Checking Google Sheets configuration...');
    
    // EMILY FIX: Check for service account file or environment variables
    const fs = require('fs');
    const path = require('path');
    const serviceAccountPath = path.join(process.cwd(), 'config', 'google-service-account.json');
    
    let hasValidConfig = false;
    let configMethod = 'none';
    let envChecks = {};
    
    if (fs.existsSync(serviceAccountPath)) {
      hasValidConfig = true;
      configMethod = 'service-account-file';
      envChecks = {
        serviceAccountFile: true,
        GOOGLE_SHEET_ID: !!process.env.GOOGLE_SHEET_ID || 'using-default'
      };
    } else {
      // Check environment variables
      envChecks = {
        GOOGLE_SHEET_ID: !!process.env.GOOGLE_SHEET_ID,
        GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY
      };
      
      if (Object.values(envChecks).every(Boolean)) {
        hasValidConfig = true;
        configMethod = 'environment-variables';
      }
    }

    console.log('📋 Configuration status:', { configMethod, ...envChecks });
    console.log('🔍 Available env vars with GOOGLE:', Object.keys(process.env).filter(k => k.includes('GOOGLE')));

    const envPassed = hasValidConfig;

    if (!envPassed) {
      const missingInfo = configMethod === 'none' ? 
        'Missing both service account file and environment variables' :
        `Configuration method ${configMethod} incomplete`;
      
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          success: false,
          environment: 'netlify-functions',
          timestamp: new Date().toISOString(),
          checks: {
            configuration: {
              passed: false,
              method: configMethod,
              details: envChecks
            }
          },
          message: missingInfo,
          diagnostic: {
            netlifyContext: true,
            configMethod,
            serviceAccountFileExists: fs.existsSync(serviceAccountPath),
            totalEnvironmentVariables: Object.keys(process.env).length,
            googleEnvironmentVariables: Object.keys(process.env).filter(k => k.includes('GOOGLE'))
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
        configuration: {
          passed: true,
          method: configMethod,
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