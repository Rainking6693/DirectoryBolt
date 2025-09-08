/**
 * Phase 3.2: Enhanced AI Integration Service
 * 
 * This service orchestrates the complete AI-enhanced DirectoryBolt workflow,
 * connecting the AI Business Intelligence Engine, Airtable storage, caching system,
 * and customer dashboard functionality for the $299+ AI-powered platform.
 */

import { BusinessIntelligence, DirectoryOpportunityMatrix, RevenueProjections } from '../types/business-intelligence'
import { AirtableService, BusinessSubmissionRecord, createAirtableService } from './airtable'
import { AIAnalysisCacheService, createAIAnalysisCacheService } from './ai-analysis-cache'

export interface AIAnalysisRequest {
  customerId: string
  businessProfile: {
    businessName: string
    website: string
    description: string
    email: string
    phone?: string
    city: string
    state: string
    industry?: string
    targetAudience?: string
  }
  analysisOptions?: {
    depth: 'basic' | 'standard' | 'comprehensive'
    includeCompetitorAnalysis: boolean
    includeRevenueProjections: boolean
    includeDirectoryOptimization: boolean
    forceRefresh: boolean
  }
}

export interface AIAnalysisResult {
  success: boolean
  cached: boolean
  analysis: {
    businessIntelligence: BusinessIntelligence
    directoryOpportunities: DirectoryOpportunityMatrix
    revenueProjections: RevenueProjections
  }
  metadata: {
    processingTime: number
    costSavings?: number
    confidenceScore: number
    analysisVersion: string
    cacheInfo?: {
      daysOld: number
      reason: string
    }
  }
  recommendations: {
    immediateActions: string[]
    shortTermGoals: string[]
    longTermStrategy: string[]
    priorityDirectories: Array<{
      name: string
      priority: number
      estimatedROI: number
    }>
  }
  error?: string
}

export interface OptimizationTracking {
  customerId: string
  metrics: {
    directoriesSubmitted: number
    approvalRate: number
    trafficIncrease: number
    leadIncrease: number
    revenueImpact: number
  }
  comparisonToPredictions: {
    trafficVariance: number // percentage difference from predicted
    leadVariance: number
    roiVariance: number
  }
}

export class EnhancedAIIntegrationService {
  private airtableService: AirtableService
  private cacheService: AIAnalysisCacheService

  constructor(
    airtableService?: AirtableService,
    cacheService?: AIAnalysisCacheService
  ) {
    this.airtableService = airtableService || createAirtableService()
    this.cacheService = cacheService || createAIAnalysisCacheService()
  }

  /**
   * Phase 3.2: Complete AI-Enhanced Business Analysis Workflow
   */
  async performEnhancedAnalysis(request: AIAnalysisRequest): Promise<AIAnalysisResult> {
    const startTime = Date.now()
    
    try {
      console.log('🚀 Starting enhanced AI analysis workflow for:', request.customerId)

      // Step 1: Validate customer and business profile
      await this.validateCustomerAndProfile(request)

      // Step 2: Check cache unless force refresh is requested
      let analysisResult: any = null
      let cached = false
      let cacheInfo = null

      if (!request.analysisOptions?.forceRefresh) {
        console.log('🔍 Checking analysis cache...')
        const { cached: cachedResult, validation } = await this.cacheService.getCachedAnalysisOrValidate(
          request.customerId,
          request.businessProfile as Partial<BusinessSubmissionRecord>
        )

        if (validation.isValid && cachedResult) {
          console.log('✅ Using cached analysis - Cost savings achieved!')
          analysisResult = {
            businessIntelligence: cachedResult.analysisData,
            directoryOpportunities: cachedResult.directoryOpportunities,
            revenueProjections: cachedResult.revenueProjections
          }
          cached = true
          cacheInfo = {
            daysOld: validation.daysOld || 0,
            reason: validation.reason || 'fresh'
          }
        }
      }

      // Step 3: Perform new analysis if not cached
      if (!analysisResult) {
        console.log('🧠 Performing comprehensive AI analysis...')
        analysisResult = await this.executeAIAnalysis(request)

        // Step 4: Store results in cache
        console.log('💾 Caching analysis results...')
        await this.cacheService.storeAnalysisResults(
          request.customerId,
          analysisResult.businessIntelligence,
          analysisResult.directoryOpportunities,
          analysisResult.revenueProjections,
          request.businessProfile as Partial<BusinessSubmissionRecord>
        )

        cached = false
      }

      // Step 5: Generate actionable recommendations
      const recommendations = this.generateRecommendations(
        analysisResult.businessIntelligence,
        analysisResult.directoryOpportunities
      )

      // Step 6: Update customer record with analysis metadata
      await this.updateCustomerAnalysisMetadata(request.customerId, {
        analysisDate: new Date(),
        confidenceScore: analysisResult.businessIntelligence.confidence,
        analysisVersion: '3.2.0'
      })

      const processingTime = Date.now() - startTime

      console.log('✅ Enhanced AI analysis completed successfully')

      return {
        success: true,
        cached,
        analysis: analysisResult,
        metadata: {
          processingTime,
          costSavings: cached ? 299 : undefined, // Estimated cost savings
          confidenceScore: analysisResult.businessIntelligence.confidence,
          analysisVersion: '3.2.0',
          cacheInfo
        },
        recommendations
      }

    } catch (error) {
      console.error('❌ Enhanced AI analysis failed:', error)
      return {
        success: false,
        cached: false,
        analysis: null as any,
        metadata: {
          processingTime: Date.now() - startTime,
          confidenceScore: 0,
          analysisVersion: '3.2.0'
        },
        recommendations: {
          immediateActions: [],
          shortTermGoals: [],
          longTermStrategy: [],
          priorityDirectories: []
        },
        error: error instanceof Error ? error.message : 'Analysis failed'
      }
    }
  }

  /**
   * Phase 3.2: Track optimization progress and compare to predictions
   */
  async trackOptimizationProgress(tracking: OptimizationTracking): Promise<{
    success: boolean
    insights: {
      performanceVsPredictions: string
      recommendedAdjustments: string[]
      nextSteps: string[]
    }
    error?: string
  }> {
    try {
      console.log('📊 Tracking optimization progress for:', tracking.customerId)

      // Update Airtable with optimization metrics
      await this.airtableService.trackOptimizationProgress(
        tracking.customerId,
        {
          directoriesSubmittedSinceAnalysis: tracking.metrics.directoriesSubmitted,
          approvalRate: tracking.metrics.approvalRate,
          trafficIncrease: tracking.metrics.trafficIncrease,
          leadIncrease: tracking.metrics.leadIncrease
        }
      )

      // Analyze performance vs predictions
      const insights = this.generateOptimizationInsights(tracking)

      console.log('✅ Optimization progress tracked successfully')

      return {
        success: true,
        insights
      }

    } catch (error) {
      console.error('❌ Failed to track optimization progress:', error)
      return {
        success: false,
        insights: {
          performanceVsPredictions: 'Unable to analyze performance',
          recommendedAdjustments: [],
          nextSteps: []
        },
        error: error instanceof Error ? error.message : 'Tracking failed'
      }
    }
  }

  /**
   * Phase 3.2: Get customer dashboard data including analysis results and progress
   */
  async getCustomerDashboardData(customerId: string): Promise<{
    businessProfile: any
    analysisResults: BusinessIntelligence | null
    directoryOpportunities: DirectoryOpportunityMatrix | null
    optimizationProgress: any
    recommendations: any
    cacheStatus: {
      lastUpdated: Date | null
      daysOld: number
      needsRefresh: boolean
    }
  }> {
    try {
      console.log('📋 Getting customer dashboard data for:', customerId)

      // Get customer record
      const customer = await this.airtableService.findByCustomerId(customerId)
      if (!customer) {
        throw new Error('Customer not found')
      }

      // Get cached analysis results
      const cachedAnalysis = await this.cacheService.getCachedAnalysisResults(customerId)
      
      // Get analysis history for trends
      const analysisHistory = await this.airtableService.getAnalysisHistory(customerId)

      // Parse stored data
      let directoryOpportunities = null
      if (customer.prioritizedDirectories) {
        try {
          directoryOpportunities = {
            prioritizedSubmissions: JSON.parse(customer.prioritizedDirectories),
            totalDirectories: 150,
            categorizedOpportunities: {},
            estimatedResults: {},
            submissionStrategy: {}
          }
        } catch (e) {
          console.warn('Failed to parse directory opportunities')
        }
      }

      // Calculate cache status
      const lastUpdated = customer.lastAnalysisDate ? new Date(customer.lastAnalysisDate) : null
      const daysOld = lastUpdated ? Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24)) : 999
      const needsRefresh = daysOld > 30 || !cachedAnalysis

      return {
        businessProfile: {
          businessName: customer.businessName,
          website: customer.website,
          description: customer.description,
          email: customer.email,
          phone: customer.phone,
          city: customer.city,
          state: customer.state,
          packageType: customer.packageType
        },
        analysisResults: cachedAnalysis,
        directoryOpportunities,
        optimizationProgress: {
          directoriesSubmitted: customer.directoriesSubmitted,
          failedDirectories: customer.failedDirectories,
          submissionStatus: customer.submissionStatus
        },
        recommendations: analysisHistory.length > 0 ? {
          competitivePositioning: customer.competitivePositioning,
          seoRecommendations: customer.seoRecommendations ? JSON.parse(customer.seoRecommendations) : []
        } : null,
        cacheStatus: {
          lastUpdated,
          daysOld,
          needsRefresh
        }
      }

    } catch (error) {
      console.error('❌ Failed to get customer dashboard data:', error)
      throw error
    }
  }

  /**
   * Phase 3.2: Get system analytics and performance metrics
   */
  async getSystemAnalytics(): Promise<{
    cacheMetrics: any
    totalCustomers: number
    analysisStats: {
      totalAnalyses: number
      averageConfidenceScore: number
      topPerformingIndustries: string[]
    }
    costSavings: number
  }> {
    try {
      console.log('📈 Getting system analytics...')

      const cacheMetrics = await this.cacheService.getCacheMetrics(30)
      const cacheStats = await this.cacheService.getCacheStats()

      // Get all completed customers
      const customers = await this.airtableService.findByStatus('completed')
      
      // Calculate analysis statistics
      const customersWithAnalysis = customers.filter((c: any) => c.aiAnalysisResults)
      const confidenceScores = customersWithAnalysis
        .map((c: any) => c.analysisConfidenceScore)
        .filter(score => score > 0)

      const averageConfidenceScore = confidenceScores.length > 0
        ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length
        : 0

      // Get industry distribution
      const industries = customersWithAnalysis
        .map((c: any) => c.industryCategory)
        .filter(Boolean)
      
      const industryCount = industries.reduce((acc: any, industry) => {
        acc[industry] = (acc[industry] || 0) + 1
        return acc
      }, {})

      const topPerformingIndustries = Object.entries(industryCount)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([industry]) => industry)

      return {
        cacheMetrics,
        totalCustomers: customers.length,
        analysisStats: {
          totalAnalyses: customersWithAnalysis.length,
          averageConfidenceScore: Math.round(averageConfidenceScore * 100) / 100,
          topPerformingIndustries
        },
        costSavings: cacheMetrics.costSavings
      }

    } catch (error) {
      console.error('❌ Failed to get system analytics:', error)
      throw error
    }
  }

  /**
   * Helper: Validate customer and business profile
   */
  private async validateCustomerAndProfile(request: AIAnalysisRequest): Promise<void> {
    if (!request.customerId) {
      throw new Error('Customer ID is required')
    }

    if (!request.businessProfile.businessName || !request.businessProfile.website) {
      throw new Error('Business name and website are required')
    }

    // Check if customer exists
    const customer = await this.airtableService.findByCustomerId(request.customerId)
    if (!customer) {
      throw new Error('Customer not found in system')
    }
  }

  /**
   * Helper: Execute AI analysis (integrates with Alex's AI engine)
   */
  private async executeAIAnalysis(request: AIAnalysisRequest): Promise<{
    businessIntelligence: BusinessIntelligence
    directoryOpportunities: DirectoryOpportunityMatrix
    revenueProjections: RevenueProjections
  }> {
    // This would integrate with Alex's AI Business Intelligence Engine
    // For now, we'll simulate the analysis process
    console.log('🔮 Executing comprehensive AI analysis...')
    
    // Simulate analysis time based on depth
    const analysisTime = {
      basic: 2000,
      standard: 5000,
      comprehensive: 10000
    }[request.analysisOptions?.depth || 'standard']

    await new Promise(resolve => setTimeout(resolve, analysisTime))

    // Return mock analysis (in production, this would call Alex's service)
    return {
      businessIntelligence: {} as BusinessIntelligence, // Mock data would be populated here
      directoryOpportunities: {} as DirectoryOpportunityMatrix,
      revenueProjections: {} as RevenueProjections
    }
  }

  /**
   * Helper: Generate actionable recommendations
   */
  private generateRecommendations(
    intelligence: BusinessIntelligence,
    opportunities: DirectoryOpportunityMatrix
  ): AIAnalysisResult['recommendations'] {
    return {
      immediateActions: [
        'Set up Google My Business profile',
        'Optimize website meta descriptions',
        'Submit to top 5 priority directories'
      ],
      shortTermGoals: [
        'Implement SEO improvements',
        'Develop customer testimonial strategy',
        'Complete directory submission campaign'
      ],
      longTermStrategy: [
        'Build content marketing strategy',
        'Develop niche specialization',
        'Expand market reach regionally'
      ],
      priorityDirectories: opportunities.prioritizedSubmissions?.slice(0, 10).map(dir => ({
        name: dir.directoryName,
        priority: dir.priority,
        estimatedROI: dir.expectedROI
      })) || []
    }
  }

  /**
   * Helper: Generate optimization insights
   */
  private generateOptimizationInsights(tracking: OptimizationTracking): {
    performanceVsPredictions: string
    recommendedAdjustments: string[]
    nextSteps: string[]
  } {
    const { comparisonToPredictions } = tracking

    let performance = 'On track'
    if (comparisonToPredictions.trafficVariance > 20) performance = 'Exceeding expectations'
    else if (comparisonToPredictions.trafficVariance < -20) performance = 'Below expectations'

    return {
      performanceVsPredictions: performance,
      recommendedAdjustments: [
        'Focus on high-converting directories',
        'Optimize listing descriptions',
        'Improve response time to inquiries'
      ],
      nextSteps: [
        'Continue directory submissions',
        'Monitor conversion rates',
        'Expand to secondary markets'
      ]
    }
  }

  /**
   * Helper: Update customer analysis metadata
   */
  private async updateCustomerAnalysisMetadata(customerId: string, metadata: {
    analysisDate: Date
    confidenceScore: number
    analysisVersion: string
  }): Promise<void> {
    const customer = await this.airtableService.findByCustomerId(customerId)
    if (customer) {
      await this.airtableService.updateBusinessSubmission(customer.recordId, {
        lastAnalysisDate: metadata.analysisDate.toISOString(),
        analysisConfidenceScore: metadata.confidenceScore,
        analysisVersion: metadata.analysisVersion
      } as any)
    }
  }
}

/**
 * Factory function to create Enhanced AI Integration Service
 */
export function createEnhancedAIIntegrationService(
  airtableService?: AirtableService,
  cacheService?: AIAnalysisCacheService
): EnhancedAIIntegrationService {
  return new EnhancedAIIntegrationService(airtableService, cacheService)
}

/**
 * Export default instance
 */
export default createEnhancedAIIntegrationService