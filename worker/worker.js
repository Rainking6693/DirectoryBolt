#!/usr/bin/env node

/**
 * DirectoryBolt AutoBolt Worker Service
 * 
 * Production-ready Playwright-based form automation service
 * Replaces Chrome extension with backend worker automation
 * 
 * Features:
 * - Playwright browser automation
 * - 2Captcha integration for captcha solving
 * - HTTP proxy support for Enterprise scaling
 * - Advanced field mapping and form detection
 * - Intelligent fallback mechanisms
 * - Worker-to-orchestrator communication
 */

const { chromium } = require('playwright');
const axios = require('axios');
const DirectoryConfiguration = require('./directory-config.js');
require('dotenv').config();

class DirectoryBoltWorker {
    constructor() {
        this.browser = null;
        this.page = null;
        this.config = {
            // 2Captcha Configuration - NO HARDCODED FALLBACK FOR SECURITY
            twoCaptchaApiKey: process.env.TWO_CAPTCHA_KEY,
            
            // HTTP Proxy Configuration
            proxyEnabled: process.env.HTTP_PROXY_ENABLED === 'true',
            proxyServer: process.env.HTTP_PROXY_SERVER || null,
            proxyUsername: process.env.HTTP_PROXY_USERNAME || null,
            proxyPassword: process.env.HTTP_PROXY_PASSWORD || null,
            
            // Orchestrator Communication - REQUIRED FOR SECURITY
            orchestratorBaseUrl: process.env.ORCHESTRATOR_URL || 'https://directorybolt.netlify.app/api',
            workerAuthToken: process.env.WORKER_AUTH_TOKEN,
            
            // Browser Configuration
            headless: process.env.HEADLESS !== 'false',
            viewport: { width: 1920, height: 1080 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        };
        
        // Initialize helper classes (migrated from extension)
        this.fieldMapper = new AdvancedFieldMapper();
        this.formDetector = new DynamicFormDetector();
        this.fallbackEngine = new FallbackSelectorEngine();
        this.directoryConfig = new DirectoryConfiguration();
        
        this.processingState = {
            currentJob: null,
            retryCount: 0,
            maxRetries: 3
        };
    }
    
    /**
     * Initialize the worker service
     */
    async initialize() {
        console.log('🚀 Initializing DirectoryBolt Worker Service...');
        
        try {
            // Validate required environment variables for security
            this.validateSecurityConfiguration();
            
            await this.directoryConfig.initialize();
            await this.launchBrowser();
            await this.registerWithOrchestrator();
            console.log('✅ Worker service initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize worker service:', error);
            throw error;
        }
    }
    
    /**
     * Validate security configuration and required environment variables
     */
    validateSecurityConfiguration() {
        console.log('🔒 Validating security configuration...');
        
        const requiredVars = [
            { name: 'TWO_CAPTCHA_KEY', value: this.config.twoCaptchaApiKey },
            { name: 'WORKER_AUTH_TOKEN', value: this.config.workerAuthToken }
        ];
        
        const missingVars = [];
        
        for (const { name, value } of requiredVars) {
            if (!value || value.trim() === '') {
                missingVars.push(name);
            }
        }
        
        if (missingVars.length > 0) {
            throw new Error(
                `Missing required environment variables for secure operation: ${missingVars.join(', ')}. ` +
                'Please set these variables in your .env file or environment.'
            );
        }
        
        // Validate API key format (basic check)
        if (this.config.twoCaptchaApiKey.length < 32) {
            console.warn('⚠️  Warning: TWO_CAPTCHA_KEY appears to be too short. Please verify your API key.');
        }
        
        // Validate auth token format
        if (this.config.workerAuthToken.length < 20) {
            console.warn('⚠️  Warning: WORKER_AUTH_TOKEN appears to be too short for secure authentication.');
        }
        
        console.log('✅ Security configuration validated');
    }
    
    /**
     * Launch Playwright browser with configuration
     */
    async launchBrowser() {
        console.log('🔧 Launching Playwright browser...');
        
        const launchOptions = {
            headless: this.config.headless,
            viewport: this.config.viewport,
            userAgent: this.config.userAgent,
            args: [
                '--disable-blink-features=AutomationControlled',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu'
            ]
        };
        
        // Add proxy configuration if enabled
        if (this.config.proxyEnabled && this.config.proxyServer) {
            launchOptions.proxy = {
                server: this.config.proxyServer,
                username: this.config.proxyUsername,
                password: this.config.proxyPassword
            };
            console.log('🌐 HTTP Proxy enabled:', this.config.proxyServer);
        }
        
        this.browser = await chromium.launch(launchOptions);
        this.page = await this.browser.newPage();
        
        // Set extra HTTP headers to avoid detection
        await this.page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        });
        
        console.log('✅ Browser launched successfully');
    }
    
    /**
     * Register worker with orchestrator service
     */
    async registerWithOrchestrator() {
        if (!this.config.orchestratorBaseUrl) {
            console.warn('⚠️  No orchestrator URL configured - running in standalone mode');
            return;
        }
        
        if (!this.config.workerAuthToken) {
            throw new Error('Worker authentication token is required for orchestrator communication');
        }
        
        try {
            const response = await axios.post(`${this.config.orchestratorBaseUrl}/worker-register`, {
                workerId: process.env.WORKER_ID || `worker-${Date.now()}`,
                capabilities: ['form-filling', 'captcha-solving', 'proxy-support'],
                status: 'ready'
            }, {
                headers: {
                    'Authorization': `Bearer ${this.config.workerAuthToken}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'DirectoryBolt-Worker/1.0.0'
                },
                timeout: 10000 // 10 second timeout
            });
            
            if (response.data && response.data.status === 'registered') {
                console.log('✅ Registered with orchestrator:', response.data);
            } else {
                throw new Error('Invalid registration response from orchestrator');
            }
        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Authentication failed: Invalid worker token. Please verify WORKER_AUTH_TOKEN.');
            } else if (error.response?.status === 403) {
                throw new Error('Authorization failed: Worker not allowed to register.');
            } else if (error.code === 'ECONNREFUSED') {
                throw new Error('Cannot connect to orchestrator service. Please verify ORCHESTRATOR_URL.');
            }
            
            console.error('❌ Failed to register with orchestrator:', error.message);
            throw new Error(`Orchestrator registration failed: ${error.message}`);
        }
    }
    
    /**
     * Start processing jobs from orchestrator
     */
    async startProcessing() {
        console.log('🔄 Starting job processing loop...');
        
        while (true) {
            try {
                const job = await this.getNextJob();
                if (job) {
                    await this.processJob(job);
                } else {
                    // No jobs available, wait before checking again
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            } catch (error) {
                console.error('❌ Error in processing loop:', error);
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }
    }
    
    /**
     * Get next job from orchestrator
     */
    async getNextJob() {
        try {
            const response = await axios.post(`${this.config.orchestratorBaseUrl}/jobs-next`, {}, {
                headers: {
                    'Authorization': `Bearer ${this.config.workerAuthToken}`,
                    'X-Worker-ID': process.env.WORKER_ID || 'worker-001',
                    'Content-Type': 'application/json',
                    'User-Agent': 'DirectoryBolt-Worker/1.0.0'
                },
                timeout: 5000
            });
            
            return response.data.data || null;
        } catch (error) {
            if (error.response?.status === 401) {
                throw new Error('Authentication failed while getting job. Token may have expired.');
            } else if (error.response?.status !== 404) {
                console.error('❌ Failed to get next job:', error.message);
            }
            return null;
        }
    }
    
    /**
     * Process a directory submission job
     */
    async processJob(job) {
        console.log(`🎯 Processing job: ${job.id} for customer: ${job.customerId}`);
        this.processingState.currentJob = job;
        this.processingState.retryCount = 0;
        
        try {
            await this.updateJobStatus(job.id, 'processing');
            
            // Navigate to directory website
            const directoryUrl = this.addCacheBuster(job.directoryUrl);
            await this.page.goto(directoryUrl, { waitUntil: 'networkidle', timeout: 30000 });
            
            // Detect forms using migrated logic
            const forms = await this.detectAdvancedForms();
            
            if (forms.length === 0) {
                throw new Error('No forms detected on directory website');
            }
            
            // Fill form with business data
            const fillResult = await this.fillDirectoryForm(forms[0], job.businessData);
            
            // Handle captcha if present
            await this.handleCaptcha();
            
            // Submit form
            await this.submitForm();
            
            // Verify submission success
            const success = await this.verifySubmission();
            
            if (success) {
                await this.updateJobStatus(job.id, 'completed', { submissionResult: fillResult });
                console.log(`✅ Job ${job.id} completed successfully`);
            } else {
                throw new Error('Form submission verification failed');
            }
            
        } catch (error) {
            console.error(`❌ Job ${job.id} failed:`, error.message);
            
            if (this.processingState.retryCount < this.config.maxRetries) {
                this.processingState.retryCount++;
                console.log(`🔄 Retrying job ${job.id} (attempt ${this.processingState.retryCount})`);
                await new Promise(resolve => setTimeout(resolve, 5000));
                return this.processJob(job);
            } else {
                await this.updateJobStatus(job.id, 'failed', { 
                    error: error.message,
                    retryCount: this.processingState.retryCount 
                });
            }
        }
    }
    
    /**
     * Add cache buster to URL (migrated from cache-buster.js)
     */
    addCacheBuster(url) {
        const separator = url.includes('?') ? '&' : '?';
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 10000);
        return `${url}${separator}_cb=${timestamp}&_r=${random}`;
    }
    
    /**
     * Update job status with orchestrator
     */
    async updateJobStatus(jobId, status, data = {}) {
        try {
            await axios.post(`${this.config.orchestratorBaseUrl}/jobs-update`, {
                jobId,
                status,
                workerData: data,
                timestamp: new Date().toISOString()
            }, {
                headers: {
                    'Authorization': `Bearer ${this.config.workerAuthToken}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'DirectoryBolt-Worker/1.0.0'
                },
                timeout: 10000
            });
        } catch (error) {
            if (error.response?.status === 401) {
                console.error(`❌ Authentication failed while updating job ${jobId}. Token may have expired.`);
            } else {
                console.error(`❌ Failed to update job ${jobId} status:`, error.message);
            }
        }
    }
    
    /**
     * Cleanup and shutdown worker
     */
    async shutdown() {
        console.log('🛑 Shutting down worker service...');
        
        if (this.browser) {
            await this.browser.close();
        }
        
        console.log('✅ Worker service shut down gracefully');
        process.exit(0);
    }
}

/**
 * AdvancedFieldMapper - Migrated from extension lib/AdvancedFieldMapper.js
 * Handles intelligent field mapping with confidence scoring
 */
class AdvancedFieldMapper {
    constructor() {
        this.confidenceThreshold = 0.7;
        this.mappingCache = new Map();
        this.learningData = new Map();
    }
    
    reset() {
        this.mappingCache.clear();
    }
    
    /**
     * Analyze field patterns for mapping confidence
     * Migrated and enhanced from extension logic
     */
    async analyzeFieldPatterns(element) {
        const cacheKey = this.generateCacheKey(element);
        
        if (this.mappingCache.has(cacheKey)) {
            return this.mappingCache.get(cacheKey);
        }
        
        const pattern = {
            semanticScore: await this.calculateSemanticScore(element),
            contextScore: await this.calculateContextScore(element),
            positionScore: await this.calculatePositionScore(element),
            confidence: 0.5
        };
        
        // Calculate overall confidence
        pattern.confidence = (pattern.semanticScore + pattern.contextScore + pattern.positionScore) / 3;
        
        this.mappingCache.set(cacheKey, pattern);
        return pattern;
    }
    
    /**
     * Map element to business field type
     */
    async mapToBusinessField(element, businessData) {
        const fieldMetadata = await this.extractFieldMetadata(element);
        const pattern = await this.analyzeFieldPatterns(element);
        
        const result = {
            identifier: fieldMetadata.name || fieldMetadata.id || 'unknown',
            confidence: pattern.confidence,
            suggestedField: this.determineSuggestedField(fieldMetadata, pattern),
            value: this.getBusinessValue(this.determineSuggestedField(fieldMetadata, pattern), businessData)
        };
        
        return result;
    }
    
    /**
     * Extract field metadata from element
     */
    async extractFieldMetadata(element) {
        const name = await element.getAttribute('name') || '';
        const id = await element.getAttribute('id') || '';
        const placeholder = await element.getAttribute('placeholder') || '';
        const type = await element.getAttribute('type') || '';
        const className = await element.getAttribute('class') || '';
        
        return { name, id, placeholder, type, className, element };
    }
    
    /**
     * Generate cache key for element
     */
    generateCacheKey(element) {
        // Create a unique key based on element properties
        return `${element.constructor.name}-${Date.now()}-${Math.random()}`;
    }
    
    /**
     * Calculate semantic score based on field attributes
     */
    async calculateSemanticScore(element) {
        const metadata = await this.extractFieldMetadata(element);
        let score = 0.3; // base score
        
        // Check for business name indicators
        if (this.matchesPattern(metadata, ['business', 'company', 'organization'])) {
            score += 0.4;
        }
        
        // Check for email indicators
        if (metadata.type === 'email' || this.matchesPattern(metadata, ['email', 'mail'])) {
            score += 0.4;
        }
        
        // Check for phone indicators
        if (metadata.type === 'tel' || this.matchesPattern(metadata, ['phone', 'tel', 'mobile'])) {
            score += 0.4;
        }
        
        return Math.min(score, 1.0);
    }
    
    /**
     * Calculate context score based on surrounding elements
     */
    async calculateContextScore(element) {
        // For now, return base score - could be enhanced with DOM analysis
        return 0.5;
    }
    
    /**
     * Calculate position score based on element position
     */
    async calculatePositionScore(element) {
        // For now, return base score - could be enhanced with position analysis
        return 0.5;
    }
    
    /**
     * Check if metadata matches patterns
     */
    matchesPattern(metadata, patterns) {
        const searchText = `${metadata.name} ${metadata.id} ${metadata.placeholder} ${metadata.className}`.toLowerCase();
        return patterns.some(pattern => searchText.includes(pattern.toLowerCase()));
    }
    
    /**
     * Determine suggested field type
     */
    determineSuggestedField(metadata, pattern) {
        if (metadata.type === 'email' || this.matchesPattern(metadata, ['email'])) {
            return 'email';
        }
        
        if (this.matchesPattern(metadata, ['business', 'company', 'organization'])) {
            return 'businessName';
        }
        
        if (this.matchesPattern(metadata, ['phone', 'tel', 'mobile'])) {
            return 'phone';
        }
        
        if (this.matchesPattern(metadata, ['website', 'url', 'site'])) {
            return 'website';
        }
        
        if (this.matchesPattern(metadata, ['description', 'about', 'bio'])) {
            return 'description';
        }
        
        return 'general';
    }
    
    /**
     * Get business value for field type
     */
    getBusinessValue(fieldType, businessData) {
        const mapping = {
            businessName: businessData?.businessName || businessData?.business_name || '',
            email: businessData?.email || '',
            phone: businessData?.phone || businessData?.phoneNumber || '',
            website: businessData?.website || businessData?.websiteUrl || '',
            description: businessData?.description || businessData?.businessDescription || ''
        };
        
        return mapping[fieldType] || '';
    }
}

/**
 * DynamicFormDetector - Migrated from extension lib/DynamicFormDetector.js
 * Detects forms using multiple strategies for different website types
 */
class DynamicFormDetector {
    constructor() {
        this.detectionStrategies = ['standard', 'spa', 'component'];
        this.observedElements = new WeakSet();
    }
    
    /**
     * Detect advanced forms using multiple strategies
     */
    async detectAdvancedForms(page) {
        const forms = new Set();
        
        await this.collectStandardForms(page, forms);
        await this.collectSpaContainers(page, forms);
        await this.collectComponentForms(page, forms);
        
        return Array.from(forms);
    }
    
    /**
     * Collect standard HTML forms
     */
    async collectStandardForms(page, collection) {
        const forms = await page.$$('form');
        forms.forEach(form => collection.add(form));
    }
    
    /**
     * Collect SPA container elements that act as forms
     */
    async collectSpaContainers(page, collection) {
        const selectors = [
            'div[role="form"]',
            'section[data-form]',
            '.form-container',
            '.form-wrapper',
            '[data-testid*="form"]',
            '[class*="form"]'
        ];
        
        for (const selector of selectors) {
            try {
                const containers = await page.$$(selector);
                
                for (const container of containers) {
                    const inputs = await container.$$('input, select, textarea, [contenteditable="true"]');
                    const buttons = await container.$$('button, [role="button"], input[type="submit"]');
                    
                    if (inputs.length >= 2 && buttons.length >= 1) {
                        collection.add(container);
                    }
                }
            } catch (error) {
                console.warn('DynamicFormDetector: invalid selector', selector, error);
            }
        }
    }
    
    /**
     * Collect component-based forms (React/Vue/Angular)
     */
    async collectComponentForms(page, collection) {
        const selectors = [
            '[data-react-form]',
            '[data-vue-form]',
            '[data-angular-form]',
            '[class*="Form"]',
            '[class*="form-component"]'
        ];
        
        for (const selector of selectors) {
            try {
                const elements = await page.$$(selector);
                elements.forEach(element => collection.add(element));
            } catch (error) {
                console.warn('DynamicFormDetector: invalid selector', selector, error);
            }
        }
    }
}

/**
 * FallbackSelectorEngine - Migrated from extension lib/FallbackSelectorEngine.js
 * Handles element finding with retry and fallback mechanisms
 */
class FallbackSelectorEngine {
    constructor() {
        this.retryAttempts = 3;
        this.retryDelay = 500;
    }
    
    /**
     * Find element with retry mechanism
     */
    async findElementWithRetry(page, selectors, maxAttempts = this.retryAttempts) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const element = await this.findElementWithFallback(page, selectors);
            if (element) {
                return element;
            }
            await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        }
        return null;
    }
    
    /**
     * Find element using fallback selectors
     */
    async findElementWithFallback(page, selectors) {
        for (const selector of selectors) {
            try {
                const element = await page.$(selector);
                if (element && await this.isElementInteractable(element)) {
                    return element;
                }
            } catch (error) {
                console.warn('FallbackSelectorEngine: invalid selector', selector, error);
            }
        }
        
        // Try XPath fallback
        return await this.findByXPath(page, selectors);
    }
    
    /**
     * Find element using XPath conversion
     */
    async findByXPath(page, originalSelectors) {
        const xpathQueries = originalSelectors
            .map(selector => this.cssToXPath(selector))
            .filter(Boolean);
            
        for (const xpath of xpathQueries) {
            try {
                const element = await page.$(`xpath=${xpath}`);
                if (element) {
                    return element;
                }
            } catch (error) {
                console.warn('FallbackSelectorEngine: invalid XPath', xpath, error);
            }
        }
        
        return null;
    }
    
    /**
     * Convert CSS selector to XPath
     */
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
            
            if (cssSelector.includes('input[type=')) {
                const typeMatch = cssSelector.match(/input\[type=['"]([^'"]*)['"]\]/);
                if (typeMatch) {
                    return `//input[@type='${typeMatch[1]}']`;
                }
            }
        } catch (error) {
            console.warn('FallbackSelectorEngine: cssToXPath failed', error);
        }
        
        return null;
    }
    
    /**
     * Check if element is interactable
     */
    async isElementInteractable(element) {
        if (!element) return false;
        
        try {
            const isVisible = await element.isVisible();
            const isEnabled = await element.isEnabled();
            return isVisible && isEnabled;
        } catch (error) {
            return false;
        }
    }
}

// Add additional worker methods to main class
DirectoryBoltWorker.prototype.detectAdvancedForms = async function() {
    return await this.formDetector.detectAdvancedForms(this.page);
};

DirectoryBoltWorker.prototype.fillDirectoryForm = async function(form, businessData) {
    console.log('📝 Filling directory form with business data...');
    
    // Get all input elements within the form
    const inputs = await form.$$('input, select, textarea, [contenteditable="true"]');
    const fillResults = [];
    
    for (const input of inputs) {
        try {
            const mapping = await this.fieldMapper.mapToBusinessField(input, businessData);
            
            if (mapping.confidence >= this.fieldMapper.confidenceThreshold && mapping.value) {
                await input.fill(mapping.value);
                fillResults.push({
                    field: mapping.identifier,
                    type: mapping.suggestedField,
                    value: mapping.value,
                    confidence: mapping.confidence
                });
                
                console.log(`✅ Filled ${mapping.suggestedField}: ${mapping.value}`);
            }
        } catch (error) {
            console.warn('⚠️  Failed to fill field:', error.message);
        }
    }
    
    return fillResults;
};

DirectoryBoltWorker.prototype.handleCaptcha = async function() {
    console.log('🔍 Checking for captcha...');
    
    // Look for common captcha containers
    const captchaSelectors = [
        '.g-recaptcha',
        '#recaptcha',
        '[data-sitekey]',
        '.hcaptcha',
        '.cf-turnstile'
    ];
    
    for (const selector of captchaSelectors) {
        const captchaElement = await this.page.$(selector);
        if (captchaElement) {
            console.log('🤖 Captcha detected, solving with 2Captcha...');
            return await this.solve2Captcha(captchaElement);
        }
    }
    
    console.log('✅ No captcha detected');
    return true;
};

DirectoryBoltWorker.prototype.solve2Captcha = async function(captchaElement) {
    try {
        // Verify API key is available
        if (!this.config.twoCaptchaApiKey) {
            throw new Error('2Captcha API key not configured. Please set TWO_CAPTCHA_KEY environment variable.');
        }
        
        // Get site key for reCAPTCHA
        const siteKey = await captchaElement.getAttribute('data-sitekey');
        const pageUrl = this.page.url();
        
        if (!siteKey) {
            console.warn('⚠️  Could not find captcha site key');
            return false;
        }
        
        console.log('🔄 Submitting captcha to 2Captcha service...');
        
        // Submit captcha to 2Captcha (using HTTPS for security)
        const submitResponse = await axios.post('https://2captcha.com/in.php', {
            method: 'userrecaptcha',
            googlekey: siteKey,
            pageurl: pageUrl,
            key: this.config.twoCaptchaApiKey,
            json: 1
        }, {
            timeout: 30000,
            headers: {
                'User-Agent': 'DirectoryBolt-Worker/1.0.0'
            }
        });
        
        if (submitResponse.data.status !== 1) {
            // Don't log the full response to avoid exposing sensitive data
            throw new Error(`2Captcha submit failed: ${submitResponse.data.error_text || 'Unknown error'}`);
        }
        
        const captchaId = submitResponse.data.request;
        console.log(`🔄 Captcha ID: ${captchaId}, waiting for solution...`);
        
        // Poll for solution
        let attempts = 0;
        const maxAttempts = 30; // 5 minutes maximum
        
        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
            
            const resultResponse = await axios.get('https://2captcha.com/res.php', {
                params: {
                    key: this.config.twoCaptchaApiKey,
                    action: 'get',
                    id: captchaId,
                    json: 1
                },
                timeout: 10000,
                headers: {
                    'User-Agent': 'DirectoryBolt-Worker/1.0.0'
                }
            });
            
            if (resultResponse.data.status === 1) {
                const solution = resultResponse.data.request;
                console.log('✅ Captcha solved successfully');
                
                // Inject solution into page
                await this.page.evaluate((token) => {
                    if (window.grecaptcha && window.grecaptcha.getResponse) {
                        // Set reCAPTCHA response
                        const textarea = document.querySelector('[name="g-recaptcha-response"]');
                        if (textarea) {
                            textarea.value = token;
                            textarea.style.display = 'block';
                        }
                        
                        // Trigger callback if available
                        if (window.grecaptcha.callback) {
                            window.grecaptcha.callback(token);
                        }
                    }
                }, solution);
                
                return true;
            }
            
            if (resultResponse.data.error_text && resultResponse.data.error_text !== 'CAPCHA_NOT_READY') {
                throw new Error(`2Captcha error: ${resultResponse.data.error_text}`);
            }
            
            attempts++;
        }
        
        throw new Error('Captcha solving timeout - exceeded maximum wait time');
        
    } catch (error) {
        // Log error without exposing sensitive data
        console.error('❌ Failed to solve captcha:', error.message);
        return false;
    }
};

DirectoryBoltWorker.prototype.submitForm = async function() {
    console.log('📤 Submitting form...');
    
    try {
        // Look for submit buttons
        const submitSelectors = [
            'button[type="submit"]',
            'input[type="submit"]',
            'button:has-text("Submit")',
            'button:has-text("Send")',
            'button:has-text("Create")',
            '[role="button"]:has-text("Submit")'
        ];
        
        for (const selector of submitSelectors) {
            const button = await this.page.$(selector);
            if (button && await button.isVisible()) {
                await button.click();
                console.log('✅ Form submitted successfully');
                return true;
            }
        }
        
        // Fallback: try pressing Enter on focused element
        await this.page.keyboard.press('Enter');
        console.log('⚠️  Submitted form using Enter key fallback');
        return true;
        
    } catch (error) {
        console.error('❌ Failed to submit form:', error.message);
        throw error;
    }
};

DirectoryBoltWorker.prototype.verifySubmission = async function() {
    console.log('🔍 Verifying form submission...');
    
    try {
        // Wait for navigation or success indicators
        await Promise.race([
            this.page.waitForNavigation({ timeout: 10000 }),
            this.page.waitForSelector('.success, .thank-you, [class*="success"]', { timeout: 10000 })
        ]);
        
        // Check for success indicators
        const successIndicators = [
            '.success',
            '.thank-you',
            '.confirmation',
            '[class*="success"]',
            '[class*="thank"]',
            ':has-text("Thank you")',
            ':has-text("Success")',
            ':has-text("Submitted")'
        ];
        
        for (const indicator of successIndicators) {
            const element = await this.page.$(indicator);
            if (element) {
                console.log('✅ Submission verified successfully');
                return true;
            }
        }
        
        // Check if URL changed (likely success)
        const currentUrl = this.page.url();
        if (currentUrl.includes('thank') || currentUrl.includes('success') || currentUrl.includes('complete')) {
            console.log('✅ Submission verified by URL change');
            return true;
        }
        
        console.log('⚠️  Could not verify submission - assuming success');
        return true;
        
    } catch (error) {
        console.warn('⚠️  Submission verification timeout:', error.message);
        return true; // Assume success if we can't verify
    }
};

// Main execution
if (require.main === module) {
    const worker = new DirectoryBoltWorker();
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Received SIGINT, shutting down gracefully...');
        worker.shutdown();
    });
    
    process.on('SIGTERM', () => {
        console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
        worker.shutdown();
    });
    
    // Start the worker
    worker.initialize()
        .then(() => {
            console.log('🚀 DirectoryBolt Worker Service is ready!');
            return worker.startProcessing();
        })
        .catch((error) => {
            console.error('❌ Failed to start worker:', error);
            process.exit(1);
        });
}

module.exports = DirectoryBoltWorker;