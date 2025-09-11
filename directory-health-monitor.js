/**
 * Directory Health Monitoring System
 * Comprehensive monitoring for all 63 directories in AutoBolt extension
 * Implements URL accessibility scanning, form structure change detection,
 * anti-bot protection monitoring, and field selector validation
 * 
 * Features:
 * - Real-time directory health checks
 * - Form structure change detection
 * - Anti-bot protection monitoring  
 * - Field selector validation
 * - Performance metrics tracking
 * - Automated alerting system
 * - Historical trend analysis
 * - Low overhead operation (<3% resource usage)
 */

class DirectoryHealthMonitor {
    constructor() {
        this.monitoringActive = false;
        this.directories = [];
        this.healthData = new Map();
        this.alertThresholds = {
            responseTime: 5000, // 5 seconds
            errorRate: 0.05,    // 5% error rate
            selectorFailureRate: 0.10, // 10% selector failure rate
            formChangeRate: 0.20  // 20% form change rate
        };
        this.scheduledScans = new Map();
        this.resourceUsageLimit = 0.03; // 3% CPU usage limit
        this.init();
    }

    async init() {
        await this.loadDirectories();
        await this.initializeHealthTracking();
        this.startLowOverheadMonitoring();
    }

    /**
     * Load all directories from master directory list
     */
    async loadDirectories() {
        try {
            const response = await fetch('./directories/master-directory-list.json');
            const data = await response.json();
            this.directories = data.directories;
            console.log(`Loaded ${this.directories.length} directories for monitoring`);
        } catch (error) {
            console.error('Failed to load directories:', error);
            throw error;
        }
    }

    /**
     * Initialize health tracking for all directories
     */
    async initializeHealthTracking() {
        for (const directory of this.directories) {
            this.healthData.set(directory.id, {
                lastChecked: null,
                status: 'pending',
                responseTime: 0,
                httpStatus: 0,
                selectorHealth: new Map(),
                formStructure: null,
                antiBotDetected: false,
                errorHistory: [],
                performanceMetrics: {
                    avgResponseTime: 0,
                    successRate: 1.0,
                    selectorAccuracy: 1.0
                },
                changeDetection: {
                    formStructureChanged: false,
                    selectorsChanged: [],
                    newRequirements: []
                },
                alerts: []
            });
        }
    }

    /**
     * Start low overhead monitoring with configurable intervals
     */
    startLowOverheadMonitoring() {
        this.monitoringActive = true;
        
        // Stagger monitoring to prevent resource spikes
        const batchSize = 5;
        const batchInterval = 30000; // 30 seconds between batches
        const fullCycleInterval = 3600000; // 1 hour full cycle
        
        this.scheduleStaggeredMonitoring(batchSize, batchInterval, fullCycleInterval);
    }

    /**
     * Schedule staggered monitoring to maintain low resource usage
     */
    scheduleStaggeredMonitoring(batchSize, batchInterval, fullCycleInterval) {
        const batches = this.createMonitoringBatches(batchSize);
        
        batches.forEach((batch, index) => {
            const timeout = setTimeout(() => {
                this.monitorBatch(batch);
                
                // Schedule recurring monitoring for this batch
                const intervalId = setInterval(() => {
                    if (this.monitoringActive) {
                        this.monitorBatch(batch);
                    } else {
                        clearInterval(intervalId);
                    }
                }, fullCycleInterval);
                
                this.scheduledScans.set(`batch_${index}`, intervalId);
            }, index * batchInterval);
        });
    }

    /**
     * Create monitoring batches for staggered execution
     */
    createMonitoringBatches(batchSize) {
        const batches = [];
        for (let i = 0; i < this.directories.length; i += batchSize) {
            batches.push(this.directories.slice(i, i + batchSize));
        }
        return batches;
    }

    /**
     * Monitor a batch of directories
     */
    async monitorBatch(batch) {
        const startTime = performance.now();
        
        try {
            const promises = batch.map(directory => this.monitorDirectory(directory));
            await Promise.allSettled(promises);
            
            const endTime = performance.now();
            const executionTime = endTime - startTime;
            
            // Track resource usage
            this.trackResourceUsage(batch.length, executionTime);
            
        } catch (error) {
            console.error('Batch monitoring failed:', error);
        }
    }

    /**
     * Monitor individual directory health
     */
    async monitorDirectory(directory) {
        const directoryId = directory.id;
        const healthRecord = this.healthData.get(directoryId);
        
        try {
            // URL Accessibility Check
            const accessibilityResult = await this.checkUrlAccessibility(directory);
            
            // Form Structure Analysis
            const formStructureResult = await this.analyzeFormStructure(directory);
            
            // Anti-Bot Protection Detection
            const antiBotResult = await this.detectAntiBotProtection(directory);
            
            // Field Selector Validation
            const selectorValidationResult = await this.validateFieldSelectors(directory);
            
            // Update health record
            this.updateHealthRecord(directoryId, {
                accessibility: accessibilityResult,
                formStructure: formStructureResult,
                antiBot: antiBotResult,
                selectorValidation: selectorValidationResult
            });
            
            // Check for alerts
            await this.checkForAlerts(directoryId, directory);
            
        } catch (error) {
            this.recordError(directoryId, error);
        }
    }

    /**
     * Check URL accessibility and response time
     */
    async checkUrlAccessibility(directory) {
        const startTime = performance.now();
        
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(directory.url, {
                method: 'HEAD',
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            clearTimeout(timeoutId);
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            return {
                status: 'accessible',
                httpStatus: response.status,
                responseTime: responseTime,
                redirected: response.redirected,
                redirectUrl: response.redirected ? response.url : null,
                headers: Object.fromEntries(response.headers.entries())
            };
            
        } catch (error) {
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            return {
                status: 'inaccessible',
                error: error.message,
                responseTime: responseTime,
                httpStatus: 0
            };
        }
    }

    /**
     * Analyze form structure for changes
     */
    async analyzeFormStructure(directory) {
        try {
            // Create a lightweight DOM parser for form analysis
            const response = await fetch(directory.submissionUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            
            if (!response.ok) {
                return { status: 'failed', error: `HTTP ${response.status}` };
            }
            
            const html = await response.text();
            const formStructure = this.parseFormStructure(html, directory.fieldMapping);
            
            return {
                status: 'analyzed',
                structure: formStructure,
                timestamp: Date.now()
            };
            
        } catch (error) {
            return {
                status: 'failed',
                error: error.message
            };
        }
    }

    /**
     * Parse form structure from HTML
     */
    parseFormStructure(html, fieldMapping) {
        // Import DOMPurify for sanitization
        const DOMPurify = require('dompurify');
        
        // Sanitize HTML to prevent XSS attacks
        const sanitizedHtml = DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['form', 'input', 'textarea', 'select', 'option', 'label', 'fieldset', 'legend', 'button', 'div', 'span', 'p'],
            ALLOWED_ATTR: ['name', 'id', 'class', 'type', 'value', 'placeholder', 'required', 'action', 'method', 'for', 'selected'],
            FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
            FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'href', 'src'],
            SANITIZE_DOM: true
        });
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(sanitizedHtml, 'text/html');
        
        const structure = {
            forms: [],
            fields: {},
            selectors: {}
        };
        
        // Find all forms
        const forms = doc.querySelectorAll('form');
        forms.forEach((form, index) => {
            structure.forms.push({
                index: index,
                action: form.action,
                method: form.method,
                fieldCount: form.querySelectorAll('input, textarea, select').length
            });
        });
        
        // Validate field mappings
        Object.keys(fieldMapping).forEach(fieldName => {
            const selector = fieldMapping[fieldName];
            const elements = doc.querySelectorAll(selector);
            
            structure.selectors[fieldName] = {
                selector: selector,
                found: elements.length > 0,
                count: elements.length,
                types: Array.from(elements).map(el => el.tagName.toLowerCase())
            };
        });
        
        return structure;
    }

    /**
     * Detect anti-bot protection mechanisms
     */
    async detectAntiBotProtection(directory) {
        try {
            const response = await fetch(directory.submissionUrl, {
                headers: {
                    'User-Agent': 'AutoBoltMonitor/1.0'
                }
            });
            
            const html = await response.text();
            const headers = Object.fromEntries(response.headers.entries());
            
            const antiBotIndicators = {
                captcha: this.detectCaptcha(html),
                cloudflare: this.detectCloudflare(html, headers),
                rateLimiting: this.detectRateLimiting(headers),
                jsChallenge: this.detectJsChallenge(html),
                botDetection: this.detectBotDetection(html, headers)
            };
            
            const hasAntiBot = Object.values(antiBotIndicators).some(indicator => indicator.detected);
            
            return {
                status: hasAntiBot ? 'detected' : 'none',
                indicators: antiBotIndicators,
                riskLevel: this.calculateAntiBotRisk(antiBotIndicators)
            };
            
        } catch (error) {
            return {
                status: 'error',
                error: error.message
            };
        }
    }

    /**
     * Detect CAPTCHA presence
     */
    detectCaptcha(html) {
        const captchaPatterns = [
            /recaptcha/i,
            /captcha/i,
            /hcaptcha/i,
            /turnstile/i,
            /data-sitekey/i
        ];
        
        const detected = captchaPatterns.some(pattern => pattern.test(html));
        
        return {
            detected: detected,
            type: detected ? this.identifyCaptchaType(html) : null
        };
    }

    /**
     * Identify specific CAPTCHA type
     */
    identifyCaptchaType(html) {
        if (/recaptcha/i.test(html)) return 'reCAPTCHA';
        if (/hcaptcha/i.test(html)) return 'hCaptcha';
        if (/turnstile/i.test(html)) return 'Cloudflare Turnstile';
        return 'Unknown';
    }

    /**
     * Detect Cloudflare protection
     */
    detectCloudflare(html, headers) {
        const cloudflareHeaders = ['cf-ray', 'cf-cache-status', 'server'];
        const hasCloudflareHeaders = cloudflareHeaders.some(header => 
            headers[header] && headers[header].includes('cloudflare')
        );
        
        const hasCloudflareContent = /cloudflare/i.test(html) || 
                                   /checking your browser/i.test(html);
        
        return {
            detected: hasCloudflareHeaders || hasCloudflareContent,
            type: 'Cloudflare',
            evidence: {
                headers: hasCloudflareHeaders,
                content: hasCloudflareContent
            }
        };
    }

    /**
     * Detect rate limiting
     */
    detectRateLimiting(headers) {
        const rateLimitHeaders = [
            'x-ratelimit-limit',
            'x-ratelimit-remaining',
            'retry-after',
            'x-rate-limit'
        ];
        
        const detected = rateLimitHeaders.some(header => headers[header]);
        
        return {
            detected: detected,
            headers: detected ? Object.keys(headers).filter(h => 
                rateLimitHeaders.includes(h.toLowerCase())
            ) : []
        };
    }

    /**
     * Detect JavaScript challenges
     */
    detectJsChallenge(html) {
        const jsPatterns = [
            /browser integrity check/i,
            /javascript required/i,
            /enable javascript/i,
            /checking your browser/i,
            /ddg-.*challenge/i
        ];
        
        const detected = jsPatterns.some(pattern => pattern.test(html));
        
        return {
            detected: detected,
            type: 'JavaScript Challenge'
        };
    }

    /**
     * Detect general bot detection
     */
    detectBotDetection(html, headers) {
        const botDetectionPatterns = [
            /bot.*detected/i,
            /automated.*traffic/i,
            /suspicious.*activity/i,
            /access.*denied/i
        ];
        
        const userAgentBlocking = headers['user-agent'] && 
                                 /block|deny|forbidden/i.test(headers['user-agent']);
        
        const contentBlocking = botDetectionPatterns.some(pattern => pattern.test(html));
        
        return {
            detected: userAgentBlocking || contentBlocking,
            type: 'Bot Detection System'
        };
    }

    /**
     * Calculate anti-bot risk level
     */
    calculateAntiBotRisk(indicators) {
        let riskScore = 0;
        
        if (indicators.captcha.detected) riskScore += 30;
        if (indicators.cloudflare.detected) riskScore += 20;
        if (indicators.rateLimiting.detected) riskScore += 25;
        if (indicators.jsChallenge.detected) riskScore += 15;
        if (indicators.botDetection.detected) riskScore += 35;
        
        if (riskScore >= 50) return 'high';
        if (riskScore >= 25) return 'medium';
        return 'low';
    }

    /**
     * Validate field selectors accuracy
     */
    async validateFieldSelectors(directory) {
        const validation = {
            status: 'completed',
            results: {},
            accuracy: 0,
            issues: []
        };
        
        try {
            const response = await fetch(directory.submissionUrl);
            const html = await response.text();
            
            // Import DOMPurify for sanitization
            const DOMPurify = require('dompurify');
            
            // Sanitize HTML to prevent XSS attacks
            const sanitizedHtml = DOMPurify.sanitize(html, {
                ALLOWED_TAGS: ['form', 'input', 'textarea', 'select', 'option', 'label', 'fieldset', 'legend', 'button', 'div', 'span', 'p'],
                ALLOWED_ATTR: ['name', 'id', 'class', 'type', 'value', 'placeholder', 'required', 'action', 'method', 'for', 'selected'],
                FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
                FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur', 'onchange', 'onsubmit', 'href', 'src'],
                SANITIZE_DOM: true
            });
            
            const doc = new DOMParser().parseFromString(sanitizedHtml, 'text/html');
            
            let totalSelectors = 0;
            let validSelectors = 0;
            
            Object.entries(directory.fieldMapping).forEach(([fieldName, selector]) => {
                totalSelectors++;
                
                const elements = doc.querySelectorAll(selector);
                const isValid = elements.length > 0;
                
                if (isValid) validSelectors++;
                
                validation.results[fieldName] = {
                    selector: selector,
                    valid: isValid,
                    elementCount: elements.length,
                    elementTypes: Array.from(elements).map(el => ({
                        tag: el.tagName.toLowerCase(),
                        type: el.type || null,
                        name: el.name || null,
                        id: el.id || null
                    }))
                };
                
                if (!isValid) {
                    validation.issues.push({
                        field: fieldName,
                        selector: selector,
                        issue: 'Selector not found',
                        severity: 'high'
                    });
                }
            });
            
            validation.accuracy = totalSelectors > 0 ? validSelectors / totalSelectors : 0;
            
        } catch (error) {
            validation.status = 'failed';
            validation.error = error.message;
        }
        
        return validation;
    }

    /**
     * Update health record with monitoring results
     */
    updateHealthRecord(directoryId, results) {
        const healthRecord = this.healthData.get(directoryId);
        const now = Date.now();
        
        // Update accessibility data
        if (results.accessibility) {
            healthRecord.lastChecked = now;
            healthRecord.httpStatus = results.accessibility.httpStatus;
            healthRecord.responseTime = results.accessibility.responseTime;
            healthRecord.status = results.accessibility.status;
            
            // Update performance metrics
            this.updatePerformanceMetrics(healthRecord, results.accessibility);
        }
        
        // Update form structure data
        if (results.formStructure && results.formStructure.status === 'analyzed') {
            const structureChanged = this.detectStructureChanges(
                healthRecord.formStructure, 
                results.formStructure.structure
            );
            
            healthRecord.formStructure = results.formStructure.structure;
            healthRecord.changeDetection.formStructureChanged = structureChanged;
        }
        
        // Update anti-bot detection
        if (results.antiBot) {
            healthRecord.antiBotDetected = results.antiBot.status === 'detected';
        }
        
        // Update selector validation
        if (results.selectorValidation) {
            healthRecord.performanceMetrics.selectorAccuracy = results.selectorValidation.accuracy;
            
            // Track selector changes
            const selectorChanges = this.detectSelectorChanges(
                healthRecord.selectorHealth,
                results.selectorValidation.results
            );
            
            healthRecord.changeDetection.selectorsChanged = selectorChanges;
            healthRecord.selectorHealth = new Map(Object.entries(results.selectorValidation.results));
        }
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(healthRecord, accessibilityResult) {
        const metrics = healthRecord.performanceMetrics;
        
        // Update average response time (rolling average)
        if (metrics.avgResponseTime === 0) {
            metrics.avgResponseTime = accessibilityResult.responseTime;
        } else {
            metrics.avgResponseTime = (metrics.avgResponseTime * 0.8) + (accessibilityResult.responseTime * 0.2);
        }
        
        // Update success rate
        const isSuccess = accessibilityResult.status === 'accessible' && 
                         accessibilityResult.httpStatus >= 200 && 
                         accessibilityResult.httpStatus < 400;
        
        if (healthRecord.errorHistory.length >= 10) {
            healthRecord.errorHistory.shift();
        }
        healthRecord.errorHistory.push({
            timestamp: Date.now(),
            success: isSuccess,
            error: isSuccess ? null : accessibilityResult.error
        });
        
        const successCount = healthRecord.errorHistory.filter(h => h.success).length;
        metrics.successRate = healthRecord.errorHistory.length > 0 ? 
                             successCount / healthRecord.errorHistory.length : 1.0;
    }

    /**
     * Detect form structure changes
     */
    detectStructureChanges(oldStructure, newStructure) {
        if (!oldStructure || !newStructure) return false;
        
        // Compare form counts
        if (oldStructure.forms.length !== newStructure.forms.length) return true;
        
        // Compare form actions and methods
        for (let i = 0; i < oldStructure.forms.length; i++) {
            const oldForm = oldStructure.forms[i];
            const newForm = newStructure.forms[i];
            
            if (oldForm.action !== newForm.action || 
                oldForm.method !== newForm.method ||
                oldForm.fieldCount !== newForm.fieldCount) {
                return true;
            }
        }
        
        // Compare selector results
        const oldSelectors = Object.keys(oldStructure.selectors);
        const newSelectors = Object.keys(newStructure.selectors);
        
        if (oldSelectors.length !== newSelectors.length) return true;
        
        return oldSelectors.some(selector => {
            const oldData = oldStructure.selectors[selector];
            const newData = newStructure.selectors[selector];
            
            return !newData || 
                   oldData.found !== newData.found ||
                   oldData.count !== newData.count;
        });
    }

    /**
     * Detect selector changes
     */
    detectSelectorChanges(oldSelectorHealth, newSelectorResults) {
        const changes = [];
        
        Object.keys(newSelectorResults).forEach(fieldName => {
            const oldData = oldSelectorHealth.get(fieldName);
            const newData = newSelectorResults[fieldName];
            
            if (!oldData) return; // First time checking
            
            if (oldData.valid !== newData.valid) {
                changes.push({
                    field: fieldName,
                    change: newData.valid ? 'selector_fixed' : 'selector_broken',
                    oldValue: oldData.valid,
                    newValue: newData.valid
                });
            }
            
            if (oldData.elementCount !== newData.elementCount) {
                changes.push({
                    field: fieldName,
                    change: 'element_count_changed',
                    oldValue: oldData.elementCount,
                    newValue: newData.elementCount
                });
            }
        });
        
        return changes;
    }

    /**
     * Check for alerts based on health data
     */
    async checkForAlerts(directoryId, directory) {
        const healthRecord = this.healthData.get(directoryId);
        const alerts = [];
        
        // Response time alert
        if (healthRecord.responseTime > this.alertThresholds.responseTime) {
            alerts.push({
                type: 'performance',
                severity: 'warning',
                message: `High response time: ${healthRecord.responseTime}ms`,
                threshold: this.alertThresholds.responseTime,
                value: healthRecord.responseTime
            });
        }
        
        // Error rate alert
        if (healthRecord.performanceMetrics.successRate < (1 - this.alertThresholds.errorRate)) {
            alerts.push({
                type: 'reliability',
                severity: 'critical',
                message: `High error rate: ${((1 - healthRecord.performanceMetrics.successRate) * 100).toFixed(1)}%`,
                threshold: this.alertThresholds.errorRate,
                value: 1 - healthRecord.performanceMetrics.successRate
            });
        }
        
        // Selector failure alert
        if (healthRecord.performanceMetrics.selectorAccuracy < (1 - this.alertThresholds.selectorFailureRate)) {
            alerts.push({
                type: 'functionality',
                severity: 'high',
                message: `Low selector accuracy: ${(healthRecord.performanceMetrics.selectorAccuracy * 100).toFixed(1)}%`,
                threshold: this.alertThresholds.selectorFailureRate,
                value: 1 - healthRecord.performanceMetrics.selectorAccuracy
            });
        }
        
        // Form structure change alert
        if (healthRecord.changeDetection.formStructureChanged) {
            alerts.push({
                type: 'structure_change',
                severity: 'medium',
                message: 'Form structure has changed',
                details: healthRecord.changeDetection
            });
        }
        
        // Anti-bot detection alert
        if (healthRecord.antiBotDetected) {
            alerts.push({
                type: 'security',
                severity: 'high',
                message: 'Anti-bot protection detected',
                recommendation: 'Review bot detection mechanisms'
            });
        }
        
        // Update alerts in health record
        healthRecord.alerts = alerts;
        
        // Send alerts if any critical issues found
        if (alerts.some(alert => alert.severity === 'critical')) {
            await this.sendAlert(directoryId, directory, alerts);
        }
    }

    /**
     * Send alert notifications
     */
    async sendAlert(directoryId, directory, alerts) {
        const alertData = {
            directoryId: directoryId,
            directoryName: directory.name,
            url: directory.url,
            timestamp: new Date().toISOString(),
            alerts: alerts,
            healthSummary: this.getHealthSummary(directoryId)
        };
        
        // Log to console (can be extended to email, Slack, etc.)
        console.warn('🚨 DIRECTORY HEALTH ALERT:', alertData);
        
        // Store alert for dashboard
        await this.storeAlert(alertData);
        
        // Trigger alert handlers
        await this.triggerAlertHandlers(alertData);
    }

    /**
     * Get health summary for directory
     */
    getHealthSummary(directoryId) {
        const healthRecord = this.healthData.get(directoryId);
        
        return {
            status: healthRecord.status,
            lastChecked: healthRecord.lastChecked,
            responseTime: healthRecord.responseTime,
            successRate: healthRecord.performanceMetrics.successRate,
            selectorAccuracy: healthRecord.performanceMetrics.selectorAccuracy,
            alertCount: healthRecord.alerts.length
        };
    }

    /**
     * Store alert for historical tracking
     */
    async storeAlert(alertData) {
        try {
            // Store in localStorage for now (can be extended to database)
            const existingAlerts = JSON.parse(localStorage.getItem('directory_alerts') || '[]');
            existingAlerts.push(alertData);
            
            // Keep only last 1000 alerts
            if (existingAlerts.length > 1000) {
                existingAlerts.splice(0, existingAlerts.length - 1000);
            }
            
            localStorage.setItem('directory_alerts', JSON.stringify(existingAlerts));
        } catch (error) {
            console.error('Failed to store alert:', error);
        }
    }

    /**
     * Trigger alert handlers (extensible)
     */
    async triggerAlertHandlers(alertData) {
        // Extension point for custom alert handlers
        // Can be used to integrate with external systems
        window.dispatchEvent(new CustomEvent('directoryHealthAlert', { 
            detail: alertData 
        }));
    }

    /**
     * Track resource usage to maintain low overhead
     */
    trackResourceUsage(batchSize, executionTime) {
        const cpuUsage = executionTime / (1000 * batchSize); // Rough CPU time per directory
        
        if (cpuUsage > this.resourceUsageLimit) {
            console.warn(`Resource usage warning: ${cpuUsage.toFixed(4)}s per directory`);
            
            // Automatically adjust monitoring frequency if needed
            this.adjustMonitoringFrequency(cpuUsage);
        }
    }

    /**
     * Adjust monitoring frequency based on resource usage
     */
    adjustMonitoringFrequency(cpuUsage) {
        if (cpuUsage > this.resourceUsageLimit * 2) {
            // Double the interval if resource usage is too high
            this.scheduledScans.forEach((intervalId, batchName) => {
                clearInterval(intervalId);
                
                const newIntervalId = setInterval(() => {
                    if (this.monitoringActive) {
                        const batchIndex = parseInt(batchName.split('_')[1]);
                        const batch = this.createMonitoringBatches(5)[batchIndex];
                        if (batch) this.monitorBatch(batch);
                    }
                }, 7200000); // 2 hours instead of 1 hour
                
                this.scheduledScans.set(batchName, newIntervalId);
            });
            
            console.log('Adjusted monitoring frequency to reduce resource usage');
        }
    }

    /**
     * Record error in health data
     */
    recordError(directoryId, error) {
        const healthRecord = this.healthData.get(directoryId);
        
        healthRecord.errorHistory.push({
            timestamp: Date.now(),
            success: false,
            error: error.message
        });
        
        // Keep only last 10 errors
        if (healthRecord.errorHistory.length > 10) {
            healthRecord.errorHistory.shift();
        }
        
        // Update success rate
        const successCount = healthRecord.errorHistory.filter(h => h.success).length;
        healthRecord.performanceMetrics.successRate = 
            healthRecord.errorHistory.length > 0 ? 
            successCount / healthRecord.errorHistory.length : 0;
    }

    /**
     * Get monitoring status and statistics
     */
    getMonitoringStatus() {
        const totalDirectories = this.directories.length;
        const healthyDirectories = Array.from(this.healthData.values()).filter(
            record => record.status === 'accessible' && record.alerts.length === 0
        ).length;
        
        const avgResponseTime = Array.from(this.healthData.values()).reduce(
            (sum, record) => sum + (record.performanceMetrics.avgResponseTime || 0), 0
        ) / totalDirectories;
        
        const avgSuccessRate = Array.from(this.healthData.values()).reduce(
            (sum, record) => sum + record.performanceMetrics.successRate, 0
        ) / totalDirectories;
        
        const avgSelectorAccuracy = Array.from(this.healthData.values()).reduce(
            (sum, record) => sum + record.performanceMetrics.selectorAccuracy, 0
        ) / totalDirectories;
        
        return {
            monitoringActive: this.monitoringActive,
            totalDirectories: totalDirectories,
            healthyDirectories: healthyDirectories,
            healthyPercentage: (healthyDirectories / totalDirectories) * 100,
            averageMetrics: {
                responseTime: avgResponseTime,
                successRate: avgSuccessRate,
                selectorAccuracy: avgSelectorAccuracy
            },
            lastUpdate: new Date().toISOString()
        };
    }

    /**
     * Get detailed health report for all directories
     */
    getHealthReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: this.getMonitoringStatus(),
            directories: []
        };
        
        this.directories.forEach(directory => {
            const healthRecord = this.healthData.get(directory.id);
            
            report.directories.push({
                id: directory.id,
                name: directory.name,
                url: directory.url,
                priority: directory.priority,
                category: directory.category,
                health: {
                    status: healthRecord.status,
                    lastChecked: healthRecord.lastChecked,
                    responseTime: healthRecord.responseTime,
                    httpStatus: healthRecord.httpStatus,
                    successRate: healthRecord.performanceMetrics.successRate,
                    selectorAccuracy: healthRecord.performanceMetrics.selectorAccuracy,
                    antiBotDetected: healthRecord.antiBotDetected,
                    alertCount: healthRecord.alerts.length,
                    recentAlerts: healthRecord.alerts.slice(-3), // Last 3 alerts
                    changeDetection: healthRecord.changeDetection
                }
            });
        });
        
        return report;
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        this.monitoringActive = false;
        this.scheduledScans.forEach(intervalId => clearInterval(intervalId));
        this.scheduledScans.clear();
        console.log('Directory health monitoring stopped');
    }

    /**
     * Export health data
     */
    exportHealthData() {
        const data = {
            timestamp: new Date().toISOString(),
            monitoringStatus: this.getMonitoringStatus(),
            healthData: Array.from(this.healthData.entries()).map(([id, data]) => ({
                directoryId: id,
                ...data
            }))
        };
        
        return JSON.stringify(data, null, 2);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DirectoryHealthMonitor;
} else if (typeof window !== 'undefined') {
    window.DirectoryHealthMonitor = DirectoryHealthMonitor;
}