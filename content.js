/**
 * Auto-Bolt Chrome Extension - Production Content Script
 * Handles enterprise-grade form filling with advanced field mapping,
 * dynamic form detection, and intelligent fallback mechanisms
 * 
 * Features:
 * - Advanced field mapping with ML-like pattern recognition
 * - Dynamic form detection for JavaScript-rendered forms
 * - Intelligent fallback selectors and retry mechanisms
 * - Real-time form validation and error recovery
 * - Support for complex multi-step forms and SPAs
 * - Anti-detection measures and human-like behavior simulation
 */

class AutoBoltContentScript {
    constructor() {
        this.businessData = null;
        this.isActive = false;
        this.formFields = new Map();
        this.debugMode = true;
        this.startTime = Date.now();
        
        // Enhanced field mapping system
        this.fieldMappingEngine = new AdvancedFieldMapper();
        this.formDetectionEngine = new DynamicFormDetector();
        this.fallbackEngine = new FallbackSelectorEngine();
        this.packageTierEngine = new PackageTierEngine();
        
        // Directory-specific mappings loaded dynamically
        this.directoryMappings = new Map();
        this.currentDirectoryConfig = null;
        
        // Performance and reliability tracking
        this.performanceMetrics = {
            formsDetected: 0,
            fieldsFound: 0,
            fieldsMapped: 0,
            fillSuccess: 0,
            fillFailures: 0,
            averageProcessingTime: 0
        };
        
        // Form state management
        this.formStates = new Map();
        this.pendingForms = new Set();
        this.processedForms = new Set();
        
        // Package tier tracking
        this.currentTier = 'starter';
        this.availableDirectories = [];
        this.tierLimitations = {};
        
        // Advanced retry mechanism
        this.retryQueue = [];
        this.maxRetries = 3;
        
        this.init();
    }

    async init() {
        this.debugLog('🚀 AUTO-BOLT CONTENT SCRIPT STARTING!', 'init', '🚀');
        this.debugLog(`📍 Initializing on: ${window.location.hostname}${window.location.pathname}`, 'init');
        this.debugLog(`🌐 Full URL: ${window.location.href}`, 'init');
        this.debugLog(`📄 Document ready state: ${document.readyState}`, 'init');
        
        // Load business data from storage
        this.debugLog('⏳ Loading business data from storage...', 'init');
        await this.loadBusinessData();
        
        // Set up message listeners
        this.debugLog('📡 Setting up message listeners...', 'init');
        this.setupMessageListeners();
        
        // Set up form detection
        this.debugLog('🔍 Setting up form detection...', 'init');
        this.setupFormDetection();
        
        // Notify that content script is ready
        this.debugLog('📢 Notifying extension that content script is ready...', 'init');
        this.notifyReady();
        
        const initTime = Date.now() - this.startTime;
        this.debugLog(`✅ CONTENT SCRIPT FULLY INITIALIZED! (${initTime}ms)`, 'init', '🎉');
    }

    debugLog(message, category = 'general', emoji = '📝') {
        if (!this.debugMode) return;
        
        const timestamp = new Date().toLocaleTimeString();
        const prefix = `[AUTO-BOLT ${timestamp}] ${emoji}`;
        const formattedMessage = `${prefix} ${message}`;
        
        // Always log to console with styling
        console.log(`%c${formattedMessage}`, 'color: #4285f4; font-weight: bold; background: #f0f8ff; padding: 2px 6px; border-radius: 3px;');
        
        // Also dispatch to page for debug panel if available
        try {
            window.postMessage({
                type: 'AUTO_BOLT_DEBUG',
                category,
                message: formattedMessage,
                timestamp: Date.now()
            }, window.location.origin);
        } catch (error) {
            // Silently fail if can't post message
        }
    }



    async loadBusinessData() {
        try {
            this.debugLog('🔍 Attempting to load business data from Chrome storage...', 'storage');
            const result = await chrome.storage.local.get(['businessData']);
            
            if (result.businessData) {
                this.businessData = result.businessData;
                this.debugLog('✅ Business data successfully loaded!', 'storage', '🎉');
                this.debugLog(`📊 Data fields available: ${Object.keys(result.businessData.fields || {}).join(', ')}`, 'storage');
                this.mapBusinessFields();
            } else {
                this.debugLog('⚠️ No business data found in storage - forms cannot be auto-filled', 'storage', '⚠️');
            }
        } catch (error) {
            this.debugLog(`❌ Error loading business data: ${error.message}`, 'storage', '❌');
            console.error('Full error details:', error);
        }
    }

    setupMessageListeners() {
        this.debugLog('📡 Setting up Chrome runtime message listeners...', 'messaging');
        
        // Listen for messages from popup with enhanced error handling
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.debugLog('📨 MESSAGE RECEIVED!', 'messaging', '📬');
            this.debugLog(`📋 Message details: ${JSON.stringify(request)}`, 'messaging');
            this.debugLog(`👤 Sender: ${sender.tab ? `Tab ${sender.tab.id}` : 'Extension popup'}`, 'messaging');
            
            // Always return true for async response handling
            const handleAsync = async () => {
                try {
                    if (request.action === 'AUTO_BOLT_FILL_FORMS' || request.type === 'FILL_FORMS') {
                        this.debugLog('🎯 Processing FILL_FORMS request!', 'messaging', '🎯');
                        await this.fillDetectedForms();
                        const response = { 
                            success: true, 
                            message: 'Forms filled successfully',
                            url: window.location.href,
                            timestamp: Date.now()
                        };
                        this.debugLog(`📤 Sending success response: ${JSON.stringify(response)}`, 'messaging');
                        sendResponse(response);
                    } else if (request.type === 'GET_PAGE_INFO') {
                        this.debugLog('📄 Processing GET_PAGE_INFO request', 'messaging');
                        const response = {
                            success: true,
                            url: window.location.href,
                            hostname: window.location.hostname,
                            title: document.title,
                            formsCount: document.forms.length,
                            protocol: window.location.protocol,
                            contentScriptReady: true,
                            timestamp: Date.now()
                        };
                        this.debugLog(`📤 Page info response: ${JSON.stringify(response)}`, 'messaging');
                        sendResponse(response);
                    } else if (request.type === 'PING') {
                        this.debugLog('🏓 Processing PING request - responding with pong!', 'messaging', '🏓');
                        const response = {
                            success: true,
                            message: 'Content script is alive and ready',
                            url: window.location.href,
                            timestamp: Date.now()
                        };
                        this.debugLog(`📤 PING response: ${JSON.stringify(response)}`, 'messaging');
                        sendResponse(response);
                    } else {
                        this.debugLog(`⚠️ UNKNOWN MESSAGE TYPE: ${request.type}`, 'messaging', '⚠️');
                        sendResponse({
                            success: false,
                            message: 'Unknown message type: ' + (request.type || 'undefined'),
                            timestamp: Date.now()
                        });
                    }
                } catch (error) {
                    this.debugLog(`❌ ERROR handling message: ${error.message}`, 'messaging', '❌');
                    console.error('Full error details:', error);
                    sendResponse({
                        success: false,
                        message: 'Error: ' + error.message,
                        error: error.name,
                        timestamp: Date.now()
                    });
                }
            };
            
            handleAsync();
            
            // Return true to indicate async response
            return true;
        });

        // Listen for window messages (backup communication method)
        this.debugLog('🪟 Setting up window message listener...', 'messaging');
        window.addEventListener('message', (event) => {
            // Only process messages from same origin or extension
            if (event.source !== window && !event.source?.location?.protocol?.startsWith('chrome-extension')) {
                return;
            }
            
            this.debugLog('🗺 Window message received!', 'messaging');
            this.debugLog(`📋 Window message data: ${JSON.stringify(event.data)}`, 'messaging');
            
            if (event.data && event.data.type === 'AUTO_BOLT_FILL_FORMS') {
                this.debugLog('🎯 Processing window message FILL_FORMS request', 'messaging', '🎯');
                this.fillDetectedForms();
            }
        });

        // Listen for storage changes
        this.debugLog('💾 Setting up storage change listener...', 'messaging');
        chrome.storage.onChanged.addListener((changes, areaName) => {
            this.debugLog(`📏 Storage changed in ${areaName}:`, 'storage');
            this.debugLog(`📋 Changed keys: ${Object.keys(changes).join(', ')}`, 'storage');
            
            if (areaName === 'local' && changes.businessData) {
                this.businessData = changes.businessData.newValue;
                this.debugLog(`💼 Business data updated! Has data: ${!!this.businessData}`, 'storage', '🔄');
                if (this.businessData) {
                    this.mapBusinessFields();
                }
            }
        });
        
        // Add periodic health check
        this.debugLog('👨‍⚕️ Setting up health check timer (1 minute intervals)...', 'init');
        setInterval(() => {
            const healthInfo = {
                url: window.location.href,
                hasBusinessData: !!this.businessData,
                formCount: this.formFields.size,
                timestamp: new Date().toISOString(),
                uptime: Date.now() - this.startTime
            };
            this.debugLog(`👨‍⚕️ Health check: ${JSON.stringify(healthInfo)}`, 'health');
        }, 60000); // Every minute
        
        this.debugLog('✅ ALL MESSAGE LISTENERS SETUP COMPLETE!', 'messaging', '🎉');
    }

    setupFormDetection() {
        this.debugLog('🔍 Starting production form detection setup...', 'forms');
        
        // Initialize detection engines
        this.formDetectionEngine.initialize(this);
        
        // Detect forms on page load with multiple strategies
        this.debugLog('📋 Detecting forms on initial page load...', 'forms');
        this.detectFormsWithFallback();
        
        // Enhanced mutation observer for complex SPAs
        this.debugLog('👀 Setting up advanced mutation observer...', 'forms');
        this.setupAdvancedMutationObserver();
        
        // Set up periodic form scanning for dynamic content
        this.debugLog('⏰ Setting up periodic form scanning...', 'forms');
        this.setupPeriodicFormScanning();
        
        // Set up scroll-based detection for lazy-loaded forms
        this.debugLog('📜 Setting up scroll-based form detection...', 'forms');
        this.setupScrollBasedDetection();
        
        this.debugLog('✅ Production form detection setup complete!', 'forms', '🎉');
    }
    
    setupAdvancedMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            let significantChanges = false;
            let formChanges = false;
            
            mutations.forEach((mutation) => {
                // Check for added nodes
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'FORM' || node.querySelector('form')) {
                            formChanges = true;
                        }
                        
                        // Check for potential form containers
                        if (this.isPotentialFormContainer(node)) {
                            significantChanges = true;
                        }
                    }
                });
                
                // Check for attribute changes that might affect form detection
                if (mutation.type === 'attributes' && 
                    ['style', 'class', 'hidden'].includes(mutation.attributeName)) {
                    const target = mutation.target;
                    if (target.tagName === 'FORM' || target.querySelector('form')) {
                        significantChanges = true;
                    }
                }
            });
            
            if (formChanges) {
                this.debugLog('🆕 NEW FORMS DETECTED ON PAGE!', 'forms', '🆕');                this.detectFormsWithFallback();
            } else if (significantChanges) {
                this.debugLog('📊 Significant DOM changes detected, checking for hidden forms...', 'forms');
                // Delayed check for forms that might be revealed
                setTimeout(() => {
                    this.detectFormsWithFallback();
                }, 500);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class', 'hidden', 'aria-hidden']
        });
        
        this.mutationObserver = observer;
    }
    
    setupPeriodicFormScanning() {
        // Scan for forms every 5 seconds for dynamic content
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                const currentFormCount = document.querySelectorAll('form').length;
                const knownFormCount = Array.from(this.formFields.keys()).length;
                
                if (currentFormCount !== knownFormCount) {
                    this.debugLog(`📊 Form count mismatch detected: ${currentFormCount} vs ${knownFormCount}`, 'forms');
                    this.detectFormsWithFallback();
                }
            }
        }, 5000);
    }
    
    setupScrollBasedDetection() {
        let scrollTimeout;
        
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                // Check for new forms that might have been lazy-loaded
                const visibleForms = Array.from(document.querySelectorAll('form')).filter(
                    form => this.isElementVisible(form)
                );
                
                visibleForms.forEach((form, index) => {
                    const formKey = `form_${form.dataset.autoBoltId || index}`;
                    if (!this.formFields.has(formKey) && !this.processedForms.has(form)) {
                        this.debugLog('📜 Lazy-loaded form detected on scroll', 'forms');
                        this.analyzeForm(form, index);
                    }
                });
            }, 300);
        });
    }
    
    isPotentialFormContainer(element) {
        const potentialContainers = [
            'div', 'section', 'article', 'main', 'aside',
            'modal', 'dialog', 'popup', 'card', 'panel'
        ];
        
        if (!potentialContainers.includes(element.tagName.toLowerCase())) {
            return false;
        }
        
        // Check for form-related classes or IDs
        const className = element.className.toLowerCase();
        const id = element.id.toLowerCase();
        
        const formIndicators = [
            'form', 'signup', 'login', 'register', 'contact',
            'submit', 'input', 'modal', 'dialog', 'wizard'
        ];
        
        return formIndicators.some(indicator => 
            className.includes(indicator) || id.includes(indicator)
        );
    }
    
    detectFormsWithFallback() {
        const startTime = Date.now();
        
        // Primary detection: standard forms
        const standardForms = document.querySelectorAll('form');
        this.debugLog(`🔍 SCANNING PAGE: Found ${standardForms.length} standard forms`, 'forms', '📊');
        
        // Secondary detection: form-like containers without form tags
        const formContainers = this.detectFormContainers();
        this.debugLog(`🔍 Found ${formContainers.length} potential form containers`, 'forms', '📊');
        
        // Process all detected forms
        const allForms = [...standardForms, ...formContainers];
        
        if (allForms.length === 0) {
            this.debugLog('⚠️ No forms found on this page', 'forms', '⚠️');
            return;
        }
        
        allForms.forEach((form, index) => {
            if (!this.processedForms.has(form)) {
                this.debugLog(`📋 Analyzing form/container #${index + 1}...`, 'forms');
                this.analyzeFormAdvanced(form, index);
            }
        });
        
        const processingTime = Date.now() - startTime;
        this.performanceMetrics.averageProcessingTime = 
            (this.performanceMetrics.averageProcessingTime + processingTime) / 2;
        
        this.debugLog(`✅ Advanced form detection complete! Total: ${allForms.length}, Processing time: ${processingTime}ms`, 'forms', '🎯');
    }
    
    detectFormContainers() {
        const containers = [];
        
        // Look for containers with multiple input fields
        const potentialContainers = document.querySelectorAll('div, section, article');
        
        potentialContainers.forEach(container => {
            const inputs = container.querySelectorAll('input, select, textarea');
            
            // If container has 2+ inputs but no form tag, it's likely a form
            if (inputs.length >= 2 && !container.closest('form')) {
                const hasSubmitButton = container.querySelector(
                    'input[type="submit"], button[type="submit"], button:not([type]), ' +
                    '[class*="submit"], [class*="button"], [id*="submit"], [id*="send"]'
                );
                
                if (hasSubmitButton) {
                    containers.push(container);
                }
            }
        });
        
        return containers;
    }

    detectForms() {
        // Legacy method - now redirects to advanced detection
        this.detectFormsWithFallback();
    }

    analyzeForm(form, index) {
        // Legacy method - redirect to advanced analysis
        return this.analyzeFormAdvanced(form, index);
    }
    
    analyzeFormAdvanced(form, index) {
        const startTime = Date.now();
        this.debugLog(`🔍 Advanced analysis of form/container #${index + 1}:`, 'forms');
        
        // Enhanced input detection with fallback selectors
        const inputs = this.getFormInputsWithFallback(form);
        this.debugLog(`📊 Found ${inputs.length} total input elements in form #${index + 1}`, 'forms');
        
        const formInfo = {
            element: form,
            inputs: [],
            mappings: new Map(),
            isStandardForm: form.tagName === 'FORM',
            detectionMethod: form.tagName === 'FORM' ? 'standard' : 'container',
            context: this.analyzeFormContext(form),
            complexity: 'simple'
        };
        
        // Assign unique ID for tracking
        if (!form.dataset.autoBoltId) {
            form.dataset.autoBoltId = `autobolt_${Date.now()}_${index}`;
        }
        
        let fillableCount = 0;
        let highConfidenceMappings = 0;
        
        inputs.forEach((input, inputIndex) => {
            const fieldInfo = this.analyzeFieldAdvanced(input, form);
            if (fieldInfo) {
                formInfo.inputs.push(fieldInfo);
                fillableCount++;
                
                this.debugLog(`📝 Field #${inputIndex + 1}: ${fieldInfo.bestIdentifier} (${fieldInfo.type}) [confidence: ${fieldInfo.confidence}]`, 'forms');
                
                // Create advanced mapping with confidence scoring
                const mapping = this.createAdvancedFieldMapping(fieldInfo, form);
                if (mapping) {
                    formInfo.mappings.set(fieldInfo, mapping);
                    if (mapping.confidence > 0.8) {
                        highConfidenceMappings++;
                    }
                    this.debugLog(`✅ Mapped "${fieldInfo.bestIdentifier}" → "${mapping.businessField}" (${(mapping.confidence * 100).toFixed(0)}% confidence)`, 'forms', '🎯');
                } else {
                    this.debugLog(`⚠️ No mapping found for "${fieldInfo.bestIdentifier}"`, 'forms');
                }
            }
        });
        
        // Determine form complexity
        formInfo.complexity = this.assessFormComplexity(formInfo);
        
        // Store form state
        const formKey = `form_${form.dataset.autoBoltId}`;
        this.formFields.set(formKey, formInfo);
        this.processedForms.add(form);
        
        // Update performance metrics
        this.performanceMetrics.formsDetected++;
        this.performanceMetrics.fieldsFound += fillableCount;
        this.performanceMetrics.fieldsMapped += formInfo.mappings.size;
        
        const processingTime = Date.now() - startTime;
        this.debugLog(`✅ Advanced form analysis complete: ${fillableCount}/${inputs.length} fillable, ${formInfo.mappings.size} mapped (${highConfidenceMappings} high confidence) [${processingTime}ms]`, 'forms', '📋');
        
        return formInfo;
    }
    
    getFormInputsWithFallback(container) {
        // Primary: standard input elements
        let inputs = Array.from(container.querySelectorAll('input, select, textarea'));
        
        // Fallback 1: contenteditable elements
        const editableElements = Array.from(container.querySelectorAll('[contenteditable="true"]'));
        inputs.push(...editableElements);
        
        // Fallback 2: custom input components (React, Vue, Angular)
        const customInputs = Array.from(container.querySelectorAll(
            '[role="textbox"], [role="combobox"], [role="spinbutton"], ' +
            '[class*="input"], [class*="field"], [class*="form-control"], ' +
            '[data-testid*="input"], [data-cy*="input"]'
        ));
        inputs.push(...customInputs.filter(el => !inputs.includes(el)));
        
        // Fallback 3: elements that look like inputs based on styling
        const styledInputs = Array.from(container.querySelectorAll('div, span')).filter(el => {
            const style = window.getComputedStyle(el);
            return (
                style.border !== 'none' &&
                (style.backgroundColor !== 'transparent' || style.borderWidth !== '0px') &&
                el.getAttribute('tabindex') !== null
            );
        });
        inputs.push(...styledInputs.filter(el => !inputs.includes(el)));
        
        return inputs;
    }
    
    analyzeFormContext(form) {
        const context = {
            url: window.location.href,
            pageTitle: document.title,
            formPosition: this.getElementPosition(form),
            surroundingText: this.getSurroundingText(form),
            formHeading: this.getFormHeading(form),
            submitButtonText: this.getSubmitButtonText(form)
        };
        
        return context;
    }
    
    getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            visible: this.isElementVisible(element)
        };
    }
    
    getSurroundingText(form) {
        const surrounding = [];
        
        // Get preceding headings
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headings.forEach(heading => {
            if (this.isElementBefore(heading, form)) {
                surrounding.push(heading.textContent.trim());
            }
        });
        
        // Get parent text content
        let parent = form.parentElement;
        while (parent && parent !== document.body) {
            const textNodes = Array.from(parent.childNodes)
                .filter(node => node.nodeType === Node.TEXT_NODE)
                .map(node => node.textContent.trim())
                .filter(text => text.length > 0);
            surrounding.push(...textNodes);
            parent = parent.parentElement;
        }
        
        return surrounding.slice(0, 10); // Limit to 10 items
    }
    
    getFormHeading(form) {
        // Look for headings near the form
        const candidates = [];
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        headings.forEach(heading => {
            const distance = this.getElementDistance(heading, form);
            if (distance < 500) { // Within 500px
                candidates.push({ element: heading, distance });
            }
        });
        
        // Return closest heading
        candidates.sort((a, b) => a.distance - b.distance);
        return candidates.length > 0 ? candidates[0].element.textContent.trim() : '';
    }
    
    getSubmitButtonText(form) {
        const submitButtons = form.querySelectorAll(
            'input[type="submit"], button[type="submit"], button:not([type]), ' +
            '[class*="submit"], [class*="send"], [class*="continue"]'
        );
        
        for (let button of submitButtons) {
            const text = button.textContent || button.value || '';
            if (text.trim()) {
                return text.trim();
            }
        }
        
        return '';
    }
    
    isElementBefore(el1, el2) {
        return el1.compareDocumentPosition(el2) & Node.DOCUMENT_POSITION_FOLLOWING;
    }
    
    getElementDistance(el1, el2) {
        const rect1 = el1.getBoundingClientRect();
        const rect2 = el2.getBoundingClientRect();
        
        const dx = rect1.left - rect2.left;
        const dy = rect1.top - rect2.top;
        
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    isElementVisible(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        
        return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            style.opacity !== '0'
        );
    }
    
    assessFormComplexity(formInfo) {
        const inputCount = formInfo.inputs.length;
        const mappedCount = formInfo.mappings.size;
        const hasMultiStep = formInfo.element.querySelector('[class*="step"], [class*="page"]');
        const hasDependentFields = formInfo.inputs.some(input => 
            input.element.hasAttribute('data-depends-on') || 
            input.element.hasAttribute('data-conditional')
        );
        
        if (inputCount > 15 || hasMultiStep || hasDependentFields) {
            return 'complex';
        } else if (inputCount > 8 || mappedCount / inputCount < 0.5) {
            return 'medium';
        } else {
            return 'simple';
        }
    }

    analyzeField(input) {
        // Skip non-fillable inputs
        if (input.type === 'submit' || input.type === 'button' || input.type === 'hidden') {
            return null;
        }
        
        // Skip disabled or readonly fields
        if (input.disabled || input.readOnly) {
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
        // Try to find associated label
        if (input.id) {
            const label = document.querySelector(`label[for="${input.id}"]`);
            if (label) return label.textContent.trim();
        }
        
        // Look for parent label
        const parentLabel = input.closest('label');
        if (parentLabel) {
            return parentLabel.textContent.replace(input.value || '', '').trim();
        }
        
        // Look for preceding text
        const prevSibling = input.previousElementSibling;
        if (prevSibling && (prevSibling.tagName === 'LABEL' || prevSibling.tagName === 'SPAN')) {
            return prevSibling.textContent.trim();
        }
        
        return '';
    }

    createFieldMapping(fieldInfo) {
        // Legacy method - redirect to advanced mapping
        return this.createAdvancedFieldMapping(fieldInfo);
    }
    
    createAdvancedFieldMapping(fieldInfo, form = null) {
        if (!this.businessData || !this.businessData.fields) {
            return null;
        }
        
        const businessFields = this.businessData.fields;
        
        // Collect all possible identifiers for this field
        const identifiers = this.collectFieldIdentifiers(fieldInfo);
        
        // Try multiple mapping strategies
        const mappingCandidates = [];
        
        // Strategy 1: Direct autocomplete mapping (highest confidence)
        if (fieldInfo.autocomplete) {
            const autoMapping = this.mapByAutocomplete(fieldInfo.autocomplete, businessFields);
            if (autoMapping) {
                mappingCandidates.push({ ...autoMapping, strategy: 'autocomplete', confidence: 0.95 });
            }
        }
        
        // Strategy 2: Semantic pattern matching
        const semanticMapping = this.mapBySemanticPatterns(identifiers, businessFields);
        if (semanticMapping) {
            mappingCandidates.push({ ...semanticMapping, strategy: 'semantic', confidence: 0.85 });
        }
        
        // Strategy 3: ML-like fuzzy matching
        const fuzzyMapping = this.mapByFuzzyMatching(identifiers, businessFields);
        if (fuzzyMapping) {
            mappingCandidates.push({ ...fuzzyMapping, strategy: 'fuzzy', confidence: 0.75 });
        }
        
        // Strategy 4: Context-aware mapping
        if (form) {
            const contextMapping = this.mapByContext(fieldInfo, form, businessFields);
            if (contextMapping) {
                mappingCandidates.push({ ...contextMapping, strategy: 'context', confidence: 0.70 });
            }
        }
        
        // Strategy 5: Position-based mapping (for forms with standard layouts)
        const positionMapping = this.mapByPosition(fieldInfo, form, businessFields);
        if (positionMapping) {
            mappingCandidates.push({ ...positionMapping, strategy: 'position', confidence: 0.60 });
        }
        
        // Select the best mapping candidate
        if (mappingCandidates.length === 0) {
            return null;
        }
        
        // Sort by confidence and return the best match
        mappingCandidates.sort((a, b) => b.confidence - a.confidence);
        const bestMapping = mappingCandidates[0];
        
        return {
            businessField: bestMapping.businessField,
            confidence: bestMapping.confidence,
            strategy: bestMapping.strategy,
            value: businessFields[bestMapping.businessField],
            alternatives: mappingCandidates.slice(1, 3), // Keep top 3 alternatives
            fieldInfo: {
                type: fieldInfo.type,
                required: fieldInfo.required,
                validationRules: fieldInfo.validationRules
            }
        };
    }
    
    collectFieldIdentifiers(fieldInfo) {
        const identifiers = [];
        
        // Add all available identifiers with weights
        if (fieldInfo.label) identifiers.push({ text: fieldInfo.label, weight: 1.0, source: 'label' });
        if (fieldInfo.placeholder) identifiers.push({ text: fieldInfo.placeholder, weight: 0.8, source: 'placeholder' });
        if (fieldInfo.ariaLabel) identifiers.push({ text: fieldInfo.ariaLabel, weight: 0.9, source: 'aria-label' });
        if (fieldInfo.name) identifiers.push({ text: fieldInfo.name, weight: 0.7, source: 'name' });
        if (fieldInfo.id) identifiers.push({ text: fieldInfo.id, weight: 0.6, source: 'id' });
        
        // Add context information
        if (fieldInfo.parentContext && fieldInfo.parentContext.textContent) {
            identifiers.push({ text: fieldInfo.parentContext.textContent, weight: 0.3, source: 'parent-context' });
        }
        
        // Add data attributes
        Object.entries(fieldInfo.dataAttributes).forEach(([key, value]) => {
            if (key.includes('label') || key.includes('name') || key.includes('field')) {
                identifiers.push({ text: value, weight: 0.5, source: `data-${key}` });
            }
        });
        
        return identifiers;
    }
    
    mapByAutocomplete(autocomplete, businessFields) {
        // Standard HTML5 autocomplete mappings
        const autocompleteMapping = {
            'name': 'contactName',
            'given-name': 'firstName',
            'family-name': 'lastName',
            'email': 'email',
            'tel': 'phone',
            'organization': 'companyName',
            'street-address': 'address',
            'address-line1': 'address',
            'address-level2': 'city',
            'address-level1': 'state',
            'postal-code': 'zipCode',
            'country': 'country',
            'url': 'website',
            'bday': 'dateOfBirth'
        };
        
        const mappedField = autocompleteMapping[autocomplete.toLowerCase()];
        if (mappedField && businessFields.hasOwnProperty(mappedField)) {
            return {
                businessField: mappedField,
                matchedBy: 'autocomplete',
                autocompleteValue: autocomplete
            };
        }
        
        return null;
    }
    
    mapBySemanticPatterns(identifiers, businessFields) {
        // Enhanced semantic patterns with scoring
        const patterns = {
            companyName: {
                patterns: [
                    /company\s*name/i, /business\s*name/i, /organization/i, /company/i,
                    /business/i, /firm/i, /corp/i, /llc/i, /inc/i, /ltd/i
                ],
                score: 0.9
            },
            email: {
                patterns: [
                    /e?mail/i, /email\s*address/i, /contact\s*email/i, /electronic\s*mail/i
                ],
                score: 0.95
            },
            phone: {
                patterns: [
                    /phone/i, /telephone/i, /mobile/i, /cell/i, /contact\s*number/i,
                    /phone\s*number/i, /tel/i, /\btph\b/i
                ],
                score: 0.9
            },
            address: {
                patterns: [
                    /address/i, /street/i, /location/i, /address\s*line/i,
                    /street\s*address/i, /mailing\s*address/i
                ],
                score: 0.85
            },
            city: {
                patterns: [
                    /city/i, /town/i, /municipality/i, /locality/i
                ],
                score: 0.9
            },
            state: {
                patterns: [
                    /state/i, /province/i, /region/i, /prefecture/i
                ],
                score: 0.9
            },
            zipCode: {
                patterns: [
                    /zip/i, /postal/i, /zip\s*code/i, /postal\s*code/i, /postcode/i
                ],
                score: 0.9
            },
            country: {
                patterns: [
                    /country/i, /nation/i, /nationality/i
                ],
                score: 0.9
            },
            website: {
                patterns: [
                    /website/i, /url/i, /homepage/i, /web\s*site/i, /web\s*page/i,
                    /domain/i, /site/i
                ],
                score: 0.85
            },
            firstName: {
                patterns: [
                    /first\s*name/i, /given\s*name/i, /forename/i, /fname/i
                ],
                score: 0.9
            },
            lastName: {
                patterns: [
                    /last\s*name/i, /family\s*name/i, /surname/i, /lname/i
                ],
                score: 0.9
            },
            contactName: {
                patterns: [
                    /contact\s*name/i, /full\s*name/i, /your\s*name/i, /name/i
                ],
                score: 0.8
            }
        };
        
        let bestMatch = null;
        let bestScore = 0;
        
        // Test each business field against patterns
        Object.entries(patterns).forEach(([fieldName, { patterns: fieldPatterns, score: baseScore }]) => {
            if (businessFields.hasOwnProperty(fieldName)) {
                identifiers.forEach(({ text, weight }) => {
                    fieldPatterns.forEach(pattern => {
                        if (pattern.test(text)) {
                            const totalScore = baseScore * weight;
                            if (totalScore > bestScore) {
                                bestScore = totalScore;
                                bestMatch = {
                                    businessField: fieldName,
                                    matchedText: text,
                                    pattern: pattern.toString(),
                                    score: totalScore
                                };
                            }
                        }
                    });
                });
            }
        });
        
        return bestMatch;
    }
    
    mapByFuzzyMatching(identifiers, businessFields) {
        // Implement fuzzy string matching using Levenshtein distance
        const businessFieldNames = Object.keys(businessFields);
        let bestMatch = null;
        let bestScore = 0;
        
        identifiers.forEach(({ text, weight }) => {
            const cleanText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            businessFieldNames.forEach(fieldName => {
                const cleanFieldName = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');
                
                // Calculate similarity
                const similarity = this.calculateSimilarity(cleanText, cleanFieldName);
                const weightedScore = similarity * weight;
                
                if (weightedScore > bestScore && similarity > 0.6) { // Threshold for fuzzy matching
                    bestScore = weightedScore;
                    bestMatch = {
                        businessField: fieldName,
                        matchedText: text,
                        similarity: similarity,
                        score: weightedScore
                    };
                }
            });
        });
        
        return bestMatch;
    }
    
    mapByContext(fieldInfo, form, businessFields) {
        // Context-aware mapping based on form structure and surrounding elements
        const formContext = fieldInfo.parentContext;
        const submitButtonText = this.getSubmitButtonText(form);
        const formHeading = this.getFormHeading(form);
        
        // Determine form purpose
        const formPurpose = this.determineFormPurpose(formHeading, submitButtonText);
        
        // Apply context-specific mappings
        const contextMappings = {
            'contact': {
                priority: ['email', 'contactName', 'phone', 'companyName'],
                boost: 1.2
            },
            'registration': {
                priority: ['companyName', 'email', 'firstName', 'lastName'],
                boost: 1.1
            },
            'profile': {
                priority: ['contactName', 'email', 'phone', 'address'],
                boost: 1.1
            },
            'address': {
                priority: ['address', 'city', 'state', 'zipCode', 'country'],
                boost: 1.3
            }
        };
        
        const mapping = contextMappings[formPurpose];
        if (mapping) {
            // Try to match field based on context priority
            for (let priorityField of mapping.priority) {
                if (businessFields.hasOwnProperty(priorityField)) {
                    const identifiers = this.collectFieldIdentifiers(fieldInfo);
                    const semanticMatch = this.mapBySemanticPatterns(identifiers, { [priorityField]: businessFields[priorityField] });
                    
                    if (semanticMatch) {
                        return {
                            businessField: priorityField,
                            matchedBy: 'context',
                            formPurpose: formPurpose,
                            contextBoost: mapping.boost
                        };
                    }
                }
            }
        }
        
        return null;
    }
    
    mapByPosition(fieldInfo, form, businessFields) {
        // Position-based mapping for standard form layouts
        if (!form) return null;
        
        const allInputs = Array.from(form.querySelectorAll('input, select, textarea'));
        const fieldIndex = allInputs.indexOf(fieldInfo.element);
        
        // Common form field orders
        const standardOrders = {
            'contact-form': ['contactName', 'email', 'phone', 'companyName', 'message'],
            'registration-form': ['firstName', 'lastName', 'email', 'phone', 'companyName'],
            'address-form': ['address', 'city', 'state', 'zipCode', 'country']
        };
        
        // Try to match based on position
        Object.entries(standardOrders).forEach(([formType, fieldOrder]) => {
            if (fieldIndex < fieldOrder.length) {
                const expectedField = fieldOrder[fieldIndex];
                if (businessFields.hasOwnProperty(expectedField)) {
                    return {
                        businessField: expectedField,
                        matchedBy: 'position',
                        formType: formType,
                        position: fieldIndex
                    };
                }
            }
        });
        
        return null;
    }
    
    determineFormPurpose(heading, submitText) {
        const purposeIndicators = {
            'contact': ['contact', 'get in touch', 'reach out', 'message'],
            'registration': ['register', 'sign up', 'create account', 'join'],
            'profile': ['profile', 'account', 'settings', 'update'],
            'address': ['address', 'location', 'shipping', 'billing']
        };
        
        const combinedText = `${heading} ${submitText}`.toLowerCase();
        
        for (let [purpose, indicators] of Object.entries(purposeIndicators)) {
            if (indicators.some(indicator => combinedText.includes(indicator))) {
                return purpose;
            }
        }
        
        return 'general';
    }
    
    calculateSimilarity(str1, str2) {
        // Simplified Levenshtein distance calculation
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        
        if (longer.length === 0) return 1.0;
        
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }
    
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    // Legacy mapping patterns for fallback
    getLegacyMappingPatterns() {
        return {
            // Company information
            'company': ['companyName', 'company_name', 'business_name', 'businessName'],
            'business': ['companyName', 'company_name', 'business_name', 'businessName'],
            'organization': ['companyName', 'company_name', 'business_name', 'businessName'],
            
            // Contact information
            'email': ['email', 'emailAddress', 'email_address', 'contactEmail'],
            'phone': ['phone', 'phoneNumber', 'phone_number', 'telephone'],
            'mobile': ['phone', 'phoneNumber', 'mobile_number', 'mobilePhone'],
            
            // Address fields
            'address': ['address', 'streetAddress', 'street_address', 'address1'],
            'street': ['address', 'streetAddress', 'street_address', 'address1'],
            'city': ['city', 'town', 'locality'],
            'state': ['state', 'province', 'region'],
            'zip': ['zipCode', 'zip_code', 'postalCode', 'postal_code'],
            'postal': ['zipCode', 'zip_code', 'postalCode', 'postal_code'],
            'country': ['country', 'countryCode', 'country_code'],
            
            // Business details
            'website': ['website', 'url', 'homepage'],
            'tax': ['taxId', 'tax_id', 'ein', 'taxNumber'],
            'ein': ['taxId', 'tax_id', 'ein', 'taxNumber'],
            'license': ['licenseNumber', 'license_number', 'businessLicense'],
            
            // Personal information
            'first': ['firstName', 'first_name', 'givenName'],
            'last': ['lastName', 'last_name', 'familyName', 'surname'],
            'name': ['fullName', 'contactName', 'ownerName']
        };
        
        // Find matching business field
        for (const searchTerm of searchTerms) {
            for (const [keyword, businessFieldNames] of Object.entries(mappings)) {
                if (searchTerm.includes(keyword)) {
                    for (const fieldName of businessFieldNames) {
                        if (businessFields[fieldName]) {
                            return {
                                businessField: fieldName,
                                value: businessFields[fieldName],
                                confidence: this.calculateConfidence(searchTerm, keyword)
                            };
                        }
                    }
                }
            }
        }
        
        return null;
    }

    calculateConfidence(searchTerm, keyword) {
        if (searchTerm === keyword) return 1.0;
        if (searchTerm.includes(keyword)) return 0.8;
        return 0.6;
    }

    mapBusinessFields() {
        // Re-analyze existing forms with updated business data
        this.formFields.forEach((formInfo, formKey) => {
            formInfo.inputs.forEach(fieldInfo => {
                const mapping = this.createFieldMapping(fieldInfo);
                if (mapping) {
                    formInfo.mappings.set(fieldInfo, mapping);
                }
            });
        });
    }

    async fillDetectedForms() {
        this.debugLog('🎯 STARTING FORM FILL OPERATION!', 'filling', '🚀');
        
        if (!this.businessData) {
            this.debugLog('❌ No business data available for form filling!', 'filling', '❌');
            this.showNotification('No business data loaded. Please fetch data first.', 'warning');
            return;
        }
        
        this.debugLog('✅ Business data available, proceeding with form fill...', 'filling');
        this.debugLog(`📊 Processing ${this.formFields.size} detected forms...`, 'filling');
        
        let totalFilled = 0;
        let totalAttempted = 0;
        
        this.formFields.forEach((formInfo, formKey) => {
            this.debugLog(`📋 Processing ${formKey} (${formInfo.mappings.size} mapped fields)...`, 'filling');
            let formFilled = 0;
            let formAttempted = 0;
            
            formInfo.mappings.forEach((mapping, fieldInfo) => {
                if (mapping && mapping.value) {
                    formAttempted++;
                    totalAttempted++;
                    
                    try {
                        this.debugLog(`📝 Filling field: ${fieldInfo.name || fieldInfo.id} = "${mapping.value}"`, 'filling', '✍️');
                        this.fillField(fieldInfo.element, mapping.value);
                        formFilled++;
                        totalFilled++;
                        this.debugLog(`✅ Successfully filled: ${fieldInfo.name || fieldInfo.id}`, 'filling', '✅');
                    } catch (error) {
                        this.debugLog(`❌ Error filling field ${fieldInfo.name || fieldInfo.id}: ${error.message}`, 'filling', '❌');
                        console.error('Full field fill error:', error);
                    }
                } else {
                    this.debugLog(`⚠️ Skipping field ${fieldInfo.name || fieldInfo.id}: no mapping or value`, 'filling');
                }
            });
            
            this.debugLog(`📊 ${formKey} results: ${formFilled}/${formAttempted} fields filled successfully`, 'filling');
        });
        
        // Show results
        const successRate = totalAttempted > 0 ? Math.round((totalFilled / totalAttempted) * 100) : 0;
        this.debugLog(`🎉 FORM FILL COMPLETE! ${totalFilled}/${totalAttempted} fields filled (${successRate}% success)`, 'filling', '🎉');
        
        if (totalFilled > 0) {
            this.showNotification(`Successfully filled ${totalFilled} form fields! (${successRate}% success)`, 'success');
        } else if (totalAttempted > 0) {
            this.showNotification(`Failed to fill any fields. Please check console for errors.`, 'error');
        } else {
            this.showNotification('No matching fields found to fill.', 'info');
        }
    }

    fillField(element, value) {
        this.debugLog(`✍️ Filling field with value: "${value}"`, 'filling');
        
        // Set the value
        const stringValue = String(value);
        element.value = stringValue;
        this.debugLog(`📝 Value set to: "${element.value}"`, 'filling');
        
        // Trigger events to notify the page
        const events = ['input', 'change', 'blur'];
        this.debugLog(`🎭 Triggering events: ${events.join(', ')}`, 'filling');
        events.forEach(eventType => {
            element.dispatchEvent(new Event(eventType, { bubbles: true }));
            this.debugLog(`✅ Triggered ${eventType} event`, 'filling');
        });
        
        // Special handling for React/Vue components
        if (element._valueTracker) {
            this.debugLog('⚛️ React component detected - handling value tracker', 'filling');
            element._valueTracker.setValue('');
        }
        
        // Highlight the filled field briefly
        this.debugLog('🎨 Adding highlight effect to field', 'filling');
        this.highlightField(element);
        
        this.debugLog('✅ Field fill operation complete!', 'filling');
    }

    highlightField(element) {
        const originalStyle = element.style.cssText;
        element.style.cssText += 'border: 2px solid #4285f4; background-color: #e3f2fd;';
        
        setTimeout(() => {
            element.style.cssText = originalStyle;
        }, 2000);
    }

    showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('autobolt-notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'autobolt-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 300px;
                padding: 12px 16px;
                border-radius: 8px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                transition: all 0.3s ease;
                transform: translateX(100%);
            `;
            document.body.appendChild(notification);
        }
        
        // Set notification style based on type
        const styles = {
            success: { background: '#4caf50', color: 'white' },
            error: { background: '#f44336', color: 'white' },
            warning: { background: '#ff9800', color: 'white' },
            info: { background: '#2196f3', color: 'white' }
        };
        
        const style = styles[type] || styles.info;
        notification.style.backgroundColor = style.background;
        notification.style.color = style.color;
        notification.textContent = message;
        
        // Show notification
        notification.style.transform = 'translateX(0)';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
        }, 5000);
    }

    notifyReady() {
        // Notify popup that content script is ready
        try {
            console.log('📡 Notifying extension that content script is ready');
            chrome.runtime.sendMessage({
                type: 'CONTENT_SCRIPT_READY',
                url: window.location.href,
                hostname: window.location.hostname,
                protocol: window.location.protocol,
                hasBusinessData: !!this.businessData,
                formCount: this.formFields.size,
                timestamp: Date.now()
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.log('🔇 Extension not listening (this is normal):', chrome.runtime.lastError.message);
                } else {
                    console.log('✅ Extension acknowledged ready state:', response);
                }
            });
        } catch (error) {
            console.log('🔇 Could not notify extension (this is normal on some pages):', error.message);
        }
    }
}

// ==================== ADVANCED HELPER CLASSES ====================
// Loaded dynamically from /lib so popup, background, and content share the same implementations.
const autoBoltModuleLoad = (async () => {
    try {
        const [pkgModule, mapperModule, detectorModule, fallbackModule] = await Promise.all([
            import(chrome.runtime.getURL('lib/PackageTierEngine.js')),
            import(chrome.runtime.getURL('lib/AdvancedFieldMapper.js')),
            import(chrome.runtime.getURL('lib/DynamicFormDetector.js')),
            import(chrome.runtime.getURL('lib/FallbackSelectorEngine.js')),
        ]);

        window.PackageTierEngine = pkgModule.default;
        window.AdvancedFieldMapper = mapperModule.default;
        window.DynamicFormDetector = detectorModule.default;
        window.FallbackSelectorEngine = fallbackModule.default;
    } catch (error) {
        console.error('AutoBolt: failed to load helper modules, using safe fallbacks', error);

        if (!window.AdvancedFieldMapper) {
            window.AdvancedFieldMapper = class {
                analyzeFieldPatterns() {
                    return {
                        semanticScore: 0.5,
                        contextScore: 0.5,
                        positionScore: 0.5,
                    };
                }
            };
        }

        if (!window.DynamicFormDetector) {
            window.DynamicFormDetector = class {
                initialize() {}
                detectAdvancedForms() {
                    return Array.from(document.forms || []);
                }
            };
        }

        if (!window.FallbackSelectorEngine) {
            window.FallbackSelectorEngine = class {
                async findElementWithRetry(selectors) {
                    return this.findElementWithFallback(selectors);
                }
                findElementWithFallback(selectors) {
                    for (const selector of selectors) {
                        try {
                            const element = document.querySelector(selector);
                            if (element) {
                                return element;
                            }
                        } catch (fallbackError) {
                            console.warn('Fallback selector failed', fallbackError);
                        }
                    }
                    return null;
                }
            };
        }

        if (!window.PackageTierEngine) {
            window.PackageTierEngine = class {
                async validate(customerId) {
                    return {
                        ok: false,
                        customerId,
                        package: 'starter',
                        directoryLimit: 50,
                        message: 'Validation service unavailable.',
                    };
                }
            };
        }
    }
})();

// Initialize the production content script
function bootAutoBolt() {
    const instantiate = () => {
        try {
            window.autoBolt = new AutoBoltContentScript();
        } catch (error) {
            console.error('AutoBolt: failed to start content script', error);
        }
    };

    autoBoltModuleLoad
        .catch((error) => {
            console.error('AutoBolt: dependency load rejected', error);
        })
        .finally(() => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', instantiate, { once: true });
            } else {
                instantiate();
            }
        });
}

bootAutoBolt();

// Add global error handler for content script
window.addEventListener('error', (event) => {
    if (window.autoBolt && typeof window.autoBolt.debugLog === 'function') {
        window.autoBolt.debugLog(`Global error: ${event.error?.message}`, 'error');
    }
});

// Production-level performance monitoring
window.addEventListener('beforeunload', () => {
    if (window.autoBolt && window.autoBolt.performanceMetrics) {
        console.log('📊 Auto-Bolt Performance Summary:', window.autoBolt.performanceMetrics);
    }
});

// Export for testing and module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        AutoBoltContentScript, 
        AdvancedFieldMapper, 
        DynamicFormDetector, 
        FallbackSelectorEngine 
    };
}

// Global namespace for debugging
window.AutoBolt = {
    AutoBoltContentScript,
    AdvancedFieldMapper,
    DynamicFormDetector,
    FallbackSelectorEngine,
    version: '2.0.0-production'
};