/**
 * Auto-Bolt Chrome Extension - Advanced Background Script
 * Handles both BATCH_FILL operations and Directory Automation with master directory list
 */

console.log('🚀 Auto-Bolt Advanced Background Script Loading...');

// Import customer authentication
importScripts('customer-auth.js');

// Import external modules dynamically
let directoryRegistry = null;
let queueProcessor = null;

// Load script dynamically using importScripts for service worker
async function loadScript(scriptPath) {
    try {
        // Use importScripts for service worker context (Chrome MV3 compliant)
        importScripts(scriptPath);
        console.log(`✅ Loaded script: ${scriptPath}`);
    } catch (error) {
        console.error(`❌ Failed to load script ${scriptPath}:`, error);
        // Fallback: load as module if importScripts fails
        try {
            const module = await import(chrome.runtime.getURL(scriptPath));
            console.log(`✅ Loaded module: ${scriptPath}`);
        } catch (moduleError) {
            console.error(`❌ Module load also failed for ${scriptPath}:`, moduleError);
            throw error;
        }
    }
}

// Initialize advanced components
async function initializeAdvancedComponents() {
    try {
        console.log('🔧 Initializing advanced directory automation components...');
        
        // Load required scripts first
        await loadScript('directory-registry.js');
        await loadScript('queue-processor.js');
        
        // Wait a moment for classes to be defined
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if classes are available in global scope
        const DirectoryRegistry = globalThis.DirectoryRegistry || window.DirectoryRegistry;
        const QueueProcessor = globalThis.QueueProcessor || window.QueueProcessor;
        
        if (!DirectoryRegistry) {
            throw new Error('DirectoryRegistry class not available');
        }
        
        if (!QueueProcessor) {
            throw new Error('QueueProcessor class not available');
        }
        
        // Initialize directory registry
        directoryRegistry = new DirectoryRegistry();
        await directoryRegistry.initialize();
        
        // Initialize queue processor
        queueProcessor = new QueueProcessor();
        await queueProcessor.initialize();
        
        console.log('✅ Advanced components initialized successfully');
        
    } catch (error) {
        console.error('❌ Failed to initialize advanced components:', error);
        throw error;
    }
}

// Batch processing state management (legacy support)
const BatchProcessor = {
    currentBatch: null,
    processingStatus: {
        isRunning: false,
        currentRecordIndex: 0,
        totalRecords: 0,
        successCount: 0,
        errorCount: 0,
        startTime: null,
        errors: []
    },
    
    // Configuration
    config: {
        delayBetweenRecords: 2000, // 2 seconds
        maxRetries: 3,
        timeout: 10000, // 10 seconds per record
        logLevel: 'debug'
    }
};

// Enhanced message handling for both legacy batch processing and advanced directory automation
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('🔥 Background received message:', request.type || request.action);
    
    switch (request.type || request.action) {
        // Legacy batch processing (Google Sheets records)
        case 'BATCH_FILL':
            handleBatchFill(request, sendResponse);
            return true; // Keep channel open for async response
            
        case 'GET_BATCH_STATUS':
            sendResponse(BatchProcessor.processingStatus);
            return false;
            
        case 'CANCEL_BATCH':
            cancelBatchProcessing();
            sendResponse({ success: true, message: 'Batch processing cancelled' });
            return false;
            
        // Advanced directory automation
        case 'INITIALIZE_DIRECTORY_SYSTEM':
            handleInitializeDirectorySystem(request, sendResponse);
            return true;
            
        case 'GET_DIRECTORY_LIST':
            handleGetDirectoryList(request, sendResponse);
            return true;
            
        case 'START_DIRECTORY_AUTOMATION':
            handleStartDirectoryAutomation(request, sendResponse);
            return true;
            
        case 'STOP_DIRECTORY_AUTOMATION':
            handleStopDirectoryAutomation(request, sendResponse);
            return false;
            
        case 'GET_DIRECTORY_STATUS':
            handleGetDirectoryStatus(request, sendResponse);
            return false;
            
        case 'GET_DIRECTORY_RECOMMENDATIONS':
            handleGetDirectoryRecommendations(request, sendResponse);
            return true;
            
        case 'GET_DIRECTORY_STATISTICS':
            handleGetDirectoryStatistics(request, sendResponse);
            return false;
            
        default:
            console.log('⚠️ Unknown message type:', request.type || request.action);
            sendResponse({ success: false, error: 'Unknown message type' });
            return false;
    }
});

/**
 * Handle BATCH_FILL request - Main batch processing coordinator
 */
async function handleBatchFill(request, sendResponse) {
    try {
        console.log('🎯 Starting BATCH_FILL operation');
        console.log('📊 Records to process:', request.records?.length || 0);
        console.log('🌐 Target URL:', request.targetUrl || 'current tab');
        
        // Validate request
        if (!request.records || !Array.isArray(request.records) || request.records.length === 0) {
            throw new Error('No records provided for batch processing');
        }
        
        // Check if already running
        if (BatchProcessor.processingStatus.isRunning) {
            throw new Error('Batch processing is already running');
        }
        
        // Initialize batch state
        initializeBatch(request.records, request.options || {});
        
        // Get or create target tab
        const targetTab = await getOrCreateTargetTab(request.targetUrl);
        
        // Start batch processing
        const result = await processBatch(targetTab);
        
        // Send final response
        sendResponse({
            success: true,
            message: `Batch processing completed`,
            results: result,
            stats: BatchProcessor.processingStatus
        });
        
    } catch (error) {
        console.error('❌ BATCH_FILL error:', error);
        
        // Reset batch state on error
        resetBatchState();
        
        sendResponse({
            success: false,
            error: error.message,
            stats: BatchProcessor.processingStatus
        });
    }
}

/**
 * Initialize batch processing state
 */
function initializeBatch(records, options = {}) {
    console.log('🔄 Initializing batch processor');
    
    BatchProcessor.currentBatch = records;
    BatchProcessor.processingStatus = {
        isRunning: true,
        currentRecordIndex: 0,
        totalRecords: records.length,
        successCount: 0,
        errorCount: 0,
        startTime: Date.now(),
        errors: []
    };
    
    // Apply configuration overrides
    if (options.delay) BatchProcessor.config.delayBetweenRecords = options.delay;
    if (options.timeout) BatchProcessor.config.timeout = options.timeout;
    if (options.maxRetries) BatchProcessor.config.maxRetries = options.maxRetries;
    
    console.log('✅ Batch initialized:', {
        records: records.length,
        delay: BatchProcessor.config.delayBetweenRecords,
        timeout: BatchProcessor.config.timeout
    });
}

/**
 * Get existing tab or create new one for form processing
 */
async function getOrCreateTargetTab(targetUrl) {
    try {
        if (!targetUrl) {
            // Use active tab if no URL specified
            const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!activeTab) {
                throw new Error('No active tab found');
            }
            console.log('📋 Using active tab:', activeTab.url);
            return activeTab;
        }
        
        // Check if target URL is already open
        const existingTabs = await chrome.tabs.query({ url: targetUrl });
        if (existingTabs.length > 0) {
            console.log('🔄 Reusing existing tab for:', targetUrl);
            await chrome.tabs.update(existingTabs[0].id, { active: true });
            return existingTabs[0];
        }
        
        // Create new tab
        console.log('🆕 Creating new tab for:', targetUrl);
        const newTab = await chrome.tabs.create({ url: targetUrl, active: true });
        
        // Wait for tab to load
        await waitForTabLoad(newTab.id);
        
        return newTab;
        
    } catch (error) {
        console.error('❌ Error getting/creating target tab:', error);
        throw new Error(`Failed to prepare target tab: ${error.message}`);
    }
}

/**
 * Wait for tab to finish loading
 */
function waitForTabLoad(tabId, maxWait = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const checkTab = () => {
            chrome.tabs.get(tabId, (tab) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(`Tab error: ${chrome.runtime.lastError.message}`));
                    return;
                }
                
                if (tab.status === 'complete') {
                    console.log('✅ Tab loaded successfully');
                    resolve(tab);
                    return;
                }
                
                if (Date.now() - startTime > maxWait) {
                    reject(new Error('Tab load timeout'));
                    return;
                }
                
                // Check again in 100ms
                setTimeout(checkTab, 100);
            });
        };
        
        checkTab();
    });
}

/**
 * Process all records in the batch
 */
async function processBatch(targetTab) {
    console.log('🎯 Starting batch processing on tab:', targetTab.id);
    
    const results = [];
    
    for (let i = 0; i < BatchProcessor.currentBatch.length; i++) {
        // Check if cancelled
        if (!BatchProcessor.processingStatus.isRunning) {
            console.log('⏹️ Batch processing cancelled');
            break;
        }
        
        BatchProcessor.processingStatus.currentRecordIndex = i;
        const record = BatchProcessor.currentBatch[i];
        
        console.log(`📝 Processing record ${i + 1}/${BatchProcessor.currentBatch.length}`);
        console.log('📊 Record data:', record.fields ? Object.keys(record.fields) : 'No fields');
        
        try {
            // Inject and execute content script for this record
            const result = await processRecord(targetTab.id, record);
            results.push(result);
            BatchProcessor.processingStatus.successCount++;
            
            console.log(`✅ Record ${i + 1} processed successfully`);
            
        } catch (error) {
            console.error(`❌ Error processing record ${i + 1}:`, error);
            
            const errorResult = {
                recordIndex: i,
                recordId: record.id,
                success: false,
                error: error.message,
                timestamp: Date.now()
            };
            
            results.push(errorResult);
            BatchProcessor.processingStatus.errorCount++;
            BatchProcessor.processingStatus.errors.push(errorResult);
        }
        
        // Add delay between records (except for the last one)
        if (i < BatchProcessor.currentBatch.length - 1) {
            console.log(`⏳ Waiting ${BatchProcessor.config.delayBetweenRecords}ms before next record...`);
            await sleep(BatchProcessor.config.delayBetweenRecords);
        }
        
        // Notify popup of progress (optional)
        try {
            chrome.runtime.sendMessage({
                type: 'BATCH_PROGRESS',
                progress: {
                    current: i + 1,
                    total: BatchProcessor.currentBatch.length,
                    success: BatchProcessor.processingStatus.successCount,
                    errors: BatchProcessor.processingStatus.errorCount
                }
            });
        } catch (e) {
            // Ignore if popup is closed
        }
    }
    
    // Finalize processing
    BatchProcessor.processingStatus.isRunning = false;
    const endTime = Date.now();
    const duration = endTime - BatchProcessor.processingStatus.startTime;
    
    console.log('🎉 Batch processing completed!');
    console.log('📈 Final stats:', {
        total: BatchProcessor.processingStatus.totalRecords,
        success: BatchProcessor.processingStatus.successCount,
        errors: BatchProcessor.processingStatus.errorCount,
        duration: `${duration}ms`
    });
    
    return {
        results,
        duration,
        summary: {
            total: BatchProcessor.processingStatus.totalRecords,
            success: BatchProcessor.processingStatus.successCount,
            errors: BatchProcessor.processingStatus.errorCount
        }
    };
}

/**
 * Tab messaging safety helpers
 */
function isValidTabId(tabId) {
    return Number.isInteger(tabId) && tabId >= 0;
}

async function assertTabAvailability(tabId) {
    if (!isValidTabId(tabId)) {
        throw new Error(`Invalid tab id: ${tabId}`);
    }
    try {
        return await chrome.tabs.get(tabId);
    } catch (error) {
        const message = error && error.message ? error.message : 'Unknown error';
        throw new Error(`Target tab ${tabId} is unavailable: ${message}`);
    }
}

function isValidFrameId(frameId) {
    return Number.isInteger(frameId) && frameId >= 0;
}

async function safeSendMessage(tabId, message, options = {}) {
    await assertTabAvailability(tabId);

    const params = [tabId, message];
    if (isValidFrameId(options.frameId)) {
        params.splice(1, 0, { frameId: options.frameId });
    }

    return new Promise((resolve, reject) => {
        try {
            chrome.tabs.sendMessage(...params, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                    return;
                }
                resolve(response);
            });
        } catch (error) {
            reject(error);
        }
    });
}


/**
 * Process a single record by injecting content script
 */
async function processRecord(tabId, record) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error(`Record processing timeout (${BatchProcessor.config.timeout}ms)`));
        }, BatchProcessor.config.timeout);

        (async () => {
            try {
                // Inject content script if needed
                await ensureContentScriptInjected(tabId);

                // Send fill message to content script
                const response = await safeSendMessage(tabId, {
                    action: 'FILL_SINGLE_RECORD',
                    record,
                    timestamp: Date.now()
                });

                clearTimeout(timeout);

                if (!response) {
                    reject(new Error('No response from content script'));
                    return;
                }

                if (!response.success) {
                    reject(new Error(response.error || 'Content script reported failure'));
                    return;
                }

                resolve({
                    recordId: record.id,
                    success: true,
                    filledFields: response.filledFields || 0,
                    timestamp: Date.now()
                });
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        })();
    });
}


/**
 * Ensure content script is injected in target tab
 */
async function ensureContentScriptInjected(tabId) {
    await assertTabAvailability(tabId);

    try {
        // Test if content script is already present
        await safeSendMessage(tabId, { action: 'PING' });
        console.log('? Content script already present in tab:', tabId);
        return;
    } catch (error) {
        const message = error && error.message ? error.message : 'unknown reason';
        if (message.includes('No tab with id')) {
            throw error;
        }
        console.log('?? Injecting content script into tab:', tabId);
        console.log('?? Content script ping failed, will inject:', message);
    }

    try {
        await chrome.scripting.executeScript({
            target: { tabId },
            files: ['content.js']
        });
    } catch (scriptError) {
        const message = scriptError && scriptError.message ? scriptError.message : scriptError;
        throw new Error(`Failed to inject content script into tab ${tabId}: ${message}`);
    }

    // Wait a moment for initialization
    await sleep(500);

    try {
        await safeSendMessage(tabId, { action: 'PING' });
        console.log('? Content script injected successfully');
    } catch (error) {
        console.warn('Content script ping failed after injection (continuing):', error.message || error);
    }
}


/**
 * Cancel batch processing
 */
function cancelBatchProcessing() {
    console.log('⏹️ Cancelling batch processing');
    BatchProcessor.processingStatus.isRunning = false;
}

/**
 * Reset batch processing state
 */
function resetBatchState() {
    BatchProcessor.currentBatch = null;
    BatchProcessor.processingStatus = {
        isRunning: false,
        currentRecordIndex: 0,
        totalRecords: 0,
        successCount: 0,
        errorCount: 0,
        startTime: null,
        errors: []
    };
}

/**
 * Utility function for delays
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle extension installation/startup
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('🚀 Auto-Bolt Enhanced Background Script installed:', details.reason);
    resetBatchState();
    
    // Don't validate customer on installation - let popup handle it
    console.log('Extension installed - customer will authenticate via popup');
});

// Handle extension startup
chrome.runtime.onStartup.addListener(() => {
    console.log('🚀 Auto-Bolt Enhanced Background Script starting up');
    resetBatchState();
});

// Export for testing (if in testing environment)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        BatchProcessor,
        handleBatchFill,
        processBatch,
        processRecord
    };
}

// =====================================================
// ADVANCED DIRECTORY AUTOMATION HANDLERS
// =====================================================

/**
 * Initialize directory automation system
 */
async function handleInitializeDirectorySystem(request, sendResponse) {
    try {
        console.log('🏗️ Initializing directory automation system...');
        
        await initializeAdvancedComponents();
        
        const stats = directoryRegistry ? directoryRegistry.getStatistics() : null;
        
        sendResponse({
            success: true,
            message: 'Directory automation system initialized',
            statistics: stats,
            timestamp: Date.now()
        });
        
    } catch (error) {
        console.error('❌ Failed to initialize directory system:', error);
        sendResponse({
            success: false,
            error: error.message,
            timestamp: Date.now()
        });
    }
}

/**
 * Get directory list with optional filtering
 */
async function handleGetDirectoryList(request, sendResponse) {
    try {
        if (!directoryRegistry) {
            await initializeAdvancedComponents();
        }
        
        const { filters = {} } = request;
        const directories = directoryRegistry.getDirectories(filters);
        
        sendResponse({
            success: true,
            directories: directories,
            total: directories.length,
            filters: filters,
            timestamp: Date.now()
        });
        
    } catch (error) {
        console.error('❌ Failed to get directory list:', error);
        sendResponse({
            success: false,
            error: error.message,
            timestamp: Date.now()
        });
    }
}

/**
 * Start directory automation process
 */
async function handleStartDirectoryAutomation(request, sendResponse) {
    try {
        console.log('🚀 Starting directory automation process...');
        
        if (!queueProcessor) {
            await initializeAdvancedComponents();
        }
        
        const { directoryIds = [], businessData = {}, options = {} } = request;
        
        // Validate request
        if (!directoryIds.length) {
            throw new Error('No directories specified for automation');
        }
        
        if (!businessData.businessName && !businessData.name) {
            throw new Error('Business name is required for directory automation');
        }
        
        // Get directory objects
        const directories = directoryIds
            .map(id => directoryRegistry.getDirectoryById(id))
            .filter(dir => dir !== undefined);
        
        if (directories.length === 0) {
            throw new Error('No valid directories found for the specified IDs');
        }
        
        console.log(`📋 Processing ${directories.length} directories for: ${businessData.businessName || businessData.name}`);
        
        // Add directories to queue
        queueProcessor.addDirectories(directories, businessData, options);
        
        // Start processing
        const result = await queueProcessor.startProcessing(options);
        
        sendResponse({
            success: true,
            message: 'Directory automation completed',
            results: result,
            timestamp: Date.now()
        });
        
    } catch (error) {
        console.error('❌ Directory automation failed:', error);
        sendResponse({
            success: false,
            error: error.message,
            timestamp: Date.now()
        });
    }
}

/**
 * Stop directory automation process
 */
function handleStopDirectoryAutomation(request, sendResponse) {
    try {
        if (queueProcessor) {
            queueProcessor.stopProcessing();
            console.log('⏹️ Directory automation stopped');
            
            sendResponse({
                success: true,
                message: 'Directory automation stopped',
                timestamp: Date.now()
            });
        } else {
            sendResponse({
                success: false,
                error: 'No active directory automation process',
                timestamp: Date.now()
            });
        }
    } catch (error) {
        console.error('❌ Failed to stop directory automation:', error);
        sendResponse({
            success: false,
            error: error.message,
            timestamp: Date.now()
        });
    }
}

/**
 * Get current directory automation status
 */
function handleGetDirectoryStatus(request, sendResponse) {
    try {
        if (!queueProcessor) {
            sendResponse({
                success: true,
                status: 'not-initialized',
                timestamp: Date.now()
            });
            return;
        }
        
        const results = queueProcessor.getResults();
        
        sendResponse({
            success: true,
            status: queueProcessor.isProcessing ? 'processing' : 'idle',
            results: results,
            currentJob: queueProcessor.currentJob,
            queueSize: queueProcessor.queue.length,
            timestamp: Date.now()
        });
        
    } catch (error) {
        console.error('❌ Failed to get directory status:', error);
        sendResponse({
            success: false,
            error: error.message,
            timestamp: Date.now()
        });
    }
}

/**
 * Get directory processing recommendations
 */
async function handleGetDirectoryRecommendations(request, sendResponse) {
    try {
        if (!directoryRegistry) {
            await initializeAdvancedComponents();
        }
        
        const { criteria = {} } = request;
        const recommendations = directoryRegistry.getProcessingRecommendations(criteria);
        
        sendResponse({
            success: true,
            recommendations: recommendations,
            criteria: criteria,
            timestamp: Date.now()
        });
        
    } catch (error) {
        console.error('❌ Failed to get directory recommendations:', error);
        sendResponse({
            success: false,
            error: error.message,
            timestamp: Date.now()
        });
    }
}

/**
 * Get directory statistics
 */
function handleGetDirectoryStatistics(request, sendResponse) {
    try {
        if (!directoryRegistry || !directoryRegistry.isInitialized()) {
            sendResponse({
                success: false,
                error: 'Directory registry not initialized',
                timestamp: Date.now()
            });
            return;
        }
        
        const statistics = directoryRegistry.getStatistics();
        
        sendResponse({
            success: true,
            statistics: statistics,
            timestamp: Date.now()
        });
        
    } catch (error) {
        console.error('❌ Failed to get directory statistics:', error);
        sendResponse({
            success: false,
            error: error.message,
            timestamp: Date.now()
        });
    }
}

console.log('✅ Auto-Bolt Advanced Background Script loaded successfully');

/**
 * ADVANCED DIRECTORY AUTOMATION FEATURES:
 * 
 * 1. MASTER DIRECTORY MANAGEMENT:
 *    - 63 business directories with full metadata
 *    - Smart filtering by difficulty, anti-bot, login requirements
 *    - Priority-based processing recommendations
 *    - Category-based organization and statistics
 * 
 * 2. INTELLIGENT QUEUE PROCESSING:
 *    - Batch processing with configurable delays
 *    - Exponential backoff retry logic (3 attempts max)
 *    - Smart tab management and reuse
 *    - Human-like delay patterns for anti-detection
 * 
 * 3. ADVANCED FORM POPULATION:
 *    - Directory-specific field mapping
 *    - Fallback pattern matching for unknown forms
 *    - Special handling for multi-step forms, CAPTCHAs
 *    - Automated form submission with validation
 * 
 * 4. COMPREHENSIVE ERROR HANDLING:
 *    - Detailed progress tracking and reporting
 *    - Graceful failure handling with skip logic
 *    - Real-time status updates to frontend
 *    - Complete audit trail of all activities
 * 
 * 5. SECURITY & COMPLIANCE:
 *    - Respects robots.txt and rate limits
 *    - Avoids directories with strong anti-bot measures
 *    - Provides manual intervention points for CAPTCHAs
 *    - Maintains security best practices throughout
 */

/**
 * LEGACY LIMITATIONS (still apply to BATCH_FILL operations):
 * 
 * 1. TAB MANAGEMENT:
 *    - Limited to one batch process at a time
 *    - If target tab is closed during processing, operation fails
 *    - Chrome popup blockers may prevent new tab creation
 * 
 * 2. SCRIPT INJECTION:
 *    - Content scripts may not work on chrome:// or extension pages
 *    - Some sites may block script injection via CSP
 *    - File:// URLs require special permissions
 * 
 * 3. PERFORMANCE LIMITS:
 *    - Large batches (>100 records) may cause memory issues
 *    - Network timeouts can interrupt processing
 *    - Browser may throttle if too many rapid operations
 * 
 * 4. FALLBACK STRATEGIES:
 *    - Retry failed records up to maxRetries times
 *    - Skip invalid records and continue processing
 *    - Graceful error reporting with detailed logs
 *    - Allow manual cancellation at any time
 * 
 * 5. SECURITY CONSIDERATIONS:
 *    - Content script has same origin restrictions
 *    - Cannot access cross-origin frames
 *    - Limited by site's Content Security Policy
 */