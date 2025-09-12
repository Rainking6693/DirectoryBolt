/**
 * AutoBolt Queue Status API
 * 
 * GET /api/autobolt/queue-status
 * Returns current queue statistics and status
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { queueManager } from '../../../lib/services/queue-manager'
import { rateLimit } from '../../../lib/utils/rate-limit'

// Rate limiting for queue status API
const limiter = rateLimit({
  interval: 60 * 1000, // 60 seconds
  uniqueTokenPerInterval: 100, // Limit each IP to 100 requests per interval
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Detect Netlify Functions context
  const isNetlifyFunction = !!process.env.NETLIFY || !!process.env.AWS_LAMBDA_FUNCTION_NAME
  
  console.log('📋 Queue status API called:', {
    isNetlify: isNetlifyFunction,
    method: req.method
  })
  
  // Create response helper
  const createResponse = (statusCode: number, data: any) => {
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
  
  if (req.method !== 'GET') {
    return createResponse(405, {
      success: false,
      error: 'Method not allowed. Use GET.'
    })
  }

  try {
    // Apply rate limiting
    await limiter.check(res, 20, 'queue-status') // 20 requests per minute per IP
  } catch {
    return createResponse(429, {
      success: false,
      error: 'Rate limit exceeded. Please try again later.'
    })
  }

  try {
    const stats = await queueManager().getQueueStats()
    const isProcessing = queueManager().isQueueProcessing()
    const nextCustomer = await queueManager().getNextCustomer()

    return createResponse(200, {
      success: true,
      data: {
        stats,
        isProcessing,
        nextCustomer: nextCustomer ? {
          customerId: nextCustomer.customerId,
          businessName: nextCustomer.businessName,
          packageType: nextCustomer.packageType,
          directoryLimit: nextCustomer.directoryLimit,
          priority: nextCustomer.priority,
          createdAt: nextCustomer.createdAt
        } : null,
        lastUpdated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Queue status API error:', error)
    
    return createResponse(500, {
      success: false,
      error: 'Failed to get queue status',
      message: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : 'Internal server error'
    })
  }
}