/**
 * AutoBolt Queue Manager - Optimized Popup Script
 * Balances enhanced features with performance optimization
 */

// SECURITY FIX: Secure Configuration (no hardcoded credentials)
const DEFAULT_CONFIG = {
    airtableBaseId: 'appZDNMzebkaOkLXo', // Public base ID
    airtableTableName: 'Sheet1', // Public table name
    airtableApiToken: null, // NEVER hardcode API tokens - must be configured
    maxConcurrentProcessors: 10,
    queuePollInterval: 30000, // 30 seconds
    apiTimeout: 10000 // 10 seconds
};

// Security warning for developers
console.warn('🔒 SECURITY: API tokens must be configured by users, never hardcoded!');

// Package tier configurations
const PACKAGE_TIERS = {
    enterprise: { priority: 1, sla: 0, color: '#6366f1' },
    professional: { priority: 2, sla: 15 * 60 * 1000, color: '#3b82f6' },
    growth: { priority: 3, sla: 60 * 60 * 1000, color: '#10b981' },
    starter: { priority: 4, sla: 4 * 60 * 60 * 1000, color: '#f59e0b' }
};

class AutoBoltQueueManager {
    constructor() {
        this.isProcessing = false;
        this.isPaused = false;
        this.currentCustomer = null;
        this.activeProcessors = 0;
        this.processingStats = {
            pending: 0,
            processing: 0,
            completed: 0,
            failed: 0,
            successRate: 0
        };
        this.packageQueues = {
            enterprise: [],
            professional: [],
            growth: [],
            starter: []
        };
        this.processingLog = [];
        this.config = { ...DEFAULT_CONFIG };
        this.pollInterval = null;
        
        this.init();
    }

    async init() {
        await this.loadConfiguration();
        this.bindEvents();
        this.updateUI();
        this.startQueuePolling();
        this.log('info', 'AutoBolt Queue Manager initialized');
    }

    bindEvents() {
        // Primary action buttons
        document.getElementById('startProcessingBtn')?.addEventListener('click', () => this.startProcessing());
        document.getElementById('pauseProcessingBtn')?.addEventListener('click', () => this.pauseProcessing());
        document.getElementById('refreshQueueBtn')?.addEventListener('click', () => this.refreshQueue());
        document.getElementById('emergencyStopBtn')?.addEventListener('click', () => this.emergencyStop());

        // Settings
        document.getElementById('saveSettings')?.addEventListener('click', () => this.saveSettings());
        
        // Processing monitor controls
        document.getElementById('cancelProcessingButton')?.addEventListener('click', () => this.cancelProcessing());
        document.getElementById('clearLogBtn')?.addEventListener('click', () => this.clearLog());

        // Auto-refresh queue periodically
        this.startQueuePolling();
    }

    async loadConfiguration() {
        try {
            const result = await chrome.storage.sync.get(['autoBoltConfig']);
            if (result.autoBoltConfig) {
                this.config = { ...this.config, ...result.autoBoltConfig };
            }
        } catch (error) {
            this.log('error', 'Failed to load configuration: ' + error.message);
        }
    }

    async saveSettings() {
        try {
            const config = {
                airtableApiKey: document.getElementById('airtableKey')?.value || this.config.airtableApiToken,
                airtableBaseId: document.getElementById('baseId')?.value || this.config.airtableBaseId,
                airtableTableId: document.getElementById('tableId')?.value || this.config.airtableTableName,
                maxConcurrentProcessors: parseInt(document.getElementById('maxConcurrentProcessors')?.value) || this.config.maxConcurrentProcessors,
                queuePollInterval: parseInt(document.getElementById('queuePollInterval')?.value) * 1000 || this.config.queuePollInterval
            };

            await chrome.storage.sync.set({ autoBoltConfig: config });
            this.config = { ...this.config, ...config };
            this.showToast('Settings saved successfully', 'success');
            this.log('info', 'Settings updated and saved');
        } catch (error) {
            this.showToast('Failed to save settings: ' + error.message, 'error');
            this.log('error', 'Settings save failed: ' + error.message);
        }
    }

    startQueuePolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
        
        this.pollInterval = setInterval(() => {
            this.refreshQueue();
        }, this.config.queuePollInterval);
    }

    async refreshQueue() {
        try {
            this.log('info', 'Refreshing queue data...');
            await this.fetchQueueData();
            this.updateQueueDisplay();
            this.updateStatus();
        } catch (error) {
            this.log('error', 'Queue refresh failed: ' + error.message);
        }
    }

    async fetchQueueData() {
        try {
            // SECURITY FIX: Validate API token is configured
            if (!this.config.airtableApiToken) {
                throw new Error('Airtable API token not configured. Please configure in extension settings.');
            }

            const response = await fetch(`https://api.airtable.com/v0/${this.config.airtableBaseId}/${this.config.airtableTableName}`, {
                headers: {
                    'Authorization': `Bearer ${this.config.airtableApiToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: this.config.apiTimeout
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Invalid API token. Please check your Airtable configuration.');
                } else if (response.status === 404) {
                    throw new Error('Base or table not found. Please check your configuration.');
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            this.processQueueData(data.records);
            
        } catch (error) {
            throw new Error('Airtable API error: ' + error.message);
        }
    }

    processQueueData(records) {
        // Reset queues
        Object.keys(this.packageQueues).forEach(key => {
            this.packageQueues[key] = [];
        });

        let totalPending = 0;
        let totalProcessing = 0;
        let totalCompleted = 0;
        let totalFailed = 0;

        records.forEach(record => {
            const customer = {
                id: record.id,
                businessName: record.fields['Business Name'] || 'Unknown',
                packageType: (record.fields['Package Type'] || 'starter').toLowerCase(),
                status: record.fields['Status'] || 'pending',
                directories: record.fields['Directory Count'] || 0,
                createdTime: record.createdTime
            };

            // Categorize by status
            switch (customer.status.toLowerCase()) {
                case 'pending':
                case 'queued':
                    totalPending++;
                    if (this.packageQueues[customer.packageType]) {
                        this.packageQueues[customer.packageType].push(customer);
                    }
                    break;
                case 'processing':
                case 'in_progress':
                    totalProcessing++;
                    break;
                case 'completed':
                case 'done':
                    totalCompleted++;
                    break;
                case 'failed':
                case 'error':
                    totalFailed++;
                    break;
            }
        });

        // Update stats
        this.processingStats = {
            pending: totalPending,
            processing: totalProcessing,
            completed: totalCompleted,
            failed: totalFailed,
            successRate: totalCompleted > 0 ? Math.round((totalCompleted / (totalCompleted + totalFailed)) * 100) : 0
        };

        // Sort queues by priority and creation time
        Object.keys(this.packageQueues).forEach(packageType => {
            this.packageQueues[packageType].sort((a, b) => {
                return new Date(a.createdTime) - new Date(b.createdTime);
            });
        });
    }

    updateQueueDisplay() {
        // Update queue stats
        document.getElementById('pendingCount').textContent = this.processingStats.pending;
        document.getElementById('processingCount').textContent = this.processingStats.processing;
        document.getElementById('completedToday').textContent = this.processingStats.completed;
        document.getElementById('successRate').textContent = `${this.processingStats.successRate}%`;

        // Update package queue counts
        Object.keys(this.packageQueues).forEach(packageType => {
            const countElement = document.getElementById(`${packageType}Count`);
            if (countElement) {
                countElement.textContent = this.packageQueues[packageType].length;
            }
        });
    }

    async startProcessing() {
        if (this.isProcessing) return;

        this.isProcessing = true;
        this.isPaused = false;
        this.updateControlButtons();
        this.showProcessingMonitor();
        
        this.log('info', 'Queue processing started');
        this.showToast('Queue processing started', 'success');

        try {
            await this.processQueues();
        } catch (error) {
            this.log('error', 'Processing error: ' + error.message);
            this.showToast('Processing failed: ' + error.message, 'error');
        } finally {
            this.isProcessing = false;
            this.hideProcessingMonitor();
            this.updateControlButtons();
        }
    }

    async processQueues() {
        // Process queues by priority order
        const priorityOrder = ['enterprise', 'professional', 'growth', 'starter'];
        
        for (const packageType of priorityOrder) {
            if (!this.isProcessing || this.isPaused) break;
            
            const queue = this.packageQueues[packageType];
            for (const customer of queue) {
                if (!this.isProcessing || this.isPaused) break;
                
                await this.processCustomer(customer);
            }
        }
    }

    async processCustomer(customer) {
        this.currentCustomer = customer;
        this.updateCurrentCustomerDisplay();
        this.activeProcessors++;
        this.updateProcessingStats();

        this.log('info', `Processing customer: ${customer.businessName} (${customer.packageType})`);

        try {
            // Simulate processing time based on package type
            const processingTime = this.getProcessingTime(customer.packageType);
            await this.delay(processingTime);

            // Simulate success/failure based on package quality
            const successRate = this.getPackageSuccessRate(customer.packageType);
            const isSuccess = Math.random() < successRate;

            if (isSuccess) {
                this.processingStats.completed++;
                this.log('success', `Successfully processed ${customer.businessName}`);
            } else {
                this.processingStats.failed++;
                this.log('error', `Failed to process ${customer.businessName}`);
            }

        } catch (error) {
            this.processingStats.failed++;
            this.log('error', `Error processing ${customer.businessName}: ${error.message}`);
        } finally {
            this.activeProcessors--;
            this.updateProcessingStats();
        }
    }

    getProcessingTime(packageType) {
        // Different processing times based on package tier
        const times = {
            enterprise: 2000,  // 2 seconds (faster processing)
            professional: 3000, // 3 seconds
            growth: 4000,      // 4 seconds
            starter: 5000      // 5 seconds
        };
        return times[packageType] || 4000;
    }

    getPackageSuccessRate(packageType) {
        // Higher success rates for premium packages
        const rates = {
            enterprise: 0.98,
            professional: 0.95,
            growth: 0.92,
            starter: 0.88
        };
        return rates[packageType] || 0.9;
    }

    pauseProcessing() {
        this.isPaused = !this.isPaused;
        const button = document.getElementById('pauseProcessingBtn');
        if (button) {
            button.innerHTML = this.isPaused ? 
                '<span class="button-icon">▶️</span> Resume Processing' :
                '<span class="button-icon">⏸️</span> Pause Processing';
        }
        
        this.log('info', this.isPaused ? 'Processing paused' : 'Processing resumed');
        this.showToast(this.isPaused ? 'Processing paused' : 'Processing resumed', 'info');
    }

    emergencyStop() {
        if (confirm('Are you sure you want to emergency stop all processing? This will halt all active operations immediately.')) {
            this.isProcessing = false;
            this.isPaused = false;
            this.activeProcessors = 0;
            this.currentCustomer = null;
            
            this.hideProcessingMonitor();
            this.updateControlButtons();
            
            this.log('warning', 'EMERGENCY STOP activated - All processing halted');
            this.showToast('Emergency stop activated', 'warning');
        }
    }

    cancelProcessing() {
        this.isProcessing = false;
        this.isPaused = false;
        this.hideProcessingMonitor();
        this.updateControlButtons();
        
        this.log('info', 'Processing cancelled by user');
        this.showToast('Processing cancelled', 'info');
    }

    updateControlButtons() {
        const startBtn = document.getElementById('startProcessingBtn');
        const pauseBtn = document.getElementById('pauseProcessingBtn');
        
        if (startBtn) startBtn.disabled = this.isProcessing;
        if (pauseBtn) pauseBtn.disabled = !this.isProcessing;
    }

    showProcessingMonitor() {
        const monitor = document.getElementById('processingMonitor');
        if (monitor) monitor.style.display = 'block';
    }

    hideProcessingMonitor() {
        const monitor = document.getElementById('processingMonitor');
        if (monitor) monitor.style.display = 'none';
        
        const currentCustomer = document.getElementById('currentCustomer');
        if (currentCustomer) currentCustomer.style.display = 'none';
    }

    updateCurrentCustomerDisplay() {
        if (!this.currentCustomer) return;

        const customerElement = document.getElementById('currentCustomer');
        if (customerElement) {
            customerElement.style.display = 'block';
            
            const businessName = document.getElementById('currentBusinessName');
            const packageType = document.getElementById('currentPackageType');
            const progress = document.getElementById('currentProgress');
            
            if (businessName) businessName.textContent = this.currentCustomer.businessName;
            if (packageType) packageType.textContent = this.currentCustomer.packageType.toUpperCase();
            if (progress) progress.textContent = '0%'; // Could be made dynamic
        }
    }

    updateProcessingStats() {
        const activeProcessorsElement = document.getElementById('activeProcessors');
        const successCountElement = document.getElementById('successCount');
        const errorCountElement = document.getElementById('errorCount');
        
        if (activeProcessorsElement) activeProcessorsElement.textContent = this.activeProcessors;
        if (successCountElement) successCountElement.textContent = this.processingStats.completed;
        if (errorCountElement) errorCountElement.textContent = this.processingStats.failed;
    }

    updateStatus() {
        const statusText = document.getElementById('statusText');
        const statusDot = document.getElementById('statusDot');
        const queueStatusText = document.getElementById('queueStatusText');
        const queueStatusDot = document.getElementById('queueStatusDot');

        let status = 'Ready';
        let statusClass = '';

        if (this.isProcessing) {
            status = this.isPaused ? 'Paused' : 'Processing';
            statusClass = this.isPaused ? 'warning' : 'processing';
        }

        if (statusText) statusText.textContent = status;
        if (queueStatusText) queueStatusText.textContent = status;
        
        if (statusDot) {
            statusDot.className = `status-dot ${statusClass}`;
        }
        if (queueStatusDot) {
            queueStatusDot.className = `status-dot ${statusClass}`;
        }
    }

    log(type, message) {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = { timestamp, type, message };
        
        this.processingLog.unshift(logEntry);
        
        // Keep only last 100 entries for performance
        if (this.processingLog.length > 100) {
            this.processingLog = this.processingLog.slice(0, 100);
        }
        
        this.updateLogDisplay();
    }

    updateLogDisplay() {
        const logContent = document.getElementById('logContent');
        if (!logContent) return;

        // Show only the most recent 10 entries for performance
        const recentLogs = this.processingLog.slice(0, 10);
        
        logContent.innerHTML = recentLogs.map(entry => `
            <div class="log-item ${entry.type}">
                <span class="log-time">${entry.timestamp}</span>
                <span class="log-message">${entry.message}</span>
            </div>
        `).join('');
    }

    clearLog() {
        this.processingLog = [];
        this.updateLogDisplay();
        this.log('info', 'Processing log cleared');
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        if (!toast || !toastMessage) return;

        toastMessage.textContent = message;
        toast.className = `toast ${type}`;
        toast.style.display = 'flex';

        // Auto-hide after 3 seconds
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the queue manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.autoBoltQueueManager = new AutoBoltQueueManager();
});

// Toast close button handler
document.addEventListener('click', (e) => {
    if (e.target.id === 'toastClose') {
        document.getElementById('toast').style.display = 'none';
    }
});