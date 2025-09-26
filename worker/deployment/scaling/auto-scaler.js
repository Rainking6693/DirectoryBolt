#!/usr/bin/env node

/**
 * DirectoryBolt AutoBolt Worker Auto-Scaling Controller
 * 
 * Monitors queue size, worker performance, and system resources
 * Automatically scales worker containers up/down based on demand
 * Integrates with Docker Compose for container management
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const redis = require('redis');
const axios = require('axios');

class AutoBoltScaler {
    constructor() {
        this.config = {
            // Scaling Thresholds
            minWorkers: parseInt(process.env.MIN_WORKERS) || 2,
            maxWorkers: parseInt(process.env.MAX_WORKERS) || 8,
            scaleUpThreshold: parseInt(process.env.SCALE_UP_THRESHOLD) || 10,
            scaleDownThreshold: parseInt(process.env.SCALE_DOWN_THRESHOLD) || 2,
            cpuThreshold: parseInt(process.env.CPU_THRESHOLD) || 80,
            memoryThreshold: parseInt(process.env.MEMORY_THRESHOLD) || 85,
            
            // Timing Configuration
            checkInterval: 30000, // 30 seconds
            scaleUpCooldown: 300000, // 5 minutes
            scaleDownCooldown: 600000, // 10 minutes
            
            // API Configuration
            orchestratorUrl: process.env.ORCHESTRATOR_URL,
            scalingAuthToken: process.env.SCALING_AUTH_TOKEN,
            redisUrl: process.env.REDIS_URL || 'redis://localhost:6379'
        };
        
        this.state = {
            currentWorkers: this.config.minWorkers,
            lastScaleUp: 0,
            lastScaleDown: 0,
            scalingInProgress: false
        };
        
        this.redis = null;
    }
    
    /**
     * Initialize the auto-scaler
     */
    async initialize() {
        console.log('🔧 Initializing AutoBolt Auto-Scaler...');
        
        try {
            // Connect to Redis
            this.redis = redis.createClient({ url: this.config.redisUrl });
            await this.redis.connect();
            console.log('✅ Connected to Redis');
            
            // Get current worker count
            this.state.currentWorkers = await this.getCurrentWorkerCount();
            console.log(`📊 Current workers: ${this.state.currentWorkers}`);
            
            console.log('✅ Auto-scaler initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize auto-scaler:', error);
            throw error;
        }
    }
    
    /**
     * Start the auto-scaling monitoring loop
     */
    async startScaling() {
        console.log('🔄 Starting auto-scaling monitoring...');
        
        while (true) {
            try {
                await this.performScalingCheck();
                await new Promise(resolve => setTimeout(resolve, this.config.checkInterval));
            } catch (error) {
                console.error('❌ Error in scaling loop:', error);
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }
    }
    
    /**
     * Perform scaling decision based on metrics
     */
    async performScalingCheck() {
        if (this.state.scalingInProgress) {
            console.log('⏳ Scaling already in progress, skipping check...');
            return;
        }
        
        try {
            // Gather metrics
            const metrics = await this.gatherMetrics();
            console.log('📊 Scaling metrics:', metrics);
            
            // Make scaling decision
            const decision = await this.makeScalingDecision(metrics);
            
            if (decision.action === 'scale_up') {
                await this.scaleUp(decision.targetWorkers);
            } else if (decision.action === 'scale_down') {
                await this.scaleDown(decision.targetWorkers);
            } else {
                console.log('✅ No scaling action needed');
            }
            
        } catch (error) {
            console.error('❌ Scaling check failed:', error);
        }
    }
    
    /**
     * Gather metrics for scaling decision
     */
    async gatherMetrics() {
        const metrics = {
            queueSize: 0,
            activeJobs: 0,
            workerStats: [],
            systemLoad: {},
            timestamp: new Date()
        };
        
        try {
            // Get queue size from orchestrator
            const queueResponse = await axios.get(
                `${this.config.orchestratorUrl}/autobolt-status`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.config.scalingAuthToken}`
                    },
                    timeout: 5000
                }
            );
            
            if (queueResponse.data) {
                metrics.queueSize = queueResponse.data.pendingJobs || 0;
                metrics.activeJobs = queueResponse.data.processingJobs || 0;
            }
        } catch (error) {
            console.warn('⚠️  Failed to get queue metrics:', error.message);
        }
        
        try {
            // Get worker performance stats
            metrics.workerStats = await this.getWorkerStats();
        } catch (error) {
            console.warn('⚠️  Failed to get worker stats:', error.message);
        }
        
        try {
            // Get system load
            metrics.systemLoad = await this.getSystemLoad();
        } catch (error) {
            console.warn('⚠️  Failed to get system load:', error.message);
        }
        
        return metrics;
    }
    
    /**
     * Make scaling decision based on metrics
     */
    async makeScalingDecision(metrics) {
        const now = Date.now();
        
        // Calculate average resource usage
        const avgCpu = metrics.workerStats.length > 0 
            ? metrics.workerStats.reduce((sum, w) => sum + (w.cpuUsage || 0), 0) / metrics.workerStats.length
            : 0;
            
        const avgMemory = metrics.workerStats.length > 0 
            ? metrics.workerStats.reduce((sum, w) => sum + (w.memoryUsage || 0), 0) / metrics.workerStats.length
            : 0;
        
        // Scale up conditions
        const shouldScaleUp = (
            metrics.queueSize >= this.config.scaleUpThreshold ||
            avgCpu > this.config.cpuThreshold ||
            avgMemory > this.config.memoryThreshold
        ) && (
            this.state.currentWorkers < this.config.maxWorkers &&
            (now - this.state.lastScaleUp) > this.config.scaleUpCooldown
        );
        
        // Scale down conditions
        const shouldScaleDown = (
            metrics.queueSize <= this.config.scaleDownThreshold &&
            avgCpu < 30 && // Low CPU usage
            avgMemory < 50 // Low memory usage
        ) && (
            this.state.currentWorkers > this.config.minWorkers &&
            (now - this.state.lastScaleDown) > this.config.scaleDownCooldown
        );
        
        if (shouldScaleUp) {
            const targetWorkers = Math.min(
                this.state.currentWorkers + Math.ceil(metrics.queueSize / 5),
                this.config.maxWorkers
            );
            
            return {
                action: 'scale_up',
                targetWorkers,
                reason: `Queue: ${metrics.queueSize}, CPU: ${avgCpu.toFixed(1)}%, Memory: ${avgMemory.toFixed(1)}%`
            };
        }
        
        if (shouldScaleDown) {
            const targetWorkers = Math.max(
                this.state.currentWorkers - 1,
                this.config.minWorkers
            );
            
            return {
                action: 'scale_down',
                targetWorkers,
                reason: `Low load - Queue: ${metrics.queueSize}, CPU: ${avgCpu.toFixed(1)}%, Memory: ${avgMemory.toFixed(1)}%`
            };
        }
        
        return {
            action: 'none',
            reason: `Stable - Queue: ${metrics.queueSize}, Workers: ${this.state.currentWorkers}, CPU: ${avgCpu.toFixed(1)}%, Memory: ${avgMemory.toFixed(1)}%`
        };
    }
    
    /**
     * Scale up workers
     */
    async scaleUp(targetWorkers) {
        console.log(`📈 Scaling up from ${this.state.currentWorkers} to ${targetWorkers} workers...`);
        this.state.scalingInProgress = true;
        
        try {
            const workersToAdd = targetWorkers - this.state.currentWorkers;
            
            for (let i = 0; i < workersToAdd; i++) {
                const workerNumber = this.state.currentWorkers + i + 1;
                await this.startWorker(workerNumber);
                
                // Wait between starting workers to avoid overwhelming the system
                if (i < workersToAdd - 1) {
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
            
            this.state.currentWorkers = targetWorkers;
            this.state.lastScaleUp = Date.now();
            
            console.log(`✅ Successfully scaled up to ${targetWorkers} workers`);
            
        } catch (error) {
            console.error('❌ Scale up failed:', error);
        } finally {
            this.state.scalingInProgress = false;
        }
    }
    
    /**
     * Scale down workers
     */
    async scaleDown(targetWorkers) {
        console.log(`📉 Scaling down from ${this.state.currentWorkers} to ${targetWorkers} workers...`);
        this.state.scalingInProgress = true;
        
        try {
            const workersToRemove = this.state.currentWorkers - targetWorkers;
            
            for (let i = 0; i < workersToRemove; i++) {
                const workerNumber = this.state.currentWorkers - i;
                await this.stopWorker(workerNumber);
                
                // Wait between stopping workers
                if (i < workersToRemove - 1) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
            
            this.state.currentWorkers = targetWorkers;
            this.state.lastScaleDown = Date.now();
            
            console.log(`✅ Successfully scaled down to ${targetWorkers} workers`);
            
        } catch (error) {
            console.error('❌ Scale down failed:', error);
        } finally {
            this.state.scalingInProgress = false;
        }
    }
    
    /**
     * Get current worker count from Docker
     */
    async getCurrentWorkerCount() {
        try {
            const { stdout } = await execAsync('docker ps --filter name=autobolt-worker --format "{{.Names}}" | wc -l');
            return parseInt(stdout.trim()) || this.config.minWorkers;
        } catch (error) {
            console.warn('⚠️  Failed to get current worker count:', error.message);
            return this.config.minWorkers;
        }
    }
    
    /**
     * Start a new worker container
     */
    async startWorker(workerNumber) {
        const serviceName = `autobolt-worker-${workerNumber}`;
        console.log(`🚀 Starting worker: ${serviceName}`);
        
        try {
            // Use docker-compose to scale up
            await execAsync(`docker-compose -f worker/deployment/docker-compose.yml up -d --scale autobolt-worker-${workerNumber}=1`);
            console.log(`✅ Worker ${serviceName} started successfully`);
        } catch (error) {
            console.error(`❌ Failed to start worker ${serviceName}:`, error.message);
            throw error;
        }
    }
    
    /**
     * Stop a worker container gracefully
     */
    async stopWorker(workerNumber) {
        const serviceName = `autobolt-worker-${workerNumber}`;
        console.log(`🛑 Stopping worker: ${serviceName}`);
        
        try {
            // Gracefully stop the worker
            await execAsync(`docker-compose -f worker/deployment/docker-compose.yml stop ${serviceName}`);
            await execAsync(`docker-compose -f worker/deployment/docker-compose.yml rm -f ${serviceName}`);
            console.log(`✅ Worker ${serviceName} stopped successfully`);
        } catch (error) {
            console.error(`❌ Failed to stop worker ${serviceName}:`, error.message);
            throw error;
        }
    }
    
    /**
     * Get worker performance statistics
     */
    async getWorkerStats() {
        try {
            const { stdout } = await execAsync(`docker stats --no-stream --format "table {{.Container}}\\t{{.CPUPerc}}\\t{{.MemPerc}}" | grep autobolt-worker`);
            
            const stats = stdout.trim().split('\n').map(line => {
                const [container, cpu, memory] = line.split('\t');
                return {
                    container: container.trim(),
                    cpuUsage: parseFloat(cpu.replace('%', '')) || 0,
                    memoryUsage: parseFloat(memory.replace('%', '')) || 0
                };
            });
            
            return stats;
        } catch (error) {
            console.warn('⚠️  Failed to get worker stats:', error.message);
            return [];
        }
    }
    
    /**
     * Get system load metrics
     */
    async getSystemLoad() {
        try {
            // Get system load average
            const { stdout: loadAvg } = await execAsync('cat /proc/loadavg');
            const load = parseFloat(loadAvg.split(' ')[0]) || 0;
            
            // Get memory usage
            const { stdout: memInfo } = await execAsync('cat /proc/meminfo | grep -E "MemTotal|MemAvailable"');
            const memLines = memInfo.trim().split('\n');
            const memTotal = parseInt(memLines[0].match(/\d+/)[0]) * 1024;
            const memAvailable = parseInt(memLines[1].match(/\d+/)[0]) * 1024;
            const memUsed = memTotal - memAvailable;
            const memUsage = (memUsed / memTotal) * 100;
            
            return {
                loadAverage: load,
                memoryUsage: memUsage,
                memoryTotal: memTotal,
                memoryUsed: memUsed
            };
        } catch (error) {
            console.warn('⚠️  Failed to get system load:', error.message);
            return {};
        }
    }
}

// Main execution
if (require.main === module) {
    const scaler = new AutoBoltScaler();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Received SIGINT, shutting down auto-scaler...');
        process.exit(0);
    });
    
    process.on('SIGTERM', () => {
        console.log('\n🛑 Received SIGTERM, shutting down auto-scaler...');
        process.exit(0);
    });
    
    // Start the auto-scaler
    scaler.initialize()
        .then(() => {
            console.log('🚀 AutoBolt Auto-Scaler is running!');
            return scaler.startScaling();
        })
        .catch((error) => {
            console.error('❌ Failed to start auto-scaler:', error);
            process.exit(1);
        });
}

module.exports = AutoBoltScaler;