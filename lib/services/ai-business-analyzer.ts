// 🚀 AI BUSINESS ANALYZER - GPT-4 Powered Business Intelligence Engine  
// Advanced business categorization, industry analysis, and success probability scoring

import OpenAI from 'openai'
import { logger } from '../utils/logger'
import { 
  BusinessIntelligence, 
  EnhancedBusinessProfile, 
  IndustryAnalysis, 
  CompetitiveAnalysis, 
  MarketPositioning,
  RevenueProjections,
  SuccessMetrics,
  BusinessModel,
  TargetMarket
} from '../types/business-intelligence'
import { ExtractedData } from './enhanced-website-analyzer'

export interface AIAnalysisConfig {
  model: 'gpt-4' | 'gpt-4-turbo' | 'gpt-4o'
  temperature: number
  maxTokens: number
  enableRevenueProjections: boolean
  enableCompetitorAnalysis: boolean
  analysisDepth: 'basic' | 'standard' | 'comprehensive'
}

export interface AnalysisContext {
  websiteData: ExtractedData
  url: string
  userInput?: {
    businessGoals?: string[]
    targetAudience?: string
    budget?: number
    timeline?: string
  }
}

export interface BusinessCategorization {
  primaryCategory: string
  confidence: number
  secondaryCategories: Array<{
    category: string
    confidence: number
    reasoning: string
  }>
  industryVertical: string
  businessModel: BusinessModel
  marketFocus: 'B2B' | 'B2C' | 'B2B2C'
}

export interface IndustryInsights {
  analysis: IndustryAnalysis
  marketOpportunities: MarketOpportunity[]
  riskFactors: RiskFactor[]
  successPredictors: SuccessPredictors
}

export interface MarketOpportunity {
  opportunity: string
  description: string
  marketSize: number
  growthPotential: number
  competitionLevel: 'low' | 'medium' | 'high'
  timeToCapture: number // months
  requiredInvestment: number
  expectedROI: number
}

export interface RiskFactor {
  risk: string
  probability: number // 0-100
  impact: 'low' | 'medium' | 'high' | 'critical'
  mitigation: string[]
  timeline: string
}

export interface SuccessPredictors {
  keyFactors: string[]
  probabilityScore: number // 0-100
  benchmarkMetrics: BenchmarkMetric[]
  successTimeline: SuccessTimelineItem[]
}

export interface BenchmarkMetric {
  metric: string
  currentValue: number
  industryAverage: number
  topPerformer: number
  improvement: string
}

export interface SuccessTimelineItem {
  milestone: string
  timeframe: string
  probability: number
  dependencies: string[]
  successMetrics: string[]
}

export class AIBusinessAnalyzer {
  private openai: OpenAI
  private config: AIAnalysisConfig

  constructor(config: AIAnalysisConfig) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key is required for AI Business Analysis')
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    
    this.config = config
    logger.info(`AI Business Analyzer initialized with ${config.model}`)
  }

  async analyzeBusinessIntelligence(context: AnalysisContext): Promise<BusinessIntelligence> {
    try {
      logger.info('Starting comprehensive AI business analysis', {
        metadata: {
          url: context.url,
          depth: this.config.analysisDepth,
          model: this.config.model
        }
      })

      // Step 1: Enhanced Business Categorization
      const categorization = await this.categorizeBusinessAdvanced(context)
      
      // Step 2: Build Enhanced Business Profile  
      const enhancedProfile = await this.buildEnhancedBusinessProfile(context, categorization)
      
      // Step 3: Industry Analysis & Market Intelligence
      const industryInsights = await this.analyzeIndustryIntelligence(enhancedProfile, context)
      
      // Step 4: Competitive Analysis & Market Positioning
      const competitiveAnalysis = await this.analyzeCompetitiveLandscape(enhancedProfile, context)
      const marketPositioning = await this.analyzeMarketPositioning(enhancedProfile, competitiveAnalysis)
      
      // Step 5: Revenue Projections (if enabled)
      let revenueProjections: RevenueProjections | undefined
      if (this.config.enableRevenueProjections) {
        revenueProjections = await this.projectRevenuePotential(enhancedProfile, industryInsights)
      }

      // Step 6: Success Metrics & Confidence Scoring
      const successMetrics = this.calculateSuccessMetrics(enhancedProfile, industryInsights, competitiveAnalysis)
      const qualityScore = this.calculateAnalysisQuality(context.websiteData)
      const confidence = this.calculateConfidenceScore(categorization, industryInsights, context.websiteData)

      const businessIntelligence: BusinessIntelligence = {
        profile: enhancedProfile,
        industryAnalysis: industryInsights.analysis,
        competitiveAnalysis: competitiveAnalysis,
        seoAnalysis: context.websiteData.seoAnalysis,
        directoryOpportunities: {
          totalDirectories: 0, // Will be populated by directory matcher
          categorizedOpportunities: {
            highAuthority: [],
            industrySpecific: [],
            localDirectories: [],
            nicheDirectories: [],
            freeDirectories: [],
            premiumDirectories: []
          },
          prioritizedSubmissions: [],
          estimatedResults: {
            totalTrafficIncrease: 0,
            leadIncrease: 0,
            brandExposureIncrease: 0,
            timeToResults: {
              immediate: 7,
              shortTerm: 30,
              mediumTerm: 90,
              longTerm: 180
            },
            riskFactors: []
          },
          submissionStrategy: {
            totalDirectories: 0,
            submissionPaces: [],
            budgetAllocation: [],
            timeline: [],
            successMetrics: []
          }
        },
        marketPositioning,
        revenueProjections: revenueProjections || this.getDefaultRevenueProjections(),
        successMetrics,
        confidence,
        qualityScore,
        analysisTimestamp: new Date()
      }

      logger.info('AI business analysis completed successfully', {
        metadata: {
          url: context.url,
          category: enhancedProfile.primaryCategory,
          confidence,
          qualityScore
        }
      })

      return businessIntelligence

    } catch (error) {
      logger.error('AI business analysis failed', { 
        metadata: { 
          url: context.url, 
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      })
      throw new Error(`AI business analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async categorizeBusinessAdvanced(context: AnalysisContext): Promise<BusinessCategorization> {
    const { websiteData, url } = context

    const prompt = `As an expert business analyst, categorize this business with high precision using the provided website data.

WEBSITE DATA:
URL: ${url}
Business Name: ${websiteData.businessProfile.name}
Description: ${websiteData.businessProfile.description}
Title: ${websiteData.basicInfo.title}
Meta Description: ${websiteData.basicInfo.description}
Content Analysis: ${JSON.stringify(websiteData.contentAnalysis.keyThemes, null, 2)}
Tech Stack: ${JSON.stringify(websiteData.techStack, null, 2)}
Social Presence: ${JSON.stringify(websiteData.socialPresence, null, 2)}

CATEGORIZATION REQUIREMENTS:
1. Primary Category: Choose the most specific and accurate business category
2. Secondary Categories: Identify 2-3 relevant secondary categories
3. Industry Vertical: Identify the specific industry (e.g., FinTech, HealthTech, EdTech, etc.)
4. Business Model: Analyze revenue model and structure
5. Market Focus: B2B, B2C, or B2B2C

Categories to choose from:
- SaaS/Software
- E-commerce/Retail
- Professional Services
- Healthcare/Medical
- Education/Training
- Finance/FinTech
- Marketing/Advertising
- Real Estate
- Food & Beverage
- Manufacturing
- Consulting
- Non-Profit
- Entertainment/Media
- Travel/Tourism
- Automotive
- Legal Services
- Construction
- Technology/IT Services
- Creative/Design
- Fitness/Wellness

Provide response in JSON format:
{
  "primaryCategory": "Most specific category",
  "confidence": 85,
  "secondaryCategories": [
    {
      "category": "Secondary category 1",
      "confidence": 70,
      "reasoning": "Why this category fits"
    }
  ],
  "industryVertical": "Specific industry vertical",
  "businessModel": {
    "type": "B2B|B2C|B2B2C|marketplace|subscription|freemium|advertising|commission",
    "revenueStreams": ["Primary revenue sources"],
    "pricingModel": "one-time|subscription|usage-based|freemium|commission|advertising",
    "customerAcquisitionModel": ["How they acquire customers"]
  },
  "marketFocus": "B2B|B2C|B2B2C"
}`

    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: this.config.temperature,
      max_tokens: 1000,
    })

    try {
      const categorization = JSON.parse(response.choices[0].message.content || '{}')
      return {
        ...categorization,
        confidence: Math.min(100, Math.max(0, categorization.confidence || 50))
      }
    } catch (error) {
      logger.warn('Failed to parse business categorization', { metadata: { error } })
      return this.getFallbackCategorization(websiteData)
    }
  }

  private async buildEnhancedBusinessProfile(
    context: AnalysisContext, 
    categorization: BusinessCategorization
  ): Promise<EnhancedBusinessProfile> {
    const { websiteData } = context

    const prompt = `Enhance this business profile with comprehensive details for business intelligence analysis.

EXISTING DATA:
${JSON.stringify(websiteData.businessProfile, null, 2)}

CATEGORIZATION:
${JSON.stringify(categorization, null, 2)}

CONTENT ANALYSIS:
${JSON.stringify(websiteData.contentAnalysis, null, 2)}

Create an enhanced business profile in JSON format:
{
  "name": "Business name",
  "domain": "Domain",
  "description": "Enhanced 2-3 sentence description",
  "tagline": "Compelling tagline if identifiable",
  "primaryCategory": "${categorization.primaryCategory}",
  "secondaryCategories": ["Secondary categories"],
  "industryVertical": "${categorization.industryVertical}",
  "businessModel": ${JSON.stringify(categorization.businessModel)},
  "targetMarket": {
    "primaryAudience": "Primary target audience",
    "secondaryAudiences": ["Secondary audiences"],
    "demographics": {
      "ageRanges": ["Age ranges"],
      "locations": ["Geographic focus"],
      "occupations": ["Target occupations"]
    },
    "painPoints": ["Key customer pain points"],
    "buyingBehavior": {
      "decisionFactors": ["What influences purchase decisions"],
      "purchaseFrequency": "How often they buy",
      "averageOrderValue": 0,
      "channels": ["Preferred buying channels"]
    }
  },
  "size": "startup|small|medium|enterprise",
  "stage": "idea|mvp|early|growth|scale|mature",
  "marketReach": "local|regional|national|international",
  "contentAnalysis": ${JSON.stringify(websiteData.contentAnalysis)}
}`

    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: this.config.temperature,
      max_tokens: 1200,
    })

    try {
      const enhanced = JSON.parse(response.choices[0].message.content || '{}')
      
      // Merge with existing data
      return {
        ...websiteData.businessProfile,
        ...enhanced,
        contactInfo: websiteData.businessProfile.contactInfo || {},
        location: websiteData.businessProfile.location || { headquarters: { city: '', country: '' }, offices: [], serviceAreas: [], timeZones: [] },
        serviceAreas: [],
        socialPresence: websiteData.socialPresence,
        techStack: websiteData.techStack,
        founded: undefined,
        employees: undefined
      } as EnhancedBusinessProfile

    } catch (error) {
      logger.warn('Failed to parse enhanced business profile', { metadata: { error } })
      return this.getFallbackBusinessProfile(websiteData, categorization)
    }
  }

  private async analyzeIndustryIntelligence(
    profile: EnhancedBusinessProfile, 
    context: AnalysisContext
  ): Promise<IndustryInsights> {
    const prompt = `Analyze the industry and market intelligence for this business as a seasoned industry analyst.

BUSINESS PROFILE:
Category: ${profile.primaryCategory}
Industry: ${profile.industryVertical}
Business Model: ${JSON.stringify(profile.businessModel)}
Target Market: ${JSON.stringify(profile.targetMarket)}

Provide comprehensive industry analysis in JSON format:
{
  "analysis": {
    "primaryIndustry": "${profile.industryVertical}",
    "subIndustries": ["Relevant sub-industries"],
    "marketSize": 50.5,
    "growthRate": 12.5,
    "competitionLevel": "low|medium|high|saturated",
    "marketTrends": ["Key market trends for 2024-2025"],
    "seasonality": [
      {
        "season": "Q1",
        "impact": "high|medium|low",
        "months": ["Jan", "Feb", "Mar"],
        "description": "Seasonal impact description"
      }
    ],
    "regulatoryFactors": ["Regulatory considerations"],
    "keySuccessFactors": ["What drives success in this industry"],
    "industryBenchmarks": {
      "averageCAC": 150,
      "averageLTV": 1200,
      "averageConversion": 2.5,
      "averageTrafficGrowth": 15,
      "typicalDirectoryROI": 200
    }
  },
  "marketOpportunities": [
    {
      "opportunity": "Opportunity name",
      "description": "Detailed description",
      "marketSize": 25.5,
      "growthPotential": 85,
      "competitionLevel": "low|medium|high",
      "timeToCapture": 12,
      "requiredInvestment": 10000,
      "expectedROI": 300
    }
  ],
  "riskFactors": [
    {
      "risk": "Market risk",
      "probability": 30,
      "impact": "low|medium|high|critical",
      "mitigation": ["Mitigation strategies"],
      "timeline": "Short-term|Medium-term|Long-term"
    }
  ],
  "successPredictors": {
    "keyFactors": ["Critical success factors"],
    "probabilityScore": 75,
    "benchmarkMetrics": [
      {
        "metric": "Customer Acquisition Cost",
        "currentValue": 100,
        "industryAverage": 150,
        "topPerformer": 80,
        "improvement": "Optimization strategy"
      }
    ],
    "successTimeline": [
      {
        "milestone": "First 100 customers",
        "timeframe": "3-6 months",
        "probability": 80,
        "dependencies": ["Product-market fit", "Marketing execution"],
        "successMetrics": ["Customer satisfaction > 4.5", "Retention > 80%"]
      }
    ]
  }
}

Base your analysis on current market conditions, industry data, and business model viability.`

    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: this.config.temperature,
      max_tokens: 2000,
    })

    try {
      return JSON.parse(response.choices[0].message.content || '{}')
    } catch (error) {
      logger.warn('Failed to parse industry analysis', { metadata: { error } })
      return this.getFallbackIndustryInsights(profile)
    }
  }

  private async analyzeCompetitiveLandscape(
    profile: EnhancedBusinessProfile,
    context: AnalysisContext
  ): Promise<CompetitiveAnalysis> {
    if (!this.config.enableCompetitorAnalysis) {
      return this.getFallbackCompetitiveAnalysis()
    }

    const prompt = `Analyze the competitive landscape for this business as an expert market researcher.

BUSINESS PROFILE:
Name: ${profile.name}
Category: ${profile.primaryCategory}  
Industry: ${profile.industryVertical}
Description: ${profile.description}
Target Market: ${JSON.stringify(profile.targetMarket)}

Provide competitive analysis in JSON format:
{
  "directCompetitors": [
    {
      "name": "Competitor name",
      "domain": "competitor.com",
      "description": "What they do",
      "marketShare": 15.5,
      "strengths": ["Their key strengths"],
      "weaknesses": ["Their weaknesses"],
      "directoryPresence": ["Directories they're likely in"],
      "seoStrength": 85,
      "socialFollowing": 25000,
      "estimatedRevenue": 5000000
    }
  ],
  "indirectCompetitors": [
    {
      "name": "Indirect competitor",
      "domain": "indirect.com", 
      "description": "Alternative solution",
      "marketShare": 8.2,
      "strengths": ["Their advantages"],
      "weaknesses": ["Their limitations"],
      "directoryPresence": ["Directory presence"],
      "seoStrength": 70,
      "socialFollowing": 15000
    }
  ],
  "marketGaps": [
    {
      "description": "Underserved market segment",
      "opportunity": "Specific opportunity",
      "difficulty": "low|medium|high",
      "timeToMarket": 6,
      "potentialRevenue": 2000000
    }
  ],
  "competitiveAdvantages": ["Unique advantages this business has"],
  "weaknesses": ["Areas where competitors are stronger"],
  "differentiationOpportunities": ["Ways to differentiate"],
  "competitorDirectoryPresence": [
    {
      "competitor": "Competitor name",
      "directories": [
        {
          "name": "Directory name",
          "listed": true,
          "ranking": 3,
          "traffic": 1000
        }
      ],
      "totalPresence": 25,
      "gapOpportunities": ["Directories they're missing"]
    }
  ],
  "marketShare": {
    "totalMarketSize": 1000000000,
    "currentMarketShare": 0.1,
    "targetMarketShare": 2.5,
    "topCompetitors": [
      {
        "name": "Market leader",
        "marketShare": 35.5,
        "growth": 12.5
      }
    ]
  }
}

Focus on realistic, research-backed competitive intelligence.`

    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: this.config.temperature,
      max_tokens: 2000,
    })

    try {
      return JSON.parse(response.choices[0].message.content || '{}')
    } catch (error) {
      logger.warn('Failed to parse competitive analysis', { metadata: { error } })
      return this.getFallbackCompetitiveAnalysis()
    }
  }

  private async analyzeMarketPositioning(
    profile: EnhancedBusinessProfile,
    competitiveAnalysis: CompetitiveAnalysis
  ): Promise<MarketPositioning> {
    const prompt = `Develop strategic market positioning recommendations for this business.

BUSINESS PROFILE:
${JSON.stringify(profile, null, 2)}

COMPETITIVE LANDSCAPE:
Market Gaps: ${JSON.stringify(competitiveAnalysis.marketGaps)}
Competitive Advantages: ${JSON.stringify(competitiveAnalysis.competitiveAdvantages)}
Differentiation Opportunities: ${JSON.stringify(competitiveAnalysis.differentiationOpportunities)}

Provide positioning strategy in JSON format:
{
  "currentPosition": "How they're currently positioned in market",
  "recommendedPosition": "Optimal market positioning",
  "valueProposition": {
    "primary": "Core value proposition",
    "secondary": ["Supporting value props"],
    "differentiators": ["Key differentiators"],
    "benefits": ["Customer benefits"],
    "proofPoints": ["Evidence/credibility"]
  },
  "messagingFramework": {
    "coreMessage": "Central brand message",
    "audienceMessages": [
      {
        "audience": "Primary audience segment",
        "message": "Tailored message",
        "tone": "Professional|Friendly|Expert|Casual",
        "channels": ["LinkedIn", "Industry forums"]
      }
    ],
    "channelMessages": [
      {
        "channel": "Directory listings",
        "message": "Directory-optimized message",
        "format": "Short description",
        "cta": "Call to action"
      }
    ],
    "brandVoice": "Authoritative expert|Approachable guide|Innovation leader",
    "keyThemes": ["Key messaging themes"]
  },
  "brandingRecommendations": [
    {
      "category": "Visual identity",
      "recommendation": "Specific recommendation",
      "reasoning": "Why this matters",
      "priority": "high|medium|low",
      "implementation": "How to implement"
    }
  ],
  "audienceSegmentation": [
    {
      "name": "Primary segment name",
      "size": 50000,
      "characteristics": ["Key characteristics"],
      "painPoints": ["Specific pain points"],
      "preferredChannels": ["Communication channels"],
      "messagingApproach": "How to message this segment"
    }
  ]
}`

    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: this.config.temperature,
      max_tokens: 1500,
    })

    try {
      return JSON.parse(response.choices[0].message.content || '{}')
    } catch (error) {
      logger.warn('Failed to parse market positioning', { metadata: { error } })
      return this.getFallbackMarketPositioning(profile)
    }
  }

  private async projectRevenuePotential(
    profile: EnhancedBusinessProfile,
    industryInsights: IndustryInsights
  ): Promise<RevenueProjections> {
    const prompt = `Project revenue potential for this business based on directory submissions and market opportunities.

BUSINESS PROFILE:
Business Model: ${JSON.stringify(profile.businessModel)}
Target Market: ${JSON.stringify(profile.targetMarket)}
Industry Benchmarks: ${JSON.stringify(industryInsights.analysis.industryBenchmarks)}

Create realistic revenue projections in JSON format:
{
  "baseline": {
    "timeframe": "1year",
    "projectedRevenue": 250000,
    "trafficIncrease": 150,
    "leadIncrease": 85,
    "conversionRate": 2.5,
    "customerLifetimeValue": 1200,
    "assumptions": ["Key assumptions for baseline scenario"]
  },
  "conservative": {
    "timeframe": "1year", 
    "projectedRevenue": 180000,
    "trafficIncrease": 100,
    "leadIncrease": 60,
    "conversionRate": 2.0,
    "customerLifetimeValue": 1000,
    "assumptions": ["Conservative scenario assumptions"]
  },
  "optimistic": {
    "timeframe": "1year",
    "projectedRevenue": 400000,
    "trafficIncrease": 250,
    "leadIncrease": 150,
    "conversionRate": 3.5,
    "customerLifetimeValue": 1500,
    "assumptions": ["Optimistic scenario assumptions"]
  },
  "directoryROI": [
    {
      "directoryName": "Industry-specific directory",
      "investment": 299,
      "projectedReturn": 2500,
      "roiPercentage": 735,
      "paybackPeriod": 3,
      "riskLevel": "low|medium|high"
    }
  ],
  "paybackPeriod": 6,
  "lifetimeValue": 15000
}`

    const response = await this.openai.chat.completions.create({
      model: this.config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: this.config.temperature,
      max_tokens: 1000,
    })

    try {
      return JSON.parse(response.choices[0].message.content || '{}')
    } catch (error) {
      logger.warn('Failed to parse revenue projections', { metadata: { error } })
      return this.getDefaultRevenueProjections()
    }
  }

  private calculateSuccessMetrics(
    profile: EnhancedBusinessProfile,
    industryInsights: IndustryInsights,
    competitiveAnalysis: CompetitiveAnalysis
  ): SuccessMetrics {
    // Calculate success metrics based on business profile and analysis
    const visibilityScore = this.calculateVisibilityScore(profile)
    const authorityScore = this.calculateAuthorityScore(profile, industryInsights)
    const competitiveAdvantage = this.calculateCompetitiveAdvantageScore(competitiveAnalysis)

    return {
      visibilityScore,
      authorityScore,
      trafficPotential: Math.round(visibilityScore * authorityScore * 10),
      leadGenPotential: Math.round(visibilityScore * 0.8),
      brandExposure: Math.round((visibilityScore + authorityScore) / 2),
      timeToResults: this.estimateTimeToResults(profile),
      competitiveAdvantage
    }
  }

  private calculateVisibilityScore(profile: EnhancedBusinessProfile): number {
    let score = 50 // Base score

    // Business maturity
    if (profile.stage === 'growth' || profile.stage === 'scale') score += 20
    if (profile.stage === 'mature') score += 15

    // Market reach
    if (profile.marketReach === 'national' || profile.marketReach === 'international') score += 15

    // Content quality
    if (profile.contentAnalysis.readabilityScore > 70) score += 10

    return Math.min(100, score)
  }

  private calculateAuthorityScore(profile: EnhancedBusinessProfile, industryInsights: IndustryInsights): number {
    let score = 40 // Base score

    // Industry factors
    if (industryInsights.analysis.competitionLevel === 'low') score += 20
    if (industryInsights.analysis.growthRate > 15) score += 15

    // Business factors
    if (profile.size === 'medium' || profile.size === 'enterprise') score += 15
    if (profile.contentAnalysis.trustSignals.length > 3) score += 10

    return Math.min(100, score)
  }

  private calculateCompetitiveAdvantageScore(competitiveAnalysis: CompetitiveAnalysis): number {
    const advantages = competitiveAnalysis.competitiveAdvantages.length
    const gaps = competitiveAnalysis.marketGaps.length
    
    return Math.min(100, (advantages * 10) + (gaps * 15) + 20)
  }

  private estimateTimeToResults(profile: EnhancedBusinessProfile): number {
    // Base time in days
    let days = 30

    if (profile.stage === 'early' || profile.stage === 'mvp') days += 20
    if (profile.size === 'startup') days += 15
    if (profile.marketReach === 'local') days -= 10

    return Math.max(7, days)
  }

  private calculateAnalysisQuality(websiteData: ExtractedData): number {
    let quality = 50

    if (websiteData.businessProfile.name && websiteData.businessProfile.name !== 'Unknown Business') quality += 15
    if (websiteData.businessProfile.description && websiteData.businessProfile.description.length > 50) quality += 15
    if (websiteData.screenshots.length > 0) quality += 10
    if (websiteData.techStack.website.framework) quality += 5
    if (websiteData.socialPresence.platforms.length > 2) quality += 5

    return Math.min(100, quality)
  }

  private calculateConfidenceScore(
    categorization: BusinessCategorization,
    industryInsights: IndustryInsights,
    websiteData: ExtractedData
  ): number {
    let confidence = 30

    // Categorization confidence
    confidence += Math.round(categorization.confidence * 0.4)

    // Data quality
    if (websiteData.businessProfile.description && websiteData.businessProfile.description.length > 100) confidence += 10
    if (websiteData.contentAnalysis.keyThemes.length > 5) confidence += 10
    if (websiteData.techStack.website.framework) confidence += 5

    // Industry analysis quality
    if (industryInsights.analysis.marketSize > 0) confidence += 5
    if (industryInsights.marketOpportunities.length > 0) confidence += 10

    return Math.min(100, confidence)
  }

  // Fallback methods

  private getFallbackCategorization(websiteData: ExtractedData): BusinessCategorization {
    return {
      primaryCategory: 'Professional Services',
      confidence: 40,
      secondaryCategories: [],
      industryVertical: 'General Business',
      businessModel: {
        type: 'B2B',
        revenueStreams: ['Services'],
        pricingModel: 'one-time',
        customerAcquisitionModel: ['Direct sales']
      },
      marketFocus: 'B2B'
    }
  }

  private getFallbackBusinessProfile(
    websiteData: ExtractedData, 
    categorization: BusinessCategorization
  ): EnhancedBusinessProfile {
    return {
      name: websiteData.businessProfile.name || 'Unknown Business',
      domain: websiteData.businessProfile.domain || '',
      description: websiteData.businessProfile.description || '',
      primaryCategory: categorization.primaryCategory,
      secondaryCategories: [],
      industryVertical: categorization.industryVertical,
      businessModel: categorization.businessModel,
      targetMarket: {
        primaryAudience: 'Business professionals',
        secondaryAudiences: [],
        demographics: { ageRanges: [], genders: [], incomes: [], educations: [], locations: [], occupations: [] },
        psychographics: { values: [], interests: [], lifestyle: [], personality: [], attitudes: [] },
        painPoints: [],
        buyingBehavior: { decisionFactors: [], purchaseFrequency: '', averageOrderValue: 0, seasonality: '', channels: [] }
      },
      location: websiteData.businessProfile.location || { headquarters: { city: '', country: '' }, offices: [], serviceAreas: [], timeZones: [] },
      serviceAreas: [],
      marketReach: 'local',
      size: 'small',
      stage: 'early',
      contactInfo: websiteData.businessProfile.contactInfo || {},
      socialPresence: websiteData.socialPresence,
      techStack: websiteData.techStack,
      contentAnalysis: websiteData.contentAnalysis
    }
  }

  private getFallbackIndustryInsights(profile: EnhancedBusinessProfile): IndustryInsights {
    return {
      analysis: {
        primaryIndustry: profile.industryVertical,
        subIndustries: [],
        marketSize: 10,
        growthRate: 5,
        competitionLevel: 'medium',
        marketTrends: ['Digital transformation', 'Remote work adoption'],
        seasonality: [],
        regulatoryFactors: [],
        keySuccessFactors: ['Customer satisfaction', 'Quality service delivery'],
        industryBenchmarks: {
          averageCAC: 200,
          averageLTV: 1500,
          averageConversion: 2.5,
          averageTrafficGrowth: 10,
          typicalDirectoryROI: 150
        }
      },
      marketOpportunities: [],
      riskFactors: [],
      successPredictors: {
        keyFactors: ['Product-market fit', 'Marketing execution'],
        probabilityScore: 60,
        benchmarkMetrics: [],
        successTimeline: []
      }
    }
  }

  private getFallbackCompetitiveAnalysis(): CompetitiveAnalysis {
    return {
      directCompetitors: [],
      indirectCompetitors: [],
      marketGaps: [],
      competitiveAdvantages: ['Personalized service'],
      weaknesses: ['Limited brand recognition'],
      differentiationOpportunities: ['Niche specialization'],
      competitorDirectoryPresence: [],
      marketShare: {
        totalMarketSize: 1000000,
        currentMarketShare: 0.1,
        targetMarketShare: 1.0,
        topCompetitors: []
      }
    }
  }

  private getFallbackMarketPositioning(profile: EnhancedBusinessProfile): MarketPositioning {
    return {
      currentPosition: 'Emerging player in the market',
      recommendedPosition: 'Specialized service provider with personal touch',
      valueProposition: {
        primary: 'Quality service with personalized attention',
        secondary: [],
        differentiators: [],
        benefits: [],
        proofPoints: []
      },
      messagingFramework: {
        coreMessage: 'Professional services you can trust',
        audienceMessages: [],
        channelMessages: [],
        brandVoice: 'Professional and approachable',
        keyThemes: []
      },
      brandingRecommendations: [],
      audienceSegmentation: []
    }
  }

  private getDefaultRevenueProjections(): RevenueProjections {
    return {
      baseline: {
        timeframe: '1year',
        projectedRevenue: 100000,
        trafficIncrease: 75,
        leadIncrease: 50,
        conversionRate: 2.0,
        customerLifetimeValue: 1000,
        assumptions: ['Conservative growth assumptions']
      },
      conservative: {
        timeframe: '1year',
        projectedRevenue: 75000,
        trafficIncrease: 50,
        leadIncrease: 35,
        conversionRate: 1.5,
        customerLifetimeValue: 800,
        assumptions: ['Low-risk scenario']
      },
      optimistic: {
        timeframe: '1year',
        projectedRevenue: 150000,
        trafficIncrease: 125,
        leadIncrease: 85,
        conversionRate: 3.0,
        customerLifetimeValue: 1500,
        assumptions: ['High-growth scenario']
      },
      directoryROI: [],
      paybackPeriod: 8,
      lifetimeValue: 5000
    }
  }
}

// Default configuration
export const DEFAULT_AI_ANALYSIS_CONFIG: AIAnalysisConfig = {
  model: 'gpt-4o',
  temperature: 0.3,
  maxTokens: 2500,
  enableRevenueProjections: true,
  enableCompetitorAnalysis: true,
  analysisDepth: 'comprehensive'
}

// Factory function
export function createAIBusinessAnalyzer(config?: Partial<AIAnalysisConfig>): AIBusinessAnalyzer {
  return new AIBusinessAnalyzer({ ...DEFAULT_AI_ANALYSIS_CONFIG, ...config })
}