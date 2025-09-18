/**
 * Netlify Function: Customer Validation
 * Direct replacement for /api/customer/validate
 * Updated to use Supabase instead of Google Sheets
 */

const { createSupabaseService } = require('../../lib/services/supabase');

exports.handler = async (event, context) => {
  console.log('🔍 Customer validation initiated via Netlify Function (Supabase)');
  
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

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse request body
    let body;
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    const { customerId } = body;

    if (!customerId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Customer ID required' })
      };
    }

    console.log('🔍 Validating customer with Supabase:', customerId);
    
    // Environment check
    console.log('🔍 Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      NETLIFY: !!process.env.NETLIFY,
      SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY
    });

    // Handle test customers first
    if (customerId.startsWith('TEST-') || customerId.startsWith('DIR-2025-001234')) {
      console.log('✅ Test customer detected:', customerId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
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
      };
    }

    // Real customer lookup using Supabase service
    const supabaseService = createSupabaseService();
    let customer = await supabaseService.findByCustomerId(customerId);
    
    if (!customer) {
      // Try alternative ID formats
      const alternatives = generateAlternativeIds(customerId);
      
      for (const altId of alternatives) {
        console.log('🔄 Trying alternative ID:', altId);
        customer = await supabaseService.findByCustomerId(altId);
        if (customer) {
          console.log('✅ Found customer with alternative ID:', altId);
          break;
        }
      }
    }

    if (customer) {
      console.log('✅ Customer found:', customer.customerId);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          customer: {
            customerId: customer.customerId,
            businessName: customer.businessName || 'Unknown Business',
            email: customer.email || '',
            packageType: customer.packageType || 'starter',
            submissionStatus: customer.submissionStatus || 'active',
            purchaseDate: customer.purchaseDate || null
          }
        })
      };
    }

    // Customer not found
    console.log('❌ Customer not found:', customerId);
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({
        error: 'Customer not found',
        message: 'Customer ID not found in database. Please verify your ID starts with "DIR-" or contact support.'
      })
    };

  } catch (error) {
    console.error('💥 Customer validation error:', error);
    
    if (error.message?.includes('authentication') || error.message?.includes('401')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Authentication failed',
          message: 'Unable to connect to customer database'
        })
      };
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Validation failed',
        message: 'Please try again later',
        details: error.message
      })
    };
  }
};

function generateAlternativeIds(customerId) {
  const alternatives = [];
  
  // Try different date formats for DIR- IDs
  if (customerId.startsWith('DIR-2025')) {
    const base = customerId.replace('DIR-2025', '');
    alternatives.push(`DIR-202509${base}`);
    alternatives.push(`DIR-20259${base}`);
    alternatives.push(`DIR-25${base}`);
  }
  
  // Try without prefix
  if (customerId.startsWith('DIR-')) {
    alternatives.push(customerId.replace('DIR-', ''));
  }
  
  // Try with DB prefix (alternative format)
  if (customerId.startsWith('DIR-')) {
    alternatives.push(customerId.replace('DIR-', 'DB-'));
  }
  
  return alternatives;
}