/**
 * Airtable Integration Service
 * 
 * This service provides all Airtable operations for DirectoryBolt customer data management.
 * Handles business submissions, customer tracking, and directory submission status updates.
 */

// Migration Note: This service now uses Google Sheets instead of Airtable
import { createGoogleSheetsService } from './google-sheets'
import { BusinessIntelligence, DirectoryOpportunityMatrix, RevenueProjections } from '../types/business-intelligence'

// Enhanced Airtable Field Mapping Interface with AI Analysis Data
export interface BusinessSubmissionRecord {
  firstName: string
  lastName: string
  customerId: string
  packageType: 'starter' | 'growth' | 'pro' | 'subscription'
  submissionStatus: 'pending' | 'in-progress' | 'completed' | 'failed'
  purchaseDate: string
  directoriesSubmitted: number
  failedDirectories: number
  businessName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zip: string
  website: string
  description: string
  facebook?: string
  instagram?: string
  linkedin?: string
  logo?: string
  sessionId?: string
  stripeCustomerId?: string
  totalDirectories?: number
  
  // Phase 3.2: Enhanced AI Analysis Fields
  aiAnalysisResults?: string // JSON string of BusinessIntelligence data
  competitivePositioning?: string // Text field for competitive analysis summary
  directorySuccessProbabilities?: string // JSON string of success probability data
  seoRecommendations?: string // JSON array of SEO recommendations
  lastAnalysisDate?: string // ISO date string
  analysisConfidenceScore?: number // 0-100
  industryCategory?: string // Primary industry classification
  targetMarketAnalysis?: string // JSON string of target market data
  revenueProjections?: string // JSON string of revenue projection data
  competitiveAdvantages?: string // JSON array of competitive advantages
  marketPositioning?: string // JSON string of positioning data
  prioritizedDirectories?: string // JSON array of prioritized directory submissions
  analysisVersion?: string // Version tracking for analysis updates
}

export interface AirtableConfig {
  accessToken: string  // Personal Access Token (PAT)
  baseId: string
  tableName: string
}

export class AirtableService {
  private googleSheets: any
  private tableName: string

  constructor(config: AirtableConfig) {
    console.log('🔄 AirtableService: Using Google Sheets backend instead of Airtable')
    
    // Initialize Google Sheets service
    this.googleSheets = createGoogleSheetsService()
    this.tableName = config.tableName || 'Directory Bolt Import'
  }

  /**
   * Generate unique customer ID in format DIR-2025-001234
   */
  generateCustomerId(): string {
    const year = new Date().getFullYear()
    const timestamp = Date.now().toString().slice(-6) // Last 6 digits of timestamp
    const randomSuffix = Math.random().toString(36).substr(2, 4).toUpperCase()
    return `DIR-${year}-${timestamp}${randomSuffix}`
  }

  /**
   * Create a new business submission record in Airtable
   */
  async createBusinessSubmission(data: Partial<BusinessSubmissionRecord>): Promise<any> {
    try {
      // Generate customer ID if not provided
      const customerId = data.customerId || this.generateCustomerId()

      // Prepare record data with defaults
      const recordData = {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        customerId: customerId,
        packageType: data.packageType || 'starter',
        submissionStatus: data.submissionStatus || 'pending',
        purchaseDate: data.purchaseDate || new Date().toISOString(),
        directoriesSubmitted: data.directoriesSubmitted || 0,
        failedDirectories: data.failedDirectories || 0,
        businessName: data.businessName || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zip: data.zip || '',
        website: data.website || '',
        description: data.description || '',
        facebook: data.facebook || '',
        instagram: data.instagram || '',
        linkedin: data.linkedin || '',
        sessionId: data.sessionId || '',
        stripeCustomerId: data.stripeCustomerId || '',
        totalDirectories: this.getDirectoryLimitByPackage(data.packageType || 'starter')
      }

      console.log('🔄 Creating Airtable record:', {
        customerId: recordData.customerId,
        businessName: recordData.businessName,
        email: recordData.email,
        packageType: recordData.packageType,
        submissionStatus: recordData.submissionStatus
      })

      const record = await this.googleSheets.createCustomer({
        ...recordData,
        customerID: recordData.customerId, // Store in both formats for compatibility
      })

      const normalizedCustomerId = record.customerId || record.customerID
      console.log('✅ Google Sheets record created successfully:', {
        recordId: record.id,
        customerId: normalizedCustomerId,
        businessName: record.businessName
      })

      return {
        recordId: record.id,
        customerId: normalizedCustomerId,
        customerID: normalizedCustomerId, // Provide both formats for compatibility
        ...record
      }

    } catch (error) {
      console.error('❌ Failed to create Airtable record:', error)
      throw new Error(`Airtable creation failed: ${error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error)}`)
    }
  }

  /**
   * Update an existing business submission record
   */
  async updateBusinessSubmission(recordId: string, updates: Partial<BusinessSubmissionRecord>): Promise<any> {
    try {
      console.log('🔄 Updating Airtable record:', { recordId, updates })

      const record = await this.googleSheets.updateCustomerByRowId(recordId, updates)

      const normalizedCustomerId = record.customerId || record.customerID
      console.log('✅ Google Sheets record updated successfully:', {
        recordId: record.id,
        customerId: normalizedCustomerId
      })

      return {
        recordId: record.id,
        customerId: normalizedCustomerId,
        customerID: normalizedCustomerId, // Provide both formats for compatibility
        ...record
      }

    } catch (error) {
      console.error('❌ Failed to update Airtable record:', error)
      throw new Error(`Airtable update failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Field normalization helper to handle multiple customerID field formats
   */
  private normalizeCustomerIdField(record: any): string | null {
    // Try all possible field name formats to handle Airtable field variations
    return record.get('customerID') || 
           record.get('customerId') || 
           record.get('Customer ID') ||
           record.get('CUSTOMER_ID') ||
           record.get('customer_id') ||
           null
  }

  /**
   * Get customer ID filter formula - simplified and reliable
   */
  private getCustomerIdFilterFormula(customerId: string): string {
    // Clean and prepare the customer ID
    const cleanCustomerId = customerId.trim()
    
    // Handle both original format and uppercase
    const upperCustomerId = cleanCustomerId.toUpperCase()
    
    // Simple and reliable formula - try the most common field names
    return `OR({customerID} = '${cleanCustomerId}', {customerId} = '${cleanCustomerId}', {customerID} = '${upperCustomerId}', {customerId} = '${upperCustomerId}')`
  }

  /**
   * Find business submission by customer ID (handles both customerID and customerId field formats)
   */
  async findByCustomerId(customerId: string): Promise<any> {
    try {
      const record = await this.googleSheets.findCustomerById(customerId)

      if (!record) {
        return null
      }

      const normalizedCustomerId = record.customerId || record.customerID
      return {
        recordId: record.id,
        customerId: normalizedCustomerId,
        customerID: normalizedCustomerId, // Provide both formats for compatibility
        ...record
      }

    } catch (error) {
      console.error('❌ Failed to find Google Sheets record by customer ID:', error)
      throw new Error(`Google Sheets lookup failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Find business submissions by status
   */
  async findByStatus(status: 'pending' | 'in-progress' | 'completed' | 'failed'): Promise<any[]> {
    try {
      const records = await this.googleSheets.findCustomers({ 
        status: status,
        sortBy: 'purchaseDate'
      })

      return records.map((record: any) => {
        const normalizedCustomerId = record.customerId || record.customerID
        return {
          recordId: record.id,
          customerId: normalizedCustomerId,
          customerID: normalizedCustomerId, // Provide both formats for compatibility
          ...record
        }
      })

    } catch (error) {
      console.error('❌ Failed to find Google Sheets records by status:', error)
      throw new Error(`Google Sheets status lookup failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Update submission status for AutoBolt processing
   */
  async updateSubmissionStatus(
    customerId: string, 
    status: 'pending' | 'in-progress' | 'completed' | 'failed',
    directoriesSubmitted?: number,
    failedDirectories?: number
  ): Promise<any> {
    try {
      // First find the record by customer ID
      const existingRecord = await this.findByCustomerId(customerId)
      if (!existingRecord) {
        throw new Error(`No record found for customer ID: ${customerId}`)
      }

      const updates: any = {
        submissionStatus: status
      }

      if (directoriesSubmitted !== undefined) {
        updates.directoriesSubmitted = directoriesSubmitted
      }

      if (failedDirectories !== undefined) {
        updates.failedDirectories = failedDirectories
      }

      return await this.updateBusinessSubmission(existingRecord.recordId, updates)

    } catch (error) {
      console.error('❌ Failed to update submission status:', error)
      throw new Error(`Status update failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Get directory limit based on package type
   */
  private getDirectoryLimitByPackage(packageType: string): number {
    const limits = {
      'starter': 50,
      'growth': 100, 
      'pro': 200,
      'subscription': 0 // Subscription doesn't get bulk directories, it's ongoing maintenance
    }
    return limits[packageType.toLowerCase() as keyof typeof limits] || 50
  }

  /**
   * Get all pending submissions for AutoBolt processing queue
   */
  async getPendingSubmissions(): Promise<any[]> {
    return await this.findByStatus('pending')
  }

  /**
   * Phase 3.2: Store AI analysis results for a customer
   */
  async storeAIAnalysisResults(
    customerId: string,
    analysisData: BusinessIntelligence,
    directoryOpportunities: DirectoryOpportunityMatrix,
    revenueProjections: RevenueProjections
  ): Promise<any> {
    try {
      console.log('🧠 Storing AI analysis results for customer:', customerId)

      // Find existing record
      const existingRecord = await this.findByCustomerId(customerId)
      if (!existingRecord) {
        throw new Error(`No record found for customer ID: ${customerId}`)
      }

      // Prepare analysis data for storage
      const analysisUpdate = {
        aiAnalysisResults: JSON.stringify(analysisData),
        competitivePositioning: this.extractCompetitivePositioning(analysisData),
        directorySuccessProbabilities: JSON.stringify(directoryOpportunities.prioritizedSubmissions.map(dir => ({
          directoryId: dir.directoryId,
          directoryName: dir.directoryName,
          successProbability: dir.successProbability,
          estimatedROI: dir.expectedROI,
          priority: dir.priority
        }))),
        seoRecommendations: JSON.stringify(analysisData.seoAnalysis.improvementOpportunities.map(opp => opp.description)),
        lastAnalysisDate: new Date().toISOString(),
        analysisConfidenceScore: analysisData.confidence,
        industryCategory: analysisData.industryAnalysis.primaryIndustry,
        targetMarketAnalysis: JSON.stringify(analysisData.profile.targetMarket),
        revenueProjections: JSON.stringify(revenueProjections),
        competitiveAdvantages: JSON.stringify(analysisData.competitiveAnalysis.competitiveAdvantages),
        marketPositioning: JSON.stringify(analysisData.marketPositioning),
        prioritizedDirectories: JSON.stringify(directoryOpportunities.prioritizedSubmissions.slice(0, 20)), // Top 20 directories
        analysisVersion: '3.2.0'
      }

      return await this.updateBusinessSubmission(existingRecord.recordId, analysisUpdate)

    } catch (error) {
      console.error('❌ Failed to store AI analysis results:', error)
      throw new Error(`AI analysis storage failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Phase 3.2: Retrieve cached AI analysis results
   */
  async getCachedAnalysisResults(customerId: string): Promise<BusinessIntelligence | null> {
    try {
      const record = await this.findByCustomerId(customerId)
      if (!record || !record.aiAnalysisResults) {
        return null
      }

      // Check if analysis is still valid (not older than 30 days)
      const analysisDate = new Date(record.lastAnalysisDate || '2000-01-01')
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      
      if (analysisDate < thirtyDaysAgo) {
        console.log('🕒 Cached analysis is older than 30 days, requiring refresh')
        return null
      }

      // Parse and return analysis data
      const analysisData = JSON.parse(record.aiAnalysisResults) as BusinessIntelligence
      console.log('✅ Retrieved cached AI analysis results for customer:', customerId)
      
      return analysisData

    } catch (error) {
      console.error('❌ Failed to retrieve cached analysis results:', error)
      return null
    }
  }

  /**
   * Phase 3.2: Check if business profile has changed since last analysis
   */
  async hasBusinessProfileChanged(customerId: string, currentBusinessData: Partial<BusinessSubmissionRecord>): Promise<boolean> {
    try {
      const record = await this.findByCustomerId(customerId)
      if (!record || !record.lastAnalysisDate) {
        return true // No previous analysis, consider it changed
      }

      // Compare key business fields
      const keyFields = ['businessName', 'website', 'description', 'city', 'state']
      for (const field of keyFields) {
        if (record[field] !== currentBusinessData[field]) {
          console.log(`🔄 Business profile changed: ${field} updated`)
          return true
        }
      }

      return false

    } catch (error) {
      console.error('❌ Failed to check business profile changes:', error)
      return true // Assume changed on error to be safe
    }
  }

  /**
   * Phase 3.2: Get analysis history for trend tracking
   */
  async getAnalysisHistory(customerId: string): Promise<any[]> {
    try {
      // Since Airtable doesn't have native versioning, we could implement this
      // by storing historical data or by querying based on analysis dates
      // For now, return the current analysis with metadata
      const record = await this.findByCustomerId(customerId)
      if (!record || !record.aiAnalysisResults) {
        return []
      }

      return [{
        analysisDate: record.lastAnalysisDate,
        version: record.analysisVersion || '1.0.0',
        confidenceScore: record.analysisConfidenceScore,
        industryCategory: record.industryCategory,
        competitivePositioning: record.competitivePositioning
      }]

    } catch (error) {
      console.error('❌ Failed to retrieve analysis history:', error)
      return []
    }
  }

  /**
   * Phase 3.2: Track optimization improvements over time
   */
  async trackOptimizationProgress(
    customerId: string, 
    optimizationResults: {
      directoriesSubmittedSinceAnalysis: number
      approvalRate: number
      trafficIncrease?: number
      leadIncrease?: number
    }
  ): Promise<any> {
    try {
      const updates = {
        directoriesSubmitted: optimizationResults.directoriesSubmittedSinceAnalysis,
        // Store optimization metrics as JSON for detailed tracking
        optimizationResults: JSON.stringify({
          ...optimizationResults,
          lastUpdated: new Date().toISOString()
        })
      }

      const existingRecord = await this.findByCustomerId(customerId)
      if (!existingRecord) {
        throw new Error(`No record found for customer ID: ${customerId}`)
      }

      return await this.updateBusinessSubmission(existingRecord.recordId, updates)

    } catch (error) {
      console.error('❌ Failed to track optimization progress:', error)
      throw new Error(`Optimization tracking failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Helper: Extract competitive positioning summary from analysis data
   */
  private extractCompetitivePositioning(analysisData: BusinessIntelligence): string {
    const competitive = analysisData.competitiveAnalysis
    const positioning = analysisData.marketPositioning
    
    const summary = [
      `Current Position: ${positioning.currentPosition}`,
      `Recommended Position: ${positioning.recommendedPosition}`,
      `Key Advantages: ${competitive.competitiveAdvantages.slice(0, 3).join(', ')}`,
      `Market Gaps: ${competitive.marketGaps.slice(0, 2).map(gap => gap.description).join('; ')}`
    ].join(' | ')

    return summary.substring(0, 500) // Limit to 500 chars for Airtable
  }

  /**
   * Health check - verify Airtable connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to fetch one record to verify connection
      await this.googleSheets.findCustomers({ maxRecords: 1 })

      console.log('✅ Google Sheets health check passed')
      return true

    } catch (error) {
      console.error('❌ Google Sheets health check failed:', error)
      return false
    }
  }
}

/**
 * Initialize Airtable service with environment variables
 */
export function createAirtableService(): AirtableService {
  const config: AirtableConfig = {
    accessToken: 'google-sheets',  // Not needed for Google Sheets but keeping for compatibility
    baseId: 'google-sheets',  // Not needed for Google Sheets but keeping for compatibility
    tableName: process.env.AIRTABLE_TABLE_NAME || 'Directory Bolt Import'  // Your table name
  }

  return new AirtableService(config)
}

// Export default instance
export default createAirtableService