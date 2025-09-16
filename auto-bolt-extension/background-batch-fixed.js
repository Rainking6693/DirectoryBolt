/**
 * Auto-Bolt Chrome Extension - Fixed Background Script
 * Handles tab communication with proper error handling and validation
 */

console.log('🚀 Auto-Bolt Fixed Background Script Loading...');

// Tab state management
const tabStates = new Map();
const messageQueue = new Map();

// Enhanced tab validation and communication
class TabCommunicationManager {
    constructor() {
        this.activeConnections = new Set();
        this.messageTimeout = 10000; // 10 seconds
    }

    async validateTab(tabId) {
        if (!Number.isInteger(tabId) || tabId < 0) {
            throw new Error(`Invalid tab ID: ${tabId}`);
        }

        try {
            const tab = await chrome.tabs.get(tabId);
            if (!tab) {
                throw new Error(`Tab ${tabId} not found`);
            }
            return tab;
        } catch (error) {
            throw new Error(`Tab ${tabId} is not accessible: ${error.message}`);
        }
    }

    async sendMessageSafely(tabId, message, options = {}) {
        await this.validateTab(tabId);

        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error(`Message timeout after ${this.messageTimeout}ms`));
            }, this.messageTimeout);

            try {
                const sendParams = [tabId, message];
                
                // Add frameId if specified and valid
                if (options.frameId !== undefined && Number.isInteger(options.frameId) && options.frameId >= 0) {
                    sendParams.splice(1, 0, { frameId: options.frameId });
                }

                chrome.tabs.sendMessage(...sendParams, (response) => {
                    clearTimeout(timeoutId);
                    
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                        return;
                    }
                    
                    resolve(response);
                });
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }

    async ensureContentScript(tabId) {
        try {
            // Test if content script is already present
            await this.sendMessageSafely(tabId, { type: 'PING' });
            console.log('✅ Content script already present in tab:', tabId);
            return true;
        } catch (error) {
            console.log('📝 Content script not present, injecting...', error.message);
        }

        try {
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content.js']
            });
            
            // Wait for initialization
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Verify injection worked
            await this.sendMessageSafely(tabId, { type: 'PING' });
            console.log('✅ Content script injected successfully');
            return true;
        } catch (error) {
            throw new Error(`Failed to inject content script: ${error.message}`);
        }
    }
}

const tabManager = new TabCommunicationManager();

// Message handling with improved error handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Background received message:', request.type || request.action);
    
    // Handle different message types
    switch (request.type || request.action) {
        case 'VALIDATE_CUSTOMER':
            handleCustomerValidation(request, sendResponse);
            return true; // Keep channel open for async response
            
        case 'FILL_FORMS':
            handleFillForms(request, sender, sendResponse);
            return true;
            
        case 'GET_TAB_INFO':
            handleGetTabInfo(request, sender, sendResponse);
            return true;
            
        case 'PING':
            sendResponse({ 
                success: true, 
                message: 'Background script is alive',
                timestamp: Date.now()
            });
            return false;
            
        default:
            console.log('⚠️ Unknown message type:', request.type || request.action);
            sendResponse({ 
                success: false, 
                error: 'Unknown message type',
                timestamp: Date.now()
            });
            return false;
    }
});

async function handleCustomerValidation(request, sendResponse) {
    try {
        const { customerId } = request;
        
        if (!customerId) {
            sendResponse({
                success: false,
                error: 'Customer ID is required',
                timestamp: Date.now()
            });
            return;
        }

        console.log('🔍 Validating customer:', customerId);

        // Call the Vercel API endpoint
        const response = await fetch(`https://directorybolt.com/api/extension/validate?customerId=${encodeURIComponent(customerId)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'DirectoryBolt-Extension/3.0.2'
            }
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        console.log('✅ Customer validation response:', data);

        sendResponse({
            success: true,
            data: data,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('❌ Customer validation error:', error);
        sendResponse({
            success: false,
            error: error.message,
            timestamp: Date.now()
        });
    }
}

async function handleFillForms(request, sender, sendResponse) {
    try {
        const tabId = sender.tab?.id;
        
        if (!tabId) {
            throw new Error('No tab ID available from sender');
        }

        console.log('🎯 Filling forms in tab:', tabId);

        // Ensure content script is present
        await tabManager.ensureContentScript(tabId);

        // Send fill command to content script
        const response = await tabManager.sendMessageSafely(tabId, {
            type: 'FILL_FORMS',
            data: request.data || {},
            timestamp: Date.now()
        });

        sendResponse({
            success: true,
            message: 'Forms filled successfully',
            data: response,
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('❌ Form filling error:', error);
        sendResponse({
            success: false,
            error: error.message,
            timestamp: Date.now()
        });
    }
}

async function handleGetTabInfo(request, sender, sendResponse) {
    try {
        const tabId = sender.tab?.id;
        
        if (!tabId) {
            throw new Error('No tab ID available from sender');
        }

        const tab = await tabManager.validateTab(tabId);

        sendResponse({
            success: true,
            tabInfo: {
                id: tab.id,
                url: tab.url,
                title: tab.title,
                status: tab.status
            },
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('❌ Get tab info error:', error);
        sendResponse({
            success: false,
            error: error.message,
            timestamp: Date.now()
        });
    }
}

// Handle extension lifecycle
chrome.runtime.onInstalled.addListener((details) => {
    console.log('🚀 Auto-Bolt Extension installed:', details.reason);
    
    // Clear any existing state
    tabStates.clear();
    messageQueue.clear();
});

chrome.runtime.onStartup.addListener(() => {
    console.log('🚀 Auto-Bolt Extension starting up');
    
    // Clear any existing state
    tabStates.clear();
    messageQueue.clear();
});

// Handle tab updates and cleanup
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        console.log('📄 Tab loaded:', tabId, tab.url);
        tabStates.set(tabId, { status: 'ready', url: tab.url });
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    console.log('🗑️ Tab removed:', tabId);
    tabStates.delete(tabId);
    messageQueue.delete(tabId);
});

// Handle connection errors gracefully
chrome.runtime.onConnect.addListener((port) => {
    console.log('🔌 New connection:', port.name);
    
    port.onDisconnect.addListener(() => {
        console.log('🔌 Connection disconnected:', port.name);
        if (chrome.runtime.lastError) {
            console.log('Connection error:', chrome.runtime.lastError.message);
        }
    });
});

console.log('✅ Auto-Bolt Fixed Background Script loaded successfully');

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TabCommunicationManager,
        tabManager
    };
}