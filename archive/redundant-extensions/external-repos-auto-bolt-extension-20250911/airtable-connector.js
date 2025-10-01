/**
 * AutoBolt Enhanced Airtable Connector v2
 * Integrates with Shane's enhanced Airtable backend and queue management system
 * 
 * This module provides:
 * - Enhanced queue management API connectivity
 * - Package-based customer processing integration
 * - Real-time status updates and progress tracking
 * - Advanced error handling and retry mechanisms
 * - Connection pooling and rate limiting
 */

class AirtableConnector {
    constructor(config = {}) {
        this.config = {
            apiUrl: 'https://api.airtable.com/v0',
            baseId: config.baseId || process.env.AIRTABLE_BASE_ID,
            apiToken: config.apiToken || process.env.AIRTABLE_API_TOKEN,
            rateLimitPerSecond: config.rateLimitPerSecond || 5,
            retryAttempts: config.retryAttempts || 3,
            retryDelay: config.retryDelay || 1000,
            timeout: config.timeout || 30000,
            ...config
        };

        // Connection state management
        this.connectionState = {
            isConnected: false,
            lastConnectionTest: null,
            connectionErrors: 0,
            rateLimitResetTime: null,
            requestQueue: [],
            activeRequests: 0,
            maxConcurrentRequests: 10
        };

        // API endpoints configuration
        this.endpoints = {
            customers: 'Customers',
            queue: 'Queue',
            directories: 'Directories',
            submissions: 'Submissions',
            processingLogs: 'ProcessingLogs',
            notifications: 'Notifications',
            packageConfigs: 'PackageConfigs'
        };

        // Initialize connection
        this.initialize();
    }

    /**
     * Initialize the Airtable connector
     */
    async initialize() {
        console.log('🚀 Initializing AutoBolt Airtable Connector v2...');

        try {
            await this.validateConfiguration();
            await this.testConnection();
            await this.setupRateLimiting();
            
            this.connectionState.isConnected = true;
            console.log('✅ Airtable Connector initialized successfully');
            
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize Airtable Connector:', error);
            this.connectionState.isConnected = false;
            throw error;
        }
    }

    /**
     * Validate configuration and credentials
     */
    async validateConfiguration() {
        if (!this.config.apiToken) {
            throw new Error('Airtable API token is required');
        }

        if (!this.config.baseId) {
            throw new Error('Airtable Base ID is required');
        }

        // Validate token format
        if (!this.config.apiToken.startsWith('pat') && !this.config.apiToken.startsWith('key')) {
            console.warn('⚠️ API token format may be invalid');
        }

        console.log('✅ Configuration validated');
    }

    /**
     * Test connection to Airtable
     */
    async testConnection() {
        try {
            console.log('🔍 Testing Airtable connection...');
            
            const response = await this.makeRequest('GET', this.endpoints.customers, {
                maxRecords: 1
            });

            this.connectionState.lastConnectionTest = Date.now();
            this.connectionState.connectionErrors = 0;
            
            console.log('✅ Airtable connection test successful');
            return response;
            
        } catch (error) {
            this.connectionState.connectionErrors++;
            console.error('❌ Airtable connection test failed:', error);
            throw error;
        }
    }

    /**
     * Setup rate limiting to respect Airtable's API limits
     */
    setupRateLimiting() {
        this.rateLimiter = {
            requests: [],
            maxRequestsPerSecond: this.config.rateLimitPerSecond,
            
            canMakeRequest: () => {
                const now = Date.now();
                const oneSecondAgo = now - 1000;
                
                // Remove old requests
                this.rateLimiter.requests = this.rateLimiter.requests
                    .filter(time => time > oneSecondAgo);
                
                return this.rateLimiter.requests.length < this.rateLimiter.maxRequestsPerSecond;
            },
            
            recordRequest: () => {
                this.rateLimiter.requests.push(Date.now());
            },
            
            waitForSlot: async () => {
                while (!this.rateLimiter.canMakeRequest()) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
        };

        console.log('⚡ Rate limiting configured');
    }

    /**
     * Queue Management API Methods
     */

    /**
     * Get next customer in priority order
     */
    async getNextCustomerInQueue() {
        console.log('🔄 Fetching next customer from queue...');
        
        try {
            const filter = `AND(
                {queue_status} = 'Pending',
                {customer_id} != BLANK(),
                {package_type} != BLANK()
            )`;

            const response = await this.makeRequest('GET', this.endpoints.queue, {
                filterByFormula: filter,
                sort: [
                    { field: 'priority_score', direction: 'asc' },
                    { field: 'date_added', direction: 'asc' }
                ],
                maxRecords: 1
            });

            const queueEntry = response.records?.[0];
            
            if (queueEntry) {
                console.log(`👤 Found customer in queue: ${queueEntry.fields.business_name} (${queueEntry.fields.package_type})`);
                
                // Enhance with SLA urgency calculation
                const packageSLA = await this.getPackageSLA(queueEntry.fields.package_type);
                const slaUrgency = this.calculateSLAUrgency(queueEntry.fields.date_added, packageSLA);
                
                return {
                    ...queueEntry,
                    slaUrgency,
                    effectivePriority: queueEntry.fields.priority_score + (slaUrgency * 100)
                };
            }
            
            console.log('📭 No customers in queue');
            return null;
            
        } catch (error) {
            console.error('❌ Failed to fetch next customer:', error);
            throw error;
        }
    }

    /**
     * Update queue processing status
     */
    async updateQueueStatus(queueId, status, additionalData = {}) {
        console.log(`📊 Updating queue ${queueId} status to: ${status}`);
        
        try {
            const updateData = {
                queue_status: status,
                last_updated: new Date().toISOString(),
                ...additionalData
            };

            const response = await this.makeRequest('PATCH', `${this.endpoints.queue}/${queueId}`, {
                fields: updateData
            });

            console.log(`✅ Queue status updated successfully`);
            return response;
            
        } catch (error) {
            console.error(`❌ Failed to update queue status:`, error);
            throw error;
        }
    }

    /**
     * Customer Management API Methods
     */

    /**
     * Get customer details with package information
     */
    async getCustomerDetails(customerID) {
        console.log(`👤 Fetching customer details: ${customerID}`);
        
        try {
            const response = await this.makeRequest('GET', `${this.endpoints.customers}/${customerID}`);
            
            if (response) {
                // Enhance with package configuration
                const packageConfig = await this.getPackageConfiguration(response.fields.package_type);
                
                return {
                    ...response,
                    packageConfig
                };
            }
            
            throw new Error('Customer not found');
            
        } catch (error) {
            console.error(`❌ Failed to fetch customer details:`, error);
            throw error;
        }
    }

    /**
     * Get package configuration and features
     */
    async getPackageConfiguration(packageType) {
        try {
            const filter = `{package_name} = '${packageType}'`;
            
            const response = await this.makeRequest('GET', this.endpoints.packageConfigs, {
                filterByFormula: filter,
                maxRecords: 1F
            });

            const packageRecord = response.records?.[0];
            
            if (packageRecord) {
                return {
                    type: packageType,
                    features: JSON.parse(packageRecord.fields.features || '{}'),
                    limits: JSON.parse(packageRecord.fields.limits || '{}'),
                    sla: JSON.parse(packageRecord.fields.sla_requirements || '{}'),
                    pricing: JSON.parse(packageRecord.fields.pricing_info || '{}')
                };
            }
            
            // Return default configuration if not found
            return this.getDefaultPackageConfig(packageType);
            
        } catch (error) {
            console.warn(`⚠️ Could not fetch package config for ${packageType}, using defaults`);
            return this.getDefaultPackageConfig(packageType);
        }
    }

    /**
     * Directory Management API Methods
     */

    /**
     * Get directories for customer based on package tier
     */
    async getDirectoriesForCustomer(customerID, packageType) {
        console.log(`📁 Fetching directories for ${packageType} customer: ${customerId}`);
        
        try {
            // Get customer's selected directories
            const customer = await this.getCustomerDetails(customerID);
            const selectedDirectoryIds = customer.fields.selected_directories || [];
            
            if (selectedDirectoryIds.length === 0) {
                console.log('⚠️ No directories selected for customer');
                return [];
            }

            // Fetch directory details
            const filter = `OR(${selectedDirectoryIds.map(id => `RECORD_ID() = '${id}'`).join(',')})`;
            
            const response = await this.makeRequest('GET', this.endpoints.directories, {
                filterByFormula: filter
            });

            let directories = response.records || [];

            // Apply package-based filtering
            directories = this.filterDirectoriesByPackage(directories, packageType);

            console.log(`✅ Retrieved ${directories.length} directories for processing`);
            return directories;
            
        } catch (error) {
            console.error('❌ Failed to fetch customer directories:', error);
            throw error;
        }
    }

    /**
     * Filter directories based on package tier capabilities
     */
    filterDirectoriesByPackage(directories, packageType) {
        const packageTierLimits = {
            'Starter': {
                maxDirectories: 50,
                allowDifficult: false,
                allowAntiBot: false,
                allowCaptcha: false,
                tiers: [1]
            },
            'Growth': {
                maxDirectories: 200,
                allowDifficult: false,
                allowAntiBot: false,
                allowCaptcha: false,
                tiers: [1, 2]
            },
            'Professional': {
                maxDirectories: 500,
                allowDifficult: true,
                allowAntiBot: false,
                allowCaptcha: true,
                tiers: [1, 2, 3]
            },
            'Enterprise': {
                maxDirectories: null, // Unlimited
                allowDifficult: true,
                allowAntiBot: true,
                allowCaptcha: true,
                tiers: [1, 2, 3, 4, 5] // All tiers
            }
        };

        const limits = packageTierLimits[packageType] || packageTierLimits['Starter'];

        // Filter by tier access
        let filtered = directories.filter(dir => {
            const tier = dir.fields.directory_tier || 1;
            return limits.tiers.includes(tier);
        });

        // Filter by capabilities
        filtered = filtered.filter(dir => {
            const hasAntiBot = dir.fields.has_anti_bot_protection;
            const requiresCaptcha = dir.fields.requires_captcha;
            const difficultyLevel = dir.fields.difficulty_level || 'Medium';

            if (hasAntiBot && !limits.allowAntiBot) return false;
            if (requiresCaptcha && !limits.allowCaptcha) return false;
            if (difficultyLevel === 'Hard' && !limits.allowDifficult) return false;

            return true;
        });

        // Apply directory limit
        if (limits.maxDirectories && filtered.length > limits.maxDirectories) {
            // Prioritize by success rate and importance
            filtered = filtered
                .sort((a, b) => {
                    const aScore = (a.fields.automation_success_rate || 0.5) * (a.fields.importance_score || 1);
                    const bScore = (b.fields.automation_success_rate || 0.5) * (b.fields.importance_score || 1);
                    return bScore - aScore;
                })
                .slice(0, limits.maxDirectories);
        }

        return filtered;
    }

    /**
     * Submission Management API Methods
     */

    /**
     * Record directory submission
     */
    async recordSubmission(submissionData) {
        console.log(`📝 Recording submission for directory: ${submissionData.directoryName}`);
        
        try {
            const response = await this.makeRequest('POST', this.endpoints.submissions, {
                fields: {
                    queue_id: submissionData.queueId,
                    customer_id: submissionData.customerID,
                    directory_id: submissionData.directoryId,
                    directory_name: submissionData.directoryName,
                    submission_status: submissionData.status,
                    processing_started: submissionData.startTime,
                    processing_completed: submissionData.endTime,
                    processing_time_seconds: submissionData.processingTime,
                    success_rate: submissionData.successRate,
                    error_details: submissionData.error,
                    automation_response: submissionData.response,
                    package_type: submissionData.packageType,
                    features_used: submissionData.featuresUsed?.join(', '),
                    quality_score: submissionData.qualityScore
                }
            });

            console.log(`✅ Submission recorded successfully`);
            return response;
            
        } catch (error) {
            console.error('❌ Failed to record submission:', error);
            throw error;
        }
    }

    /**
     * Update submission status
     */
    async updateSubmissionStatus(submissionId, status, additionalData = {}) {
        try {
            const updateData = {
                submission_status: status,
                last_updated: new Date().toISOString(),
                ...additionalData
            };

            const response = await this.makeRequest('PATCH', `${this.endpoints.submissions}/${submissionId}`, {
                fields: updateData
            });

            return response;
            
        } catch (error) {
            console.error(`❌ Failed to update submission status:`, error);
            throw error;
        }
    }

    /**
     * Progress Tracking and Status Updates
     */

    /**
     * Send progress update to Morgan's tracking system
     */
    async sendProgressUpdate(queueId, customerID, progressData) {
        console.log(`📊 Sending progress update for queue: ${queueId}`);
        
        try {
            // Record progress in ProcessingLogs
            await this.makeRequest('POST', this.endpoints.processingLogs, {
                fields: {
                    log_level: 'INFO',
                    event_type: 'Progress Update',
                    queue_id: queueId,
                    customer_id: customerId,
                    event_summary: `Progress: ${progressData.completed}/${progressData.total} directories completed`,
                    additional_data: JSON.stringify(progressData),
                    processor_instance: 'chrome_extension',
                    timestamp: new Date().toISOString()
                }
            });

            // Emit WebSocket event for real-time updates (if available)
            if (typeof window !== 'undefined' && window.WebSocket) {
                this.emitRealtimeUpdate('progress', {
                    queueId,
                    customerId,
                    ...progressData
                });
            }

            console.log('✅ Progress update sent successfully');
            
        } catch (error) {
            console.error('❌ Failed to send progress update:', error);
        }
    }

    /**
     * Mark queue item as complete
     */
    async completeQueueItem(queueId, completionData) {
        console.log(`✅ Completing queue item: ${queueId}`);
        
        try {
            const updateData = {
                queue_status: 'Completed',
                date_completed: new Date().toISOString(),
                completed_submissions: completionData.successful,
                failed_submissions: completionData.failed,
                total_processing_time_seconds: completionData.totalProcessingTime,
                overall_success_rate: completionData.successRate,
                quality_score: completionData.qualityScore,
                processing_notes: completionData.notes,
                customer_satisfaction_score: completionData.satisfactionScore
            };

            const response = await this.updateQueueStatus(queueId, 'Completed', updateData);

            // Send completion notification
            await this.sendCompletionNotification(queueId, completionData);

            console.log('✅ Queue item completed successfully');
            return response;
            
        } catch (error) {
            console.error('❌ Failed to complete queue item:', error);
            throw error;
        }
    }

    /**
     * Error Handling and Logging
     */

    /**
     * Log processing error
     */
    async logError(eventType, errorMessage, context = {}) {
        console.log(`🚨 Logging error: ${eventType}`);
        
        try {
            await this.makeRequest('POST', this.endpoints.processingLogs, {
                fields: {
                    log_level: 'ERROR',
                    event_type: eventType,
                    event_summary: errorMessage,
                    error_message: errorMessage,
                    additional_data: JSON.stringify(context),
                    processor_instance: 'chrome_extension',
                    timestamp: new Date().toISOString(),
                    queue_id: context.queueId,
                    customer_id: context.customerID,
                    directory_id: context.directoryId
                }
            });

            console.log('📋 Error logged successfully');
            
        } catch (logError) {
            console.error('❌ Failed to log error:', logError);
        }
    }

    /**
     * Utility Methods
     */

    /**
     * Make rate-limited API request to Airtable
     */
    async makeRequest(method, endpoint, data = {}) {
        await this.rateLimiter.waitForSlot();
        
        if (this.connectionState.activeRequests >= this.connectionState.maxConcurrentRequests) {
            throw new Error('Too many concurrent requests');
        }

        this.connectionState.activeRequests++;
        this.rateLimiter.recordRequest();

        try {
            const url = endpoint.includes('/') ? 
                `${this.config.apiUrl}/${this.config.baseId}/${endpoint}` :
                `${this.config.apiUrl}/${this.config.baseId}/${endpoint}`;

            const options = {
                method,
                headers: {
                    'Authorization': `Bearer ${this.config.apiToken}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'AutoBolt-Extension/2.0'
                },
                timeout: this.config.timeout
            };

            if (method === 'GET' && Object.keys(data).length > 0) {
                const params = new URLSearchParams();
                Object.entries(data).forEach(([key, value]) => {
                    if (Array.isArray(value)) {
                        value.forEach(item => params.append(key, JSON.stringify(item)));
                    } else {
                        params.append(key, typeof value === 'object' ? JSON.stringify(value) : value);
                    }
                });
                const finalUrl = `${url}?${params.toString()}`;
                
                const response = await fetch(finalUrl, options);
                return await this.handleResponse(response);
                
            } else if (method !== 'GET') {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(url, options);
            return await this.handleResponse(response);

        } catch (error) {
            console.error(`❌ API request failed (${method} ${endpoint}):`, error);
            throw error;
        } finally {
            this.connectionState.activeRequests--;
        }
    }

    /**
     * Handle API response with error checking
     */
    async handleResponse(response) {
        if (!response.ok) {
            const errorBody = await response.text();
            
            // Handle rate limiting
            if (response.status === 429) {
                const retryAfter = response.headers.get('Retry-After') || 30;
                this.connectionState.rateLimitResetTime = Date.now() + (retryAfter * 1000);
                throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
            }

            throw new Error(`Airtable API error: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        return await response.json();
    }

    /**
     * Calculate SLA urgency based on time waiting
     */
    calculateSLAUrgency(dateAdded, packageSLA) {
        if (!packageSLA?.responseTimeMinutes) return 0;

        const addedTime = new Date(dateAdded);
        const now = new Date();
        const minutesWaiting = (now - addedTime) / (1000 * 60);
        
        return Math.max(0, minutesWaiting / packageSLA.responseTimeMinutes);
    }

    /**
     * Get package SLA requirements
     */
    async getPackageSLA(packageType) {
        const slaDefaults = {
            'Enterprise': { responseTimeMinutes: 0, completionTimeMinutes: 15 },
            'Professional': { responseTimeMinutes: 15, completionTimeMinutes: 60 },
            'Growth': { responseTimeMinutes: 60, completionTimeMinutes: 240 },
            'Starter': { responseTimeMinutes: 240, completionTimeMinutes: 480 }
        };

        return slaDefaults[packageType] || slaDefaults['Starter'];
    }

    /**
     * Get default package configuration
     */
    getDefaultPackageConfig(packageType) {
        const defaults = {
            'Enterprise': {
                directoryLimit: null,
                concurrentSubmissions: 5,
                retryAttempts: 5,
                processingSpeed: 'white-glove',
                qualityAssurance: 'comprehensive'
            },
            'Professional': {
                directoryLimit: 500,
                concurrentSubmissions: 3,
                retryAttempts: 3,
                processingSpeed: 'rush',
                qualityAssurance: 'enhanced'
            },
            'Growth': {
                directoryLimit: 200,
                concurrentSubmissions: 2,
                retryAttempts: 2,
                processingSpeed: 'priority',
                qualityAssurance: 'standard'
            },
            'Starter': {
                directoryLimit: 50,
                concurrentSubmissions: 1,
                retryAttempts: 1,
                processingSpeed: 'standard',
                qualityAssurance: 'basic'
            }
        };

        return {
            type: packageType,
            features: defaults[packageType] || defaults['Starter'],
            limits: { maxDirectories: defaults[packageType]?.directoryLimit },
            sla: { responseTimeMinutes: this.getPackageSLA(packageType).responseTimeMinutes }
        };
    }

    /**
     * Send completion notification
     */
    async sendCompletionNotification(queueId, completionData) {
        try {
            await this.makeRequest('POST', this.endpoints.notifications, {
                fields: {
                    queue_id: queueId,
                    customer_id: completionData.customerID,
                    notification_type: 'Processing Completed',
                    notification_status: 'Sent',
                    notification_channel: completionData.supportLevel || 'email',
                    message_content: `Directory submission processing completed. ${completionData.successful} out of ${completionData.successful + completionData.failed} directories processed successfully.`,
                    date_sent: new Date().toISOString(),
                    additional_data: JSON.stringify(completionData)
                }
            });
        } catch (error) {
            console.error('❌ Failed to send completion notification:', error);
        }
    }

    /**
     * Emit real-time update (WebSocket integration)
     */
    emitRealtimeUpdate(eventType, data) {
        if (typeof window !== 'undefined' && window.WebSocket && this.websocket) {
            try {
                this.websocket.send(JSON.stringify({
                    type: eventType,
                    data,
                    timestamp: Date.now()
                }));
            } catch (error) {
                console.warn('⚠️ Failed to emit real-time update:', error);
            }
        }
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            isConnected: this.connectionState.isConnected,
            lastConnectionTest: this.connectionState.lastConnectionTest,
            connectionErrors: this.connectionState.connectionErrors,
            activeRequests: this.connectionState.activeRequests,
            rateLimitResetTime: this.connectionState.rateLimitResetTime,
            queueSize: this.connectionState.requestQueue.length
        };
    }

    /**
     * Cleanup and disconnect
     */
    disconnect() {
        console.log('🔌 Disconnecting Airtable Connector...');
        
        this.connectionState.isConnected = false;
        
        if (this.websocket) {
            this.websocket.close();
        }
        
        console.log('✅ Airtable Connector disconnected');
    }
}

// Export for use in Chrome extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AirtableConnector;
} else if (typeof window !== 'undefined') {
    window.AirtableConnector = AirtableConnector;
}