/**
 * Advanced Directory Form Filler for Auto-Bolt Chrome Extension
 * Handles intelligent form population using field mapping and fallback patterns
 */

class DirectoryFormFiller {
    constructor() {
        this.fieldMappings = {};
        this.fallbackSelectors = {};
        this.filledFields = [];
        this.errors = [];
        this.debugMode = true;
    }

    /**
     * Initialize the form filler with field mapping patterns
     */
    initialize() {
        console.log('🎯 Initializing Directory Form Filler...');
        
        // Define fallback selector patterns for common form fields
        this.fallbackSelectors = {
            businessName: [
                'input[name*="business" i]',
                'input[name*="company" i]',
                'input[name*="name" i]:not([name*="first" i]):not([name*="last" i]):not([name*="user" i])',
                'input[id*="business" i]',
                'input[id*="company" i]',
                'input[placeholder*="business" i]',
                'input[placeholder*="company" i]',
                '#businessName',
                '#companyName',
                '#company_name',
                '#business_name',
                '.business-name input',
                '.company-name input',
                'input[name="name"]:not([name*="first"]):not([name*="last"])'
            ],
            
            email: [
                'input[type="email"]',
                'input[name*="email" i]',
                'input[id*="email" i]',
                'input[placeholder*="email" i]',
                '#email',
                '#emailAddress',
                '#email_address',
                '.email input',
                'input[name="email"]'
            ],
            
            phone: [
                'input[type="tel"]',
                'input[name*="phone" i]',
                'input[name*="tel" i]',
                'input[id*="phone" i]',
                'input[id*="tel" i]',
                'input[placeholder*="phone" i]',
                'input[placeholder*="tel" i]',
                '#phone',
                '#telephone',
                '#phoneNumber',
                '#phone_number',
                '.phone input',
                '.telephone input'
            ],
            
            website: [
                'input[name*="website" i]',
                'input[name*="url" i]',
                'input[name*="web" i]',
                'input[id*="website" i]',
                'input[id*="url" i]',
                'input[placeholder*="website" i]',
                'input[placeholder*="url" i]',
                '#website',
                '#url',
                '#webUrl',
                '#web_url',
                '.website input',
                '.url input',
                'input[type="url"]'
            ],
            
            address: [
                'input[name*="address" i]',
                'textarea[name*="address" i]',
                'input[id*="address" i]',
                'textarea[id*="address" i]',
                'input[placeholder*="address" i]',
                'textarea[placeholder*="address" i]',
                '#address',
                '#streetAddress',
                '#street_address',
                '.address input',
                '.address textarea'
            ],
            
            city: [
                'input[name*="city" i]',
                'input[id*="city" i]',
                'input[placeholder*="city" i]',
                '#city',
                '.city input'
            ],
            
            state: [
                'input[name*="state" i]',
                'select[name*="state" i]',
                'input[id*="state" i]',
                'select[id*="state" i]',
                '#state',
                '.state input',
                '.state select'
            ],
            
            zip: [
                'input[name*="zip" i]',
                'input[name*="postal" i]',
                'input[id*="zip" i]',
                'input[id*="postal" i]',
                'input[placeholder*="zip" i]',
                'input[placeholder*="postal" i]',
                '#zip',
                '#zipCode',
                '#postalCode',
                '#zip_code',
                '#postal_code',
                '.zip input',
                '.postal input'
            ],
            
            description: [
                'textarea[name*="description" i]',
                'textarea[name*="about" i]',
                'textarea[name*="bio" i]',
                'textarea[name*="summary" i]',
                'textarea[id*="description" i]',
                'textarea[id*="about" i]',
                'textarea[placeholder*="description" i]',
                'textarea[placeholder*="about" i]',
                '#description',
                '#about',
                '#bio',
                '#summary',
                '.description textarea',
                '.about textarea'
            ],
            
            category: [
                'select[name*="category" i]',
                'select[name*="industry" i]',
                'select[name*="business_type" i]',
                'select[id*="category" i]',
                'select[id*="industry" i]',
                '#category',
                '#industry',
                '#businessType',
                '.category select',
                '.industry select'
            ]
        };
        
        console.log('✅ Directory Form Filler initialized');
    }

    /**
     * Fill form using directory-specific field mapping and business data
     */
    async fillDirectoryForm(directory, businessData) {
        console.log(`🎯 Filling form for directory: ${directory.name}`);
        console.log('📝 Business data fields:', Object.keys(businessData));
        
        this.filledFields = [];
        this.errors = [];
        
        try {
            // Use directory-specific field mapping first
            if (directory.fieldMapping && Object.keys(directory.fieldMapping).length > 0) {
                console.log('🎯 Using directory-specific field mapping');
                await this.fillWithDirectoryMapping(directory.fieldMapping, businessData);
            }
            
            // Fill remaining fields using fallback patterns
            console.log('🔄 Attempting fallback field mapping');
            await this.fillWithFallbackPatterns(businessData);
            
            // Handle special form types
            await this.handleSpecialFormTypes(directory, businessData);
            
            const result = {
                success: true,
                filledFields: this.filledFields.length,
                fieldsData: this.filledFields,
                errors: this.errors,
                timestamp: Date.now()
            };
            
            console.log(`✅ Form filling completed: ${this.filledFields.length} fields filled`);
            return result;
            
        } catch (error) {
            console.error('❌ Form filling failed:', error);
            return {
                success: false,
                error: error.message,
                filledFields: this.filledFields.length,
                errors: this.errors
            };
        }
    }

    /**
     * Fill form using directory-specific field mapping
     */
    async fillWithDirectoryMapping(fieldMapping, businessData) {
        console.log('🎯 Applying directory-specific field mapping...');
        
        for (const [fieldName, selector] of Object.entries(fieldMapping)) {
            try {
                const value = this.getBusinessDataValue(fieldName, businessData);
                if (value) {
                    await this.fillFieldBySelector(selector, value, fieldName, 'directory-mapping');
                }
            } catch (error) {
                console.warn(`⚠️ Failed to fill field ${fieldName} with selector ${selector}:`, error);
                this.errors.push({
                    field: fieldName,
                    selector: selector,
                    error: error.message,
                    type: 'directory-mapping'
                });
            }
        }
    }

    /**
     * Fill form using fallback selector patterns
     */
    async fillWithFallbackPatterns(businessData) {
        console.log('🔄 Applying fallback selector patterns...');
        
        for (const [fieldType, selectors] of Object.entries(this.fallbackSelectors)) {
            const value = this.getBusinessDataValue(fieldType, businessData);
            if (!value) continue;
            
            // Skip if we already filled this field type using directory mapping
            if (this.filledFields.some(f => f.fieldType === fieldType && f.method === 'directory-mapping')) {
                continue;
            }
            
            // Try each selector until one works
            let filled = false;
            for (const selector of selectors) {
                try {
                    if (await this.fillFieldBySelector(selector, value, fieldType, 'fallback-pattern')) {
                        filled = true;
                        break;
                    }
                } catch (error) {
                    // Continue to next selector
                    continue;
                }
            }
            
            if (!filled) {
                console.warn(`⚠️ No suitable field found for ${fieldType}`);
            }
        }
    }

    /**
     * Fill a field using a specific selector
     */
    async fillFieldBySelector(selector, value, fieldName, method) {
        const elements = document.querySelectorAll(selector);
        
        if (elements.length === 0) {
            return false;
        }
        
        // Handle multiple elements (use the first visible one)
        let targetElement = null;
        for (const element of elements) {
            if (this.isElementVisible(element) && !this.isElementDisabled(element)) {
                targetElement = element;
                break;
            }
        }
        
        if (!targetElement) {
            targetElement = elements[0]; // Fallback to first element
        }
        
        try {
            await this.fillElement(targetElement, value);
            
            this.filledFields.push({
                fieldName: fieldName,
                fieldType: fieldName,
                selector: selector,
                value: value,
                method: method,
                element: targetElement.tagName.toLowerCase(),
                timestamp: Date.now()
            });
            
            console.log(`✅ Filled ${fieldName}: "${value}" using ${method}`);
            return true;
            
        } catch (error) {
            throw new Error(`Failed to fill element: ${error.message}`);
        }
    }

    /**
     * Fill an individual form element
     */
    async fillElement(element, value) {
        if (!element || !value) return;
        
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await this.sleep(200);
        
        // Focus the element
        element.focus();
        await this.sleep(100);
        
        if (element.tagName.toLowerCase() === 'select') {
            // Handle select elements
            await this.fillSelectElement(element, value);
        } else if (element.type === 'checkbox' || element.type === 'radio') {
            // Handle checkbox/radio elements
            if (value === true || value === 'true' || value === 'yes') {
                element.checked = true;
                element.dispatchEvent(new Event('change', { bubbles: true }));
            }
        } else {
            // Handle text inputs and textareas
            await this.fillTextElement(element, value);
        }
        
        // Trigger common form events
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.dispatchEvent(new Event('blur', { bubbles: true }));
        
        await this.sleep(100);
    }

    /**
     * Fill a text input or textarea element
     */
    async fillTextElement(element, value) {
        // Clear existing value
        element.value = '';
        element.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Type the value with slight delays for human-like behavior
        const text = String(value);
        for (let i = 0; i < text.length; i++) {
            element.value += text[i];
            element.dispatchEvent(new Event('input', { bubbles: true }));
            
            // Add slight random delay
            if (Math.random() > 0.8) {
                await this.sleep(10 + Math.random() * 20);
            }
        }
    }

    /**
     * Fill a select element
     */
    async fillSelectElement(element, value) {
        const options = Array.from(element.options);
        
        // Try exact match first
        let matchedOption = options.find(opt => 
            opt.value.toLowerCase() === value.toLowerCase() ||
            opt.text.toLowerCase() === value.toLowerCase()
        );
        
        // Try partial match if exact match fails
        if (!matchedOption) {
            matchedOption = options.find(opt => 
                opt.value.toLowerCase().includes(value.toLowerCase()) ||
                opt.text.toLowerCase().includes(value.toLowerCase()) ||
                value.toLowerCase().includes(opt.text.toLowerCase())
            );
        }
        
        if (matchedOption) {
            element.selectedIndex = matchedOption.index;
            element.value = matchedOption.value;
        } else {
            console.warn(`⚠️ No matching option found for value: ${value}`);
        }
    }

    /**
     * Handle special form types and patterns
     */
    async handleSpecialFormTypes(directory, businessData) {
        console.log('🔧 Handling special form types...');
        
        try {
            // Handle multi-step forms
            await this.handleMultiStepForms();
            
            // Handle CAPTCHA detection
            await this.handleCAPTCHADetection();
            
            // Handle dynamic fields
            await this.handleDynamicFields(businessData);
            
            // Handle file uploads (if business has logo/images)
            await this.handleFileUploads(businessData);
            
        } catch (error) {
            console.warn('⚠️ Special form handling error:', error);
        }
    }

    /**
     * Handle multi-step forms
     */
    async handleMultiStepForms() {
        // Look for "Next" or "Continue" buttons
        const nextButtons = document.querySelectorAll([
            'button[type="button"]',
            'input[type="button"]',
            'button[class*="next" i]',
            'button[class*="continue" i]',
            'input[value*="next" i]',
            'input[value*="continue" i]'
        ].join(', '));
        
        // Don't automatically click next buttons - let user control this
        if (nextButtons.length > 0) {
            console.log(`ℹ️ Detected ${nextButtons.length} potential next/continue buttons`);
        }
    }

    /**
     * Handle CAPTCHA detection
     */
    async handleCAPTCHADetection() {
        const captchaIndicators = [
            '[class*="captcha" i]',
            '[id*="captcha" i]',
            'iframe[src*="recaptcha"]',
            '.g-recaptcha',
            '.h-captcha',
            '[data-sitekey]'
        ];
        
        for (const indicator of captchaIndicators) {
            if (document.querySelector(indicator)) {
                console.warn('🚨 CAPTCHA detected - manual intervention required');
                this.errors.push({
                    field: 'captcha',
                    error: 'CAPTCHA detected - requires manual completion',
                    type: 'captcha'
                });
                break;
            }
        }
    }

    /**
     * Handle dynamic fields that appear after interaction
     */
    async handleDynamicFields(businessData) {
        // Wait for potential dynamic content to load
        await this.sleep(1000);
        
        // Re-scan for new fields that might have appeared
        const newFields = document.querySelectorAll('input, textarea, select');
        console.log(`ℹ️ Total form fields found: ${newFields.length}`);
    }

    /**
     * Handle file uploads (basic detection)
     */
    async handleFileUploads(businessData) {
        const fileInputs = document.querySelectorAll('input[type="file"]');
        
        if (fileInputs.length > 0) {
            console.log(`ℹ️ Detected ${fileInputs.length} file upload fields`);
            
            fileInputs.forEach((input, index) => {
                this.errors.push({
                    field: `file_upload_${index}`,
                    error: 'File upload detected - requires manual file selection',
                    type: 'file-upload',
                    accept: input.accept
                });
            });
        }
    }

    /**
     * Get business data value for a field
     */
    getBusinessDataValue(fieldName, businessData) {
        // Direct field name match
        if (businessData[fieldName]) {
            return businessData[fieldName];
        }
        
        // Field name mapping
        const fieldMappings = {
            businessName: ['name', 'companyName', 'company_name', 'business_name'],
            email: ['emailAddress', 'email_address', 'contactEmail'],
            phone: ['phoneNumber', 'phone_number', 'telephone', 'contact_phone'],
            website: ['url', 'webUrl', 'web_url', 'websiteUrl', 'website_url'],
            address: ['streetAddress', 'street_address', 'fullAddress', 'location'],
            description: ['about', 'bio', 'summary', 'businessDescription', 'overview']
        };
        
        if (fieldMappings[fieldName]) {
            for (const altName of fieldMappings[fieldName]) {
                if (businessData[altName]) {
                    return businessData[altName];
                }
            }
        }
        
        return null;
    }

    /**
     * Check if element is visible
     */
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

    /**
     * Check if element is disabled
     */
    isElementDisabled(element) {
        return element.disabled || element.readOnly;
    }

    /**
     * Submit the form
     */
    async submitForm(directory) {
        console.log(`🚀 Attempting to submit form for: ${directory.name}`);
        
        try {
            // Look for submit buttons
            const submitButtons = document.querySelectorAll([
                'button[type="submit"]',
                'input[type="submit"]',
                'button[class*="submit" i]',
                'button[class*="send" i]',
                'input[value*="submit" i]',
                'input[value*="send" i]',
                '.submit-button',
                '.btn-submit',
                '#submit'
            ].join(', '));
            
            if (submitButtons.length === 0) {
                throw new Error('No submit button found');
            }
            
            // Use the first visible submit button
            let submitButton = null;
            for (const button of submitButtons) {
                if (this.isElementVisible(button) && !this.isElementDisabled(button)) {
                    submitButton = button;
                    break;
                }
            }
            
            if (!submitButton) {
                submitButton = submitButtons[0]; // Fallback to first button
            }
            
            // Scroll to submit button and click
            submitButton.scrollIntoView({ behavior: 'smooth', block: 'center' });
            await this.sleep(500);
            
            submitButton.click();
            
            console.log('✅ Form submitted successfully');
            return {
                success: true,
                message: 'Form submitted',
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error('❌ Form submission failed:', error);
            return {
                success: false,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    /**
     * Get form filling results
     */
    getResults() {
        return {
            success: true,
            filledFields: this.filledFields.length,
            fields: this.filledFields,
            errors: this.errors,
            timestamp: Date.now()
        };
    }

    /**
     * Utility sleep function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize form filler when content script loads
const directoryFormFiller = new DirectoryFormFiller();
directoryFormFiller.initialize();

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('📨 Directory Form Filler received message:', request.action);
    
    if (request.action === 'FILL_DIRECTORY_FORM') {
        // Fill directory form
        directoryFormFiller.fillDirectoryForm(request.directory, request.businessData)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({
                success: false,
                error: error.message
            }));
        
        return true; // Keep channel open for async response
    }
    
    if (request.action === 'SUBMIT_FORM') {
        // Submit form
        directoryFormFiller.submitForm(request.directory)
            .then(result => sendResponse(result))
            .catch(error => sendResponse({
                success: false,
                error: error.message
            }));
        
        return true; // Keep channel open for async response
    }
    
    if (request.action === 'GET_FORM_RESULTS') {
        // Get form filling results
        sendResponse(directoryFormFiller.getResults());
        return false;
    }
});

console.log('✅ Directory Form Filler loaded and ready');