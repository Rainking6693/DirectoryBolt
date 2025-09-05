// 🚀 DIRECTORY MATCHER - Intelligent Category Matching & Submission Optimization
// AI-powered directory selection with platform-specific optimization and success probability scoring

import OpenAI from 'openai'
import { logger } from '../utils/logger'
import { DirectoryDatabase } from '../database/directories'
import {
  BusinessIntelligence,
  EnhancedBusinessProfile,
  DirectoryOpportunityMatrix,
  PrioritizedSubmission,
  DirectoryListing,
  CategorizedOpportunities,
  SubmissionStrategy,
  DirectoryResultProjections
} from '../types/business-intelligence'

export interface DirectoryMatchingConfig {
  maxDirectories: number
  enableAIOptimization: boolean
  includeInternational: boolean
  includePremium: boolean
  budgetRange: {
    min: number
    max: number
  }
  industryFocus: string[]
  targetROI: number
  analysisDepth: 'basic' | 'comprehensive'
}

export interface DirectoryRecord {
  id: string
  name: string
  category: string
  subcategory?: string
  authority: number
  estimatedTraffic: number
  submissionUrl: string
  cost: number
  difficulty: 'easy' | 'medium' | 'hard'
  approvalRate: number
  averageTimeToApproval: number // days
  features: string[]
  requirements: DirectoryRequirements
  targetAudience: string[]
  geographicFocus: string[]
  industryFocus: string[]
  businessTypes: string[]
  contentGuidelines: ContentGuidelines
  seoValue: number
  trafficQuality: number
  conversionPotential: number
}

export interface DirectoryRequirements {
  businessAge?: number // months
  revenue?: number
  employees?: number
  location?: string[]
  businessType?: string[]
  verification?: VerificationRequirement[]
  contentRequirements?: string[]
}

export interface VerificationRequirement {
  type: 'email' | 'phone' | 'domain' | 'business_license' | 'payment'
  required: boolean
  description: string
}

export interface ContentGuidelines {
  titleLength?: { min: number; max: number }
  descriptionLength?: { min: number; max: number }
  allowedTags?: string[]
  imageRequirements?: ImageRequirement[]
  prohibitedContent?: string[]
  keywordDensity?: { max: number }
}

export interface ImageRequirement {
  type: 'logo' | 'screenshot' | 'product' | 'team'
  dimensions?: { width: number; height: number }
  maxSize?: number // KB
  formats?: string[]
  required: boolean
}

export interface MatchingResult {
  directory: DirectoryRecord
  matchScore: number // 0-100
  successProbability: number // 0-100
  expectedROI: number
  optimizedListing: DirectoryListing
  submissionStrategy: DirectorySubmissionStrategy
  riskFactors: string[]
  opportunities: string[]
}

export interface DirectorySubmissionStrategy {
  priority: number // 1-100
  timeline: SubmissionTimeline
  preparation: PreparationTask[]
  optimizationTips: string[]
  followUpActions: string[]
}

export interface SubmissionTimeline {
  preparation: number // days
  submission: number // days
  review: number // days
  goLive: number // days
  optimization: number // days
  totalTime: number // days
}

export interface PreparationTask {
  task: string
  description: string
  timeRequired: number // hours
  priority: 'high' | 'medium' | 'low'
  dependencies: string[]
}

export class DirectoryMatcher {
  private openai: OpenAI
  private config: DirectoryMatchingConfig
  private directoryDb: DirectoryDatabase

  constructor(config: DirectoryMatchingConfig) {
    this.config = config
    this.directoryDb = new DirectoryDatabase()

    if (config.enableAIOptimization) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OpenAI API key required for AI-powered directory optimization')
      }
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
    }

    logger.info('Directory Matcher initialized', {
      metadata: {
        aiEnabled: config.enableAIOptimization,
        maxDirectories: config.maxDirectories,
        targetROI: config.targetROI
      }
    })
  }

  async findOptimalDirectories(businessIntelligence: BusinessIntelligence): Promise<DirectoryOpportunityMatrix> {
    try {
      logger.info('Starting intelligent directory matching', {
        metadata: {
          businessCategory: businessIntelligence.profile.primaryCategory,
          industry: businessIntelligence.profile.industryVertical
        }
      })

      // Step 1: Get all available directories
      const allDirectories = await this.getAllDirectories()

      // Step 2: Apply initial filters
      const filteredDirectories = this.applyFilters(allDirectories, businessIntelligence.profile)

      // Step 3: Calculate match scores and success probabilities
      const matchingResults = await this.calculateMatches(filteredDirectories, businessIntelligence)

      // Step 4: Categorize and prioritize opportunities
      const categorizedOpportunities = this.categorizeOpportunities(matchingResults)

      // Step 5: Create prioritized submissions list
      const prioritizedSubmissions = this.prioritizeSubmissions(matchingResults, businessIntelligence)

      // Step 6: Generate submission strategy
      const submissionStrategy = this.generateSubmissionStrategy(prioritizedSubmissions, businessIntelligence)

      // Step 7: Project results and ROI
      const estimatedResults = this.projectResults(prioritizedSubmissions, businessIntelligence)

      const directoryMatrix: DirectoryOpportunityMatrix = {
        totalDirectories: filteredDirectories.length,
        categorizedOpportunities,
        prioritizedSubmissions: prioritizedSubmissions.slice(0, this.config.maxDirectories),
        estimatedResults,
        submissionStrategy
      }

      logger.info('Directory matching completed successfully', {
        metadata: {
          totalMatched: matchingResults.length,
          highPriority: prioritizedSubmissions.filter(p => p.priority > 80).length,
          expectedROI: estimatedResults.totalTrafficIncrease
        }
      })

      return directoryMatrix

    } catch (error) {
      logger.error('Directory matching failed', { metadata: { error } })
      throw new Error(`Directory matching failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async getAllDirectories(): Promise<DirectoryRecord[]> {
    try {
      // Get directories from database
      const dbDirectories = await this.directoryDb.getDirectories({ 
        limit: 1000,
        orderBy: 'authority DESC'
      })

      // Transform to our format and add additional data
      return dbDirectories.map(dir => this.transformDirectoryRecord(dir))

    } catch (error) {
      logger.warn('Failed to load directories from database, using fallback', { metadata: { error } })
      return this.getFallbackDirectories()
    }
  }

  private transformDirectoryRecord(dir: any): DirectoryRecord {
    return {
      id: dir.id,
      name: dir.name,
      category: dir.category || 'General',
      subcategory: dir.subcategory,
      authority: dir.authority || 50,
      estimatedTraffic: dir.estimatedTraffic || dir.estimated_traffic || 1000,
      submissionUrl: dir.submissionUrl || dir.submission_url || '',
      cost: dir.price || 0,
      difficulty: dir.difficulty || 'medium',
      approvalRate: dir.approvalRate || 70,
      averageTimeToApproval: dir.averageTimeToApproval || 7,
      features: dir.features || [],
      requirements: {
        businessAge: dir.minBusinessAge,
        revenue: dir.minRevenue,
        employees: dir.minEmployees,
        location: dir.allowedLocations,
        businessType: dir.allowedBusinessTypes,
        verification: this.parseVerificationRequirements(dir.verification),
        contentRequirements: dir.contentRequirements
      },
      targetAudience: dir.targetAudience || [],
      geographicFocus: dir.geographicFocus || ['Global'],
      industryFocus: dir.industryFocus || [],
      businessTypes: dir.businessTypes || [],
      contentGuidelines: this.parseContentGuidelines(dir.contentGuidelines),
      seoValue: dir.seoValue || this.calculateSEOValue(dir.authority, dir.estimatedTraffic),
      trafficQuality: dir.trafficQuality || 70,
      conversionPotential: dir.conversionPotential || 60
    }
  }

  private parseVerificationRequirements(verification: any): VerificationRequirement[] {
    if (!verification) return []
    
    try {
      if (typeof verification === 'string') {
        return JSON.parse(verification)
      }
      return verification
    } catch {
      return []
    }
  }

  private parseContentGuidelines(guidelines: any): ContentGuidelines {
    if (!guidelines) return {}
    
    try {
      if (typeof guidelines === 'string') {
        return JSON.parse(guidelines)
      }
      return guidelines
    } catch {
      return {}
    }
  }

  private calculateSEOValue(authority: number, traffic: number): number {
    return Math.round((authority * 0.6) + (Math.log10(traffic) * 10))
  }

  private applyFilters(directories: DirectoryRecord[], profile: EnhancedBusinessProfile): DirectoryRecord[] {
    return directories.filter(dir => {
      // Budget filter
      if (dir.cost < this.config.budgetRange.min || dir.cost > this.config.budgetRange.max) {
        return false
      }

      // Geographic filter
      if (!this.config.includeInternational && !dir.geographicFocus.some(geo => 
        ['US', 'USA', 'United States', 'North America', 'Global'].includes(geo)
      )) {
        return false
      }

      // Industry focus filter
      if (this.config.industryFocus.length > 0 && dir.industryFocus.length > 0) {
        const hasIndustryMatch = dir.industryFocus.some(industry =>
          this.config.industryFocus.some(targetIndustry =>
            industry.toLowerCase().includes(targetIndustry.toLowerCase())
          )
        )
        if (!hasIndustryMatch && !dir.industryFocus.includes('General')) {
          return false
        }
      }

      // Business requirements filter
      if (dir.requirements.businessType && dir.requirements.businessType.length > 0) {
        const businessTypeMatch = dir.requirements.businessType.some(type =>
          type.toLowerCase() === profile.businessModel.type.toLowerCase() ||
          type === 'All' || type === 'General'
        )
        if (!businessTypeMatch) {
          return false
        }
      }

      return true
    })
  }

  private async calculateMatches(
    directories: DirectoryRecord[],
    businessIntelligence: BusinessIntelligence
  ): Promise<MatchingResult[]> {
    const results: MatchingResult[] = []

    for (const directory of directories) {
      try {
        const matchScore = this.calculateMatchScore(directory, businessIntelligence.profile)
        const successProbability = this.calculateSuccessProbability(directory, businessIntelligence)
        const expectedROI = this.calculateExpectedROI(directory, businessIntelligence, successProbability)

        let optimizedListing: DirectoryListing
        let submissionStrategy: DirectorySubmissionStrategy

        if (this.config.enableAIOptimization) {
          optimizedListing = await this.generateOptimizedListing(directory, businessIntelligence)
          submissionStrategy = await this.generateSubmissionStrategy(directory, businessIntelligence)
        } else {
          optimizedListing = this.generateBasicListing(directory, businessIntelligence.profile)
          submissionStrategy = this.generateBasicSubmissionStrategy(directory)
        }

        const riskFactors = this.identifyRiskFactors(directory, businessIntelligence.profile)
        const opportunities = this.identifyOpportunities(directory, businessIntelligence.profile)

        results.push({
          directory,
          matchScore,
          successProbability,
          expectedROI,
          optimizedListing,
          submissionStrategy,
          riskFactors,
          opportunities
        })

      } catch (error) {
        logger.warn(`Failed to analyze directory: ${directory.name}`, { metadata: { error } })
      }
    }

    // Sort by combined score (match * success * ROI potential)
    return results.sort((a, b) => {
      const scoreA = a.matchScore * a.successProbability * Math.min(a.expectedROI / 100, 10)
      const scoreB = b.matchScore * b.successProbability * Math.min(b.expectedROI / 100, 10)
      return scoreB - scoreA
    })
  }

  private calculateMatchScore(directory: DirectoryRecord, profile: EnhancedBusinessProfile): number {
    let score = 0

    // Category matching (40 points)
    if (directory.category.toLowerCase() === profile.primaryCategory.toLowerCase()) {
      score += 40
    } else if (profile.secondaryCategories.some(cat => 
      directory.category.toLowerCase().includes(cat.toLowerCase())
    )) {
      score += 25
    } else if (directory.category === 'General' || directory.category === 'Business') {
      score += 15
    }

    // Industry matching (30 points)
    if (directory.industryFocus.includes(profile.industryVertical)) {
      score += 30
    } else if (directory.industryFocus.some(industry => 
      profile.industryVertical.toLowerCase().includes(industry.toLowerCase())
    )) {
      score += 20
    } else if (directory.industryFocus.includes('General') || directory.industryFocus.length === 0) {
      score += 10
    }

    // Target audience matching (20 points)
    if (directory.targetAudience.length > 0) {
      const audienceMatch = directory.targetAudience.some(audience =>
        profile.targetMarket.primaryAudience.toLowerCase().includes(audience.toLowerCase()) ||
        profile.targetMarket.secondaryAudiences.some(secondary =>
          secondary.toLowerCase().includes(audience.toLowerCase())
        )
      )
      if (audienceMatch) score += 20
      else score += 5
    } else {
      score += 10 // Neutral for general directories
    }

    // Geographic matching (10 points)
    if (profile.marketReach === 'international' && directory.geographicFocus.includes('Global')) {
      score += 10
    } else if (profile.marketReach === 'national' && directory.geographicFocus.some(geo =>
      ['US', 'USA', 'United States', 'North America'].includes(geo)
    )) {
      score += 8
    } else {
      score += 5
    }

    return Math.min(100, score)
  }

  private calculateSuccessProbability(
    directory: DirectoryRecord,
    businessIntelligence: BusinessIntelligence
  ): number {
    let probability = directory.approvalRate || 70 // Base approval rate

    // Business maturity factor
    const profile = businessIntelligence.profile
    if (profile.stage === 'mature') probability += 15
    else if (profile.stage === 'growth' || profile.stage === 'scale') probability += 10
    else if (profile.stage === 'early') probability -= 5

    // Business size factor
    if (profile.size === 'enterprise') probability += 10
    else if (profile.size === 'medium') probability += 5
    else if (profile.size === 'startup') probability -= 10

    // Content quality factor
    const contentScore = businessIntelligence.seoAnalysis.contentSEO.contentLength / 100
    if (contentScore > 10) probability += 10
    else if (contentScore > 5) probability += 5
    else probability -= 5

    // Requirements compliance
    const requirements = directory.requirements
    if (requirements.businessAge && this.getBusinessAgeMonths(profile) < requirements.businessAge) {
      probability -= 20
    }
    if (requirements.revenue && this.estimateRevenue(profile) < requirements.revenue) {
      probability -= 15
    }

    // Directory difficulty factor
    if (directory.difficulty === 'easy') probability += 10
    else if (directory.difficulty === 'hard') probability -= 15

    return Math.max(10, Math.min(95, probability))
  }

  private calculateExpectedROI(
    directory: DirectoryRecord,
    businessIntelligence: BusinessIntelligence,
    successProbability: number
  ): number {
    const cost = directory.cost || 1 // Avoid division by zero
    const expectedTraffic = directory.estimatedTraffic * (successProbability / 100)
    const conversionRate = businessIntelligence.industryAnalysis.industryBenchmarks.averageConversion / 100
    const averageOrderValue = businessIntelligence.revenueProjections.baseline.customerLifetimeValue

    const expectedRevenue = expectedTraffic * conversionRate * averageOrderValue * 0.001 // 0.1% of traffic converts
    const roi = ((expectedRevenue - cost) / cost) * 100

    return Math.max(0, roi)
  }

  private async generateOptimizedListing(
    directory: DirectoryRecord,
    businessIntelligence: BusinessIntelligence
  ): Promise<DirectoryListing> {
    if (!this.openai) {
      return this.generateBasicListing(directory, businessIntelligence.profile)
    }

    const prompt = `Create an optimized directory listing for this business on ${directory.name}.

BUSINESS PROFILE:
${JSON.stringify(businessIntelligence.profile, null, 2)}

DIRECTORY INFORMATION:
Name: ${directory.name}
Category: ${directory.category}
Content Guidelines: ${JSON.stringify(directory.contentGuidelines, null, 2)}
Target Audience: ${directory.targetAudience.join(', ')}

MARKET POSITIONING:
${JSON.stringify(businessIntelligence.marketPositioning.valueProposition, null, 2)}

Create an optimized listing in JSON format:
{
  "title": "Compelling 50-60 character title",
  "description": "Directory-optimized description (follow length guidelines)",
  "category": "Best matching category",
  "tags": ["Relevant tags for discoverability"],
  "features": ["Key business features/services"],
  "pricing": {
    "model": "free|one-time|recurring|commission",
    "amount": 0,
    "currency": "USD"
  }
}

Optimization requirements:
1. Use compelling, benefit-focused language
2. Include relevant keywords naturally
3. Follow directory's content guidelines
4. Highlight unique value proposition
5. Match directory's audience expectations
6. Ensure professional tone appropriate for platform`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 800,
      })

      const optimized = JSON.parse(response.choices[0].message.content || '{}')
      
      return {
        title: optimized.title || businessIntelligence.profile.name,
        description: optimized.description || businessIntelligence.profile.description,
        category: optimized.category || directory.category,
        tags: optimized.tags || [],
        images: [], // Would be populated with actual images
        features: optimized.features || [],
        pricing: optimized.pricing,
        contactInfo: businessIntelligence.profile.contactInfo
      }

    } catch (error) {
      logger.warn(`Failed to generate optimized listing for ${directory.name}`, { metadata: { error } })
      return this.generateBasicListing(directory, businessIntelligence.profile)
    }
  }

  private generateBasicListing(directory: DirectoryRecord, profile: EnhancedBusinessProfile): DirectoryListing {
    return {
      title: profile.name || 'Professional Business Services',
      description: profile.description || 'Quality business services you can trust.',
      category: directory.category,
      tags: [profile.primaryCategory, profile.industryVertical].filter(Boolean),
      images: [],
      features: ['Professional Service', 'Quality Focused', 'Customer Satisfaction'],
      contactInfo: profile.contactInfo
    }
  }

  private async generateSubmissionStrategy(
    directory: DirectoryRecord,
    businessIntelligence: BusinessIntelligence
  ): Promise<DirectorySubmissionStrategy> {
    const baseTimeline = this.calculateBaseTimeline(directory)
    const preparationTasks = this.generatePreparationTasks(directory, businessIntelligence.profile)

    return {
      priority: this.calculateSubmissionPriority(directory, businessIntelligence),
      timeline: baseTimeline,
      preparation: preparationTasks,
      optimizationTips: this.generateOptimizationTips(directory, businessIntelligence),
      followUpActions: this.generateFollowUpActions(directory)
    }
  }

  private generateBasicSubmissionStrategy(directory: DirectoryRecord): DirectorySubmissionStrategy {
    return {
      priority: 50,
      timeline: this.calculateBaseTimeline(directory),
      preparation: [],
      optimizationTips: ['Use clear, professional description', 'Include relevant keywords', 'Add contact information'],
      followUpActions: ['Monitor listing status', 'Track traffic/leads', 'Update information as needed']
    }
  }

  private calculateBaseTimeline(directory: DirectoryRecord): SubmissionTimeline {
    const basePrep = directory.difficulty === 'hard' ? 3 : directory.difficulty === 'medium' ? 2 : 1
    const reviewTime = directory.averageTimeToApproval || 7

    return {
      preparation: basePrep,
      submission: 1,
      review: reviewTime,
      goLive: 1,
      optimization: 2,
      totalTime: basePrep + 1 + reviewTime + 1 + 2
    }
  }

  private generatePreparationTasks(
    directory: DirectoryRecord,
    profile: EnhancedBusinessProfile
  ): PreparationTask[] {
    const tasks: PreparationTask[] = []

    // Basic content preparation
    tasks.push({
      task: 'Prepare optimized description',
      description: 'Create compelling, keyword-rich description following directory guidelines',
      timeRequired: 1,
      priority: 'high',
      dependencies: []
    })

    // Image preparation
    if (directory.contentGuidelines.imageRequirements?.some(req => req.required)) {
      tasks.push({
        task: 'Prepare required images',
        description: 'Create/optimize images according to directory specifications',
        timeRequired: 2,
        priority: 'high',
        dependencies: ['Prepare optimized description']
      })
    }

    // Verification requirements
    if (directory.requirements.verification?.some(req => req.required)) {
      tasks.push({
        task: 'Complete verification process',
        description: 'Gather required verification documents and complete authentication',
        timeRequired: 1,
        priority: 'high',
        dependencies: []
      })
    }

    return tasks
  }

  private calculateSubmissionPriority(
    directory: DirectoryRecord,
    businessIntelligence: BusinessIntelligence
  ): number {
    let priority = 50

    // ROI potential
    const expectedROI = this.calculateExpectedROI(directory, businessIntelligence, 70)
    if (expectedROI > 500) priority += 25
    else if (expectedROI > 200) priority += 15
    else if (expectedROI > 100) priority += 10

    // Authority and traffic
    if (directory.authority > 80 && directory.estimatedTraffic > 10000) priority += 20
    else if (directory.authority > 60 && directory.estimatedTraffic > 5000) priority += 15
    else if (directory.authority > 40) priority += 10

    // Cost efficiency
    if (directory.cost === 0) priority += 10
    else if (directory.cost < 50) priority += 5
    else if (directory.cost > 200) priority -= 10

    return Math.max(1, Math.min(100, priority))
  }

  private generateOptimizationTips(
    directory: DirectoryRecord,
    businessIntelligence: BusinessIntelligence
  ): string[] {
    const tips: string[] = []

    // Category-specific tips
    if (directory.category === 'SaaS' || directory.category === 'Software') {
      tips.push('Highlight key software features and integrations')
      tips.push('Include free trial or demo information')
    } else if (directory.category === 'Professional Services') {
      tips.push('Emphasize credentials and expertise')
      tips.push('Include client testimonials if possible')
    }

    // Industry-specific tips based on business intelligence
    if (businessIntelligence.profile.industryVertical === 'FinTech') {
      tips.push('Mention security certifications and compliance')
    } else if (businessIntelligence.profile.industryVertical === 'HealthTech') {
      tips.push('Highlight HIPAA compliance and medical expertise')
    }

    // General optimization tips
    tips.push('Use action-oriented language in your description')
    tips.push('Include specific benefits rather than just features')
    tips.push('Ensure NAP (Name, Address, Phone) consistency')

    return tips
  }

  private generateFollowUpActions(directory: DirectoryRecord): string[] {
    return [
      'Monitor submission status weekly',
      'Engage with directory community if applicable',
      'Track referral traffic and conversions',
      'Update listing information quarterly',
      'Respond promptly to any directory communications',
      `Review and optimize listing after ${directory.averageTimeToApproval * 2} days`
    ]
  }

  private categorizeOpportunities(matchingResults: MatchingResult[]): CategorizedOpportunities {
    return {
      highAuthority: matchingResults
        .filter(r => r.directory.authority > 80)
        .map(r => this.convertToSubmission(r)),
      industrySpecific: matchingResults
        .filter(r => r.directory.industryFocus.length > 0 && !r.directory.industryFocus.includes('General'))
        .map(r => this.convertToSubmission(r)),
      localDirectories: matchingResults
        .filter(r => r.directory.geographicFocus.some(geo => 
          ['Local', 'Regional', 'US', 'USA'].includes(geo)))
        .map(r => this.convertToSubmission(r)),
      nicheDirectories: matchingResults
        .filter(r => r.directory.targetAudience.length > 0 && r.directory.estimatedTraffic < 10000)
        .map(r => this.convertToSubmission(r)),
      freeDirectories: matchingResults
        .filter(r => r.directory.cost === 0)
        .map(r => this.convertToSubmission(r)),
      premiumDirectories: matchingResults
        .filter(r => r.directory.cost > 0)
        .map(r => this.convertToSubmission(r))
    }
  }

  private convertToSubmission(result: MatchingResult): PrioritizedSubmission {
    return {
      directoryId: result.directory.id,
      directoryName: result.directory.name,
      category: result.directory.category,
      priority: result.submissionStrategy.priority,
      successProbability: result.successProbability,
      estimatedTraffic: result.directory.estimatedTraffic,
      cost: result.directory.cost,
      timeInvestment: result.submissionStrategy.timeline.totalTime * 2, // Convert to hours
      expectedROI: result.expectedROI,
      optimizedListing: result.optimizedListing,
      submissionTips: result.submissionStrategy.optimizationTips,
      timeline: result.submissionStrategy.timeline
    }
  }

  private prioritizeSubmissions(
    matchingResults: MatchingResult[],
    businessIntelligence: BusinessIntelligence
  ): PrioritizedSubmission[] {
    return matchingResults
      .map(result => this.convertToSubmission(result))
      .sort((a, b) => b.priority - a.priority)
  }

  private generateSubmissionStrategy(
    submissions: PrioritizedSubmission[],
    businessIntelligence: BusinessIntelligence
  ): SubmissionStrategy {
    const totalDirectories = submissions.length
    const highPriority = submissions.filter(s => s.priority > 80).length
    const mediumPriority = submissions.filter(s => s.priority > 60 && s.priority <= 80).length
    const lowPriority = submissions.filter(s => s.priority <= 60).length

    return {
      totalDirectories,
      submissionPaces: [
        {
          phase: 'Phase 1 - High Priority',
          directoriesPerWeek: Math.ceil(highPriority / 4),
          duration: 4,
          focus: 'High authority and industry-specific directories'
        },
        {
          phase: 'Phase 2 - Medium Priority',
          directoriesPerWeek: Math.ceil(mediumPriority / 6),
          duration: 6,
          focus: 'Niche and local directories'
        },
        {
          phase: 'Phase 3 - Low Priority',
          directoriesPerWeek: Math.ceil(lowPriority / 8),
          duration: 8,
          focus: 'General and supplementary directories'
        }
      ],
      budgetAllocation: [
        {
          category: 'High Authority',
          amount: submissions.filter(s => s.priority > 80).reduce((sum, s) => sum + s.cost, 0),
          percentage: 60,
          expectedROI: 300
        },
        {
          category: 'Industry Specific',
          amount: submissions.filter(s => s.priority > 60 && s.priority <= 80).reduce((sum, s) => sum + s.cost, 0),
          percentage: 30,
          expectedROI: 250
        },
        {
          category: 'General/Free',
          amount: submissions.filter(s => s.priority <= 60).reduce((sum, s) => sum + s.cost, 0),
          percentage: 10,
          expectedROI: 150
        }
      ],
      timeline: [], // Would be populated with specific phases
      successMetrics: [
        'Increase organic traffic by 150% in 6 months',
        'Generate 50+ qualified leads monthly',
        'Achieve 200%+ ROI on directory investments',
        'Improve domain authority by 15 points'
      ]
    }
  }

  private projectResults(
    submissions: PrioritizedSubmission[],
    businessIntelligence: BusinessIntelligence
  ): DirectoryResultProjections {
    const totalTrafficIncrease = submissions.reduce((sum, s) => 
      sum + (s.estimatedTraffic * s.successProbability / 100 * 0.01), 0) // 1% of directory traffic

    const leadIncrease = totalTrafficIncrease * 0.05 // 5% conversion to leads
    const brandExposureIncrease = submissions.length * 25 // 25% increase per directory

    return {
      totalTrafficIncrease: Math.round(totalTrafficIncrease),
      leadIncrease: Math.round(leadIncrease),
      brandExposureIncrease: Math.round(brandExposureIncrease),
      timeToResults: {
        immediate: 7,
        shortTerm: 30,
        mediumTerm: 90,
        longTerm: 180
      },
      riskFactors: [
        {
          factor: 'Directory approval delays',
          probability: 25,
          impact: 'medium',
          mitigation: 'Follow submission guidelines carefully'
        },
        {
          factor: 'Competition for directory rankings',
          probability: 60,
          impact: 'medium',
          mitigation: 'Optimize listings regularly'
        }
      ]
    }
  }

  // Helper methods

  private getBusinessAgeMonths(profile: EnhancedBusinessProfile): number {
    if (profile.founded) {
      return Math.round((Date.now() - profile.founded.getTime()) / (1000 * 60 * 60 * 24 * 30))
    }
    
    // Estimate based on business stage
    switch (profile.stage) {
      case 'idea': return 0
      case 'mvp': return 6
      case 'early': return 12
      case 'growth': return 36
      case 'scale': return 60
      case 'mature': return 120
      default: return 24
    }
  }

  private estimateRevenue(profile: EnhancedBusinessProfile): number {
    // Estimate based on business size and stage
    const sizeMultiplier = {
      startup: 1,
      small: 3,
      medium: 10,
      enterprise: 50,
      unicorn: 1000
    }

    const stageMultiplier = {
      idea: 0,
      mvp: 0.5,
      early: 1,
      growth: 5,
      scale: 20,
      mature: 50
    }

    return (sizeMultiplier[profile.size] || 1) * (stageMultiplier[profile.stage] || 1) * 100000
  }

  private identifyRiskFactors(directory: DirectoryRecord, profile: EnhancedBusinessProfile): string[] {
    const risks: string[] = []

    if (directory.approvalRate < 50) {
      risks.push('Low approval rate - careful preparation required')
    }
    
    if (directory.difficulty === 'hard') {
      risks.push('Complex submission process')
    }

    if (directory.cost > 200 && directory.estimatedTraffic < 5000) {
      risks.push('High cost with uncertain traffic return')
    }

    return risks
  }

  private identifyOpportunities(directory: DirectoryRecord, profile: EnhancedBusinessProfile): string[] {
    const opportunities: string[] = []

    if (directory.authority > 80) {
      opportunities.push('High authority domain for SEO benefits')
    }

    if (directory.estimatedTraffic > 50000) {
      opportunities.push('Large audience exposure potential')
    }

    if (directory.cost === 0) {
      opportunities.push('Free listing with no financial risk')
    }

    return opportunities
  }

  private getFallbackDirectories(): DirectoryRecord[] {
    // Return a curated list of high-value directories as fallback
    return [
      {
        id: 'google-business',
        name: 'Google Business Profile',
        category: 'General',
        authority: 100,
        estimatedTraffic: 100000,
        submissionUrl: 'https://business.google.com',
        cost: 0,
        difficulty: 'easy',
        approvalRate: 95,
        averageTimeToApproval: 3,
        features: ['Local SEO', 'Reviews', 'Photos'],
        requirements: {},
        targetAudience: ['Local customers'],
        geographicFocus: ['Global'],
        industryFocus: [],
        businessTypes: ['All'],
        contentGuidelines: {},
        seoValue: 100,
        trafficQuality: 90,
        conversionPotential: 85
      },
      // Add more fallback directories...
    ]
  }
}

// Default configuration
export const DEFAULT_DIRECTORY_MATCHING_CONFIG: DirectoryMatchingConfig = {
  maxDirectories: 50,
  enableAIOptimization: true,
  includeInternational: false,
  includePremium: true,
  budgetRange: { min: 0, max: 500 },
  industryFocus: [],
  targetROI: 200,
  analysisDepth: 'comprehensive'
}

// Factory function
export function createDirectoryMatcher(config?: Partial<DirectoryMatchingConfig>): DirectoryMatcher {
  return new DirectoryMatcher({ ...DEFAULT_DIRECTORY_MATCHING_CONFIG, ...config })
}