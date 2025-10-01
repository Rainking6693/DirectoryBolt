/**
 * AutoBolt Airtable Queue Manager
 * Advanced queue processing with priority management and package-based routing
 * 
 * This module handles the intelligent processing of customer requests based on
 * their package tiers, priority levels, and system capacity.
 */

const { AIRTABLE_SCHEMA_CONFIG } = require('./airtable-schema-enhancement.js');

class AirtableQueueManager {
    constructor(config = {}) {
        this.config = {
            ...AIRTABLE_SCHEMA_CONFIG,
            ...config
        };
        
        this.processingState = {
            isProcessing: false,
            currentProcessors: new Map(),
            maxConcurrentProcessors: 10,
            processingMetrics: {
                totalProcessed: 0,
                successfulSubmissions: 0,
                failedSubmissions: 0,
                averageProcessingTime: 0
            }
        };
        
        // Priority processing rules based on package types
        this.priorityRules = {
            'Enterprise': {
                priority: 1,
                maxConcurrentSubmissions: 5,
                processingSpeed: 'white-glove',
                maxRetries: 5,
                supportLevel: 'dedicated'
            },
            'Professional': {
                priority: 2,
                maxConcurrentSubmissions: 3,
                processingSpeed: 'rush',
                maxRetries: 3,
                supportLevel: 'phone'
            },
            'Growth': {
                priority: 3,
                maxConcurrentSubmissions: 2,
                processingSpeed: 'priority',
                maxRetries: 2,
                supportLevel: 'email'
            },
            'Starter': {
                priority: 4,
                maxConcurrentSubmissions: 1,
                processingSpeed: 'standard',
                maxRetries: 1,
                supportLevel: 'email'
            }
        };
    }

    /**
     * Initialize the queue manager and start processing
     */
    async initialize() {
        console.log('🚀 Initializing AutoBolt Queue Manager...');
        
        try {
            // Validate Airtable connection
            await this.validateAirtableConnection();
            
            // Initialize processing metrics
            await this.initializeMetrics();
            
            // Start queue monitoring
            this.startQueueMonitoring();
            
            console.log('✅ Queue Manager initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Queue Manager:', error);
            throw error;
        }
    }

    /**
     * Validate Airtable connection and schema
     */
    async validateAirtableConnection() {
        if (!this.config.apiToken) {
            throw new Error('Airtable API token is required');
        }
        
        try {
            const response = await this.makeAirtableRequest('GET', 'Customers', {
                maxRecords: 1
            });
            
            console.log('✅ Airtable connection validated');
            return response;
        } catch (error) {
            console.error('❌ Airtable connection failed:', error);
            throw new Error(`Airtable connection validation failed: ${error.message}`);
        }
    }

    /**
     * Start continuous queue monitoring and processing
     */
    startQueueMonitoring() {
        console.log('👀 Starting queue monitoring...');
        
        // Process queue every 30 seconds
        this.queueMonitorInterval = setInterval(async () => {
            try {
                await this.processQueue();
            } catch (error) {
                console.error('❌ Queue processing error:', error);
                await this.logError('Queue Processing', error.message, { stackTrace: error.stack });
            }
        }, 30000);
        
        // Cleanup stale processors every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanupStaleProcessors();
        }, 300000);
    }

    /**
     * Main queue processing logic with intelligent prioritization
     */
    async processQueue() {
        if (this.processingState.isProcessing) {
            console.log('⏳ Queue processing already in progress, skipping...');
            return;
        }
        
        this.processingState.isProcessing = true;
        
        try {
            console.log('🔄 Processing queue...');
            
            // Get pending queue entries sorted by priority
            const queueEntries = await this.getPendingQueueEntries();
            
            if (queueEntries.length === 0) {
                console.log('📭 No pending queue entries found');
                return;
            }
            
            console.log(`📋 Found ${queueEntries.length} pending queue entries`);
            
            // Process entries based on available capacity and priority
            await this.processQueueEntries(queueEntries);
            
        } finally {
            this.processingState.isProcessing = false;
        }
    }

    /**
     * Get pending queue entries sorted by priority and date
     */
    async getPendingQueueEntries() {
        try {
            const filter = `AND(
                {queue_status} = 'Pending',
                {customer_id} != BLANK(),
                {package_type} != BLANK()
            )`;
            
            const response = await this.makeAirtableRequest('GET', 'Queue', {
                filterByFormula: filter,
                sort: [
                    { field: 'priority_score', direction: 'asc' },
                    { field: 'date_added', direction: 'asc' }
                ],
                maxRecords: 100
            });
            
            return response.records || [];
        } catch (error) {
            console.error('❌ Failed to fetch pending queue entries:', error);
            throw error;
        }
    }

    /**
     * Process queue entries with intelligent capacity management
     */
    async processQueueEntries(queueEntries) {
        const availableCapacity = this.getAvailableProcessingCapacity();
        
        if (availableCapacity <= 0) {
            console.log('🚦 No available processing capacity');
            return;
        }
        
        console.log(`🎯 Available processing capacity: ${availableCapacity}`);
        
        // Group entries by package type for intelligent processing
        const entriesByPackage = this.groupEntriesByPackage(queueEntries);
        
        // Process each package group based on priority
        const packagePriorities = Object.keys(entriesByPackage)
            .sort((a, b) => this.priorityRules[a]?.priority - this.priorityRules[b]?.priority);
        
        let processedCount = 0;
        
        for (const packageType of packagePriorities) {
            if (processedCount >= availableCapacity) break;
            
            const entries = entriesByPackage[packageType];
            const packageConfig = this.priorityRules[packageType];
            
            if (!packageConfig) {
                console.warn(`⚠️ No priority configuration for package type: ${packageType}`);
                continue;
            }
            
            // Process entries for this package type
            const toProcess = Math.min(
                entries.length,
                availableCapacity - processedCount,
                packageConfig.maxConcurrentSubmissions
            );
            
            console.log(`📦 Processing ${toProcess} ${packageType} entries`);
            
            const batch = entries.slice(0, toProcess);
            await this.processBatch(batch, packageConfig);
            
            processedCount += toProcess;
        }
    }

    /**
     * Group queue entries by package type
     */
    groupEntriesByPackage(entries) {
        return entries.reduce((groups, entry) => {
            const packageType = entry.fields.package_type;
            if (!groups[packageType]) {
                groups[packageType] = [];
            }
            groups[packageType].push(entry);
            return groups;
        }, {});
    }

    /**
     * Process a batch of queue entries
     */
    async processBatch(entries, packageConfig) {
        const processingPromises = entries.map(entry => 
            this.processQueueEntry(entry, packageConfig)
        );
        
        try {
            await Promise.allSettled(processingPromises);
        } catch (error) {
            console.error('❌ Batch processing error:', error);
        }
    }

    /**
     * Process individual queue entry
     */
    async processQueueEntry(queueEntry, packageConfig) {
        const queueId = queueEntry.id;
        const processorId = `processor_${queueId}_${Date.now()}`;
        
        try {
            console.log(`🔄 Processing queue entry ${queueId} with processor ${processorId}`);
            
            // Register processor
            this.processingState.currentProcessors.set(processorId, {
                queueId,
                startTime: Date.now(),
                packageConfig,
                status: 'processing'
            });
            
            // Update queue status to processing
            await this.updateQueueEntry(queueId, {
                queue_status: 'Processing',
                date_started: new Date().toISOString(),
                assigned_processor: processorId
            });
            
            // Get customer and directory information
            const customerInfo = await this.getCustomerInfo(queueEntry.fields.customer_id);
            const selectedDirectories = await this.getSelectedDirectories(queueEntry.fields.selected_directories);
            
            // Process directory submissions
            const submissionResults = await this.processDirectorySubmissions(
                queueEntry,
                customerInfo,
                selectedDirectories,
                packageConfig
            );
            
            // Update queue with results
            await this.finalizeQueueEntry(queueEntry, submissionResults);
            
            console.log(`✅ Successfully processed queue entry ${queueId}`);
            
        } catch (error) {
            console.error(`❌ Failed to process queue entry ${queueId}:`, error);
            
            // Update queue with error status
            await this.updateQueueEntry(queueId, {
                queue_status: 'Failed',
                error_messages: error.message,
                processing_notes: `Processing failed: ${error.message}`
            });
            
            // Log the error
            await this.logError('Queue Entry Processing', error.message, {
                queueId,
                processorId,
                stackTrace: error.stack
            });
            
        } finally {
            // Clean up processor
            this.processingState.currentProcessors.delete(processorId);
        }
    }

    /**
     * Process directory submissions for a queue entry
     */
    async processDirectorySubmissions(queueEntry, customerInfo, directories, packageConfig) {
        console.log(`📝 Processing ${directories.length} directory submissions`);
        
        const results = {
            successful: 0,
            failed: 0,
            submissions: []
        };
        
        // Process directories based on package configuration
        const maxConcurrent = packageConfig.maxConcurrentSubmissions;
        const processingBatches = this.chunkArray(directories, maxConcurrent);
        
        for (const batch of processingBatches) {
            const batchPromises = batch.map(directory => 
                this.processDirectorySubmission(queueEntry, customerInfo, directory, packageConfig)
            );
            
            const batchResults = await Promise.allSettled(batchPromises);
            
            // Process batch results
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    results.successful++;
                    results.submissions.push(result.value);
                } else {
                    results.failed++;
                    console.error(`❌ Directory submission failed:`, result.reason);
                }
            });
            
            // Add delay between batches based on processing speed
            if (packageConfig.processingSpeed === 'white-glove') {
                await this.delay(2000); // 2 second delay for white-glove service
            } else if (packageConfig.processingSpeed === 'rush') {
                await this.delay(1000); // 1 second delay for rush service
            } else {
                await this.delay(500); // 0.5 second delay for standard/priority
            }
        }
        
        return results;
    }

    /**
     * Process individual directory submission
     */
    async processDirectorySubmission(queueEntry, customerInfo, directory, packageConfig) {
        const submissionData = {
            queue_id: queueEntry.id,
            customer_id: customerInfo.id,
            directory_id: directory.id,
            submission_status: 'Processing',
            processing_started: new Date().toISOString()
        };
        
        try {
            // Create submission record
            const submissionRecord = await this.createSubmissionRecord(submissionData);
            
            // Simulate directory submission process
            const submissionResult = await this.submitToDirectory(
                directory,
                queueEntry.fields,
                customerInfo,
                packageConfig
            );
            
            // Update submission record with results
            await this.updateSubmissionRecord(submissionRecord.id, {
                submission_status: submissionResult.success ? 'Submitted' : 'Error',
                processing_completed: new Date().toISOString(),
                directory_response: submissionResult.response,
                error_details: submissionResult.error,
                processing_time_seconds: submissionResult.processingTime,
                automation_success: submissionResult.success
            });
            
            return {
                submissionId: submissionRecord.id,
                directoryName: directory.fields.directory_name,
                success: submissionResult.success,
                response: submissionResult.response
            };
            
        } catch (error) {
            console.error(`❌ Directory submission failed for ${directory.fields.directory_name}:`, error);
            
            // Update submission record with error
            if (submissionData.submission_id) {
                await this.updateSubmissionRecord(submissionData.submission_id, {
                    submission_status: 'Error',
                    error_details: error.message,
                    processing_completed: new Date().toISOString()
                });
            }
            
            throw error;
        }
    }

    /**
     * Submit business data to a directory (simulated for now)
     */
    async submitToDirectory(directory, businessData, customerInfo, packageConfig) {
        const startTime = Date.now();
        
        try {
            console.log(`📤 Submitting to ${directory.fields.directory_name}...`);
            
            // Simulate processing time based on package type
            const processingTime = this.getProcessingTime(packageConfig.processingSpeed);
            await this.delay(processingTime);
            
            // Simulate success/failure based on directory configuration
            const successRate = directory.fields.automation_success_rate || 0.85;
            const isSuccessful = Math.random() < successRate;
            
            const processingTimeSeconds = (Date.now() - startTime) / 1000;
            
            if (isSuccessful) {
                return {
                    success: true,
                    response: `Successfully submitted to ${directory.fields.directory_name}`,
                    processingTime: processingTimeSeconds,
                    confirmationNumber: `AUTO_${Date.now()}`
                };
            } else {
                return {
                    success: false,
                    error: `Submission failed to ${directory.fields.directory_name}`,
                    processingTime: processingTimeSeconds
                };
            }
            
        } catch (error) {
            const processingTimeSeconds = (Date.now() - startTime) / 1000;
            return {
                success: false,
                error: error.message,
                processingTime: processingTimeSeconds
            };
        }
    }

    /**
     * Finalize queue entry with processing results
     */
    async finalizeQueueEntry(queueEntry, results) {
        const updateData = {
            queue_status: results.failed > 0 ? 'Completed' : 'Completed',
            date_completed: new Date().toISOString(),
            completed_submissions: results.successful,
            failed_submissions: results.failed,
            processing_notes: `Processed ${results.successful + results.failed} directories. ${results.successful} successful, ${results.failed} failed.`
        };
        
        await this.updateQueueEntry(queueEntry.id, updateData);
        
        // Update customer directory counts
        if (results.successful > 0) {
            await this.updateCustomerDirectoryCounts(
                queueEntry.fields.customer_id,
                results.successful
            );
        }
    }

    /**
     * Get available processing capacity
     */
    getAvailableProcessingCapacity() {
        const currentProcessors = this.processingState.currentProcessors.size;
        return Math.max(0, this.processingState.maxConcurrentProcessors - currentProcessors);
    }

    /**
     * Get processing time based on service level
     */
    getProcessingTime(processingSpeed) {
        const baseTimes = {
            'white-glove': 5000,  // 5 seconds per submission
            'rush': 3000,         // 3 seconds per submission
            'priority': 2000,     // 2 seconds per submission
            'standard': 1000      // 1 second per submission
        };
        
        return baseTimes[processingSpeed] || baseTimes['standard'];
    }

    /**
     * Utility function to chunk array into smaller arrays
     */
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * Utility function to create delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Clean up stale processors
     */
    cleanupStaleProcessors() {
        const staleTimeout = 10 * 60 * 1000; // 10 minutes
        const now = Date.now();
        
        for (const [processorId, processor] of this.processingState.currentProcessors.entries()) {
            if (now - processor.startTime > staleTimeout) {
                console.warn(`🧹 Cleaning up stale processor: ${processorId}`);
                this.processingState.currentProcessors.delete(processorId);
            }
        }
    }

    /**
     * Initialize processing metrics
     */
    async initializeMetrics() {
        // Load existing metrics from Airtable or initialize
        console.log('📊 Initializing processing metrics...');
        // Implementation would load from ProcessingLogs table
    }

    /**
     * Make Airtable API request
     */
    async makeAirtableRequest(method, tableName, params = {}) {
        const url = `${this.config.apiUrl}/${this.config.baseId}/${tableName}`;
        
        const options = {
            method,
            headers: {
                'Authorization': `Bearer ${this.config.apiToken}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (method === 'GET' && Object.keys(params).length > 0) {
            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach(item => searchParams.append(key, JSON.stringify(item)));
                } else {
                    searchParams.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
                }
            });
            url += `?${searchParams.toString()}`;
        } else if (method !== 'GET') {
            options.body = JSON.stringify(params);
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    }

    /**
     * Update queue entry
     */
    async updateQueueEntry(queueId, updateData) {
        return await this.makeAirtableRequest('PATCH', `Queue/${queueId}`, {
            fields: updateData
        });
    }

    /**
     * Create submission record
     */
    async createSubmissionRecord(submissionData) {
        return await this.makeAirtableRequest('POST', 'Submissions', {
            fields: submissionData
        });
    }

    /**
     * Update submission record
     */
    async updateSubmissionRecord(submissionId, updateData) {
        return await this.makeAirtableRequest('PATCH', `Submissions/${submissionId}`, {
            fields: updateData
        });
    }

    /**
     * Get customer information
     */
    async getCustomerInfo(customerId) {
        return await this.makeAirtableRequest('GET', `Customers/${customerId}`);
    }

    /**
     * Get selected directories
     */
    async getSelectedDirectories(directoryIds) {
        if (!Array.isArray(directoryIds) || directoryIds.length === 0) {
            return [];
        }
        
        const filter = `OR(${directoryIds.map(id => `RECORD_ID() = '${id}'`).join(',')})`;
        
        const response = await this.makeAirtableRequest('GET', 'Directories', {
            filterByFormula: filter
        });
        
        return response.records || [];
    }

    /**
     * Update customer directory counts
     */
    async updateCustomerDirectoryCounts(customerId, completedCount) {
        // This would increment the customer's completed directory count
        console.log(`📈 Updating customer ${customerId} directory count by ${completedCount}`);
    }

    /**
     * Log error to ProcessingLogs table
     */
    async logError(eventType, errorMessage, additionalData = {}) {
        try {
            await this.makeAirtableRequest('POST', 'ProcessingLogs', {
                fields: {
                    log_level: 'ERROR',
                    event_type: eventType,
                    event_summary: errorMessage,
                    error_message: errorMessage,
                    additional_data: JSON.stringify(additionalData),
                    processor_instance: `queue_manager_${process.env.INSTANCE_ID || 'default'}`
                }
            });
        } catch (logError) {
            console.error('❌ Failed to log error to Airtable:', logError);
        }
    }

    /**
     * Stop queue monitoring
     */
    stop() {
        console.log('🛑 Stopping queue manager...');
        
        if (this.queueMonitorInterval) {
            clearInterval(this.queueMonitorInterval);
        }
        
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        
        console.log('✅ Queue manager stopped');
    }
}

module.exports = AirtableQueueManager;