/**
 * Auto-Bolt Chrome Extension - Background Script (Service Worker)
 * Handles messaging coordination and provides fallback communication
 */

console.log('🚀 Auto-Bolt background script initialized');

// Track content script states
const contentScriptStates = new Map();

chrome.runtime.onInstalled.addListener((details) => {
    console.log('✅ Extension installed/updated:', details.reason);
    
    if (details.reason === 'install') {
        console.log('🎉 First time installation');
    } else if (details.reason === 'update') {
        console.log('🔄 Extension updated to version:', chrome.runtime.getManifest().version);
    }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Background received message:', {
        type: request.type,
        from: sender.tab ? `Tab ${sender.tab.id}` : 'Extension',
        url: sender.tab?.url,
        timestamp: new Date().toISOString()
    });
    
    if (request.type === 'CONTENT_SCRIPT_READY') {
        // Track content script state
        if (sender.tab) {
            contentScriptStates.set(sender.tab.id, {
                ready: true,
                url: request.url,
                hostname: request.hostname,
                protocol: request.protocol,
                hasBusinessData: request.hasBusinessData,
                formCount: request.formCount,
                timestamp: Date.now()
            });
            
            console.log('✅ Content script ready on tab:', sender.tab.id);
        }
        
        sendResponse({ success: true, message: 'Background acknowledged' });
    }
    
    return true; // Keep message channel open for async responses
});

// Clean up content script states when tabs are removed
chrome.tabs.onRemoved.addListener((tabId) => {
    if (contentScriptStates.has(tabId)) {
        contentScriptStates.delete(tabId);
        console.log('🧹 Cleaned up state for removed tab:', tabId);
    }
});

// Provide API for popup to check content script readiness
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'CHECK_CONTENT_SCRIPT_READY') {
        const tabId = request.tabId;
        const state = contentScriptStates.get(tabId);
        
        sendResponse({
            success: true,
            ready: !!state,
            state: state || null,
            timestamp: Date.now()
        });
    }
    
    return true;
});

// Handle extension icon clicks with debugging
chrome.action.onClicked.addListener((tab) => {
    console.log('🖱️ Extension icon clicked on tab:', tab.id, tab.url);
    
    // This will open the popup, but we can use this for debugging
    const state = contentScriptStates.get(tab.id);
    console.log('📊 Content script state for tab:', state);
});

// Periodic cleanup of stale content script states
setInterval(() => {
    const now = Date.now();
    const staleThreshold = 5 * 60 * 1000; // 5 minutes
    
    for (const [tabId, state] of contentScriptStates.entries()) {
        if (now - state.timestamp > staleThreshold) {
            contentScriptStates.delete(tabId);
            console.log('🧹 Cleaned up stale state for tab:', tabId);
        }
    }
}, 60000); // Check every minute

// Debug function to log current states
function logCurrentStates() {
    console.log('📊 Current content script states:', Array.from(contentScriptStates.entries()));
}

// Export for debugging (available in background script console)
globalThis.autoBoltDebug = {
    logCurrentStates,
    contentScriptStates,
    clearStates: () => {
        contentScriptStates.clear();
        console.log('🧹 All content script states cleared');
    }
};

console.log('✅ Background script setup complete. Debug functions available as globalThis.autoBoltDebug');