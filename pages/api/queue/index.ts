/**
 * Queue API Endpoints - Main Queue Management
 * GET /api/queue - Fetch queue items with filtering and pagination
 * Phase 2.2 Implementation
 */

import { NextApiRequest, NextApiResponse } from 'next'
import { queueManager } from '../../../lib/services/queue-manager'
import { QueueItem, GetQueueRequest, GetQueueResponse } from '../../../lib/types/queue.types'

// Rate limiting and validation
import rateLimit from 'express-rate-limit'
import { createProxyMiddleware } from 'http-proxy-middleware'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Apply rate limiting
  await new Promise((resolve, reject) => {
    limiter(req as any, res as any, (result: any) => {
      if (result instanceof Error) {
        return reject(result)
      }
      return resolve(result)
    })
  })

  try {
    switch (req.method) {
      case 'GET':
        return await handleGetQueue(req, res)
      default:
        res.setHeader('Allow', ['GET'])
        return res.status(405).json({
          success: false,
          error: 'Method not allowed',
          code: 'METHOD_NOT_ALLOWED'
        })
    }
  } catch (error) {
    console.error('Queue API error:', error)
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

async function handleGetQueue(req: NextApiRequest, res: NextApiResponse<GetQueueResponse>) {
  try {
    // Parse and validate query parameters
    const params: GetQueueRequest = {
      status: req.query.status as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      sortBy: (req.query.sortBy as any) || 'priority',
      sortOrder: (req.query.sortOrder as any) || 'desc',
      packageType: Array.isArray(req.query.packageType) 
        ? req.query.packageType as string[]
        : req.query.packageType 
        ? [req.query.packageType as string] 
        : undefined,
      dateRange: req.query.dateFrom && req.query.dateTo 
        ? {
            from: req.query.dateFrom as string,
            to: req.query.dateTo as string
          }
        : undefined
    }

    // Validate parameters
    if (params.limit && (params.limit < 1 || params.limit > 100)) {
      return res.status(400).json({
        success: false,
        data: {} as any,
        timestamp: new Date().toISOString(),
        error: 'Limit must be between 1 and 100'
      } as any)
    }

    if (params.offset && params.offset < 0) {
      return res.status(400).json({
        success: false,
        data: {} as any,
        timestamp: new Date().toISOString(),
        error: 'Offset must be non-negative'
      } as any)
    }

    // Get queue manager instance
    const manager = queueManager()

    // Fetch queue items and stats in parallel
    const [queueItems, stats] = await Promise.all([
      manager.getPendingQueue(),
      manager.getQueueStats()
    ])

    // Apply filtering
    let filteredItems = queueItems

    // Status filter
    if (params.status && params.status !== 'all') {
      filteredItems = filteredItems.filter(item => item.submissionStatus === params.status)
    }

    // Package type filter
    if (params.packageType && params.packageType.length > 0) {
      filteredItems = filteredItems.filter(item => 
        params.packageType!.includes(item.packageType)
      )
    }

    // Date range filter
    if (params.dateRange) {
      const fromDate = new Date(params.dateRange.from)
      const toDate = new Date(params.dateRange.to)
      filteredItems = filteredItems.filter(item => {
        const itemDate = new Date(item.createdAt)
        return itemDate >= fromDate && itemDate <= toDate
      })
    }

    // Apply sorting
    filteredItems.sort((a, b) => {
      let comparison = 0
      
      switch (params.sortBy) {
        case 'priority':
          comparison = a.priority - b.priority
          break
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'packageType':
          comparison = a.packageType.localeCompare(b.packageType)
          break
        default:
          comparison = 0
      }

      return params.sortOrder === 'desc' ? -comparison : comparison
    })

    // Apply pagination
    const totalItems = filteredItems.length
    const paginatedItems = filteredItems.slice(
      params.offset || 0, 
      (params.offset || 0) + (params.limit || 50)
    )

    // Build response
    const response: GetQueueResponse = {
      success: true,
      data: {
        items: paginatedItems,
        pagination: {
          total: totalItems,
          offset: params.offset || 0,
          limit: params.limit || 50,
          hasMore: (params.offset || 0) + (params.limit || 50) < totalItems
        },
        stats
      },
      timestamp: new Date().toISOString()
    }

    // Set cache headers for reasonable caching
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate')
    
    return res.status(200).json(response)

  } catch (error) {
    console.error('Failed to fetch queue:', error)
    return res.status(500).json({
      success: false,
      data: {} as any,
      timestamp: new Date().toISOString(),
      error: 'Failed to fetch queue data'
    } as any)
  }
}