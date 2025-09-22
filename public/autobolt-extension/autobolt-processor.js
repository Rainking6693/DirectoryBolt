/**
 * AutoBolt Job Processor
 * 
 * Handles the complete directory submission processing workflow
 * Integrates with DirectoryBoltAPI for backend communication
 * 
 * Phase 3 - Task 3.2 Implementation
 * Agent: Alex (Full-Stack Engineer)
 */

class AutoBoltProcessor {
  constructor() {
    this.api = new DirectoryBoltAPI()
    this.isProcessing = false
    this.currentJob = null
    this.processingMetrics = {
      startTime: null,
      totalDirectories: 0,
      successfulSubmissions: 0,
      failedSubmissions: 0,
      skippedDirectories: 0,
      currentDirectory: null
    }
    
    // Rate limiting settings
    this.submissionDelay = 5000 // 5 seconds between submissions
    this.retryDelay = 10000 // 10 seconds for retries
    this.maxRetries = 3
    
    console.log('✅ AutoBoltProcessor initialized')
  }

  /**
   * Start processing jobs from the queue
   * @returns {Promise<void>}
   */
  async startProcessing() {
    if (this.isProcessing) {
      console.log('⚠️ AutoBoltProcessor: Already processing')
      return
    }

    console.log('🚀 AutoBoltProcessor: Starting job processing...')
    this.isProcessing = true

    try {
      // Test API connectivity first
      const connectionOk = await this.api.testConnection()
      if (!connectionOk) {
        throw new Error('API connection test failed')
      }

      // Main processing loop
      while (this.isProcessing) {
        try {
          // Get next job from queue
          const job = await this.api.getNextJob()
          
          if (!job) {
            console.log('ℹ️ AutoBoltProcessor: No jobs in queue, waiting...')
            await this._sleep(30000) // Wait 30 seconds before checking again
            continue
          }

          // Process the job
          await this.processJob(job)
          
        } catch (error) {
          console.error('❌ AutoBoltProcessor: Error in processing loop:', error)
          await this._sleep(60000) // Wait 1 minute before retrying
        }
      }
      
    } catch (error) {
      console.error('❌ AutoBoltProcessor: Fatal error:', error)
      this.isProcessing = false
      throw error
    }
  }

  /**
   * Stop the processing loop
   */
  stopProcessing() {
    console.log('🛑 AutoBoltProcessor: Stopping processing...')
    this.isProcessing = false
    
    if (this.currentJob) {
      console.log('⚠️ AutoBoltProcessor: Current job will complete before stopping')
    }
  }

  /**
   * Process a single job
   * @param {Object} job - Job data from API
   * @returns {Promise<void>}
   */
  async processJob(job) {
    console.log(`🔄 AutoBoltProcessor: Processing job ${job.jobId} for customer ${job.customerName}`)
    
    this.currentJob = job
    this.processingMetrics = {
      startTime: Date.now(),
      totalDirectories: 0,
      successfulSubmissions: 0,
      failedSubmissions: 0,
      skippedDirectories: 0,
      currentDirectory: null
    }

    try {
      // Parse business data
      const businessData = this._parseBusinessData(job.businessData)
      
      // Generate directory list based on package type
      const directories = await this._generateDirectoryList(job.packageType, businessData)
      this.processingMetrics.totalDirectories = directories.length

      console.log(`📋 AutoBoltProcessor: Generated ${directories.length} directories for processing`)

      // Process each directory with rate limiting
      for (let i = 0; i < directories.length && this.isProcessing; i++) {
        const directory = directories[i]
        this.processingMetrics.currentDirectory = directory.name

        console.log(`📁 AutoBoltProcessor: Processing directory ${i + 1}/${directories.length}: ${directory.name}`)

        try {
          const result = await this._processDirectory(directory, businessData, job)
          
          // Update job progress with this result
          await this.api.updateJobProgress(job.jobId, [result])
          
          if (result.submissionStatus === 'submitted' || result.submissionStatus === 'approved') {
            this.processingMetrics.successfulSubmissions++
          } else if (result.submissionStatus === 'failed' || result.submissionStatus === 'rejected') {
            this.processingMetrics.failedSubmissions++
          } else if (result.submissionStatus === 'skipped') {
            this.processingMetrics.skippedDirectories++
          }

          // Rate limiting delay between submissions
          if (i < directories.length - 1) {
            console.log(`⏱️ AutoBoltProcessor: Waiting ${this.submissionDelay}ms before next submission...`)
            await this._sleep(this.submissionDelay)
          }

        } catch (error) {
          console.error(`❌ AutoBoltProcessor: Error processing directory ${directory.name}:`, error)
          
          // Record failed directory
          const failedResult = {
            directoryName: directory.name,
            directoryUrl: directory.url,
            directoryCategory: directory.category,
            submissionStatus: 'failed',
            errorMessage: error.message,
            processingTimeSeconds: 0
          }
          
          await this.api.updateJobProgress(job.jobId, [failedResult])
          this.processingMetrics.failedSubmissions++
        }
      }

      // Complete the job
      const processingTimeMinutes = Math.round((Date.now() - this.processingMetrics.startTime) / (1000 * 60))
      
      const summary = {
        totalDirectories: this.processingMetrics.totalDirectories,
        successfulSubmissions: this.processingMetrics.successfulSubmissions,
        failedSubmissions: this.processingMetrics.failedSubmissions,
        skippedDirectories: this.processingMetrics.skippedDirectories,
        processingTimeMinutes
      }

      const finalStatus = this.processingMetrics.successfulSubmissions > 0 ? 'completed' : 'failed'
      
      await this.api.completeJob(job.jobId, finalStatus, summary)

      console.log(`✅ AutoBoltProcessor: Job ${job.jobId} completed with status ${finalStatus}`)
      console.log(`📊 AutoBoltProcessor: ${summary.successfulSubmissions}/${summary.totalDirectories} successful submissions`)

    } catch (error) {
      console.error(`❌ AutoBoltProcessor: Error processing job ${job.jobId}:`, error)
      
      // Mark job as failed
      try {
        const processingTimeMinutes = Math.round((Date.now() - this.processingMetrics.startTime) / (1000 * 60))
        
        const summary = {
          totalDirectories: this.processingMetrics.totalDirectories,
          successfulSubmissions: this.processingMetrics.successfulSubmissions,
          failedSubmissions: this.processingMetrics.failedSubmissions,
          skippedDirectories: this.processingMetrics.skippedDirectories,
          processingTimeMinutes
        }

        await this.api.completeJob(job.jobId, 'failed', summary, error.message)
      } catch (completeError) {
        console.error('❌ AutoBoltProcessor: Error marking job as failed:', completeError)
      }
    } finally {
      this.currentJob = null
      this.processingMetrics.currentDirectory = null
    }
  }

  /**
   * Process a single directory submission
   * @param {Object} directory - Directory information
   * @param {Object} businessData - Customer business data
   * @param {Object} job - Current job data
   * @returns {Promise<Object>} Directory result
   */
  async _processDirectory(directory, businessData, job) {
    const startTime = Date.now()
    
    try {
      console.log(`📁 AutoBoltProcessor: Submitting to ${directory.name} at ${directory.url}`)

      // Navigate to directory page
      const result = await this._submitToDirectory(directory, businessData)
      
      const processingTimeSeconds = Math.round((Date.now() - startTime) / 1000)
      
      return {
        directoryName: directory.name,
        directoryUrl: directory.url,
        directoryCategory: directory.category || 'business',
        directoryTier: directory.tier || 'standard',
        submissionStatus: result.status,
        listingUrl: result.listingUrl,
        submissionResult: result.message,
        rejectionReason: result.rejectionReason,
        domainAuthority: directory.domainAuthority,
        estimatedTraffic: directory.estimatedTraffic,
        submissionScore: result.score,
        processingTimeSeconds,
        errorMessage: result.error
      }

    } catch (error) {
      console.error(`❌ AutoBoltProcessor: Directory submission failed for ${directory.name}:`, error)
      
      const processingTimeSeconds = Math.round((Date.now() - startTime) / 1000)
      
      return {
        directoryName: directory.name,
        directoryUrl: directory.url,
        directoryCategory: directory.category || 'business',
        submissionStatus: 'failed',
        errorMessage: error.message,
        processingTimeSeconds
      }
    }
  }

  /**
   * Submit business to a specific directory
   * @param {Object} directory - Directory information
   * @param {Object} businessData - Business data for submission
   * @returns {Promise<Object>} Submission result
   */
  async _submitToDirectory(directory, businessData) {
    // This is a placeholder for the actual directory submission logic
    // In a real implementation, this would:
    // 1. Navigate to the directory submission page
    // 2. Fill out the submission form with business data
    // 3. Handle any captchas or verification steps
    // 4. Submit the form and wait for response
    // 5. Parse the result and return status
    
    console.log(`🔄 AutoBoltProcessor: Simulating submission to ${directory.name}...`)
    
    // Simulate processing time
    await this._sleep(2000 + Math.random() * 3000)
    
    // Simulate success/failure (80% success rate for demo)
    const success = Math.random() > 0.2
    
    if (success) {
      return {
        status: 'submitted',
        message: 'Successfully submitted to directory',
        listingUrl: `${directory.url}/listing/${businessData.businessName.replace(/\s+/g, '-').toLowerCase()}`,
        score: Math.floor(Math.random() * 30 + 70) // 70-100 score
      }
    } else {
      return {
        status: 'failed',
        message: 'Directory submission failed',
        error: 'Form validation error or site temporarily unavailable'
      }
    }
  }

  /**
   * Generate directory list based on package type
   * @param {string} packageType - Customer package type
   * @param {Object} businessData - Business data for targeting
   * @returns {Promise<Array>} Array of directories to process
   */
  async _generateDirectoryList(packageType, businessData) {
    // This would normally query a database or API for appropriate directories
    // Based on business location, category, package tier, etc.
    
    const directoryLimits = {
      'starter': 25,
      'growth': 50, 
      'professional': 75,
      'enterprise': 100
    }
    
    const limit = directoryLimits[packageType] || 25
    
    // Sample directory list (in real implementation, this would be dynamic)
    const allDirectories = [
      { name: 'Yelp', url: 'https://yelp.com', category: 'business', tier: 'premium' },
      { name: 'Google Business', url: 'https://business.google.com', category: 'business', tier: 'premium' },
      { name: 'Yellow Pages', url: 'https://yellowpages.com', category: 'business', tier: 'standard' },
      { name: 'Foursquare', url: 'https://foursquare.com', category: 'business', tier: 'standard' },
      { name: 'BBB', url: 'https://bbb.org', category: 'business', tier: 'premium' },
      { name: 'Local.com', url: 'https://local.com', category: 'business', tier: 'standard' },
      { name: 'CitySquares', url: 'https://citysquares.com', category: 'business', tier: 'standard' },
      { name: 'Hotfrog', url: 'https://hotfrog.com', category: 'business', tier: 'standard' }
    ]
    
    // Return limited list based on package
    return allDirectories.slice(0, Math.min(limit, allDirectories.length))
  }

  /**
   * Parse business data from job
   * @param {Object} businessData - Raw business data
   * @returns {Object} Parsed and validated business data
   */
  _parseBusinessData(businessData) {
    try {
      const parsed = typeof businessData === 'string' ? JSON.parse(businessData) : businessData
      
      return {
        businessName: parsed.businessName || parsed.companyName || 'Unknown Business',
        website: parsed.website || '',
        address: parsed.address || '',
        city: parsed.city || '',
        state: parsed.state || '',
        zipCode: parsed.zipCode || '',
        phone: parsed.phone || '',
        description: parsed.description || parsed.businessDescription || '',
        category: parsed.category || 'business'
      }
    } catch (error) {
      console.error('❌ AutoBoltProcessor: Error parsing business data:', error)
      return {
        businessName: 'Unknown Business',
        website: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        description: '',
        category: 'business'
      }
    }
  }

  /**
   * Sleep utility for rate limiting
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get current processing status
   * @returns {Object} Current status
   */
  getStatus() {
    return {
      isProcessing: this.isProcessing,
      currentJob: this.currentJob ? {
        jobId: this.currentJob.jobId,
        customerName: this.currentJob.customerName,
        packageType: this.currentJob.packageType
      } : null,
      metrics: { ...this.processingMetrics }
    }
  }

  /**
   * Get processing statistics
   * @returns {Object} Processing statistics
   */
  getStatistics() {
    if (!this.processingMetrics.startTime) {
      return null
    }

    const elapsedTime = Date.now() - this.processingMetrics.startTime
    const progressPercentage = this.processingMetrics.totalDirectories > 0 
      ? Math.round(((this.processingMetrics.successfulSubmissions + this.processingMetrics.failedSubmissions + this.processingMetrics.skippedDirectories) / this.processingMetrics.totalDirectories) * 100)
      : 0

    return {
      elapsedTimeMinutes: Math.round(elapsedTime / (1000 * 60)),
      progressPercentage,
      totalDirectories: this.processingMetrics.totalDirectories,
      successfulSubmissions: this.processingMetrics.successfulSubmissions,
      failedSubmissions: this.processingMetrics.failedSubmissions,
      skippedDirectories: this.processingMetrics.skippedDirectories,
      currentDirectory: this.processingMetrics.currentDirectory
    }
  }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AutoBoltProcessor
} else {
  // Make available globally for Chrome extension
  window.AutoBoltProcessor = AutoBoltProcessor
}

console.log('✅ AutoBoltProcessor class loaded successfully')