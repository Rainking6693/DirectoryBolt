/**
 * Auto-Bolt Chrome Extension - Optimized Core Content Script
 * Streamlined for performance with lazy loading capabilities
 */

class AutoBoltContentScript {
    constructor() {
        this.businessData = null;
        this.isActive = false;
        this.formFields = new Map();
        this.debugMode = true;
        this.startTime = Date.now();
        
        // Lazy-loaded modules
        this.fieldMappingEngine = null;
        this.formDetectionEngine = null;
        this.fallbackEngine = null;
        
        // Core performance tracking
        this.performanceMetrics = {
            formsDetected: 0,
            fieldsFound: 0,
            fieldsMapped: 0,
            fillSuccess: 0,
            fillFailures: 0
        };
        
        // Essential state management
        this.formStates = new Map();
        this.processedForms = new Set();
        
        this.init();
    }

    async init() {
        this.debugLog('🚀 AUTO-BOLT CONTENT SCRIPT STARTING!', 'init');
        
        await this.loadBusinessData();
        this.setupMessageListeners();
        this.setupBasicFormDetection();
        this.notifyReady();
        
        const initTime = Date.now() - this.startTime;
        this.debugLog(`✅ CONTENT SCRIPT INITIALIZED! (${initTime}ms)`, 'init');
    }

    debugLog(message, category = 'general', emoji = '📝') {
        if (!this.debugMode) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const formattedMessage = `[AUTO-BOLT ${timestamp}] ${emoji} ${message}`;
        console.log(`%c${formattedMessage}`, 'color: #4285f4; font-weight: bold;');
    }

    async loadBusinessData() {
        try {
            const result = await chrome.storage.local.get(['businessData']);
            if (result.businessData) {
                this.businessData = result.businessData;
                this.debugLog('✅ Business data loaded!', 'storage');
                this.mapBusinessFields();
            } else {
                this.debugLog('⚠️ No business data found', 'storage');
            }
        } catch (error) {
            this.debugLog(`❌ Error loading data: ${error.message}`, 'storage');
        }
    }

    setupMessageListeners() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true;
        });

        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'local' && changes.businessData) {
                this.businessData = changes.businessData.newValue;
                if (this.businessData) {
                    this.mapBusinessFields();
                }
            }
        });
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action || request.type) {
                case 'AUTO_BOLT_FILL_FORMS':
                case 'FILL_FORMS':
                    await this.fillDetectedForms();
                    sendResponse({ success: true, message: 'Forms filled', url: window.location.href });
                    break;
                case 'GET_PAGE_INFO':
                    sendResponse({
                        success: true,
                        url: window.location.href,
                        hostname: window.location.hostname,
                        title: document.title,
                        formsCount: document.forms.length,
                        contentScriptReady: true
                    });
                    break;
                case 'PING':
                    sendResponse({ success: true, message: 'Content script ready', url: window.location.href });
                    break;
                default:
                    sendResponse({ success: false, message: 'Unknown message type' });
            }
        } catch (error) {
            sendResponse({ success: false, message: error.message });
        }
    }

    setupBasicFormDetection() {
        // Immediate basic detection
        this.detectForms();
        
        // Enhanced detection with lazy loading
        if (document.readyState === 'complete') {
            setTimeout(() => this.initAdvancedDetection(), 100);
        } else {
            window.addEventListener('load', () => {
                setTimeout(() => this.initAdvancedDetection(), 100);
            });
        }
        
        // Basic mutation observer
        const observer = new MutationObserver(() => {
            if (document.visibilityState === 'visible') {
                this.detectForms();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    async initAdvancedDetection() {
        // Lazy load advanced modules only when needed
        if (!this.formDetectionEngine) {
            try {
                await this.loadAdvancedModules();
                this.setupAdvancedFormDetection();
            } catch (error) {
                this.debugLog(`⚠️ Advanced detection unavailable: ${error.message}`, 'forms');
            }
        }
    }

    async loadAdvancedModules() {
        // Dynamically import advanced modules
        const modules = await import('./content-advanced.js');
        this.fieldMappingEngine = new modules.AdvancedFieldMapper();
        this.formDetectionEngine = new modules.DynamicFormDetector();
        this.fallbackEngine = new modules.FallbackSelectorEngine();
    }

    detectForms() {
        const forms = document.querySelectorAll('form');
        this.debugLog(`Found ${forms.length} forms`, 'forms');
        
        forms.forEach((form, index) => {
            if (!this.processedForms.has(form)) {
                this.analyzeForm(form, index);
            }
        });
    }

    analyzeForm(form, index) {
        const inputs = form.querySelectorAll('input, select, textarea');
        this.debugLog(`Analyzing form ${index + 1} with ${inputs.length} inputs`, 'forms');
        
        const formInfo = {
            element: form,
            inputs: [],
            mappings: new Map()
        };
        
        if (!form.dataset.autoBoltId) {
            form.dataset.autoBoltId = `autobolt_${Date.now()}_${index}`;
        }
        
        inputs.forEach((input, inputIndex) => {
            const fieldInfo = this.analyzeField(input);
            if (fieldInfo) {
                formInfo.inputs.push(fieldInfo);
                const mapping = this.createFieldMapping(fieldInfo);
                if (mapping) {
                    formInfo.mappings.set(fieldInfo, mapping);
                }
            }
        });
        
        this.formFields.set(`form_${form.dataset.autoBoltId}`, formInfo);
        this.processedForms.add(form);
        this.performanceMetrics.formsDetected++;
    }

    analyzeField(input) {
        if (['submit', 'button', 'hidden'].includes(input.type) || input.disabled || input.readOnly) {
            return null;
        }
        
        return {
            element: input,
            type: input.type || 'text',
            name: input.name || '',
            id: input.id || '',
            placeholder: input.placeholder || '',
            label: this.findFieldLabel(input),
            className: input.className || ''
        };
    }

    findFieldLabel(input) {
        if (input.id) {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label) return label.textContent.trim();
        }
        
        const parentLabel = input.closest('label');
        if (parentLabel) {
            return parentLabel.textContent.replace(input.value || '', '').trim();
        }
        
        const prevSibling = input.previousElementSibling;
        if (prevSibling && ['LABEL', 'SPAN'].includes(prevSibling.tagName)) {
            return prevSibling.textContent.trim();
        }
        
        return '';
    }

    createFieldMapping(fieldInfo) {
        if (!this.businessData?.fields) return null;
        
        const { fields } = this.businessData;
        const identifiers = [
            fieldInfo.label,
            fieldInfo.placeholder,
            fieldInfo.name,
            fieldInfo.id
        ].filter(Boolean);
        
        // Quick mapping patterns
        const patterns = {
            companyName: /company|business|organization/i,
            email: /e?mail/i,
            phone: /phone|tel|mobile/i,
            address: /address|street/i,
            city: /city|town/i,
            state: /state|province/i,
            zipCode: /zip|postal/i,
            country: /country/i,
            website: /website|url/i,
            firstName: /first.*name|given.*name/i,
            lastName: /last.*name|family.*name|surname/i,
            contactName: /contact.*name|full.*name|name/i
        };
        
        for (const identifier of identifiers) {
            for (const [fieldName, pattern] of Object.entries(patterns)) {
                if (pattern.test(identifier) && fields[fieldName]) {
                    return {
                        businessField: fieldName,
                        value: fields[fieldName],
                        confidence: 0.8
                    };
                }
            }
        }
        
        return null;
    }

    mapBusinessFields() {
        this.formFields.forEach((formInfo) => {
            formInfo.inputs.forEach(fieldInfo => {
                const mapping = this.createFieldMapping(fieldInfo);
                if (mapping) {
                    formInfo.mappings.set(fieldInfo, mapping);
                }
            });
        });
    }

    async fillDetectedForms() {
        this.debugLog('🎯 Starting form fill operation', 'filling');
        
        if (!this.businessData) {
            this.showNotification('No business data available', 'warning');
            return;
        }
        
        let totalFilled = 0;
        let totalAttempted = 0;
        
        this.formFields.forEach((formInfo, formKey) => {
            formInfo.mappings.forEach((mapping, fieldInfo) => {
                if (mapping?.value) {
                    totalAttempted++;
                    try {
                        this.fillField(fieldInfo.element, mapping.value);
                        totalFilled++;
                    } catch (error) {
                        this.debugLog(`Error filling field: ${error.message}`, 'filling');
                    }
                }
            });
        });
        
        const successRate = totalAttempted > 0 ? Math.round((totalFilled / totalAttempted) * 100) : 0;
        this.debugLog(`Form fill complete: ${totalFilled}/${totalAttempted} (${successRate}%)`, 'filling');
        
        if (totalFilled > 0) {
            this.showNotification(`Filled ${totalFilled} fields (${successRate}% success)`, 'success');
        } else {
            this.showNotification('No matching fields found', 'info');
        }
    }

    fillField(element, value) {
        element.value = String(value);
        
        ['input', 'change', 'blur'].forEach(eventType => {
            element.dispatchEvent(new Event(eventType, { bubbles: true }));
        });
        
        // React component handling
        if (element._valueTracker) {
            element._valueTracker.setValue('');
        }
        
        this.highlightField(element);
    }

    highlightField(element) {
        const originalStyle = element.style.cssText;
        element.style.cssText += 'border: 2px solid #4285f4; background-color: #e3f2fd;';
        
        setTimeout(() => {
            element.style.cssText = originalStyle;
        }, 2000);
    }

    showNotification(message, type = 'info') {
        let notification = document.getElementById('autobolt-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'autobolt-notification';
            notification.style.cssText = `
                position: fixed; top: 20px; right: 20px; z-index: 10000;
                max-width: 300px; padding: 12px 16px; border-radius: 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px; font-weight: 500; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.3s ease; transform: translateX(100%);
            `;
            document.body.appendChild(notification);
        }
        
        const styles = {
            success: { background: '#4caf50', color: 'white' },
            error: { background: '#f44336', color: 'white' },
            warning: { background: '#ff9800', color: 'white' },
            info: { background: '#2196f3', color: 'white' }
        };
        
        const style = styles[type] || styles.info;
        Object.assign(notification.style, style);
        notification.textContent = message;
        notification.style.transform = 'translateX(0)';
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
        }, 5000);
    }

    notifyReady() {
        try {
            chrome.runtime.sendMessage({
                type: 'CONTENT_SCRIPT_READY',
                url: window.location.href,
                hostname: window.location.hostname,
                hasBusinessData: !!this.businessData,
                formCount: this.formFields.size,
                timestamp: Date.now()
            });
        } catch (error) {
            this.debugLog(`Could not notify extension: ${error.message}`, 'messaging');
        }
    }

    setupAdvancedFormDetection() {
        if (!this.formDetectionEngine) return;
        
        this.formDetectionEngine.initialize(this);
        this.setupAdvancedMutationObserver();
        this.setupPeriodicScanning();
    }

    setupAdvancedMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            let hasFormChanges = false;
            
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'FORM' || node.querySelector('form')) {
                            hasFormChanges = true;
                        }
                    }
                });
            });
            
            if (hasFormChanges) {
                this.detectForms();
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class', 'hidden']
        });
    }

    setupPeriodicScanning() {
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                const currentFormCount = document.querySelectorAll('form').length;
                if (currentFormCount !== this.formFields.size) {
                    this.detectForms();
                }
            }
        }, 5000);
    }
}

// Initialize content script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.autoBolt = new AutoBoltContentScript();
    });
} else {
    window.autoBolt = new AutoBoltContentScript();
}

// Global error handler
window.addEventListener('error', (event) => {
    if (window.autoBolt?.debugLog) {
        window.autoBolt.debugLog(`Global error: ${event.error?.message}`, 'error');
    }
});

// Performance monitoring
window.addEventListener('beforeunload', () => {
    if (window.autoBolt?.performanceMetrics) {
        console.log('📊 Auto-Bolt Performance:', window.autoBolt.performanceMetrics);
    }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AutoBoltContentScript };
}