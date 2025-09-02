/**
 * Airtable Integration Service
 * 
 * This service provides all Airtable operations for DirectoryBolt customer data management.
 * Handles business submissions, customer tracking, and directory submission status updates.
 */

import Airtable from 'airtable'

// Airtable Field Mapping Interface
export interface BusinessSubmissionRecord {
  firstName: string
  lastName: string
  customerId: string
  packageType: 'starter' | 'growth' | 'professional' | 'enterprise'
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
}

export interface AirtableConfig {
  apiKey: string
  baseId: string
  tableName: string
}

export class AirtableService {
  private base: any
  private tableName: string

  constructor(config: AirtableConfig) {
    if (!config.apiKey || !config.baseId || !config.tableName) {
      throw new Error('Missing required Airtable configuration: apiKey, baseId, or tableName')
    }

    // Configure Airtable
    Airtable.configure({
      endpointUrl: 'https://api.airtable.com',
      apiKey: config.apiKey
    })

    this.base = Airtable.base(config.baseId)
    this.tableName = config.tableName
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

      const records = await this.base(this.tableName).create([
        {
          fields: recordData
        }
      ])

      const record = records[0]
      console.log('✅ Airtable record created successfully:', {
        recordId: record.getId(),
        customerId: record.get('customerId'),
        businessName: record.get('businessName')
      })

      return {
        recordId: record.getId(),
        customerId: record.get('customerId'),
        ...record.fields
      }

    } catch (error) {
      console.error('❌ Failed to create Airtable record:', error)
      throw new Error(`Airtable creation failed: ${error.message}`)
    }
  }

  /**
   * Update an existing business submission record
   */
  async updateBusinessSubmission(recordId: string, updates: Partial<BusinessSubmissionRecord>): Promise<any> {
    try {
      console.log('🔄 Updating Airtable record:', { recordId, updates })

      const records = await this.base(this.tableName).update([
        {
          id: recordId,
          fields: updates
        }
      ])

      const record = records[0]
      console.log('✅ Airtable record updated successfully:', {
        recordId: record.getId(),
        customerId: record.get('customerId')
      })

      return {
        recordId: record.getId(),
        customerId: record.get('customerId'),
        ...record.fields
      }

    } catch (error) {
      console.error('❌ Failed to update Airtable record:', error)
      throw new Error(`Airtable update failed: ${error.message}`)
    }
  }

  /**
   * Find business submission by customer ID
   */
  async findByCustomerId(customerId: string): Promise<any> {
    try {
      const records = await this.base(this.tableName).select({
        filterByFormula: `{customerId} = '${customerId}'`,
        maxRecords: 1
      }).firstPage()

      if (records.length === 0) {
        return null
      }

      const record = records[0]
      return {
        recordId: record.getId(),
        customerId: record.get('customerId'),
        ...record.fields
      }

    } catch (error) {
      console.error('❌ Failed to find Airtable record by customer ID:', error)
      throw new Error(`Airtable lookup failed: ${error.message}`)
    }
  }

  /**
   * Find business submissions by status
   */
  async findByStatus(status: 'pending' | 'in-progress' | 'completed' | 'failed'): Promise<any[]> {
    try {
      const records = await this.base(this.tableName).select({
        filterByFormula: `{submissionStatus} = '${status}'`,
        sort: [{ field: 'purchaseDate', direction: 'asc' }]
      }).all()

      return records.map(record => ({
        recordId: record.getId(),
        customerId: record.get('customerId'),
        ...record.fields
      }))

    } catch (error) {
      console.error('❌ Failed to find Airtable records by status:', error)
      throw new Error(`Airtable status lookup failed: ${error.message}`)
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
      throw new Error(`Status update failed: ${error.message}`)
    }
  }

  /**
   * Get directory limit based on package type
   */
  private getDirectoryLimitByPackage(packageType: string): number {
    const limits = {
      'starter': 50,
      'growth': 100, 
      'professional': 200,
      'enterprise': 500
    }
    return limits[packageType.toLowerCase()] || 50
  }

  /**
   * Get all pending submissions for AutoBolt processing queue
   */
  async getPendingSubmissions(): Promise<any[]> {
    return await this.findByStatus('pending')
  }

  /**
   * Health check - verify Airtable connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to fetch one record to verify connection
      await this.base(this.tableName).select({
        maxRecords: 1
      }).firstPage()

      console.log('✅ Airtable health check passed')
      return true

    } catch (error) {
      console.error('❌ Airtable health check failed:', error)
      return false
    }
  }
}

/**
 * Initialize Airtable service with environment variables
 */
export function createAirtableService(): AirtableService {
  const config: AirtableConfig = {
    apiKey: process.env.AIRTABLE_API_KEY!,
    baseId: process.env.AIRTABLE_BASE_ID!,
    tableName: process.env.AIRTABLE_TABLE_NAME || 'Business_Submissions'
  }

  return new AirtableService(config)
}

// Export default instance
export default createAirtableService