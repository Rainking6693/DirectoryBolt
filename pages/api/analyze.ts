import { NextApiRequest, NextApiResponse } from 'next'
import { logger } from '../../lib/utils/logger'
import { WebsiteAnalyzer } from '../../lib/services/website-analyzer'
import { ProgressTracker } from '../../lib/utils/progress-tracker'
import { validateUrlEnhanced } from '../../lib/utils/url-validator'
import { advancedValidator, ValidationSchemas } from '../../lib/utils/advanced-validation'
import { enhancedRateLimit, getClientIP, determineUserTier } from '../../lib/utils/enhanced-rate-limit'
import { ApiResponseBuilder, AnalysisResponseTransformer } from '../../lib/utils/api-response'
import { optimizedScraper } from '../../lib/services/optimized-scraper'
import { handleApiError } from '../../lib/utils/errors'

// Enhanced configuration
const ANALYSIS_VERSION = '2.0.0'

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
    // 🚀 AI-Enhanced Fields (Pro Feature)
    aiAnalysis?: {
      businessProfile?: {
        name: string
        category: string
        industry: string
        targetAudience: string[]
        businessModel: string
      }
      smartRecommendations?: Array<{
        directory: string
        reasoning: string
        successProbability: number
        optimizedDescription: string
      }>
      insights?: {
        marketPosition: string
        competitiveAdvantages: string[]
        improvementSuggestions: string[]
        successFactors: string[]
      }
      confidence?: number
    }
  }
  error?: string
  requestId?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<any>
) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const responseBuilder = new ApiResponseBuilder(requestId, ANALYSIS_VERSION)
  const startTime = Date.now()
  let progressTracker: ProgressTracker | null = null
  
  // Define userAgent at function scope so it's available in catch block
  const userAgent = req.headers['user-agent'] || 'unknown'
  let ipAddress: string | undefined
  
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST'])
      return res.status(405).json(
        responseBuilder.error('METHOD_NOT_ALLOWED', 'Method not allowed', 405)
      )
    }

    // Get client information
    ipAddress = getClientIP(req)
    
    // Determine user tier (you would get this from auth/database)
    const userTier = determineUserTier(null, null) // Free tier for now

    // Enhanced rate limiting
    const rateLimitResult = await enhancedRateLimit.checkRateLimit({
      ipAddress,
      userAgent,
      endpoint: '/api/analyze',
      tier: userTier,
      timestamp: Date.now(),
      requestSize: JSON.stringify(req.body).length
    })

    if (!rateLimitResult.allowed) {
      return res.status(429).json(
        responseBuilder.error(
          'RATE_LIMIT_EXCEEDED',
          rateLimitResult.reason || 'Rate limit exceeded',
          429,
          {
            details: {
              retryAfter: rateLimitResult.retryAfter,
              limits: rateLimitResult.limits,
              remaining: rateLimitResult.remaining,
              suspicionScore: rateLimitResult.suspicionScore
            },
            rateLimit: {
              limit: rateLimitResult.limits.requestsPerMinute,
              remaining: rateLimitResult.remaining.minute,
              resetTime: rateLimitResult.resetTimes.minute
            }
          }
        )
      )
    }

    // Advanced input validation
    const validationResult = await advancedValidator.validate(
      req.body,
      ValidationSchemas.websiteAnalysis,
      {
        requestId,
        userAgent,
        ipAddress,
        timestamp: Date.now()
      }
    )

    if (!validationResult.isValid) {
      const firstError = validationResult.errors[0]
      return res.status(400).json(
        responseBuilder.error(
          firstError.errorCode,
          firstError.message,
          400,
          {
            field: firstError.field,
            details: {
              allErrors: validationResult.errors.map(e => ({
                field: e.field,
                message: e.message,
                code: e.errorCode
              })),
              warnings: validationResult.warnings
            }
          }
        )
      )
    }

    const { url, options = '{}' } = validationResult.data
    const parsedOptions = JSON.parse(options)

    // Enhanced URL validation
    const urlValidation = await validateUrlEnhanced(url)
    
    if (!urlValidation.isValid) {
      const primaryError = urlValidation.errors[0]
      return res.status(400).json(
        responseBuilder.error(
          primaryError.errorCode,
          primaryError.message,
          400,
          {
            field: 'url',
            details: {
              securityChecks: urlValidation.securityChecks,
              accessibility: urlValidation.accessibility,
              metadata: urlValidation.metadata,
              allErrors: urlValidation.errors.map(e => ({
                message: e.message,
                code: e.errorCode
              })),
              warnings: urlValidation.warnings
            }
          }
        )
      )
    }

    // Initialize progress tracking
    progressTracker = new ProgressTracker(requestId, urlValidation.sanitizedUrl!, parsedOptions)

    // Log the analysis request
    logger.info('Enhanced website analysis requested', {
      requestId,
      metadata: {
        url: urlValidation.sanitizedUrl,
        options: parsedOptions,
        userTier,
        ipAddress,
        userAgent: userAgent.substring(0, 100),
        validationTime: validationResult.metadata.validationTime,
        urlMetadata: urlValidation.metadata,
        securityChecks: urlValidation.securityChecks
      }
    })

    // Return immediate response with progress tracking info
    res.status(202).json(
      responseBuilder.success(
        {
          analysisId: requestId,
          status: 'initiated',
          progressEndpoint: `/api/analyze/progress?requestId=${requestId}`,
          estimatedDuration: '30-120 seconds',
          url: urlValidation.sanitizedUrl,
          tier: userTier
        },
        {
          warnings: [...(validationResult.warnings || []), ...(urlValidation.warnings || [])],
          rateLimit: {
            limit: rateLimitResult.limits.requestsPerMinute,
            remaining: rateLimitResult.remaining.minute,
            resetTime: rateLimitResult.resetTimes.minute
          }
        }
      )
    )

    // Process analysis asynchronously
    processAnalysisAsync(
      requestId,
      urlValidation.sanitizedUrl!,
      parsedOptions,
      progressTracker,
      {
        userTier,
        ipAddress,
        userAgent,
        rateLimits: rateLimitResult
      }
    ).catch(error => {
      logger.error('Async analysis processing failed', {
        requestId,
        metadata: { url: urlValidation.sanitizedUrl, error: error.message }
      }, error)
      
      if (progressTracker) {
        progressTracker.fail(error)
      }
    })



  } catch (error) {
    // Handle and log errors appropriately
    logger.error('Enhanced website analysis failed', { 
      requestId,
      metadata: {
        url: req.body?.url,
        userAgent: userAgent?.substring(0, 100),
        ipAddress,
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, error instanceof Error ? error : new Error(String(error)))

    // Update progress tracker with failure
    if (progressTracker) {
      progressTracker.fail(error instanceof Error ? error : new Error(String(error)))
    }

    // Return structured error response
    const errorResponse = handleApiError(error instanceof Error ? error : new Error(String(error)), requestId)
    return res.status(errorResponse.error.statusCode).json(
      responseBuilder.error(
        errorResponse.error.code,
        errorResponse.error.message,
        errorResponse.error.statusCode,
        {
          debug: process.env.NODE_ENV === 'development' ? {
            stack: error instanceof Error ? error.stack : undefined,
            context: { url: req.body?.url, method: req.method }
          } : undefined
        }
      )
    )
  }
}

// Async analysis processing function
async function processAnalysisAsync(
  requestId: string,
  url: string,
  options: any,
  progressTracker: ProgressTracker,
  context: {
    userTier: string
    ipAddress: string
    userAgent: string
    rateLimits: any
  }
): Promise<void> {
  try {
    // Step 1: Input validation (already completed)
    progressTracker.completeStep('validation', { url, options })

    // Step 2: Website fetching with optimized scraper
    progressTracker.startStep('fetch')
    progressTracker.updateStepProgress('fetch', 25, 'Connecting to website...')
    
    const scrapingResult = await optimizedScraper.scrapeUrl(url, {
      timeout: context.userTier === 'free' ? 15000 : 30000,
      priority: context.userTier === 'premium' || context.userTier === 'enterprise' ? 'high' : 'normal',
      cacheKey: `analysis:${url}`,
      skipCache: options.fresh === true
    })

    progressTracker.updateStepProgress('fetch', 75, 'Processing website content...')
    
    if (!scrapingResult.success) {
      throw new Error(`Failed to fetch website: ${scrapingResult.error?.message}`)
    }

    progressTracker.completeStep('fetch', {
      finalUrl: scrapingResult.finalUrl,
      statusCode: scrapingResult.statusCode,
      size: scrapingResult.metadata.size,
      timing: scrapingResult.timing
    })

    // Step 3: Content parsing and analysis
    progressTracker.startStep('parse')
    progressTracker.updateStepProgress('parse', 30, 'Extracting metadata and content...')

    // Initialize enhanced website analyzer
    const analyzer = new WebsiteAnalyzer({
      timeout: context.userTier === 'free' ? 15000 : 45000,
      maxRetries: context.userTier === 'free' ? 2 : 3,
      userAgent: process.env.USER_AGENT || 'DirectoryBolt/2.0 (+https://directorybolt.com)',
      respectRobots: true
    })

    // Continue with remaining steps...
    progressTracker.startStep('seo_analysis')
    progressTracker.startStep('directory_check')
    progressTracker.startStep('opportunity_discovery')
    progressTracker.startStep('metrics_calculation')
    progressTracker.startStep('recommendations')

    // Perform comprehensive analysis
    const analysisResult = await analyzer.analyzeWebsite(url, {
      deep: options.deep || false,
      includeCompetitors: options.includeCompetitors || false,
      checkDirectories: options.checkDirectories !== false,
      maxDirectoriesToCheck: context.userTier === 'free' ? 50 : 100
    })

    // Complete analysis steps
    progressTracker.completeStep('seo_analysis', { score: analysisResult.seoScore })
    progressTracker.completeStep('directory_check', { found: analysisResult.currentListings })
    progressTracker.completeStep('opportunity_discovery', { opportunities: analysisResult.missedOpportunities })
    progressTracker.completeStep('metrics_calculation', { visibility: analysisResult.visibility })
    progressTracker.completeStep('recommendations', { count: analysisResult.recommendations.length })

    // AI Analysis (if enabled and available)
    if (options.includeAI !== false) {
      progressTracker.startStep('ai_analysis')
      // AI analysis would happen here
      progressTracker.completeStep('ai_analysis', { confidence: analysisResult.aiConfidence })
    }

    // Competitor analysis (if requested)
    if (options.includeCompetitors) {
      progressTracker.startStep('competitor_analysis')
      // Competitor analysis would happen here
      progressTracker.completeStep('competitor_analysis')
    }

    // Final report generation
    progressTracker.startStep('finalization')
    progressTracker.updateStepProgress('finalization', 50, 'Structuring analysis results...')
    
    // Transform to structured response format
    const structuredResponse = AnalysisResponseTransformer.transform(analysisResult, requestId)
    
    progressTracker.updateStepProgress('finalization', 90, 'Finalizing report...')
    
    // Complete the analysis
    progressTracker.complete(structuredResponse)

    logger.info('Enhanced analysis completed successfully', {
      requestId,
      metadata: {
        url,
        processingTime: Date.now() - (progressTracker.getProgress().startTime),
        seoScore: analysisResult.seoScore,
        opportunities: analysisResult.missedOpportunities,
        userTier: context.userTier,
        cacheUsed: scrapingResult.cache.hit
      }
    })

  } catch (error) {
    logger.error('Async analysis processing failed', {
      requestId,
      metadata: {
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
        userTier: context.userTier
      }
    }, error instanceof Error ? error : new Error(String(error)))

    progressTracker.fail(error instanceof Error ? error : new Error(String(error)))
  }
}

// Export configuration for enhanced payloads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb', // Increased for enhanced validation
    },
    responseLimit: '10mb', // Increased for structured responses
    externalResolver: true, // Enable for async processing
  },
}