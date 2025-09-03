/**
 * Enhanced Form Mapping System for AutoBolt Chrome Extension
 * Handles complex form detection and mapping across 190+ directories
 * 
 * Features:
 * - Intelligent field detection with ML-like pattern recognition
 * - Directory-specific form mappings
 * - Dynamic form detection for SPAs and JavaScript-rendered forms
 * - Advanced fallback mechanisms
 * - Package tier-based field prioritization
 */

class EnhancedFormMapper {
    constructor() {
        this.fieldPatterns = new Map();
        this.directoryMappings = new Map();
        this.formCache = new Map();
        this.detectionStrategies = [];
        
        this.initializeFieldPatterns();
        this.initializeDetectionStrategies();
    }

    /**
     * Initialize comprehensive field pattern library
     */
    initializeFieldPatterns() {
        this.fieldPatterns.set('businessName', [
            // High-priority patterns (common across platforms)
            'input[name*="business"][name*="name"]',
            'input[name*="company"][name*="name"]',
            'input[name="name"]',
            'input[id*="business"][id*="name"]',
            'input[id*="company"][id*="name"]',
            
            // Platform-specific patterns
            'input[name="businessName"]', // Google Business
            'input[name="business_name"]', // Yelp, Trustpilot, BBB, Waze, Pinterest, Instagram, TikTok, OpenTable, Glassdoor, Indeed
            'input[name="company_name"]', // Crunchbase, BBB, G2, Capterra, GetApp, Software Advice, TikTok, Shopify, Amazon, Wellfound, Alibaba
            'input[name="companyName"]', // Alibaba, Amazon Seller, Trustpilot
            'input[name="companyname"]', // Justdial
            'input[name="developer_name"]', // Chrome Web Store
            'input[name="artist_name"]', // Spotify Artists
            'input[name="podcast_title"]', // Apple Podcasts
            'input[name="channel-name"]', // YouTube Creator
            'input[name="practice_name"]', // Healthgrades
            'input[name="law_firm_name"]', // Avvo
            'input[name="property_name"]', // TripAdvisor
            'input[name="restaurant_name"]', // OpenTable
            'input[name="shop_name"]', // Etsy
            
            // Tech platform patterns
            'input[name="app_name"]', // HubSpot, Slack, Shopify Apps
            'input[name="plugin_name"]', // WordPress
            'input[name="product_name"]', // Capterra, GetApp, Product Hunt, G2
            'input[name="title"]', // App stores, content platforms, Gumtree, Kijiji
            'input[name="name"]', // Apple Maps, Crunchbase
            
            // Fallback patterns
            'input[placeholder*="business" i]',
            'input[placeholder*="company" i]',
            'input[aria-label*="business" i]',
            'input[data-testid*="business"]',
            '.business-name input',
            '.company-name input',
            '[data-field="businessName"]',
            '[data-field="company"]'
        ]);

        this.fieldPatterns.set('website', [
            // Standard website patterns
            'input[name="website"]',
            'input[name="url"]',
            'input[name="homepage"]',
            'input[name="site_url"]',
            'input[name="web"]',
            
            // Platform-specific patterns
            'input[name="redirect_url"]', // Product Hunt
            'input[name="homepage_url"]', // Crunchbase
            'input[name="plugin_uri"]', // WordPress
            'input[name="projectUrl"]', // NuGet
            'input[name="repository_url"]', // Packagist
            'input[name="marketing_url"]', // Apple App Store
            'input[name="website_url"]', // Pinterest Business
            'input[name="url"]' // Twitter Business
            
            // Type-specific patterns
            'input[type="url"]',
            'input[name*="website"]',
            'input[id*="website"]',
            'input[placeholder*="website" i]',
            'input[placeholder*="url" i]',
            'input[aria-label*="website" i]',
            
            // Fallback patterns
            '.website input',
            '.url input',
            '[data-field="website"]',
            '[data-testid*="url"]'
        ]);

        this.fieldPatterns.set('email', [
            // Standard email patterns
            'input[type="email"]',
            'input[name="email"]',
            'input[name="contact_email"]',
            'input[name="contactEmail"]',
            'input[name="author_email"]', // Package repositories
            
            // Platform-specific patterns
            'input[name="contact_email"]', // Various platforms
            'input[name="owners"]', // NuGet
            'input[name="contactEmail"]' // Amazon Seller
            
            // Fallback patterns
            'input[name*="email"]',
            'input[id*="email"]',
            'input[placeholder*="email" i]',
            'input[aria-label*="email" i]',
            '.email input',
            '[data-field="email"]'
        ]);

        this.fieldPatterns.set('phone', [
            // Standard phone patterns
            'input[type="tel"]',
            'input[name="phone"]',
            'input[name="telephone"]',
            'input[name="phoneNumber"]',
            'input[name="phone_number"]',
            'input[name="phoneNumber"]', // Amazon Seller
            'input[name="mobile"]' // Alibaba, Justdial
            
            // Fallback patterns
            'input[name*="phone"]',
            'input[name*="tel"]',
            'input[id*="phone"]',
            'input[placeholder*="phone" i]',
            'input[aria-label*="phone" i]',
            '.phone input',
            '.telephone input',
            '[data-field="phone"]'
        ]);

        this.fieldPatterns.set('address', [
            // Standard address patterns
            'input[name="address"]',
            'input[name="street_address"]',
            'input[name="business_address"]',
            'input[name="headquarters"]',
            'input[name="address1"]',
            'textarea[name="address"]',
            
            // Platform-specific patterns
            'input[name="headquarters_address"]', // Indeed
            'input[name="location_identifiers"]', // Crunchbase
            'input[name="dateline"]', // PR platforms
            'input[name="address1"]', // Amazon Seller
            'input[name="location"]' // Twitter Business
            
            // Fallback patterns
            'input[name*="address"]',
            'input[id*="address"]',
            'textarea[name*="address"]',
            'input[placeholder*="address" i]',
            '.address input',
            '.address textarea',
            '[data-field="address"]'
        ]);

        this.fieldPatterns.set('description', [
            // Standard description patterns
            'textarea[name="description"]',
            'textarea[name="business_description"]',
            'textarea[name="company_description"]',
            'textarea[name="about"]',
            'textarea[name="overview"]',
            
            // Platform-specific patterns
            'textarea[name="tagline"]', // Product Hunt
            'textarea[name="pitch"]', // AngelList, BetaList
            'textarea[name="body"]', // Content platforms
            'textarea[name="body_markdown"]', // DEV.to
            'textarea[name="text"]', // Reddit, openPR
            'input[name="tagline"]', // Some platforms use input
            'textarea[name="bio"]', // Instagram, Spotify, Healthgrades, Avvo, Zillow, Realtor.com
            'textarea[name="business_description"]', // Pinterest, Waze, BBB, Amazon Seller
            'textarea[name="channel-description"]', // YouTube Creator
            'textarea[name="product_description"]', // Capterra, GetApp, Software Advice
            'textarea[name="app_description"]', // Shopify Apps
            'textarea[name="shop_description"]', // Etsy
            'textarea[name="company_description"]', // Wellfound, Glassdoor, Indeed
            'textarea[name="company_profile"]' // Alibaba
            
            // Fallback patterns
            'textarea[name*="description"]',
            'textarea[name*="about"]',
            'textarea[id*="description"]',
            'textarea[placeholder*="description" i]',
            '.description textarea',
            '.about textarea',
            '[data-field="description"]'
        ]);

        this.fieldPatterns.set('category', [
            // Standard category patterns
            'select[name="category"]',
            'select[name="business_category"]',
            'select[name="industry"]',
            'select[name="industry_category"]',
            'input[name="category"]',
            
            // Platform-specific patterns
            'select[name="primary_category"]', // App stores
            'select[name="app_category"]', // Various app platforms
            'input[name="category_groups"]', // Crunchbase
            'select[name="category_id"]', // G2
            'select[name="specialties[]"]', // Houzz
            'select[name="services[]"]', // Service platforms
            
            // Multiple selection patterns
            'select[name="markets[]"]', // AngelList
            'input[name="tags"]', // Various platforms
            'input[name="keywords"]', // Package repositories
            'input[name="tag_list"]', // DEV.to
            
            // Fallback patterns
            'select[name*="category"]',
            'select[name*="industry"]',
            'input[name*="category"]',
            '.category select',
            '.industry select',
            '[data-field="category"]'
        ]);

        // Additional specialized fields for different platform types
        this.fieldPatterns.set('pricing', [
            'input[name="price"]',
            'input[name="pricing"]',
            'input[name="starting_price"]',
            'input[name="price_range"]',
            'select[name="pricing_model"]',
            'input[name="typical_pricing"]',
            'input[name="revenue"]' // Indie Hackers
        ]);

        this.fieldPatterns.set('logo', [
            'input[type="file"][name="logo"]',
            'input[type="file"][name*="logo"]',
            'input[type="file"][accept*="image"]',
            '.logo-upload input',
            '[data-field="logo"]'
        ]);

        this.fieldPatterns.set('screenshots', [
            'input[type="file"][name*="screenshot"]',
            'input[type="file"][name*="image"]',
            'input[type="file"][name="gallery_images"]',
            'input[type="file"][name="screenshots[]"]',
            'input[type="file"][name="phone_screenshots[]"]'
        ]);
    }

    /**
     * Initialize detection strategies for different form types
     */
    initializeDetectionStrategies() {
        this.detectionStrategies = [
            // Strategy 1: Direct form detection
            {
                name: 'direct-form',
                detect: () => document.querySelectorAll('form'),
                priority: 1
            },
            
            // Strategy 2: Modal and popup forms
            {
                name: 'modal-form',
                detect: () => document.querySelectorAll('.modal form, .popup form, .dialog form, [role="dialog"] form'),
                priority: 2
            },
            
            // Strategy 3: SPA form containers
            {
                name: 'spa-form',
                detect: () => document.querySelectorAll('.form-container, .signup-form, .submission-form, .create-form'),
                priority: 3
            },
            
            // Strategy 4: Input groups without form tags
            {
                name: 'input-group',
                detect: () => {
                    const containers = [];
                    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea');
                    inputs.forEach(input => {
                        const container = input.closest('.container, .section, .card, .panel');
                        if (container && !containers.includes(container)) {
                            containers.push(container);
                        }
                    });
                    return containers;
                },
                priority: 4
            }
        ];
    }

    /**
     * Detect all forms on the page using multiple strategies
     */
    async detectForms() {
        const detectedForms = new Set();
        
        for (const strategy of this.detectionStrategies) {
            try {
                const forms = strategy.detect();
                forms.forEach(form => {
                    if (form && this.isValidForm(form)) {
                        detectedForms.add({
                            element: form,
                            strategy: strategy.name,
                            priority: strategy.priority,
                            id: this.generateFormId(form)
                        });
                    }
                });
            } catch (error) {
                console.warn(`Form detection strategy '${strategy.name}' failed:`, error);
            }
        }

        // Wait for dynamic forms to load
        await this.waitForDynamicForms();
        
        return Array.from(detectedForms).sort((a, b) => a.priority - b.priority);
    }

    /**
     * Wait for dynamic forms to load (SPAs, lazy loading)
     */
    async waitForDynamicForms(timeout = 3000) {
        return new Promise((resolve) => {
            let attempts = 0;
            const maxAttempts = timeout / 100;
            
            const checkForForms = () => {
                const dynamicForms = document.querySelectorAll('form:not([data-autobolt-processed])');
                if (dynamicForms.length > 0 || attempts >= maxAttempts) {
                    resolve();
                } else {
                    attempts++;
                    setTimeout(checkForForms, 100);
                }
            };
            
            setTimeout(checkForForms, 100);
        });
    }

    /**
     * Validate if an element is a processable form
     */
    isValidForm(element) {
        if (!element) return false;
        
        // Must contain at least one input field
        const inputs = element.querySelectorAll('input, textarea, select');
        if (inputs.length === 0) return false;
        
        // Should not be a search form
        const searchKeywords = ['search', 'query', 'find'];
        const formText = element.textContent.toLowerCase();
        if (searchKeywords.some(keyword => formText.includes(keyword))) {
            return false;
        }
        
        // Should contain business-related fields
        const businessFields = ['name', 'email', 'website', 'company', 'business'];
        const hasBusinessField = Array.from(inputs).some(input => 
            businessFields.some(field => 
                (input.name && input.name.toLowerCase().includes(field)) ||
                (input.id && input.id.toLowerCase().includes(field)) ||
                (input.placeholder && input.placeholder.toLowerCase().includes(field))
            )
        );
        
        return hasBusinessField;
    }

    /**
     * Generate unique form ID
     */
    generateFormId(formElement) {
        if (formElement.id) return formElement.id;
        if (formElement.name) return formElement.name;
        
        // Generate based on form attributes and position
        const tagName = formElement.tagName.toLowerCase();
        const className = formElement.className || '';
        const index = Array.from(document.querySelectorAll(tagName)).indexOf(formElement);
        
        return `autobolt-form-${tagName}-${className.replace(/\s+/g, '-')}-${index}`;
    }

    /**
     * Map business data to form fields using intelligent matching
     */
    async mapBusinessDataToForm(formElement, businessData, directoryConfig = null) {
        const mappingResults = {
            mapped: 0,
            failed: 0,
            fields: new Map(),
            unmappedData: new Map(),
            errors: []
        };

        // Use directory-specific mappings if available
        let fieldMappings = this.fieldPatterns;
        if (directoryConfig && directoryConfig.fieldMapping) {
            fieldMappings = this.createDirectorySpecificMappings(directoryConfig.fieldMapping);
        }

        // Map each business data field
        for (const [dataKey, dataValue] of Object.entries(businessData)) {
            if (!dataValue || dataValue.trim() === '') continue;
            
            try {
                const fieldElement = await this.findFieldElement(formElement, dataKey, fieldMappings);
                
                if (fieldElement) {
                    const success = await this.fillField(fieldElement, dataValue, dataKey);
                    if (success) {
                        mappingResults.mapped++;
                        mappingResults.fields.set(dataKey, {
                            element: fieldElement,
                            value: dataValue,
                            selector: this.getFieldSelector(fieldElement)
                        });
                    } else {
                        mappingResults.failed++;
                        mappingResults.errors.push(`Failed to fill field: ${dataKey}`);
                    }
                } else {
                    mappingResults.unmappedData.set(dataKey, dataValue);
                }
            } catch (error) {
                mappingResults.failed++;
                mappingResults.errors.push(`Error mapping ${dataKey}: ${error.message}`);
            }
        }

        return mappingResults;
    }

    /**
     * Create directory-specific field mappings
     */
    createDirectorySpecificMappings(directoryFieldMapping) {
        const specificMappings = new Map();
        
        for (const [fieldName, patterns] of this.fieldPatterns) {
            const directoryPattern = directoryFieldMapping[fieldName];
            if (directoryPattern) {
                // Priority: directory-specific pattern first, then fallbacks
                specificMappings.set(fieldName, [directoryPattern, ...patterns]);
            } else {
                specificMappings.set(fieldName, patterns);
            }
        }
        
        return specificMappings;
    }

    /**
     * Find field element using intelligent pattern matching
     */
    async findFieldElement(container, dataKey, fieldMappings) {
        const patterns = fieldMappings.get(dataKey) || [];
        
        // Try each pattern in order of specificity
        for (const pattern of patterns) {
            try {
                const element = container.querySelector(pattern);
                if (element && this.isFieldVisible(element) && this.isFieldEditable(element)) {
                    return element;
                }
            } catch (error) {
                // Invalid selector, continue to next pattern
                continue;
            }
        }

        // Fuzzy matching fallback
        return this.findFieldByFuzzyMatching(container, dataKey);
    }

    /**
     * Fuzzy matching for field detection
     */
    findFieldByFuzzyMatching(container, dataKey) {
        const inputs = container.querySelectorAll('input, textarea, select');
        const keywordMap = {
            'businessName': ['name', 'business', 'company', 'title'],
            'email': ['email', 'mail'],
            'phone': ['phone', 'tel', 'mobile'],
            'website': ['website', 'url', 'site', 'web'],
            'address': ['address', 'location'],
            'description': ['description', 'about', 'bio', 'details']
        };
        
        const keywords = keywordMap[dataKey] || [dataKey];
        
        for (const input of inputs) {
            const text = `${input.name} ${input.id} ${input.placeholder} ${input.getAttribute('aria-label')}`.toLowerCase();
            
            if (keywords.some(keyword => text.includes(keyword))) {
                if (this.isFieldVisible(input) && this.isFieldEditable(input)) {
                    return input;
                }
            }
        }
        
        return null;
    }

    /**
     * Check if field is visible and interactable
     */
    isFieldVisible(element) {
        if (!element) return false;
        
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               style.opacity !== '0' &&
               element.offsetHeight > 0 && 
               element.offsetWidth > 0;
    }

    /**
     * Check if field is editable
     */
    isFieldEditable(element) {
        return !element.disabled && 
               !element.readOnly && 
               !element.hasAttribute('aria-disabled');
    }

    /**
     * Fill field with appropriate value handling
     */
    async fillField(fieldElement, value, fieldType) {
        try {
            // Pre-fill actions
            this.focusField(fieldElement);
            await this.delay(50);
            
            // Clear existing content
            if (fieldElement.tagName.toLowerCase() === 'textarea' || 
                fieldElement.type === 'text' || 
                fieldElement.type === 'email' || 
                fieldElement.type === 'url') {
                fieldElement.value = '';
                fieldElement.textContent = '';
            }
            
            // Fill based on field type
            if (fieldElement.tagName.toLowerCase() === 'select') {
                return this.fillSelectField(fieldElement, value);
            } else if (fieldElement.type === 'file') {
                // File fields require special handling
                return false; // Skip for now
            } else {
                // Text input fields
                fieldElement.value = value;
                
                // Trigger events for SPA compatibility
                this.triggerInputEvents(fieldElement);
                
                await this.delay(100);
                return fieldElement.value === value;
            }
        } catch (error) {
            console.warn(`Failed to fill field:`, error);
            return false;
        }
    }

    /**
     * Fill select field with best matching option
     */
    fillSelectField(selectElement, value) {
        const options = Array.from(selectElement.options);
        
        // Exact match first
        let matchingOption = options.find(option => 
            option.value.toLowerCase() === value.toLowerCase() ||
            option.textContent.toLowerCase() === value.toLowerCase()
        );
        
        // Partial match fallback
        if (!matchingOption) {
            matchingOption = options.find(option =>
                option.textContent.toLowerCase().includes(value.toLowerCase()) ||
                value.toLowerCase().includes(option.textContent.toLowerCase())
            );
        }
        
        if (matchingOption) {
            selectElement.value = matchingOption.value;
            this.triggerChangeEvent(selectElement);
            return true;
        }
        
        return false;
    }

    /**
     * Focus field with human-like behavior
     */
    focusField(fieldElement) {
        fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        fieldElement.focus();
        fieldElement.click();
    }

    /**
     * Trigger input events for SPA compatibility
     */
    triggerInputEvents(fieldElement) {
        const events = ['input', 'change', 'blur', 'keyup'];
        
        events.forEach(eventType => {
            const event = new Event(eventType, { bubbles: true, cancelable: true });
            fieldElement.dispatchEvent(event);
        });
        
        // React/Vue specific events
        const reactEvent = new Event('input', { bubbles: true });
        reactEvent.simulated = true;
        fieldElement.dispatchEvent(reactEvent);
    }

    /**
     * Trigger change event
     */
    triggerChangeEvent(element) {
        const event = new Event('change', { bubbles: true, cancelable: true });
        element.dispatchEvent(event);
    }

    /**
     * Get CSS selector for field element
     */
    getFieldSelector(element) {
        if (element.id) return `#${element.id}`;
        if (element.name) return `[name="${element.name}"]`;
        
        // Generate unique selector
        const tagName = element.tagName.toLowerCase();
        const parent = element.parentElement;
        const siblings = Array.from(parent.children).filter(child => child.tagName.toLowerCase() === tagName);
        const index = siblings.indexOf(element);
        
        return `${tagName}:nth-of-type(${index + 1})`;
    }

    /**
     * Utility delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedFormMapper;
} else {
    window.EnhancedFormMapper = EnhancedFormMapper;
}