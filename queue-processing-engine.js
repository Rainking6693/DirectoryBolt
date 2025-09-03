/**
 * AutoBolt Queue Processing Engine
 * Enhanced customer queue processing with priority-based management and package tiers
 * 
 * This module handles:
 * - Customer queue retrieval and processing
 * - Package-based priority handling (Enterprise → Professional → Growth → Starter)
 * - Concurrent processing limits by package type
 * - Real-time status updates and progress tracking
 * - Advanced error handling and retry mechanisms
 */

class QueueProcessingEngine {
    constructor(config = {}) {
        this.config = {
            apiUrl: 'https://api.airtable.com/v0',
            baseId: config.baseId || '',
            apiToken: config.apiToken || '',
            pollInterval: config.pollInterval || 30000, // 30 seconds
            maxRetries: config.maxRetries || 3,
            ...config
        };

        // Processing state management
        this.processingState = {
            isActive: false,
            currentCustomer: null,
            activeProcessors: new Map(),
            queueCache: new Map(),
            metrics: {
                totalProcessed: 0,
                successfulSubmissions: 0,
                failedSubmissions: 0,
                averageProcessingTime: 0,
                customerSatisfactionScore: 0
            }
        };

        // Package tier configurations with SLA requirements
        this.packageTiers = {
            'Enterprise': {
                priority: 1,
                maxConcurrentSubmissions: 5,
                processingSpeed: 'white-glove',
                maxRetries: 5,
                slaMinutes: 0, // Immediate processing
                supportLevel: 'dedicated',
                directoryLimit: null, // Unlimited
                features: ['real-time-monitoring', 'priority-support', 'custom-reporting']
            },
            'Professional': {
                priority: 2,
                maxConcurrentSubmissions: 3,
                processingSpeed: 'rush',
                maxRetries: 3,
                slaMinutes: 15, // 15-minute SLA
                supportLevel: 'phone',
                directoryLimit: 500,
                features: ['rush-processing', 'detailed-reporting', 'phone-support']
            },
            'Growth': {
                priority: 3,
                maxConcurrentSubmissions: 2,
                processingSpeed: 'priority',
                maxRetries: 2,
                slaMinutes: 60, // 1-hour SLA
                supportLevel: 'email',
                directoryLimit: 200,
                features: ['priority-processing', 'advanced-retry-logic', 'email-support']
            },
            'Starter': {
                priority: 4,
                maxConcurrentSubmissions: 1,
                processingSpeed: 'standard',
                maxRetries: 1,
                slaMinutes: 240, // 4-hour SLA
                supportLevel: 'email',
                directoryLimit: 50,
                features: ['standard-processing', 'basic-error-handling', 'email-support']
            }
        };

        // Event listeners for real-time updates
        this.eventListeners = new Map();
        
        // Initialize processing engine
        this.init();
    }

    /**
     * Initialize the queue processing engine
     */
    async init() {
        console.log('🚀 Initializing AutoBolt Queue Processing Engine...');
        
        try {
            // Validate configuration
            await this.validateConfiguration();
            
            // Initialize metrics
            await this.initializeMetrics();
            
            // Start queue monitoring if enabled
            if (this.config.autoStart !== false) {
                await this.startQueueMonitoring();
            }
            
            console.log('✅ Queue Processing Engine initialized successfully');
            this.emit('engine:ready', { timestamp: Date.now() });
            
        } catch (error) {
            console.error('❌ Failed to initialize Queue Processing Engine:', error);
            this.emit('engine:error', { error: error.message, timestamp: Date.now() });
            throw error;
        }
    }

    /**
     * Validate configuration and Airtable connection
     */
    async validateConfiguration() {
        if (!this.config.apiToken) {
            throw new Error('Airtable API token is required');
        }

        if (!this.config.baseId) {
            throw new Error('Airtable Base ID is required');
        }

        // Test Airtable connection
        try {
            await this.makeAirtableRequest('GET', 'Customers', { maxRecords: 1 });
            console.log('✅ Airtable connection validated');
        } catch (error) {
            throw new Error(`Airtable connection failed: ${error.message}`);
        }
    }

    /**
     * Start continuous queue monitoring
     */
    async startQueueMonitoring() {
        if (this.processingState.isActive) {
            console.log('⚠️ Queue monitoring is already active');
            return;
        }

        this.processingState.isActive = true;
        console.log('👀 Starting queue monitoring...');

        // Start polling for queue entries
        this.queueMonitorInterval = setInterval(async () => {
            try {
                await this.processQueue();
            } catch (error) {
                console.error('❌ Queue processing error:', error);
                await this.logError('Queue Processing', error.message, {
                    stackTrace: error.stack,
                    timestamp: Date.now()
                });
            }
        }, this.config.pollInterval);

        // Start metrics update interval
        this.metricsInterval = setInterval(() => {
            this.updateMetrics();
        }, 60000); // Update every minute

        this.emit('queue:monitoring-started', { timestamp: Date.now() });
    }

    /**
     * Stop queue monitoring
     */
    stopQueueMonitoring() {
        if (!this.processingState.isActive) {
            console.log('⚠️ Queue monitoring is not active');
            return;
        }

        this.processingState.isActive = false;
        console.log('🛑 Stopping queue monitoring...');

        if (this.queueMonitorInterval) {
            clearInterval(this.queueMonitorInterval);
            this.queueMonitorInterval = null;
        }

        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
            this.metricsInterval = null;
        }

        this.emit('queue:monitoring-stopped', { timestamp: Date.now() });
    }

    /**
     * Main queue processing logic with intelligent prioritization
     */
    async processQueue() {
        try {
            console.log('🔄 Processing customer queue...');

            // Get pending queue entries with priority sorting
            const queueEntries = await this.getPendingQueueEntries();

            if (queueEntries.length === 0) {
                console.log('📭 No pending queue entries found');
                return;
            }

            console.log(`📋 Found ${queueEntries.length} pending queue entries`);

            // Group by package type and process by priority
            const groupedEntries = this.groupEntriesByPackage(queueEntries);
            await this.processPackageGroups(groupedEntries);

        } catch (error) {
            console.error('❌ Queue processing failed:', error);
            this.emit('queue:processing-error', { error: error.message, timestamp: Date.now() });
        }
    }

    /**
     * Get pending queue entries sorted by priority and SLA urgency
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

            // Calculate SLA urgency and adjust priority
            const entriesWithSLA = (response.records || []).map(entry => {
                const packageConfig = this.packageTiers[entry.fields.package_type];
                const dateAdded = new Date(entry.fields.date_added);
                const now = new Date();
                const minutesWaiting = (now - dateAdded) / (1000 * 60);
                const slaUrgency = packageConfig ? minutesWaiting / packageConfig.slaMinutes : 0;

                return {
                    ...entry,
                    slaUrgency,
                    effectivePriority: entry.fields.priority_score + (slaUrgency * 100)
                };
            });

            // Sort by effective priority (including SLA urgency)
            entriesWithSLA.sort((a, b) => a.effectivePriority - b.effectivePriority);

            return entriesWithSLA;

        } catch (error) {
            console.error('❌ Failed to fetch pending queue entries:', error);
            throw error;
        }
    }

    /**
     * Group queue entries by package type
     */
    groupEntriesByPackage(entries) {
        const grouped = {};
        
        entries.forEach(entry => {
            const packageType = entry.fields.package_type;
            if (!grouped[packageType]) {
                grouped[packageType] = [];
            }
            grouped[packageType].push(entry);
        });

        return grouped;
    }

    /**
     * Process package groups in priority order
     */
    async processPackageGroups(groupedEntries) {
        // Get package types sorted by priority
        const packagePriorities = Object.keys(groupedEntries)
            .filter(pkg => this.packageTiers[pkg])
            .sort((a, b) => this.packageTiers[a].priority - this.packageTiers[b].priority);

        for (const packageType of packagePriorities) {
            const entries = groupedEntries[packageType];
            const packageConfig = this.packageTiers[packageType];

            console.log(`📦 Processing ${entries.length} ${packageType} customers`);

            // Process entries with package-specific concurrency
            await this.processPackageEntries(entries, packageConfig);
        }
    }

    /**
     * Process entries for a specific package type
     */
    async processPackageEntries(entries, packageConfig) {
        // Process in batches based on concurrent submission limits
        const batchSize = packageConfig.maxConcurrentSubmissions;
        
        for (let i = 0; i < entries.length; i += batchSize) {
            const batch = entries.slice(i, i + batchSize);
            
            // Process batch concurrently
            const processingPromises = batch.map(entry => 
                this.processCustomerQueue(entry, packageConfig)
            );

            try {
                await Promise.allSettled(processingPromises);
            } catch (error) {
                console.error('❌ Batch processing error:', error);
            }

            // Add delay between batches based on processing speed
            await this.addProcessingDelay(packageConfig.processingSpeed);
        }
    }

    /**
     * Process individual customer queue entry
     */
    async processCustomerQueue(queueEntry, packageConfig) {
        const processorId = `processor_${queueEntry.id}_${Date.now()}`;
        const startTime = Date.now();

        try {
            console.log(`🔄 Processing customer queue: ${queueEntry.id} (${packageConfig.processingSpeed})`);

            // Register active processor
            this.processingState.activeProcessors.set(processorId, {
                queueId: queueEntry.id,
                customerId: queueEntry.fields.customer_id,
                packageType: queueEntry.fields.package_type,
                startTime,
                status: 'processing'
            });

            // Update current customer being processed
            this.processingState.currentCustomer = {
                id: queueEntry.fields.customer_id,
                queueId: queueEntry.id,
                packageType: queueEntry.fields.package_type,
                businessName: queueEntry.fields.business_name
            };

            // Emit processing start event
            this.emit('customer:processing-started', {
                queueId: queueEntry.id,
                customerId: queueEntry.fields.customer_id,
                packageType: queueEntry.fields.package_type,
                timestamp: Date.now()
            });

            // Update queue status to processing
            await this.updateQueueEntry(queueEntry.id, {
                queue_status: 'Processing',
                date_started: new Date().toISOString(),
                assigned_processor: processorId
            });

            // Get customer details and directory selections
            const customerInfo = await this.getCustomerInfo(queueEntry.fields.customer_id);
            const selectedDirectories = await this.getSelectedDirectories(
                queueEntry.fields.selected_directories || []
            );

            // Validate directory limits for package tier
            const allowedDirectories = this.validateDirectoryLimits(
                selectedDirectories,
                packageConfig
            );

            // Process directory submissions
            const submissionResults = await this.processDirectorySubmissions(
                queueEntry,
                customerInfo,
                allowedDirectories,
                packageConfig
            );

            // Finalize queue entry
            await this.finalizeQueueEntry(queueEntry, submissionResults, packageConfig);

            // Update metrics
            this.processingState.metrics.totalProcessed++;
            this.processingState.metrics.successfulSubmissions += submissionResults.successful;
            this.processingState.metrics.failedSubmissions += submissionResults.failed;

            // Calculate and update processing time
            const processingTime = (Date.now() - startTime) / 1000;
            this.updateAverageProcessingTime(processingTime);

            console.log(`✅ Successfully processed customer queue: ${queueEntry.id} (${processingTime}s)`);

            // Emit completion event
            this.emit('customer:processing-completed', {
                queueId: queueEntry.id,
                customerId: queueEntry.fields.customer_id,
                results: submissionResults,
                processingTime,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error(`❌ Failed to process customer queue ${queueEntry.id}:`, error);

            // Update queue with error status
            await this.updateQueueEntry(queueEntry.id, {
                queue_status: 'Failed',
                error_messages: error.message,
                processing_notes: `Processing failed: ${error.message}`,
                date_failed: new Date().toISOString()
            });

            // Log error
            await this.logError('Customer Processing', error.message, {
                queueId: queueEntry.id,
                processorId,
                stackTrace: error.stack,
                timestamp: Date.now()
            });

            // Emit error event
            this.emit('customer:processing-error', {
                queueId: queueEntry.id,
                customerId: queueEntry.fields.customer_id,
                error: error.message,
                timestamp: Date.now()
            });

        } finally {
            // Clean up processor
            this.processingState.activeProcessors.delete(processorId);
            
            // Clear current customer if this was the active one
            if (this.processingState.currentCustomer?.queueId === queueEntry.id) {
                this.processingState.currentCustomer = null;
            }
        }
    }

    /**
     * Validate directory limits based on package tier
     */
    validateDirectoryLimits(directories, packageConfig) {
        if (!packageConfig.directoryLimit) {
            return directories; // Unlimited for Enterprise
        }

        if (directories.length <= packageConfig.directoryLimit) {
            return directories;
        }

        // Prioritize directories by success rate and importance
        const sortedDirectories = directories
            .sort((a, b) => {
                const aScore = (a.fields.automation_success_rate || 0.5) * (a.fields.importance_score || 1);
                const bScore = (b.fields.automation_success_rate || 0.5) * (b.fields.importance_score || 1);
                return bScore - aScore;
            });

        return sortedDirectories.slice(0, packageConfig.directoryLimit);
    }

    /**
     * Process directory submissions for a customer
     */
    async processDirectorySubmissions(queueEntry, customerInfo, directories, packageConfig) {
        console.log(`📝 Processing ${directories.length} directory submissions for ${customerInfo.fields.business_name}`);

        const results = {
            successful: 0,
            failed: 0,
            submissions: [],
            processingTime: 0
        };

        const startTime = Date.now();

        // Create Chrome extension processing request
        const processingRequest = {
            type: 'PROCESS_CUSTOMER_DIRECTORIES',
            queueId: queueEntry.id,
            customerId: customerInfo.id,
            businessData: this.formatBusinessDataForExtension(customerInfo.fields),
            directories: directories.map(dir => ({
                id: dir.id,
                name: dir.fields.directory_name,
                url: dir.fields.submission_url,
                difficulty: dir.fields.difficulty_level,
                requiresLogin: dir.fields.requires_login,
                hasAntiBot: dir.fields.has_anti_bot_protection
            })),
            packageConfig: {
                processingSpeed: packageConfig.processingSpeed,
                maxRetries: packageConfig.maxRetries,
                features: packageConfig.features
            }
        };

        try {
            // Send processing request to Chrome extension
            const extensionResults = await this.sendToExtension(processingRequest);
            
            if (extensionResults.success) {
                results.successful = extensionResults.successful || 0;
                results.failed = extensionResults.failed || 0;
                results.submissions = extensionResults.submissions || [];
            } else {
                throw new Error(extensionResults.error || 'Extension processing failed');
            }

        } catch (error) {
            console.error('❌ Directory submissions failed:', error);
            results.failed = directories.length;
            results.submissions = directories.map(dir => ({
                directoryId: dir.id,
                directoryName: dir.fields.directory_name,
                success: false,
                error: error.message
            }));
        }

        results.processingTime = (Date.now() - startTime) / 1000;
        return results;
    }

    /**
     * Format business data for Chrome extension processing
     */
    formatBusinessDataForExtension(customerFields) {
        return {
            businessName: customerFields.business_name,
            contactPerson: customerFields.contact_person,
            email: customerFields.email,
            phone: customerFields.phone,
            address: customerFields.address,
            city: customerFields.city,
            state: customerFields.state,
            zipCode: customerFields.zip_code,
            country: customerFields.country,
            website: customerFields.website,
            businessDescription: customerFields.business_description,
            businessCategory: customerFields.business_category,
            operatingHours: customerFields.operating_hours,
            socialMediaLinks: customerFields.social_media_links
        };
    }

    /**
     * Send processing request to Chrome extension
     */
    async sendToExtension(request) {
        return new Promise((resolve, reject) => {
            // This would communicate with the background script
            chrome.runtime.sendMessage(request, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }

                if (!response) {
                    reject(new Error('No response from extension'));
                    return;
                }

                resolve(response);
            });
        });
    }

    /**
     * Finalize queue entry with processing results
     */
    async finalizeQueueEntry(queueEntry, results, packageConfig) {
        const completionStatus = results.failed === 0 ? 'Completed' : 
                               results.successful > 0 ? 'Partially Completed' : 'Failed';

        const updateData = {
            queue_status: completionStatus,
            date_completed: new Date().toISOString(),
            completed_submissions: results.successful,
            failed_submissions: results.failed,
            processing_time_seconds: results.processingTime,
            processing_notes: `Processed ${results.successful + results.failed} directories. ` +
                             `${results.successful} successful, ${results.failed} failed.`,
            package_features_used: packageConfig.features.join(', ')
        };

        await this.updateQueueEntry(queueEntry.id, updateData);

        // Update customer metrics
        if (results.successful > 0) {
            await this.updateCustomerMetrics(queueEntry.fields.customer_id, {
                completedDirectories: results.successful,
                lastProcessingDate: new Date().toISOString(),
                totalProcessingTime: results.processingTime
            });
        }

        // Send completion notification based on support level
        await this.sendCompletionNotification(queueEntry, results, packageConfig);
    }

    /**
     * Send completion notification to customer
     */
    async sendCompletionNotification(queueEntry, results, packageConfig) {
        try {
            const notificationData = {
                customerId: queueEntry.fields.customer_id,
                queueId: queueEntry.id,
                packageType: queueEntry.fields.package_type,
                supportLevel: packageConfig.supportLevel,
                results: {
                    successful: results.successful,
                    failed: results.failed,
                    totalDirectories: results.successful + results.failed
                },
                completionTime: new Date().toISOString()
            };

            // This would trigger appropriate notification based on support level
            // For now, log the notification
            console.log('📧 Sending completion notification:', notificationData);

            // Create notification record in Airtable
            await this.makeAirtableRequest('POST', 'Notifications', {
                fields: {
                    customer_id: queueEntry.fields.customer_id,
                    queue_id: queueEntry.id,
                    notification_type: 'Processing Completion',
                    notification_status: 'Sent',
                    notification_channel: packageConfig.supportLevel,
                    message_content: `Your directory submission has been completed. ` +
                                   `${results.successful} directories processed successfully.`,
                    date_sent: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('❌ Failed to send completion notification:', error);
        }
    }

    /**
     * Add processing delay based on service speed
     */
    async addProcessingDelay(processingSpeed) {
        const delays = {
            'white-glove': 1000,  // 1 second for white-glove
            'rush': 500,          // 0.5 seconds for rush
            'priority': 250,      // 0.25 seconds for priority
            'standard': 100       // 0.1 seconds for standard
        };

        const delay = delays[processingSpeed] || delays['standard'];
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Update average processing time metric
     */
    updateAverageProcessingTime(newTime) {
        const { averageProcessingTime, totalProcessed } = this.processingState.metrics;
        
        if (totalProcessed === 0) {
            this.processingState.metrics.averageProcessingTime = newTime;
        } else {
            this.processingState.metrics.averageProcessingTime = 
                ((averageProcessingTime * (totalProcessed - 1)) + newTime) / totalProcessed;
        }
    }

    /**
     * Get current processing status and metrics
     */
    getProcessingStatus() {
        return {
            isActive: this.processingState.isActive,
            currentCustomer: this.processingState.currentCustomer,
            activeProcessors: Array.from(this.processingState.activeProcessors.values()),
            metrics: { ...this.processingState.metrics },
            queueSize: this.processingState.queueCache.size,
            timestamp: Date.now()
        };
    }

    /**
     * Initialize processing metrics
     */
    async initializeMetrics() {
        console.log('📊 Initializing processing metrics...');
        
        try {
            // Load existing metrics from ProcessingLogs table
            const metricsResponse = await this.makeAirtableRequest('GET', 'ProcessingLogs', {
                filterByFormula: `{event_type} = 'Metrics Update'`,
                sort: [{ field: 'timestamp', direction: 'desc' }],
                maxRecords: 1
            });

            if (metricsResponse.records && metricsResponse.records.length > 0) {
                const latestMetrics = JSON.parse(
                    metricsResponse.records[0].fields.additional_data || '{}'
                );
                
                // Update metrics with loaded data
                Object.assign(this.processingState.metrics, latestMetrics);
                console.log('✅ Metrics loaded from previous session');
            } else {
                console.log('📊 Starting with fresh metrics');
            }
        } catch (error) {
            console.warn('⚠️ Could not load previous metrics, starting fresh:', error.message);
        }
    }

    /**
     * Update and persist metrics
     */
    updateMetrics() {
        // Calculate customer satisfaction score based on success rate
        const totalSubmissions = this.processingState.metrics.successfulSubmissions + 
                                this.processingState.metrics.failedSubmissions;
        
        if (totalSubmissions > 0) {
            this.processingState.metrics.customerSatisfactionScore = 
                (this.processingState.metrics.successfulSubmissions / totalSubmissions) * 100;
        }

        // Emit metrics update event
        this.emit('metrics:updated', {
            metrics: { ...this.processingState.metrics },
            timestamp: Date.now()
        });
    }

    /**
     * Event emission system
     */
    emit(eventName, data) {
        const listeners = this.eventListeners.get(eventName);
        if (listeners) {
            listeners.forEach(listener => {
                try {
                    listener(data);
                } catch (error) {
                    console.error(`❌ Error in event listener for ${eventName}:`, error);
                }
            });
        }
    }

    /**
     * Event listener registration
     */
    on(eventName, listener) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        this.eventListeners.get(eventName).push(listener);
    }

    /**
     * Remove event listener
     */
    off(eventName, listener) {
        const listeners = this.eventListeners.get(eventName);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }

    // Utility methods for Airtable operations
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
            const finalUrl = `${url}?${searchParams.toString()}`;
            const response = await fetch(finalUrl, options);
        } else if (method !== 'GET') {
            options.body = JSON.stringify(params);
        }

        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    async updateQueueEntry(queueId, updateData) {
        return await this.makeAirtableRequest('PATCH', `Queue/${queueId}`, {
            fields: updateData
        });
    }

    async getCustomerInfo(customerId) {
        return await this.makeAirtableRequest('GET', `Customers/${customerId}`);
    }

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

    async updateCustomerMetrics(customerId, metrics) {
        // This would update customer-specific processing metrics
        console.log(`📈 Updating customer ${customerId} metrics:`, metrics);
    }

    async logError(eventType, errorMessage, additionalData = {}) {
        try {
            await this.makeAirtableRequest('POST', 'ProcessingLogs', {
                fields: {
                    log_level: 'ERROR',
                    event_type: eventType,
                    event_summary: errorMessage,
                    error_message: errorMessage,
                    additional_data: JSON.stringify(additionalData),
                    processor_instance: 'queue_processing_engine',
                    timestamp: new Date().toISOString()
                }
            });
        } catch (logError) {
            console.error('❌ Failed to log error to Airtable:', logError);
        }
    }

    /**
     * Cleanup and shutdown
     */
    shutdown() {
        console.log('🛑 Shutting down Queue Processing Engine...');
        
        this.stopQueueMonitoring();
        this.eventListeners.clear();
        this.processingState.activeProcessors.clear();
        this.processingState.queueCache.clear();
        
        console.log('✅ Queue Processing Engine shut down complete');
    }
}

// Export for use in Chrome extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QueueProcessingEngine;
} else if (typeof window !== 'undefined') {
    window.QueueProcessingEngine = QueueProcessingEngine;
}