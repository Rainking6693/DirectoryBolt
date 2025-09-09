import { NextApiRequest, NextApiResponse } from 'next'
import type { BusinessIntelligenceResponse } from '../../lib/types/ai.types'

// Simple logger fallback
const logger = {
  info: (msg: string, meta?: any) => console.log(`[INFO] ${msg}`, meta || ''),
  error: (msg: string, meta?: any, error?: Error) => console.error(`[ERROR] ${msg}`, meta || '', error || ''),
  warn: (msg: string, meta?: any) => console.warn(`[WARN] ${msg}`, meta || '')
}

interface AnalysisTier {
  name: string
  maxDirectories: number
  includeAIAnalysis: boolean
  includeCompetitiveAnalysis: boolean
  includeSEOAnalysis: boolean
  includeExport: boolean
  includeBusinessProfile: boolean
  includeMarketInsights: boolean
}

const ANALYSIS_TIERS: Record<string, AnalysisTier> = {
  free: {
    name: 'Free Analysis',
    maxDirectories: 5,
    includeAIAnalysis: false,
    includeCompetitiveAnalysis: false,
    includeSEOAnalysis: false,
    includeExport: false,
    includeBusinessProfile: false,
    includeMarketInsights: false
  },
  starter: {
    name: 'Starter Intelligence',
    maxDirectories: 100,
    includeAIAnalysis: true,
    includeCompetitiveAnalysis: false,
    includeSEOAnalysis: true,
    includeExport: true,
    includeBusinessProfile: true,
    includeMarketInsights: false
  },
  growth: {
    name: 'Growth Intelligence',
    maxDirectories: 250,
    includeAIAnalysis: true,
    includeCompetitiveAnalysis: true,
    includeSEOAnalysis: true,
    includeExport: true,
    includeBusinessProfile: true,
    includeMarketInsights: true
  },
  professional: {
    name: 'Professional Intelligence',
    maxDirectories: 400,
    includeAIAnalysis: true,
    includeCompetitiveAnalysis: true,
    includeSEOAnalysis: true,
    includeExport: true,
    includeBusinessProfile: true,
    includeMarketInsights: true
  },
  enterprise: {
    name: 'Enterprise Intelligence',
    maxDirectories: 500,
    includeAIAnalysis: true,
    includeCompetitiveAnalysis: true,
    includeSEOAnalysis: true,
    includeExport: true,
    includeBusinessProfile: true,
    includeMarketInsights: true
  }
}

// URL validation function
function validateUrl(inputUrl: string): { valid: boolean; url?: URL; error?: string } {
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
    const blockedHosts = [
      'localhost', '127.0.0.1', '0.0.0.0', '::1', 'local', 'internal',
      '10.', '172.16.', '172.17.', '172.18.', '172.19.', '172.20.',
      '172.21.', '172.22.', '172.23.', '172.24.', '172.25.', '172.26.',
      '172.27.', '172.28.', '172.29.', '172.30.', '172.31.', '192.168.'
    ]
    
    const hostname = url.hostname.toLowerCase()
    if (blockedHosts.some(blocked => hostname.includes(blocked))) {
      return { valid: false, error: 'Private/internal URLs are not allowed' }
    }
    
    return { valid: true, url }
  } catch (error) {
    return { valid: false, error: 'Invalid URL format' }
  }
}

// Generate paid tier directories
function generatePaidDirectories(maxDirectories: number): any[] {
  const directories = [
    {
      name: 'Google My Business',
      authority: 98,
      estimatedTraffic: 5000,
      submissionDifficulty: 'Easy',
      cost: 'Free',
      successProbability: 95
    },
    {
      name: 'Yelp Business',
      authority: 93,
      estimatedTraffic: 3000,
      submissionDifficulty: 'Easy',
      cost: 'Free',
      successProbability: 88
    },
    {
      name: 'Facebook Business',
      authority: 95,
      estimatedTraffic: 4000,
      submissionDifficulty: 'Easy',
      cost: 'Free',
      successProbability: 92
    },
    {
      name: 'Better Business Bureau',
      authority: 88,
      estimatedTraffic: 2000,
      submissionDifficulty: 'Medium',
      cost: '$500',
      successProbability: 75
    },
    {
      name: 'LinkedIn Company',
      authority: 98,
      estimatedTraffic: 3500,
      submissionDifficulty: 'Easy',
      cost: 'Free',
      successProbability: 95
    },
    {
      name: 'Clutch',
      authority: 84,
      estimatedTraffic: 1800,
      submissionDifficulty: 'Medium',
      cost: 'Free',
      successProbability: 70
    },
    {
      name: 'Yellow Pages',
      authority: 80,
      estimatedTraffic: 1500,
      submissionDifficulty: 'Easy',  
      cost: 'Free',
      successProbability: 85
    },
    {
      name: 'Foursquare Business',
      authority: 78,
      estimatedTraffic: 1200,
      submissionDifficulty: 'Easy',
      cost: 'Free',
      successProbability: 80
    }
  ]
  
  return directories.slice(0, Math.min(maxDirectories, directories.length))
}

// Generate free tier preview data
function generateFreePreview(url: string): any {
  const domain = new URL(url).hostname
  const seoScore = Math.floor(Math.random() * 30) + 50 // 50-80
  const currentListings = Math.floor(Math.random() * 8) + 2 // 2-10
  const missedOpportunities = Math.floor(Math.random() * 20) + 10 // 10-30
  const potentialLeads = Math.floor(Math.random() * 300) + 200 // 200-500
  const visibility = Math.floor((currentListings / (currentListings + missedOpportunities)) * 100)

  return {
    tier: 'free',
    title: `Website Analysis Preview for ${domain}`,
    description: `Basic analysis showing ${currentListings} current listings and ${missedOpportunities}+ missed opportunities`,
    seoScore,
    currentListings,
    missedOpportunities,
    potentialLeads,
    visibility,
    limitedPreview: true,
    upgradeRequired: true,
    previewDirectories: [
      {
        name: 'Google My Business',
        authority: 98,
        estimatedTraffic: 5000,
        submissionDifficulty: 'Easy',
        cost: 'Free',
        successProbability: 95
      },
      {
        name: 'Yelp',
        authority: 93,
        estimatedTraffic: 3000,
        submissionDifficulty: 'Easy',
        cost: 'Free',
        successProbability: 88
      },
      {
        name: 'Facebook Business',
        authority: 95,
        estimatedTraffic: 4000,
        submissionDifficulty: 'Easy',
        cost: 'Free',
        successProbability: 92
      },
      {
        name: 'Bing Places',
        authority: 90,
        estimatedTraffic: 2000,
        submissionDifficulty: 'Easy',
        cost: 'Free',
        successProbability: 85
      },
      {
        name: 'Yellow Pages',
        authority: 85,
        estimatedTraffic: 1500,
        submissionDifficulty: 'Easy',
        cost: 'Free',
        successProbability: 80
      }
    ],
    upgradeMessage: {
      title: 'Unlock Full AI Analysis',
      description: 'Get complete business intelligence with 75+ directories, competitor analysis, and revenue projections',
      benefits: [
        'AI-powered business categorization',
        'Competitive landscape analysis',
        'Revenue projection modeling',
        '75+ high-authority directories',
        'Success probability scoring',
        'Platform-specific optimization'
      ],
      cta: 'Upgrade to Growth Plan - $299/month'
    }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const startTime = Date.now()

  try {
    const { url, tier = 'free', userId, sessionId = `session_${Date.now()}` } = req.body

    // Validate input
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Valid URL is required' })
    }

    // Basic URL validation
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`)
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' })
    }

    // Get tier configuration
    const tierConfig = ANALYSIS_TIERS[tier] || ANALYSIS_TIERS.free
    
    logger.info('Starting website analysis', {
      metadata: { url, tier: tierConfig.name, userId, sessionId }
    })

    // Generate mock analysis response immediately (no external dependencies)
    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname
    const seoScore = Math.floor(Math.random() * 30) + (tier === 'free' ? 30 : 60)
    const currentListings = Math.floor(Math.random() * 8) + 2
    const missedOpportunities = Math.floor(Math.random() * 20) + 10
    const potentialLeads = Math.floor(Math.random() * 300) + 200
    const visibility = Math.floor((currentListings / (currentListings + missedOpportunities)) * 100)

    // Generate directory opportunities based on tier
    const directoryOpportunities = tier === 'free' ? generateFreePreview(url).previewDirectories : 
      generatePaidDirectories(tierConfig.maxDirectories)

    // Create response
    const response: BusinessIntelligenceResponse = {
      url,
      title: `Website Analysis for ${domain}`,
      description: `Business analysis showing ${currentListings} current listings and ${missedOpportunities}+ opportunities`,
      tier: tierConfig.name,
      timestamp: new Date().toISOString(),
      
      // Metrics
      visibility,
      seoScore,
      potentialLeads,
      
      // Directory opportunities
      directoryOpportunities,
      
      // AI analysis for paid tiers
      aiAnalysis: tier !== 'free' ? {
        businessProfile: {
          name: `Business from ${domain}`,
          industry: 'Professional Services',
          category: 'Business Services',
          description: 'Professional business providing quality services',
          targetAudience: ['Business Professionals'],
          businessModel: 'Service Provider',
          keyServices: ['Professional Services'],
          competitiveAdvantages: ['Quality Service', 'Customer Focus'],
          marketPosition: 'Established Provider'
        },
        insights: {
          competitiveAdvantages: ['Strong online presence potential', 'Untapped directory opportunities'],
          improvementSuggestions: ['Optimize directory presence', 'Improve SEO metadata', 'Enhance local listings'],
          marketInsights: tierConfig.includeMarketInsights ? {
            industryTrends: ['Digital transformation', 'Local SEO importance'],
            growthOpportunities: ['Directory optimization', 'Local search enhancement'],
            riskFactors: ['Increased competition'],
            recommendations: ['Focus on high-authority directories']
          } : undefined
        }
      } : undefined,
      
      // Upgrade prompts for free tier
      upgradePrompts: tier === 'free' ? {
        title: 'Unlock Full Business Intelligence',
        description: 'Get complete business intelligence analysis',
        benefits: [
          'Complete AI business analysis worth $2,000',
          'Competitive intelligence insights',
          'SEO optimization recommendations',
          '250+ premium directory opportunities',
          'Professional PDF reports & CSV export'
        ],
        ctaText: 'Upgrade to Growth Plan - $299',
        ctaUrl: '/pricing?plan=growth',
        savings: 'Save 93% vs. hiring consultants ($4,300 value)'
      } : undefined
    }

    logger.info('Website analysis completed', {
      metadata: { 
        url, 
        tier: tierConfig.name,
        directoryCount: response.directoryOpportunities.length,
        hasAIAnalysis: !!response.aiAnalysis,
        processingTime: Date.now() - startTime
      }
    })

    return res.status(200).json({success: true, data: response})

  } catch (error) {
    logger.error('Website analysis failed', {
      metadata: {
        url: req.body?.url,
        tier: req.body?.tier,
        processingTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, error as Error)
    
    return res.status(500).json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      processingTime: Date.now() - startTime
    })
  }
}