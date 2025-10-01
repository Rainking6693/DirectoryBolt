/**
 * Auto-Bolt Extension - Production Messaging Bridge
 * Handles bulletproof communication between popup, background, and content scripts
 * 
 * Features:
 * - Intelligent message routing with fallback mechanisms
 * - Connection state management and recovery
 * - Message queuing for reliability
 * - Enhanced error handling with retry logic
 * - Real-time progress reporting
 * - Cross-tab communication support
 */

// Production Messaging System
class ProductionMessagingBridge {
    constructor() {
        this.messageQueue = [];
        this.activeConnections = new Map();
        this.retryAttempts = 3;
        this.retryDelay = 1000;
        this.messageTimeout = 30000;
        this.connectionHealth = new Map();
        
        // Message types with priorities
        this.messagePriorities = {
            'PING': 1,
            'HEALTH_CHECK': 1,
            'AUTO_BOLT_FILL_FORMS': 2,
            'BATCH_PROCESS': 3,
            'DIRECTORY_AUTOMATION': 3
        };
        
        this.initialize();
    }
    
    initialize() {
        console.log('🚀 Initializing Production Messaging Bridge');
        this.setupConnectionMonitoring();
        this.setupMessageQueue();
    }
    
    setupConnectionMonitoring() {
        // Monitor tab changes
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.onActivated?.addListener((activeInfo) => {
                this.handleTabChange(activeInfo.tabId);
            });
            
            chrome.tabs.onUpdated?.addListener((tabId, changeInfo) => {
                if (changeInfo.status === 'complete') {
                    this.handleTabReload(tabId);
                }
            });
        }
    }
    
    setupMessageQueue() {
        // Process message queue every second
        setInterval(() => {
            this.processMessageQueue();
        }, 1000);
    }
    
    async handleTabChange(tabId) {
        console.log(`🔄 Tab changed to: ${tabId}`);
        // Reset connection health for new tab
        this.connectionHealth.delete(tabId);
    }
    
    async handleTabReload(tabId) {
        console.log(`🔄 Tab reloaded: ${tabId}`);
        // Clear existing connections for reloaded tab
        this.activeConnections.delete(tabId);
        this.connectionHealth.delete(tabId);
    }
    
    async sendMessageWithRetry(tabId, message, options = {}) {
        const messageId = this.generateMessageId();
        const priority = this.messagePriorities[message.action] || 2;
        const timeout = options.timeout || this.messageTimeout;
        const maxRetries = options.retries !== undefined ? options.retries : this.retryAttempts;
        
        console.log(`📨 Sending message [${messageId}]: ${message.action} to tab ${tabId}`);
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                // Check tab validity
                const tab = await this.getTabInfo(tabId);
                if (!this.isTabValid(tab)) {
                    throw new Error(`Tab ${tabId} is not valid for messaging`);
                }
                
                // Ensure content script is ready
                await this.ensureContentScriptReady(tabId, attempt === 1);
                
                // Send message with timeout
                const response = await this.sendMessageWithTimeout(tabId, {
                    ...message,
                    messageId,
                    priority,
                    attempt,
                    timestamp: Date.now()
                }, timeout);
                
                // Update connection health
                this.updateConnectionHealth(tabId, true, response?.processingTime || 0);
                
                console.log(`✅ Message [${messageId}] successful on attempt ${attempt}`);
                return response;
                
            } catch (error) {
                console.warn(`⚠️ Message [${messageId}] attempt ${attempt}/${maxRetries} failed:`, error.message);
                
                // Update connection health
                this.updateConnectionHealth(tabId, false, 0);
                
                if (attempt === maxRetries) {
                    // All attempts failed
                    console.error(`❌ Message [${messageId}] failed after ${maxRetries} attempts`);
                    throw new Error(`Message delivery failed after ${maxRetries} attempts: ${error.message}`);
                }
                
                // Wait before retry with exponential backoff
                const delay = this.retryDelay * Math.pow(2, attempt - 1);
                console.log(`⏳ Waiting ${delay}ms before retry...`);
                await this.sleep(delay);
                
                // Check if we should try content script injection on retry
                if (attempt === maxRetries - 1) {
                    console.log('💫 Final attempt - forcing content script re-injection');
                    await this.forceContentScriptInjection(tabId);
                }
            }
        }
    }
    
    async sendMessageWithTimeout(tabId, message, timeout) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Message timeout after ${timeout}ms`));
            }, timeout);
            
            chrome.tabs.sendMessage(tabId, message, (response) => {
                clearTimeout(timeoutId);
                
                if (chrome.runtime.lastError) {
                    reject(new Error(`Chrome runtime error: ${chrome.runtime.lastError.message}`));
                    return;
                }
                
                if (!response) {
                    reject(new Error('No response received from content script'));
                    return;
                }
                
                if (!response.success) {
                    reject(new Error(`Content script error: ${response.error || 'Unknown error'}`));
                    return;
                }
                
                resolve(response);
            });
        });
    }
    
    async ensureContentScriptReady(tabId, firstAttempt = true) {
        // Check if content script is already responding
        if (this.connectionHealth.has(tabId) && this.connectionHealth.get(tabId).isHealthy) {
            return true;
        }
        
        try {
            // Send ping to test content script
            await this.sendMessageWithTimeout(tabId, { action: 'PING' }, 2000);
            return true;
        } catch (error) {
            if (firstAttempt) {
                console.log(`💫 Content script not responding, injecting...`);
                await this.injectContentScript(tabId);
                
                // Wait for initialization
                await this.sleep(2000);
                
                // Test again
                try {
                    await this.sendMessageWithTimeout(tabId, { action: 'PING' }, 3000);
                    return true;
                } catch (pingError) {
                    throw new Error(`Content script injection failed: ${pingError.message}`);
                }
            } else {
                throw error;
            }
        }
    }
    
    async injectContentScript(tabId) {
        try {
            console.log(`💫 Injecting content script into tab ${tabId}`);
            
            await chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['content.js']
            });
            
            console.log(`✅ Content script injected successfully`);
            
        } catch (error) {
            console.error(`❌ Content script injection failed:`, error);
            throw new Error(`Failed to inject content script: ${error.message}`);
        }
    }
    
    async forceContentScriptInjection(tabId) {
        // Force re-injection even if content script exists
        try {
            // Remove existing content script reference
            this.activeConnections.delete(tabId);
            this.connectionHealth.delete(tabId);
            
            // Inject fresh content script
            await this.injectContentScript(tabId);
            
            // Extended wait for complex pages
            await this.sleep(3000);
            
        } catch (error) {
            console.error('Force injection failed:', error);
            throw error;
        }
    }
    
    async getTabInfo(tabId) {
        return new Promise((resolve, reject) => {
            chrome.tabs.get(tabId, (tab) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(tab);
                }
            });
        });
    }
    
    isTabValid(tab) {
        if (!tab) return false;
        
        // Check for restricted URLs
        const restrictedProtocols = ['chrome://', 'chrome-extension://', 'moz-extension://'];
        const restrictedPages = ['chrome://newtab/', 'about:blank', 'edge://newtab/'];
        
        if (restrictedProtocols.some(protocol => tab.url.startsWith(protocol))) {
            return false;
        }
        
        if (restrictedPages.includes(tab.url)) {
            return false;
        }
        
        return tab.status === 'complete';
    }
    
    updateConnectionHealth(tabId, success, processingTime) {
        const health = this.connectionHealth.get(tabId) || {
            isHealthy: false,
            successCount: 0,
            failureCount: 0,
            avgProcessingTime: 0,
            lastUpdate: Date.now()
        };
        
        if (success) {
            health.successCount++;
            health.avgProcessingTime = (health.avgProcessingTime + processingTime) / 2;
            health.isHealthy = true;
        } else {
            health.failureCount++;
            health.isHealthy = health.successCount > health.failureCount;
        }
        
        health.lastUpdate = Date.now();
        this.connectionHealth.set(tabId, health);
    }
    
    processMessageQueue() {
        if (this.messageQueue.length === 0) return;
        
        // Sort by priority
        this.messageQueue.sort((a, b) => a.priority - b.priority);
        
        // Process high-priority messages
        const highPriorityMessages = this.messageQueue.filter(msg => msg.priority <= 2);
        highPriorityMessages.forEach(async (msg, index) => {
            if (index < 3) { // Process max 3 concurrent high-priority messages
                this.messageQueue.splice(this.messageQueue.indexOf(msg), 1);
                try {
                    await msg.execute();
                } catch (error) {
                    console.error('Queued message failed:', error);
                }
            }
        });
    }
    
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Health monitoring methods
    getConnectionHealth(tabId) {
        return this.connectionHealth.get(tabId) || { isHealthy: false };
    }
    
    getAllConnectionsHealth() {
        const healthReport = {};
        this.connectionHealth.forEach((health, tabId) => {
            healthReport[tabId] = {
                isHealthy: health.isHealthy,
                successRate: health.successCount / (health.successCount + health.failureCount) || 0,
                avgProcessingTime: health.avgProcessingTime,
                lastUpdate: health.lastUpdate
            };
        });
        return healthReport;
    }
}

// Global messaging bridge instance
const messagingBridge = new ProductionMessagingBridge();

/**
 * Enhanced form fill function with production reliability
 */
async function triggerFormFill(options = {}) {
    try {
        // Get the active tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab || !tab.id) {
            throw new Error('No active tab found');
        }

        console.log('🎥 Triggering enhanced form fill on tab:', tab.url);

        // Use production messaging bridge
        const response = await messagingBridge.sendMessageWithRetry(tab.id, {
            action: 'AUTO_BOLT_FILL_FORMS',
            options: {
                validate: true,
                showProgress: true,
                ...options
            }
        });
        
        console.log('✅ Enhanced form fill completed:', response);
        return response;
        
    } catch (error) {
        console.error('❌ Enhanced form fill failed:', error);
        
        // Enhanced error handling with user-friendly messages
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab?.url?.startsWith('file://')) {
            throw new Error('Please enable "Allow access to file URLs" for this extension in chrome://extensions/');
        }
        
        if (tab?.url?.includes('chrome://') || tab?.url?.includes('chrome-extension://')) {
            throw new Error('Cannot fill forms on browser internal pages');
        }
        
        if (error.message.includes('timeout')) {
            throw new Error('Form filling timed out. The page might be loading or having issues.');
        }
        
        if (error.message.includes('injection failed')) {
            throw new Error('Could not access the page. Please refresh and try again.');
        }
        
        throw error;
    }
}

/**
 * Legacy function for backward compatibility
 */
async function legacyTriggerFormFill() {
    return await triggerFormFill();
}

/**
 * Add fill button functionality to popup
 */
function addFillButtonToPopup() {
    // Create a fill button if it doesn't exist
    const existingButton = document.getElementById('fill-forms-button');
    if (!existingButton) {
        const actionsDiv = document.querySelector('.actions');
        if (actionsDiv) {
            const fillButton = document.createElement('button');
            fillButton.id = 'fill-forms-button';
            fillButton.className = 'secondary-button';
            fillButton.innerHTML = '⚡ Fill Forms on Current Page';
            fillButton.style.marginTop = '8px';
            
            fillButton.addEventListener('click', async () => {
                try {
                    fillButton.disabled = true;
                    fillButton.textContent = 'Filling...';
                    
                    await triggerFormFill();
                    
                    fillButton.textContent = '✅ Forms Filled!';
                    setTimeout(() => {
                        fillButton.textContent = '⚡ Fill Forms on Current Page';
                        fillButton.disabled = false;
                    }, 2000);
                    
                } catch (error) {
                    fillButton.textContent = '❌ Error - Check Console';
                    console.error('Fill error:', error);
                    alert(error.message);
                    
                    setTimeout(() => {
                        fillButton.textContent = '⚡ Fill Forms on Current Page';
                        fillButton.disabled = false;
                    }, 3000);
                }
            });
            
            actionsDiv.appendChild(fillButton);
        }
    }
}

// Export for use in popup.js and other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        triggerFormFill, 
        legacyTriggerFormFill,
        addFillButtonToPopup,
        ProductionMessagingBridge,
        messagingBridge
    };
}

// Global namespace for debugging
window.AutoBoltMessaging = {
    triggerFormFill,
    messagingBridge,
    ProductionMessagingBridge,
    version: '2.0.0-production'
};