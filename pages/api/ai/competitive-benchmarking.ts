import { NextApiRequest, NextApiResponse } from 'next'
import { competitiveBenchmarkingService } from '../../../lib/services/competitive-benchmarking'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from '../../../lib/utils/rate-limit'

// Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
})

// Tier limits for competitive benchmarking
const TIER_LIMITS = {
  professional: { daily: 5, monthly: 50 },
  enterprise: { daily: 20, monthly: 200 }
}

interface CompetitiveBenchmarkingRequest {
  targetWebsite: string
  industry: string
  competitors?: string[]
  benchmarkingDepth: 'basic' | 'advanced' | 'comprehensive'
  includeTrafficEstimates: boolean
  includeContentStrategy: boolean
  includeTechnicalSEO: boolean
  includeBacklinkAnalysis: boolean
  userTier: 'professional' | 'enterprise'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    })
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Extract user information from request headers or body
    const authToken = req.headers.authorization?.replace('Bearer ', '')
    
    if (!authToken) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      })
    }

    // Verify user authentication and get user data
    const { data: { user }, error: authError } = await supabase.auth.getUser(authToken)
    
    if (authError || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token'
      })
    }

    // Get user profile and subscription tier
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return res.status(403).json({
        success: false,
        error: 'User profile not found'
      })
    }

    const userTier = profile.subscription_tier as 'professional' | 'enterprise'

    // Validate tier access
    if (!['professional', 'enterprise'].includes(userTier)) {
      return res.status(403).json({
        success: false,
        error: 'Competitive benchmarking requires Professional or Enterprise subscription'
      })
    }

    // Apply rate limiting
    try {
      await limiter.check(res, 10, `competitive-benchmark-${user.id}`)
    } catch {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please try again later.'
      })
    }

    // Check daily usage limits
    const today = new Date().toISOString().split('T')[0]
    const { data: todayUsage, error: usageError } = await supabase
      .from('api_usage')
      .select('usage_count')
      .eq('user_id', user.id)
      .eq('feature', 'competitive_benchmarking')
      .eq('date', today)
      .single()

    if (usageError && usageError.code !== 'PGRST116') {
      console.error('Usage check error:', usageError)
    }

    const currentUsage = todayUsage?.usage_count || 0
    const dailyLimit = TIER_LIMITS[userTier].daily

    if (currentUsage >= dailyLimit) {
      return res.status(429).json({
        success: false,
        error: `Daily limit of ${dailyLimit} competitive benchmarking analyses reached`
      })
    }

    // Validate and sanitize request data
    const {
      targetWebsite,
      industry,
      competitors = [],
      benchmarkingDepth = 'advanced',
      includeTrafficEstimates = true,
      includeContentStrategy = true,
      includeTechnicalSEO = true,
      includeBacklinkAnalysis = userTier === 'enterprise'
    }: CompetitiveBenchmarkingRequest = req.body

    // Validation
    if (!targetWebsite || !industry) {
      return res.status(400).json({
        success: false,
        error: 'Target website and industry are required'
      })
    }

    // URL validation
    try {
      new URL(targetWebsite.startsWith('http') ? targetWebsite : `https://${targetWebsite}`)
    } catch {
      return res.status(400).json({
        success: false,
        error: 'Invalid website URL format'
      })
    }

    // Tier-specific feature validation
    if (benchmarkingDepth === 'comprehensive' && userTier !== 'enterprise') {
      return res.status(403).json({
        success: false,
        error: 'Comprehensive benchmarking requires Enterprise subscription'
      })
    }

    console.log(`Starting competitive benchmarking for ${targetWebsite} in ${industry} industry`)

    // Perform competitive benchmarking analysis
    const analysisResult = await competitiveBenchmarkingService.performBenchmarkAnalysis({
      targetWebsite,
      industry,
      competitors,
      benchmarkingDepth,
      includeTrafficEstimates,
      includeContentStrategy,
      includeTechnicalSEO,
      includeBacklinkAnalysis
    })

    // Update usage tracking
    await supabase
      .from('api_usage')
      .upsert({
        user_id: user.id,
        feature: 'competitive_benchmarking',
        date: today,
        usage_count: currentUsage + 1
      }, {
        onConflict: 'user_id,feature,date'
      })

    // Log the analysis for monitoring
    console.log(`Competitive benchmarking completed for ${targetWebsite}:`, {
      overallScore: analysisResult.overallScore,
      ranking: analysisResult.ranking,
      totalCompetitors: analysisResult.totalCompetitorsAnalyzed,
      recommendationsCount: analysisResult.recommendations.length
    })

    // Return successful response
    res.status(200).json({
      success: true,
      data: analysisResult,
      usage: {
        current: currentUsage + 1,
        limit: dailyLimit,
        remaining: dailyLimit - (currentUsage + 1)
      }
    })

  } catch (error) {
    console.error('Competitive benchmarking API error:', error)
    
    // Return appropriate error response
    if (error instanceof Error) {
      if (error.message.includes('rate limit')) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded'
        })
      }
      
      if (error.message.includes('authentication')) {
        return res.status(401).json({
          success: false,
          error: 'Authentication failed'
        })
      }
    }

    res.status(500).json({
      success: false,
      error: 'Competitive benchmarking analysis failed. Please try again.'
    })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}