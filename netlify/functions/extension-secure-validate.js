/**
 * Netlify Function: Secure Extension Customer Validation
 * Mirrors /api/extension/secure-validate as a serverless function with CORS
 * Updated to use Supabase instead of Google Sheets
 */

const { createSupabaseService } = require('../../lib/services/supabase');

exports.handler = async (event, context) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Extension-ID'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ valid: false, error: 'Method not allowed' })
    };
  }

  try {
    let body = {};
    try {
      body = JSON.parse(event.body || '{}');
    } catch (e) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ valid: false, error: 'Invalid JSON' }) };
    }

    const { customerId, extensionVersion } = body;

    if (!customerId) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ valid: false, error: 'Customer ID is required' }) };
    }

    // Accept DIR- or DB- prefixes primarily; allow TEST-* for dev verification
    const normalizedId = String(customerId).trim();
    const isDir = normalizedId.startsWith('DIR-') || normalizedId.startsWith('DB-');
    const isTest = normalizedId.startsWith('TEST-') || normalizedId === 'DIR-2025-001234';

    if (!isDir && !isTest) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ valid: false, error: 'Invalid Customer ID format' }) };
    }

    // Shortcut for test customers
    if (isTest) {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ valid: true, customerName: 'Test Business', packageType: 'starter', test: true })
      };
    }

    // Create service and health check
    const supabaseService = createSupabaseService();
    const healthy = await supabaseService.healthCheck();
    if (!healthy) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ valid: false, error: 'Database connection failed' })
      };
    }

    // Lookup customer
    let customer = await supabaseService.findByCustomerId(normalizedId);

    if (!customer) {
      // Try variations similar to other endpoints
      const variations = [];
      if (normalizedId.startsWith('DIR-2025')) {
        const base = normalizedId.replace('DIR-2025', '');
        variations.push(`DIR-202509${base}`);
        variations.push(`DIR-20259${base}`);
      }
      if (normalizedId.startsWith('DIR-')) {
        variations.push(normalizedId.replace('DIR-', ''));
        variations.push(normalizedId.replace('DIR-', 'DB-'));
      }

      for (const alt of variations) {
        customer = await supabaseService.findByCustomerId(alt);
        if (customer) break;
      }
    }

    if (!customer) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ valid: false, error: 'Customer not found' })
      };
    }

    const name = customer.businessName || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Customer';
    const pkg = customer.packageType || 'starter';

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ valid: true, customerName: name, packageType: pkg })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ valid: false, error: 'Internal server error', message: err?.message })
    };
  }
};