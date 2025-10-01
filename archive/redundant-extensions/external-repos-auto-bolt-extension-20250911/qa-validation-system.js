/**
 * Auto-Bolt QA Validation System
 * Comprehensive testing and validation for all 63 directories
 * Validates URLs, form structures, field mappings, and skip logic
 */

class DirectoryQAValidator {
    constructor() {
        this.masterDirectories = null;
        this.validationResults = new Map();
        this.testMetrics = {
            totalTests: 0,
            passed: 0,
            failed: 0,
            skipped: 0,
            startTime: null,
            endTime: null
        };
        this.logger = new QALogger();
        this.skipReasons = {
            ANTI_BOT: 'Anti-bot protection detected',
            REQUIRES_LOGIN: 'Login required',
            CAPTCHA: 'CAPTCHA protection detected',
            SUBMISSION_FEE: 'Submission fee required',
            MAINTENANCE: 'Site under maintenance',
            NETWORK_ERROR: 'Network connectivity error',
            INVALID_URL: 'URL is invalid or inaccessible',
            MALFORMED_RESPONSE: 'Malformed page response'
        };
        this.init();
    }

    async init() {
        this.logger.info('🚀 Initializing Directory QA Validation System');
        await this.loadMasterDirectories();
        this.setupValidationFramework();
        this.logger.info('✅ QA Validation System initialized successfully');
    }

    async loadMasterDirectories() {
        try {
            this.logger.info('📄 Loading master directory list...');
            const response = await fetch('./directories/master-directory-list.json');
            const data = await response.json();
            this.masterDirectories = data.directories;
            this.logger.info(`✅ Loaded ${this.masterDirectories.length} directories for validation`);
        } catch (error) {
            this.logger.error('❌ Failed to load master directory list:', error);
            throw new Error('Cannot proceed without directory data');
        }
    }

    setupValidationFramework() {
        this.logger.info('🏗️ Setting up validation framework...');
        
        // Create validation test categories
        this.validationCategories = {
            URL_ACCESSIBILITY: {
                name: 'URL Accessibility',
                description: 'Verify submission URLs are accessible',
                priority: 'high',
                tests: ['checkUrlAccessibility', 'validateHttpsRedirect', 'checkResponseTime']
            },
            FORM_STRUCTURE: {
                name: 'Form Structure',
                description: 'Validate form fields and structure',
                priority: 'high', 
                tests: ['detectFormElements', 'validateFieldMappings', 'checkRequiredFields']
            },
            FIELD_SELECTORS: {
                name: 'Field Selectors',
                description: 'Test CSS selectors for form fields',
                priority: 'critical',
                tests: ['validateSelectors', 'testSelectorMatching', 'checkSelectorUniqueness']
            },
            SKIP_LOGIC: {
                name: 'Skip Logic',
                description: 'Validate anti-bot and login detection',
                priority: 'medium',
                tests: ['detectAntiBotProtection', 'checkLoginRequirement', 'identifyCaptcha']
            },
            SUCCESS_VALIDATION: {
                name: 'Success Validation',
                description: 'Test submission success criteria',
                priority: 'high',
                tests: ['checkSubmissionFlow', 'validateRedirectHandling', 'detectConfirmationMessages']
            },
            PERFORMANCE: {
                name: 'Performance',
                description: 'Validate response times and reliability',
                priority: 'medium',
                tests: ['measureLoadTime', 'checkPageSize', 'validateUptime']
            }
        };
        
        this.logger.info('✅ Validation framework configured');
    }

    /**
     * Run comprehensive validation on all directories
     */
    async validateAllDirectories() {
        this.logger.info('🎯 Starting comprehensive validation of all 63 directories');
        this.testMetrics.startTime = Date.now();
        this.testMetrics.totalTests = this.masterDirectories.length;

        const validationPromises = this.masterDirectories.map(directory => 
            this.validateDirectory(directory).catch(error => {
                this.logger.error(`❌ Critical error validating ${directory.id}:`, error);
                return this.createErrorResult(directory, error);
            })
        );

        const results = await Promise.allSettled(validationPromises);
        this.testMetrics.endTime = Date.now();
        
        // Process results
        results.forEach((result, index) => {
            const directory = this.masterDirectories[index];
            if (result.status === 'fulfilled') {
                this.validationResults.set(directory.id, result.value);
                this.updateMetrics(result.value);
            } else {
                this.logger.error(`❌ Validation failed for ${directory.id}:`, result.reason);
                this.validationResults.set(directory.id, this.createErrorResult(directory, result.reason));
                this.testMetrics.failed++;
            }
        });

        this.logger.info('✅ Comprehensive validation completed');
        return this.generateValidationReport();
    }

    /**
     * Validate individual directory
     */
    async validateDirectory(directory) {
        this.logger.info(`🔍 Validating directory: ${directory.name} (${directory.id})`);
        
        const result = {
            directoryId: directory.id,
            directoryName: directory.name,
            url: directory.url,
            submissionUrl: directory.submissionUrl,
            category: directory.category,
            priority: directory.priority,
            timestamp: new Date().toISOString(),
            testResults: {},
            overallStatus: 'pending',
            skipReason: null,
            recommendations: [],
            metrics: {
                totalTests: 0,
                passed: 0,
                failed: 0,
                skipped: 0,
                executionTime: 0
            }
        };

        const startTime = Date.now();

        try {
            // Check if directory should be skipped based on flags
            const skipCheck = this.shouldSkipDirectory(directory);
            if (skipCheck.skip) {
                result.overallStatus = 'skipped';
                result.skipReason = skipCheck.reason;
                result.metrics.skipped = 1;
                this.logger.warn(`⏭️ Skipping ${directory.name}: ${skipCheck.reason}`);
                return result;
            }

            // Run validation tests by category
            for (const [categoryKey, category] of Object.entries(this.validationCategories)) {
                this.logger.debug(`📋 Running ${category.name} tests for ${directory.name}`);
                result.testResults[categoryKey] = await this.runCategoryTests(directory, category);
                result.metrics.totalTests += result.testResults[categoryKey].tests.length;
            }

            // Calculate metrics
            this.calculateDirectoryMetrics(result);

            // Determine overall status
            result.overallStatus = this.determineOverallStatus(result);

            // Generate recommendations
            result.recommendations = this.generateRecommendations(directory, result);

            result.metrics.executionTime = Date.now() - startTime;
            this.logger.info(`✅ Validation completed for ${directory.name} in ${result.metrics.executionTime}ms`);

        } catch (error) {
            result.overallStatus = 'error';
            result.error = error.message;
            result.metrics.executionTime = Date.now() - startTime;
            this.logger.error(`❌ Error during validation of ${directory.name}:`, error);
        }

        return result;
    }

    /**
     * Check if directory should be skipped based on configuration
     */
    shouldSkipDirectory(directory) {
        // Check for anti-bot protection
        if (directory.hasAntiBot === true) {
            return { skip: true, reason: this.skipReasons.ANTI_BOT };
        }

        // Check for login requirement
        if (directory.requiresLogin === true) {
            return { skip: true, reason: this.skipReasons.REQUIRES_LOGIN };
        }

        // Check for submission fees
        if (directory.submissionFee && directory.submissionFee !== '$0' && directory.submissionFee !== 'free') {
            return { skip: true, reason: this.skipReasons.SUBMISSION_FEE };
        }

        // Check for invalid URLs
        try {
            new URL(directory.submissionUrl);
        } catch (error) {
            return { skip: true, reason: this.skipReasons.INVALID_URL };
        }

        return { skip: false, reason: null };
    }

    /**
     * Run tests for a specific validation category
     */
    async runCategoryTests(directory, category) {
        const categoryResult = {
            categoryName: category.name,
            priority: category.priority,
            status: 'pending',
            tests: [],
            startTime: Date.now(),
            endTime: null
        };

        for (const testName of category.tests) {
            try {
                this.logger.debug(`🧪 Running test: ${testName} for ${directory.name}`);
                const testResult = await this[testName](directory);
                categoryResult.tests.push({
                    testName,
                    status: testResult.status,
                    message: testResult.message,
                    details: testResult.details || null,
                    executionTime: testResult.executionTime || 0
                });
            } catch (error) {
                this.logger.error(`❌ Test ${testName} failed for ${directory.name}:`, error);
                categoryResult.tests.push({
                    testName,
                    status: 'error',
                    message: error.message,
                    details: null,
                    executionTime: 0
                });
            }
        }

        categoryResult.endTime = Date.now();
        categoryResult.status = this.determineCategoryStatus(categoryResult.tests);
        
        return categoryResult;
    }

    /**
     * URL Accessibility Tests
     */
    async checkUrlAccessibility(directory) {
        const startTime = Date.now();
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(directory.submissionUrl, {
                method: 'HEAD',
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124 Safari/537.36'
                }
            });
            
            clearTimeout(timeoutId);
            const executionTime = Date.now() - startTime;

            if (response.status >= 200 && response.status < 400) {
                return {
                    status: 'passed',
                    message: `URL accessible (${response.status})`,
                    details: {
                        statusCode: response.status,
                        responseTime: executionTime,
                        headers: Object.fromEntries(response.headers.entries())
                    },
                    executionTime
                };
            } else {
                return {
                    status: 'failed',
                    message: `URL returned ${response.status}`,
                    details: { statusCode: response.status, responseTime: executionTime },
                    executionTime
                };
            }
        } catch (error) {
            return {
                status: 'failed',
                message: `Network error: ${error.message}`,
                details: { error: error.name },
                executionTime: Date.now() - startTime
            };
        }
    }

    async validateHttpsRedirect(directory) {
        const startTime = Date.now();
        
        try {
            const httpUrl = directory.submissionUrl.replace('https://', 'http://');
            if (httpUrl === directory.submissionUrl) {
                return {
                    status: 'passed',
                    message: 'Already using HTTPS',
                    executionTime: Date.now() - startTime
                };
            }

            const response = await fetch(httpUrl, {
                method: 'HEAD',
                redirect: 'manual',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (response.status >= 300 && response.status < 400) {
                const location = response.headers.get('location');
                if (location && location.startsWith('https://')) {
                    return {
                        status: 'passed',
                        message: 'HTTP properly redirects to HTTPS',
                        details: { redirectLocation: location },
                        executionTime: Date.now() - startTime
                    };
                }
            }

            return {
                status: 'warning',
                message: 'HTTP does not redirect to HTTPS',
                executionTime: Date.now() - startTime
            };
        } catch (error) {
            return {
                status: 'skipped',
                message: 'Could not test HTTPS redirect',
                executionTime: Date.now() - startTime
            };
        }
    }

    async checkResponseTime(directory) {
        const startTime = Date.now();
        
        try {
            const response = await fetch(directory.submissionUrl, {
                method: 'HEAD',
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            const responseTime = Date.now() - startTime;
            let status = 'passed';
            let message = `Response time: ${responseTime}ms`;

            if (responseTime > 5000) {
                status = 'failed';
                message = `Slow response: ${responseTime}ms (>5s)`;
            } else if (responseTime > 2000) {
                status = 'warning';
                message = `Moderate response: ${responseTime}ms (>2s)`;
            }

            return {
                status,
                message,
                details: { responseTime, threshold: '2000ms warning, 5000ms fail' },
                executionTime: responseTime
            };
        } catch (error) {
            return {
                status: 'failed',
                message: `Response time test failed: ${error.message}`,
                executionTime: Date.now() - startTime
            };
        }
    }

    /**
     * Form Structure Tests
     */
    async detectFormElements(directory) {
        const startTime = Date.now();
        
        try {
            // This would normally use a headless browser or DOM parser
            // For now, we'll simulate form detection based on common patterns
            const response = await fetch(directory.submissionUrl);
            const html = await response.text();
            
            // Simple form detection using regex
            const formMatches = html.match(/<form[^>]*>/gi) || [];
            const inputMatches = html.match(/<input[^>]*>/gi) || [];
            const textareaMatches = html.match(/<textarea[^>]*>/gi) || [];
            const selectMatches = html.match(/<select[^>]*>/gi) || [];

            const totalElements = inputMatches.length + textareaMatches.length + selectMatches.length;

            return {
                status: totalElements > 0 ? 'passed' : 'failed',
                message: `Found ${formMatches.length} forms with ${totalElements} input elements`,
                details: {
                    forms: formMatches.length,
                    inputs: inputMatches.length,
                    textareas: textareaMatches.length,
                    selects: selectMatches.length,
                    totalElements
                },
                executionTime: Date.now() - startTime
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Form detection failed: ${error.message}`,
                executionTime: Date.now() - startTime
            };
        }
    }

    async validateFieldMappings(directory) {
        const startTime = Date.now();
        
        try {
            if (!directory.fieldMapping) {
                return {
                    status: 'failed',
                    message: 'No field mappings defined',
                    executionTime: Date.now() - startTime
                };
            }

            const mappings = directory.fieldMapping;
            const mappingCount = Object.keys(mappings).length;
            
            // Validate selector format
            let validSelectors = 0;
            const selectorIssues = [];

            for (const [field, selector] of Object.entries(mappings)) {
                try {
                    // Basic selector validation
                    if (selector && typeof selector === 'string' && selector.length > 0) {
                        validSelectors++;
                    } else {
                        selectorIssues.push(`${field}: Empty or invalid selector`);
                    }
                } catch (error) {
                    selectorIssues.push(`${field}: ${error.message}`);
                }
            }

            const status = validSelectors === mappingCount ? 'passed' : 'failed';
            const message = `${validSelectors}/${mappingCount} field mappings valid`;

            return {
                status,
                message,
                details: {
                    totalMappings: mappingCount,
                    validMappings: validSelectors,
                    issues: selectorIssues
                },
                executionTime: Date.now() - startTime
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Field mapping validation failed: ${error.message}`,
                executionTime: Date.now() - startTime
            };
        }
    }

    async checkRequiredFields(directory) {
        const startTime = Date.now();
        
        try {
            const commonRequiredFields = ['businessName', 'email'];
            const fieldMapping = directory.fieldMapping || {};
            const mappedFields = Object.keys(fieldMapping);
            
            const missingRequired = commonRequiredFields.filter(field => !mappedFields.includes(field));
            const hasAllRequired = missingRequired.length === 0;

            return {
                status: hasAllRequired ? 'passed' : 'warning',
                message: hasAllRequired ? 'All required fields mapped' : `Missing: ${missingRequired.join(', ')}`,
                details: {
                    requiredFields: commonRequiredFields,
                    mappedFields,
                    missingRequired
                },
                executionTime: Date.now() - startTime
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Required fields check failed: ${error.message}`,
                executionTime: Date.now() - startTime
            };
        }
    }

    /**
     * Field Selector Tests  
     */
    async validateSelectors(directory) {
        const startTime = Date.now();
        
        try {
            const fieldMapping = directory.fieldMapping || {};
            const selectors = Object.values(fieldMapping);
            const validationResults = [];

            for (const selector of selectors) {
                try {
                    // Basic CSS selector syntax validation
                    document.querySelector(selector); // This would throw if invalid syntax
                    validationResults.push({ selector, valid: true, error: null });
                } catch (error) {
                    validationResults.push({ selector, valid: false, error: error.message });
                }
            }

            const validCount = validationResults.filter(r => r.valid).length;
            const status = validCount === selectors.length ? 'passed' : 'failed';

            return {
                status,
                message: `${validCount}/${selectors.length} selectors syntactically valid`,
                details: {
                    totalSelectors: selectors.length,
                    validSelectors: validCount,
                    invalidSelectors: validationResults.filter(r => !r.valid)
                },
                executionTime: Date.now() - startTime
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Selector validation failed: ${error.message}`,
                executionTime: Date.now() - startTime
            };
        }
    }

    async testSelectorMatching(directory) {
        const startTime = Date.now();
        
        // This would require headless browser for actual testing
        // For now, simulate selector matching based on common patterns
        return {
            status: 'skipped',
            message: 'Selector matching test requires headless browser',
            details: { reason: 'Browser automation not implemented in this phase' },
            executionTime: Date.now() - startTime
        };
    }

    async checkSelectorUniqueness(directory) {
        const startTime = Date.now();
        
        try {
            const fieldMapping = directory.fieldMapping || {};
            const selectors = Object.values(fieldMapping);
            const duplicates = [];
            const seen = new Set();

            for (const selector of selectors) {
                if (seen.has(selector)) {
                    if (!duplicates.includes(selector)) {
                        duplicates.push(selector);
                    }
                } else {
                    seen.add(selector);
                }
            }

            const status = duplicates.length === 0 ? 'passed' : 'warning';
            const message = duplicates.length === 0 ? 'All selectors are unique' : `${duplicates.length} duplicate selectors found`;

            return {
                status,
                message,
                details: {
                    totalSelectors: selectors.length,
                    uniqueSelectors: seen.size,
                    duplicates
                },
                executionTime: Date.now() - startTime
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Selector uniqueness check failed: ${error.message}`,
                executionTime: Date.now() - startTime
            };
        }
    }

    /**
     * Skip Logic Tests
     */
    async detectAntiBotProtection(directory) {
        const startTime = Date.now();
        
        try {
            const response = await fetch(directory.submissionUrl);
            const html = await response.text().toLowerCase();
            
            // Check for common anti-bot indicators
            const antiBotIndicators = [
                'cloudflare',
                'captcha',
                'recaptcha',
                'bot protection',
                'checking your browser',
                'ddos protection',
                'security check'
            ];

            const foundIndicators = antiBotIndicators.filter(indicator => html.includes(indicator));
            const hasAntiBot = foundIndicators.length > 0;

            return {
                status: hasAntiBot ? 'warning' : 'passed',
                message: hasAntiBot ? `Anti-bot protection detected: ${foundIndicators.join(', ')}` : 'No anti-bot protection detected',
                details: {
                    indicators: foundIndicators,
                    configuredAsHasAntiBot: directory.hasAntiBot === true
                },
                executionTime: Date.now() - startTime
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Anti-bot detection failed: ${error.message}`,
                executionTime: Date.now() - startTime
            };
        }
    }

    async checkLoginRequirement(directory) {
        const startTime = Date.now();
        
        try {
            const response = await fetch(directory.submissionUrl);
            const html = await response.text().toLowerCase();
            
            // Check for login indicators
            const loginIndicators = [
                'sign in',
                'log in',
                'login',
                'authentication required',
                'please log in',
                'member login',
                'account required'
            ];

            const foundIndicators = loginIndicators.filter(indicator => html.includes(indicator));
            const requiresLogin = foundIndicators.length > 0;

            return {
                status: requiresLogin ? 'warning' : 'passed',
                message: requiresLogin ? `Login required detected: ${foundIndicators.join(', ')}` : 'No login requirement detected',
                details: {
                    indicators: foundIndicators,
                    configuredAsRequiresLogin: directory.requiresLogin === true
                },
                executionTime: Date.now() - startTime
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Login requirement check failed: ${error.message}`,
                executionTime: Date.now() - startTime
            };
        }
    }

    async identifyCaptcha(directory) {
        const startTime = Date.now();
        
        try {
            const response = await fetch(directory.submissionUrl);
            const html = await response.text().toLowerCase();
            
            // Check for CAPTCHA indicators
            const captchaIndicators = [
                'recaptcha',
                'captcha',
                'g-recaptcha',
                'hcaptcha',
                'are you human'
            ];

            const foundIndicators = captchaIndicators.filter(indicator => html.includes(indicator));
            const hasCaptcha = foundIndicators.length > 0;

            return {
                status: hasCaptcha ? 'warning' : 'passed',
                message: hasCaptcha ? `CAPTCHA detected: ${foundIndicators.join(', ')}` : 'No CAPTCHA detected',
                details: {
                    indicators: foundIndicators,
                    recommendation: hasCaptcha ? 'Consider skipping or manual handling' : 'Automation friendly'
                },
                executionTime: Date.now() - startTime
            };
        } catch (error) {
            return {
                status: 'error',
                message: `CAPTCHA detection failed: ${error.message}`,
                executionTime: Date.now() - startTime
            };
        }
    }

    /**
     * Success Validation Tests
     */
    async checkSubmissionFlow(directory) {
        const startTime = Date.now();
        
        // This would require form submission testing
        return {
            status: 'skipped',
            message: 'Submission flow test requires form automation',
            details: { reason: 'Form submission testing not implemented in this phase' },
            executionTime: Date.now() - startTime
        };
    }

    async validateRedirectHandling(directory) {
        const startTime = Date.now();
        
        try {
            const response = await fetch(directory.submissionUrl, {
                redirect: 'manual'
            });

            if (response.status >= 300 && response.status < 400) {
                const location = response.headers.get('location');
                return {
                    status: 'passed',
                    message: `Redirect handled: ${response.status} -> ${location}`,
                    details: { statusCode: response.status, redirectLocation: location },
                    executionTime: Date.now() - startTime
                };
            } else {
                return {
                    status: 'passed',
                    message: 'No redirects detected',
                    details: { statusCode: response.status },
                    executionTime: Date.now() - startTime
                };
            }
        } catch (error) {
            return {
                status: 'error',
                message: `Redirect handling test failed: ${error.message}`,
                executionTime: Date.now() - startTime
            };
        }
    }

    async detectConfirmationMessages(directory) {
        const startTime = Date.now();
        
        // This would require analyzing post-submission pages
        return {
            status: 'skipped',
            message: 'Confirmation detection requires post-submission analysis',
            details: { reason: 'Post-submission analysis not implemented in this phase' },
            executionTime: Date.now() - startTime
        };
    }

    /**
     * Performance Tests
     */
    async measureLoadTime(directory) {
        const startTime = Date.now();
        
        try {
            const response = await fetch(directory.submissionUrl);
            await response.text(); // Ensure full response is received
            
            const loadTime = Date.now() - startTime;
            let status = 'passed';
            let message = `Load time: ${loadTime}ms`;

            if (loadTime > 10000) {
                status = 'failed';
                message = `Very slow load: ${loadTime}ms (>10s)`;
            } else if (loadTime > 5000) {
                status = 'warning';
                message = `Slow load: ${loadTime}ms (>5s)`;
            }

            return {
                status,
                message,
                details: { loadTime, thresholds: '5s warning, 10s fail' },
                executionTime: loadTime
            };
        } catch (error) {
            return {
                status: 'failed',
                message: `Load time test failed: ${error.message}`,
                executionTime: Date.now() - startTime
            };
        }
    }

    async checkPageSize(directory) {
        const startTime = Date.now();
        
        try {
            const response = await fetch(directory.submissionUrl);
            const content = await response.text();
            const sizeInBytes = new Blob([content]).size;
            const sizeInKB = Math.round(sizeInBytes / 1024);
            const sizeInMB = Math.round(sizeInKB / 1024 * 100) / 100;

            let status = 'passed';
            let message = `Page size: ${sizeInKB}KB`;

            if (sizeInMB > 5) {
                status = 'warning';
                message = `Large page: ${sizeInMB}MB`;
            } else if (sizeInMB > 10) {
                status = 'failed';
                message = `Very large page: ${sizeInMB}MB`;
            }

            return {
                status,
                message,
                details: { 
                    bytes: sizeInBytes,
                    kilobytes: sizeInKB,
                    megabytes: sizeInMB,
                    thresholds: '5MB warning, 10MB fail'
                },
                executionTime: Date.now() - startTime
            };
        } catch (error) {
            return {
                status: 'error',
                message: `Page size check failed: ${error.message}`,
                executionTime: Date.now() - startTime
            };
        }
    }

    async validateUptime(directory) {
        const startTime = Date.now();
        
        try {
            // Simple uptime check - just verify we can connect
            const response = await fetch(directory.submissionUrl, { method: 'HEAD' });
            const isUp = response.status < 500;

            return {
                status: isUp ? 'passed' : 'failed',
                message: isUp ? 'Site is accessible' : `Server error: ${response.status}`,
                details: { statusCode: response.status, timestamp: new Date().toISOString() },
                executionTime: Date.now() - startTime
            };
        } catch (error) {
            return {
                status: 'failed',
                message: `Uptime check failed: ${error.message}`,
                executionTime: Date.now() - startTime
            };
        }
    }

    /**
     * Helper Methods
     */
    calculateDirectoryMetrics(result) {
        result.metrics.passed = 0;
        result.metrics.failed = 0;
        result.metrics.skipped = 0;

        Object.values(result.testResults).forEach(category => {
            category.tests.forEach(test => {
                switch (test.status) {
                    case 'passed':
                        result.metrics.passed++;
                        break;
                    case 'failed':
                    case 'error':
                        result.metrics.failed++;
                        break;
                    case 'skipped':
                    case 'warning':
                        result.metrics.skipped++;
                        break;
                }
            });
        });
    }

    determineCategoryStatus(tests) {
        const statuses = tests.map(t => t.status);
        if (statuses.includes('error') || statuses.includes('failed')) return 'failed';
        if (statuses.includes('warning')) return 'warning';
        if (statuses.every(s => s === 'passed')) return 'passed';
        return 'mixed';
    }

    determineOverallStatus(result) {
        if (result.skipReason) return 'skipped';
        if (result.error) return 'error';
        
        const criticalCategories = ['URL_ACCESSIBILITY', 'FIELD_SELECTORS'];
        const criticalFailed = criticalCategories.some(cat => 
            result.testResults[cat] && result.testResults[cat].status === 'failed'
        );
        
        if (criticalFailed) return 'failed';
        if (result.metrics.failed > 0) return 'failed';
        if (result.metrics.skipped > result.metrics.passed) return 'warning';
        return 'passed';
    }

    generateRecommendations(directory, result) {
        const recommendations = [];

        // URL accessibility issues
        if (result.testResults.URL_ACCESSIBILITY?.status === 'failed') {
            recommendations.push({
                priority: 'high',
                category: 'URL',
                issue: 'URL accessibility issues detected',
                action: 'Verify submission URL is correct and accessible'
            });
        }

        // Missing field mappings
        if (result.testResults.FORM_STRUCTURE?.status === 'failed') {
            recommendations.push({
                priority: 'high',
                category: 'Fields',
                issue: 'Form structure validation failed',
                action: 'Update field mappings or verify form structure'
            });
        }

        // Anti-bot protection
        if (directory.hasAntiBot !== true && 
            result.testResults.SKIP_LOGIC?.tests.some(t => t.testName === 'detectAntiBotProtection' && t.status === 'warning')) {
            recommendations.push({
                priority: 'medium',
                category: 'Configuration',
                issue: 'Anti-bot protection detected but not configured',
                action: 'Set hasAntiBot: true in directory configuration'
            });
        }

        // Performance issues
        if (result.testResults.PERFORMANCE?.status === 'warning' || result.testResults.PERFORMANCE?.status === 'failed') {
            recommendations.push({
                priority: 'low',
                category: 'Performance',
                issue: 'Performance issues detected',
                action: 'Consider lower priority or longer timeout for this directory'
            });
        }

        return recommendations;
    }

    updateMetrics(result) {
        switch (result.overallStatus) {
            case 'passed':
                this.testMetrics.passed++;
                break;
            case 'failed':
            case 'error':
                this.testMetrics.failed++;
                break;
            case 'skipped':
            case 'warning':
                this.testMetrics.skipped++;
                break;
        }
    }

    createErrorResult(directory, error) {
        return {
            directoryId: directory.id,
            directoryName: directory.name,
            url: directory.url,
            submissionUrl: directory.submissionUrl,
            overallStatus: 'error',
            error: error.message || error.toString(),
            timestamp: new Date().toISOString(),
            testResults: {},
            metrics: { totalTests: 0, passed: 0, failed: 1, skipped: 0 }
        };
    }

    /**
     * Generate comprehensive validation report
     */
    generateValidationReport() {
        const report = {
            metadata: {
                reportId: `qa-validation-${Date.now()}`,
                timestamp: new Date().toISOString(),
                totalDirectories: this.masterDirectories.length,
                executionTime: this.testMetrics.endTime - this.testMetrics.startTime
            },
            summary: {
                ...this.testMetrics,
                successRate: Math.round((this.testMetrics.passed / this.testMetrics.totalTests) * 100),
                averageExecutionTime: Math.round((this.testMetrics.endTime - this.testMetrics.startTime) / this.testMetrics.totalTests)
            },
            categories: this.generateCategorySummary(),
            priorities: this.generatePrioritySummary(),
            recommendations: this.generateGlobalRecommendations(),
            directories: Array.from(this.validationResults.values()),
            topIssues: this.identifyTopIssues()
        };

        this.logger.info('📊 Validation report generated');
        return report;
    }

    generateCategorySummary() {
        const categorySummary = {};
        
        Object.keys(this.validationCategories).forEach(categoryKey => {
            const category = this.validationCategories[categoryKey];
            categorySummary[categoryKey] = {
                name: category.name,
                priority: category.priority,
                passed: 0,
                failed: 0,
                skipped: 0,
                total: 0
            };
        });

        this.validationResults.forEach(result => {
            Object.entries(result.testResults).forEach(([categoryKey, categoryResult]) => {
                if (categorySummary[categoryKey]) {
                    categoryResult.tests.forEach(test => {
                        categorySummary[categoryKey].total++;
                        switch (test.status) {
                            case 'passed':
                                categorySummary[categoryKey].passed++;
                                break;
                            case 'failed':
                            case 'error':
                                categorySummary[categoryKey].failed++;
                                break;
                            default:
                                categorySummary[categoryKey].skipped++;
                        }
                    });
                }
            });
        });

        return categorySummary;
    }

    generatePrioritySummary() {
        const priorityGroups = { high: [], medium: [], low: [] };
        
        this.validationResults.forEach(result => {
            const directory = this.masterDirectories.find(d => d.id === result.directoryId);
            if (directory) {
                const priority = directory.priority || 'medium';
                if (priorityGroups[priority]) {
                    priorityGroups[priority].push({
                        id: result.directoryId,
                        name: result.directoryName,
                        status: result.overallStatus,
                        successRate: Math.round((result.metrics.passed / Math.max(result.metrics.totalTests, 1)) * 100)
                    });
                }
            }
        });

        return priorityGroups;
    }

    generateGlobalRecommendations() {
        const recommendations = [];
        let urlIssues = 0;
        let fieldMappingIssues = 0;
        let antiBotIssues = 0;

        this.validationResults.forEach(result => {
            if (result.testResults.URL_ACCESSIBILITY?.status === 'failed') urlIssues++;
            if (result.testResults.FORM_STRUCTURE?.status === 'failed') fieldMappingIssues++;
            if (result.recommendations.some(r => r.category === 'Configuration' && r.issue.includes('Anti-bot'))) antiBotIssues++;
        });

        if (urlIssues > 0) {
            recommendations.push({
                priority: 'high',
                issue: `${urlIssues} directories have URL accessibility issues`,
                action: 'Review and update submission URLs for failed directories',
                affectedCount: urlIssues
            });
        }

        if (fieldMappingIssues > 5) {
            recommendations.push({
                priority: 'medium',
                issue: `${fieldMappingIssues} directories have field mapping issues`,
                action: 'Consider standardizing field mapping patterns',
                affectedCount: fieldMappingIssues
            });
        }

        if (antiBotIssues > 3) {
            recommendations.push({
                priority: 'low',
                issue: `${antiBotIssues} directories need anti-bot configuration updates`,
                action: 'Update directory configurations to reflect anti-bot protections',
                affectedCount: antiBotIssues
            });
        }

        return recommendations;
    }

    identifyTopIssues() {
        const issueCount = {};
        
        this.validationResults.forEach(result => {
            result.recommendations.forEach(rec => {
                const key = `${rec.category}: ${rec.issue}`;
                issueCount[key] = (issueCount[key] || 0) + 1;
            });
        });

        return Object.entries(issueCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([issue, count]) => ({ issue, count }));
    }

    /**
     * Export validation results
     */
    async exportResults(format = 'json') {
        const report = this.generateValidationReport();
        
        switch (format.toLowerCase()) {
            case 'json':
                return JSON.stringify(report, null, 2);
            case 'csv':
                return this.convertToCSV(report);
            case 'html':
                return this.generateHTMLReport(report);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }

    convertToCSV(report) {
        const headers = [
            'Directory ID', 'Directory Name', 'Priority', 'Category', 
            'Overall Status', 'URL Accessible', 'Forms Detected', 
            'Field Mappings Valid', 'Anti-bot Protection', 'Recommendations'
        ];
        
        let csv = headers.join(',') + '\n';
        
        report.directories.forEach(dir => {
            const row = [
                dir.directoryId,
                `"${dir.directoryName}"`,
                this.masterDirectories.find(d => d.id === dir.directoryId)?.priority || 'unknown',
                this.masterDirectories.find(d => d.id === dir.directoryId)?.category || 'unknown',
                dir.overallStatus,
                dir.testResults.URL_ACCESSIBILITY?.status || 'not-tested',
                dir.testResults.FORM_STRUCTURE?.status || 'not-tested',
                dir.testResults.FIELD_SELECTORS?.status || 'not-tested',
                dir.testResults.SKIP_LOGIC?.status || 'not-tested',
                dir.recommendations.length
            ];
            csv += row.join(',') + '\n';
        });
        
        return csv;
    }

    generateHTMLReport(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Auto-Bolt QA Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .summary { background: #f5f5f5; padding: 20px; margin-bottom: 20px; }
        .status-passed { color: #4caf50; }
        .status-failed { color: #f44336; }
        .status-warning { color: #ff9800; }
        .status-skipped { color: #757575; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .recommendations { background: #fff3cd; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>🤖 Auto-Bolt QA Validation Report</h1>
    
    <div class="summary">
        <h2>📊 Summary</h2>
        <p><strong>Total Directories:</strong> ${report.summary.totalTests}</p>
        <p><strong>Passed:</strong> <span class="status-passed">${report.summary.passed}</span></p>
        <p><strong>Failed:</strong> <span class="status-failed">${report.summary.failed}</span></p>
        <p><strong>Skipped:</strong> <span class="status-skipped">${report.summary.skipped}</span></p>
        <p><strong>Success Rate:</strong> ${report.summary.successRate}%</p>
        <p><strong>Execution Time:</strong> ${Math.round(report.summary.executionTime / 1000)}s</p>
    </div>

    <h2>🎯 Top Priority Directories</h2>
    <table>
        <tr>
            <th>Directory</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Success Rate</th>
        </tr>
        ${report.priorities.high.map(dir => `
        <tr>
            <td>${dir.name}</td>
            <td>High</td>
            <td><span class="status-${dir.status}">${dir.status}</span></td>
            <td>${dir.successRate}%</td>
        </tr>
        `).join('')}
    </table>

    <h2>⚠️ Global Recommendations</h2>
    ${report.recommendations.map(rec => `
    <div class="recommendations">
        <strong>${rec.priority.toUpperCase()}:</strong> ${rec.issue}<br>
        <em>Action:</em> ${rec.action} (${rec.affectedCount} directories affected)
    </div>
    `).join('')}

    <p><em>Generated on ${new Date(report.metadata.timestamp).toLocaleString()}</em></p>
</body>
</html>`;
    }
}

/**
 * QA Logger for structured logging
 */
class QALogger {
    constructor() {
        this.logs = [];
        this.logLevel = 'INFO';
    }

    log(level, message, details = null) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            details,
            context: 'QA_VALIDATION'
        };
        
        this.logs.push(logEntry);
        
        // Console output with styling
        const colors = {
            ERROR: 'color: red; font-weight: bold;',
            WARN: 'color: orange; font-weight: bold;',
            INFO: 'color: blue;',
            DEBUG: 'color: gray;'
        };
        
        console.log(`%c[QA-${level}] ${message}`, colors[level] || '');
        if (details) {
            console.log('Details:', details);
        }
    }

    error(message, details = null) {
        this.log('ERROR', message, details);
    }

    warn(message, details = null) {
        this.log('WARN', message, details);
    }

    info(message, details = null) {
        this.log('INFO', message, details);
    }

    debug(message, details = null) {
        if (this.logLevel === 'DEBUG') {
            this.log('DEBUG', message, details);
        }
    }

    getLogsAsJSON() {
        return JSON.stringify(this.logs, null, 2);
    }

    exportLogs() {
        return {
            logs: this.logs,
            summary: {
                totalLogs: this.logs.length,
                errorCount: this.logs.filter(l => l.level === 'ERROR').length,
                warningCount: this.logs.filter(l => l.level === 'WARN').length,
                infoCount: this.logs.filter(l => l.level === 'INFO').length
            }
        };
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DirectoryQAValidator, QALogger };
} else {
    window.DirectoryQAValidator = DirectoryQAValidator;
    window.QALogger = QALogger;
}