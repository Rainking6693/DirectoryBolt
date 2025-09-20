import { NextApiRequest, NextApiResponse } from 'next'
import { rateLimit } from '../../../lib/utils/rate-limit'
import { logger } from '../../../lib/utils/logger'
import { ContentGapAnalyzer } from '../../../lib/services/content-gap-analyzer'

// Rate limiting for content gap analysis (expensive operation)
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 20, // Limit to 20 unique users per minute
})

export interface ContentGapAnalysisRequest {
  targetWebsite: string
  userTier: 'professional' | 'enterprise'
  includeKeywordClusters?: boolean
  includeBlogIdeas?: boolean
  includeFAQs?: boolean
  analysisDepth?: 'standard' | 'comprehensive'
}

export interface ContentGapAnalysisResponse {
  success: boolean
  data?: {
    targetWebsite: string
    competitors: CompetitorContent[]
    contentGaps: ContentGap[]
    blogPostIdeas: BlogPostIdea[]
    faqSuggestions: FAQSuggestion[]
    keywordClusters: KeywordCluster[]
    analysisDate: string
    confidence: number
    processingTime: number
  }
  error?: string
  requestId?: string
}

export interface CompetitorContent {
  domain: string
  name: string
  topPages: ContentPage[]
  contentThemes: string[]
  averageWordCount: number
  publishingFrequency: string
  strongestTopics: string[]
}

export interface ContentPage {
  title: string
  url: string
  wordCount: number
  keywordFocus: string[]
  estimatedTraffic: number
  contentType: 'blog' | 'landing' | 'product' | 'guide' | 'case-study'
}

export interface ContentGap {
  topic: string
  opportunity: string
  priority: 'high' | 'medium' | 'low'
  competitorCoverage: number
  estimatedDifficulty: number
  potentialTraffic: number
  reasoning: string
}

export interface BlogPostIdea {
  title: string
  description: string
  targetKeywords: string[]
  estimatedWordCount: number
  contentType: 'how-to' | 'comparison' | 'listicle' | 'case-study' | 'industry-insights'
  priority: 'high' | 'medium' | 'low'
  seoOpportunity: number
}

export interface FAQSuggestion {
  question: string
  category: string
  searchVolume: number
  difficulty: number
  reasoning: string
}

export interface KeywordCluster {
  clusterName: string
  primaryKeyword: string
  relatedKeywords: string[]
  searchVolume: number
  competitionLevel: 'low' | 'medium' | 'high'
  contentOpportunities: string[]
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ContentGapAnalysisResponse>
) {
  const requestId = `content_gap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const startTime = Date.now()
  
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({
        success: false,
        error: 'Method not allowed',
        requestId
      })
    }

    // Validate input
    const { 
      targetWebsite, 
      userTier, 
      includeKeywordClusters = true, 
      includeBlogIdeas = true, 
      includeFAQs = true,
      analysisDepth = 'standard'
    }: ContentGapAnalysisRequest = req.body

    if (!targetWebsite) {
      return res.status(400).json({
        success: false,
        error: 'Target website URL is required',
        requestId
      })
    }

    // Feature gating - content gap analysis is Professional+ only
    if (!['professional', 'enterprise'].includes(userTier)) {
      return res.status(403).json({
        success: false,
        error: 'Content Gap Analysis is available for Professional and Enterprise customers only. Upgrade to access this powerful SEO tool.',
        requestId
      })
    }

    // Apply rate limiting (Enterprise gets more requests)
    try {
      const rateLimit = userTier === 'enterprise' ? 10 : 5 // Enterprise gets more requests
      await limiter.check(res, rateLimit, 'CONTENT_GAP_CACHE_TOKEN')
    } catch {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please try again in a few minutes.',
        requestId
      })
    }

    // Log the request
    logger.info('Content Gap Analysis requested', {
      requestId,
      userAgent: req.headers['user-agent'] as string,
      ipAddress: (req.headers['x-forwarded-for'] || req.connection.remoteAddress) as string,
      metadata: {
        targetWebsite,
        userTier,
        analysisDepth,
        includeKeywordClusters,
        includeBlogIdeas,
        includeFAQs
      }
    })

    // Initialize content gap analyzer
    const analyzer = new ContentGapAnalyzer()

    // Perform comprehensive content gap analysis
    const analysisResult = await analyzer.analyzeContentGaps(targetWebsite, {
      userTier,
      analysisDepth,
      includeKeywordClusters,
      includeBlogIdeas,
      includeFAQs
    })

    // Calculate processing time
    const processingTime = Date.now() - startTime

    // Log successful analysis
    logger.info('Content Gap Analysis completed', {
      requestId,
      metadata: {
        targetWebsite,
        competitorCount: analysisResult.competitors.length,
        gapCount: analysisResult.contentGaps.length,
        blogIdeasCount: analysisResult.blogPostIdeas.length,
        confidence: analysisResult.confidence,
        processingTime,
        userTier
      }
    })

    // Return successful response
    return res.status(200).json({
      success: true,
      data: {
        targetWebsite,
        competitors: analysisResult.competitors,
        contentGaps: analysisResult.contentGaps,
        blogPostIdeas: includeBlogIdeas ? analysisResult.blogPostIdeas : [],
        faqSuggestions: includeFAQs ? analysisResult.faqSuggestions : [],
        keywordClusters: includeKeywordClusters ? analysisResult.keywordClusters : [],
        analysisDate: new Date().toISOString(),
        confidence: analysisResult.confidence,
        processingTime
      },
      requestId
    })

  } catch (error) {
    // Handle and log errors appropriately
    logger.error('Content Gap Analysis failed', { 
      requestId,
      httpMethod: req.method,
      httpUrl: '/api/ai/content-gap-analysis',
      metadata: { 
        targetWebsite: req.body?.targetWebsite,
        userTier: req.body?.userTier 
      }
    }, error instanceof Error ? error : new Error(String(error)))

    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        return res.status(429).json({
          success: false,
          error: 'AI service quota exceeded. Please try again in a few minutes.',
          requestId
        })
      }
      
      if (error.message.includes('invalid website') || error.message.includes('unable to access')) {
        return res.status(400).json({
          success: false,
          error: 'Unable to analyze the provided website. Please ensure the URL is correct and publicly accessible.',
          requestId
        })
      }
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      error: 'Content Gap Analysis failed. Please try again or contact support if this persists.',
      requestId
    })
  }
}

// Export configuration for large payloads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
    responseLimit: '10mb',
  },
}