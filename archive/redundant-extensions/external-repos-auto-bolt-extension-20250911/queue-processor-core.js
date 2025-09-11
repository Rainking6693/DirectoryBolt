/**
 * Optimized Queue Processor for Auto-Bolt Chrome Extension
 * Streamlined for performance with lazy-loaded advanced features
 */

class QueueProcessor {
    constructor() {
        this.queue = [];
        this.currentJob = null;
        this.isProcessing = false;
        this.results = [];
        this.errors = [];
        this.storageKey = 'autobolt_queue_state';
        
        // Performance tracking
        this.stats = {
            total: 0,
            processed: 0,
            successful: 0,
            failed: 0,
            skipped: 0,
            retried: 0,
            startTime: null,
            endTime: null
        };
        
        // Core configuration
        this.config = {
            baseDelay: 4000,
            randomDelayRange: 3000,
            retryDelay: 8000,
            maxRetries: 5,
            directoryTimeout: 180000,
            maxConcurrentTabs: 1,
            humanLikeDelays: true
        };
        
        // Error classification
        this.errorTypes = {
            network: 0,
            timeout: 0,
            captcha: 0,
            loginRequired: 0,
            formNotFound: 0,
            unknown: 0
        };
        
        // Advanced modules (lazy-loaded)
        this.advancedAnalyzer = null;
        this.batchProcessor = null;
        this.errorRecovery = null;
        
        this.init();
    }

    async init() {
        this.debugLog('🚀 Queue Processor initializing...');
        await this.loadPersistedState();
        this.setupEventHandlers();
        this.startHealthMonitoring();
        this.debugLog('✅ Queue Processor ready');
    }

    debugLog(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(logMessage);
        
        // Store in buffer for advanced logging if needed
        if (!this.logBuffer) this.logBuffer = [];
        this.logBuffer.push({ timestamp, message, level });
        
        // Keep buffer size manageable
        if (this.logBuffer.length > 500) {
            this.logBuffer = this.logBuffer.slice(-500);
        }
    }

    async loadPersistedState() {
        try {
            const result = await chrome.storage.local.get([this.storageKey]);
            if (result[this.storageKey]) {
                const state = result[this.storageKey];
                this.queue = state.queue || [];
                this.stats = { ...this.stats, ...state.stats };
                this.debugLog(`📁 Loaded ${this.queue.length} persisted jobs`);
            }
        } catch (error) {
            this.debugLog(`⚠️ Failed to load persisted state: ${error.message}`, 'warn');
        }
    }

    async saveState() {
        if (!this.persistenceEnabled) return;
        
        try {
            const state = {
                queue: this.queue,
                stats: this.stats,
                timestamp: Date.now()
            };
            
            await chrome.storage.local.set({ [this.storageKey]: state });
        } catch (error) {
            this.debugLog(`⚠️ Failed to save state: ${error.message}`, 'warn');
        }
    }

    setupEventHandlers() {
        // Handle extension lifecycle
        if (chrome.runtime?.onSuspend) {
            chrome.runtime.onSuspend.addListener(() => {
                this.debugLog('💤 Extension suspending - saving state');
                this.saveState();
            });
        }

        // Handle tab updates
        if (chrome.tabs?.onUpdated) {
            chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
                if (this.currentJob && this.currentJob.tabId === tabId) {
                    this.handleTabUpdate(changeInfo, tab);
                }
            });
        }
    }

    handleTabUpdate(changeInfo, tab) {
        if (changeInfo.status === 'complete' && this.currentJob) {
            this.debugLog(`📄 Tab loaded: ${tab.url}`);
            if (this.currentJob.waitingForLoad) {
                this.currentJob.waitingForLoad = false;
                this.continueJobProcessing();
            }
        }
    }

    startHealthMonitoring() {
        // Basic health check every minute
        setInterval(() => {
            this.performHealthCheck();
        }, 60000);
    }

    performHealthCheck() {
        const now = Date.now();
        
        // Check for stuck jobs
        if (this.currentJob && this.currentJob.startTime) {
            const jobDuration = now - this.currentJob.startTime;
            if (jobDuration > this.config.directoryTimeout) {
                this.debugLog('⚠️ Job appears stuck - attempting recovery', 'warn');
                this.handleStuckJob();
            }
        }
        
        // Memory cleanup
        if (this.results.length > 1000) {
            this.results = this.results.slice(-500);
        }
        
        if (this.errors.length > 500) {
            this.errors = this.errors.slice(-250);
        }
    }

    async handleStuckJob() {
        if (!this.currentJob) return;
        
        this.debugLog(`🔄 Handling stuck job: ${this.currentJob.directory.name}`);
        
        try {
            if (this.currentJob.tabId) {
                await chrome.tabs.remove(this.currentJob.tabId);
            }
        } catch (error) {
            this.debugLog(`⚠️ Error closing stuck tab: ${error.message}`, 'warn');
        }
        
        this.markJobAsFailed(this.currentJob, 'Job timeout - exceeded maximum processing time');
        this.currentJob = null;
        this.isProcessing = false;
        
        // Continue with next job
        setTimeout(() => this.processNextJob(), 2000);
    }

    addJob(directory, priority = 'medium') {
        const job = {
            id: this.generateJobId(),
            directory,
            priority,
            status: 'pending',
            createdAt: Date.now(),
            retryCount: 0,
            errors: []
        };
        
        this.queue.push(job);
        this.stats.total++;
        this.debugLog(`➕ Added job: ${directory.name} (${this.queue.length} in queue)`);
        
        this.saveState();
        return job.id;
    }

    addBatch(directories, priority = 'medium') {
        const jobIds = [];
        directories.forEach(directory => {
            jobIds.push(this.addJob(directory, priority));
        });
        
        this.debugLog(`📦 Added batch: ${directories.length} directories`);
        return jobIds;
    }

    generateJobId() {
        return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    async startProcessing() {
        if (this.isProcessing) {
            this.debugLog('⚠️ Processing already active', 'warn');
            return false;
        }
        
        if (this.queue.length === 0) {
            this.debugLog('📝 No jobs in queue');
            return false;
        }
        
        this.debugLog('🚀 Starting queue processing...');
        this.isProcessing = true;
        this.stats.startTime = Date.now();
        
        await this.processNextJob();
        return true;
    }

    async processNextJob() {
        if (!this.isProcessing || this.queue.length === 0) {
            this.completeProcessing();
            return;
        }
        
        // Get highest priority job
        this.currentJob = this.getNextJob();
        if (!this.currentJob) {
            this.completeProcessing();
            return;
        }
        
        this.debugLog(`🎯 Processing: ${this.currentJob.directory.name} (${this.queue.length} remaining)`);
        this.currentJob.status = 'processing';
        this.currentJob.startTime = Date.now();
        
        try {
            await this.processDirectory(this.currentJob);
        } catch (error) {
            this.debugLog(`❌ Job failed: ${error.message}`, 'error');
            await this.handleJobError(this.currentJob, error);
        }
        
        // Add delay before next job
        const delay = this.calculateDelay();
        this.debugLog(`⏳ Waiting ${delay}ms before next job`);
        setTimeout(() => this.processNextJob(), delay);
    }

    getNextJob() {
        if (this.queue.length === 0) return null;
        
        // Simple priority sorting
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        this.queue.sort((a, b) => {
            return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
        });
        
        return this.queue.shift();
    }

    async processDirectory(job) {
        const directory = job.directory;
        
        // Open directory URL
        const tab = await this.openDirectory(directory.url);
        job.tabId = tab.id;
        
        // Wait for page load
        await this.waitForPageLoad(tab.id);
        
        // Check if directory processing should be skipped
        const shouldSkip = await this.shouldSkipDirectory(tab.id, directory);
        if (shouldSkip.skip) {
            this.markJobAsSkipped(job, shouldSkip.reason);
            await this.closeTab(tab.id);
            return;
        }
        
        // Fill forms
        const fillResult = await this.fillDirectoryForms(tab.id, directory);
        
        if (fillResult.success) {
            this.markJobAsSuccessful(job, fillResult);
        } else {
            throw new Error(fillResult.error || 'Form filling failed');
        }
        
        await this.closeTab(tab.id);
    }

    async openDirectory(url) {
        try {
            const tab = await chrome.tabs.create({
                url: url,
                active: false
            });
            
            this.debugLog(`📂 Opened tab ${tab.id}: ${url}`);
            return tab;
        } catch (error) {
            throw new Error(`Failed to open directory: ${error.message}`);
        }
    }

    async waitForPageLoad(tabId, timeout = 30000) {
        return new Promise((resolve, reject) => {
            let resolved = false;
            
            const timeoutId = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    reject(new Error('Page load timeout'));
                }
            }, timeout);
            
            const listener = (updatedTabId, changeInfo) => {
                if (updatedTabId === tabId && changeInfo.status === 'complete') {
                    if (!resolved) {
                        resolved = true;
                        clearTimeout(timeoutId);
                        chrome.tabs.onUpdated.removeListener(listener);
                        resolve();
                    }
                }
            };
            
            chrome.tabs.onUpdated.addListener(listener);
        });
    }

    async shouldSkipDirectory(tabId, directory) {
        try {
            // Check for common skip indicators
            const result = await chrome.tabs.sendMessage(tabId, {
                type: 'CHECK_SKIP_INDICATORS'
            });
            
            if (result && result.shouldSkip) {
                return { skip: true, reason: result.reason };
            }
            
            return { skip: false };
        } catch (error) {
            this.debugLog(`⚠️ Skip check failed: ${error.message}`, 'warn');
            return { skip: false };
        }
    }

    async fillDirectoryForms(tabId, directory) {
        try {
            const result = await chrome.tabs.sendMessage(tabId, {
                type: 'FILL_FORMS',
                directory: directory
            });
            
            if (result && result.success) {
                return { success: true, result };
            } else {
                return { success: false, error: result?.message || 'Unknown error' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async closeTab(tabId) {
        try {
            await chrome.tabs.remove(tabId);
            this.debugLog(`🗙 Closed tab ${tabId}`);
        } catch (error) {
            this.debugLog(`⚠️ Error closing tab: ${error.message}`, 'warn');
        }
    }

    calculateDelay() {
        let delay = this.config.baseDelay;
        
        if (this.config.humanLikeDelays) {
            const randomVariation = Math.random() * this.config.randomDelayRange;
            delay += randomVariation;
        }
        
        return Math.round(delay);
    }

    markJobAsSuccessful(job, result) {
        job.status = 'completed';
        job.endTime = Date.now();
        job.result = result;
        
        this.results.push(job);
        this.stats.successful++;
        this.stats.processed++;
        
        this.debugLog(`✅ Job completed: ${job.directory.name}`);
        this.saveState();
    }

    markJobAsSkipped(job, reason) {
        job.status = 'skipped';
        job.endTime = Date.now();
        job.skipReason = reason;
        
        this.results.push(job);
        this.stats.skipped++;
        this.stats.processed++;
        
        this.debugLog(`⏭️ Job skipped: ${job.directory.name} - ${reason}`);
        this.saveState();
    }

    markJobAsFailed(job, error) {
        job.status = 'failed';
        job.endTime = Date.now();
        job.errors.push({
            message: error.toString(),
            timestamp: Date.now()
        });
        
        this.errors.push(job);
        this.stats.failed++;
        this.stats.processed++;
        
        // Classify error type
        this.classifyError(error);
        
        this.debugLog(`❌ Job failed: ${job.directory.name} - ${error}`, 'error');
        this.saveState();
    }

    async handleJobError(job, error) {
        if (job.retryCount < this.config.maxRetries) {
            job.retryCount++;
            job.status = 'retrying';
            
            const retryDelay = this.calculateRetryDelay(job.retryCount);
            this.debugLog(`🔄 Retrying job in ${retryDelay}ms (attempt ${job.retryCount}/${this.config.maxRetries})`);
            
            // Add back to queue for retry
            this.queue.unshift(job);
            this.stats.retried++;
            
            this.saveState();
        } else {
            this.markJobAsFailed(job, error);
        }
        
        // Clean up current job
        this.currentJob = null;
    }

    calculateRetryDelay(retryCount) {
        const baseDelay = this.config.retryDelay;
        const exponentialDelay = baseDelay * Math.pow(2, retryCount - 1);
        return Math.min(exponentialDelay, 120000); // Cap at 2 minutes
    }

    classifyError(error) {
        const errorStr = error.toString().toLowerCase();
        
        if (errorStr.includes('network') || errorStr.includes('connection')) {
            this.errorTypes.network++;
        } else if (errorStr.includes('timeout')) {
            this.errorTypes.timeout++;
        } else if (errorStr.includes('captcha')) {
            this.errorTypes.captcha++;
        } else if (errorStr.includes('login') || errorStr.includes('auth')) {
            this.errorTypes.loginRequired++;
        } else if (errorStr.includes('form')) {
            this.errorTypes.formNotFound++;
        } else {
            this.errorTypes.unknown++;
        }
    }

    completeProcessing() {
        this.isProcessing = false;
        this.currentJob = null;
        this.stats.endTime = Date.now();
        this.stats.totalTime = this.stats.endTime - this.stats.startTime;
        
        this.debugLog('🏁 Queue processing completed');
        this.debugLog(`📊 Results: ${this.stats.successful} success, ${this.stats.failed} failed, ${this.stats.skipped} skipped`);
        
        this.saveState();
        this.notifyCompletion();
    }

    notifyCompletion() {
        // Send completion notification
        if (chrome.runtime?.sendMessage) {
            chrome.runtime.sendMessage({
                type: 'QUEUE_PROCESSING_COMPLETE',
                stats: this.stats,
                timestamp: Date.now()
            });
        }
    }

    stopProcessing() {
        this.debugLog('🛑 Stopping queue processing...');
        this.isProcessing = false;
        
        if (this.currentJob && this.currentJob.tabId) {
            chrome.tabs.remove(this.currentJob.tabId).catch(() => {});
            this.currentJob = null;
        }
        
        this.saveState();
    }

    pauseProcessing() {
        this.debugLog('⏸️ Pausing queue processing...');
        this.isProcessing = false;
        this.saveState();
    }

    resumeProcessing() {
        this.debugLog('▶️ Resuming queue processing...');
        this.startProcessing();
    }

    clearQueue() {
        this.queue = [];
        this.results = [];
        this.errors = [];
        this.stats = {
            total: 0,
            processed: 0,
            successful: 0,
            failed: 0,
            skipped: 0,
            retried: 0,
            startTime: null,
            endTime: null
        };
        
        this.debugLog('🗑️ Queue cleared');
        this.saveState();
    }

    getStatus() {
        return {
            isProcessing: this.isProcessing,
            queueLength: this.queue.length,
            currentJob: this.currentJob ? {
                id: this.currentJob.id,
                directoryName: this.currentJob.directory.name,
                status: this.currentJob.status,
                retryCount: this.currentJob.retryCount
            } : null,
            stats: this.stats,
            errorTypes: this.errorTypes
        };
    }

    async loadAdvancedModules() {
        if (!this.advancedAnalyzer) {
            try {
                const modules = await import('./queue-advanced.js');
                this.advancedAnalyzer = new modules.AdvancedAnalyzer();
                this.batchProcessor = new modules.BatchProcessor();
                this.errorRecovery = new modules.ErrorRecoveryEngine();
                
                this.debugLog('📦 Advanced modules loaded');
            } catch (error) {
                this.debugLog(`⚠️ Advanced modules unavailable: ${error.message}`, 'warn');
            }
        }
    }
}

// Initialize global instance
if (typeof window !== 'undefined') {
    window.QueueProcessor = QueueProcessor;
} else if (typeof global !== 'undefined') {
    global.QueueProcessor = QueueProcessor;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = QueueProcessor;
}