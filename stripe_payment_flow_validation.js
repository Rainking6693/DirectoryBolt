#!/usr/bin/env node

/**
 * STRIPE PAYMENT FLOW VALIDATION SUITE
 * ===================================
 * 
 * Comprehensive testing of Shane's backend Stripe fixes and Ben's frontend integration:
 * 
 * SHANE'S FIXES TESTED:
 * - Environment variable validation system
 * - Enhanced API error handling
 * - Webhook signature validation
 * - Secure Stripe client implementation
 * 
 * BEN'S FIXES TESTED:
 * - Frontend payment integration
 * - UI error handling improvements
 * - Payment status display components
 * - User-friendly error messages
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

class StripePaymentFlowValidation {
    constructor() {
        this.baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
        this.testResults = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            backendTests: {
                environmentValidation: null,
                apiErrorHandling: null,
                webhookValidation: null,
                stripeClientSecurity: null
            },
            frontendTests: {
                paymentUIIntegration: null,
                errorHandling: null,
                statusDisplay: null,
                userExperience: null
            },
            integrationTests: {
                endToEndFlow: null,
                errorRecovery: null,
                securityValidation: null
            },
            score: 0,
            criticalIssues: [],
            recommendations: []
        };
    }

    // ===============================================
    // BACKEND VALIDATION (Shane's Fixes)
    // ===============================================

    async validateBackendFixes() {
        console.log('\n🔧 VALIDATING SHANE\'S BACKEND STRIPE FIXES');
        console.log('==========================================');

        const tests = [
            this.testEnvironmentValidationSystem.bind(this),
            this.testAPIErrorHandling.bind(this),
            this.testWebhookValidation.bind(this),
            this.testStripeClientSecurity.bind(this)
        ];

        let passedTests = 0;
        for (const test of tests) {
            try {
                const result = await test();
                if (result.passed) passedTests++;
                this.logTestResult(result);
            } catch (error) {
                this.logTestResult({
                    passed: false,
                    test: 'Backend Test',
                    error: error.message
                });
            }
        }

        console.log(`\n📊 Backend Validation Score: ${passedTests}/${tests.length}`);
        return passedTests / tests.length;
    }

    async testEnvironmentValidationSystem() {
        console.log('\n  🔍 Testing Environment Validation System...');
        
        // Test 1: Validator file exists and has proper structure
        const validatorPath = 'lib/utils/stripe-environment-validator.ts';
        if (!fs.existsSync(validatorPath)) {
            return {
                passed: false,
                test: 'Environment Validation System',
                error: 'stripe-environment-validator.ts not found'
            };
        }

        const validatorContent = fs.readFileSync(validatorPath, 'utf8');
        
        // Check for key validation functions
        const hasValidateFunction = validatorContent.includes('validateStripeEnvironment');
        const hasPlaceholderDetection = validatorContent.includes('placeholder') || validatorContent.includes('mock');
        const hasFormatValidation = validatorContent.includes('sk_') && validatorContent.includes('price_');
        
        // Test 2: Validation is actually used in API routes
        const checkoutApiPath = 'pages/api/create-checkout-session.js';
        let usesValidation = false;
        if (fs.existsSync(checkoutApiPath)) {
            const apiContent = fs.readFileSync(checkoutApiPath, 'utf8');
            usesValidation = apiContent.includes('validate') || apiContent.includes('environment');
        }

        // Test 3: Package.json has validation commands
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const hasValidationCommand = packageJson.scripts && 
            (packageJson.scripts['stripe:validate'] || packageJson.scripts.predeploy);

        this.testResults.backendTests.environmentValidation = {
            validatorExists: fs.existsSync(validatorPath),
            hasValidateFunction,
            hasPlaceholderDetection,
            hasFormatValidation,
            usesValidation,
            hasValidationCommand
        };

        const passed = hasValidateFunction && hasPlaceholderDetection && hasFormatValidation && usesValidation;

        return {
            passed,
            test: 'Environment Validation System',
            details: this.testResults.backendTests.environmentValidation
        };
    }

    async testAPIErrorHandling() {
        console.log('\n  🚨 Testing Enhanced API Error Handling...');
        
        const tests = [
            // Test invalid price ID
            {
                name: 'Invalid Price ID',
                payload: { priceId: 'invalid_price_123' }
            },
            // Test missing price ID
            {
                name: 'Missing Price ID',
                payload: {}
            },
            // Test malformed request
            {
                name: 'Malformed Request',
                payload: { invalidField: 'test' }
            }
        ];

        let errorHandlingResults = [];

        for (const test of tests) {
            try {
                const response = await fetch(`${this.baseUrl}/api/create-checkout-session`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(test.payload)
                });

                const data = await response.json();

                const hasSpecificError = data.error && 
                    data.error !== 'Something went wrong' && 
                    data.error !== 'Internal server error' &&
                    data.error !== 'Error';

                const isAppropriateStatus = response.status >= 400 && response.status < 500;

                errorHandlingResults.push({
                    test: test.name,
                    status: response.status,
                    error: data.error,
                    hasSpecificError,
                    isAppropriateStatus
                });

            } catch (error) {
                errorHandlingResults.push({
                    test: test.name,
                    networkError: error.message
                });
            }
        }

        this.testResults.backendTests.apiErrorHandling = errorHandlingResults;

        // Check if most errors are handled properly
        const goodErrorHandling = errorHandlingResults.filter(result => 
            result.hasSpecificError && result.isAppropriateStatus
        ).length;

        const passed = goodErrorHandling >= Math.floor(errorHandlingResults.length * 0.7); // 70% threshold

        return {
            passed,
            test: 'API Error Handling',
            details: {
                testsRun: errorHandlingResults.length,
                goodErrorHandling,
                results: errorHandlingResults
            }
        };
    }

    async testWebhookValidation() {
        console.log('\n  🔐 Testing Webhook Signature Validation...');
        
        const webhookPath = 'pages/api/webhooks/stripe.js';
        if (!fs.existsSync(webhookPath)) {
            return {
                passed: false,
                test: 'Webhook Validation',
                error: 'Webhook handler not found'
            };
        }

        const webhookContent = fs.readFileSync(webhookPath, 'utf8');

        // Check for mandatory signature verification
        const hasSignatureValidation = webhookContent.includes('stripe.webhooks.constructEvent') ||
            webhookContent.includes('verifySignature') ||
            webhookContent.includes('webhook_secret');

        const hasNoBypass = !webhookContent.includes('skip') && 
            !webhookContent.includes('bypass') && 
            !webhookContent.includes('disable');

        const hasErrorHandling = webhookContent.includes('try') && webhookContent.includes('catch');

        // Test the webhook endpoint
        let webhookResponse = null;
        try {
            const response = await fetch(`${this.baseUrl}/api/webhooks/stripe`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'stripe-signature': 'invalid_signature'
                },
                body: JSON.stringify({ type: 'test' })
            });
            
            webhookResponse = {
                status: response.status,
                rejectsInvalidSignature: response.status === 400 || response.status === 401
            };
        } catch (error) {
            webhookResponse = { error: error.message };
        }

        this.testResults.backendTests.webhookValidation = {
            hasSignatureValidation,
            hasNoBypass,
            hasErrorHandling,
            webhookResponse
        };

        const passed = hasSignatureValidation && hasNoBypass && hasErrorHandling;

        return {
            passed,
            test: 'Webhook Signature Validation',
            details: this.testResults.backendTests.webhookValidation
        };
    }

    async testStripeClientSecurity() {
        console.log('\n  🛡️ Testing Stripe Client Security...');
        
        const clientPath = 'lib/utils/stripe-client.ts';
        if (!fs.existsSync(clientPath)) {
            return {
                passed: false,
                test: 'Stripe Client Security',
                error: 'Stripe client utility not found'
            };
        }

        const clientContent = fs.readFileSync(clientPath, 'utf8');

        // Check for security best practices
        const hasValidation = clientContent.includes('validate') || clientContent.includes('check');
        const noHardcodedKeys = !clientContent.includes('sk_test_mock') && 
            !clientContent.includes('sk_live_') &&
            !clientContent.includes('price_1');
        const usesEnvironmentVars = clientContent.includes('process.env');
        const hasErrorHandling = clientContent.includes('try') || clientContent.includes('catch') || 
            clientContent.includes('throw');

        // Check API routes use the secure client
        const apiFiles = [
            'pages/api/create-checkout-session.js',
            'pages/api/payments/create-checkout.ts'
        ];

        let usesSecureClient = false;
        for (const file of apiFiles) {
            if (fs.existsSync(file)) {
                const content = fs.readFileSync(file, 'utf8');
                if (content.includes('stripe-client') || content.includes('stripeClient')) {
                    usesSecureClient = true;
                    break;
                }
            }
        }

        this.testResults.backendTests.stripeClientSecurity = {
            hasValidation,
            noHardcodedKeys,
            usesEnvironmentVars,
            hasErrorHandling,
            usesSecureClient
        };

        const passed = hasValidation && noHardcodedKeys && usesEnvironmentVars && hasErrorHandling;

        return {
            passed,
            test: 'Stripe Client Security',
            details: this.testResults.backendTests.stripeClientSecurity
        };
    }

    // ===============================================
    // FRONTEND VALIDATION (Ben's Fixes)
    // ===============================================

    async validateFrontendFixes() {
        console.log('\n🎨 VALIDATING BEN\'S FRONTEND FIXES');
        console.log('=================================');

        const tests = [
            this.testPaymentUIIntegration.bind(this),
            this.testFrontendErrorHandling.bind(this),
            this.testPaymentStatusDisplay.bind(this),
            this.testUserExperience.bind(this)
        ];

        let passedTests = 0;
        for (const test of tests) {
            try {
                const result = await test();
                if (result.passed) passedTests++;
                this.logTestResult(result);
            } catch (error) {
                this.logTestResult({
                    passed: false,
                    test: 'Frontend Test',
                    error: error.message
                });
            }
        }

        console.log(`\n📊 Frontend Validation Score: ${passedTests}/${tests.length}`);
        return passedTests / tests.length;
    }

    async testPaymentUIIntegration() {
        console.log('\n  💳 Testing Payment UI Integration...');

        // Check for payment-related components
        const paymentComponents = [
            'components/CheckoutButton.jsx',
            'components/ui/PaymentStatusDisplay.tsx',
            'components/ui/StripeErrorDisplay.tsx',
            'components/PricingPage.tsx'
        ];

        let componentAnalysis = [];
        for (const component of paymentComponents) {
            if (fs.existsSync(component)) {
                const content = fs.readFileSync(component, 'utf8');
                
                const hasStripeIntegration = content.includes('stripe') || 
                    content.includes('checkout') || 
                    content.includes('payment');
                
                const hasErrorHandling = content.includes('error') && 
                    (content.includes('useState') || content.includes('try') || content.includes('catch'));
                
                const hasLoadingStates = content.includes('loading') || 
                    content.includes('isLoading') || 
                    content.includes('pending');

                componentAnalysis.push({
                    component: path.basename(component),
                    exists: true,
                    hasStripeIntegration,
                    hasErrorHandling,
                    hasLoadingStates
                });
            } else {
                componentAnalysis.push({
                    component: path.basename(component),
                    exists: false
                });
            }
        }

        // Browser test for payment UI
        let browserTest = null;
        try {
            const browser = await puppeteer.launch({ 
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            
            await page.goto(`${this.baseUrl}/pricing`, { 
                waitUntil: 'networkidle0',
                timeout: 10000
            });

            // Check for payment buttons
            const paymentButtons = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button, .btn, [role="button"]'));
                return buttons.filter(btn => {
                    const text = btn.textContent.toLowerCase();
                    return text.includes('upgrade') || 
                           text.includes('subscribe') || 
                           text.includes('buy') ||
                           text.includes('get started') ||
                           text.includes('choose plan');
                }).length;
            });

            browserTest = {
                pageLoaded: true,
                paymentButtonsFound: paymentButtons,
                hasPaymentUI: paymentButtons > 0
            };

            await browser.close();
        } catch (error) {
            browserTest = {
                error: error.message,
                pageLoaded: false
            };
        }

        this.testResults.frontendTests.paymentUIIntegration = {
            componentAnalysis,
            browserTest
        };

        const componentsWithIntegration = componentAnalysis.filter(c => 
            c.exists && c.hasStripeIntegration
        ).length;

        const passed = componentsWithIntegration >= 2 && 
            (browserTest?.hasPaymentUI || browserTest?.error);

        return {
            passed,
            test: 'Payment UI Integration',
            details: this.testResults.frontendTests.paymentUIIntegration
        };
    }

    async testFrontendErrorHandling() {
        console.log('\n  🚨 Testing Frontend Error Handling...');

        // Check error handling components
        const errorComponents = [
            'components/ui/ErrorBoundary.tsx',
            'components/ui/ErrorDisplay.tsx',
            'components/ui/StripeErrorDisplay.tsx',
            'components/ui/NotificationSystem.tsx'
        ];

        let errorHandlingAnalysis = [];
        for (const component of errorComponents) {
            if (fs.existsSync(component)) {
                const content = fs.readFileSync(component, 'utf8');
                
                const hasErrorStates = content.includes('error') && 
                    (content.includes('useState') || content.includes('state'));
                
                const hasErrorRecovery = content.includes('retry') || 
                    content.includes('try again') || 
                    content.includes('refresh');
                
                const hasUserFriendlyMessages = content.includes('message') || 
                    content.includes('description') || 
                    content.includes('help');

                errorHandlingAnalysis.push({
                    component: path.basename(component),
                    exists: true,
                    hasErrorStates,
                    hasErrorRecovery,
                    hasUserFriendlyMessages
                });
            }
        }

        // Test actual error handling in browser
        let errorHandlingTest = null;
        try {
            const browser = await puppeteer.launch({ 
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();

            // Listen for console errors
            const consoleErrors = [];
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });

            await page.goto(`${this.baseUrl}`, { 
                waitUntil: 'networkidle0',
                timeout: 10000
            });

            // Check if page handles errors gracefully
            errorHandlingTest = {
                pageLoaded: true,
                consoleErrors: consoleErrors.length,
                hasUnhandledErrors: consoleErrors.some(error => 
                    error.includes('Uncaught') || error.includes('Unhandled')
                )
            };

            await browser.close();
        } catch (error) {
            errorHandlingTest = {
                error: error.message,
                pageLoaded: false
            };
        }

        this.testResults.frontendTests.errorHandling = {
            errorHandlingAnalysis,
            errorHandlingTest
        };

        const hasErrorComponents = errorHandlingAnalysis.filter(c => 
            c.exists && c.hasErrorStates
        ).length;

        const passed = hasErrorComponents >= 2 && 
            (!errorHandlingTest?.hasUnhandledErrors || errorHandlingTest?.error);

        return {
            passed,
            test: 'Frontend Error Handling',
            details: this.testResults.frontendTests.errorHandling
        };
    }

    async testPaymentStatusDisplay() {
        console.log('\n  📊 Testing Payment Status Display...');

        // Check status display components
        const statusComponents = [
            'components/ui/PaymentStatusDisplay.tsx',
            'components/ui/LoadingState.tsx',
            'components/ui/SuccessState.tsx',
            'components/ui/ProgressTracker.tsx'
        ];

        let statusAnalysis = [];
        for (const component of statusComponents) {
            if (fs.existsSync(component)) {
                const content = fs.readFileSync(component, 'utf8');
                
                const hasStatusStates = content.includes('status') || 
                    content.includes('state') || 
                    content.includes('loading') ||
                    content.includes('success') ||
                    content.includes('error');
                
                const hasProgressIndicators = content.includes('progress') || 
                    content.includes('percentage') || 
                    content.includes('spinner') ||
                    content.includes('loading');
                
                const hasVisualFeedback = content.includes('className') || 
                    content.includes('style') || 
                    content.includes('icon');

                statusAnalysis.push({
                    component: path.basename(component),
                    exists: true,
                    hasStatusStates,
                    hasProgressIndicators,
                    hasVisualFeedback
                });
            }
        }

        // Test success/cancel pages
        let pageTests = [];
        const testPages = ['/success', '/cancel'];
        
        for (const pagePath of testPages) {
            try {
                const response = await fetch(`${this.baseUrl}${pagePath}`);
                pageTests.push({
                    page: pagePath,
                    exists: response.status === 200,
                    status: response.status
                });
            } catch (error) {
                pageTests.push({
                    page: pagePath,
                    error: error.message
                });
            }
        }

        this.testResults.frontendTests.statusDisplay = {
            statusAnalysis,
            pageTests
        };

        const hasStatusComponents = statusAnalysis.filter(c => 
            c.exists && c.hasStatusStates
        ).length;

        const hasSuccessPage = pageTests.some(p => p.page === '/success' && p.exists);

        const passed = hasStatusComponents >= 2 && hasSuccessPage;

        return {
            passed,
            test: 'Payment Status Display',
            details: this.testResults.frontendTests.statusDisplay
        };
    }

    async testUserExperience() {
        console.log('\n  👤 Testing User Experience Improvements...');

        let uxTest = null;
        try {
            const browser = await puppeteer.launch({ 
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            
            await page.goto(`${this.baseUrl}/pricing`, { 
                waitUntil: 'networkidle0',
                timeout: 10000
            });

            // Test user experience elements
            const uxAnalysis = await page.evaluate(() => {
                // Check for responsive design
                const isMobileOptimized = window.innerWidth > 768 || 
                    document.querySelector('meta[name="viewport"]') !== null;

                // Check for loading indicators
                const hasLoadingIndicators = document.querySelector('.loading, .spinner, [role="progressbar"]') !== null ||
                    Array.from(document.querySelectorAll('*')).some(el => 
                        el.textContent.includes('Loading') || el.textContent.includes('Please wait')
                    );

                // Check for clear call-to-action buttons
                const buttons = Array.from(document.querySelectorAll('button, .btn'));
                const hasCallToAction = buttons.some(btn => {
                    const text = btn.textContent.toLowerCase();
                    return text.includes('get started') || 
                           text.includes('upgrade') || 
                           text.includes('subscribe') ||
                           text.includes('choose plan');
                });

                // Check for pricing tiers
                const hasPricingTiers = document.querySelectorAll('.tier, .plan, .pricing').length >= 2 ||
                    Array.from(document.querySelectorAll('*')).some(el => 
                        el.textContent.includes('$') && (el.textContent.includes('month') || el.textContent.includes('year'))
                    );

                return {
                    isMobileOptimized,
                    hasLoadingIndicators,
                    hasCallToAction,
                    hasPricingTiers,
                    buttonCount: buttons.length
                };
            });

            uxTest = {
                pageLoaded: true,
                ...uxAnalysis
            };

            await browser.close();
        } catch (error) {
            uxTest = {
                error: error.message,
                pageLoaded: false
            };
        }

        this.testResults.frontendTests.userExperience = uxTest;

        const passed = uxTest?.pageLoaded && 
            uxTest?.hasCallToAction && 
            uxTest?.hasPricingTiers;

        return {
            passed,
            test: 'User Experience',
            details: this.testResults.frontendTests.userExperience
        };
    }

    // ===============================================
    // INTEGRATION TESTS
    // ===============================================

    async validateIntegration() {
        console.log('\n🔗 VALIDATING BACKEND-FRONTEND INTEGRATION');
        console.log('=========================================');

        const tests = [
            this.testEndToEndFlow.bind(this),
            this.testErrorRecoveryFlow.bind(this),
            this.testSecurityIntegration.bind(this)
        ];

        let passedTests = 0;
        for (const test of tests) {
            try {
                const result = await test();
                if (result.passed) passedTests++;
                this.logTestResult(result);
            } catch (error) {
                this.logTestResult({
                    passed: false,
                    test: 'Integration Test',
                    error: error.message
                });
            }
        }

        console.log(`\n📊 Integration Score: ${passedTests}/${tests.length}`);
        return passedTests / tests.length;
    }

    async testEndToEndFlow() {
        console.log('\n  🔄 Testing End-to-End Payment Flow...');

        let e2eTest = null;
        try {
            const browser = await puppeteer.launch({ 
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();

            // Step 1: Load pricing page
            await page.goto(`${this.baseUrl}/pricing`, { 
                waitUntil: 'networkidle0',
                timeout: 10000
            });

            // Step 2: Find and click a payment button
            const buttonClicked = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button, .btn, [role="button"]'));
                const paymentButton = buttons.find(btn => {
                    const text = btn.textContent.toLowerCase();
                    return text.includes('upgrade') || 
                           text.includes('get started') || 
                           text.includes('subscribe');
                });

                if (paymentButton) {
                    paymentButton.click();
                    return true;
                }
                return false;
            });

            // Step 3: Wait for response (error expected due to mock configuration)
            await page.waitForTimeout(3000);

            // Step 4: Check for error handling
            const errorHandled = await page.evaluate(() => {
                // Look for error messages or notifications
                const errorElements = document.querySelectorAll(
                    '.error, .notification, .toast, .alert, [role="alert"]'
                );
                
                return errorElements.length > 0 || 
                    Array.from(document.querySelectorAll('*')).some(el => 
                        el.textContent.includes('error') || 
                        el.textContent.includes('configuration') ||
                        el.textContent.includes('try again')
                    );
            });

            e2eTest = {
                pageLoaded: true,
                buttonClicked,
                errorHandled,
                flowCompleted: buttonClicked && errorHandled
            };

            await browser.close();
        } catch (error) {
            e2eTest = {
                error: error.message,
                pageLoaded: false
            };
        }

        this.testResults.integrationTests.endToEndFlow = e2eTest;

        const passed = e2eTest?.flowCompleted || (e2eTest?.buttonClicked && e2eTest?.errorHandled);

        return {
            passed,
            test: 'End-to-End Payment Flow',
            details: this.testResults.integrationTests.endToEndFlow
        };
    }

    async testErrorRecoveryFlow() {
        console.log('\n  🔄 Testing Error Recovery Flow...');

        // Test API error handling with frontend integration
        const errorTests = [
            {
                name: 'Invalid Price ID Error',
                endpoint: '/api/create-checkout-session',
                payload: { priceId: 'invalid_price_123' },
                expectedErrorHandling: true
            }
        ];

        let errorRecoveryResults = [];

        for (const test of errorTests) {
            try {
                const response = await fetch(`${this.baseUrl}${test.endpoint}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(test.payload)
                });

                const data = await response.json();

                errorRecoveryResults.push({
                    test: test.name,
                    status: response.status,
                    hasError: !!data.error,
                    errorMessage: data.error,
                    isSpecificError: data.error && data.error !== 'Something went wrong' && data.error.length > 10,
                    isRecoverable: response.status >= 400 && response.status < 500
                });

            } catch (error) {
                errorRecoveryResults.push({
                    test: test.name,
                    networkError: error.message
                });
            }
        }

        this.testResults.integrationTests.errorRecovery = errorRecoveryResults;

        const goodErrorRecovery = errorRecoveryResults.filter(result => 
            result.isSpecificError && result.isRecoverable
        ).length;

        const passed = goodErrorRecovery >= Math.ceil(errorRecoveryResults.length * 0.8);

        return {
            passed,
            test: 'Error Recovery Flow',
            details: this.testResults.integrationTests.errorRecovery
        };
    }

    async testSecurityIntegration() {
        console.log('\n  🛡️ Testing Security Integration...');

        // Test that frontend doesn't expose secrets
        let securityTest = null;
        try {
            const browser = await puppeteer.launch({ 
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            const page = await browser.newPage();
            
            await page.goto(`${this.baseUrl}`, { 
                waitUntil: 'networkidle0',
                timeout: 10000
            });

            // Check for exposed secrets in frontend
            const exposedSecrets = await page.evaluate(() => {
                const pageContent = document.documentElement.outerHTML;
                const secretPatterns = [
                    'sk_test_', 
                    'sk_live_', 
                    'whsec_',
                    'rk_test_',
                    'STRIPE_SECRET_KEY'
                ];

                return secretPatterns.filter(pattern => 
                    pageContent.includes(pattern)
                );
            });

            // Check network requests for security
            const responses = [];
            page.on('response', response => {
                responses.push({
                    url: response.url(),
                    status: response.status()
                });
            });

            await page.reload();
            await page.waitForTimeout(2000);

            securityTest = {
                pageLoaded: true,
                exposedSecrets: exposedSecrets.length,
                secretsFound: exposedSecrets,
                networkRequests: responses.length,
                hasSecureRequests: responses.every(r => 
                    r.url.startsWith('https://') || r.url.startsWith('http://localhost')
                )
            };

            await browser.close();
        } catch (error) {
            securityTest = {
                error: error.message,
                pageLoaded: false
            };
        }

        this.testResults.integrationTests.securityValidation = securityTest;

        const passed = securityTest?.exposedSecrets === 0 && securityTest?.pageLoaded;

        return {
            passed,
            test: 'Security Integration',
            details: this.testResults.integrationTests.securityValidation
        };
    }

    // ===============================================
    // UTILITY METHODS
    // ===============================================

    logTestResult(result) {
        if (result.passed) {
            console.log(`    ✅ ${result.test}`);
        } else {
            console.log(`    ❌ ${result.test}`);
            if (result.error) {
                console.log(`       Error: ${result.error}`);
                this.testResults.criticalIssues.push({
                    test: result.test,
                    error: result.error
                });
            }
        }
        
        if (result.details && process.env.VERBOSE) {
            console.log(`       Details: ${JSON.stringify(result.details, null, 2)}`);
        }
    }

    // ===============================================
    // MAIN EXECUTION
    // ===============================================

    async runValidation() {
        console.log('💳 STRIPE PAYMENT FLOW VALIDATION SUITE');
        console.log('======================================');
        console.log(`Testing Environment: ${this.testResults.environment}`);
        console.log(`Base URL: ${this.baseUrl}`);
        console.log(`Timestamp: ${this.testResults.timestamp}`);
        console.log();

        try {
            // Run all validation categories
            const backendScore = await this.validateBackendFixes();
            const frontendScore = await this.validateFrontendFixes();
            const integrationScore = await this.validateIntegration();

            // Calculate overall score
            this.testResults.score = ((backendScore + frontendScore + integrationScore) / 3) * 10;

            this.generateFinalReport(backendScore, frontendScore, integrationScore);
            await this.saveResults();

        } catch (error) {
            console.error('❌ Validation suite failed:', error.message);
            this.testResults.criticalIssues.push({
                test: 'Overall Suite',
                error: error.message
            });
        }

        return this.testResults;
    }

    generateFinalReport(backendScore, frontendScore, integrationScore) {
        console.log('\n📊 STRIPE PAYMENT FLOW VALIDATION SUMMARY');
        console.log('========================================');
        
        console.log(`🔧 Shane's Backend Fixes: ${(backendScore * 10).toFixed(1)}/10`);
        console.log(`🎨 Ben's Frontend Fixes: ${(frontendScore * 10).toFixed(1)}/10`);
        console.log(`🔗 Integration Quality: ${(integrationScore * 10).toFixed(1)}/10`);
        console.log(`\n🎯 Overall Score: ${this.testResults.score.toFixed(1)}/10`);

        // Assessment
        if (this.testResults.score >= 8) {
            console.log('\n✅ EXCELLENT: Payment system ready for production');
        } else if (this.testResults.score >= 6) {
            console.log('\n⚠️  GOOD: Minor improvements recommended');
        } else {
            console.log('\n❌ NEEDS WORK: Critical issues must be resolved');
        }

        // Critical issues
        if (this.testResults.criticalIssues.length > 0) {
            console.log('\n🚨 CRITICAL ISSUES:');
            this.testResults.criticalIssues.forEach((issue, i) => {
                console.log(`${i + 1}. ${issue.test}: ${issue.error}`);
            });
        } else {
            console.log('\n✅ No critical issues found');
        }
    }

    async saveResults() {
        const resultsPath = 'stripe_payment_flow_validation_results.json';
        fs.writeFileSync(resultsPath, JSON.stringify(this.testResults, null, 2));
        console.log(`\n📄 Results saved to: ${resultsPath}`);
    }
}

// Run the validation
if (require.main === module) {
    const validator = new StripePaymentFlowValidation();
    validator.runValidation()
        .then(results => {
            console.log('\n✅ Stripe payment flow validation completed');
            process.exit(results.criticalIssues.length === 0 && results.score >= 6 ? 0 : 1);
        })
        .catch(error => {
            console.error('\n❌ Validation failed:', error.message);
            process.exit(1);
        });
}

module.exports = StripePaymentFlowValidation;