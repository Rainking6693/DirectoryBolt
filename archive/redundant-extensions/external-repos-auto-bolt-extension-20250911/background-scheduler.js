/**
 * AutoBolt Background Scheduler
 * Intelligent processing scheduler with package-based priority and resource management
 * 
 * This module handles:
 * - Intelligent scheduling based on package tiers and SLAs
 * - Resource allocation and load balancing
 * - Processing windows and business hour optimization
 * - Queue prioritization and batch optimization
 * - Performance monitoring and auto-scaling
 */

class BackgroundScheduler {
    constructor(config = {}) {
        this.config = {
            enableIntelligentScheduling: config.enableIntelligentScheduling !== false,
            enableLoadBalancing: config.enableLoadBalancing !== false,
            enableAutoScaling: config.enableAutoScaling !== false,
            maxConcurrentJobs: config.maxConcurrentJobs || 10,
            schedulingInterval: config.schedulingInterval || 30000, // 30 seconds
            performanceCheckInterval: config.performanceCheckInterval || 60000, // 1 minute
            resourceCheckInterval: config.resourceCheckInterval || 15000, // 15 seconds
            ...config
        };

        // Package-specific scheduling configurations
        this.packageScheduling = {
            'Enterprise': {
                priority: 1,
                processingWindow: '24/7', // Always available
                maxConcurrent: 5,
                preferredStartTime: 'immediate',
                slaMinutes: 15,
                resourceAllocation: 0.4, // 40% of total resources
                urgencyMultiplier: 3.0,
                loadThreshold: 0.8
            },
            'Professional': {
                priority: 2,
                processingWindow: 'business-hours-extended', // 7am-9pm
                maxConcurrent: 3,
                preferredStartTime: 'within-15-min',
                slaMinutes: 120,
                resourceAllocation: 0.3, // 30% of total resources
                urgencyMultiplier: 2.0,
                loadThreshold: 0.7
            },
            'Growth': {
                priority: 3,
                processingWindow: 'business-hours', // 9am-6pm
                maxConcurrent: 2,
                preferredStartTime: 'within-1-hour',
                slaMinutes: 480,
                resourceAllocation: 0.2, // 20% of total resources
                urgencyMultiplier: 1.5,
                loadThreshold: 0.6
            },
            'Starter': {
                priority: 4,
                processingWindow: 'off-peak', // 10pm-6am
                maxConcurrent: 1,
                preferredStartTime: 'off-peak-hours',
                slaMinutes: 960,
                resourceAllocation: 0.1, // 10% of total resources
                urgencyMultiplier: 1.0,
                loadThreshold: 0.5
            }
        };

        // Processing windows configuration
        this.processingWindows = {
            '24/7': { start: 0, end: 24, days: [0, 1, 2, 3, 4, 5, 6] },
            'business-hours-extended': { start: 7, end: 21, days: [1, 2, 3, 4, 5] },
            'business-hours': { start: 9, end: 18, days: [1, 2, 3, 4, 5] },
            'off-peak': { start: 22, end: 6, days: [0, 1, 2, 3, 4, 5, 6] }
        };

        // Scheduler state
        this.schedulerState = {
            isActive: false,
            currentLoad: 0,
            activeJobs: new Map(),
            scheduledJobs: new Map(),
            completedJobs: new Map(),
            resourceUsage: {
                cpu: 0,
                memory: 0,
                network: 0
            },
            performance: {
                throughput: 0,
                averageProcessingTime: 0,
                successRate: 0,
                queueLatency: 0
            }
        };

        // Job queues by priority
        this.jobQueues = {
            urgent: [], // SLA violations or Enterprise urgent
            high: [],   // Enterprise and Professional
            medium: [], // Growth
            low: []     // Starter
        };

        // Resource allocation tracking
        this.resourceAllocation = new Map();
        
        // Performance metrics
        this.performanceMetrics = {
            jobsProcessed: 0,
            jobsCompleted: 0,
            jobsFailed: 0,
            averageWaitTime: 0,
            averageProcessingTime: 0,
            resourceEfficiency: 0,
            slaCompliance: new Map()
        };

        // Load balancing
        this.loadBalancer = {
            processorInstances: new Map(),
            loadDistribution: new Map(),
            failoverTargets: []
        };
    }

    /**
     * Initialize the background scheduler
     */
    async initialize() {
        console.log('🚀 Initializing Background Scheduler...');

        try {
            // Initialize resource monitoring
            await this.initializeResourceMonitoring();

            // Setup processing windows
            this.setupProcessingWindows();

            // Initialize load balancer
            this.initializeLoadBalancer();

            // Start scheduler intervals
            this.startSchedulerIntervals();

            // Load previous performance data
            await this.loadPerformanceData();

            console.log('✅ Background Scheduler initialized successfully');
            return true;

        } catch (error) {
            console.error('❌ Failed to initialize Background Scheduler:', error);
            throw error;
        }
    }

    /**
     * Start the background scheduler
     */
    async startScheduler() {
        if (this.schedulerState.isActive) {
            console.log('⚠️ Scheduler is already active');
            return;
        }

        console.log('▶️ Starting Background Scheduler...');
        this.schedulerState.isActive = true;

        try {
            // Start main scheduling loop
            this.schedulingLoop();

            console.log('✅ Background Scheduler started successfully');
            
        } catch (error) {
            this.schedulerState.isActive = false;
            console.error('❌ Failed to start scheduler:', error);
            throw error;
        }
    }

    /**
     * Stop the background scheduler
     */
    async stopScheduler() {
        if (!this.schedulerState.isActive) {
            console.log('⚠️ Scheduler is not active');
            return;
        }

        console.log('⏹️ Stopping Background Scheduler...');
        this.schedulerState.isActive = false;

        // Wait for active jobs to complete or timeout
        await this.waitForActiveJobs(300000); // 5 minute timeout

        console.log('✅ Background Scheduler stopped');
    }

    /**
     * Main scheduling loop
     */
    async schedulingLoop() {
        while (this.schedulerState.isActive) {
            try {
                // Check system health and load
                await this.checkSystemHealth();

                // Update resource usage
                await this.updateResourceUsage();

                // Process job queues based on priority and availability
                await this.processJobQueues();

                // Optimize resource allocation
                if (this.config.enableLoadBalancing) {
                    await this.optimizeResourceAllocation();
                }

                // Check for SLA violations and urgent items
                await this.checkSLAViolations();

                // Auto-scale if enabled
                if (this.config.enableAutoScaling) {
                    await this.autoScaleResources();
                }

                // Wait for next scheduling cycle
                await this.delay(this.config.schedulingInterval);

            } catch (error) {
                console.error('❌ Scheduling loop error:', error);
                await this.delay(5000); // Wait 5 seconds before retry
            }
        }
    }

    /**
     * Schedule a new job with intelligent prioritization
     */
    async scheduleJob(jobData) {
        const job = {
            id: this.generateJobId(),
            ...jobData,
            scheduledAt: Date.now(),
            status: 'scheduled',
            priority: this.calculateJobPriority(jobData),
            estimatedProcessingTime: this.estimateProcessingTime(jobData),
            resourceRequirements: this.calculateResourceRequirements(jobData)
        };

        console.log(`📅 Scheduling job ${job.id} (${job.packageType}) with priority ${job.priority}`);

        // Determine which queue to use
        const queueLevel = this.getQueueLevel(job);
        this.jobQueues[queueLevel].push(job);

        // Store in scheduled jobs
        this.scheduledJobs.set(job.id, job);

        // Sort queue by priority and scheduling logic
        this.sortJobQueue(queueLevel);

        // If this is urgent, trigger immediate processing
        if (queueLevel === 'urgent' || this.shouldProcessImmediately(job)) {
            await this.processUrgentJob(job);
        }

        return job.id;
    }

    /**
     * Process job queues based on availability and priority
     */
    async processJobQueues() {
        const availableSlots = this.getAvailableProcessingSlots();
        
        if (availableSlots <= 0) {
            return; // No capacity available
        }

        console.log(`🎯 Processing job queues with ${availableSlots} available slots`);

        // Process queues in priority order
        const queueOrder = ['urgent', 'high', 'medium', 'low'];
        let processedJobs = 0;

        for (const queueLevel of queueOrder) {
            if (processedJobs >= availableSlots) break;

            const queue = this.jobQueues[queueLevel];
            const slotsForQueue = Math.min(queue.length, availableSlots - processedJobs);

            if (slotsForQueue > 0) {
                const jobsToProcess = queue.splice(0, slotsForQueue);
                
                for (const job of jobsToProcess) {
                    if (this.canProcessJobNow(job)) {
                        await this.startJobProcessing(job);
                        processedJobs++;
                    } else {
                        // Put job back in queue if can't process now
                        queue.unshift(job);
                        break;
                    }
                }
            }
        }
    }

    /**
     * Check if job can be processed now based on processing windows and resources
     */
    canProcessJobNow(job) {
        const packageConfig = this.packageScheduling[job.packageType];
        
        // Check processing window
        if (!this.isInProcessingWindow(packageConfig.processingWindow)) {
            return false;
        }

        // Check resource availability
        if (!this.hasRequiredResources(job.resourceRequirements)) {
            return false;
        }

        // Check concurrent job limits for package type
        const activeJobsForPackage = Array.from(this.schedulerState.activeJobs.values())
            .filter(activeJob => activeJob.packageType === job.packageType).length;

        if (activeJobsForPackage >= packageConfig.maxConcurrent) {
            return false;
        }

        return true;
    }

    /**
     * Start processing a job
     */
    async startJobProcessing(job) {
        console.log(`🚀 Starting job processing: ${job.id} (${job.packageType})`);

        job.status = 'processing';
        job.startedAt = Date.now();
        
        // Move from scheduled to active
        this.scheduledJobs.delete(job.id);
        this.schedulerState.activeJobs.set(job.id, job);

        // Allocate resources
        await this.allocateJobResources(job);

        try {
            // Start the actual processing (this would integrate with queue processor)
            const result = await this.executeJob(job);
            
            // Handle completion
            await this.completeJob(job, result);
            
        } catch (error) {
            // Handle failure
            await this.failJob(job, error);
        }
    }

    /**
     * Execute the actual job processing
     */
    async executeJob(job) {
        // This would integrate with the actual queue processor
        console.log(`⚡ Executing job: ${job.id}`);

        // Simulate job execution based on package type
        const packageConfig = this.packageScheduling[job.packageType];
        const processingTime = job.estimatedProcessingTime;

        // Add some variability to processing time
        const actualProcessingTime = processingTime + (Math.random() - 0.5) * processingTime * 0.3;
        
        // Simulate processing with periodic updates
        const updateInterval = Math.max(1000, actualProcessingTime / 10);
        let elapsed = 0;

        while (elapsed < actualProcessingTime && this.schedulerState.isActive) {
            await this.delay(updateInterval);
            elapsed += updateInterval;
            
            // Update job progress
            job.progress = Math.min(100, (elapsed / actualProcessingTime) * 100);
            
            // Update resource usage
            await this.updateJobResourceUsage(job, elapsed / actualProcessingTime);
        }

        // Simulate success/failure based on package tier
        const successRate = this.getPackageSuccessRate(job.packageType);
        const isSuccessful = Math.random() < successRate;

        return {
            success: isSuccessful,
            processingTime: elapsed,
            resourcesUsed: job.resourceRequirements,
            result: isSuccessful ? 'Job completed successfully' : 'Job failed during processing'
        };
    }

    /**
     * Complete a job successfully
     */
    async completeJob(job, result) {
        console.log(`✅ Job completed: ${job.id}`);

        job.status = 'completed';
        job.completedAt = Date.now();
        job.result = result;
        job.actualProcessingTime = result.processingTime;

        // Move to completed jobs
        this.schedulerState.activeJobs.delete(job.id);
        this.schedulerState.completedJobs.set(job.id, job);

        // Release allocated resources
        await this.releaseJobResources(job);

        // Update performance metrics
        this.updatePerformanceMetrics(job, true);

        // Update SLA compliance
        this.updateSLACompliance(job, true);
    }

    /**
     * Handle job failure
     */
    async failJob(job, error) {
        console.log(`❌ Job failed: ${job.id} - ${error.message}`);

        job.status = 'failed';
        job.failedAt = Date.now();
        job.error = error.message;

        // Move to completed jobs (with failure status)
        this.schedulerState.activeJobs.delete(job.id);
        this.schedulerState.completedJobs.set(job.id, job);

        // Release allocated resources
        await this.releaseJobResources(job);

        // Update performance metrics
        this.updatePerformanceMetrics(job, false);

        // Update SLA compliance
        this.updateSLACompliance(job, false);

        // Check if job should be retried
        if (this.shouldRetryJob(job)) {
            await this.scheduleJobRetry(job);
        }
    }

    /**
     * Priority and scheduling calculations
     */
    calculateJobPriority(jobData) {
        const packageConfig = this.packageScheduling[jobData.packageType];
        let priority = packageConfig.priority;

        // Calculate urgency based on time waiting
        const waitTime = Date.now() - (jobData.queueAddedAt || Date.now());
        const slaThreshold = packageConfig.slaMinutes * 60 * 1000;
        const urgencyMultiplier = Math.min(5, (waitTime / slaThreshold) * packageConfig.urgencyMultiplier);

        // Adjust priority based on urgency
        priority += urgencyMultiplier;

        // Add randomization to prevent starvation
        priority += Math.random() * 0.1;

        return priority;
    }

    estimateProcessingTime(jobData) {
        const baseTimePerDirectory = {
            'Enterprise': 8000,   // 8 seconds
            'Professional': 5000, // 5 seconds
            'Growth': 3000,       // 3 seconds
            'Starter': 1500       // 1.5 seconds
        };

        const baseTime = baseTimePerDirectory[jobData.packageType] || 3000;
        const directoryCount = jobData.directoryCount || 10;
        
        // Add overhead for setup and cleanup
        const overhead = 5000; // 5 seconds
        
        return (baseTime * directoryCount) + overhead;
    }

    calculateResourceRequirements(jobData) {
        const packageConfig = this.packageScheduling[jobData.packageType];
        const baseRequirements = {
            cpu: 0.1,
            memory: 50, // MB
            network: 10 // MB/s
        };

        return {
            cpu: baseRequirements.cpu * packageConfig.resourceAllocation * 2.5,
            memory: baseRequirements.memory * (jobData.directoryCount || 10),
            network: baseRequirements.network * packageConfig.resourceAllocation
        };
    }

    getQueueLevel(job) {
        const priority = job.priority;
        const packageConfig = this.packageScheduling[job.packageType];

        // Check for SLA urgency
        const waitTime = Date.now() - (job.queueAddedAt || Date.now());
        const slaThreshold = packageConfig.slaMinutes * 60 * 1000;

        if (waitTime > slaThreshold * 0.8) { // 80% of SLA time
            return 'urgent';
        }

        // Map package types to queue levels
        switch (job.packageType) {
            case 'Enterprise':
                return priority > 4 ? 'urgent' : 'high';
            case 'Professional':
                return priority > 3 ? 'high' : 'medium';
            case 'Growth':
                return 'medium';
            case 'Starter':
                return 'low';
            default:
                return 'low';
        }
    }

    sortJobQueue(queueLevel) {
        this.jobQueues[queueLevel].sort((a, b) => {
            // Primary sort: priority (higher priority first)
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            
            // Secondary sort: scheduled time (earlier first)
            return a.scheduledAt - b.scheduledAt;
        });
    }

    /**
     * Processing window management
     */
    isInProcessingWindow(windowType) {
        const window = this.processingWindows[windowType];
        if (!window) return true; // Default to always available

        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay(); // 0 = Sunday

        // Check if current day is allowed
        if (!window.days.includes(currentDay)) {
            return false;
        }

        // Handle overnight windows (e.g., 22:00 - 06:00)
        if (window.start > window.end) {
            return currentHour >= window.start || currentHour < window.end;
        } else {
            return currentHour >= window.start && currentHour < window.end;
        }
    }

    /**
     * Resource management
     */
    async allocateJobResources(job) {
        const requirements = job.resourceRequirements;
        
        // Track resource allocation
        this.resourceAllocation.set(job.id, {
            allocated: requirements,
            startTime: Date.now()
        });

        // Update current resource usage
        this.schedulerState.resourceUsage.cpu += requirements.cpu;
        this.schedulerState.resourceUsage.memory += requirements.memory;
        this.schedulerState.resourceUsage.network += requirements.network;

        console.log(`🔧 Allocated resources for job ${job.id}:`, requirements);
    }

    async releaseJobResources(job) {
        const allocation = this.resourceAllocation.get(job.id);
        
        if (allocation) {
            // Update current resource usage
            this.schedulerState.resourceUsage.cpu -= allocation.allocated.cpu;
            this.schedulerState.resourceUsage.memory -= allocation.allocated.memory;
            this.schedulerState.resourceUsage.network -= allocation.allocated.network;

            // Remove allocation tracking
            this.resourceAllocation.delete(job.id);

            console.log(`🔧 Released resources for job ${job.id}`);
        }
    }

    hasRequiredResources(requirements) {
        const current = this.schedulerState.resourceUsage;
        const limits = {
            cpu: 0.8, // 80% CPU utilization limit
            memory: 8192, // 8GB memory limit
            network: 100 // 100 MB/s network limit
        };

        return (
            (current.cpu + requirements.cpu) <= limits.cpu &&
            (current.memory + requirements.memory) <= limits.memory &&
            (current.network + requirements.network) <= limits.network
        );
    }

    /**
     * System health and performance monitoring
     */
    async checkSystemHealth() {
        // Get system metrics (in a real implementation, this would use actual system APIs)
        const metrics = await this.getSystemMetrics();
        
        // Update scheduler state
        this.schedulerState.currentLoad = this.calculateSystemLoad(metrics);
        
        // Check if system is overloaded
        if (this.schedulerState.currentLoad > 0.9) {
            console.warn('⚠️ System overload detected, throttling job processing');
            await this.throttleJobProcessing();
        }
    }

    async getSystemMetrics() {
        // Simulate system metrics (in real implementation, use system APIs)
        return {
            cpuUsage: 0.2 + Math.random() * 0.3, // 20-50% CPU
            memoryUsage: 2048 + Math.random() * 2048, // 2-4GB memory
            networkUsage: 10 + Math.random() * 20, // 10-30 MB/s
            activeConnections: Math.floor(50 + Math.random() * 100)
        };
    }

    calculateSystemLoad(metrics) {
        const cpuWeight = 0.4;
        const memoryWeight = 0.3;
        const networkWeight = 0.3;

        const cpuLoad = metrics.cpuUsage;
        const memoryLoad = metrics.memoryUsage / 8192; // Assuming 8GB limit
        const networkLoad = metrics.networkUsage / 100; // Assuming 100MB/s limit

        return (cpuLoad * cpuWeight) + (memoryLoad * memoryWeight) + (networkLoad * networkWeight);
    }

    async updateResourceUsage() {
        // Update real-time resource usage tracking
        const currentUsage = {
            cpu: this.schedulerState.resourceUsage.cpu,
            memory: this.schedulerState.resourceUsage.memory,
            network: this.schedulerState.resourceUsage.network
        };

        // Log resource usage for analytics
        console.log('📊 Current resource usage:', currentUsage);
    }

    async updateJobResourceUsage(job, progressRatio) {
        // Update job-specific resource usage based on progress
        const allocation = this.resourceAllocation.get(job.id);
        if (allocation) {
            // Resources typically increase during processing
            const scalingFactor = 0.5 + (progressRatio * 0.5); // 0.5 to 1.0
            allocation.currentUsage = {
                cpu: allocation.allocated.cpu * scalingFactor,
                memory: allocation.allocated.memory * scalingFactor,
                network: allocation.allocated.network * scalingFactor
            };
        }
    }

    /**
     * SLA monitoring and compliance
     */
    async checkSLAViolations() {
        const now = Date.now();

        // Check scheduled jobs for SLA violations
        for (const job of this.scheduledJobs.values()) {
            const packageConfig = this.packageScheduling[job.packageType];
            const slaThreshold = packageConfig.slaMinutes * 60 * 1000;
            const waitTime = now - job.scheduledAt;

            if (waitTime > slaThreshold) {
                console.warn(`⚠️ SLA violation detected for job ${job.id} (${job.packageType})`);
                await this.handleSLAViolation(job);
            }
        }
    }

    async handleSLAViolation(job) {
        // Move job to urgent queue
        const currentQueue = this.getQueueLevel(job);
        const jobIndex = this.jobQueues[currentQueue].findIndex(j => j.id === job.id);
        
        if (jobIndex !== -1) {
            this.jobQueues[currentQueue].splice(jobIndex, 1);
            this.jobQueues.urgent.unshift(job);
            
            console.log(`🚨 Moved job ${job.id} to urgent queue due to SLA violation`);
        }

        // Send SLA violation notification
        await this.sendSLAViolationNotification(job);
    }

    async sendSLAViolationNotification(job) {
        console.log(`📧 SLA violation notification sent for job ${job.id}`);
        
        // Implementation would integrate with notification system
        // For now, just log the violation
    }

    updateSLACompliance(job, success) {
        const packageType = job.packageType;
        const packageConfig = this.packageScheduling[packageType];
        
        if (!this.performanceMetrics.slaCompliance.has(packageType)) {
            this.performanceMetrics.slaCompliance.set(packageType, {
                total: 0,
                compliant: 0,
                violations: 0
            });
        }

        const compliance = this.performanceMetrics.slaCompliance.get(packageType);
        compliance.total++;

        const processingTime = (job.completedAt || job.failedAt) - job.scheduledAt;
        const slaThreshold = packageConfig.slaMinutes * 60 * 1000;

        if (success && processingTime <= slaThreshold) {
            compliance.compliant++;
        } else {
            compliance.violations++;
        }
    }

    /**
     * Auto-scaling and load balancing
     */
    async autoScaleResources() {
        const currentLoad = this.schedulerState.currentLoad;
        const queueSizes = Object.values(this.jobQueues).reduce((sum, queue) => sum + queue.length, 0);
        
        // Scale up if high load and large queue
        if (currentLoad > 0.8 && queueSizes > 20) {
            await this.scaleUp();
        }
        // Scale down if low load and small queue
        else if (currentLoad < 0.3 && queueSizes < 5) {
            await this.scaleDown();
        }
    }

    async scaleUp() {
        const currentMaxJobs = this.config.maxConcurrentJobs;
        const newMaxJobs = Math.min(currentMaxJobs + 2, 20); // Cap at 20 concurrent jobs

        if (newMaxJobs > currentMaxJobs) {
            this.config.maxConcurrentJobs = newMaxJobs;
            console.log(`📈 Scaled up: Max concurrent jobs increased to ${newMaxJobs}`);
        }
    }

    async scaleDown() {
        const currentMaxJobs = this.config.maxConcurrentJobs;
        const newMaxJobs = Math.max(currentMaxJobs - 1, 3); // Minimum of 3 concurrent jobs

        if (newMaxJobs < currentMaxJobs) {
            this.config.maxConcurrentJobs = newMaxJobs;
            console.log(`📉 Scaled down: Max concurrent jobs decreased to ${newMaxJobs}`);
        }
    }

    async optimizeResourceAllocation() {
        // Analyze current job distribution and resource usage
        const packageDistribution = this.analyzePackageDistribution();
        
        // Adjust resource allocations based on actual usage patterns
        for (const [packageType, stats] of Object.entries(packageDistribution)) {
            const config = this.packageScheduling[packageType];
            const actualUsage = stats.averageResourceUsage;
            const allocatedUsage = config.resourceAllocation;

            // Adjust allocation if there's significant variance
            if (Math.abs(actualUsage - allocatedUsage) > 0.1) {
                const newAllocation = (actualUsage + allocatedUsage) / 2;
                config.resourceAllocation = Math.max(0.05, Math.min(0.5, newAllocation));
                
                console.log(`🔧 Adjusted ${packageType} resource allocation to ${newAllocation.toFixed(2)}`);
            }
        }
    }

    analyzePackageDistribution() {
        const distribution = {};

        for (const job of this.schedulerState.completedJobs.values()) {
            if (!distribution[job.packageType]) {
                distribution[job.packageType] = {
                    count: 0,
                    totalResourceUsage: 0,
                    totalProcessingTime: 0
                };
            }

            const stats = distribution[job.packageType];
            stats.count++;
            stats.totalProcessingTime += job.actualProcessingTime || 0;
            
            // Calculate average resource usage if available
            const allocation = this.resourceAllocation.get(job.id);
            if (allocation && allocation.currentUsage) {
                stats.totalResourceUsage += allocation.currentUsage.cpu;
            }
        }

        // Calculate averages
        for (const stats of Object.values(distribution)) {
            if (stats.count > 0) {
                stats.averageResourceUsage = stats.totalResourceUsage / stats.count;
                stats.averageProcessingTime = stats.totalProcessingTime / stats.count;
            }
        }

        return distribution;
    }

    /**
     * Performance metrics and analytics
     */
    updatePerformanceMetrics(job, success) {
        this.performanceMetrics.jobsProcessed++;
        
        if (success) {
            this.performanceMetrics.jobsCompleted++;
        } else {
            this.performanceMetrics.jobsFailed++;
        }

        // Update processing time
        const processingTime = job.actualProcessingTime || 0;
        const totalJobs = this.performanceMetrics.jobsProcessed;
        const currentAvg = this.performanceMetrics.averageProcessingTime;
        
        this.performanceMetrics.averageProcessingTime = 
            ((currentAvg * (totalJobs - 1)) + processingTime) / totalJobs;

        // Update wait time
        const waitTime = (job.startedAt || Date.now()) - job.scheduledAt;
        const currentWaitAvg = this.performanceMetrics.averageWaitTime;
        
        this.performanceMetrics.averageWaitTime = 
            ((currentWaitAvg * (totalJobs - 1)) + waitTime) / totalJobs;

        // Calculate resource efficiency
        this.performanceMetrics.resourceEfficiency = 
            this.performanceMetrics.jobsCompleted / Math.max(1, this.config.maxConcurrentJobs);
    }

    /**
     * Utility methods
     */
    generateJobId() {
        return `job_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    getAvailableProcessingSlots() {
        return Math.max(0, this.config.maxConcurrentJobs - this.schedulerState.activeJobs.size);
    }

    shouldProcessImmediately(job) {
        return job.packageType === 'Enterprise' && job.priority > 5;
    }

    async processUrgentJob(job) {
        console.log(`🚨 Processing urgent job immediately: ${job.id}`);
        
        if (this.getAvailableProcessingSlots() > 0) {
            await this.startJobProcessing(job);
        } else {
            // Pre-empt a lower priority job if needed for Enterprise urgent jobs
            if (job.packageType === 'Enterprise') {
                await this.preemptLowerPriorityJob(job);
            }
        }
    }

    async preemptLowerPriorityJob(urgentJob) {
        // Find the lowest priority active job to preempt
        let jobToPreempt = null;
        let lowestPriority = Infinity;

        for (const activeJob of this.schedulerState.activeJobs.values()) {
            if (activeJob.packageType !== 'Enterprise' && activeJob.priority < lowestPriority) {
                lowestPriority = activeJob.priority;
                jobToPreempt = activeJob;
            }
        }

        if (jobToPreempt) {
            console.log(`🔄 Preempting job ${jobToPreempt.id} for urgent Enterprise job`);
            
            // Stop the current job and reschedule it
            await this.pauseJob(jobToPreempt);
            await this.scheduleJob(jobToPreempt);
            
            // Start the urgent job
            await this.startJobProcessing(urgentJob);
        }
    }

    async pauseJob(job) {
        console.log(`⏸️ Pausing job: ${job.id}`);
        
        job.status = 'paused';
        job.pausedAt = Date.now();
        
        // Release resources
        await this.releaseJobResources(job);
        
        // Move back to scheduled
        this.schedulerState.activeJobs.delete(job.id);
        this.scheduledJobs.set(job.id, job);
    }

    shouldRetryJob(job) {
        const maxRetries = 2;
        const currentRetries = job.retryCount || 0;
        
        return currentRetries < maxRetries && job.packageType !== 'Starter';
    }

    async scheduleJobRetry(job) {
        job.retryCount = (job.retryCount || 0) + 1;
        job.status = 'retry';
        
        const retryDelay = Math.pow(2, job.retryCount) * 60000; // Exponential backoff in minutes
        
        setTimeout(() => {
            this.scheduleJob(job);
        }, retryDelay);
        
        console.log(`🔄 Scheduled retry for job ${job.id} in ${retryDelay / 1000} seconds`);
    }

    getPackageSuccessRate(packageType) {
        const rates = {
            'Enterprise': 0.98,
            'Professional': 0.95,
            'Growth': 0.90,
            'Starter': 0.85
        };
        
        return rates[packageType] || 0.85;
    }

    async waitForActiveJobs(timeoutMs) {
        const startTime = Date.now();
        
        while (this.schedulerState.activeJobs.size > 0 && (Date.now() - startTime) < timeoutMs) {
            console.log(`⏳ Waiting for ${this.schedulerState.activeJobs.size} active jobs to complete...`);
            await this.delay(5000);
        }
    }

    async throttleJobProcessing() {
        // Temporarily reduce concurrent job limit
        const originalLimit = this.config.maxConcurrentJobs;
        this.config.maxConcurrentJobs = Math.max(1, Math.floor(originalLimit * 0.7));
        
        console.log(`🐌 Throttling: Reduced max concurrent jobs from ${originalLimit} to ${this.config.maxConcurrentJobs}`);
        
        // Restore after 5 minutes
        setTimeout(() => {
            this.config.maxConcurrentJobs = originalLimit;
            console.log(`⚡ Throttling released: Restored max concurrent jobs to ${originalLimit}`);
        }, 300000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Setup and initialization helpers
     */
    setupProcessingWindows() {
        // Validate and setup processing windows
        for (const [windowType, window] of Object.entries(this.processingWindows)) {
            if (window.start < 0 || window.start > 24 || window.end < 0 || window.end > 24) {
                console.warn(`⚠️ Invalid processing window: ${windowType}`);
            }
        }
        
        console.log('✅ Processing windows configured');
    }

    initializeLoadBalancer() {
        // Initialize load balancing components
        this.loadBalancer.processorInstances.set('primary', {
            id: 'primary',
            capacity: this.config.maxConcurrentJobs,
            currentLoad: 0,
            status: 'active'
        });
        
        console.log('⚖️ Load balancer initialized');
    }

    async initializeResourceMonitoring() {
        // Setup resource monitoring
        console.log('📊 Resource monitoring initialized');
    }

    startSchedulerIntervals() {
        // Performance monitoring interval
        this.performanceInterval = setInterval(async () => {
            await this.checkSystemHealth();
        }, this.config.performanceCheckInterval);

        // Resource monitoring interval
        this.resourceInterval = setInterval(async () => {
            await this.updateResourceUsage();
        }, this.config.resourceCheckInterval);

        console.log('⏰ Scheduler intervals started');
    }

    async loadPerformanceData() {
        try {
            const stored = await chrome.storage.local.get(['schedulerMetrics']);
            if (stored.schedulerMetrics) {
                Object.assign(this.performanceMetrics, stored.schedulerMetrics);
                console.log('📈 Performance data loaded');
            }
        } catch (error) {
            console.warn('⚠️ Could not load performance data:', error);
        }
    }

    /**
     * Public API methods
     */
    getSchedulerStatus() {
        return {
            isActive: this.schedulerState.isActive,
            currentLoad: this.schedulerState.currentLoad,
            activeJobs: this.schedulerState.activeJobs.size,
            scheduledJobs: this.scheduledJobs.size,
            completedJobs: this.schedulerState.completedJobs.size,
            queueSizes: {
                urgent: this.jobQueues.urgent.length,
                high: this.jobQueues.high.length,
                medium: this.jobQueues.medium.length,
                low: this.jobQueues.low.length
            },
            resourceUsage: this.schedulerState.resourceUsage,
            performance: this.performanceMetrics,
            timestamp: Date.now()
        };
    }

    getJobStatus(jobId) {
        return this.scheduledJobs.get(jobId) || 
               this.schedulerState.activeJobs.get(jobId) || 
               this.schedulerState.completedJobs.get(jobId) || null;
    }

    getQueueStatus() {
        return {
            urgent: this.jobQueues.urgent.length,
            high: this.jobQueues.high.length,
            medium: this.jobQueues.medium.length,
            low: this.jobQueues.low.length,
            total: Object.values(this.jobQueues).reduce((sum, queue) => sum + queue.length, 0)
        };
    }

    /**
     * Cleanup and shutdown
     */
    async shutdown() {
        console.log('🛑 Shutting down Background Scheduler...');
        
        await this.stopScheduler();
        
        // Clear intervals
        if (this.performanceInterval) clearInterval(this.performanceInterval);
        if (this.resourceInterval) clearInterval(this.resourceInterval);
        
        // Save performance data
        try {
            await chrome.storage.local.set({
                schedulerMetrics: this.performanceMetrics
            });
        } catch (error) {
            console.warn('⚠️ Could not save performance data:', error);
        }
        
        // Clear state
        this.scheduledJobs.clear();
        this.schedulerState.activeJobs.clear();
        this.schedulerState.completedJobs.clear();
        this.resourceAllocation.clear();
        
        console.log('✅ Background Scheduler shutdown complete');
    }
}

// Export for use in Chrome extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackgroundScheduler;
} else if (typeof window !== 'undefined') {
    window.BackgroundScheduler = BackgroundScheduler;
}