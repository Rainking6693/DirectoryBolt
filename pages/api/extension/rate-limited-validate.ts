/**
 * RATE LIMITED EXTENSION VALIDATION API
 * Security hardened with rate limiting and monitoring
 * PHASE 1 SECURITY INFRASTRUCTURE
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createAirtableService } from '../../../lib/services/airtable'

// Rate limiting configuration
const RATE_LIMITS = {
  perCustomerPerMinute: 10,
  perIPPerMinute: 30,
  perExtensionPerHour: 100
}

// In-memory rate limiting store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface ValidationRequest {
  customerId: string
  extensionVersion: string
  extensionId?: string
}

interface ValidationResponse {
  valid: boolean
  customerName?: string
  packageType?: string
  error?: string
  rateLimitRemaining?: number
}

// Audit logging function
function auditLog(event: string, data: any) {
  const timestamp = new Date().toISOString()
  console.log(`[AUDIT] ${timestamp} ${event}:`, JSON.stringify(data))
  
  // TODO: Send to centralized logging system (Sentry, CloudWatch, etc.)
}

// Rate limiting check
function checkRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitStore.get(key)
  
  if (!entry || now > entry.resetTime) {
    // Reset or create new entry
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }
  
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 }
  }
  
  entry.count++
  return { allowed: true, remaining: limit - entry.count }
}

// Get client IP address
function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  const ip = forwarded ? (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]) : req.socket.remoteAddress
  return ip || 'unknown'
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ValidationResponse>
) {
  const startTime = Date.now()
  const clientIP = getClientIP(req)
  
  // Security headers
  res.setHeader('Access-Control-Allow-Origin', 'chrome-extension://*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Extension-ID, X-Extension-Version')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    auditLog('METHOD_NOT_ALLOWED', { method: req.method, ip: clientIP })
    return res.status(405).json({
      valid: false,
      error: 'Method not allowed'
    })
  }

  try {
    const { customerId, extensionVersion, extensionId }: ValidationRequest = req.body

    // Input validation
    if (!customerId || typeof customerId !== 'string') {
      auditLog('INVALID_INPUT', { customerId, ip: clientIP })
      return res.status(400).json({
        valid: false,
        error: 'Valid customer ID is required'
      })
    }

    // Sanitize customer ID
    const sanitizedCustomerId = customerId.trim().replace(/[^A-Za-z0-9\-]/g, '')
    
    if (!sanitizedCustomerId.startsWith('DIR-') && !sanitizedCustomerId.startsWith('DB-')) {
      auditLog('INVALID_CUSTOMER_ID_FORMAT', { customerId: sanitizedCustomerId, ip: clientIP })
      return res.status(400).json({
        valid: false,
        error: 'Invalid Customer ID format'
      })
    }

    // Rate limiting checks
    const ipRateLimit = checkRateLimit(`ip:${clientIP}`, RATE_LIMITS.perIPPerMinute, 60000)
    if (!ipRateLimit.allowed) {
      auditLog('RATE_LIMIT_EXCEEDED_IP', { ip: clientIP, limit: 'per-IP-per-minute' })
      return res.status(429).json({
        valid: false,
        error: 'Rate limit exceeded. Too many requests from this IP.',
        rateLimitRemaining: 0
      })
    }

    const customerRateLimit = checkRateLimit(`customer:${sanitizedCustomerId}`, RATE_LIMITS.perCustomerPerMinute, 60000)
    if (!customerRateLimit.allowed) {
      auditLog('RATE_LIMIT_EXCEEDED_CUSTOMER', { customerId: sanitizedCustomerId, ip: clientIP })
      return res.status(429).json({
        valid: false,
        error: 'Rate limit exceeded. Too many requests for this customer.',
        rateLimitRemaining: 0
      })
    }

    if (extensionId) {
      const extensionRateLimit = checkRateLimit(`extension:${extensionId}`, RATE_LIMITS.perExtensionPerHour, 3600000)
      if (!extensionRateLimit.allowed) {
        auditLog('RATE_LIMIT_EXCEEDED_EXTENSION', { extensionId, ip: clientIP })
        return res.status(429).json({
          valid: false,
          error: 'Rate limit exceeded. Too many requests from this extension.',
          rateLimitRemaining: 0
        })
      }
    }

    // Audit the authentication attempt
    auditLog('AUTH_ATTEMPT', {
      customerId: sanitizedCustomerId,
      ip: clientIP,
      extensionVersion,
      extensionId,
      userAgent: req.headers['user-agent']
    })

    // Validate environment configuration
    if (!process.env.AIRTABLE_ACCESS_TOKEN && !process.env.AIRTABLE_API_KEY) {
      auditLog('CONFIG_ERROR', { error: 'Missing Airtable credentials' })
      return res.status(500).json({
        valid: false,
        error: 'Server configuration error'
      })
    }

    console.log(`🔒 RATE-LIMITED: Validating customer ${sanitizedCustomerId} from IP ${clientIP}`)

    // Use secure Airtable service
    const airtableService = createAirtableService()
    
    // Health check with timeout
    const healthCheckPromise = airtableService.healthCheck()
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Health check timeout')), 5000)
    )
    
    const healthCheck = await Promise.race([healthCheckPromise, timeoutPromise])
    
    if (!healthCheck) {
      auditLog('DATABASE_HEALTH_CHECK_FAILED', { customerId: sanitizedCustomerId })
      return res.status(500).json({
        valid: false,
        error: 'Database connection failed'
      })
    }

    // Find customer with timeout
    const findCustomerPromise = airtableService.findByCustomerId(sanitizedCustomerId)
    const findTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Customer lookup timeout')), 10000)
    )
    
    const customer = await Promise.race([findCustomerPromise, findTimeoutPromise])

    if (!customer) {
      auditLog('CUSTOMER_NOT_FOUND', { customerId: sanitizedCustomerId, ip: clientIP })
      return res.status(401).json({
        valid: false,
        error: 'Customer not found',
        rateLimitRemaining: customerRateLimit.remaining
      })
    }

    // Success audit log
    const processingTime = Date.now() - startTime
    auditLog('AUTH_SUCCESS', {
      customerId: sanitizedCustomerId,
      customerName: customer.businessName,
      ip: clientIP,
      processingTimeMs: processingTime
    })

    console.log(`✅ RATE-LIMITED: Customer validated: ${customer.businessName} (${sanitizedCustomerId}) in ${processingTime}ms`)

    return res.status(200).json({
      valid: true,
      customerName: customer.businessName || `${customer.firstName} ${customer.lastName}`.trim() || 'Customer',
      packageType: customer.packageType || 'basic',
      rateLimitRemaining: customerRateLimit.remaining
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    
    auditLog('AUTH_ERROR', {
      error: error instanceof Error ? error.message : String(error),
      ip: clientIP,
      processingTimeMs: processingTime
    })
    
    console.error('❌ RATE-LIMITED: Validation error:', error)
    
    return res.status(500).json({
      valid: false,
      error: 'Internal server error'
    })
  }
}

// Cleanup old rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute