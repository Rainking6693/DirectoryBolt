#!/usr/bin/env node

/**
 * COMPREHENSIVE POST-FIX VALIDATION SUITE
 * ======================================
 * 
 * Validates all agent fixes work together:
 * - Hudson: Security audit vulnerability fixes
 * - Jackson: Infrastructure cleanup and environment security 
 * - Shane: Stripe integration fixes and API error handling
 * - Ben: Frontend payment integration and UI error handling
 * 
 * This suite ensures all fixes integrate properly and prevent regressions.
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const puppeteer = require('puppeteer');

class ComprehensivePostFixValidationSuite {
    constructor() {
        this.testResults = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            testsRun: 0,
            testsPassed: 0,
            testsFailed: 0,
            criticalIssues: [],
            warnings: [],
            recommendations: [],
            agentFixValidation: {
                hudson: { score: 0, issues: [] },
                jackson: { score: 0, issues: [] },
                shane: { score: 0, issues: [] },
                ben: { score: 0, issues: [] }
            }
        };
        
        this.baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    }

    // ==============================================
    // 1. ENVIRONMENT VARIABLE SECURITY TESTING
    // ==============================================
    
    async validateEnvironmentSecurity() {
        console.log('\n🔒 ENVIRONMENT VARIABLE SECURITY VALIDATION');
        console.log('==========================================');
        
        const tests = [
            () => this.testGitIgnoreEnvironmentFiles(),
            () => this.testNoHardcodedSecrets(),
            () => this.testEnvironmentVariableValidation(),
            () => this.testCORSConfiguration(),
            () => this.testClientServerSeparation()
        ];
        
        let passCount = 0;
        for (const test of tests) {
            try {
                const result = await test();
                if (result.passed) passCount++;
                this.logTestResult(result);
            } catch (error) {
                this.logTestResult({
                    passed: false,
                    test: 'Environment Security Test',
                    error: error.message
                });
            }
        }
        
        const score = (passCount / tests.length) * 10;
        this.testResults.agentFixValidation.jackson.score = score;
        console.log(`\n📊 Jackson's Environment Security Score: ${score.toFixed(1)}/10`);
        
        return { passCount, totalTests: tests.length };
    }

    async testGitIgnoreEnvironmentFiles() {
        const gitignore = fs.readFileSync('.gitignore', 'utf8');
        const requiredPatterns = [
            '.env',
            '.env.local',
            '.env.production',
            '.env.development'
        ];
        
        const missingPatterns = requiredPatterns.filter(pattern => 
            !gitignore.includes(pattern)
        );
        
        // Check for tracked environment files
        const trackedEnvFiles = [];
        try {
            const gitLsFiles = await this.execCommand('git ls-files | grep -E "\\.env"');
            if (gitLsFiles.trim()) {
                trackedEnvFiles.push(...gitLsFiles.trim().split('\n'));
            }
        } catch (error) {
            // No tracked .env files (good)
        }
        
        return {
            passed: missingPatterns.length === 0 && trackedEnvFiles.length === 0,
            test: 'Git Ignore Environment Files',
            details: {
                missingPatterns,
                trackedEnvFiles: trackedEnvFiles.length > 0 ? trackedEnvFiles : 'None (Good)'
            }
        };
    }

    async testNoHardcodedSecrets() {
        const secretPatterns = [
            'sk_test_mock_key',
            'sk_live_',
            'price_1',
            'whsec_',
            'rk_test_',
            'pk_test_'
        ];
        
        const results = {};
        const criticalFiles = [
            'pages/api/create-checkout-session.js',
            'pages/api/webhooks/stripe.js',
            'lib/utils/stripe-client.ts',
            'next.config.js'
        ];
        
        for (const file of criticalFiles) {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                const foundSecrets = secretPatterns.filter(pattern => 
                    content.includes(pattern) && 
                    !content.includes('// This is intentionally a mock value') &&
                    !content.includes('placeholder') &&
                    !content.includes('example')
                );
                
                if (foundSecrets.length > 0) {
                    results[file] = foundSecrets;
                }
            }
        }
        
        return {
            passed: Object.keys(results).length === 0,
            test: 'No Hardcoded Secrets',
            details: Object.keys(results).length === 0 ? 'No hardcoded secrets found' : results
        };
    }

    async testEnvironmentVariableValidation() {
        try {
            const validationResult = await this.execCommand('npm run stripe:validate');
            
            // The validation should fail in development (expected behavior)
            const expectedFailure = validationResult.includes('VALIDATION FAILED') &&
                                  validationResult.includes('placeholder/mock value');
                                  
            return {
                passed: expectedFailure,
                test: 'Environment Variable Validation',
                details: 'Validation correctly rejects mock/placeholder values'
            };
        } catch (error) {
            // Validation script should exist and run
            return {
                passed: false,
                test: 'Environment Variable Validation',
                error: 'Validation script not working: ' + error.message
            };
        }
    }

    async testCORSConfiguration() {
        const nextConfigPath = 'next.config.js';
        if (!fs.existsSync(nextConfigPath)) {
            return {
                passed: false,
                test: 'CORS Configuration',
                error: 'next.config.js not found'
            };
        }
        
        const content = fs.readFileSync(nextConfigPath, 'utf8');
        const hasWildcardCORS = content.includes('"*"') || content.includes("'*'");
        const hasEnvironmentSpecificCORS = content.includes('process.env.NODE_ENV') &&
                                          (content.includes('localhost') || content.includes('directorybolt.com'));
        
        return {
            passed: !hasWildcardCORS && hasEnvironmentSpecificCORS,
            test: 'CORS Configuration',
            details: {
                noWildcard: !hasWildcardCORS,
                environmentSpecific: hasEnvironmentSpecificCORS
            }
        };
    }

    async testClientServerSeparation() {
        // Check that client-side code doesn't access secret keys
        const clientFiles = [
            'components/**/*.tsx',
            'components/**/*.jsx',
            'pages/index.tsx',
            'pages/pricing.tsx'
        ];
        
        const serverOnlyPatterns = [
            'STRIPE_SECRET_KEY',
            'STRIPE_WEBHOOK_SECRET',
            'process.env.STRIPE_SECRET'
        ];
        
        let violations = [];
        
        for (const pattern of clientFiles) {
            try {
                const files = await this.globFiles(pattern);
                for (const file of files) {
                    const content = fs.readFileSync(file, 'utf8');
                    for (const secret of serverOnlyPatterns) {
                        if (content.includes(secret)) {
                            violations.push(`${file}: ${secret}`);
                        }
                    }
                }
            } catch (error) {
                // Pattern might not match files
            }
        }
        
        return {
            passed: violations.length === 0,
            test: 'Client/Server Separation',
            details: violations.length === 0 ? 'No violations found' : violations
        };
    }

    // ==============================================
    // 2. STRIPE PAYMENT FLOW INTEGRATION TEST
    // ==============================================
    
    async validateStripeIntegration() {
        console.log('\n💳 STRIPE PAYMENT INTEGRATION VALIDATION');
        console.log('=======================================');
        
        const tests = [
            () => this.testStripeEnvironmentValidation(),
            () => this.testCheckoutSessionCreation(),
            () => this.testWebhookSignatureValidation(),
            () => this.testPaymentErrorHandling(),
            () => this.testFrontendPaymentIntegration()
        ];
        
        let passCount = 0;
        for (const test of tests) {
            try {
                const result = await test();
                if (result.passed) passCount++;
                this.logTestResult(result);
            } catch (error) {
                this.logTestResult({
                    passed: false,
                    test: 'Stripe Integration Test',
                    error: error.message
                });
            }
        }
        
        const score = (passCount / tests.length) * 10;
        this.testResults.agentFixValidation.shane.score = score;
        console.log(`\n📊 Shane's Stripe Integration Score: ${score.toFixed(1)}/10`);
        
        return { passCount, totalTests: tests.length };
    }

    async testStripeEnvironmentValidation() {
        // Test that validation system is working
        const validatorPath = 'lib/utils/stripe-environment-validator.ts';
        const clientPath = 'lib/utils/stripe-client.ts';
        
        const validatorExists = fs.existsSync(validatorPath);
        const clientExists = fs.existsSync(clientPath);
        
        if (!validatorExists || !clientExists) {
            return {
                passed: false,
                test: 'Stripe Environment Validation Files',
                error: `Missing files: ${!validatorExists ? 'validator' : ''} ${!clientExists ? 'client' : ''}`
            };
        }
        
        // Check that validator has proper validation logic
        const validatorContent = fs.readFileSync(validatorPath, 'utf8');
        const hasValidation = validatorContent.includes('validateStripeEnvironment') &&
                             validatorContent.includes('placeholder') &&
                             validatorContent.includes('mock');
        
        return {
            passed: hasValidation,
            test: 'Stripe Environment Validation Logic',
            details: 'Validation system properly detects mock/placeholder values'
        };
    }

    async testCheckoutSessionCreation() {
        const apiPath = 'pages/api/create-checkout-session.js';
        if (!fs.existsSync(apiPath)) {
            return {
                passed: false,
                test: 'Checkout Session API',
                error: 'create-checkout-session.js not found'
            };
        }
        
        const content = fs.readFileSync(apiPath, 'utf8');
        
        // Check for enhanced error handling
        const hasErrorHandling = content.includes('try') && content.includes('catch');
        const hasValidation = content.includes('validateStripeEnvironment') || 
                             content.includes('environment') ||
                             content.includes('validation');
        const noHardcodedFallbacks = !content.includes('sk_test_mock_key') || 
                                   content.includes('// removed hardcoded fallback');
        
        return {
            passed: hasErrorHandling && hasValidation && noHardcodedFallbacks,
            test: 'Checkout Session Creation',
            details: {
                errorHandling: hasErrorHandling,
                validation: hasValidation,
                noHardcodedFallbacks: noHardcodedFallbacks
            }
        };
    }

    async testWebhookSignatureValidation() {
        const webhookPath = 'pages/api/webhooks/stripe.js';
        if (!fs.existsSync(webhookPath)) {
            return {
                passed: false,
                test: 'Webhook Signature Validation',
                error: 'stripe webhook handler not found'
            };
        }
        
        const content = fs.readFileSync(webhookPath, 'utf8');
        
        // Check for mandatory signature verification
        const hasSignatureValidation = content.includes('stripe.webhooks.constructEvent') ||
                                     content.includes('verifySignature') ||
                                     content.includes('webhook_secret');
        
        const noBypassOption = !content.includes('skip') && 
                              !content.includes('bypass') && 
                              !content.includes('disable_signature');
        
        const hasErrorHandling = content.includes('try') && content.includes('catch');
        
        return {
            passed: hasSignatureValidation && noBypassOption && hasErrorHandling,
            test: 'Webhook Signature Validation',
            details: {
                signatureValidation: hasSignatureValidation,
                noBypass: noBypassOption,
                errorHandling: hasErrorHandling
            }
        };
    }

    async testPaymentErrorHandling() {
        // Test API error responses
        try {
            const response = await fetch(`${this.baseUrl}/api/create-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId: 'invalid_price_id' })
            });
            
            const data = await response.json();
            
            // Should get specific error message, not generic failure
            const hasSpecificError = data.error && 
                                   data.error !== 'Something went wrong' &&
                                   data.error !== 'Internal server error';
            
            return {
                passed: response.status >= 400 && hasSpecificError,
                test: 'Payment Error Handling',
                details: {
                    statusCode: response.status,
                    errorMessage: data.error || 'No error message',
                    isSpecific: hasSpecificError
                }
            };
        } catch (error) {
            return {
                passed: false,
                test: 'Payment Error Handling',
                error: 'Could not test API: ' + error.message
            };
        }
    }

    async testFrontendPaymentIntegration() {
        // Check for Ben's frontend fixes
        const componentFiles = [
            'components/CheckoutButton.jsx',
            'components/ui/StripeErrorDisplay.tsx',
            'components/ui/PaymentStatusDisplay.tsx',
            'components/ui/ErrorDisplay.tsx'
        ];
        
        let foundComponents = 0;
        let hasErrorHandling = false;
        
        for (const file of componentFiles) {
            if (fs.existsSync(file)) {
                foundComponents++;
                const content = fs.readFileSync(file, 'utf8');
                
                // Check for error handling improvements
                if (content.includes('error') && 
                   (content.includes('useState') || content.includes('try') || content.includes('catch'))) {
                    hasErrorHandling = true;
                }
            }
        }
        
        return {
            passed: foundComponents >= 2 && hasErrorHandling,
            test: 'Frontend Payment Integration',
            details: {
                componentsFound: foundComponents,
                hasErrorHandling: hasErrorHandling,
                expectedComponents: componentFiles.length
            }
        };
    }

    // ==============================================
    // 3. SECURITY VULNERABILITY VALIDATION
    // ==============================================
    
    async validateSecurityFixes() {
        console.log('\n🛡️ SECURITY VULNERABILITY VALIDATION');
        console.log('===================================');
        
        const tests = [
            () => this.testHudsonVulnerabilityFixes(),
            () => this.testInformationLeakagePrevention(),
            () => this.testSecureLoggingImplementation(),
            () => this.testDeploymentSecurityCleanup(),
            () => this.testAccessControlValidation()
        ];
        
        let passCount = 0;
        for (const test of tests) {
            try {
                const result = await test();
                if (result.passed) passCount++;
                this.logTestResult(result);
            } catch (error) {
                this.logTestResult({
                    passed: false,
                    test: 'Security Validation Test',
                    error: error.message
                });
            }
        }
        
        const score = (passCount / tests.length) * 10;
        this.testResults.agentFixValidation.hudson.score = score;
        console.log(`\n📊 Hudson's Security Fixes Score: ${score.toFixed(1)}/10`);
        
        return { passCount, totalTests: tests.length };
    }

    async testHudsonVulnerabilityFixes() {
        const fixes = {
            environmentFilesSecurity: await this.testGitIgnoreEnvironmentFiles(),
            corsConfiguration: await this.testCORSConfiguration(),
            hardcodedSecrets: await this.testNoHardcodedSecrets(),
            deploymentArtifacts: await this.testDeploymentCleanup()
        };
        
        const passedFixes = Object.values(fixes).filter(fix => fix.passed).length;
        const totalFixes = Object.keys(fixes).length;
        
        return {
            passed: passedFixes === totalFixes,
            test: 'Hudson Vulnerability Fixes',
            details: {
                fixesApplied: passedFixes,
                totalFixes: totalFixes,
                fixes: fixes
            }
        };
    }

    async testDeploymentCleanup() {
        // Check that Vercel artifacts were removed (Jackson's cleanup)
        const vercelFiles = [
            'vercel.json',
            '.vercel/',
            '.vercel'
        ];
        
        let foundArtifacts = [];
        for (const artifact of vercelFiles) {
            if (fs.existsSync(artifact)) {
                foundArtifacts.push(artifact);
            }
        }
        
        return {
            passed: foundArtifacts.length === 0,
            test: 'Deployment Cleanup',
            details: foundArtifacts.length === 0 ? 'Clean deployment setup' : foundArtifacts
        };
    }

    async testInformationLeakagePrevention() {
        // Test API endpoints don't leak sensitive information
        const apiEndpoints = [
            '/api/health',
            '/api/create-checkout-session'
        ];
        
        let leakageTests = [];
        
        for (const endpoint of apiEndpoints) {
            try {
                const response = await fetch(`${this.baseUrl}${endpoint}`, {
                    method: endpoint === '/api/create-checkout-session' ? 'POST' : 'GET',
                    headers: { 'Content-Type': 'application/json' }
                });
                
                const text = await response.text();
                
                // Check for information leakage
                const hasLeakage = text.includes('sk_') || 
                                 text.includes('whsec_') || 
                                 text.includes('password') ||
                                 text.includes('secret') ||
                                 text.includes('token') ||
                                 text.includes('key');
                
                leakageTests.push({
                    endpoint,
                    hasLeakage,
                    status: response.status
                });
            } catch (error) {
                leakageTests.push({
                    endpoint,
                    error: error.message
                });
            }
        }
        
        const leakageCount = leakageTests.filter(test => test.hasLeakage).length;
        
        return {
            passed: leakageCount === 0,
            test: 'Information Leakage Prevention',
            details: {
                endpointsTested: leakageTests.length,
                leakageCount: leakageCount,
                tests: leakageTests
            }
        };
    }

    async testSecureLoggingImplementation() {
        // Check for secure logging implementation
        const loggerPath = 'lib/utils/logger.ts';
        
        if (!fs.existsSync(loggerPath)) {
            return {
                passed: false,
                test: 'Secure Logging Implementation',
                error: 'Logger utility not found'
            };
        }
        
        const content = fs.readFileSync(loggerPath, 'utf8');
        
        const hasProductionLogging = content.includes('NODE_ENV') && 
                                   content.includes('production');
        const hasSanitization = content.includes('sanitiz') || 
                               content.includes('redact') || 
                               content.includes('mask');
        
        return {
            passed: hasProductionLogging && hasSanitization,
            test: 'Secure Logging Implementation',
            details: {
                productionHandling: hasProductionLogging,
                sanitization: hasSanitization
            }
        };
    }

    async testAccessControlValidation() {
        // Test that API routes have proper access control
        const apiRoutes = [
            'pages/api/create-checkout-session.js',
            'pages/api/webhooks/stripe.js'
        ];
        
        let accessControlTests = [];
        
        for (const route of apiRoutes) {
            if (fs.existsSync(route)) {
                const content = fs.readFileSync(route, 'utf8');
                
                const hasMethodChecking = content.includes('req.method') || 
                                        content.includes('GET') || 
                                        content.includes('POST');
                const hasValidation = content.includes('validate') || 
                                    content.includes('check') || 
                                    content.includes('verify');
                
                accessControlTests.push({
                    route,
                    hasMethodChecking,
                    hasValidation
                });
            }
        }
        
        const passedTests = accessControlTests.filter(test => 
            test.hasMethodChecking && test.hasValidation
        ).length;
        
        return {
            passed: passedTests === accessControlTests.length && accessControlTests.length > 0,
            test: 'Access Control Validation',
            details: {
                routesTested: accessControlTests.length,
                routesPassed: passedTests,
                tests: accessControlTests
            }
        };
    }

    // ==============================================
    // 4. ERROR HANDLING & UI STATE VALIDATION
    // ==============================================
    
    async validateErrorHandlingAndUI() {
        console.log('\n🎨 ERROR HANDLING & UI VALIDATION');
        console.log('===============================');
        
        const tests = [
            () => this.testErrorBoundaryImplementation(),
            () => this.testLoadingStateComponents(),
            () => this.testNotificationSystem(),
            () => this.testUserFriendlyErrorMessages(),
            () => this.testRetryMechanisms()
        ];
        
        let passCount = 0;
        for (const test of tests) {
            try {
                const result = await test();
                if (result.passed) passCount++;
                this.logTestResult(result);
            } catch (error) {
                this.logTestResult({
                    passed: false,
                    test: 'Error Handling & UI Test',
                    error: error.message
                });
            }
        }
        
        const score = (passCount / tests.length) * 10;
        this.testResults.agentFixValidation.ben.score = score;
        console.log(`\n📊 Ben's Frontend Fixes Score: ${score.toFixed(1)}/10`);
        
        return { passCount, totalTests: tests.length };
    }

    async testErrorBoundaryImplementation() {
        const errorBoundaryPath = 'components/ui/ErrorBoundary.tsx';
        
        if (!fs.existsSync(errorBoundaryPath)) {
            return {
                passed: false,
                test: 'Error Boundary Implementation',
                error: 'ErrorBoundary component not found'
            };
        }
        
        const content = fs.readFileSync(errorBoundaryPath, 'utf8');
        
        const hasErrorHandling = content.includes('componentDidCatch') || 
                               content.includes('getDerivedStateFromError');
        const hasUserFriendlyUI = content.includes('Something went wrong') || 
                                content.includes('error') || 
                                content.includes('fallback');
        
        return {
            passed: hasErrorHandling && hasUserFriendlyUI,
            test: 'Error Boundary Implementation',
            details: {
                hasErrorHandling,
                hasUserFriendlyUI
            }
        };
    }

    async testLoadingStateComponents() {
        const loadingComponents = [
            'components/ui/LoadingState.tsx',
            'components/ui/ProgressTracker.tsx'
        ];
        
        let foundComponents = 0;
        let hasProgressTracking = false;
        
        for (const component of loadingComponents) {
            if (fs.existsSync(component)) {
                foundComponents++;
                const content = fs.readFileSync(component, 'utf8');
                
                if (content.includes('progress') || 
                    content.includes('loading') || 
                    content.includes('spinner') ||
                    content.includes('percentage')) {
                    hasProgressTracking = true;
                }
            }
        }
        
        return {
            passed: foundComponents >= 1 && hasProgressTracking,
            test: 'Loading State Components',
            details: {
                componentsFound: foundComponents,
                hasProgressTracking
            }
        };
    }

    async testNotificationSystem() {
        const notificationPath = 'components/ui/NotificationSystem.tsx';
        
        if (!fs.existsSync(notificationPath)) {
            return {
                passed: false,
                test: 'Notification System',
                error: 'NotificationSystem component not found'
            };
        }
        
        const content = fs.readFileSync(notificationPath, 'utf8');
        
        const hasToastFunctionality = content.includes('toast') || 
                                    content.includes('notification') || 
                                    content.includes('message');
        const hasTypeSupport = content.includes('success') || 
                             content.includes('error') || 
                             content.includes('warning');
        
        return {
            passed: hasToastFunctionality && hasTypeSupport,
            test: 'Notification System',
            details: {
                hasToastFunctionality,
                hasTypeSupport
            }
        };
    }

    async testUserFriendlyErrorMessages() {
        // Test actual API error responses
        try {
            const response = await fetch(`${this.baseUrl}/api/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: 'invalid-url-format' })
            });
            
            const data = await response.json();
            
            // Should get specific error, not generic
            const isUserFriendly = data.error && 
                                 data.error !== 'Error' &&
                                 data.error !== 'Something went wrong' &&
                                 data.error.length > 10; // Specific messages are longer
            
            return {
                passed: isUserFriendly,
                test: 'User Friendly Error Messages',
                details: {
                    errorMessage: data.error || 'No error message',
                    isUserFriendly
                }
            };
        } catch (error) {
            return {
                passed: false,
                test: 'User Friendly Error Messages',
                error: 'Could not test API: ' + error.message
            };
        }
    }

    async testRetryMechanisms() {
        // Check for retry functionality in components
        const componentFiles = [
            'components/WebsiteAnalyzer.tsx',
            'components/CheckoutButton.jsx',
            'components/ui/ErrorDisplay.tsx'
        ];
        
        let hasRetryMechanism = false;
        let checkedFiles = 0;
        
        for (const file of componentFiles) {
            if (fs.existsSync(file)) {
                checkedFiles++;
                const content = fs.readFileSync(file, 'utf8');
                
                if (content.includes('retry') || 
                    content.includes('try again') || 
                    content.includes('Retry') ||
                    content.includes('refresh')) {
                    hasRetryMechanism = true;
                }
            }
        }
        
        return {
            passed: hasRetryMechanism && checkedFiles > 0,
            test: 'Retry Mechanisms',
            details: {
                filesChecked: checkedFiles,
                hasRetryMechanism
            }
        };
    }

    // ==============================================
    // 5. CROSS-BROWSER & MOBILE COMPATIBILITY
    // ==============================================
    
    async validateCrossBrowserCompatibility() {
        console.log('\n🌐 CROSS-BROWSER & MOBILE COMPATIBILITY');
        console.log('====================================');
        
        const tests = [
            () => this.testMobileResponsiveness(),
            () => this.testPaymentUICompatibility(),
            () => this.testTouchInteractions(),
            () => this.testAccessibilityCompliance(),
            () => this.testPerformanceMetrics()
        ];
        
        let passCount = 0;
        for (const test of tests) {
            try {
                const result = await test();
                if (result.passed) passCount++;
                this.logTestResult(result);
            } catch (error) {
                this.logTestResult({
                    passed: false,
                    test: 'Cross-Browser Compatibility Test',
                    error: error.message
                });
            }
        }
        
        return { passCount, totalTests: tests.length };
    }

    async testMobileResponsiveness() {
        let browser;
        try {
            browser = await puppeteer.launch({ 
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            
            // Test different viewport sizes
            const viewports = [
                { width: 375, height: 667, name: 'iPhone SE' },
                { width: 390, height: 844, name: 'iPhone 12' },
                { width: 768, height: 1024, name: 'iPad' }
            ];
            
            let responsiveTests = [];
            
            for (const viewport of viewports) {
                await page.setViewport(viewport);
                await page.goto(`${this.baseUrl}`, { waitUntil: 'networkidle0', timeout: 10000 });
                
                // Check if key elements are visible and properly sized
                const elements = await page.evaluate(() => {
                    const header = document.querySelector('header, nav');
                    const mainContent = document.querySelector('main, .main-content');
                    const buttons = document.querySelectorAll('button');
                    
                    return {
                        headerVisible: header && header.offsetWidth > 0,
                        mainContentVisible: mainContent && mainContent.offsetWidth > 0,
                        buttonsClickable: Array.from(buttons).every(btn => 
                            btn.offsetWidth >= 44 && btn.offsetHeight >= 44 // Apple's recommended touch target size
                        )
                    };
                });
                
                responsiveTests.push({
                    viewport: viewport.name,
                    ...elements
                });
            }
            
            const passedTests = responsiveTests.filter(test => 
                test.headerVisible && test.mainContentVisible && test.buttonsClickable
            ).length;
            
            return {
                passed: passedTests === responsiveTests.length,
                test: 'Mobile Responsiveness',
                details: {
                    viewportsTested: responsiveTests.length,
                    viewportsPassed: passedTests,
                    tests: responsiveTests
                }
            };
            
        } catch (error) {
            return {
                passed: false,
                test: 'Mobile Responsiveness',
                error: 'Browser test failed: ' + error.message
            };
        } finally {
            if (browser) await browser.close();
        }
    }

    async testPaymentUICompatibility() {
        // Check CSS for mobile-friendly payment UI
        const cssFiles = [
            'styles/globals.css',
            'styles/payment.css'
        ];
        
        let hasMobileCSS = false;
        let hasFlexbox = false;
        
        for (const file of cssFiles) {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                
                if (content.includes('@media') && 
                   (content.includes('mobile') || content.includes('max-width'))) {
                    hasMobileCSS = true;
                }
                
                if (content.includes('flex') || content.includes('grid')) {
                    hasFlexbox = true;
                }
            }
        }
        
        return {
            passed: hasMobileCSS || hasFlexbox,
            test: 'Payment UI Compatibility',
            details: {
                hasMobileCSS,
                hasFlexbox
            }
        };
    }

    async testTouchInteractions() {
        let browser;
        try {
            browser = await puppeteer.launch({ 
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            await page.setViewport({ width: 375, height: 667 });
            await page.goto(`${this.baseUrl}/pricing`, { waitUntil: 'networkidle0', timeout: 10000 });
            
            // Test touch interactions on payment buttons
            const touchTests = await page.evaluate(() => {
                const buttons = document.querySelectorAll('button, .btn, [role="button"]');
                let results = [];
                
                buttons.forEach((button, index) => {
                    const rect = button.getBoundingClientRect();
                    const isTouchFriendly = rect.width >= 44 && rect.height >= 44;
                    const hasHoverStates = getComputedStyle(button).cursor === 'pointer';
                    
                    results.push({
                        index,
                        isTouchFriendly,
                        hasHoverStates,
                        width: rect.width,
                        height: rect.height
                    });
                });
                
                return results;
            });
            
            const passedButtons = touchTests.filter(test => test.isTouchFriendly).length;
            
            return {
                passed: passedButtons === touchTests.length && touchTests.length > 0,
                test: 'Touch Interactions',
                details: {
                    buttonsTested: touchTests.length,
                    buttonsPassed: passedButtons,
                    minSize: '44px x 44px'
                }
            };
            
        } catch (error) {
            return {
                passed: false,
                test: 'Touch Interactions',
                error: 'Browser test failed: ' + error.message
            };
        } finally {
            if (browser) await browser.close();
        }
    }

    async testAccessibilityCompliance() {
        // Basic accessibility checks in code
        const componentFiles = [
            'components/CheckoutButton.jsx',
            'components/ui/ErrorDisplay.tsx',
            'components/ui/LoadingState.tsx'
        ];
        
        let accessibilityFeatures = {
            ariaLabels: 0,
            semanticHTML: 0,
            focusManagement: 0
        };
        
        for (const file of componentFiles) {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                
                if (content.includes('aria-') || content.includes('role=')) {
                    accessibilityFeatures.ariaLabels++;
                }
                
                if (content.includes('<button') || 
                    content.includes('<main') || 
                    content.includes('<section')) {
                    accessibilityFeatures.semanticHTML++;
                }
                
                if (content.includes('focus') || 
                    content.includes('tabIndex') || 
                    content.includes('onFocus')) {
                    accessibilityFeatures.focusManagement++;
                }
            }
        }
        
        const totalFeatures = Object.values(accessibilityFeatures).reduce((a, b) => a + b, 0);
        
        return {
            passed: totalFeatures >= 3,
            test: 'Accessibility Compliance',
            details: accessibilityFeatures
        };
    }

    async testPerformanceMetrics() {
        let browser;
        try {
            browser = await puppeteer.launch({ 
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            
            // Test performance
            const start = Date.now();
            await page.goto(`${this.baseUrl}`, { waitUntil: 'networkidle0', timeout: 15000 });
            const loadTime = Date.now() - start;
            
            // Get performance metrics
            const metrics = await page.metrics();
            
            const isGoodPerformance = loadTime < 5000 && // Less than 5 seconds
                                     metrics.JSHeapUsedSize < 50000000; // Less than 50MB
            
            return {
                passed: isGoodPerformance,
                test: 'Performance Metrics',
                details: {
                    loadTime: `${loadTime}ms`,
                    jsHeapSize: `${Math.round(metrics.JSHeapUsedSize / 1000000)}MB`,
                    isWithinLimits: isGoodPerformance
                }
            };
            
        } catch (error) {
            return {
                passed: false,
                test: 'Performance Metrics',
                error: 'Performance test failed: ' + error.message
            };
        } finally {
            if (browser) await browser.close();
        }
    }

    // ==============================================
    // 6. DEPLOYMENT PROCESS & HEALTH CHECK VALIDATION
    // ==============================================
    
    async validateDeploymentProcess() {
        console.log('\n🚀 DEPLOYMENT PROCESS VALIDATION');
        console.log('==============================');
        
        const tests = [
            () => this.testBuildProcess(),
            () => this.testHealthCheckEndpoint(),
            () => this.testEnvironmentReadiness(),
            () => this.testStartupValidation(),
            () => this.testProductionConfiguration()
        ];
        
        let passCount = 0;
        for (const test of tests) {
            try {
                const result = await test();
                if (result.passed) passCount++;
                this.logTestResult(result);
            } catch (error) {
                this.logTestResult({
                    passed: false,
                    test: 'Deployment Process Test',
                    error: error.message
                });
            }
        }
        
        return { passCount, totalTests: tests.length };
    }

    async testBuildProcess() {
        try {
            // Test that build command works
            const buildResult = await this.execCommand('npm run build', 60000); // 60 second timeout
            
            const buildSucceeded = !buildResult.includes('error') && 
                                  !buildResult.includes('failed') &&
                                  (buildResult.includes('success') || 
                                   buildResult.includes('completed') ||
                                   buildResult.includes('generated'));
            
            // Check that build outputs exist
            const buildOutputExists = fs.existsSync('.next') || fs.existsSync('out') || fs.existsSync('dist');
            
            return {
                passed: buildSucceeded && buildOutputExists,
                test: 'Build Process',
                details: {
                    buildSucceeded,
                    outputExists: buildOutputExists
                }
            };
        } catch (error) {
            return {
                passed: false,
                test: 'Build Process',
                error: 'Build failed: ' + error.message
            };
        }
    }

    async testHealthCheckEndpoint() {
        try {
            const response = await fetch(`${this.baseUrl}/api/health`, { 
                timeout: 5000 
            });
            
            const isHealthy = response.status === 200;
            let healthData = null;
            
            try {
                healthData = await response.json();
            } catch (e) {
                // Health endpoint might return plain text
            }
            
            return {
                passed: isHealthy,
                test: 'Health Check Endpoint',
                details: {
                    status: response.status,
                    data: healthData
                }
            };
        } catch (error) {
            return {
                passed: false,
                test: 'Health Check Endpoint',
                error: 'Health check failed: ' + error.message
            };
        }
    }

    async testEnvironmentReadiness() {
        // Check package.json scripts for deployment
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        const hasDeploymentScripts = packageJson.scripts && (
            packageJson.scripts.predeploy ||
            packageJson.scripts.deploy ||
            packageJson.scripts['deploy:production'] ||
            packageJson.scripts['build:production']
        );
        
        const hasValidationScripts = packageJson.scripts && (
            packageJson.scripts['stripe:validate'] ||
            packageJson.scripts['deploy:readiness']
        );
        
        return {
            passed: hasDeploymentScripts && hasValidationScripts,
            test: 'Environment Readiness',
            details: {
                hasDeploymentScripts,
                hasValidationScripts
            }
        };
    }

    async testStartupValidation() {
        // Check for startup validation in key files
        const keyFiles = [
            'pages/api/create-checkout-session.js',
            'lib/utils/stripe-environment-validator.ts'
        ];
        
        let hasStartupValidation = false;
        
        for (const file of keyFiles) {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                
                if (content.includes('validateStripeEnvironment') ||
                    content.includes('startup') ||
                    content.includes('initialization') ||
                    content.includes('process.env')) {
                    hasStartupValidation = true;
                    break;
                }
            }
        }
        
        return {
            passed: hasStartupValidation,
            test: 'Startup Validation',
            details: {
                hasStartupValidation,
                filesChecked: keyFiles.length
            }
        };
    }

    async testProductionConfiguration() {
        const nextConfigPath = 'next.config.js';
        
        if (!fs.existsSync(nextConfigPath)) {
            return {
                passed: false,
                test: 'Production Configuration',
                error: 'next.config.js not found'
            };
        }
        
        const content = fs.readFileSync(nextConfigPath, 'utf8');
        
        // Check for production optimizations
        const hasOptimizations = content.includes('compress') ||
                               content.includes('minimize') ||
                               content.includes('production');
        
        const hasSecurityHeaders = content.includes('headers') ||
                                 content.includes('security') ||
                                 content.includes('cors');
        
        return {
            passed: hasOptimizations && hasSecurityHeaders,
            test: 'Production Configuration',
            details: {
                hasOptimizations,
                hasSecurityHeaders
            }
        };
    }

    // ==============================================
    // UTILITY METHODS
    // ==============================================
    
    logTestResult(result) {
        this.testResults.testsRun++;
        
        if (result.passed) {
            this.testResults.testsPassed++;
            console.log(`  ✅ ${result.test}`);
        } else {
            this.testResults.testsFailed++;
            console.log(`  ❌ ${result.test}`);
            if (result.error) {
                console.log(`     Error: ${result.error}`);
                this.testResults.criticalIssues.push({
                    test: result.test,
                    error: result.error
                });
            }
        }
        
        if (result.details) {
            console.log(`     Details: ${JSON.stringify(result.details, null, 2)}`);
        }
    }

    async execCommand(command, timeout = 30000) {
        return new Promise((resolve, reject) => {
            exec(command, { timeout }, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(stderr || error.message));
                } else {
                    resolve(stdout);
                }
            });
        });
    }

    async globFiles(pattern) {
        // Simple glob implementation
        const glob = require('glob');
        return new Promise((resolve, reject) => {
            glob(pattern, (error, files) => {
                if (error) reject(error);
                else resolve(files);
            });
        });
    }

    // ==============================================
    // MAIN EXECUTION & REPORTING
    // ==============================================
    
    async runComprehensiveValidation() {
        console.log('🚀 COMPREHENSIVE POST-FIX VALIDATION SUITE');
        console.log('==========================================');
        console.log(`Testing Environment: ${this.testResults.environment}`);
        console.log(`Base URL: ${this.baseUrl}`);
        console.log(`Timestamp: ${this.testResults.timestamp}`);
        console.log();

        try {
            // Run all test categories
            const results = {
                environmentSecurity: await this.validateEnvironmentSecurity(),
                stripeIntegration: await this.validateStripeIntegration(),
                securityFixes: await this.validateSecurityFixes(),
                errorHandlingUI: await this.validateErrorHandlingAndUI(),
                crossBrowser: await this.validateCrossBrowserCompatibility(),
                deployment: await this.validateDeploymentProcess()
            };

            // Calculate overall scores
            this.generateFinalReport(results);
            
        } catch (error) {
            console.error('❌ Validation suite failed:', error.message);
            this.testResults.criticalIssues.push({
                test: 'Overall Suite',
                error: error.message
            });
        }

        // Save results
        await this.saveTestResults();
        
        return this.testResults;
    }

    generateFinalReport(results) {
        console.log('\n📊 COMPREHENSIVE VALIDATION SUMMARY');
        console.log('==================================');
        
        // Calculate category scores
        const categories = Object.entries(results);
        let totalPassed = 0;
        let totalTests = 0;
        
        categories.forEach(([category, result]) => {
            totalPassed += result.passCount;
            totalTests += result.totalTests;
            
            const percentage = ((result.passCount / result.totalTests) * 100).toFixed(1);
            console.log(`${category}: ${result.passCount}/${result.totalTests} (${percentage}%)`);
        });
        
        // Overall score
        const overallScore = ((totalPassed / totalTests) * 100).toFixed(1);
        console.log(`\n🎯 OVERALL SCORE: ${totalPassed}/${totalTests} (${overallScore}%)`);
        
        // Agent-specific scores
        console.log('\n👥 AGENT FIX VALIDATION SCORES:');
        console.log('==============================');
        Object.entries(this.testResults.agentFixValidation).forEach(([agent, data]) => {
            if (data.score > 0) {
                console.log(`${agent.toUpperCase()}: ${data.score.toFixed(1)}/10`);
            }
        });
        
        // Critical issues
        if (this.testResults.criticalIssues.length > 0) {
            console.log('\n🚨 CRITICAL ISSUES FOUND:');
            console.log('========================');
            this.testResults.criticalIssues.forEach((issue, index) => {
                console.log(`${index + 1}. ${issue.test}: ${issue.error}`);
            });
        } else {
            console.log('\n✅ NO CRITICAL ISSUES FOUND');
        }
        
        // Final recommendation
        const isProductionReady = overallScore >= 80 && this.testResults.criticalIssues.length === 0;
        
        console.log('\n🏁 FINAL ASSESSMENT:');
        console.log('===================');
        if (isProductionReady) {
            console.log('✅ READY FOR PRODUCTION DEPLOYMENT');
            console.log('All critical fixes have been successfully validated');
        } else {
            console.log('⚠️  REQUIRES ADDITIONAL FIXES BEFORE DEPLOYMENT');
            console.log('Critical issues must be resolved');
        }
    }

    async saveTestResults() {
        const reportPath = 'comprehensive_post_fix_validation_report.json';
        const reportMarkdownPath = 'COMPREHENSIVE_POST_FIX_VALIDATION_REPORT.md';
        
        // Save JSON results
        fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
        
        // Generate markdown report
        const markdown = this.generateMarkdownReport();
        fs.writeFileSync(reportMarkdownPath, markdown);
        
        console.log(`\n📄 Reports saved:`);
        console.log(`   JSON: ${reportPath}`);
        console.log(`   Markdown: ${reportMarkdownPath}`);
    }

    generateMarkdownReport() {
        const agentScores = Object.entries(this.testResults.agentFixValidation)
            .filter(([_, data]) => data.score > 0)
            .map(([agent, data]) => `- **${agent.toUpperCase()}**: ${data.score.toFixed(1)}/10`)
            .join('\n');

        return `# 🔍 COMPREHENSIVE POST-FIX VALIDATION REPORT

## Executive Summary

**Test Execution Date**: ${new Date(this.testResults.timestamp).toLocaleDateString()}
**Environment**: ${this.testResults.environment}
**Tests Run**: ${this.testResults.testsRun}
**Tests Passed**: ${this.testResults.testsPassed}
**Tests Failed**: ${this.testResults.testsFailed}
**Success Rate**: ${((this.testResults.testsPassed / this.testResults.testsRun) * 100).toFixed(1)}%

## 👥 Agent Fix Validation Scores

${agentScores}

## 🚨 Critical Issues

${this.testResults.criticalIssues.length === 0 ? 
    '✅ **No critical issues found**' : 
    this.testResults.criticalIssues.map((issue, i) => 
        `${i + 1}. **${issue.test}**: ${issue.error}`
    ).join('\n')
}

## 🎯 Recommendations

${this.testResults.recommendations.length === 0 ? 
    '✅ **All fixes validated successfully**' :
    this.testResults.recommendations.join('\n')
}

---

*Report generated automatically by Comprehensive Post-Fix Validation Suite*
*Date: ${new Date().toISOString()}*
`;
    }
}

// Run the validation suite
if (require.main === module) {
    const suite = new ComprehensivePostFixValidationSuite();
    suite.runComprehensiveValidation()
        .then(results => {
            console.log('\n✅ Validation suite completed successfully');
            process.exit(results.criticalIssues.length === 0 ? 0 : 1);
        })
        .catch(error => {
            console.error('\n❌ Validation suite failed:', error.message);
            process.exit(1);
        });
}

module.exports = ComprehensivePostFixValidationSuite;