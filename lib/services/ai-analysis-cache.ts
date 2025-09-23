/**
 * Phase 3.2: Enhanced AI Analysis Caching Service
 * 
 * This service provides intelligent caching for AI Business Intelligence results,
 * preventing duplicate analysis costs and optimizing performance while maintaining
 * data freshness for the DirectoryBolt AI-Enhanced platform.
 */

import { BusinessIntelligence, DirectoryOpportunityMatrix, RevenueProjections } from '../types/business-intelligence'
import { AirtableService, BusinessSubmissionRecord } from './airtable'
import { createAirtableService } from './airtable'

// SEO-specific cache types
export interface SEOAnalysisCacheEntry {
  cacheKey: string
  data: any
  cachedAt: Date
  confidence: number
  userTier: string
  analysisType: 'seo_gap' | 'competitor_seo' | 'content_optimization' | 'keyword_gap'
  expiresAt: Date
}

export interface SEOCacheValidationResult {
  isValid: boolean
  reason?: 'fresh' | 'stale' | 'expired' | 'not_found'
  daysOld?: number
  confidence?: number
}

export interface AnalysisCacheEntry {
  customerId: string
  analysisData: BusinessIntelligence
  directoryOpportunities: DirectoryOpportunityMatrix
  revenueProjections: RevenueProjections
  cachedAt: Date
  lastBusinessProfileHash: string
  analysisVersion: string
  confidenceScore: number
}

export interface CacheValidationResult {
  isValid: boolean
  reason?: 'fresh' | 'stale' | 'profile_changed' | 'not_found'
  daysOld?: number
  confidenceScore?: number
}

export interface AnalysisMetrics {
  cacheHitRate: number
  totalAnalyses: number
  cachedAnalyses: number
  costSavings: number // estimated dollars saved
  averageAnalysisAge: number // days
}

export class AIAnalysisCacheService {
  private airtableService: AirtableService
  private cacheExpiryDays: number
  private minConfidenceScore: number
  private seoCache: Map<string, SEOAnalysisCacheEntry> = new Map()

  constructor(
    airtableService?: AirtableService,
    options: {
      cacheExpiryDays?: number
      minConfidenceScore?: number
    } = {}
  ) {
    this.airtableService = airtableService || createAirtableService()
    this.cacheExpiryDays = options.cacheExpiryDays || 30
    this.minConfidenceScore = options.minConfidenceScore || 75
    
    // Initialize SEO cache cleanup interval (every hour)
    setInterval(() => this.cleanupExpiredSEOCache(), 60 * 60 * 1000)
  }

  /**
   * Phase 3.2: Get cached analysis or determine if new analysis is needed
   */
  async getCachedAnalysisOrValidate(
    customerId: string,
    currentBusinessData: Partial<BusinessSubmissionRecord>
  ): Promise<{
    cached: AnalysisCacheEntry | null
    validation: CacheValidationResult
  }> {
    try {
      console.log('🔍 Checking AI analysis cache for customer:', customerId)

      // Try to get cached analysis
      const cachedAnalysis = await this.airtableService.getCachedAnalysisResults(customerId)
      
      if (!cachedAnalysis) {
        return {
          cached: null,
          validation: {
            isValid: false,
            reason: 'not_found'
          }
        }
      }

      // Get full record to check business profile changes
      const record = await this.airtableService.findByCustomerId(customerId)
      if (!record) {
        return {
          cached: null,
          validation: {
            isValid: false,
            reason: 'not_found'
          }
        }
      }

      // Check if business profile has changed
      const hasChanged = await this.airtableService.hasBusinessProfileChanged(customerId, currentBusinessData)
      if (hasChanged) {
        console.log('🔄 Business profile changed, cache invalid')
        return {
          cached: null,
          validation: {
            isValid: false,
            reason: 'profile_changed'
          }
        }
      }

      // Check cache age
      const analysisDate = new Date(record.lastAnalysisDate)
      const daysOld = Math.floor((Date.now() - analysisDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysOld > this.cacheExpiryDays) {
        console.log(`🕒 Cached analysis is ${daysOld} days old, exceeds ${this.cacheExpiryDays} day limit`)
        return {
          cached: null,
          validation: {
            isValid: false,
            reason: 'stale',
            daysOld
          }
        }
      }

      // Check confidence score
      const confidenceScore = record.analysisConfidenceScore || 0
      if (confidenceScore < this.minConfidenceScore) {
        console.log(`📊 Analysis confidence ${confidenceScore} below minimum ${this.minConfidenceScore}`)
        return {
          cached: null,
          validation: {
            isValid: false,
            reason: 'stale',
            confidenceScore
          }
        }
      }

      // Cache is valid, construct cache entry
      const cacheEntry: AnalysisCacheEntry = {
        customerId,
        analysisData: cachedAnalysis,
        directoryOpportunities: JSON.parse(record.prioritizedDirectories || '{"prioritizedSubmissions": []}'),
        revenueProjections: JSON.parse(record.revenueProjections || '{"baseline": {}}'),
        cachedAt: analysisDate,
        lastBusinessProfileHash: this.hashBusinessProfile(currentBusinessData),
        analysisVersion: record.analysisVersion || '3.2.0',
        confidenceScore
      }

      console.log('✅ Valid cached analysis found, cache hit!')
      return {
        cached: cacheEntry,
        validation: {
          isValid: true,
          reason: 'fresh',
          daysOld,
          confidenceScore
        }
      }

    } catch (error) {
      console.error('❌ Error validating analysis cache:', error)
      return {
        cached: null,
        validation: {
          isValid: false,
          reason: 'not_found'
        }
      }
    }
  }

  /**
   * Phase 3.2: Store new analysis results in cache
   */
  async storeAnalysisResults(
    customerId: string,
    analysisData: BusinessIntelligence,
    directoryOpportunities: DirectoryOpportunityMatrix,
    revenueProjections: RevenueProjections,
    businessProfile: Partial<BusinessSubmissionRecord>
  ): Promise<boolean> {
    try {
      console.log('💾 Storing AI analysis results in cache for customer:', customerId)

      await this.airtableService.storeAIAnalysisResults(
        customerId,
        analysisData,
        directoryOpportunities,
        revenueProjections
      )

      console.log('✅ AI analysis results successfully cached')
      return true

    } catch (error) {
      console.error('❌ Failed to store analysis results in cache:', error)
      return false
    }
  }

  /**
   * Phase 3.2: Invalidate cache for a specific customer (force re-analysis)
   */
  async invalidateCustomerCache(customerId: string, reason?: string): Promise<boolean> {
    try {
      console.log('🗑️ Invalidating cache for customer:', customerId, 'Reason:', reason)

      // Clear analysis data by setting last analysis date to null
      const existingRecord = await this.airtableService.findByCustomerId(customerId)
      if (existingRecord) {
        await this.airtableService.updateBusinessSubmission(existingRecord.recordId, {
          lastAnalysisDate: null,
          aiAnalysisResults: null,
          analysisConfidenceScore: null
        } as any)
      }

      console.log('✅ Customer cache invalidated successfully')
      return true

    } catch (error) {
      console.error('❌ Failed to invalidate customer cache:', error)
      return false
    }
  }

  /**
   * Phase 3.2: Get cache metrics and analytics
   */
  async getCacheMetrics(timeframeDays: number = 30): Promise<AnalysisMetrics> {
    try {
      console.log('📊 Calculating cache metrics for last', timeframeDays, 'days')

      // This would require more sophisticated tracking in a production system
      // For now, we'll return estimated metrics based on cached records
      const allRecords = await this.airtableService.findByStatus('completed')
      
      const recentRecords = allRecords.filter((record: any) => {
        if (!record.lastAnalysisDate) return false
        const analysisDate = new Date(record.lastAnalysisDate)
        const cutoffDate = new Date(Date.now() - timeframeDays * 24 * 60 * 60 * 1000)
        return analysisDate > cutoffDate
      })

      const cachedRecords = recentRecords.filter((record: any) => record.aiAnalysisResults)
      const totalAnalyses = recentRecords.length
      const cachedAnalyses = cachedRecords.length
      const cacheHitRate = totalAnalyses > 0 ? (cachedAnalyses / totalAnalyses) : 0

      // Estimate cost savings (assuming $50 per analysis)
      const costSavings = cachedAnalyses * 50

      // Calculate average analysis age
      const analysisAges = cachedRecords.map((record: any) => {
        const analysisDate = new Date(record.lastAnalysisDate)
        return Math.floor((Date.now() - analysisDate.getTime()) / (1000 * 60 * 60 * 24))
      })
      const averageAnalysisAge = analysisAges.length > 0 
        ? analysisAges.reduce((sum, age) => sum + age, 0) / analysisAges.length 
        : 0

      return {
        cacheHitRate: Math.round(cacheHitRate * 100) / 100,
        totalAnalyses,
        cachedAnalyses,
        costSavings,
        averageAnalysisAge: Math.round(averageAnalysisAge * 100) / 100
      }

    } catch (error) {
      console.error('❌ Failed to calculate cache metrics:', error)
      return {
        cacheHitRate: 0,
        totalAnalyses: 0,
        cachedAnalyses: 0,
        costSavings: 0,
        averageAnalysisAge: 0
      }
    }
  }

  /**
   * Phase 3.2: Clean up stale cache entries
   */
  async cleanupStaleCache(olderThanDays: number = 60): Promise<number> {
    try {
      console.log('🧹 Cleaning up stale cache entries older than', olderThanDays, 'days')

      let cleanedCount = 0
      const allRecords = await this.airtableService.findByStatus('completed')
      
      for (const record of allRecords) {
        if (record.lastAnalysisDate) {
          const analysisDate = new Date(record.lastAnalysisDate)
          const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
          
          if (analysisDate < cutoffDate) {
            await this.airtableService.updateBusinessSubmission(record.recordId, {
              aiAnalysisResults: null,
              lastAnalysisDate: null,
              analysisConfidenceScore: null
            } as any)
            cleanedCount++
          }
        }
      }

      console.log(`✅ Cleaned up ${cleanedCount} stale cache entries`)
      return cleanedCount

    } catch (error) {
      console.error('❌ Failed to cleanup stale cache:', error)
      return 0
    }
  }

  /**
   * Phase 3.2: Get cache statistics for monitoring
   */
  async getCacheStats(): Promise<{
    totalCachedRecords: number
    averageAge: number
    oldestEntry: Date | null
    newestEntry: Date | null
    confidenceDistribution: { [key: string]: number }
  }> {
    try {
      const allRecords = await this.airtableService.findByStatus('completed')
      const cachedRecords = allRecords.filter((record: any) => record.aiAnalysisResults)

      if (cachedRecords.length === 0) {
        return {
          totalCachedRecords: 0,
          averageAge: 0,
          oldestEntry: null,
          newestEntry: null,
          confidenceDistribution: {}
        }
      }

      // Calculate age statistics
      const ages = cachedRecords.map((record: any) => {
        const analysisDate = new Date(record.lastAnalysisDate)
        return Math.floor((Date.now() - analysisDate.getTime()) / (1000 * 60 * 60 * 24))
      })

      const averageAge = ages.reduce((sum, age) => sum + age, 0) / ages.length

      // Find oldest and newest entries
      const dates = cachedRecords.map((record: any) => new Date(record.lastAnalysisDate))
      const oldestEntry = new Date(Math.min(...dates.map(d => d.getTime())))
      const newestEntry = new Date(Math.max(...dates.map(d => d.getTime())))

      // Confidence score distribution
      const confidenceDistribution: { [key: string]: number } = {}
      cachedRecords.forEach((record: any) => {
        const score = record.analysisConfidenceScore || 0
        const bucket = `${Math.floor(score / 10) * 10}-${Math.floor(score / 10) * 10 + 9}`
        confidenceDistribution[bucket] = (confidenceDistribution[bucket] || 0) + 1
      })

      return {
        totalCachedRecords: cachedRecords.length,
        averageAge: Math.round(averageAge * 100) / 100,
        oldestEntry,
        newestEntry,
        confidenceDistribution
      }

    } catch (error) {
      console.error('❌ Failed to get cache statistics:', error)
      return {
        totalCachedRecords: 0,
        averageAge: 0,
        oldestEntry: null,
        newestEntry: null,
        confidenceDistribution: {}
      }
    }
  }

  /**
   * SEO Analysis Cache Methods
   */

  /**
   * Get cached SEO analysis result
   */
  async getCachedSEOAnalysis(cacheKey: string): Promise<{
    isValid: boolean
    data?: any
    daysOld?: number
    confidence?: number
  } | null> {
    try {
      const cachedEntry = this.seoCache.get(cacheKey)
      
      if (!cachedEntry) {
        return null
      }

      // Check if cache has expired
      if (new Date() > cachedEntry.expiresAt) {
        this.seoCache.delete(cacheKey)
        return null
      }

      const daysOld = Math.floor((Date.now() - cachedEntry.cachedAt.getTime()) / (1000 * 60 * 60 * 24))
      
      return {
        isValid: true,
        data: cachedEntry.data,
        daysOld,
        confidence: cachedEntry.confidence
      }
    } catch (error) {
      console.error('❌ Error getting cached SEO analysis:', error)
      return null
    }
  }

  /**
   * Store SEO analysis result in cache
   */
  async storeSEOAnalysis(
    cacheKey: string,
    data: any,
    confidence: number,
    analysisType: SEOAnalysisCacheEntry['analysisType'] = 'seo_gap',
    userTier: string = 'professional'
  ): Promise<boolean> {
    try {
      // Calculate expiry based on analysis type and user tier
      const expiryHours = this.getSEOCacheExpiryHours(analysisType, userTier)
      const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000)

      const cacheEntry: SEOAnalysisCacheEntry = {
        cacheKey,
        data,
        cachedAt: new Date(),
        confidence,
        userTier,
        analysisType,
        expiresAt
      }

      this.seoCache.set(cacheKey, cacheEntry)
      console.log(`✅ SEO analysis cached with ${expiryHours}h expiry:`, cacheKey)
      return true
    } catch (error) {
      console.error('❌ Error storing SEO analysis cache:', error)
      return false
    }
  }

  /**
   * Get cached competitor SEO research
   */
  async getCachedCompetitorSEO(cacheKey: string): Promise<{
    isValid: boolean
    data?: any
    daysOld?: number
    confidence?: number
  } | null> {
    return this.getCachedSEOAnalysis(cacheKey)
  }

  /**
   * Store competitor SEO research in cache
   */
  async storeCompetitorSEO(cacheKey: string, data: any, confidence: number): Promise<boolean> {
    return this.storeSEOAnalysis(cacheKey, data, confidence, 'competitor_seo')
  }

  /**
   * Get cached content optimization
   */
  async getCachedContentOptimization(cacheKey: string): Promise<{
    isValid: boolean
    data?: any
    daysOld?: number
    confidence?: number
  } | null> {
    return this.getCachedSEOAnalysis(cacheKey)
  }

  /**
   * Store content optimization in cache
   */
  async storeContentOptimization(cacheKey: string, data: any, confidence: number): Promise<boolean> {
    return this.storeSEOAnalysis(cacheKey, data, confidence, 'content_optimization')
  }

  /**
   * Get cached keyword gap analysis
   */
  async getCachedKeywordGap(cacheKey: string): Promise<{
    isValid: boolean
    data?: any
    daysOld?: number
    confidence?: number
  } | null> {
    return this.getCachedSEOAnalysis(cacheKey)
  }

  /**
   * Store keyword gap analysis in cache
   */
  async storeKeywordGap(cacheKey: string, data: any, confidence: number): Promise<boolean> {
    return this.storeSEOAnalysis(cacheKey, data, confidence, 'keyword_gap')
  }

  /**
   * Invalidate specific SEO cache entry
   */
  async invalidateSEOCache(cacheKey: string): Promise<boolean> {
    try {
      const deleted = this.seoCache.delete(cacheKey)
      console.log('🗑️ SEO cache invalidated:', cacheKey, deleted ? 'success' : 'not found')
      return deleted
    } catch (error) {
      console.error('❌ Error invalidating SEO cache:', error)
      return false
    }
  }

  /**
   * Clean up expired SEO cache entries
   */
  private cleanupExpiredSEOCache(): void {
    try {
      const now = new Date()
      let cleanedCount = 0

      for (const [key, entry] of this.seoCache.entries()) {
        if (now > entry.expiresAt) {
          this.seoCache.delete(key)
          cleanedCount++
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} expired SEO cache entries`)
      }
    } catch (error) {
      console.error('❌ Error cleaning up SEO cache:', error)
    }
  }

  /**
   * Get SEO cache statistics
   */
  getSEOCacheStats(): {
    totalEntries: number
    entriesByType: Record<string, number>
    entriesByTier: Record<string, number>
    averageAge: number
    oldestEntry?: Date
    newestEntry?: Date
  } {
    const entries = Array.from(this.seoCache.values())
    
    if (entries.length === 0) {
      return {
        totalEntries: 0,
        entriesByType: {},
        entriesByTier: {},
        averageAge: 0
      }
    }

    const entriesByType: Record<string, number> = {}
    const entriesByTier: Record<string, number> = {}
    let totalAge = 0

    entries.forEach(entry => {
      entriesByType[entry.analysisType] = (entriesByType[entry.analysisType] || 0) + 1
      entriesByTier[entry.userTier] = (entriesByTier[entry.userTier] || 0) + 1
      totalAge += Date.now() - entry.cachedAt.getTime()
    })

    const dates = entries.map(e => e.cachedAt)
    const oldestEntry = new Date(Math.min(...dates.map(d => d.getTime())))
    const newestEntry = new Date(Math.max(...dates.map(d => d.getTime())))

    return {
      totalEntries: entries.length,
      entriesByType,
      entriesByTier,
      averageAge: Math.round((totalAge / entries.length) / (1000 * 60 * 60 * 24) * 100) / 100, // days
      oldestEntry,
      newestEntry
    }
  }

  /**
   * Get cache expiry hours based on analysis type and user tier
   */
  private getSEOCacheExpiryHours(
    analysisType: SEOAnalysisCacheEntry['analysisType'],
    userTier: string
  ): number {
    // Enterprise users get fresher data with shorter cache times
    const tierMultiplier = userTier === 'enterprise' ? 0.5 : userTier === 'professional' ? 1 : 2

    const baseHours = {
      'seo_gap': 48,           // 2 days base
      'competitor_seo': 72,    // 3 days base  
      'content_optimization': 24, // 1 day base
      'keyword_gap': 48        // 2 days base
    }

    return Math.floor(baseHours[analysisType] * tierMultiplier)
  }

  /**
   * Clear all SEO cache entries
   */
  async clearSEOCache(): Promise<number> {
    try {
      const entryCount = this.seoCache.size
      this.seoCache.clear()
      console.log(`🗑️ Cleared all ${entryCount} SEO cache entries`)
      return entryCount
    } catch (error) {
      console.error('❌ Error clearing SEO cache:', error)
      return 0
    }
  }

  /**
   * Helper: Create a hash of business profile for change detection
   */
  private hashBusinessProfile(businessData: Partial<BusinessSubmissionRecord>): string {
    const relevantFields = [
      businessData.businessName,
      businessData.website,
      businessData.description,
      businessData.city,
      businessData.state,
      businessData.phone
    ].filter(Boolean).join('|')

    // Simple hash function for change detection
    let hash = 0
    for (let i = 0; i < relevantFields.length; i++) {
      const char = relevantFields.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    
    return hash.toString(36)
  }
}

/**
 * Factory function to create AI Analysis Cache Service
 */
export function createAIAnalysisCacheService(options?: {
  cacheExpiryDays?: number
  minConfidenceScore?: number
}): AIAnalysisCacheService {
  return new AIAnalysisCacheService(undefined, options)
}

/**
 * Export default instance
 */
export default createAIAnalysisCacheService