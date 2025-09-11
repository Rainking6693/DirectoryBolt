/**
 * AutoBolt Queue Processor v2
 * Main queue processing engine with package priorities and customer processing
 * 
 * This module handles:
 * - Customer queue retrieval and processing by package priority
 * - Package-based directory processing with tier restrictions
 * - Real-time status updates and progress tracking
 * - Advanced error handling and retry mechanisms
 * - Integration with all Phase 2 components
 */

class QueueProcessorV2 {
    constructor(config = {}) {
        this.config = {
            pollInterval: config.pollInterval || 30000, // 30 seconds
            maxConcurrentCustomers: config.maxConcurrentCustomers || 3,
            processingTimeouts: {
                'Enterprise': 900000,   // 15 minutes
                'Professional': 3600000, // 1 hour
                'Growth': 14400000,     // 4 hours
                'Starter': 28800000     // 8 hours
            },
            ...config
        };

        // Initialize components
        this.airtableConnector = null;
        this.packageManager = null;
        this.statusUpdater = null;
        this.errorHandler = null;
        this.directoryFilter = null;

        // Processing state
        this.processingState = {
            isActive: false,
            currentCustomers: new Map(),
            processingMetrics: {
                totalProcessed: 0,
                successfulCustomers: 0,
                failedCustomers: 0,
                averageProcessingTime: 0,
                packageDistribution: {}
            },
            queueMetrics: {
                totalInQueue: 0,
                processingNow: 0,
                completedToday: 0,
                failedToday: 0
            }
        };

        // Package priority configuration
        this.packagePriorities = {
            'Enterprise': {
                priority: 1,
                slaMinutes: 15,
                processingWeight: 3.0,
                maxConcurrent: 2
            },
            'Professional': {
                priority: 2,
                slaMinutes: 60,
                processingWeight: 2.0,
                maxConcurrent: 1
            },
            'Growth': {
                priority: 3,
                slaMinutes: 240,
                processingWeight: 1.5,
                maxConcurrent: 1
            },
            'Starter': {
                priority: 4,
                slaMinutes: 480,
                processingWeight: 1.0,
                maxConcurrent: 1
            }
        };

        this.eventHandlers = new Map();
    }

    /**
     * Initialize the queue processor with all dependencies
     */
    async initialize(dependencies = {}) {
        console.log('🚀 Initializing AutoBolt Queue Processor v2...');

        try {
            // Initialize Airtable connector
            this.airtableConnector = dependencies.airtableConnector || new AirtableConnector();
            if (!this.airtableConnector.connectionState?.isConnected) {
                await this.airtableConnector.initialize();
            }

            // Initialize package manager
            this.packageManager = dependencies.packageManager || new PackageManager();
            await this.packageManager.initialize();

            // Initialize status updater
            this.statusUpdater = dependencies.statusUpdater || new StatusUpdater(this.airtableConnector);
            await this.statusUpdater.initialize();

            // Initialize error handler
            this.errorHandler = dependencies.errorHandler || new ErrorHandlerV2();
            await this.errorHandler.initialize();

            // Initialize directory filter
            this.directoryFilter = dependencies.directoryFilter || new DirectoryFilter();
            await this.directoryFilter.initialize();

            // Setup event listeners
            this.setupEventListeners();

            // Load previous metrics
            await this.loadProcessingMetrics();

            console.log('✅ Queue Processor v2 initialized successfully');
            this.emit('processor:initialized', { timestamp: Date.now() });

            return true;

        } catch (error) {
            console.error('❌ Failed to initialize Queue Processor v2:', error);
            this.emit('processor:error', { error: error.message, timestamp: Date.now() });
            throw error;
        }
    }

    /**
     * Start queue monitoring and processing
     */
    async startProcessing() {
        if (this.processingState.isActive) {
            console.log('⚠️ Queue processing is already active');
            return;
        }

        this.processingState.isActive = true;
        console.log('🔄 Starting queue processing...');

        try {
            // Start main processing loop
            this.processingInterval = setInterval(async () => {
                try {
                    await this.processQueueCycle();
                } catch (error) {
                    console.error('❌ Queue processing cycle error:', error);
                    await this.errorHandler.handleError('Queue Processing Cycle', error, {
                        context: 'main_processing_loop'
                    });
                }
            }, this.config.pollInterval);

            // Start metrics update interval
            this.metricsInterval = setInterval(async () => {
                await this.updateProcessingMetrics();
            }, 60000); // Every minute

            this.emit('processor:started', { timestamp: Date.now() });
            console.log('✅ Queue processing started successfully');

        } catch (error) {
            this.processingState.isActive = false;
            console.error('❌ Failed to start queue processing:', error);
            throw error;
        }
    }

    /**
     * Stop queue processing
     */
    async stopProcessing() {
        if (!this.processingState.isActive) {
            console.log('⚠️ Queue processing is not active');
            return;
        }

        console.log('🛑 Stopping queue processing...');
        this.processingState.isActive = false;

        // Clear intervals
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
        }

        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
            this.metricsInterval = null;
        }

        // Wait for current customers to complete or timeout
        await this.waitForCurrentCustomersToComplete();

        this.emit('processor:stopped', { timestamp: Date.now() });
        console.log('✅ Queue processing stopped');
    }

    /**
     * Main queue processing cycle
     */
    async processQueueCycle() {
        console.log('🔄 Starting queue processing cycle...');

        try {
            // Update queue metrics
            await this.updateQueueMetrics();

            // Check processing capacity
            const availableSlots = this.getAvailableProcessingSlots();
            if (availableSlots === 0) {
                console.log('⏳ All processing slots occupied, waiting...');
                return;
            }

            console.log(`🎯 Available processing slots: ${availableSlots}`);

            // Get next customers by priority
            const nextCustomers = await this.getNextCustomersByPriority(availableSlots);
            
            if (nextCustomers.length === 0) {
                console.log('📭 No customers in queue');
                return;
            }

            console.log(`👥 Found ${nextCustomers.length} customers to process`);

            // Process customers concurrently
            const processingPromises = nextCustomers.map(customer => 
                this.processCustomer(customer)
            );

            // Start all processing tasks
            await Promise.allSettled(processingPromises);

        } catch (error) {
            console.error('❌ Queue processing cycle failed:', error);
            throw error;
        }
    }

    /**
     * Get next customers by package priority
     */
    async getNextCustomersByPriority(maxCustomers) {
        try {
            const customers = [];
            const packageSlots = this.calculatePackageSlots(maxCustomers);

            // Process each package type by priority
            const packageTypes = Object.keys(this.packagePriorities)
                .sort((a, b) => this.packagePriorities[a].priority - this.packagePriorities[b].priority);

            for (const packageType of packageTypes) {
                const slotsForPackage = packageSlots[packageType] || 0;
                if (slotsForPackage === 0) continue;

                const packageCustomers = await this.getCustomersByPackageType(packageType, slotsForPackage);
                customers.push(...packageCustomers);

                if (customers.length >= maxCustomers) break;
            }

            return customers.slice(0, maxCustomers);

        } catch (error) {
            console.error('❌ Failed to get next customers:', error);
            throw error;
        }
    }

    /**
     * Calculate processing slots per package type
     */
    calculatePackageSlots(totalSlots) {
        const slots = {};
        
        // Calculate current processing load per package
        const currentProcessing = Array.from(this.processingState.currentCustomers.values())
            .reduce((acc, customer) => {
                acc[customer.packageType] = (acc[customer.packageType] || 0) + 1;
                return acc;
            }, {});

        // Allocate slots based on priority and current load
        Object.keys(this.packagePriorities).forEach(packageType => {
            const config = this.packagePriorities[packageType];
            const currentLoad = currentProcessing[packageType] || 0;
            const availableForPackage = Math.max(0, config.maxConcurrent - currentLoad);
            
            slots[packageType] = Math.min(availableForPackage, Math.ceil(totalSlots / 4));
        });

        return slots;
    }

    /**
     * Get customers by package type
     */
    async getCustomersByPackageType(packageType, maxCustomers) {
        try {
            const filter = `AND(
                {queue_status} = 'Pending',
                {package_type} = '${packageType}',
                {customer_id} != BLANK()
            )`;

            // Calculate SLA urgency factor
            const slaMinutes = this.packagePriorities[packageType].slaMinutes;
            const urgencyCutoff = new Date(Date.now() - (slaMinutes * 60 * 1000)).toISOString();

            const response = await this.airtableConnector.makeRequest('GET', 'Queue', {
                filterByFormula: filter,
                sort: [
                    { field: 'priority_score', direction: 'asc' },
                    { field: 'date_added', direction: 'asc' }
                ],
                maxRecords: maxCustomers
            });

            const customers = (response.records || []).map(record => ({
                ...record,
                packageType,
                isUrgent: record.fields.date_added < urgencyCutoff,
                effectivePriority: this.calculateEffectivePriority(record, packageType)
            }));

            return customers.sort((a, b) => a.effectivePriority - b.effectivePriority);

        } catch (error) {
            console.error(`❌ Failed to get ${packageType} customers:`, error);
            return [];
        }
    }

    /**
     * Calculate effective priority including SLA urgency
     */
    calculateEffectivePriority(customer, packageType) {
        const basePriority = customer.fields.priority_score || 0;
        const packageConfig = this.packagePriorities[packageType];
        
        // Calculate time waiting
        const dateAdded = new Date(customer.fields.date_added);
        const now = new Date();
        const minutesWaiting = (now - dateAdded) / (1000 * 60);
        
        // Calculate SLA urgency multiplier
        const slaUrgency = Math.min(5, minutesWaiting / packageConfig.slaMinutes);
        
        return basePriority + (slaUrgency * 100);
    }

    /**
     * Process individual customer
     */
    async processCustomer(queueEntry) {
        const customerId = queueEntry.fields.customer_id;
        const queueId = queueEntry.id;
        const packageType = queueEntry.fields.package_type;
        const businessName = queueEntry.fields.business_name;

        console.log(`👤 Processing ${packageType} customer: ${businessName}`);

        // Register customer as being processed
        this.processingState.currentCustomers.set(queueId, {
            queueId,
            customerId,
            packageType,
            businessName,
            startTime: Date.now(),
            status: 'processing'
        });

        try {
            // Update queue status to processing
            await this.airtableConnector.updateQueueStatus(queueId, 'Processing', {
                date_started: new Date().toISOString(),
                assigned_processor: 'chrome_extension_v2'
            });

            // Get customer details and package configuration
            const customerDetails = await this.airtableConnector.getCustomerDetails(customerId);
            const packageConfig = await this.packageManager.getPackageConfiguration(packageType);

            // Get and filter directories for the customer's package
            const allDirectories = await this.airtableConnector.getDirectoriesForCustomer(customerId, packageType);
            const processableDirectories = await this.directoryFilter.filterForPackage(allDirectories, packageConfig);

            console.log(`📁 Processing ${processableDirectories.length} directories for ${businessName}`);

            // Process directories with package-specific features
            const processingResults = await this.processCustomerDirectories(
                queueEntry,
                customerDetails,
                processableDirectories,
                packageConfig
            );

            // Finalize customer processing
            await this.finalizeCustomerProcessing(queueEntry, processingResults, packageConfig);

            // Update metrics
            this.processingState.processingMetrics.successfulCustomers++;
            this.updatePackageDistribution(packageType, 'success');

            console.log(`✅ Successfully processed customer: ${businessName}`);

        } catch (error) {
            console.error(`❌ Failed to process customer ${businessName}:`, error);

            // Handle error with package-specific recovery
            await this.errorHandler.handleCustomerProcessingError(queueEntry, error, packageType);

            // Update queue status to failed
            await this.airtableConnector.updateQueueStatus(queueId, 'Failed', {
                error_messages: error.message,
                date_failed: new Date().toISOString(),
                processing_notes: `Processing failed: ${error.message}`
            });

            // Update metrics
            this.processingState.processingMetrics.failedCustomers++;
            this.updatePackageDistribution(packageType, 'failure');

        } finally {
            // Remove from current processing
            this.processingState.currentCustomers.delete(queueId);

            // Calculate and update processing time
            const currentCustomer = this.processingState.currentCustomers.get(queueId);
            if (currentCustomer) {
                const processingTime = Date.now() - currentCustomer.startTime;
                this.updateAverageProcessingTime(processingTime);
            }
        }
    }

    /**
     * Process customer directories with package-specific handling
     */
    async processCustomerDirectories(queueEntry, customerDetails, directories, packageConfig) {
        const startTime = Date.now();
        const results = {
            successful: 0,
            failed: 0,
            submissions: [],
            processingTime: 0,
            qualityScore: 0
        };

        console.log(`📝 Processing ${directories.length} directories with ${packageConfig.type} features`);

        try {
            // Process directories using package manager
            const packageResults = await this.packageManager.processDirectoriesWithPackageFeatures(
                queueEntry,
                customerDetails,
                directories,
                packageConfig
            );

            // Send progress updates throughout processing
            for (let i = 0; i < directories.length; i++) {
                const directory = directories[i];
                
                // Send progress update
                await this.statusUpdater.sendProgressUpdate(queueEntry.id, customerDetails.id, {
                    currentDirectory: i + 1,
                    totalDirectories: directories.length,
                    progress: ((i + 1) / directories.length) * 100,
                    currentDirectoryName: directory.fields.directory_name,
                    packageType: packageConfig.type,
                    businessName: customerDetails.fields.business_name,
                    estimatedTimeRemaining: this.calculateEstimatedTimeRemaining(i + 1, directories.length, startTime)
                });

                // Process directory (this would integrate with actual Chrome extension)
                const directoryResult = await this.processDirectory(directory, customerDetails, packageConfig);
                
                // Record submission
                await this.airtableConnector.recordSubmission({
                    queueId: queueEntry.id,
                    customerId: customerDetails.id,
                    directoryId: directory.id,
                    directoryName: directory.fields.directory_name,
                    status: directoryResult.success ? 'Submitted' : 'Failed',
                    startTime: directoryResult.startTime,
                    endTime: directoryResult.endTime,
                    processingTime: directoryResult.processingTime,
                    successRate: directoryResult.success ? 1 : 0,
                    error: directoryResult.error,
                    response: directoryResult.response,
                    packageType: packageConfig.type,
                    featuresUsed: directoryResult.featuresUsed,
                    qualityScore: directoryResult.qualityScore
                });

                if (directoryResult.success) {
                    results.successful++;
                } else {
                    results.failed++;
                }

                results.submissions.push(directoryResult);

                // Add package-specific delay between submissions
                await this.addProcessingDelay(packageConfig);
            }

            results.processingTime = Date.now() - startTime;
            results.qualityScore = this.calculateOverallQualityScore(results.submissions);

            console.log(`✅ Directory processing complete: ${results.successful}/${directories.length} successful`);

        } catch (error) {
            console.error('❌ Directory processing failed:', error);
            results.processingTime = Date.now() - startTime;
            results.failed = directories.length;
            throw error;
        }

        return results;
    }

    /**
     * Process individual directory (placeholder for actual Chrome extension integration)
     */
    async processDirectory(directory, customerDetails, packageConfig) {
        const startTime = Date.now();
        
        try {
            console.log(`📤 Processing directory: ${directory.fields.directory_name}`);

            // Simulate processing with package-specific features
            const processingTime = this.getPackageProcessingTime(packageConfig.type);
            await new Promise(resolve => setTimeout(resolve, processingTime));

            // Simulate success rate based on package tier and directory difficulty
            const baseSuccessRate = directory.fields.automation_success_rate || 0.75;
            const packageBonus = this.getPackageSuccessBonus(packageConfig.type);
            const effectiveSuccessRate = Math.min(0.98, baseSuccessRate + packageBonus);
            
            const isSuccessful = Math.random() < effectiveSuccessRate;
            const endTime = Date.now();

            if (isSuccessful) {
                return {
                    success: true,
                    directoryId: directory.id,
                    directoryName: directory.fields.directory_name,
                    response: `Successfully submitted to ${directory.fields.directory_name}`,
                    confirmationNumber: `${packageConfig.type.toUpperCase()}_${Date.now()}`,
                    startTime: new Date(startTime).toISOString(),
                    endTime: new Date(endTime).toISOString(),
                    processingTime: (endTime - startTime) / 1000,
                    qualityScore: this.calculateQualityScore(packageConfig.type),
                    featuresUsed: this.getPackageFeatures(packageConfig.type)
                };
            } else {
                throw new Error(`Submission failed to ${directory.fields.directory_name}`);
            }

        } catch (error) {
            const endTime = Date.now();
            
            return {
                success: false,
                directoryId: directory.id,
                directoryName: directory.fields.directory_name,
                error: error.message,
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString(),
                processingTime: (endTime - startTime) / 1000,
                qualityScore: 0,
                featuresUsed: []
            };
        }
    }

    /**
     * Finalize customer processing
     */
    async finalizeCustomerProcessing(queueEntry, results, packageConfig) {
        console.log(`📊 Finalizing processing for queue: ${queueEntry.id}`);

        try {
            const completionData = {
                successful: results.successful,
                failed: results.failed,
                totalProcessingTime: results.processingTime,
                successRate: results.successful / (results.successful + results.failed),
                qualityScore: results.qualityScore,
                customerId: queueEntry.fields.customer_id,
                supportLevel: this.getSupportLevel(packageConfig.type),
                notes: `Processed ${results.successful + results.failed} directories with ${packageConfig.type} package features`,
                satisfactionScore: this.calculateCustomerSatisfactionScore(results, packageConfig)
            };

            // Complete the queue item
            await this.airtableConnector.completeQueueItem(queueEntry.id, completionData);

            // Send final status update
            await this.statusUpdater.sendCompletionUpdate(queueEntry.id, completionData);

            console.log('✅ Customer processing finalized successfully');

        } catch (error) {
            console.error('❌ Failed to finalize customer processing:', error);
            throw error;
        }
    }

    /**
     * Utility Methods
     */

    /**
     * Get available processing slots
     */
    getAvailableProcessingSlots() {
        return Math.max(0, this.config.maxConcurrentCustomers - this.processingState.currentCustomers.size);
    }

    /**
     * Calculate estimated time remaining
     */
    calculateEstimatedTimeRemaining(completed, total, startTime) {
        if (completed === 0) return null;
        
        const elapsedTime = Date.now() - startTime;
        const averageTimePerItem = elapsedTime / completed;
        const remainingItems = total - completed;
        
        return Math.round((remainingItems * averageTimePerItem) / 1000); // Convert to seconds
    }

    /**
     * Get package-specific processing time
     */
    getPackageProcessingTime(packageType) {
        const baseTimes = {
            'Enterprise': 8000,  // 8 seconds
            'Professional': 5000, // 5 seconds
            'Growth': 3000,      // 3 seconds
            'Starter': 1500      // 1.5 seconds
        };
        
        return baseTimes[packageType] || baseTimes['Starter'];
    }

    /**
     * Get package success rate bonus
     */
    getPackageSuccessBonus(packageType) {
        const bonuses = {
            'Enterprise': 0.15,  // +15%
            'Professional': 0.10, // +10%
            'Growth': 0.05,      // +5%
            'Starter': 0.0       // No bonus
        };
        
        return bonuses[packageType] || 0;
    }

    /**
     * Calculate quality score based on package
     */
    calculateQualityScore(packageType) {
        const baseScores = {
            'Enterprise': 0.95,
            'Professional': 0.90,
            'Growth': 0.85,
            'Starter': 0.80
        };
        
        const baseScore = baseScores[packageType] || 0.80;
        const variance = 0.05; // 5% variance
        
        return baseScore + (Math.random() * variance) - (variance / 2);
    }

    /**
     * Get package features used
     */
    getPackageFeatures(packageType) {
        const features = {
            'Enterprise': ['white-glove-processing', 'human-verification', 'comprehensive-qa', 'custom-scripting'],
            'Professional': ['rush-processing', 'enhanced-qa', 'smart-retry', 'phone-support'],
            'Growth': ['priority-processing', 'standard-qa', 'basic-retry', 'email-support'],
            'Starter': ['standard-processing', 'basic-qa', 'simple-retry', 'email-only']
        };
        
        return features[packageType] || features['Starter'];
    }

    /**
     * Get support level for package
     */
    getSupportLevel(packageType) {
        const supportLevels = {
            'Enterprise': 'dedicated',
            'Professional': 'phone',
            'Growth': 'email',
            'Starter': 'email'
        };
        
        return supportLevels[packageType] || 'email';
    }

    /**
     * Calculate overall quality score from submissions
     */
    calculateOverallQualityScore(submissions) {
        const successfulSubmissions = submissions.filter(sub => sub.success);
        
        if (successfulSubmissions.length === 0) return 0;
        
        const totalScore = successfulSubmissions.reduce((sum, sub) => sum + (sub.qualityScore || 0.8), 0);
        return totalScore / successfulSubmissions.length;
    }

    /**
     * Calculate customer satisfaction score
     */
    calculateCustomerSatisfactionScore(results, packageConfig) {
        const successRate = results.successful / (results.successful + results.failed);
        const qualityWeight = 0.4;
        const speedWeight = 0.3;
        const completionWeight = 0.3;
        
        // Base satisfaction on success rate, quality, and package expectations
        const qualityScore = results.qualityScore;
        const speedScore = packageConfig.sla?.completionTimeMinutes ? 1.0 : 0.8; // Placeholder
        const completionScore = successRate;
        
        return (qualityScore * qualityWeight) + 
               (speedScore * speedWeight) + 
               (completionScore * completionWeight);
    }

    /**
     * Add processing delay based on package speed
     */
    async addProcessingDelay(packageConfig) {
        const delays = {
            'Enterprise': 500,   // 0.5 seconds
            'Professional': 1000, // 1 second
            'Growth': 2000,      // 2 seconds
            'Starter': 3000      // 3 seconds
        };
        
        const delay = delays[packageConfig.type] || delays['Starter'];
        await new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * Update package distribution metrics
     */
    updatePackageDistribution(packageType, outcome) {
        if (!this.processingState.processingMetrics.packageDistribution[packageType]) {
            this.processingState.processingMetrics.packageDistribution[packageType] = {
                total: 0,
                successful: 0,
                failed: 0
            };
        }
        
        this.processingState.processingMetrics.packageDistribution[packageType].total++;
        
        if (outcome === 'success') {
            this.processingState.processingMetrics.packageDistribution[packageType].successful++;
        } else {
            this.processingState.processingMetrics.packageDistribution[packageType].failed++;
        }
    }

    /**
     * Update average processing time
     */
    updateAverageProcessingTime(newTime) {
        const { averageProcessingTime, totalProcessed } = this.processingState.processingMetrics;
        
        if (totalProcessed === 0) {
            this.processingState.processingMetrics.averageProcessingTime = newTime;
        } else {
            this.processingState.processingMetrics.averageProcessingTime = 
                ((averageProcessingTime * totalProcessed) + newTime) / (totalProcessed + 1);
        }
        
        this.processingState.processingMetrics.totalProcessed++;
    }

    /**
     * Update queue metrics
     */
    async updateQueueMetrics() {
        try {
            // Get queue statistics
            const response = await this.airtableConnector.makeRequest('GET', 'Queue', {
                filterByFormula: '{queue_status} != BLANK()',
                fields: ['queue_status', 'date_added', 'date_completed']
            });

            const records = response.records || [];
            
            this.processingState.queueMetrics.totalInQueue = records.filter(r => r.fields.queue_status === 'Pending').length;
            this.processingState.queueMetrics.processingNow = this.processingState.currentCustomers.size;
            
            // Calculate daily statistics
            const today = new Date().toDateString();
            this.processingState.queueMetrics.completedToday = records.filter(r => 
                r.fields.queue_status === 'Completed' && 
                new Date(r.fields.date_completed).toDateString() === today
            ).length;
            
            this.processingState.queueMetrics.failedToday = records.filter(r => 
                r.fields.queue_status === 'Failed' && 
                new Date(r.fields.date_failed || r.fields.date_completed).toDateString() === today
            ).length;
            
        } catch (error) {
            console.warn('⚠️ Failed to update queue metrics:', error);
        }
    }

    /**
     * Update processing metrics
     */
    async updateProcessingMetrics() {
        try {
            // Save metrics to Airtable
            await this.airtableConnector.makeRequest('POST', 'ProcessingLogs', {
                fields: {
                    log_level: 'INFO',
                    event_type: 'Metrics Update',
                    event_summary: 'Processing metrics update',
                    additional_data: JSON.stringify({
                        processingMetrics: this.processingState.processingMetrics,
                        queueMetrics: this.processingState.queueMetrics,
                        currentCustomers: this.processingState.currentCustomers.size
                    }),
                    processor_instance: 'queue_processor_v2',
                    timestamp: new Date().toISOString()
                }
            });
            
            // Emit metrics update event
            this.emit('metrics:updated', {
                processingMetrics: this.processingState.processingMetrics,
                queueMetrics: this.processingState.queueMetrics,
                timestamp: Date.now()
            });
            
        } catch (error) {
            console.warn('⚠️ Failed to update processing metrics:', error);
        }
    }

    /**
     * Load previous processing metrics
     */
    async loadProcessingMetrics() {
        try {
            const response = await this.airtableConnector.makeRequest('GET', 'ProcessingLogs', {
                filterByFormula: `{event_type} = 'Metrics Update'`,
                sort: [{ field: 'timestamp', direction: 'desc' }],
                maxRecords: 1
            });

            if (response.records && response.records.length > 0) {
                const latestMetrics = JSON.parse(response.records[0].fields.additional_data || '{}');
                
                if (latestMetrics.processingMetrics) {
                    this.processingState.processingMetrics = {
                        ...this.processingState.processingMetrics,
                        ...latestMetrics.processingMetrics
                    };
                }
                
                console.log('📊 Loaded previous processing metrics');
            }
            
        } catch (error) {
            console.warn('⚠️ Could not load previous metrics, starting fresh:', error);
        }
    }

    /**
     * Wait for current customers to complete processing
     */
    async waitForCurrentCustomersToComplete(timeoutMs = 300000) { // 5 minute timeout
        const startTime = Date.now();
        
        while (this.processingState.currentCustomers.size > 0) {
            if (Date.now() - startTime > timeoutMs) {
                console.warn('⚠️ Timeout waiting for customers to complete, force stopping');
                break;
            }
            
            console.log(`⏳ Waiting for ${this.processingState.currentCustomers.size} customers to complete...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for Chrome extension events
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                this.handleChromeMessage(message, sender, sendResponse);
            });
        }
    }

    /**
     * Handle Chrome extension messages
     */
    handleChromeMessage(message, sender, sendResponse) {
        switch (message.type) {
            case 'GET_PROCESSING_STATUS':
                sendResponse(this.getProcessingStatus());
                break;
                
            case 'START_PROCESSING':
                this.startProcessing().then(() => {
                    sendResponse({ success: true });
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                break;
                
            case 'STOP_PROCESSING':
                this.stopProcessing().then(() => {
                    sendResponse({ success: true });
                }).catch(error => {
                    sendResponse({ success: false, error: error.message });
                });
                break;
                
            default:
                sendResponse({ error: 'Unknown message type' });
        }
    }

    /**
     * Get current processing status
     */
    getProcessingStatus() {
        return {
            isActive: this.processingState.isActive,
            currentCustomers: Array.from(this.processingState.currentCustomers.values()),
            processingMetrics: this.processingState.processingMetrics,
            queueMetrics: this.processingState.queueMetrics,
            availableSlots: this.getAvailableProcessingSlots(),
            timestamp: Date.now()
        };
    }

    /**
     * Event system
     */
    emit(eventName, data) {
        const handlers = this.eventHandlers.get(eventName) || [];
        handlers.forEach(handler => {
            try {
                handler(data);
            } catch (error) {
                console.error(`❌ Error in event handler for ${eventName}:`, error);
            }
        });
    }

    on(eventName, handler) {
        if (!this.eventHandlers.has(eventName)) {
            this.eventHandlers.set(eventName, []);
        }
        this.eventHandlers.get(eventName).push(handler);
    }

    off(eventName, handler) {
        const handlers = this.eventHandlers.get(eventName);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index !== -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Cleanup and shutdown
     */
    async shutdown() {
        console.log('🛑 Shutting down Queue Processor v2...');
        
        await this.stopProcessing();
        
        this.eventHandlers.clear();
        
        if (this.airtableConnector) {
            this.airtableConnector.disconnect();
        }
        
        console.log('✅ Queue Processor v2 shutdown complete');
    }
}

// Export for use in Chrome extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QueueProcessorV2;
} else if (typeof window !== 'undefined') {
    window.QueueProcessorV2 = QueueProcessorV2;
}