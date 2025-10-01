/**
 * Monitoring Scheduler for Directory Health System
 * Low-overhead task scheduling and resource management
 * 
 * Features:
 * - Intelligent task scheduling with resource limits
 * - Priority-based directory monitoring
 * - Adaptive frequency adjustment
 * - Performance metrics tracking
 * - Background task management
 * - Chrome extension integration
 */

class MonitoringScheduler {
    constructor(healthMonitor) {
        this.healthMonitor = healthMonitor;
        this.isRunning = false;
        this.taskQueue = [];
        this.runningTasks = new Map();
        this.performance = {
            totalExecutions: 0,
            totalTime: 0,
            avgExecutionTime: 0,
            lastExecution: null,
            resourceUsage: 0
        };
        
        // Resource management settings
        this.maxConcurrentTasks = 3;
        this.maxResourceUsage = 0.03; // 3% CPU limit
        this.baseInterval = 60000; // 1 minute base interval
        this.priorityMultipliers = {
            high: 1.0,
            medium: 1.5,
            low: 2.0
        };
        
        // Task scheduling configuration
        this.scheduleConfig = {
            immediateCheck: 5000,    // 5 seconds for immediate checks
            highPriority: 300000,    // 5 minutes for high priority
            mediumPriority: 900000,  // 15 minutes for medium priority
            lowPriority: 1800000,    // 30 minutes for low priority
            fullScan: 3600000        // 1 hour for full system scan
        };
        
        this.init();
    }

    async init() {
        // Initialize performance monitoring
        this.setupPerformanceMonitoring();
        
        // Setup Chrome extension integration
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            this.setupChromeIntegration();
        }
        
        // Load saved scheduling configuration
        await this.loadConfiguration();
        
        console.log('Monitoring Scheduler initialized');
    }

    /**
     * Start the monitoring scheduler
     */
    start() {
        if (this.isRunning) {
            console.warn('Scheduler already running');
            return;
        }

        this.isRunning = true;
        console.log('Starting monitoring scheduler');

        // Start the main scheduling loop
        this.startSchedulingLoop();

        // Schedule periodic full scans
        this.scheduleFullScans();

        // Start performance monitoring
        this.startPerformanceMonitoring();

        // Setup adaptive scheduling
        this.setupAdaptiveScheduling();
    }

    /**
     * Stop the monitoring scheduler
     */
    stop() {
        this.isRunning = false;
        
        // Clear all running intervals and timeouts
        this.clearAllSchedules();
        
        // Cancel running tasks
        this.cancelRunningTasks();
        
        console.log('Monitoring scheduler stopped');
    }

    /**
     * Main scheduling loop - processes task queue
     */
    startSchedulingLoop() {
        const processQueue = async () => {
            if (!this.isRunning) return;

            try {
                // Check resource usage before processing
                if (this.performance.resourceUsage > this.maxResourceUsage) {
                    console.warn('Resource usage high, delaying task execution');
                    setTimeout(processQueue, 5000);
                    return;
                }

                // Process tasks if we have capacity
                if (this.runningTasks.size < this.maxConcurrentTasks && this.taskQueue.length > 0) {
                    await this.executeNextTask();
                }

                // Schedule next queue check
                setTimeout(processQueue, 1000);

            } catch (error) {
                console.error('Scheduling loop error:', error);
                setTimeout(processQueue, 5000);
            }
        };

        processQueue();
    }

    /**
     * Schedule tasks based on directory priority and last check time
     */
    scheduleDirectoryTasks() {
        if (!this.healthMonitor?.directories) return;

        const now = Date.now();

        this.healthMonitor.directories.forEach(directory => {
            const healthData = this.healthMonitor.healthData.get(directory.id);
            const lastChecked = healthData?.lastChecked || 0;
            const priority = directory.priority || 'medium';
            
            // Calculate next check time based on priority
            const interval = this.scheduleConfig[priority + 'Priority'] || this.scheduleConfig.mediumPriority;
            const nextCheckTime = lastChecked + interval;

            // Schedule task if it's time for a check
            if (now >= nextCheckTime) {
                this.addTask({
                    type: 'directory_check',
                    directoryId: directory.id,
                    directory: directory,
                    priority: priority,
                    scheduledTime: now,
                    estimatedDuration: this.estimateTaskDuration(directory)
                });
            }
        });
    }

    /**
     * Add task to the processing queue
     */
    addTask(task) {
        // Check if task already exists in queue
        const existingTaskIndex = this.taskQueue.findIndex(
            t => t.type === task.type && t.directoryId === task.directoryId
        );

        if (existingTaskIndex !== -1) {
            // Update existing task with newer schedule time
            this.taskQueue[existingTaskIndex] = {
                ...this.taskQueue[existingTaskIndex],
                ...task,
                scheduledTime: Math.max(this.taskQueue[existingTaskIndex].scheduledTime, task.scheduledTime)
            };
        } else {
            this.taskQueue.push(task);
        }

        // Sort queue by priority and schedule time
        this.sortTaskQueue();
    }

    /**
     * Sort task queue by priority and schedule time
     */
    sortTaskQueue() {
        const priorityValues = { high: 3, medium: 2, low: 1 };
        
        this.taskQueue.sort((a, b) => {
            // First by priority
            const priorityDiff = priorityValues[b.priority] - priorityValues[a.priority];
            if (priorityDiff !== 0) return priorityDiff;
            
            // Then by scheduled time (earlier first)
            return a.scheduledTime - b.scheduledTime;
        });
    }

    /**
     * Execute the next task in the queue
     */
    async executeNextTask() {
        if (this.taskQueue.length === 0) return;

        const task = this.taskQueue.shift();
        const taskId = `${task.type}_${task.directoryId}_${Date.now()}`;
        
        // Add to running tasks
        this.runningTasks.set(taskId, {
            ...task,
            startTime: Date.now()
        });

        try {
            const startTime = performance.now();
            
            // Execute the task based on type
            await this.executeTask(task);
            
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            
            // Update performance metrics
            this.updatePerformanceMetrics(executionTime);
            
            // Log successful execution
            console.log(`Task completed: ${task.type} for ${task.directoryId} in ${executionTime.toFixed(2)}ms`);
            
        } catch (error) {
            console.error(`Task failed: ${task.type} for ${task.directoryId}:`, error);
            
            // Schedule retry for failed task (with backoff)
            this.scheduleRetry(task, error);
            
        } finally {
            // Remove from running tasks
            this.runningTasks.delete(taskId);
        }
    }

    /**
     * Execute specific task type
     */
    async executeTask(task) {
        switch (task.type) {
            case 'directory_check':
                await this.healthMonitor.monitorDirectory(task.directory);
                break;
                
            case 'full_scan':
                await this.executeFullScan();
                break;
                
            case 'priority_check':
                await this.executePriorityCheck();
                break;
                
            case 'alert_check':
                await this.executeAlertCheck(task.directoryId);
                break;
                
            default:
                throw new Error(`Unknown task type: ${task.type}`);
        }
    }

    /**
     * Execute full system scan
     */
    async executeFullScan() {
        console.log('Starting full system scan');
        
        // Process directories in batches to prevent resource overload
        const batchSize = 5;
        const directories = this.healthMonitor.directories || [];
        
        for (let i = 0; i < directories.length; i += batchSize) {
            const batch = directories.slice(i, i + batchSize);
            
            // Process batch concurrently but wait for completion
            await Promise.allSettled(
                batch.map(directory => this.healthMonitor.monitorDirectory(directory))
            );
            
            // Small delay between batches to prevent resource spikes
            if (i + batchSize < directories.length) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        console.log('Full system scan completed');
    }

    /**
     * Execute priority check for high-priority directories
     */
    async executePriorityCheck() {
        const highPriorityDirectories = this.healthMonitor.directories.filter(
            d => d.priority === 'high'
        );
        
        console.log(`Checking ${highPriorityDirectories.length} high-priority directories`);
        
        // Process high priority directories with minimal delay
        for (const directory of highPriorityDirectories) {
            await this.healthMonitor.monitorDirectory(directory);
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    }

    /**
     * Execute alert check for specific directory
     */
    async executeAlertCheck(directoryId) {
        const directory = this.healthMonitor.directories.find(d => d.id === directoryId);
        if (!directory) return;
        
        // Perform comprehensive check
        await this.healthMonitor.monitorDirectory(directory);
        
        // Check for new alerts
        await this.healthMonitor.checkForAlerts(directoryId, directory);
    }

    /**
     * Schedule retry for failed task with exponential backoff
     */
    scheduleRetry(task, error) {
        const retryCount = (task.retryCount || 0) + 1;
        const maxRetries = 3;
        
        if (retryCount > maxRetries) {
            console.error(`Task ${task.type} for ${task.directoryId} failed after ${maxRetries} retries`);
            return;
        }
        
        // Exponential backoff: 2^retryCount * 30 seconds
        const backoffDelay = Math.pow(2, retryCount) * 30000;
        
        setTimeout(() => {
            this.addTask({
                ...task,
                retryCount: retryCount,
                scheduledTime: Date.now() + backoffDelay
            });
        }, backoffDelay);
        
        console.log(`Scheduled retry ${retryCount}/${maxRetries} for ${task.type} in ${backoffDelay}ms`);
    }

    /**
     * Schedule periodic full scans
     */
    scheduleFullScans() {
        if (!this.isRunning) return;
        
        // Schedule full scan
        setTimeout(() => {
            this.addTask({
                type: 'full_scan',
                priority: 'medium',
                scheduledTime: Date.now(),
                estimatedDuration: 60000 // 1 minute estimated
            });
            
            // Schedule next full scan
            if (this.isRunning) {
                setTimeout(() => this.scheduleFullScans(), this.scheduleConfig.fullScan);
            }
        }, this.scheduleConfig.fullScan);
        
        // Schedule priority checks more frequently
        setTimeout(() => {
            this.addTask({
                type: 'priority_check',
                priority: 'high',
                scheduledTime: Date.now(),
                estimatedDuration: 15000 // 15 seconds estimated
            });
            
            if (this.isRunning) {
                setTimeout(() => this.scheduleFullScans(), this.scheduleConfig.highPriority);
            }
        }, this.scheduleConfig.highPriority);
    }

    /**
     * Setup adaptive scheduling based on performance metrics
     */
    setupAdaptiveScheduling() {
        setInterval(() => {
            if (!this.isRunning) return;
            
            // Adjust scheduling based on performance
            this.adjustSchedulingFrequency();
            
            // Schedule pending directory tasks
            this.scheduleDirectoryTasks();
            
        }, 30000); // Check every 30 seconds
    }

    /**
     * Adjust scheduling frequency based on system performance
     */
    adjustSchedulingFrequency() {
        const resourceUsage = this.performance.resourceUsage;
        const avgExecutionTime = this.performance.avgExecutionTime;
        
        // Adjust intervals based on resource usage
        if (resourceUsage > this.maxResourceUsage * 0.8) {
            // Increase intervals by 50% if resource usage is high
            Object.keys(this.scheduleConfig).forEach(key => {
                if (key.includes('Priority')) {
                    this.scheduleConfig[key] *= 1.5;
                }
            });
            
            console.log('Increased monitoring intervals due to high resource usage');
            
        } else if (resourceUsage < this.maxResourceUsage * 0.3 && avgExecutionTime < 1000) {
            // Decrease intervals by 25% if resource usage is low and performance is good
            Object.keys(this.scheduleConfig).forEach(key => {
                if (key.includes('Priority')) {
                    this.scheduleConfig[key] = Math.max(this.scheduleConfig[key] * 0.75, this.baseInterval);
                }
            });
            
            console.log('Decreased monitoring intervals due to low resource usage');
        }
    }

    /**
     * Estimate task duration based on directory characteristics
     */
    estimateTaskDuration(directory) {
        let baseDuration = 2000; // 2 seconds base
        
        // Adjust based on directory priority
        if (directory.priority === 'high') baseDuration *= 1.2;
        if (directory.priority === 'low') baseDuration *= 0.8;
        
        // Adjust based on estimated complexity
        const estimatedTime = directory.estimatedTime || 300;
        baseDuration += estimatedTime * 0.1; // 10% of estimated submission time
        
        // Adjust based on historical performance
        const healthData = this.healthMonitor?.healthData.get(directory.id);
        if (healthData?.performanceMetrics.avgResponseTime) {
            baseDuration += healthData.performanceMetrics.avgResponseTime * 0.5;
        }
        
        return Math.min(baseDuration, 10000); // Cap at 10 seconds
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(executionTime) {
        this.performance.totalExecutions++;
        this.performance.totalTime += executionTime;
        this.performance.avgExecutionTime = this.performance.totalTime / this.performance.totalExecutions;
        this.performance.lastExecution = Date.now();
        
        // Calculate resource usage (simplified)
        this.performance.resourceUsage = Math.min(
            (executionTime / 1000) / this.runningTasks.size || 1,
            1.0
        );
    }

    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor memory usage if available
        if (performance.memory) {
            setInterval(() => {
                const memory = performance.memory;
                console.log(`Memory usage: ${(memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100).toFixed(2)}%`);
            }, 60000);
        }
        
        // Monitor task queue health
        setInterval(() => {
            if (this.taskQueue.length > 100) {
                console.warn(`Task queue is large: ${this.taskQueue.length} tasks pending`);
            }
            
            if (this.runningTasks.size > this.maxConcurrentTasks) {
                console.warn(`Too many concurrent tasks: ${this.runningTasks.size}`);
            }
        }, 30000);
    }

    /**
     * Setup Chrome extension integration
     */
    setupChromeIntegration() {
        // Listen for extension messages
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.type === 'monitoring_command') {
                this.handleChromeCommand(request.command, request.data)
                    .then(result => sendResponse({ success: true, data: result }))
                    .catch(error => sendResponse({ success: false, error: error.message }));
                
                return true; // Indicates async response
            }
        });
        
        // Background script lifecycle management
        if (chrome.runtime.onStartup) {
            chrome.runtime.onStartup.addListener(() => {
                console.log('Extension startup - initializing monitoring');
                this.start();
            });
        }
        
        if (chrome.runtime.onSuspend) {
            chrome.runtime.onSuspend.addListener(() => {
                console.log('Extension suspend - stopping monitoring');
                this.stop();
            });
        }
    }

    /**
     * Handle commands from Chrome extension
     */
    async handleChromeCommand(command, data) {
        switch (command) {
            case 'start':
                this.start();
                return { status: 'started' };
                
            case 'stop':
                this.stop();
                return { status: 'stopped' };
                
            case 'status':
                return this.getSchedulerStatus();
                
            case 'force_check':
                if (data.directoryId) {
                    await this.forceDirectoryCheck(data.directoryId);
                    return { status: 'check_initiated' };
                }
                throw new Error('Directory ID required for force check');
                
            case 'adjust_frequency':
                this.adjustSchedulingConfiguration(data);
                return { status: 'frequency_adjusted' };
                
            default:
                throw new Error(`Unknown command: ${command}`);
        }
    }

    /**
     * Force immediate check of specific directory
     */
    async forceDirectoryCheck(directoryId) {
        const directory = this.healthMonitor.directories.find(d => d.id === directoryId);
        if (!directory) {
            throw new Error(`Directory not found: ${directoryId}`);
        }
        
        // Add high priority immediate task
        this.addTask({
            type: 'directory_check',
            directoryId: directoryId,
            directory: directory,
            priority: 'high',
            scheduledTime: Date.now(),
            estimatedDuration: this.estimateTaskDuration(directory)
        });
    }

    /**
     * Adjust scheduling configuration
     */
    adjustSchedulingConfiguration(config) {
        if (config.intervals) {
            Object.assign(this.scheduleConfig, config.intervals);
        }
        
        if (config.resourceLimits) {
            this.maxResourceUsage = config.resourceLimits.maxResourceUsage || this.maxResourceUsage;
            this.maxConcurrentTasks = config.resourceLimits.maxConcurrentTasks || this.maxConcurrentTasks;
        }
        
        // Save configuration
        this.saveConfiguration();
    }

    /**
     * Get scheduler status
     */
    getSchedulerStatus() {
        return {
            isRunning: this.isRunning,
            taskQueue: {
                pending: this.taskQueue.length,
                running: this.runningTasks.size,
                nextTask: this.taskQueue[0] || null
            },
            performance: {
                ...this.performance,
                resourceUsage: Math.round(this.performance.resourceUsage * 10000) / 100 + '%',
                avgExecutionTime: Math.round(this.performance.avgExecutionTime) + 'ms'
            },
            configuration: {
                maxConcurrentTasks: this.maxConcurrentTasks,
                maxResourceUsage: Math.round(this.maxResourceUsage * 10000) / 100 + '%',
                scheduleConfig: this.scheduleConfig
            }
        };
    }

    /**
     * Clear all scheduled tasks and intervals
     */
    clearAllSchedules() {
        // Clear task queue
        this.taskQueue = [];
        
        // Note: In a real implementation, you would track and clear
        // all setTimeout and setInterval IDs
    }

    /**
     * Cancel all running tasks
     */
    cancelRunningTasks() {
        this.runningTasks.forEach((task, taskId) => {
            console.log(`Cancelling running task: ${taskId}`);
        });
        
        this.runningTasks.clear();
    }

    /**
     * Load scheduler configuration from storage
     */
    async loadConfiguration() {
        try {
            if (typeof localStorage !== 'undefined') {
                const saved = localStorage.getItem('scheduler_config');
                if (saved) {
                    const config = JSON.parse(saved);
                    Object.assign(this.scheduleConfig, config.scheduleConfig || {});
                    this.maxResourceUsage = config.maxResourceUsage || this.maxResourceUsage;
                    this.maxConcurrentTasks = config.maxConcurrentTasks || this.maxConcurrentTasks;
                }
            }
        } catch (error) {
            console.warn('Failed to load scheduler configuration:', error);
        }
    }

    /**
     * Save scheduler configuration to storage
     */
    saveConfiguration() {
        try {
            if (typeof localStorage !== 'undefined') {
                const config = {
                    scheduleConfig: this.scheduleConfig,
                    maxResourceUsage: this.maxResourceUsage,
                    maxConcurrentTasks: this.maxConcurrentTasks,
                    lastSaved: Date.now()
                };
                
                localStorage.setItem('scheduler_config', JSON.stringify(config));
            }
        } catch (error) {
            console.warn('Failed to save scheduler configuration:', error);
        }
    }

    /**
     * Start monitoring with Chrome extension integration
     */
    startWithExtensionIntegration() {
        // Register with Chrome alarms API for persistent scheduling
        if (typeof chrome !== 'undefined' && chrome.alarms) {
            chrome.alarms.create('directory_monitoring', {
                delayInMinutes: 1,
                periodInMinutes: 5
            });
            
            chrome.alarms.onAlarm.addListener((alarm) => {
                if (alarm.name === 'directory_monitoring') {
                    this.scheduleDirectoryTasks();
                }
            });
        }
        
        this.start();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MonitoringScheduler;
} else if (typeof window !== 'undefined') {
    window.MonitoringScheduler = MonitoringScheduler;
}