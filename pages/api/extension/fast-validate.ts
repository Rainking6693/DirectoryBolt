/**
 * FAST Extension Customer Validation API - Performance Optimized
 * Ultra-lightweight validation for Chrome extension
 * Target: <1 second response time
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

interface FastValidationRequest {
  customerId: string
}

interface FastValidationResponse {
  valid: boolean
  customerName?: string
  packageType?: string
  error?: string
  responseTime?: number
}

// In-memory cache for ultra-fast repeat lookups
const validationCache = new Map<string, { valid: boolean; customerName: string; packageType: string; timestamp: number }>()
const CACHE_TTL = 60000 // 1 minute cache

export default async function fastValidateHandler(
  req: NextApiRequest,
  res: NextApiResponse<FastValidationResponse>
) {
  const startTime = Date.now()
  
  // Set performance headers
  res.setHeader('Access-Control-Allow-Origin', 'chrome-extension://*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'no-cache')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      valid: false,
      error: 'Method not allowed',
      responseTime: Date.now() - startTime
    })
  }

  try {
    const { customerId }: FastValidationRequest = req.body

    if (!customerId) {
      return res.status(400).json({
        valid: false,
        error: 'Customer ID required',
        responseTime: Date.now() - startTime
      })
    }

    const cleanCustomerId = customerId.trim().toUpperCase()

    // Check cache first for instant response
    const cached = validationCache.get(cleanCustomerId)
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log(`⚡ FAST: Cache hit for ${cleanCustomerId} (${Date.now() - startTime}ms)`)
      return res.status(200).json({
        valid: cached.valid,
        customerName: cached.customerName,
        packageType: cached.packageType,
        responseTime: Date.now() - startTime
      })
    }

    // Fast Supabase connection with minimal overhead
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ FAST: Missing Supabase config')
      return res.status(500).json({
        valid: false,
        error: 'Configuration error',
        responseTime: Date.now() - startTime
      })
    }

    // Create lightweight client for speed
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'x-application-name': 'DirectoryBolt-FastValidation' } }
    })

    // Ultra-fast query - only essential fields
    const { data, error } = await Promise.race([
      supabase
        .from('customers')
        .select('customer_id,business_name,full_name,first_name,last_name,package_type,subscription_tier,is_active')
        .eq('customer_id', cleanCustomerId)
        .single(),
      // 2-second timeout for ultra-fast response
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Query timeout')), 2000)
      )
    ])

    if (error || !data) {
      // Cache negative result briefly to prevent spam
      validationCache.set(cleanCustomerId, {
        valid: false,
        customerName: '',
        packageType: '',
        timestamp: Date.now()
      })

      console.log(`❌ FAST: Customer not found ${cleanCustomerId} (${Date.now() - startTime}ms)`)
      return res.status(401).json({
        valid: false,
        error: 'Customer not found',
        responseTime: Date.now() - startTime
      })
    }

    // Extract customer name efficiently
    const customerName = data.business_name || 
      (data.first_name && data.last_name ? `${data.first_name} ${data.last_name}` : '') ||
      data.full_name || 
      'Customer'

    const packageType = data.package_type || data.subscription_tier || 'starter'

    // Cache successful result
    validationCache.set(cleanCustomerId, {
      valid: true,
      customerName,
      packageType,
      timestamp: Date.now()
    })

    const responseTime = Date.now() - startTime
    console.log(`✅ FAST: Validated ${cleanCustomerId} in ${responseTime}ms`)

    return res.status(200).json({
      valid: true,
      customerName,
      packageType,
      responseTime
    })

  } catch (error) {
    const responseTime = Date.now() - startTime
    console.error(`❌ FAST: Validation error (${responseTime}ms):`, error)
    
    return res.status(500).json({
      valid: false,
      error: 'Validation failed',
      responseTime
    })
  }
}

// Cleanup cache periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of validationCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      validationCache.delete(key)
    }
  }
}, 30000) // Clean every 30 seconds