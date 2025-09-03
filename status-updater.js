/**
 * AutoBolt Status Updater
 * Integration with Morgan's real-time tracking system and status monitoring
 * 
 * This module handles:
 * - Real-time status updates to Morgan's tracking dashboard
 * - Progress tracking with detailed metrics
 * - WebSocket connections for live updates
 * - Customer notification system
 * - Performance analytics and reporting
 * - SLA monitoring and alerting
 */

class StatusUpdater {
    constructor(airtableConnector) {
        this.airtableConnector = airtableConnector;
        
        this.config = {
            websocketUrl: process.env.WEBSOCKET_URL || 'wss://auto-bolt.netlify.app/ws',
            trackingDashboardUrl: process.env.TRACKING_DASHBOARD_URL || 'https://auto-bolt.netlify.app/tracking',
            updateInterval: 5000, // 5 seconds
            retryAttempts: 3,
            retryDelay: 1000,
            batchSize: 10
        };

        // Connection state
        this.connectionState = {
            websocket: null,
            isConnected: false,
            lastHeartbeat: null,
            reconnectAttempts: 0,
            maxReconnectAttempts: 5
        };

        // Update queues and tracking
        this.updateQueues = {
            progress: new Map(),
            completion: new Map(),
            errors: new Map(),
            metrics: new Map()
        };

        // Analytics and metrics
        this.analyticsMetrics = {
            totalUpdates: 0,
            successfulUpdates: 0,
            failedUpdates: 0,
            averageUpdateTime: 0,
            lastUpdateTime: null,
            updatesByType: {}
        };

        // Status tracking cache
        this.statusCache = new Map();
        this.customerProgressCache = new Map();
    }

    /**
     * Initialize the status updater
     */
    async initialize() {
        console.log('🚀 Initializing AutoBolt Status Updater...');

        try {
            // Initialize WebSocket connection
            await this.initializeWebSocket();

            // Start update processing intervals
            this.startUpdateProcessing();

            // Setup heartbeat monitoring
            this.startHeartbeatMonitoring();

            console.log('✅ Status Updater initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize Status Updater:', error);
            throw error;
        }
    }

    /**
     * Initialize WebSocket connection for real-time updates
     */
    async initializeWebSocket() {
        return new Promise((resolve, reject) => {
            try {
                console.log('🔌 Connecting to Morgan\'s tracking system...');

                this.connectionState.websocket = new WebSocket(this.config.websocketUrl);

                this.connectionState.websocket.onopen = () => {
                    console.log('✅ Connected to tracking system');
                    this.connectionState.isConnected = true;
                    this.connectionState.reconnectAttempts = 0;
                    this.connectionState.lastHeartbeat = Date.now();
                    
                    // Send authentication
                    this.sendWebSocketMessage({
                        type: 'auth',
                        source: 'chrome_extension',
                        version: '2.0',
                        capabilities: ['progress_updates', 'completion_notifications', 'error_reporting'],
                        timestamp: Date.now()
                    });
                    
                    resolve();
                };

                this.connectionState.websocket.onmessage = (event) => {
                    this.handleWebSocketMessage(event.data);
                };

                this.connectionState.websocket.onclose = (event) => {
                    console.log('🔌 WebSocket connection closed:', event.reason);
                    this.connectionState.isConnected = false;
                    this.handleWebSocketDisconnection();
                };

                this.connectionState.websocket.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    this.connectionState.isConnected = false;
                    reject(error);
                };

            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Handle WebSocket message from tracking system
     */
    handleWebSocketMessage(data) {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'auth_success':
                    console.log('🔐 Authentication successful with tracking system');
                    break;
                    
                case 'heartbeat':
                    this.connectionState.lastHeartbeat = Date.now();
                    this.sendWebSocketMessage({ type: 'heartbeat_response', timestamp: Date.now() });
                    break;
                    
                case 'status_request':
                    this.handleStatusRequest(message.data);
                    break;
                    
                case 'update_acknowledgment':
                    this.handleUpdateAcknowledgment(message.data);
                    break;
                    
                default:
                    console.log('📨 Received message:', message.type);
            }
            
        } catch (error) {
            console.error('❌ Failed to handle WebSocket message:', error);
        }
    }

    /**
     * Handle WebSocket disconnection and reconnection logic
     */
    handleWebSocketDisconnection() {
        if (this.connectionState.reconnectAttempts < this.connectionState.maxReconnectAttempts) {
            this.connectionState.reconnectAttempts++;
            const delay = Math.pow(2, this.connectionState.reconnectAttempts) * 1000; // Exponential backoff
            
            console.log(`🔄 Attempting reconnection ${this.connectionState.reconnectAttempts}/${this.connectionState.maxReconnectAttempts} in ${delay}ms`);
            
            setTimeout(() => {
                this.initializeWebSocket().catch(error => {
                    console.error('❌ Reconnection failed:', error);
                });
            }, delay);
        } else {
            console.error('❌ Max reconnection attempts reached');
            this.fallbackToPolling();
        }
    }

    /**
     * Fallback to HTTP polling when WebSocket fails
     */
    fallbackToPolling() {
        console.log('📡 Falling back to HTTP polling for status updates');
        
        this.pollingInterval = setInterval(async () => {
            try {
                await this.processUpdateQueues();
            } catch (error) {
                console.error('❌ Polling update failed:', error);
            }
        }, this.config.updateInterval * 2); // Slower polling interval
    }

    /**
     * Send progress update to Morgan's tracking system
     */
    async sendProgressUpdate(queueId, customerId, progressData) {
        console.log(`📊 Sending progress update for queue: ${queueId}`);

        const updateData = {
            type: 'progress_update',
            queueId,
            customerId,
            progress: {
                currentDirectory: progressData.currentDirectory || 0,
                totalDirectories: progressData.totalDirectories || 0,
                completedDirectories: progressData.completedDirectories || progressData.currentDirectory - 1,
                failedDirectories: progressData.failedDirectories || 0,
                progressPercentage: progressData.progress || 0,
                currentDirectoryName: progressData.currentDirectoryName,
                estimatedTimeRemaining: progressData.estimatedTimeRemaining,
                processingSpeed: progressData.processingSpeed || 'standard',
                packageType: progressData.packageType,
                businessName: progressData.businessName
            },
            metadata: {
                source: 'chrome_extension',
                timestamp: Date.now(),
                updateId: this.generateUpdateId(),
                version: '2.0'
            }
        };

        try {
            // Add to progress queue for batch processing
            this.updateQueues.progress.set(queueId, updateData);

            // Send immediate update for high-priority packages
            if (progressData.packageType === 'Enterprise' || progressData.packageType === 'Professional') {
                await this.sendImmediateUpdate(updateData);
            }

            // Update local progress cache
            this.customerProgressCache.set(customerId, {
                ...progressData,
                lastUpdated: Date.now()
            });

            // Record progress in Airtable
            await this.recordProgressInAirtable(queueId, customerId, progressData);

            console.log('✅ Progress update queued successfully');

        } catch (error) {
            console.error('❌ Failed to send progress update:', error);
            await this.logError('Progress Update', error.message, { queueId, customerId });
        }
    }

    /**
     * Send completion update to tracking system
     */
    async sendCompletionUpdate(queueId, completionData) {
        console.log(`✅ Sending completion update for queue: ${queueId}`);

        const updateData = {
            type: 'completion_update',
            queueId,
            customerId: completionData.customerId,
            completion: {
                status: 'completed',
                totalDirectories: completionData.successful + completionData.failed,
                successfulSubmissions: completionData.successful,
                failedSubmissions: completionData.failed,
                successRate: completionData.successRate,
                qualityScore: completionData.qualityScore,
                totalProcessingTime: completionData.totalProcessingTime,
                customerSatisfactionScore: completionData.satisfactionScore || 0,
                packageType: completionData.packageType || 'Unknown',
                supportLevel: completionData.supportLevel || 'email',
                completedAt: new Date().toISOString()
            },
            notifications: {
                customerNotification: {
                    required: true,
                    channel: completionData.supportLevel || 'email',
                    template: 'completion_notification',
                    priority: this.getNotificationPriority(completionData.packageType)
                },
                adminNotification: {
                    required: completionData.failed > 0 || completionData.successRate < 0.9,
                    reason: completionData.failed > 0 ? 'failures_detected' : 'low_success_rate'
                }
            },
            metadata: {
                source: 'chrome_extension',
                timestamp: Date.now(),
                updateId: this.generateUpdateId(),
                version: '2.0'
            }
        };

        try {
            // Add to completion queue
            this.updateQueues.completion.set(queueId, updateData);

            // Send immediate update for all completions
            await this.sendImmediateUpdate(updateData);

            // Record completion metrics
            await this.recordCompletionMetrics(queueId, completionData);

            // Trigger customer satisfaction survey for higher tier packages
            if (['Enterprise', 'Professional'].includes(completionData.packageType)) {
                await this.triggerSatisfactionSurvey(completionData);
            }

            console.log('✅ Completion update sent successfully');

        } catch (error) {
            console.error('❌ Failed to send completion update:', error);
            await this.logError('Completion Update', error.message, { queueId });
        }
    }

    /**
     * Send error update to tracking system
     */
    async sendErrorUpdate(queueId, customerId, errorData) {
        console.log(`🚨 Sending error update for queue: ${queueId}`);

        const updateData = {
            type: 'error_update',
            queueId,
            customerId,
            error: {
                errorType: errorData.type || 'processing_error',
                errorMessage: errorData.message,
                errorCode: errorData.code,
                directoryName: errorData.directoryName,
                retryAttempt: errorData.retryAttempt || 0,
                isRetryable: errorData.isRetryable || false,
                packageType: errorData.packageType,
                severity: errorData.severity || 'medium',
                context: errorData.context || {},
                stackTrace: errorData.stackTrace,
                occurredAt: new Date().toISOString()
            },
            escalation: {
                required: this.shouldEscalateError(errorData),
                level: this.getEscalationLevel(errorData),
                channels: this.getEscalationChannels(errorData.packageType)
            },
            metadata: {
                source: 'chrome_extension',
                timestamp: Date.now(),
                updateId: this.generateUpdateId(),
                version: '2.0'
            }
        };

        try {
            // Add to error queue
            this.updateQueues.errors.set(`${queueId}_${Date.now()}`, updateData);

            // Send immediate update for critical errors
            if (errorData.severity === 'critical' || errorData.packageType === 'Enterprise') {
                await this.sendImmediateUpdate(updateData);
            }

            // Log error in Airtable
            await this.airtableConnector.logError(errorData.type, errorData.message, {
                queueId,
                customerId,
                errorData
            });

            console.log('🚨 Error update sent successfully');

        } catch (error) {
            console.error('❌ Failed to send error update:', error);
        }
    }

    /**
     * Send metrics update to tracking system
     */
    async sendMetricsUpdate(metricsData) {
        console.log('📈 Sending metrics update to tracking system');

        const updateData = {
            type: 'metrics_update',
            metrics: {
                processing: {
                    totalProcessed: metricsData.totalProcessed || 0,
                    successfulCustomers: metricsData.successfulCustomers || 0,
                    failedCustomers: metricsData.failedCustomers || 0,
                    averageProcessingTime: metricsData.averageProcessingTime || 0,
                    currentQueueSize: metricsData.currentQueueSize || 0,
                    activeProcessors: metricsData.activeProcessors || 0
                },
                packages: metricsData.packageDistribution || {},
                quality: {
                    averageQualityScore: metricsData.averageQualityScore || 0,
                    customerSatisfactionAverage: metricsData.customerSatisfactionAverage || 0,
                    slaCompliance: metricsData.slaCompliance || 0
                },
                system: {
                    uptime: metricsData.uptime || 0,
                    errorRate: metricsData.errorRate || 0,
                    throughput: metricsData.throughput || 0
                }
            },
            metadata: {
                source: 'chrome_extension',
                timestamp: Date.now(),
                updateId: this.generateUpdateId(),
                version: '2.0',
                reportingPeriod: metricsData.reportingPeriod || 'realtime'
            }
        };

        try {
            // Add to metrics queue
            this.updateQueues.metrics.set('latest', updateData);

            // Send periodic metrics updates
            await this.sendImmediateUpdate(updateData);

            console.log('📈 Metrics update sent successfully');

        } catch (error) {
            console.error('❌ Failed to send metrics update:', error);
        }
    }

    /**
     * Send immediate update via WebSocket or HTTP
     */
    async sendImmediateUpdate(updateData) {
        try {
            if (this.connectionState.isConnected && this.connectionState.websocket) {
                // Send via WebSocket
                this.sendWebSocketMessage(updateData);
                this.analyticsMetrics.successfulUpdates++;
            } else {
                // Fallback to HTTP
                await this.sendHttpUpdate(updateData);
            }

            this.analyticsMetrics.totalUpdates++;
            this.analyticsMetrics.lastUpdateTime = Date.now();

            // Update update type metrics
            const updateType = updateData.type;
            this.analyticsMetrics.updatesByType[updateType] = (this.analyticsMetrics.updatesByType[updateType] || 0) + 1;

        } catch (error) {
            this.analyticsMetrics.failedUpdates++;
            throw error;
        }
    }

    /**
     * Send WebSocket message
     */
    sendWebSocketMessage(message) {
        if (this.connectionState.websocket && this.connectionState.websocket.readyState === WebSocket.OPEN) {
            this.connectionState.websocket.send(JSON.stringify(message));
        } else {
            throw new Error('WebSocket not connected');
        }
    }

    /**
     * Send HTTP update as fallback
     */
    async sendHttpUpdate(updateData) {
        const response = await fetch(`${this.config.trackingDashboardUrl}/api/updates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.TRACKING_API_TOKEN}`,
                'User-Agent': 'AutoBolt-Extension/2.0'
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            throw new Error(`HTTP update failed: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Start processing update queues
     */
    startUpdateProcessing() {
        console.log('🔄 Starting update queue processing...');

        this.updateProcessingInterval = setInterval(async () => {
            try {
                await this.processUpdateQueues();
            } catch (error) {
                console.error('❌ Update queue processing failed:', error);
            }
        }, this.config.updateInterval);
    }

    /**
     * Process all update queues in batches
     */
    async processUpdateQueues() {
        try {
            // Process each queue type
            await this.processQueueByType('progress');
            await this.processQueueByType('completion');
            await this.processQueueByType('errors');
            await this.processQueueByType('metrics');

        } catch (error) {
            console.error('❌ Failed to process update queues:', error);
        }
    }

    /**
     * Process specific queue type
     */
    async processQueueByType(queueType) {
        const queue = this.updateQueues[queueType];
        if (queue.size === 0) return;

        console.log(`📦 Processing ${queueType} queue: ${queue.size} updates`);

        const updates = Array.from(queue.entries()).slice(0, this.config.batchSize);

        for (const [key, updateData] of updates) {
            try {
                await this.sendImmediateUpdate(updateData);
                queue.delete(key);
            } catch (error) {
                console.error(`❌ Failed to process ${queueType} update:`, error);
                
                // Retry logic
                updateData.retryCount = (updateData.retryCount || 0) + 1;
                if (updateData.retryCount >= this.config.retryAttempts) {
                    queue.delete(key); // Remove after max retries
                }
            }
        }
    }

    /**
     * Start heartbeat monitoring
     */
    startHeartbeatMonitoring() {
        this.heartbeatInterval = setInterval(() => {
            if (this.connectionState.isConnected && this.connectionState.websocket) {
                const timeSinceHeartbeat = Date.now() - (this.connectionState.lastHeartbeat || 0);
                
                if (timeSinceHeartbeat > 30000) { // 30 seconds timeout
                    console.warn('⚠️ Heartbeat timeout, reconnecting...');
                    this.connectionState.websocket.close();
                }
            }
        }, 15000); // Check every 15 seconds
    }

    /**
     * Record progress in Airtable
     */
    async recordProgressInAirtable(queueId, customerId, progressData) {
        try {
            await this.airtableConnector.makeRequest('POST', 'ProcessingLogs', {
                fields: {
                    log_level: 'INFO',
                    event_type: 'Progress Update',
                    queue_id: queueId,
                    customer_id: customerId,
                    event_summary: `Progress: ${progressData.currentDirectory || 0}/${progressData.totalDirectories || 0} directories completed`,
                    additional_data: JSON.stringify(progressData),
                    processor_instance: 'chrome_extension_v2',
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.warn('⚠️ Failed to record progress in Airtable:', error);
        }
    }

    /**
     * Record completion metrics
     */
    async recordCompletionMetrics(queueId, completionData) {
        try {
            await this.airtableConnector.makeRequest('POST', 'ProcessingLogs', {
                fields: {
                    log_level: 'INFO',
                    event_type: 'Completion Metrics',
                    queue_id: queueId,
                    customer_id: completionData.customerId,
                    event_summary: `Processing completed: ${completionData.successful}/${completionData.successful + completionData.failed} successful`,
                    additional_data: JSON.stringify(completionData),
                    processor_instance: 'chrome_extension_v2',
                    timestamp: new Date().toISOString()
                }
            });
        } catch (error) {
            console.warn('⚠️ Failed to record completion metrics:', error);
        }
    }

    /**
     * Utility methods
     */

    generateUpdateId() {
        return `update_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    getNotificationPriority(packageType) {
        const priorities = {
            'Enterprise': 'critical',
            'Professional': 'high',
            'Growth': 'medium',
            'Starter': 'low'
        };
        return priorities[packageType] || 'low';
    }

    shouldEscalateError(errorData) {
        return errorData.severity === 'critical' || 
               errorData.packageType === 'Enterprise' ||
               (errorData.retryAttempt && errorData.retryAttempt > 2);
    }

    getEscalationLevel(errorData) {
        if (errorData.severity === 'critical' || errorData.packageType === 'Enterprise') {
            return 'tier_3';
        } else if (errorData.packageType === 'Professional') {
            return 'tier_2';
        } else {
            return 'tier_1';
        }
    }

    getEscalationChannels(packageType) {
        const channels = {
            'Enterprise': ['email', 'phone', 'slack', 'pagerduty'],
            'Professional': ['email', 'phone', 'slack'],
            'Growth': ['email', 'slack'],
            'Starter': ['email']
        };
        return channels[packageType] || ['email'];
    }

    /**
     * Customer satisfaction survey
     */
    async triggerSatisfactionSurvey(completionData) {
        try {
            console.log('📝 Triggering customer satisfaction survey');

            await this.airtableConnector.makeRequest('POST', 'Notifications', {
                fields: {
                    customer_id: completionData.customerId,
                    notification_type: 'Satisfaction Survey',
                    notification_status: 'Pending',
                    notification_channel: 'email',
                    message_content: 'Please rate your experience with our directory submission service',
                    survey_link: `${this.config.trackingDashboardUrl}/survey/${completionData.customerId}`,
                    date_scheduled: new Date(Date.now() + 3600000).toISOString(), // 1 hour delay
                    package_type: completionData.packageType
                }
            });

        } catch (error) {
            console.warn('⚠️ Failed to trigger satisfaction survey:', error);
        }
    }

    /**
     * Handle status request from tracking system
     */
    async handleStatusRequest(requestData) {
        try {
            const statusData = {
                type: 'status_response',
                requestId: requestData.requestId,
                status: {
                    connection: {
                        isConnected: this.connectionState.isConnected,
                        lastHeartbeat: this.connectionState.lastHeartbeat,
                        reconnectAttempts: this.connectionState.reconnectAttempts
                    },
                    queues: {
                        progress: this.updateQueues.progress.size,
                        completion: this.updateQueues.completion.size,
                        errors: this.updateQueues.errors.size,
                        metrics: this.updateQueues.metrics.size
                    },
                    analytics: this.analyticsMetrics,
                    activeCustomers: this.customerProgressCache.size
                },
                timestamp: Date.now()
            };

            await this.sendImmediateUpdate(statusData);

        } catch (error) {
            console.error('❌ Failed to handle status request:', error);
        }
    }

    /**
     * Handle update acknowledgment
     */
    handleUpdateAcknowledgment(ackData) {
        console.log('✅ Update acknowledgment received:', ackData.updateId);
        
        // Remove acknowledged updates from queues if needed
        // This helps prevent duplicate processing
    }

    /**
     * Log error with status updater context
     */
    async logError(eventType, errorMessage, context = {}) {
        try {
            await this.airtableConnector.logError(eventType, errorMessage, {
                ...context,
                source: 'status_updater',
                connection_status: this.connectionState.isConnected
            });
        } catch (error) {
            console.error('❌ Failed to log status updater error:', error);
        }
    }

    /**
     * Get current status and metrics
     */
    getStatus() {
        return {
            connection: {
                isConnected: this.connectionState.isConnected,
                lastHeartbeat: this.connectionState.lastHeartbeat,
                reconnectAttempts: this.connectionState.reconnectAttempts
            },
            queues: {
                progress: this.updateQueues.progress.size,
                completion: this.updateQueues.completion.size,
                errors: this.updateQueues.errors.size,
                metrics: this.updateQueues.metrics.size
            },
            analytics: this.analyticsMetrics,
            activeCustomers: this.customerProgressCache.size,
            lastStatus: Date.now()
        };
    }

    /**
     * Get customer progress
     */
    getCustomerProgress(customerId) {
        return this.customerProgressCache.get(customerId) || null;
    }

    /**
     * Clear customer progress
     */
    clearCustomerProgress(customerId) {
        this.customerProgressCache.delete(customerId);
    }

    /**
     * Cleanup and shutdown
     */
    async shutdown() {
        console.log('🛑 Shutting down Status Updater...');

        // Process remaining updates
        await this.processUpdateQueues();

        // Clear intervals
        if (this.updateProcessingInterval) {
            clearInterval(this.updateProcessingInterval);
        }

        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }

        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
        }

        // Close WebSocket
        if (this.connectionState.websocket) {
            this.connectionState.websocket.close();
        }

        // Clear caches
        this.statusCache.clear();
        this.customerProgressCache.clear();

        console.log('✅ Status Updater shutdown complete');
    }
}

// Export for use in Chrome extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StatusUpdater;
} else if (typeof window !== 'undefined') {
    window.StatusUpdater = StatusUpdater;
}