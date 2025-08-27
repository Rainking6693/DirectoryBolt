import { NextApiRequest, NextApiResponse } from 'next'
import { rateLimit } from '../../lib/utils/rate-limit'
import { validateUrl, sanitizeInput } from '../../lib/utils/validation'
import { logger } from '../../lib/utils/logger'
import { WebsiteAnalyzer } from '../../lib/services/website-analyzer'

// Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Limit to 500 unique IPs per minute
})

export interface AnalysisRequest {
  url: string
  options?: {
    deep?: boolean
    includeCompetitors?: boolean
    checkDirectories?: boolean
  }
}

export interface AnalysisResponse {
  success: boolean
  data?: {
    url: string
    title: string
    description: string
    currentListings: number
    missedOpportunities: number
    competitorAdvantage: number
    potentialLeads: number
    visibility: number
    seoScore: number
    issues: Array<{
      type: 'critical' | 'warning' | 'info'
      title: string
      description: string
      impact: string
      priority: number
    }>
    recommendations: Array<{
      action: string
      impact: string
      effort: 'low' | 'medium' | 'high'
    }>
    directoryOpportunities: Array<{
      name: string
      authority: number
      estimatedTraffic: number
      submissionDifficulty: string
      cost: number
    }>
  }
  error?: string
  requestId?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalysisResponse>
) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        requestId
      })
    }

    // Apply rate limiting
    try {
      await limiter.check(res, 10, 'ANALYZE_CACHE_TOKEN') // 10 requests per minute
    } catch {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        requestId
      })
    }

    // Validate and sanitize input
    const { url, options = {} }: AnalysisRequest = req.body

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL is required',
        requestId
      })
    }

    const sanitizedUrl = sanitizeInput(url)
    const validation = validateUrl(sanitizedUrl)
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: `Invalid URL: ${validation.errors.join(', ')}`,
        requestId
      })
    }

    // Log the analysis request
    logger.info('Website analysis requested', {
      requestId,
      userAgent: req.headers['user-agent'] as string,
      ipAddress: (req.headers['x-forwarded-for'] || req.connection.remoteAddress) as string,
      metadata: {
        url: sanitizedUrl,
        options
      }
    })

    // Initialize website analyzer
    const analyzer = new WebsiteAnalyzer({
      timeout: 30000, // 30 seconds timeout
      maxRetries: 3,
      userAgent: process.env.USER_AGENT || 'DirectoryBolt/1.0 (+https://directorybolt.com)',
      respectRobots: true
    })

    // Perform analysis with error handling
    const analysisResult = await analyzer.analyzeWebsite(sanitizedUrl, {
      deep: options.deep || false,
      includeCompetitors: options.includeCompetitors || false,
      checkDirectories: options.checkDirectories || true,
      maxDirectoriesToCheck: 100
    })

    // Log successful analysis
    logger.info('Website analysis completed', {
      requestId,
      metadata: {
        url: sanitizedUrl,
        score: analysisResult.seoScore,
        issues: analysisResult.issues.length,
        opportunities: analysisResult.directoryOpportunities.length
      }
    })

    // Return successful response
    return res.status(200).json({
      success: true,
      data: analysisResult,
      requestId
    })

  } catch (error) {
    // Handle and log errors appropriately
    logger.error('Website analysis failed', { 
      requestId,
      httpMethod: req.method,
      httpUrl: '/api/analyze',
      metadata: { url: req.body?.url }
    }, error instanceof Error ? error : new Error(String(error)))

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return res.status(504).json({
          success: false,
          error: 'Website analysis timed out. The website might be slow or unavailable.',
          requestId
        })
      }
      
      if (error.message.includes('blocked') || error.message.includes('forbidden')) {
        return res.status(403).json({
          success: false,
          error: 'Website blocks automated access. Please try a different website.',
          requestId
        })
      }
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: 'Analysis failed. Please try again or contact support if the problem persists.',
      requestId
    })
  }
}

// Export configuration for large payloads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '8mb',
  },
}