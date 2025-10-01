/**
 * Auto-Bolt Advanced Form Detection Modules
 * Lazy-loaded advanced functionality for complex form handling
 */

export class AdvancedFieldMapper {
    constructor() {
        this.confidenceThreshold = 0.7;
        this.mappingCache = new Map();
    }
    
    createAdvancedMapping(fieldInfo, businessFields) {
        // Advanced semantic pattern matching
        const identifiers = this.collectFieldIdentifiers(fieldInfo);
        const mappingCandidates = [];
        
        // Strategy 1: Autocomplete mapping
        if (fieldInfo.autocomplete) {
            const autoMapping = this.mapByAutocomplete(fieldInfo.autocomplete, businessFields);
            if (autoMapping) {
                mappingCandidates.push({ ...autoMapping, confidence: 0.95 });
            }
        }
        
        // Strategy 2: Semantic patterns
        const semanticMapping = this.mapBySemanticPatterns(identifiers, businessFields);
        if (semanticMapping) {
            mappingCandidates.push({ ...semanticMapping, confidence: 0.85 });
        }
        
        // Strategy 3: Fuzzy matching
        const fuzzyMapping = this.mapByFuzzyMatching(identifiers, businessFields);
        if (fuzzyMapping) {
            mappingCandidates.push({ ...fuzzyMapping, confidence: 0.75 });
        }
        
        if (mappingCandidates.length === 0) return null;
        
        mappingCandidates.sort((a, b) => b.confidence - a.confidence);
        const bestMapping = mappingCandidates[0];
        
        return {
            businessField: bestMapping.businessField,
            confidence: bestMapping.confidence,
            value: businessFields[bestMapping.businessField]
        };
    }
    
    collectFieldIdentifiers(fieldInfo) {
        const identifiers = [];
        
        if (fieldInfo.label) identifiers.push({ text: fieldInfo.label, weight: 1.0 });
        if (fieldInfo.placeholder) identifiers.push({ text: fieldInfo.placeholder, weight: 0.8 });
        if (fieldInfo.name) identifiers.push({ text: fieldInfo.name, weight: 0.7 });
        if (fieldInfo.id) identifiers.push({ text: fieldInfo.id, weight: 0.6 });
        
        return identifiers;
    }
    
    mapByAutocomplete(autocomplete, businessFields) {
        const autocompleteMapping = {
            'name': 'contactName',
            'given-name': 'firstName',
            'family-name': 'lastName',
            'email': 'email',
            'tel': 'phone',
            'organization': 'companyName',
            'street-address': 'address',
            'address-level2': 'city',
            'address-level1': 'state',
            'postal-code': 'zipCode',
            'country': 'country',
            'url': 'website'
        };
        
        const mappedField = autocompleteMapping[autocomplete.toLowerCase()];
        if (mappedField && businessFields.hasOwnProperty(mappedField)) {
            return { businessField: mappedField };
        }
        
        return null;
    }
    
    mapBySemanticPatterns(identifiers, businessFields) {
        const patterns = {
            companyName: [/company\s*name/i, /business\s*name/i, /organization/i],
            email: [/e?mail/i, /email\s*address/i],
            phone: [/phone/i, /telephone/i, /mobile/i],
            address: [/address/i, /street/i],
            city: [/city/i, /town/i],
            state: [/state/i, /province/i],
            zipCode: [/zip/i, /postal/i],
            country: [/country/i],
            website: [/website/i, /url/i],
            firstName: [/first\s*name/i, /given\s*name/i],
            lastName: [/last\s*name/i, /family\s*name/i],
            contactName: [/contact\s*name/i, /full\s*name/i]
        };
        
        let bestMatch = null;
        let bestScore = 0;
        
        Object.entries(patterns).forEach(([fieldName, fieldPatterns]) => {
            if (businessFields.hasOwnProperty(fieldName)) {
                identifiers.forEach(({ text, weight }) => {
                    fieldPatterns.forEach(pattern => {
                        if (pattern.test(text)) {
                            const score = 0.9 * weight;
                            if (score > bestScore) {
                                bestScore = score;
                                bestMatch = { businessField: fieldName, score };
                            }
                        }
                    });
                });
            }
        });
        
        return bestMatch;
    }
    
    mapByFuzzyMatching(identifiers, businessFields) {
        const businessFieldNames = Object.keys(businessFields);
        let bestMatch = null;
        let bestScore = 0;
        
        identifiers.forEach(({ text, weight }) => {
            const cleanText = text.toLowerCase().replace(/[^a-z0-9]/g, '');
            
            businessFieldNames.forEach(fieldName => {
                const cleanFieldName = fieldName.toLowerCase().replace(/[^a-z0-9]/g, '');
                const similarity = this.calculateSimilarity(cleanText, cleanFieldName);
                const weightedScore = similarity * weight;
                
                if (weightedScore > bestScore && similarity > 0.6) {
                    bestScore = weightedScore;
                    bestMatch = { businessField: fieldName, score: weightedScore };
                }
            });
        });
        
        return bestMatch;
    }
    
    calculateSimilarity(str1, str2) {
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
}

export class DynamicFormDetector {
    constructor() {
        this.contentScript = null;
        this.observedElements = new Set();
    }
    
    initialize(contentScript) {
        this.contentScript = contentScript;
    }
    
    detectAdvancedForms() {
        const detectedForms = [];
        
        // Standard forms
        const standardForms = document.querySelectorAll('form');
        detectedForms.push(...standardForms);
        
        // SPA forms
        const spaForms = this.detectSPAForms();
        detectedForms.push(...spaForms);
        
        // Component forms
        const componentForms = this.detectComponentForms();
        detectedForms.push(...componentForms);
        
        return detectedForms;
    }
    
    detectSPAForms() {
        const candidates = document.querySelectorAll(
            'div[role="form"], section[data-form], .form-container, .form-wrapper'
        );
        
        return Array.from(candidates).filter(el => {
            const inputs = el.querySelectorAll('input, select, textarea');
            const buttons = el.querySelectorAll('button, [role="button"]');
            return inputs.length >= 2 && buttons.length >= 1;
        });
    }
    
    detectComponentForms() {
        const componentSelectors = [
            '[data-react-form]', '[data-vue-form]', '[class*="Form"]'
        ];
        
        const componentForms = [];
        componentSelectors.forEach(selector => {
            try {
                const elements = document.querySelectorAll(selector);
                componentForms.push(...elements);
            } catch (e) {
                // Invalid selector, skip
            }
        });
        
        return componentForms;
    }
    
    detectFormContainers() {
        const containers = [];
        const potentialContainers = document.querySelectorAll('div, section');
        
        potentialContainers.forEach(container => {
            const inputs = container.querySelectorAll('input, select, textarea');
            
            if (inputs.length >= 2 && !container.closest('form')) {
                const hasSubmitButton = container.querySelector(
                    'button[type="submit"], button:not([type]), [class*="submit"]'
                );
                
                if (hasSubmitButton) {
                    containers.push(container);
                }
            }
        });
        
        return containers;
    }
}

export class FallbackSelectorEngine {
    constructor() {
        this.retryAttempts = 3;
        this.retryDelay = 500;
    }
    
    async findElementWithRetry(selectors, maxAttempts = 3) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const element = this.findElementWithFallback(selectors);
            if (element) return element;
            
            if (attempt < maxAttempts - 1) {
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            }
        }
        return null;
    }
    
    findElementWithFallback(selectors) {
        for (let selector of selectors) {
            try {
                const element = document.querySelector(selector);
                if (element && this.isElementInteractable(element)) {
                    return element;
                }
            } catch (e) {
                console.warn(`Invalid selector: ${selector}`);
            }
        }
        
        return this.findByXPath(selectors);
    }
    
    findByXPath(originalSelectors) {
        const xpathQueries = originalSelectors.map(this.cssToXPath).filter(Boolean);
        
        for (let xpath of xpathQueries) {
            try {
                const result = document.evaluate(
                    xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null
                );
                if (result.singleNodeValue) {
                    return result.singleNodeValue;
                }
            } catch (e) {
                // Invalid XPath
            }
        }
        
        return null;
    }
    
    cssToXPath(cssSelector) {
        try {
            if (cssSelector.includes('#')) {
                const id = cssSelector.split('#')[1].split(/[\s\[\.:]/)[0];
                return `//*[@id='${id}']`;
            }
            if (cssSelector.includes('[name=')) {
                const nameMatch = cssSelector.match(/\[name=['"]([^'"]*)['"]\]/);
                if (nameMatch) {
                    return `//*[@name='${nameMatch[1]}']`;
                }
            }
        } catch (e) {
            // Fallback failed
        }
        return null;
    }
    
    isElementInteractable(element) {
        if (!element) return false;
        
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        
        return (
            rect.width > 0 &&
            rect.height > 0 &&
            style.display !== 'none' &&
            style.visibility !== 'hidden' &&
            !element.disabled &&
            !element.readOnly
        );
    }
}

export class PackageTierEngine {
    constructor() {
        this.currentTier = 'starter';
        this.tierLimitations = {
            starter: { maxDirectories: 5, maxForms: 10 },
            pro: { maxDirectories: 25, maxForms: 50 },
            enterprise: { maxDirectories: -1, maxForms: -1 }
        };
    }
    
    checkTierLimits(directoryCount, formCount) {
        const limits = this.tierLimitations[this.currentTier];
        
        return {
            canProcess: (limits.maxDirectories === -1 || directoryCount <= limits.maxDirectories) &&
                       (limits.maxForms === -1 || formCount <= limits.maxForms),
            currentTier: this.currentTier,
            limits: limits
        };
    }
    
    upgradeRequired(currentUsage) {
        const limits = this.tierLimitations[this.currentTier];
        return currentUsage.directories > limits.maxDirectories || 
               currentUsage.forms > limits.maxForms;
    }
}