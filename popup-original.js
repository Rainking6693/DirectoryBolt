/**
 * Auto-Bolt Chrome Extension - Popup Script
 * Professional UI with button-triggered Airtable integration
 */

// Default Airtable Configuration (can be overridden in settings)
const DEFAULT_AIRTABLE_CONFIG = {
    baseId: 'appZDNMzebkaOkLXo',
    tableName: 'Sheet1',
    apiToken: 'your_airtable_api_token_here',
    apiUrl: 'https://api.airtable.com/v0'
};

// UI State Management
class UIManager {
    constructor() {
        this.elements = {};
        this.isLoading = false;
        this.batchProcessing = false;
        this.batchCancelled = false;
        this.allRecords = [];
        this.batchStats = {
            total: 0,
            processed: 0,
            successful: 0,
            failed: 0
        };
    }

    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.loadStoredSettings();
        this.loadStoredBusinessData();
        
        // Add fill forms button if bridge is available
        if (typeof addFillButtonToPopup === 'function') {
            addFillButtonToPopup();
        }
    }

    cacheElements() {
        this.elements = {
            fetchButton: document.getElementById('fetchButton'),
            fillFormsButton: document.getElementById('fillFormsButton'),
            batchFillButton: document.getElementById('batchFillButton'),
            clearDataButton: document.getElementById('clearDataButton'),
            saveSettings: document.getElementById('saveSettings'),
            statusIndicator: document.getElementById('statusIndicator'),
            statusDot: document.getElementById('statusDot'),
            statusText: document.getElementById('statusText'),
            businessInfoDisplay: document.getElementById('businessInfoDisplay'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            toast: document.getElementById('toast'),
            toastMessage: document.getElementById('toastMessage'),
            toastClose: document.getElementById('toastClose'),
            airtableKey: document.getElementById('airtableKey'),
            baseId: document.getElementById('baseId'),
            tableId: document.getElementById('tableId'),
            helpLink: document.getElementById('helpLink'),
            aboutLink: document.getElementById('aboutLink'),
            // Batch progress elements
            batchProgressSection: document.getElementById('batchProgressSection'),
            cancelBatchButton: document.getElementById('cancelBatchButton'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            progressPercentage: document.getElementById('progressPercentage'),
            currentRecordStatus: document.getElementById('currentRecordStatus'),
            successCount: document.getElementById('successCount'),
            errorCount: document.getElementById('errorCount'),
            logContent: document.getElementById('logContent')
        };
    }

    attachEventListeners() {
        // Main action buttons
        this.elements.fetchButton.addEventListener('click', () => this.handleFetchBusinessData());
        this.elements.fillFormsButton.addEventListener('click', () => this.handleFillForms());
        this.elements.batchFillButton.addEventListener('click', () => this.handleBatchFillAll());
        this.elements.clearDataButton.addEventListener('click', () => this.handleClearData());
        this.elements.cancelBatchButton.addEventListener('click', () => this.handleCancelBatch());
        
        // Settings
        this.elements.saveSettings.addEventListener('click', () => this.handleSaveSettings());
        
        // Toast close
        this.elements.toastClose.addEventListener('click', () => this.hideToast());
        
        // Auto-hide toast after 5 seconds
        let toastTimeout;
        const showToastWithTimeout = (originalShowToast) => {
            return (...args) => {
                originalShowToast.call(this, ...args);
                clearTimeout(toastTimeout);
                toastTimeout = setTimeout(() => this.hideToast(), 5000);
            };
        };
        this.showToast = showToastWithTimeout(this.showToast);

        // Help and about links
        this.elements.helpLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showToast('Help documentation coming soon!', 'info');
        });

        this.elements.aboutLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.showToast('Auto-Bolt v1.0.0 - Automated Business Info Manager', 'info');
        });
    }

    async loadStoredSettings() {
        try {
            const result = await this.getFromStorage(['airtableSettings']);
            if (result.airtableSettings) {
                const settings = result.airtableSettings;
                this.elements.airtableKey.value = settings.apiToken || '';
                this.elements.baseId.value = settings.baseId || '';
                this.elements.tableId.value = settings.tableName || '';
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    }

    async loadStoredBusinessData() {
        try {
            const result = await this.getFromStorage(['businessData']);
            if (result.businessData) {
                this.displayBusinessData(result.businessData);
                this.updateStatus('ready', 'Data loaded');
                this.elements.fillFormsButton.disabled = false;
                // Only enable batch fill if we have all records stored
                const allRecordsResult = await this.getFromStorage(['allBusinessRecords']);
                if (allRecordsResult.allBusinessRecords) {
                    this.allRecords = allRecordsResult.allBusinessRecords;
                    this.elements.batchFillButton.disabled = false;
                }
            }
        } catch (error) {
            console.error('Error loading business data:', error);
        }
    }

    async handleFetchBusinessData() {
        if (this.isLoading) return;
        
        try {
            this.setLoading(true);
            this.updateStatus('loading', 'Fetching data...');
            
            // Get current configuration
            const config = await this.getAirtableConfig();
            
            // Validate configuration
            this.validateConfig(config);
            
            // Fetch data from Airtable
            const businessData = await this.fetchFromAirtable(config);
            
            // Validate received data
            if (!businessData || !businessData.records || businessData.records.length === 0) {
                throw new Error('No business records found in Airtable');
            }
            
            // Get the first record
            const firstRecord = businessData.records[0];
            console.log('Retrieved business record:', firstRecord.id);
            
            // Store in Chrome storage
            await this.storeBusinessData(firstRecord);
            
            // Update UI
            // Store all records for batch processing
            this.allRecords = businessData.records;
            
            this.displayBusinessData(firstRecord);
            this.updateStatus('ready', 'Data loaded successfully');
            this.elements.fillFormsButton.disabled = false;
            this.elements.batchFillButton.disabled = false;
            
            this.showToast(`Business data fetched successfully! (${this.allRecords.length} records available)`, 'success');
            
        } catch (error) {
            console.error('Error fetching business data:', error);
            const errorMessage = this.getErrorMessage(error);
            this.updateStatus('error', errorMessage);
            this.showToast(errorMessage, 'error');
        } finally {
            this.setLoading(false);
        }
    }

    async handleFillForms() {
        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            console.log('🚀 Attempting to fill forms on tab:', tab.url);
            
            // Try direct messaging first (most reliable)
            const success = await this.sendMessageToContentScript(tab.id, {
                action: 'AUTO_BOLT_FILL_FORMS',
                type: 'FILL_FORMS',
                timestamp: Date.now()
            });
            
            if (success) {
                this.showToast('Form filling completed successfully!', 'success');
            } else {
                // Fallback: Try to inject and execute
                await this.fallbackFormFill(tab);
            }
            
        } catch (error) {
            console.error('Error filling forms:', error);
            this.showToast('Error filling forms: ' + error.message, 'error');
        }
    }

    /**
     * Bulletproof method to send messages to content script with comprehensive error handling
     * @param {number} tabId - The tab ID to send message to
     * @param {Object} message - The message to send
     * @returns {Promise<boolean>} - Success status
     */
    async sendMessageToContentScript(tabId, message) {
        return new Promise((resolve) => {
            console.log('📤 Sending message to content script:', message);
            
            // Set a timeout for the message
            const timeout = setTimeout(() => {
                console.warn('⚠️ Message timeout - content script may not be responding');
                resolve(false);
            }, 5000);
            
            try {
                chrome.tabs.sendMessage(tabId, message, (response) => {
                    clearTimeout(timeout);
                    
                    // Check for chrome runtime errors
                    if (chrome.runtime.lastError) {
                        const error = chrome.runtime.lastError.message;
                        console.error('❌ Chrome runtime error:', error);
                        
                        if (error.includes('Receiving end does not exist')) {
                            console.log('💡 Content script not ready, will try fallback');
                        } else if (error.includes('Cannot access')) {
                            console.log('🚫 Cannot access this page (restricted URL)');
                        }
                        
                        resolve(false);
                        return;
                    }
                    
                    // Check response
                    if (response && response.success) {
                        console.log('✅ Content script responded successfully:', response);
                        resolve(true);
                    } else {
                        console.log('⚠️ Content script responded with error or no success flag');
                        resolve(false);
                    }
                });
            } catch (error) {
                clearTimeout(timeout);
                console.error('💥 Exception sending message:', error);
                resolve(false);
            }
        });
    }

    /**
     * Fallback method when direct messaging fails
     * @param {Object} tab - The tab object
     */
    async fallbackFormFill(tab) {
        console.log('🔄 Attempting fallback form filling method');
        
        try {
            // Check if we can access the tab
            if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://')) {
                throw new Error('Cannot access browser internal pages');
            }
            
            // For file:// URLs, we need special handling
            if (tab.url.startsWith('file://')) {
                console.log('📁 Handling file:// URL with special injection');
                await this.handleFileProtocolInjection(tab);
                return;
            }
            
            // Try to re-inject content script and then send message
            console.log('🔧 Re-injecting content script and trying again');
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });
            
            // Wait a bit for content script to initialize
            await this.delay(1000);
            
            // Try messaging again
            const retrySuccess = await this.sendMessageToContentScript(tab.id, {
                action: 'AUTO_BOLT_FILL_FORMS',
                type: 'FILL_FORMS',
                retry: true,
                timestamp: Date.now()
            });
            
            if (retrySuccess) {
                this.showToast('Form filling completed after retry!', 'success');
            } else {
                throw new Error('Content script still not responding after injection');
            }
            
        } catch (error) {
            console.error('💥 Fallback method failed:', error);
            this.showToast('Unable to fill forms on this page: ' + error.message, 'error');
        }
    }

    /**
     * Special handling for file:// protocol URLs
     * @param {Object} tab - The tab object
     */
    async handleFileProtocolInjection(tab) {
        try {
            console.log('📁 Executing direct form fill for file:// URL');
            
            // Load business data
            const businessData = await this.getFromStorage(['businessData']);
            if (!businessData.businessData) {
                throw new Error('No business data available');
            }
            
            // Inject a comprehensive form filling script
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (businessFields) => {
                    // Inline form filling logic for file:// URLs
                    console.log('🔧 Executing inline form fill on file:// page');
                    
                    const fillForm = () => {
                        const forms = document.querySelectorAll('form');
                        let totalFilled = 0;
                        
                        // Field mapping logic
                        const fieldMappings = {
                            'company': ['companyName', 'company_name', 'business_name', 'businessName'],
                            'business': ['companyName', 'company_name', 'business_name', 'businessName'],
                            'email': ['email', 'emailAddress', 'email_address', 'contactEmail'],
                            'phone': ['phone', 'phoneNumber', 'phone_number', 'telephone'],
                            'address': ['address', 'streetAddress', 'street_address', 'address1'],
                            'city': ['city', 'town', 'locality'],
                            'state': ['state', 'province', 'region'],
                            'zip': ['zipCode', 'zip_code', 'postalCode', 'postal_code'],
                            'website': ['website', 'url', 'homepage'],
                            'first': ['firstName', 'first_name', 'givenName'],
                            'last': ['lastName', 'last_name', 'familyName', 'surname']
                        };
                        
                        forms.forEach(form => {
                            const inputs = form.querySelectorAll('input:not([type="submit"]):not([type="button"]):not([type="hidden"]), select, textarea');
                            
                            inputs.forEach(input => {
                                if (input.disabled || input.readOnly) return;
                                
                                const searchTerms = [
                                    (input.name || '').toLowerCase(),
                                    (input.id || '').toLowerCase(),
                                    (input.placeholder || '').toLowerCase()
                                ].filter(term => term.length > 0);
                                
                                // Find matching field
                                for (const searchTerm of searchTerms) {
                                    for (const [keyword, businessFieldNames] of Object.entries(fieldMappings)) {
                                        if (searchTerm.includes(keyword)) {
                                            for (const fieldName of businessFieldNames) {
                                                if (businessFields[fieldName]) {
                                                    input.value = String(businessFields[fieldName]);
                                                    input.dispatchEvent(new Event('input', { bubbles: true }));
                                                    input.dispatchEvent(new Event('change', { bubbles: true }));
                                                    
                                                    // Visual feedback
                                                    const originalStyle = input.style.cssText;
                                                    input.style.cssText += 'border: 2px solid #4285f4; background-color: #e3f2fd;';
                                                    setTimeout(() => {
                                                        input.style.cssText = originalStyle;
                                                    }, 2000);
                                                    
                                                    totalFilled++;
                                                    return;
                                                }
                                            }
                                        }
                                    }
                                }
                            });
                        });
                        
                        console.log(`✅ Filled ${totalFilled} fields on file:// page`);
                        return totalFilled;
                    };
                    
                    const filledCount = fillForm();
                    return { success: true, filledCount };
                },
                args: [businessData.businessData.fields]
            });
            
            this.showToast('Form filling completed on local file!', 'success');
            
        } catch (error) {
            console.error('💥 File protocol injection failed:', error);
            throw error;
        }
    }

    /**
     * Utility delay function
     * @param {number} ms - Milliseconds to delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Handle batch fill all records
     */
    async handleBatchFillAll() {
        if (this.batchProcessing) {
            this.showToast('Batch processing already in progress', 'warning');
            return;
        }

        if (!this.allRecords || this.allRecords.length === 0) {
            this.showToast('No records available. Please fetch business data first.', 'error');
            return;
        }

        try {
            this.startBatchProcessing();
            
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (!tab) {
                throw new Error('No active tab found');
            }

            this.logBatchMessage(`Starting batch processing of ${this.allRecords.length} records on ${tab.url}`);
            
            // Send all records to background script
            const message = {
                action: 'BATCH_FILL',
                type: 'BATCH_FILL',
                records: this.allRecords,
                tabId: tab.id,
                timestamp: Date.now()
            };

            // Send to background script
            const response = await this.sendMessageToBackground(message);
            if (!response || !response.success) {
                throw new Error(response?.error || 'Background script failed to start batch processing');
            }

            this.logBatchMessage('Batch processing initiated successfully');
            
            // Start monitoring progress
            this.monitorBatchProgress();
            
        } catch (error) {
            console.error('Error starting batch processing:', error);
            this.showToast('Failed to start batch processing: ' + error.message, 'error');
            this.stopBatchProcessing();
        }
    }

    /**
     * Send message to background script
     */
    async sendMessageToBackground(message) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Background message error:', chrome.runtime.lastError);
                    resolve({ success: false, error: chrome.runtime.lastError.message });
                } else {
                    resolve(response);
                }
            });
        });
    }

    /**
     * Monitor batch processing progress
     */
    monitorBatchProgress() {
        const checkProgress = async () => {
            if (this.batchCancelled) {
                return;
            }

            try {
                // Query background script for progress
                const response = await this.sendMessageToBackground({
                    action: 'GET_BATCH_PROGRESS',
                    type: 'GET_BATCH_PROGRESS'
                });

                if (response && response.success) {
                    const progress = response.progress;
                    this.updateBatchProgress(progress);

                    if (progress.completed) {
                        this.completeBatchProcessing(progress);
                        return;
                    }
                }

                // Continue monitoring if not completed
                if (this.batchProcessing && !this.batchCancelled) {
                    setTimeout(checkProgress, 1000);
                }

            } catch (error) {
                console.error('Error monitoring batch progress:', error);
                this.logBatchMessage(`Error monitoring progress: ${error.message}`);
                
                if (this.batchProcessing && !this.batchCancelled) {
                    setTimeout(checkProgress, 2000); // Retry with longer delay
                }
            }
        };

        checkProgress();
    }

    /**
     * Start batch processing UI
     */
    startBatchProcessing() {
        this.batchProcessing = true;
        this.batchCancelled = false;
        this.batchStats = {
            total: this.allRecords.length,
            processed: 0,
            successful: 0,
            failed: 0
        };

        // Show progress section
        this.elements.batchProgressSection.style.display = 'block';
        
        // Disable buttons
        this.elements.batchFillButton.disabled = true;
        this.elements.fetchButton.disabled = true;
        this.elements.fillFormsButton.disabled = true;
        
        // Reset progress UI
        this.resetBatchProgress();
        
        // Update main status
        this.updateStatus('loading', 'Running batch processing...');
    }

    /**
     * Reset batch progress UI
     */
    resetBatchProgress() {
        this.elements.progressFill.style.width = '0%';
        this.elements.progressText.textContent = `0 / ${this.batchStats.total} records processed`;
        this.elements.progressPercentage.textContent = '0%';
        this.elements.currentRecordStatus.textContent = 'Starting...';
        this.elements.successCount.textContent = '0';
        this.elements.errorCount.textContent = '0';
        this.elements.logContent.innerHTML = '';
    }

    /**
     * Update batch progress
     */
    updateBatchProgress(progress) {
        this.batchStats = {
            total: progress.total || this.batchStats.total,
            processed: progress.processed || 0,
            successful: progress.successful || 0,
            failed: progress.failed || 0
        };

        const percentage = this.batchStats.total > 0 ? 
            Math.round((this.batchStats.processed / this.batchStats.total) * 100) : 0;

        // Update progress bar
        this.elements.progressFill.style.width = `${percentage}%`;
        this.elements.progressText.textContent = 
            `${this.batchStats.processed} / ${this.batchStats.total} records processed`;
        this.elements.progressPercentage.textContent = `${percentage}%`;

        // Update counts
        this.elements.successCount.textContent = this.batchStats.successful.toString();
        this.elements.errorCount.textContent = this.batchStats.failed.toString();

        // Update current status
        if (progress.currentRecord) {
            const recordId = progress.currentRecord.id || 'Unknown';
            const recordName = progress.currentRecord.fields?.companyName || 
                              progress.currentRecord.fields?.businessName || 
                              recordId;
            this.elements.currentRecordStatus.textContent = `Processing: ${recordName}`;
        } else if (progress.completed) {
            this.elements.currentRecordStatus.textContent = 'Completed';
        }

        // Add log messages if provided
        if (progress.messages && Array.isArray(progress.messages)) {
            progress.messages.forEach(message => {
                this.logBatchMessage(message.text, message.type);
            });
        }
    }

    /**
     * Complete batch processing
     */
    completeBatchProcessing(progress) {
        this.batchProcessing = false;
        
        // Final progress update
        this.updateBatchProgress(progress);
        
        // Update status
        const successRate = this.batchStats.total > 0 ? 
            Math.round((this.batchStats.successful / this.batchStats.total) * 100) : 0;
        
        this.updateStatus('ready', `Batch complete: ${successRate}% success rate`);
        
        // Show completion message
        const message = `Batch processing completed! ${this.batchStats.successful} successful, ${this.batchStats.failed} failed out of ${this.batchStats.total} records.`;
        this.showToast(message, this.batchStats.failed > 0 ? 'warning' : 'success');
        
        this.logBatchMessage(message, 'success');
        
        // Re-enable buttons
        this.elements.batchFillButton.disabled = false;
        this.elements.fetchButton.disabled = false;
        this.elements.fillFormsButton.disabled = false;
    }

    /**
     * Handle batch cancellation
     */
    async handleCancelBatch() {
        if (!this.batchProcessing) {
            return;
        }

        try {
            this.batchCancelled = true;
            
            // Send cancellation message to background script
            await this.sendMessageToBackground({
                action: 'CANCEL_BATCH',
                type: 'CANCEL_BATCH'
            });
            
            this.logBatchMessage('Batch processing cancelled by user', 'warning');
            this.showToast('Batch processing cancelled', 'info');
            
        } catch (error) {
            console.error('Error cancelling batch:', error);
            this.showToast('Error cancelling batch: ' + error.message, 'error');
        } finally {
            this.stopBatchProcessing();
        }
    }

    /**
     * Stop batch processing and reset UI
     */
    stopBatchProcessing() {
        this.batchProcessing = false;
        this.batchCancelled = false;
        
        // Hide progress section
        this.elements.batchProgressSection.style.display = 'none';
        
        // Re-enable buttons
        this.elements.batchFillButton.disabled = false;
        this.elements.fetchButton.disabled = false;
        this.elements.fillFormsButton.disabled = false;
        
        // Reset status
        this.updateStatus('ready', 'Ready');
    }

    /**
     * Log batch processing message
     */
    logBatchMessage(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.innerHTML = `<span class="log-time">${timestamp}</span> <span class="log-message">${message}</span>`;
        
        this.elements.logContent.appendChild(logEntry);
        
        // Auto-scroll to bottom
        this.elements.logContent.scrollTop = this.elements.logContent.scrollHeight;
        
        // Keep only last 50 log entries
        const entries = this.elements.logContent.children;
        while (entries.length > 50) {
            this.elements.logContent.removeChild(entries[0]);
        }
    }

    async handleClearData() {
        try {
            await chrome.storage.local.remove(['businessData', 'allBusinessRecords']);
            this.elements.businessInfoDisplay.innerHTML = `
                <div class="no-data">
                    <p>No business data loaded</p>
                    <p class="help-text">Click "Fetch Business Info" to load data from Airtable</p>
                </div>
            `;
            this.elements.fillFormsButton.disabled = true;
            this.elements.batchFillButton.disabled = true;
            this.allRecords = [];
            this.updateStatus('ready', 'Ready');
            this.showToast('Business data cleared', 'success');
        } catch (error) {
            console.error('Error clearing data:', error);
            this.showToast('Error clearing data: ' + error.message, 'error');
        }
    }

    async handleSaveSettings() {
        try {
            const settings = {
                apiToken: this.elements.airtableKey.value.trim(),
                baseId: this.elements.baseId.value.trim(),
                tableName: this.elements.tableId.value.trim()
            };

            if (!settings.apiToken || !settings.baseId || !settings.tableName) {
                throw new Error('All settings fields are required');
            }

            await chrome.storage.local.set({ airtableSettings: settings });
            this.showToast('Settings saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showToast('Error saving settings: ' + error.message, 'error');
        }
    }

    async getAirtableConfig() {
        try {
            const result = await this.getFromStorage(['airtableSettings']);
            if (result.airtableSettings) {
                return {
                    ...DEFAULT_AIRTABLE_CONFIG,
                    ...result.airtableSettings,
                    apiUrl: DEFAULT_AIRTABLE_CONFIG.apiUrl // Always use default API URL
                };
            }
            return DEFAULT_AIRTABLE_CONFIG;
        } catch (error) {
            console.error('Error getting config:', error);
            return DEFAULT_AIRTABLE_CONFIG;
        }
    }

    validateConfig(config) {
        if (!config.baseId) {
            throw new Error('Airtable base ID is not configured');
        }
        if (!config.apiToken) {
            throw new Error('Airtable API token is not configured');
        }
        if (!config.tableName) {
            throw new Error('Airtable table name is not configured');
        }
    }

    async fetchFromAirtable(config) {
        const url = `${config.apiUrl}/${config.baseId}/${encodeURIComponent(config.tableName)}`;
        
        console.log('Fetching from Airtable...');

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${config.apiToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Airtable response received, records count:', data.records?.length || 0);
        
        return data;
    }

    async storeBusinessData(businessRecord) {
        const dataToStore = {
            businessData: {
                id: businessRecord.id,
                fields: businessRecord.fields,
                createdTime: businessRecord.createdTime,
                lastFetched: new Date().toISOString()
            },
            allBusinessRecords: this.allRecords
        };

        await chrome.storage.local.set(dataToStore);
        console.log('Business data stored successfully');
    }

    displayBusinessData(businessData) {
        const fields = businessData.fields || {};
        const fieldEntries = Object.entries(fields);
        
        if (fieldEntries.length === 0) {
            this.elements.businessInfoDisplay.innerHTML = `
                <div class="no-data">
                    <p>No field data available</p>
                </div>
            `;
            return;
        }

        const dataHtml = `
            <div class="business-data">
                ${fieldEntries.map(([key, value]) => `
                    <div class="data-item">
                        <div class="data-label">${this.formatLabel(key)}:</div>
                        <div class="data-value">${this.formatValue(value)}</div>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color); font-size: 11px; color: var(--text-secondary);">
                Last fetched: ${new Date(businessData.lastFetched || businessData.createdTime).toLocaleString()}
            </div>
        `;
        
        this.elements.businessInfoDisplay.innerHTML = dataHtml;
    }

    formatLabel(key) {
        return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
    }

    formatValue(value) {
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        if (typeof value === 'object' && value !== null) {
            return JSON.stringify(value);
        }
        if (typeof value === 'string' && value.length > 50) {
            return value.substring(0, 50) + '...';
        }
        return String(value || 'N/A');
    }

    setLoading(loading) {
        this.isLoading = loading;
        this.elements.loadingOverlay.style.display = loading ? 'flex' : 'none';
        this.elements.fetchButton.disabled = loading;
    }

    updateStatus(type, text) {
        this.elements.statusText.textContent = text;
        this.elements.statusDot.className = `status-dot ${type}`;
    }

    showToast(message, type = 'info') {
        this.elements.toastMessage.textContent = message;
        this.elements.toast.className = `toast ${type}`;
        this.elements.toast.style.display = 'flex';
    }

    hideToast() {
        this.elements.toast.style.display = 'none';
    }

    getErrorMessage(error) {
        if (error.message.includes('Failed to fetch')) {
            return 'Network error - please check your internet connection';
        }
        
        if (error.message.includes('401')) {
            return 'Authentication failed - please check your API token';
        }
        
        if (error.message.includes('403')) {
            return 'Access forbidden - please check your Airtable permissions';
        }
        
        if (error.message.includes('404')) {
            return 'Table not found - please check your base ID and table name';
        }
        
        if (error.message.includes('429')) {
            return 'Rate limit exceeded - please try again later';
        }
        
        return error.message || 'Unknown error occurred';
    }

    getFromStorage(keys) {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get(keys, (result) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(result);
                }
            });
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Auto-Bolt popup initialized');
    const uiManager = new UIManager();
    uiManager.init();
});

// Handle popup visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Popup hidden');
    } else {
        console.log('Popup visible');
    }
});

// Handle popup unload
window.addEventListener('beforeunload', () => {
    console.log('Popup closing');
});

// Export for testing purposes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        UIManager,
        DEFAULT_AIRTABLE_CONFIG
    };
}