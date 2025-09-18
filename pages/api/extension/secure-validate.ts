/**
 * SECURE Extension Customer Validation API - 2025 Enhanced Security
 * Server-side proxy that handles all Supabase communication
 * Features: Advanced rate limiting, JWT security, performance monitoring
 * NO CREDENTIALS EXPOSED TO CLIENT
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { extensionRateLimiter } from '../../../lib/middleware/advanced-rate-limiter'
import jwtManager from '../../../lib/security/jwt-security-2025'

interface SecureValidationRequest {
  customerId: string
  extensionVersion: string
}

interface SecureValidationResponse {
  valid: boolean
  customerName?: string
  packageType?: string
  accessToken?: string
  expiresIn?: number
  error?: string
  rateLimitInfo?: {
    remaining: number
    resetTime: number
  }
}

async function validateHandler(
  req: NextApiRequest,
  res: NextApiResponse<SecureValidationResponse>
) {
  const requestStart = Date.now();
  const isNetlifyFunction = !!process.env.NETLIFY || !!process.env.AWS_LAMBDA_FUNCTION_NAME
  
  console.log('🔒 Secure validation API called (2025 Enhanced):', {
    isNetlify: isNetlifyFunction,
    method: req.method,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']?.substring(0, 50),
    timestamp: new Date().toISOString()
  })

  // Apply advanced rate limiting
  if (!(await extensionRateLimiter.limit(req, res))) {
    console.warn(`🚫 Rate limit exceeded for validation request`);
    return; // Response already sent by rate limiter
  }
  
  // Create response helper
  const createResponse = (statusCode: number, data: SecureValidationResponse) => {
    if (isNetlifyFunction) {
      return {
        statusCode,
        headers: {
          'Access-Control-Allow-Origin': 'chrome-extension://*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Extension-ID',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      }
    } else {
      // Next.js API route response
      res.setHeader('Access-Control-Allow-Origin', 'chrome-extension://*')
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Extension-ID')
      return res.status(statusCode).json(data)
    }
  }

  if (req.method === 'OPTIONS') {
    return createResponse(200, { valid: true })
  }

  if (req.method !== 'POST') {
    return createResponse(405, {
      valid: false,
      error: 'Method not allowed'
    })
  }

  try {
    const { customerId, extensionVersion }: SecureValidationRequest = req.body

    // Validate input
    if (!customerId) {
      return createResponse(400, {
        valid: false,
        error: 'Customer ID is required'
      })
    }

    // Validate customer ID format
    if (!customerId.startsWith('DIR-') && !customerId.startsWith('DB-')) {
      return createResponse(400, {
        valid: false,
        error: 'Invalid Customer ID format'
      })
    }

    console.log('🔒 SECURE: Validating customer via server-side proxy:', customerId)

    // Direct Supabase client connection for extension validation
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ SECURE: Missing Supabase configuration')
      return createResponse(500, {
        valid: false,
        error: 'Database configuration error'
      })
    }

    try {
      // Create direct Supabase client
      const supabase = createClient(supabaseUrl, supabaseServiceKey)

      // Test connection with simple query
      const { data, error } = await supabase
        .from('customers')
        .select('customer_id, business_name, first_name, last_name, package_type, status')
        .eq('customer_id', customerId.trim().toUpperCase())
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('❌ SECURE: Database query error:', error)
        return createResponse(500, {
          valid: false,
          error: 'Database query failed'
        })
      }

      if (!data) {
        console.log(`❌ SECURE: Customer not found: ${customerId}`)
        return createResponse(401, {
          valid: false,
          error: 'Customer not found'
        })
      }

      const fullName = data.first_name && data.last_name ? 
        `${data.first_name} ${data.last_name}`.trim() : 
        (data.first_name || data.last_name || '').trim()
      
      console.log(`✅ SECURE: Customer validated: ${data.business_name || fullName || 'Customer'} (${customerId})`)

      // Generate JWT access token for validated customer
      const tokenPayload = {
        customerId: data.customer_id,
        packageType: data.package_type || 'starter',
        permissions: getPackagePermissions(data.package_type || 'starter')
      };

      const tokenPair = jwtManager.generateTokenPair(tokenPayload);
      const responseTime = Date.now() - requestStart;

      console.log(`⚡ Validation completed in ${responseTime}ms with JWT token generated`);

      return createResponse(200, {
        valid: true,
        customerName: data.business_name || fullName || 'Customer',
        packageType: data.package_type || 'starter',
        accessToken: tokenPair.accessToken,
        expiresIn: tokenPair.expiresIn,
        rateLimitInfo: {
          remaining: parseInt(res.getHeader('X-RateLimit-Remaining') as string || '0'),
          resetTime: parseInt(res.getHeader('X-RateLimit-Reset') as string || '0')
        }
      })

    } catch (dbError) {
      console.error('❌ SECURE: Database connection error:', dbError)
      return createResponse(500, {
        valid: false,
        error: 'Database connection failed'
      })
    }

  } catch (error) {
    console.error('❌ SECURE: Validation error:', error)
    
    return createResponse(500, {
      valid: false,
      error: 'Internal server error'
    })
  }
}

// Helper function to get package-based permissions
function getPackagePermissions(packageType: string): string[] {
  const basePermissions = ['read:directories', 'validate:customer'];
  
  switch (packageType?.toLowerCase()) {
    case 'starter':
      return [...basePermissions, 'submit:basic'];
    case 'growth':
      return [...basePermissions, 'submit:basic', 'submit:enhanced'];
    case 'professional':
      return [...basePermissions, 'submit:basic', 'submit:enhanced', 'submit:priority'];
    case 'enterprise':
      return [...basePermissions, 'submit:basic', 'submit:enhanced', 'submit:priority', 'admin:access'];
    default:
      return basePermissions;
  }
}

// Export enhanced handler with security and performance improvements
export default validateHandler;