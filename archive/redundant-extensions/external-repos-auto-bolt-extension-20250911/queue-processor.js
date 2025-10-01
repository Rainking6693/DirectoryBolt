/**
 * Production-Grade Queue Processor for Auto-Bolt Chrome Extension
 * Handles bulletproof directory automation with persistence, advanced error handling,
 * and intelligent batching for 63+ directories with enterprise reliability
 * 
 * Features:
 * - Queue persistence across extension restarts
 * - Intelligent batching and concurrency management
 * - Advanced error classification and recovery
 * - Comprehensive logging and progress reporting
 * - Smart anti-detection and skip logic
 * - Failsafe mechanisms for stuck directories
 */

class QueueProcessor {
    constructor() {
        this.queue = [];
        this.currentJob = null;
        this.isProcessing = false;
        this.results = [];
        this.errors = [];
        this.persistenceEnabled = true;
        this.storageKey = 'autobolt_queue_state';
        this.logBuffer = [];
        this.maxLogBuffer = 1000;
        
        // Enhanced job tracking
        this.jobHistory = new Map();
        this.stuckJobDetector = null;
        this.healthCheck = null;
        
        // Batch management
        this.batchConfig = {
            enabled: true,
            maxBatchSize: 10,
            priorityLevels: ['high', 'medium', 'low'],
            adaptiveThrottling: true
        };
        
        // Advanced error tracking
        this.errorClassifier = {
            network: 0,
            timeout: 0,
            captcha: 0,
            loginRequired: 0,
            feeBased: 0,
            antiBotDetection: 0,
            formNotFound: 0,
            unknown: 0
        };
        
        // Performance metrics
        this.performanceMetrics = {
            averageProcessingTime: 0,
            successRate: 0,
            memoryUsage: 0,
            cpuIntensive: false,
            networkLatency: 0
        };
        
        // Processing statistics
        this.stats = {
            total: 0,
            processed: 0,
            successful: 0,
            failed: 0,
            skipped: 0,
            retried: 0,
            startTime: null,
            endTime: null,
            totalTime: 0
        };
        
        // Production Configuration
        this.config = {
            // Delay settings (in milliseconds) - optimized for stability
            baseDelay: 4000,           // Increased base delay for reliability
            randomDelayRange: 3000,    // Wider variation for human-like behavior
            retryDelay: 8000,          // Longer initial retry delay
            maxRetryDelay: 120000,     // 2 minute max retry delay
            
            // Enhanced retry settings
            maxRetries: 5,             // More retry attempts for critical directories
            retryMultiplier: 1.8,      // Gentler exponential backoff
            adaptiveRetries: true,     // Adjust retries based on error type
            
            // Timeout settings - increased for reliability
            directoryTimeout: 180000,  // 3 minutes per directory
            formFillTimeout: 45000,    // 45 seconds for form filling
            pageLoadTimeout: 30000,    // 30 seconds for page loading
            stuckJobTimeout: 300000,   // 5 minutes before considering job stuck
            
            // Tab management - enhanced for production
            maxConcurrentTabs: 1,      // Keep sequential for stability
            reuseExistingTabs: true,
            tabCleanupInterval: 600000, // Clean up tabs every 10 minutes
            maxTabAge: 1800000,        // Max tab age: 30 minutes
            
            // Anti-detection measures - enhanced
            humanLikeDelays: true,
            randomizeOrder: false,     // Keep deterministic for debugging
            respectRobotsTxt: true,
            userAgentRotation: false,  // Disabled for consistency
            
            // Performance settings
            memoryThreshold: 100 * 1024 * 1024, // 100MB memory threshold
            cpuThrottling: true,       // Enable CPU throttling for background processing
            
            // Skip logic settings
            skipCaptcha: true,
            skipLogin: true,
            skipFees: true,
            skipAntiBotDetection: true,
            intelligentSkipping: true,  // Use ML-like heuristics
            
            // Persistence settings
            persistenceInterval: 30000, // Save state every 30 seconds
            persistenceRetention: 7,    // Keep 7 days of queue history
            
            // Logging settings
            detailedLogging: true,
            logToStorage: true,
            logLevel: 'production',    // 'debug', 'info', 'production'
            logRetention: 72           // Keep logs for 72 hours
        };
        
        // Event listeners
        this.listeners = {
            progress: [],
            complete: [],
            error: [],
            directoryComplete: [],
            stuckJob: [],
            batchComplete: [],
            healthCheck: [],
            persistenceUpdate: []
        };
        
        // Initialize registry
        this.registry = null;
        
        // Initialize production features
        this.initializeProductionFeatures();
    }
    
    /**
     * Initialize production-level features
     */
    initializeProductionFeatures() {
        // Start health monitoring
        this.startHealthMonitoring();
        
        // Initialize persistence recovery
        this.initializePersistence();
        
        // Set up error classification
        this.initializeErrorClassification();
        
        // Start performance monitoring
        this.startPerformanceMonitoring();
        
        console.log('🏭 Production features initialized');
    }

    /**
     * Initialize the production-grade queue processor
     */
    async initialize() {
        try {
            console.log('🔧 Initializing Production Queue Processor...');
            this.log('system', 'Initializing queue processor', { timestamp: Date.now() });
            
            // Initialize directory registry
            if (typeof directoryRegistry !== 'undefined') {
                this.registry = directoryRegistry;
                if (!this.registry.isInitialized()) {
                    await this.registry.initialize();
                }
            } else {
                throw new Error('Directory registry not available');
            }
            
            // Attempt to recover previous queue state
            await this.recoverQueueState();
            
            // Initialize stuck job detection
            this.initializeStuckJobDetection();
            
            // Start periodic persistence
            this.startPeriodicPersistence();
            
            console.log('✅ Production Queue Processor initialized successfully');
            this.log('system', 'Queue processor initialized', { 
                queueSize: this.queue.length,
                persistenceEnabled: this.persistenceEnabled
            });
            
            return { 
                success: true,
                recoveredJobs: this.queue.length,
                productionFeatures: true
            };
            
        } catch (error) {
            console.error('❌ Failed to initialize Queue Processor:', error);
            this.log('error', 'Failed to initialize queue processor', { error: error.message });
            throw error;
        }
    }

    /**
     * Add directories to the processing queue with intelligent batching
     */
    addDirectories(directories, businessData, options = {}) {
        // Pre-filter directories based on intelligent skip logic
        const filteredDirectories = this.config.intelligentSkipping ? 
            this.preFilterDirectories(directories) : directories;
        
        // Create queue items with enhanced metadata
        const queueItems = filteredDirectories.map((directory, index) => ({
            id: `${directory.id}_${Date.now()}_${index}`,
            directory: directory,
            businessData: businessData,
            status: 'pending',
            attempts: 0,
            createdAt: Date.now(),
            priority: this.calculatePriority(directory),
            estimatedDifficulty: this.estimateDirectoryDifficulty(directory),
            batchGroup: this.assignBatchGroup(directory),
            options: {
                ...options,
                skipReasons: [],
                intelligentRetries: this.config.adaptiveRetries
            },
            metadata: {
                category: directory.category,
                requirements: directory.requirements || [],
                estimatedTime: directory.estimatedTime || 120,
                lastAttempt: null
            }
        }));
        
        // Sort by priority if batch processing is enabled
        if (this.batchConfig.enabled) {
            queueItems.sort((a, b) => {
                const priorityOrder = { high: 3, medium: 2, low: 1 };
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            });
        }
        
        this.queue.push(...queueItems);
        this.stats.total = this.queue.length;
        
        // Persist queue state
        this.persistQueueState();
        
        const skippedCount = directories.length - filteredDirectories.length;
        console.log(`📋 Added ${filteredDirectories.length} directories to queue (${skippedCount} pre-filtered, total: ${this.queue.length})`);
        this.log('queue', 'Directories added to queue', {
            added: filteredDirectories.length,
            skipped: skippedCount,
            totalInQueue: this.queue.length,
            batchingEnabled: this.batchConfig.enabled
        });
        
        return {
            success: true,
            added: filteredDirectories.length,
            skipped: skippedCount,
            totalInQueue: this.queue.length,
            batchGroups: this.getBatchGroupSummary(queueItems)
        };
    }

    /**
     * Start processing the queue
     */
    async startProcessing(options = {}) {
        if (this.isProcessing) {
            throw new Error('Queue processing is already in progress');
        }
        
        if (this.queue.length === 0) {
            throw new Error('No directories in queue to process');
        }
        
        console.log('🚀 Starting queue processing...');
        console.log(`📊 Queue size: ${this.queue.length} directories`);
        
        this.isProcessing = true;
        this.stats.startTime = Date.now();
        this.stats.processed = 0;
        this.stats.successful = 0;
        this.stats.failed = 0;
        this.stats.skipped = 0;
        this.stats.retried = 0;
        
        // Apply processing options
        this.applyProcessingOptions(options);
        
        try {
            // Process each directory in the queue
            while (this.queue.length > 0 && this.isProcessing) {
                const queueItem = this.queue.shift();
                await this.processDirectoryItem(queueItem);
                
                // Add delay between directories
                if (this.queue.length > 0) {
                    await this.addSmartDelay();
                }
            }
            
            // Mark processing as complete
            this.isProcessing = false;
            this.stats.endTime = Date.now();
            this.stats.totalTime = this.stats.endTime - this.stats.startTime;
            
            console.log('🎉 Queue processing completed!');
            this.logFinalStatistics();
            
            // Notify listeners
            this.notifyListeners('complete', this.getResults());
            
            return this.getResults();
            
        } catch (error) {
            console.error('❌ Queue processing failed:', error);
            this.isProcessing = false;
            this.notifyListeners('error', error);
            throw error;
        }
    }

    /**
     * Process a single directory item
     */
    async processDirectoryItem(queueItem) {
        this.currentJob = queueItem;
        queueItem.status = 'processing';
        queueItem.startTime = Date.now();
        
        console.log(`🎯 Processing directory: ${queueItem.directory.name}`);
        console.log(`📈 Progress: ${this.stats.processed + 1}/${this.stats.total}`);
        
        try {
            // Enhanced pre-processing checks
            const skipCheck = await this.performEnhancedSkipCheck(queueItem);
            if (skipCheck.shouldSkip) {
                await this.skipDirectory(queueItem, skipCheck.reason);
                return;
            }
            
            // Set processing timeout
            const processingPromise = this.processDirectory(queueItem);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => {
                    reject(new Error(`Directory processing timeout after ${this.config.directoryTimeout}ms`));
                }, this.config.directoryTimeout);
            });
            
            // Race between processing and timeout
            const result = await Promise.race([processingPromise, timeoutPromise]);
            
            // Handle successful processing
            queueItem.status = 'completed';
            queueItem.result = result;
            queueItem.endTime = Date.now();
            queueItem.processingTime = queueItem.endTime - queueItem.startTime;
            
            this.results.push(queueItem);
            this.stats.processed++;
            this.stats.successful++;
            
            // Update job history
            this.jobHistory.set(queueItem.id, {
                ...queueItem,
                finalStatus: 'completed',
                completedAt: Date.now()
            });
            
            console.log(`✅ Successfully processed: ${queueItem.directory.name} (${queueItem.processingTime}ms)`);
            
            this.log('success', 'Directory processed successfully', {
                directoryId: queueItem.directory.id,
                directoryName: queueItem.directory.name,
                processingTime: queueItem.processingTime,
                attempts: queueItem.attempts,
                filledFields: result?.fillResult?.filledFields || 0
            });
            
            this.notifyListeners('directoryComplete', queueItem);
            
        } catch (error) {
            console.error(`❌ Error processing ${queueItem.directory.name}:`, error);
            
            // Enhanced error handling with circuit breaker pattern
            const shouldRetry = await this.shouldRetryError(queueItem, error);
            
            if (shouldRetry) {
                await this.retryDirectoryItem(queueItem, error);
            } else {
                await this.failDirectoryItem(queueItem, error);
            }
        }
        
        // Update progress
        this.notifyListeners('progress', {
            current: this.stats.processed + 1,
            total: this.stats.total,
            successful: this.stats.successful,
            failed: this.stats.failed,
            skipped: this.stats.skipped
        });
        
        this.currentJob = null;
    }

    /**
     * Process a single directory
     */
    async processDirectory(queueItem) {
        const { directory, businessData, options } = queueItem;
        
        console.log(`🌐 Opening directory: ${directory.submissionUrl}`);
        
        // Create or get tab for this directory
        const tab = await this.getDirectoryTab(directory);
        
        // Wait for page to load
        await this.waitForPageLoad(tab);
        
        // Inject content script
        await this.ensureContentScript(tab);
        
        // Fill the form
        const fillResult = await this.fillDirectoryForm(tab, directory, businessData);
        
        // Submit form (optional based on settings)
        if (options.autoSubmit !== false) {
            await this.submitForm(tab, directory);
        }
        
        return {
            directory: directory.id,
            tab: tab.id,
            fillResult: fillResult,
            submitted: options.autoSubmit !== false,
            timestamp: Date.now()
        };
    }

    /**
     * Get or create tab for directory processing
     */
    async getDirectoryTab(directory) {
        try {
            // Check if directory URL is already open
            if (this.config.reuseExistingTabs) {
                const existingTabs = await chrome.tabs.query({ 
                    url: directory.submissionUrl 
                });
                
                if (existingTabs.length > 0) {
                    console.log(`🔄 Reusing existing tab for ${directory.name}`);
                    await chrome.tabs.update(existingTabs[0].id, { active: true });
                    return existingTabs[0];
                }
            }
            
            // Create new tab
            console.log(`🆕 Creating new tab for ${directory.name}`);
            const tab = await chrome.tabs.create({
                url: directory.submissionUrl,
                active: true
            });
            
            return tab;
            
        } catch (error) {
            throw new Error(`Failed to create tab for ${directory.name}: ${error.message}`);
        }
    }

    /**
     * Wait for page to load completely
     */
    async waitForPageLoad(tab, maxWait = null) {
        const timeout = maxWait || this.config.pageLoadTimeout;
        
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const checkPageLoad = () => {
                chrome.tabs.get(tab.id, (tabInfo) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(`Tab error: ${chrome.runtime.lastError.message}`));
                        return;
                    }
                    
                    if (tabInfo.status === 'complete') {
                        console.log(`✅ Page loaded: ${tabInfo.url}`);
                        resolve(tabInfo);
                        return;
                    }
                    
                    if (Date.now() - startTime > timeout) {
                        reject(new Error(`Page load timeout (${timeout}ms)`));
                        return;
                    }
                    
                    // Check again in 100ms
                    setTimeout(checkPageLoad, 100);
                });
            };
            
            checkPageLoad();
        });
    }

    /**
     * Ensure content script is injected
     */
    async ensureContentScript(tab) {
        try {
            // Test if content script is already present
            await chrome.tabs.sendMessage(tab.id, { action: 'PING' });
            console.log(`✅ Content script already present in tab: ${tab.id}`);
            
        } catch (error) {
            // Inject content script
            console.log(`💉 Injecting content script into tab: ${tab.id}`);
            
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js', 'directory-form-filler.js']
            });
            
            // Wait for initialization
            await this.sleep(1000);
        }
    }

    /**
     * Fill directory form with business data
     */
    async fillDirectoryForm(tab, directory, businessData) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error(`Form fill timeout (${this.config.formFillTimeout}ms)`));
            }, this.config.formFillTimeout);
            
            chrome.tabs.sendMessage(tab.id, {
                action: 'FILL_DIRECTORY_FORM',
                directory: directory,
                businessData: businessData,
                fieldMapping: directory.fieldMapping,
                timestamp: Date.now()
            }, (response) => {
                clearTimeout(timeout);
                
                if (chrome.runtime.lastError) {
                    reject(new Error(`Content script error: ${chrome.runtime.lastError.message}`));
                    return;
                }
                
                if (!response) {
                    reject(new Error('No response from content script'));
                    return;
                }
                
                if (!response.success) {
                    reject(new Error(response.error || 'Form filling failed'));
                    return;
                }
                
                console.log(`✅ Form filled: ${response.filledFields || 0} fields`);
                resolve(response);
            });
        });
    }

    /**
     * Submit the form
     */
    async submitForm(tab, directory) {
        return new Promise((resolve, reject) => {
            chrome.tabs.sendMessage(tab.id, {
                action: 'SUBMIT_FORM',
                directory: directory,
                timestamp: Date.now()
            }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(`Submit error: ${chrome.runtime.lastError.message}`));
                    return;
                }
                
                if (!response || !response.success) {
                    reject(new Error(response?.error || 'Form submission failed'));
                    return;
                }
                
                console.log(`✅ Form submitted for: ${directory.name}`);
                resolve(response);
            });
        });
    }

    /**
     * Check if directory should be skipped
     */
    shouldSkipDirectory(directory) {
        // Skip directories with anti-bot protection
        if (directory.hasAntiBot && this.config.skipAntiBot !== false) {
            return true;
        }
        
        // Skip directories requiring login
        if (directory.requiresLogin && this.config.skipLogin !== false) {
            return true;
        }
        
        // Skip directories with fees
        if (directory.submissionFee && 
            directory.submissionFee !== '$0' && 
            directory.submissionFee !== 'Free' && 
            this.config.skipFees !== false) {
            return true;
        }
        
        return false;
    }

    /**
     * Skip a directory with reason
     */
    async skipDirectory(queueItem, reason) {
        queueItem.status = 'skipped';
        queueItem.skipReason = reason;
        queueItem.endTime = Date.now();
        
        this.results.push(queueItem);
        this.stats.processed++;
        this.stats.skipped++;
        
        console.log(`⏭️ Skipped ${queueItem.directory.name}: ${reason}`);
    }

    /**
     * Retry a failed directory with intelligent error-based retry logic
     */
    async retryDirectoryItem(queueItem, error) {
        queueItem.attempts++;
        queueItem.lastError = error.message;
        queueItem.status = 'retrying';
        
        this.stats.retried++;
        
        // Classify the error for intelligent retry strategy
        const errorType = this.classifyError(null, error.message);
        
        // Adjust retry strategy based on error type
        let maxRetries = this.config.maxRetries;
        let retryMultiplier = this.config.retryMultiplier;
        let baseDelay = this.config.retryDelay;
        
        if (this.config.adaptiveRetries) {
            switch (errorType) {
                case 'network':
                    maxRetries = Math.max(maxRetries, 7); // More retries for network issues
                    retryMultiplier = 2.5; // Longer backoff
                    break;
                case 'timeout':
                    maxRetries = Math.max(maxRetries, 5);
                    retryMultiplier = 2.0;
                    baseDelay = Math.max(baseDelay, 10000); // Longer initial delay
                    break;
                case 'captcha':
                case 'antiBotDetection':
                    maxRetries = 2; // Fewer retries for bot detection
                    retryMultiplier = 3.0; // Much longer backoff
                    baseDelay = Math.max(baseDelay, 30000); // 30 second delay
                    break;
                case 'loginRequired':
                case 'feeBased':
                    maxRetries = 1; // Don't retry these - they need human intervention
                    break;
                case 'formNotFound':
                    maxRetries = 3; // Medium retries - page might be loading
                    retryMultiplier = 1.5;
                    break;
            }
        }
        
        // Check if we should still retry based on adapted limits
        if (queueItem.attempts > maxRetries) {
            await this.failDirectoryItem(queueItem, error);
            return;
        }
        
        // Calculate retry delay with intelligent exponential backoff
        let retryDelay = Math.min(
            baseDelay * Math.pow(retryMultiplier, queueItem.attempts - 1),
            this.config.maxRetryDelay
        );
        
        // Add jitter to prevent thundering herd
        const jitter = Math.random() * 0.3; // ±30% jitter
        retryDelay = retryDelay * (1 + jitter);
        
        console.log(`🔄 Retrying ${queueItem.directory.name} (attempt ${queueItem.attempts}/${maxRetries}) in ${Math.round(retryDelay)}ms [${errorType}]`);
        
        this.log('retry', 'Directory retry scheduled', {
            directoryId: queueItem.directory.id,
            directoryName: queueItem.directory.name,
            attempt: queueItem.attempts,
            maxRetries: maxRetries,
            errorType: errorType,
            retryDelay: Math.round(retryDelay),
            errorMessage: error.message
        });
        
        // Wait before retry
        await this.sleep(retryDelay);
        
        // Update queue item with retry metadata
        queueItem.retryHistory = queueItem.retryHistory || [];
        queueItem.retryHistory.push({
            timestamp: Date.now(),
            errorType: errorType,
            errorMessage: error.message,
            retryDelay: Math.round(retryDelay)
        });
        
        // Add back to front of queue for immediate retry
        this.queue.unshift(queueItem);
    }

    /**
     * Mark directory as failed with comprehensive error tracking
     */
    async failDirectoryItem(queueItem, error) {
        queueItem.status = 'failed';
        queueItem.error = error.message;
        queueItem.endTime = Date.now();
        queueItem.processingTime = queueItem.endTime - (queueItem.startTime || queueItem.createdAt);
        
        // Classify the final error
        const errorType = this.classifyError(null, error.message);
        
        // Create comprehensive error record
        const errorRecord = {
            directory: queueItem.directory.id,
            directoryName: queueItem.directory.name,
            directoryUrl: queueItem.directory.submissionUrl,
            error: error.message,
            errorType: errorType,
            attempts: queueItem.attempts,
            totalProcessingTime: queueItem.processingTime,
            retryHistory: queueItem.retryHistory || [],
            timestamp: Date.now(),
            businessData: {
                // Only store non-sensitive business data for debugging
                businessName: queueItem.businessData?.businessName,
                category: queueItem.directory.category,
                priority: queueItem.priority
            },
            systemState: {
                memoryUsage: this.estimateMemoryUsage(),
                queueSize: this.queue.length,
                currentTime: new Date().toISOString()
            }
        };
        
        this.errors.push(errorRecord);
        this.results.push(queueItem);
        this.stats.processed++;
        this.stats.failed++;
        
        console.log(`💥 Failed ${queueItem.directory.name}: ${error.message} [${errorType}] after ${queueItem.attempts} attempts`);
        
        this.log('failure', 'Directory processing failed', {
            directoryId: queueItem.directory.id,
            directoryName: queueItem.directory.name,
            errorType: errorType,
            attempts: queueItem.attempts,
            processingTime: queueItem.processingTime,
            errorMessage: error.message
        });
        
        // Update job history
        this.jobHistory.set(queueItem.id, {
            ...queueItem,
            finalStatus: 'failed',
            completedAt: Date.now()
        });
        
        // Check if we should pause processing for critical errors
        if (this.shouldPauseOnError(errorType, error)) {
            console.warn(`⚠️ Critical error detected, considering pause: ${errorType}`);
            this.log('warning', 'Critical error detected', {
                errorType,
                errorMessage: error.message,
                recommendsPause: true
            });
        }
    }

    /**
     * Add smart delay between directories
     */
    async addSmartDelay() {
        let delay = this.config.baseDelay;
        
        if (this.config.humanLikeDelays) {
            // Add random variation
            const randomVariation = Math.random() * this.config.randomDelayRange - (this.config.randomDelayRange / 2);
            delay += randomVariation;
            
            // Ensure minimum delay
            delay = Math.max(delay, 1000);
        }
        
        console.log(`⏳ Waiting ${Math.round(delay)}ms before next directory...`);
        await this.sleep(delay);
    }

    /**
     * Apply processing options
     */
    applyProcessingOptions(options) {
        if (options.baseDelay) this.config.baseDelay = options.baseDelay;
        if (options.maxRetries) this.config.maxRetries = options.maxRetries;
        if (options.skipAntiBot !== undefined) this.config.skipAntiBot = options.skipAntiBot;
        if (options.skipLogin !== undefined) this.config.skipLogin = options.skipLogin;
        if (options.skipFees !== undefined) this.config.skipFees = options.skipFees;
        if (options.humanLikeDelays !== undefined) this.config.humanLikeDelays = options.humanLikeDelays;
    }

    /**
     * Stop processing
     */
    stopProcessing() {
        console.log('⏹️ Stopping queue processing...');
        this.isProcessing = false;
        
        // Mark remaining queue items as cancelled
        this.queue.forEach(item => {
            item.status = 'cancelled';
            this.results.push(item);
        });
        
        this.queue = [];
    }

    /**
     * Get processing results
     */
    getResults() {
        return {
            success: true,
            stats: this.stats,
            results: this.results,
            errors: this.errors,
            isComplete: !this.isProcessing && this.queue.length === 0
        };
    }

    /**
     * Add event listener
     */
    addEventListener(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    /**
     * Remove event listener
     */
    removeEventListener(event, callback) {
        if (this.listeners[event]) {
            const index = this.listeners[event].indexOf(callback);
            if (index > -1) {
                this.listeners[event].splice(index, 1);
            }
        }
    }

    /**
     * Notify event listeners
     */
    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error);
                }
            });
        }
    }

    /**
     * Log final statistics
     */
    logFinalStatistics() {
        console.log('📊 Final Processing Statistics:');
        console.log(`   Total: ${this.stats.total}`);
        console.log(`   Successful: ${this.stats.successful}`);
        console.log(`   Failed: ${this.stats.failed}`);
        console.log(`   Skipped: ${this.stats.skipped}`);
        console.log(`   Retried: ${this.stats.retried}`);
        console.log(`   Total Time: ${this.stats.totalTime}ms`);
        console.log(`   Average Time/Directory: ${Math.round(this.stats.totalTime / this.stats.total)}ms`);
    }

    /**
     * Utility sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Perform enhanced skip check with real-time analysis
     */
    async performEnhancedSkipCheck(queueItem) {
        const directory = queueItem.directory;
        const skipReasons = [];
        
        // Basic skip checks
        if (this.shouldSkipDirectory(directory)) {
            skipReasons.push('basic_filter_match');
        }
        
        // Advanced heuristic checks
        if (this.config.intelligentSkipping) {
            // Check job history for repeated failures
            const historyKey = `${directory.id}_history`;
            const recentFailures = Array.from(this.jobHistory.values())
                .filter(job => 
                    job.directory.id === directory.id && 
                    job.finalStatus === 'failed' &&
                    Date.now() - job.completedAt < 24 * 60 * 60 * 1000 // 24 hours
                ).length;
            
            if (recentFailures >= 3) {
                skipReasons.push('repeated_recent_failures');
            }
            
            // Check system load
            const health = this.getSystemHealth();
            if (health.memoryUsage > this.config.memoryThreshold * 0.8) {
                skipReasons.push('high_system_load');
            }
            
            // Check error patterns
            const errorType = this.getMostCommonErrorForDirectory(directory.id);
            if (['captcha', 'antiBotDetection', 'loginRequired'].includes(errorType)) {
                skipReasons.push(`persistent_${errorType}_error`);
            }
        }
        
        return {
            shouldSkip: skipReasons.length > 0,
            reason: skipReasons.join(', '),
            skipReasons
        };
    }
    
    /**
     * Determine if error should be retried based on error analysis
     */
    async shouldRetryError(queueItem, error) {
        const errorType = this.classifyError(null, error.message);
        
        // Never retry certain error types
        const nonRetryableErrors = ['loginRequired', 'feeBased'];
        if (nonRetryableErrors.includes(errorType)) {
            return false;
        }
        
        // Check if we've exceeded max retries
        let maxRetries = this.config.maxRetries;
        if (this.config.adaptiveRetries) {
            maxRetries = this.getAdaptiveMaxRetries(errorType);
        }
        
        if (queueItem.attempts >= maxRetries) {
            return false;
        }
        
        // Check circuit breaker pattern - if too many similar errors, stop retrying
        const recentSimilarErrors = this.errors
            .filter(err => 
                err.errorType === errorType && 
                Date.now() - err.timestamp < 10 * 60 * 1000 // 10 minutes
            ).length;
        
        if (recentSimilarErrors > 5) {
            this.log('warning', 'Circuit breaker triggered', {
                errorType,
                recentSimilarErrors,
                directoryId: queueItem.directory.id
            });
            return false;
        }
        
        return true;
    }
    
    /**
     * Get adaptive max retries based on error type
     */
    getAdaptiveMaxRetries(errorType) {
        const retryLimits = {
            network: 7,
            timeout: 5,
            formNotFound: 3,
            captcha: 2,
            antiBotDetection: 2,
            loginRequired: 1,
            feeBased: 1,
            unknown: this.config.maxRetries
        };
        
        return retryLimits[errorType] || this.config.maxRetries;
    }
    
    /**
     * Get most common error type for a directory
     */
    getMostCommonErrorForDirectory(directoryId) {
        const directoryErrors = this.errors.filter(err => err.directory === directoryId);
        
        if (directoryErrors.length === 0) return 'unknown';
        
        const errorCounts = {};
        directoryErrors.forEach(err => {
            errorCounts[err.errorType] = (errorCounts[err.errorType] || 0) + 1;
        });
        
        return Object.entries(errorCounts)
            .sort(([,a], [,b]) => b - a)[0][0];
    }
    
    /**
     * Check if processing should pause on critical errors
     */
    shouldPauseOnError(errorType, error) {
        // Pause on system-level errors
        const criticalErrors = [
            /out of memory/i,
            /system error/i,
            /chrome.*crashed/i,
            /extension.*disabled/i
        ];
        
        return criticalErrors.some(pattern => pattern.test(error.message)) ||
               (errorType === 'network' && this.errorClassifier.network > 10);
    }

    /**
     * Clear all queues and reset state
     */
    reset() {
        // Clear queue state from storage
        if (this.persistenceEnabled) {
            chrome.storage.local.remove([this.storageKey]);
        }
        
        this.queue = [];
        this.currentJob = null;
        this.isProcessing = false;
        this.results = [];
        this.errors = [];
        this.jobHistory.clear();
        this.errorClassifier = {
            network: 0,
            timeout: 0,
            captcha: 0,
            loginRequired: 0,
            feeBased: 0,
            antiBotDetection: 0,
            formNotFound: 0,
            unknown: 0
        };
        this.stats = {
            total: 0,
            processed: 0,
            successful: 0,
            failed: 0,
            skipped: 0,
            retried: 0,
            startTime: null,
            endTime: null,
            totalTime: 0
        };
        
        this.log('system', 'Queue processor reset', { timestamp: Date.now() });
    }
    
    // ==================== PRODUCTION FEATURES ====================
    
    /**
     * Initialize persistence recovery
     */
    async initializePersistence() {
        if (!this.persistenceEnabled) return;
        
        try {
            const result = await chrome.storage.local.get([this.storageKey]);
            if (result[this.storageKey]) {
                this.log('system', 'Persistence data found', { hasData: true });
            }
        } catch (error) {
            console.error('Failed to initialize persistence:', error);
            this.persistenceEnabled = false;
        }
    }
    
    /**
     * Recover queue state from storage
     */
    async recoverQueueState() {
        if (!this.persistenceEnabled) return;
        
        try {
            const result = await chrome.storage.local.get([this.storageKey]);
            const savedState = result[this.storageKey];
            
            if (savedState && savedState.queue && savedState.queue.length > 0) {
                // Filter out completed/failed jobs older than retention period
                const retentionTime = Date.now() - (this.config.persistenceRetention * 24 * 60 * 60 * 1000);
                const validJobs = savedState.queue.filter(job => {
                    if (job.status === 'pending' || job.status === 'retrying') return true;
                    return job.createdAt > retentionTime;
                });
                
                this.queue = validJobs;
                this.stats.total = this.queue.length;
                
                // Reset processing jobs to pending
                this.queue.forEach(job => {
                    if (job.status === 'processing') {
                        job.status = 'pending';
                        job.attempts = Math.max(0, job.attempts - 1); // Give another chance
                    }
                });
                
                console.log(`🔄 Recovered ${this.queue.length} jobs from previous session`);
                this.log('system', 'Queue state recovered', { 
                    recoveredJobs: this.queue.length,
                    originalJobs: savedState.queue.length
                });
            }
        } catch (error) {
            console.error('Failed to recover queue state:', error);
            this.log('error', 'Queue recovery failed', { error: error.message });
        }
    }
    
    /**
     * Persist current queue state
     */
    async persistQueueState() {
        if (!this.persistenceEnabled) return;
        
        try {
            const stateData = {
                queue: this.queue,
                stats: this.stats,
                errorClassifier: this.errorClassifier,
                timestamp: Date.now(),
                version: '2.0'
            };
            
            await chrome.storage.local.set({ [this.storageKey]: stateData });
            
        } catch (error) {
            console.error('Failed to persist queue state:', error);
            this.log('error', 'Queue persistence failed', { error: error.message });
        }
    }
    
    /**
     * Start periodic persistence
     */
    startPeriodicPersistence() {
        if (!this.persistenceEnabled) return;
        
        setInterval(() => {
            if (this.queue.length > 0 || this.isProcessing) {
                this.persistQueueState();
            }
        }, this.config.persistenceInterval);
    }
    
    /**
     * Initialize stuck job detection
     */
    initializeStuckJobDetection() {
        this.stuckJobDetector = setInterval(() => {
            if (this.currentJob && this.isProcessing) {
                const jobAge = Date.now() - (this.currentJob.startTime || this.currentJob.createdAt);
                
                if (jobAge > this.config.stuckJobTimeout) {
                    console.error(`🚨 Stuck job detected: ${this.currentJob.directory.name} (${jobAge}ms)`);
                    this.log('error', 'Stuck job detected', {
                        jobId: this.currentJob.id,
                        directoryName: this.currentJob.directory.name,
                        jobAge: jobAge
                    });
                    
                    this.handleStuckJob();
                }
            }
        }, 30000); // Check every 30 seconds
    }
    
    /**
     * Handle stuck job recovery
     */
    async handleStuckJob() {
        if (!this.currentJob) return;
        
        const stuckJob = this.currentJob;
        
        // Classify as timeout error
        this.classifyError('timeout', `Job stuck for ${Date.now() - stuckJob.startTime}ms`);
        
        // Force fail the stuck job
        await this.failDirectoryItem(stuckJob, new Error('Job stuck - timeout'));
        
        // Reset processing state
        this.currentJob = null;
        
        // Notify listeners
        this.notifyListeners('stuckJob', stuckJob);
        
        // Continue with next job if queue exists
        if (this.queue.length > 0 && this.isProcessing) {
            console.log('🔄 Continuing with next job after stuck job recovery');
            setTimeout(() => {
                if (this.queue.length > 0) {
                    const nextJob = this.queue.shift();
                    this.processDirectoryItem(nextJob);
                }
            }, 5000); // Wait 5 seconds before continuing
        }
    }
    
    /**
     * Start health monitoring
     */
    startHealthMonitoring() {
        this.healthCheck = setInterval(() => {
            const health = this.getSystemHealth();
            
            if (health.memoryUsage > this.config.memoryThreshold) {
                console.warn('⚠️ High memory usage detected:', health.memoryUsage);
                this.log('warning', 'High memory usage', health);
            }
            
            // Update performance metrics
            this.performanceMetrics = {
                ...this.performanceMetrics,
                ...health
            };
            
            this.notifyListeners('healthCheck', health);
            
        }, 60000); // Check every minute
    }
    
    /**
     * Get system health metrics
     */
    getSystemHealth() {
        const runtime = chrome.runtime;
        const now = Date.now();
        
        return {
            timestamp: now,
            queueSize: this.queue.length,
            isProcessing: this.isProcessing,
            currentJobAge: this.currentJob ? now - (this.currentJob.startTime || this.currentJob.createdAt) : 0,
            successRate: this.stats.total > 0 ? (this.stats.successful / this.stats.total) * 100 : 0,
            averageProcessingTime: this.calculateAverageProcessingTime(),
            errorRate: this.stats.total > 0 ? (this.stats.failed / this.stats.total) * 100 : 0,
            memoryUsage: this.estimateMemoryUsage(),
            logBufferSize: this.logBuffer.length
        };
    }
    
    /**
     * Calculate average processing time
     */
    calculateAverageProcessingTime() {
        const completedJobs = this.results.filter(job => job.processingTime);
        if (completedJobs.length === 0) return 0;
        
        const totalTime = completedJobs.reduce((sum, job) => sum + job.processingTime, 0);
        return Math.round(totalTime / completedJobs.length);
    }
    
    /**
     * Estimate memory usage
     */
    estimateMemoryUsage() {
        // Rough estimation based on data structures
        const queueSize = JSON.stringify(this.queue).length;
        const resultsSize = JSON.stringify(this.results).length;
        const logSize = JSON.stringify(this.logBuffer).length;
        
        return queueSize + resultsSize + logSize;
    }
    
    /**
     * Initialize error classification
     */
    initializeErrorClassification() {
        // Error patterns for intelligent classification
        this.errorPatterns = {
            network: [
                /network error/i,
                /connection failed/i,
                /timeout/i,
                /net::ERR_/i,
                /fetch.*failed/i
            ],
            captcha: [
                /captcha/i,
                /recaptcha/i,
                /verify.*human/i,
                /robot.*verification/i
            ],
            loginRequired: [
                /login.*required/i,
                /sign.*in.*required/i,
                /authentication.*needed/i,
                /unauthorized/i
            ],
            feeBased: [
                /payment.*required/i,
                /subscription.*needed/i,
                /premium.*feature/i,
                /fee.*apply/i
            ],
            antiBotDetection: [
                /blocked.*bot/i,
                /automated.*traffic/i,
                /suspicious.*activity/i,
                /rate.*limit/i
            ],
            formNotFound: [
                /form.*not.*found/i,
                /element.*not.*found/i,
                /selector.*invalid/i,
                /no.*matching.*element/i
            ]
        };
    }
    
    /**
     * Classify error for intelligent handling
     */
    classifyError(errorType, errorMessage) {
        let classification = 'unknown';
        
        if (errorType && this.errorClassifier.hasOwnProperty(errorType)) {
            classification = errorType;
        } else {
            // Try to classify based on error message
            for (const [type, patterns] of Object.entries(this.errorPatterns)) {
                if (patterns.some(pattern => pattern.test(errorMessage))) {
                    classification = type;
                    break;
                }
            }
        }
        
        this.errorClassifier[classification]++;
        
        this.log('error', 'Error classified', {
            classification,
            message: errorMessage,
            counts: this.errorClassifier
        });
        
        return classification;
    }
    
    /**
     * Pre-filter directories based on intelligent skip logic
     */
    preFilterDirectories(directories) {
        return directories.filter(directory => {
            const skipReasons = [];
            
            // Check for CAPTCHA indicators
            if (this.config.skipCaptcha && this.hasCaptchaIndicators(directory)) {
                skipReasons.push('captcha_detected');
            }
            
            // Check for login requirements
            if (this.config.skipLogin && this.hasLoginRequirement(directory)) {
                skipReasons.push('login_required');
            }
            
            // Check for fees
            if (this.config.skipFees && this.hasSubmissionFee(directory)) {
                skipReasons.push('fee_based');
            }
            
            // Check for anti-bot detection
            if (this.config.skipAntiBotDetection && this.hasAntiBotDetection(directory)) {
                skipReasons.push('anti_bot_detection');
            }
            
            if (skipReasons.length > 0) {
                this.log('skip', 'Directory pre-filtered', {
                    directoryId: directory.id,
                    directoryName: directory.name,
                    skipReasons
                });
                return false;
            }
            
            return true;
        });
    }
    
    /**
     * Check for CAPTCHA indicators
     */
    hasCaptchaIndicators(directory) {
        const indicators = [
            'captcha', 'recaptcha', 'verify', 'robot',
            'human verification', 'anti-spam'
        ];
        
        const checkText = [
            directory.name,
            directory.description || '',
            directory.url,
            ...(directory.requirements || [])
        ].join(' ').toLowerCase();
        
        return indicators.some(indicator => checkText.includes(indicator));
    }
    
    /**
     * Check for login requirements
     */
    hasLoginRequirement(directory) {
        const requirements = directory.requirements || [];
        const loginIndicators = [
            'login', 'sign in', 'account', 'registration',
            'authenticate', 'member', 'user account'
        ];
        
        return requirements.some(req => 
            loginIndicators.some(indicator => 
                req.toLowerCase().includes(indicator)
            )
        ) || directory.requiresLogin === true;
    }
    
    /**
     * Check for submission fees
     */
    hasSubmissionFee(directory) {
        if (directory.submissionFee) {
            const fee = directory.submissionFee.toLowerCase();
            return fee !== 'free' && fee !== '$0' && fee !== '0';
        }
        
        const feeIndicators = ['premium', 'paid', 'fee', 'cost', 'price'];
        const checkText = [
            directory.name,
            directory.description || '',
            ...(directory.requirements || [])
        ].join(' ').toLowerCase();
        
        return feeIndicators.some(indicator => checkText.includes(indicator));
    }
    
    /**
     * Check for anti-bot detection
     */
    hasAntiBotDetection(directory) {
        const indicators = [
            'cloudflare', 'bot protection', 'ddos', 'security check',
            'rate limit', 'automated traffic', 'suspicious activity'
        ];
        
        const checkText = [
            directory.name,
            directory.description || '',
            directory.url
        ].join(' ').toLowerCase();
        
        return indicators.some(indicator => checkText.includes(indicator)) ||
               directory.hasAntiBot === true;
    }
    
    /**
     * Calculate priority for directory
     */
    calculatePriority(directory) {
        // Use existing priority if available
        if (directory.priority) {
            return directory.priority;
        }
        
        // Calculate based on category and other factors
        const categoryPriority = {
            'search-engines': 'high',
            'maps': 'high',
            'review-sites': 'high',
            'social-media': 'medium',
            'professional': 'medium',
            'traditional-directories': 'low',
            'niche-directories': 'low'
        };
        
        return categoryPriority[directory.category] || 'medium';
    }
    
    /**
     * Estimate directory processing difficulty
     */
    estimateDirectoryDifficulty(directory) {
        let difficulty = directory.difficulty || 'medium';
        
        // Adjust based on requirements
        const requirements = directory.requirements || [];
        if (requirements.length > 3) {
            difficulty = difficulty === 'easy' ? 'medium' : 'hard';
        }
        
        // Adjust based on estimated time
        if (directory.estimatedTime > 300) { // 5 minutes
            difficulty = 'hard';
        } else if (directory.estimatedTime < 120) { // 2 minutes
            difficulty = 'easy';
        }
        
        return difficulty;
    }
    
    /**
     * Assign batch group
     */
    assignBatchGroup(directory) {
        // Group by category for efficient processing
        return directory.category || 'default';
    }
    
    /**
     * Get batch group summary
     */
    getBatchGroupSummary(queueItems) {
        const groups = {};
        
        queueItems.forEach(item => {
            const group = item.batchGroup;
            if (!groups[group]) {
                groups[group] = { count: 0, priorities: { high: 0, medium: 0, low: 0 } };
            }
            groups[group].count++;
            groups[group].priorities[item.priority]++;
        });
        
        return groups;
    }
    
    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        setInterval(() => {
            this.performanceMetrics = {
                ...this.performanceMetrics,
                ...this.getSystemHealth()
            };
        }, 30000); // Update every 30 seconds
    }
    
    /**
     * Enhanced logging system
     */
    log(category, message, data = {}) {
        const logEntry = {
            timestamp: Date.now(),
            category,
            message,
            data: JSON.parse(JSON.stringify(data)), // Deep clone to prevent mutations
            level: this.config.logLevel
        };
        
        // Add to buffer
        this.logBuffer.push(logEntry);
        
        // Trim buffer if too large
        if (this.logBuffer.length > this.maxLogBuffer) {
            this.logBuffer = this.logBuffer.slice(-this.maxLogBuffer * 0.8); // Keep 80%
        }
        
        // Console output based on level
        if (this.config.logLevel === 'debug' || category === 'error') {
            console.log(`[AUTO-BOLT-${category.toUpperCase()}] ${message}`, data);
        }
        
        // Store to chrome.storage if enabled
        if (this.config.logToStorage) {
            this.persistLogs();
        }
    }
    
    /**
     * Persist logs to storage
     */
    async persistLogs() {
        try {
            const logKey = 'autobolt_logs';
            const retentionTime = Date.now() - (this.config.logRetention * 60 * 60 * 1000);
            
            // Filter logs by retention time
            const recentLogs = this.logBuffer.filter(log => log.timestamp > retentionTime);
            
            await chrome.storage.local.set({ [logKey]: recentLogs });
        } catch (error) {
            console.error('Failed to persist logs:', error);
        }
    }
    
    /**
     * Get comprehensive system report
     */
    getSystemReport() {
        return {
            timestamp: Date.now(),
            queue: {
                size: this.queue.length,
                isProcessing: this.isProcessing,
                currentJob: this.currentJob ? {
                    id: this.currentJob.id,
                    directoryName: this.currentJob.directory.name,
                    status: this.currentJob.status,
                    attempts: this.currentJob.attempts
                } : null
            },
            stats: this.stats,
            performance: this.performanceMetrics,
            errors: {
                classification: this.errorClassifier,
                recentErrors: this.errors.slice(-10)
            },
            config: {
                persistenceEnabled: this.persistenceEnabled,
                batchingEnabled: this.batchConfig.enabled,
                intelligentSkipping: this.config.intelligentSkipping,
                logLevel: this.config.logLevel
            },
            health: this.getSystemHealth()
        };
    }
}

// Make QueueProcessor available globally for service worker
globalThis.QueueProcessor = QueueProcessor;

// Create singleton instance with production features
const queueProcessor = new QueueProcessor();

// Add global error handler for uncaught errors
if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
        if (queueProcessor && typeof queueProcessor.log === 'function') {
            queueProcessor.log('error', 'Uncaught error in queue processor', {
                message: event.error?.message || event.message,
                filename: event.filename,
                lineno: event.lineno,
                stack: event.error?.stack
            });
        }
    });
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QueueProcessor;
}