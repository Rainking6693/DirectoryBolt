/**
 * Netlify Function: Supabase Health Check
 * Direct replacement for Google Sheets health check
 */

const { createSupabaseService } = require('../../lib/services/supabase');

exports.handler = async (event, context) => {
  console.log('🏥 Supabase health check initiated via Netlify Function');
  
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
    console.log('🔍 Checking Supabase configuration...');
    
    // Check environment variables
    const envChecks = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY
    };
    
    const hasValidConfig = Object.values(envChecks).every(Boolean);

    console.log('📋 Configuration status:', envChecks);

    if (!hasValidConfig) {
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
              details: envChecks
            }
          },
          message: 'Missing Supabase environment variables',
          diagnostic: {
            netlifyContext: true,
            totalEnvironmentVariables: Object.keys(process.env).length,
            supabaseEnvironmentVariables: Object.keys(process.env).filter(k => k.includes('SUPABASE'))
          }
        })
      };
    }

    console.log('🔗 Testing Supabase connection...');
    
    // Test Supabase connection
    const supabaseService = createSupabaseService();
    const connectionTest = await supabaseService.healthCheck();
    
    const result = {
      success: connectionTest,
      environment: 'netlify-functions',
      timestamp: new Date().toISOString(),
      checks: {
        configuration: {
          passed: true,
          details: envChecks
        },
        supabaseConnection: {
          passed: connectionTest,
          details: connectionTest ? {
            connected: true,
            database: 'DirectoryBolt Customers'
          } : {
            error: 'Connection failed'
          }
        }
      },
      message: connectionTest ? `All checks passed in ${Date.now() - startTime}ms` : 'Supabase connection failed',
      duration: Date.now() - startTime
    };

    console.log(connectionTest ? '✅ Supabase health check PASSED' : '❌ Supabase health check FAILED');

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