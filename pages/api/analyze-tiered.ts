// 🚀 TIERED AI ANALYSIS ENDPOINT - Complete Business Intelligence with Freemium Strategy
// Integrates enhanced website analyzer, AI business analyzer, directory matcher, and tier manager

import type { NextApiRequest, NextApiResponse } from 'next'
import { logger } from '../../lib/utils/logger'
import { configureCors, setSecurityHeaders, validateInput, sanitizeError, logRequest } from '../../lib/middleware/security'
import { withRateLimit, rateLimitConfigs } from '../../lib/middleware/rate-limiter'

// Import AI Services
import { getBusinessIntelligenceEngine } from '../../lib/services/ai-business-intelligence-engine'
import { getTierManager, AnalysisTier, UpgradePrompt } from '../../lib/services/analysis-tier-manager'
import { BusinessIntelligenceResponse, AnalysisProgress } from '../../lib/types/business-intelligence'

export interface TieredAnalysisRequest {
  url: string
  userId: string
  tier: AnalysisTier
  userInput?: {
    businessGoals?: string[]
    targetAudience?: string
    budget?: number
    timeline?: string
    industryFocus?: string[]
  }
}

export interface TieredAnalysisResponse {
  success: boolean
  data?: {
    analysis: BusinessIntelligenceResponse
    tierInfo: {
      currentTier: AnalysisTier
      limits: any
      usage: any
    }
    valueDemo?: {
      value: string
      metrics: Record<string, number>
      projections: Record<string, number>
    }
    upgradePrompt?: UpgradePrompt
    conversionTracking?: {
      eventId: string
      funnel: string
    }
  }
  error?: string
  code?: string
  processingTime?: number
  upgradeRequired?: {
    reason: string
    prompt: UpgradePrompt
  }
}

// Progress tracking for real-time updates
const progressTracker = new Map<string, AnalysisProgress>()

// URL validation with security checks
function validateUrl(inputUrl: string): { valid: boolean; error?: string; url?: URL } {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { valid: false, error: 'URL must be a non-empty string' }
  }
  
  if (inputUrl.length > 2048) {
    return { valid: false, error: 'URL too long (max 2048 characters)' }
  }
  
  try {
    const url = new URL(inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`)
    
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' }
    }
    
    // Block internal/private networks
    const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1', 'local', 'internal']
    const privateRanges = ['10.', '172.16.', '172.17.', '172.18.', '172.19.', '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.', '172.26.', '172.27.', '172.28.', '172.29.', '172.30.', '172.31.', '192.168.']
    
    const hostname = url.hostname.toLowerCase()
    if (blockedHosts.some(blocked => hostname.includes(blocked)) || 
        privateRanges.some(range => hostname.startsWith(range))) {
      return { valid: false, error: 'Private/internal URLs are not allowed' }
    }
    
    return { valid: true, url }
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' }
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse<TieredAnalysisResponse>) {
  const startTime = Date.now()
  
  // Apply security middleware
  logRequest(req, res)
  configureCors(req, res)
  setSecurityHeaders(req, res)
  validateInput(req, res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      code: 'METHOD_NOT_ALLOWED'
    })
  }

  try {
    const { url, userId, tier = 'free', userInput }: TieredAnalysisRequest = req.body

    // Validate required fields
    if (!url || !userId) {
      return res.status(400).json({
        success: false,
        error: 'URL and userId are required',
        code: 'MISSING_REQUIRED_FIELDS'
      })
    }

    // Validate URL
    const urlValidation = validateUrl(url)
    if (!urlValidation.valid) {
      return res.status(400).json({
        success: false,
        error: urlValidation.error,
        code: 'INVALID_URL'
      })
    }

    // Initialize services
    const tierManager = getTierManager()
    const intelligenceEngine = getBusinessIntelligenceEngine()

    // Step 1: Validate tier access
    const accessValidation = await tierManager.validateTierAccess(userId, tier)
    if (!accessValidation.allowed) {
      return res.status(403).json({
        success: false,
        error: 'Tier access denied',
        code: 'TIER_ACCESS_DENIED',
        upgradeRequired: {
          reason: accessValidation.reason || 'Access limit reached',
          prompt: accessValidation.upgradePrompt!
        }
      })
    }

    // Step 2: Track analysis start
    await tierManager.trackAnalysis(userId, 'full_analysis')
    
    logger.info('Starting tiered analysis', {
      metadata: {
        userId,
        tier,
        url: urlValidation.url!.hostname,
        hasUserInput: !!userInput
      }
    })

    // Step 3: Setup progress tracking
    const progressId = `${userId}_${Date.now()}`
    intelligenceEngine.onProgress((progress: AnalysisProgress) => {
      progressTracker.set(progressId, progress)
    })

    // Step 4: Get tier-specific configuration
    const tierConfig = tierManager.getAnalysisConfig(tier)
    
    // Step 5: Feature gating checks
    const featureChecks = await Promise.all([
      tierManager.canAccessFeature(userId, tier, 'screenshots'),
      tierManager.canAccessFeature(userId, tier, 'competitor_analysis'),
      tierManager.canAccessFeature(userId, tier, 'revenue_projections'),
      tierManager.canAccessFeature(userId, tier, 'directory_optimization')
    ])

    // Collect upgrade prompts from feature checks
    let upgradePrompts: UpgradePrompt[] = []
    featureChecks.forEach(check => {
      if (!check.allowed && check.upgradePrompt) {
        upgradePrompts.push(check.upgradePrompt)
      }
    })

    // Step 6: Execute comprehensive analysis with tier configuration
    const analysisRequest = {
      url: urlValidation.url!.href,
      userInput,
      config: {
        websiteAnalysis: tierConfig.websiteAnalysis,
        aiAnalysis: tierConfig.aiAnalysis,
        directoryMatching: tierConfig.directoryMatching,
        enableProgressTracking: true,
        cacheResults: true,
        maxProcessingTime: 300000 // 5 minutes
      }
    }

    const businessIntelligence = await intelligenceEngine.analyzeBusinessIntelligence(analysisRequest)

    // Step 7: Apply tier-specific filtering to results
    if (!businessIntelligence.success) {
      throw new Error(businessIntelligence.error || 'Analysis failed')
    }

    const intelligence = businessIntelligence.data!

    // Filter directory opportunities based on tier limits
    const directoryLimit = tierConfig.directoryMatching.maxDirectories
    if (directoryLimit !== -1 && intelligence.directoryOpportunities.prioritizedSubmissions.length > directoryLimit) {
      intelligence.directoryOpportunities.prioritizedSubmissions = 
        intelligence.directoryOpportunities.prioritizedSubmissions.slice(0, directoryLimit)
      
      // Add upgrade prompt for more directories
      const directoryUpgrade = tierManager.generateUpgradePrompt(tier, 'directory_limit')
      upgradePrompts.push(directoryUpgrade)
    }

    // Step 8: Generate value demonstration
    const valueDemo = await tierManager.demonstrateValue(userId, tier, intelligence)

    // Step 9: Get current usage and tier info
    const usage = await tierManager.getUserUsage(userId)
    const tierInfo = {
      currentTier: tier,
      limits: tierManager.getTierConfig(tier).limits,
      usage: {
        analysesThisMonth: usage.analysesThisMonth,
        directoriesViewed: usage.directoriesViewed,
        totalAnalyses: usage.totalAnalyses
      }
    }

    // Step 10: Select primary upgrade prompt
    const primaryUpgradePrompt = upgradePrompts.length > 0 ? upgradePrompts[0] : undefined

    const processingTime = Date.now() - startTime

    // Step 11: Structure response with tier-specific data
    const response: TieredAnalysisResponse = {
      success: true,
      data: {
        analysis: {
          success: true,
          data: intelligence,
          processingTime: businessIntelligence.processingTime || processingTime,
          usage: businessIntelligence.usage || { tokensUsed: 0, cost: 0 }
        },
        tierInfo,
        valueDemo,
        upgradePrompt: primaryUpgradePrompt,
        conversionTracking: {
          eventId: `analysis_${userId}_${Date.now()}`,
          funnel: `tier_${tier}_to_premium`
        }
      },
      processingTime
    }

    logger.info('Tiered analysis completed successfully', {
      metadata: {
        userId,
        tier,
        processingTime,
        confidence: intelligence.confidence,
        directoryCount: intelligence.directoryOpportunities.totalDirectories,
        upgradePromptsShown: upgradePrompts.length
      }
    })

    // Cleanup progress tracking
    progressTracker.delete(progressId)

    return res.status(200).json(response)

  } catch (error) {
    const processingTime = Date.now() - startTime
    
    logger.error('Tiered analysis failed', {
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime,
        userId: req.body?.userId,
        tier: req.body?.tier
      }
    })
    
    const sanitizedError = sanitizeError(error)
    return res.status(sanitizedError.statusCode).json({
      success: false,
      error: sanitizedError.message,
      code: sanitizedError.code,
      processingTime
    })
  }
}

// Additional endpoint for progress tracking
export async function getAnalysisProgress(userId: string): Promise<AnalysisProgress | null> {
  const progressKey = Array.from(progressTracker.keys()).find(key => key.startsWith(userId))
  return progressKey ? progressTracker.get(progressKey) || null : null
}

// Cost tracking endpoint for transparency
export async function getAnalysisCost(tier: AnalysisTier): Promise<{
  tier: string
  monthlyPrice: number
  analysisValue: number
  roi: number
  features: string[]
}> {
  const tierManager = getTierManager()
  const config = tierManager.getTierConfig(tier)
  
  return {
    tier: config.name,
    monthlyPrice: config.price,
    analysisValue: tier === 'premium' ? 2600 : tier === 'basic' ? 800 : 150,
    roi: tier === 'premium' ? 870 : tier === 'basic' ? 810 : 0,
    features: config.features
  }
}

// Upgrade conversion endpoint
export async function processUpgrade(userId: string, fromTier: AnalysisTier, toTier: AnalysisTier): Promise<{
  success: boolean
  conversionValue: number
  newLimits: any
}> {
  const tierManager = getTierManager()
  
  await tierManager.upgradeUser(userId, toTier)
  
  const fromConfig = tierManager.getTierConfig(fromTier)
  const toConfig = tierManager.getTierConfig(toTier)
  
  return {
    success: true,
    conversionValue: toConfig.price - fromConfig.price,
    newLimits: toConfig.limits
  }
}

// Export the handler with rate limiting
export default withRateLimit(
  {
    ...rateLimitConfigs.analyze,
    windowMs: 60000, // 1 minute window
    max: tier => tier === 'free' ? 2 : tier === 'basic' ? 10 : 50, // Tier-based rate limits
    keyGenerator: (req: NextApiRequest) => {
      const { userId, tier } = req.body || {}
      return `${req.ip || 'unknown'}_${userId || 'anonymous'}_${tier || 'free'}`
    }
  },
  '/api/analyze-tiered'
)(handler)