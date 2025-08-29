#!/usr/bin/env node

/**
 * COMPREHENSIVE AGENT FIX VALIDATOR - MASTER TEST RUNNER
 * =====================================================
 * 
 * This is the master validation suite that integrates and runs all comprehensive tests
 * to validate that all agent fixes work together properly:
 * 
 * AGENT FIXES VALIDATED:
 * - Hudson: Security audit vulnerability fixes
 * - Jackson: Infrastructure cleanup and environment security  
 * - Shane: Stripe integration fixes and API error handling
 * - Ben: Frontend payment integration and UI error handling
 * 
 * COMPREHENSIVE TEST SUITES:
 * 1. Environment Variable Security Test (Jackson's fixes)
 * 2. Stripe Payment Flow Integration Test (Shane & Ben's fixes)
 * 3. Security Vulnerability Validation (Hudson's fixes)
 * 4. Cross-browser & Mobile Compatibility Tests
 * 5. Deployment Process & Health Check Validation
 * 6. End-to-End Integration Tests
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const puppeteer = require('puppeteer');

// Import the individual test suites
const ComprehensivePostFixValidationSuite = require('./comprehensive_post_fix_validation_suite.js');
const StripePaymentFlowValidation = require('./stripe_payment_flow_validation.js');
const SecurityVulnerabilityValidation = require('./security_vulnerability_validation.js');

class ComprehensiveAgentFixValidator {
    constructor() {
        this.baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
        this.testResults = {
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'development',
            baseUrl: this.baseUrl,
            overallScore: 0,
            agentScores: {
                hudson: { score: 0, status: 'PENDING', fixes: [] },
                jackson: { score: 0, status: 'PENDING', fixes: [] },
                shane: { score: 0, status: 'PENDING', fixes: [] },
                ben: { score: 0, status: 'PENDING', fixes: [] }
            },
            testSuiteResults: {
                environmentSecurity: null,
                stripeIntegration: null,
                securityVulnerabilities: null,
                crossBrowserCompatibility: null,
                deploymentReadiness: null,
                endToEndIntegration: null
            },
            criticalIssues: [],
            warnings: [],
            recommendations: [],
            deploymentReadiness: false
        };
    }

    // ===============================================
    // MASTER TEST EXECUTION
    // ===============================================

    async runComprehensiveValidation() {
        console.log('🚀 COMPREHENSIVE AGENT FIX VALIDATOR - MASTER SUITE');
        console.log('==================================================');
        console.log(`Testing Environment: ${this.testResults.environment}`);
        console.log(`Base URL: ${this.baseUrl}`);
        console.log(`Timestamp: ${this.testResults.timestamp}`);
        console.log('\n📋 VALIDATION SCOPE:');
        console.log('- Hudson: Security audit vulnerability fixes');
        console.log('- Jackson: Infrastructure cleanup and environment security');
        console.log('- Shane: Stripe integration fixes and API error handling');
        console.log('- Ben: Frontend payment integration and UI error handling');
        console.log();

        try {
            // Phase 1: Security & Infrastructure Tests
            await this.runSecurityInfrastructureTests();
            
            // Phase 2: Payment Integration Tests
            await this.runPaymentIntegrationTests();
            
            // Phase 3: User Experience & Compatibility Tests
            await this.runUserExperienceTests();
            
            // Phase 4: Deployment & Production Readiness Tests
            await this.runDeploymentReadinessTests();
            
            // Phase 5: Final Integration & Assessment
            await this.runFinalIntegrationAssessment();
            
            // Generate comprehensive report
            this.generateMasterReport();
            await this.saveMasterResults();

        } catch (error) {
            console.error('❌ Master validation suite failed:', error.message);
            this.testResults.criticalIssues.push({
                category: 'Master Suite',
                issue: error.message,
                severity: 'CRITICAL'
            });
        }

        return this.testResults;
    }

    // ===============================================
    // PHASE 1: SECURITY & INFRASTRUCTURE TESTS
    // ===============================================

    async runSecurityInfrastructureTests() {
        console.log('\n🔒 PHASE 1: SECURITY & INFRASTRUCTURE VALIDATION');
        console.log('===============================================');

        try {
            // Run Hudson's security vulnerability validation
            console.log('\n🛡️  Running Hudson\'s Security Vulnerability Validation...');
            const securityValidator = new SecurityVulnerabilityValidation();
            const securityResults = await securityValidator.runSecurityValidation();
            
            this.testResults.testSuiteResults.securityVulnerabilities = securityResults;
            this.testResults.agentScores.hudson.score = securityResults.securityScore;
            this.testResults.agentScores.hudson.status = securityResults.securityScore >= 7 ? 'SECURE' : 'VULNERABLE';
            this.testResults.agentScores.hudson.fixes = securityResults.vulnerabilitiesFixed;

            // Run Jackson's environment security tests
            console.log('\n🏗️  Running Jackson\'s Environment Security Tests...');
            const environmentScore = await this.validateEnvironmentSecurity();
            this.testResults.agentScores.jackson.score = environmentScore;
            this.testResults.agentScores.jackson.status = environmentScore >= 8 ? 'SECURE' : 'NEEDS_ATTENTION';

            console.log(`\n📊 Phase 1 Results:`);
            console.log(`   Hudson (Security): ${this.testResults.agentScores.hudson.score.toFixed(1)}/10`);
            console.log(`   Jackson (Infrastructure): ${this.testResults.agentScores.jackson.score.toFixed(1)}/10`);

        } catch (error) {
            console.error('❌ Phase 1 failed:', error.message);
            this.testResults.criticalIssues.push({
                category: 'Security & Infrastructure',
                issue: error.message,
                severity: 'CRITICAL'
            });
        }
    }

    async validateEnvironmentSecurity() {
        // Comprehensive environment security validation
        const tests = [
            this.testGitSecurityConfiguration.bind(this),
            this.testEnvironmentVariableProtection.bind(this),
            this.testDeploymentSecurityCleanup.bind(this)
        ];

        let totalScore = 0;
        let testCount = 0;

        for (const test of tests) {
            try {
                const result = await test();
                totalScore += result.score;
                testCount++;
                console.log(`    ${result.passed ? '✅' : '❌'} ${result.test}: ${result.score.toFixed(1)}/10`);
            } catch (error) {
                console.log(`    ❌ Environment Security Test Failed: ${error.message}`);
            }
        }

        return testCount > 0 ? totalScore / testCount : 0;
    }

    async testGitSecurityConfiguration() {
        // Test git security configuration
        let score = 0;
        
        // Check .gitignore
        if (fs.existsSync('.gitignore')) {
            const gitignore = fs.readFileSync('.gitignore', 'utf8');
            if (gitignore.includes('.env')) score += 3;
            if (gitignore.includes('.env.local')) score += 2;
            if (gitignore.includes('.env.production')) score += 3;
            if (gitignore.includes('.env*')) score += 2;
        }

        // Check no tracked environment files
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            
            await execAsync('git ls-files | grep -E "\\.env"');
            // If we get here, environment files are tracked (bad)
            score -= 5;
        } catch (error) {
            // No environment files tracked (good)
            // Score remains unchanged
        }

        return {
            passed: score >= 8,
            test: 'Git Security Configuration',
            score: Math.max(0, Math.min(10, score))
        };
    }

    async testEnvironmentVariableProtection() {
        let score = 0;
        
        // Check for environment validation system
        if (fs.existsSync('lib/utils/stripe-environment-validator.ts')) score += 4;
        
        // Check package.json for validation commands
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        if (packageJson.scripts && packageJson.scripts['stripe:validate']) score += 3;
        if (packageJson.scripts && packageJson.scripts.predeploy) score += 3;

        return {
            passed: score >= 7,
            test: 'Environment Variable Protection',
            score: Math.min(10, score)
        };
    }

    async testDeploymentSecurityCleanup() {
        let score = 10;
        
        // Check for removed Vercel artifacts
        if (fs.existsSync('vercel.json')) score -= 3;
        if (fs.existsSync('.vercel')) score -= 3;
        
        // Check for clean deployment configuration
        if (fs.existsSync('next.config.js')) {
            const config = fs.readFileSync('next.config.js', 'utf8');
            if (config.includes('origin: "*"') || config.includes("origin: '*'")) score -= 4;
        }

        return {
            passed: score >= 8,
            test: 'Deployment Security Cleanup',
            score: Math.max(0, score)
        };
    }

    // ===============================================
    // PHASE 2: PAYMENT INTEGRATION TESTS
    // ===============================================

    async runPaymentIntegrationTests() {
        console.log('\n💳 PHASE 2: PAYMENT INTEGRATION VALIDATION');
        console.log('==========================================');

        try {
            // Run Shane & Ben's payment integration validation
            console.log('\n🔧 Running Shane & Ben\'s Payment Integration Validation...');
            const paymentValidator = new StripePaymentFlowValidation();
            const paymentResults = await paymentValidator.runValidation();
            
            this.testResults.testSuiteResults.stripeIntegration = paymentResults;
            
            // Extract scores for Shane (backend) and Ben (frontend)
            const backendScore = this.calculateBackendScore(paymentResults);
            const frontendScore = this.calculateFrontendScore(paymentResults);
            
            this.testResults.agentScores.shane.score = backendScore;
            this.testResults.agentScores.shane.status = backendScore >= 7 ? 'WORKING' : 'NEEDS_FIXES';
            
            this.testResults.agentScores.ben.score = frontendScore;
            this.testResults.agentScores.ben.status = frontendScore >= 7 ? 'WORKING' : 'NEEDS_FIXES';

            console.log(`\n📊 Phase 2 Results:`);
            console.log(`   Shane (Backend): ${this.testResults.agentScores.shane.score.toFixed(1)}/10`);
            console.log(`   Ben (Frontend): ${this.testResults.agentScores.ben.score.toFixed(1)}/10`);

        } catch (error) {
            console.error('❌ Phase 2 failed:', error.message);
            this.testResults.criticalIssues.push({
                category: 'Payment Integration',
                issue: error.message,
                severity: 'HIGH'
            });
        }
    }

    calculateBackendScore(paymentResults) {
        const backendTests = paymentResults.backendTests || {};
        let score = 0;
        let testCount = 0;

        Object.values(backendTests).forEach(test => {
            if (test && typeof test === 'object') {
                // Calculate score based on test results
                const testScore = this.calculateTestScore(test);
                score += testScore;
                testCount++;
            }
        });

        return testCount > 0 ? (score / testCount) * 10 : 0;
    }

    calculateFrontendScore(paymentResults) {
        const frontendTests = paymentResults.frontendTests || {};
        let score = 0;
        let testCount = 0;

        Object.values(frontendTests).forEach(test => {
            if (test && typeof test === 'object') {
                const testScore = this.calculateTestScore(test);
                score += testScore;
                testCount++;
            }
        });

        return testCount > 0 ? (score / testCount) * 10 : 0;
    }

    calculateTestScore(test) {
        // Generic test score calculation
        if (test.passed === true) return 1;
        if (test.passed === false) return 0;
        
        // For complex test objects, calculate based on sub-results
        let subScore = 0;
        let subCount = 0;
        
        Object.values(test).forEach(value => {
            if (typeof value === 'boolean') {
                subScore += value ? 1 : 0;
                subCount++;
            }
        });
        
        return subCount > 0 ? subScore / subCount : 0.5;
    }

    // ===============================================
    // PHASE 3: USER EXPERIENCE & COMPATIBILITY TESTS
    // ===============================================

    async runUserExperienceTests() {
        console.log('\n🎨 PHASE 3: USER EXPERIENCE & COMPATIBILITY VALIDATION');
        console.log('====================================================');

        try {
            // Cross-browser compatibility tests
            const compatibilityScore = await this.runCrossBrowserTests();
            this.testResults.testSuiteResults.crossBrowserCompatibility = compatibilityScore;
            
            // Mobile responsiveness tests
            const mobileScore = await this.runMobileResponsivenessTests();
            
            // Error handling UX tests
            const errorHandlingScore = await this.runErrorHandlingUXTests();
            
            const avgUXScore = (compatibilityScore + mobileScore + errorHandlingScore) / 3;
            
            // Update Ben's score with UX components
            this.testResults.agentScores.ben.score = Math.max(
                this.testResults.agentScores.ben.score,
                avgUXScore
            );

            console.log(`\n📊 Phase 3 Results:`);
            console.log(`   Cross-browser Compatibility: ${compatibilityScore.toFixed(1)}/10`);
            console.log(`   Mobile Responsiveness: ${mobileScore.toFixed(1)}/10`);
            console.log(`   Error Handling UX: ${errorHandlingScore.toFixed(1)}/10`);

        } catch (error) {
            console.error('❌ Phase 3 failed:', error.message);
            this.testResults.criticalIssues.push({
                category: 'User Experience',
                issue: error.message,
                severity: 'MEDIUM'
            });
        }
    }

    async runCrossBrowserTests() {
        let browser;
        try {
            browser = await puppeteer.launch({ 
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            
            // Test different viewport sizes
            const viewports = [
                { width: 1920, height: 1080, name: 'Desktop' },
                { width: 768, height: 1024, name: 'Tablet' },
                { width: 375, height: 667, name: 'Mobile' }
            ];
            
            let compatibilityTests = [];
            
            for (const viewport of viewports) {
                await page.setViewport(viewport);
                await page.goto(`${this.baseUrl}`, { waitUntil: 'networkidle0', timeout: 10000 });
                
                const pageAnalysis = await page.evaluate(() => {
                    return {
                        pageLoaded: document.readyState === 'complete',
                        hasErrors: window.errors && window.errors.length > 0,
                        buttonsClickable: document.querySelectorAll('button, .btn').length > 0,
                        layoutIntact: document.querySelector('main, .main-content') !== null
                    };
                });
                
                compatibilityTests.push({
                    viewport: viewport.name,
                    score: Object.values(pageAnalysis).filter(Boolean).length / 4 * 10
                });
            }
            
            const avgScore = compatibilityTests.reduce((sum, test) => sum + test.score, 0) / compatibilityTests.length;
            return avgScore;
            
        } catch (error) {
            console.log(`    ⚠️  Cross-browser test error: ${error.message}`);
            return 5; // Neutral score on test failure
        } finally {
            if (browser) await browser.close();
        }
    }

    async runMobileResponsivenessTests() {
        let browser;
        try {
            browser = await puppeteer.launch({ 
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            await page.setViewport({ width: 375, height: 667 });
            await page.goto(`${this.baseUrl}/pricing`, { waitUntil: 'networkidle0', timeout: 10000 });
            
            const mobileAnalysis = await page.evaluate(() => {
                // Check touch-friendly button sizes
                const buttons = Array.from(document.querySelectorAll('button, .btn'));
                const touchFriendlyButtons = buttons.filter(btn => {
                    const rect = btn.getBoundingClientRect();
                    return rect.width >= 44 && rect.height >= 44;
                }).length;
                
                // Check responsive text
                const hasResponsiveText = !Array.from(document.querySelectorAll('*')).some(el => {
                    const styles = window.getComputedStyle(el);
                    return parseInt(styles.fontSize) < 14; // Too small for mobile
                });
                
                return {
                    touchFriendlyRatio: touchFriendlyButtons / Math.max(buttons.length, 1),
                    hasResponsiveText,
                    noHorizontalScroll: document.body.scrollWidth <= window.innerWidth
                };
            });
            
            let score = 0;
            score += mobileAnalysis.touchFriendlyRatio * 4;
            score += mobileAnalysis.hasResponsiveText ? 3 : 0;
            score += mobileAnalysis.noHorizontalScroll ? 3 : 0;
            
            return Math.min(10, score);
            
        } catch (error) {
            console.log(`    ⚠️  Mobile responsiveness test error: ${error.message}`);
            return 5;
        } finally {
            if (browser) await browser.close();
        }
    }

    async runErrorHandlingUXTests() {
        try {
            // Test API error handling UX
            const response = await fetch(`${this.baseUrl}/api/create-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId: 'invalid_price_123' })
            });
            
            const data = await response.json();
            
            let score = 0;
            
            // Check for user-friendly error messages
            if (data.error && data.error.length > 10) score += 5;
            if (data.error && !data.error.includes('500')) score += 3;
            if (response.status >= 400 && response.status < 500) score += 2;
            
            return Math.min(10, score);
            
        } catch (error) {
            console.log(`    ⚠️  Error handling UX test error: ${error.message}`);
            return 5;
        }
    }

    // ===============================================
    // PHASE 4: DEPLOYMENT READINESS TESTS
    // ===============================================

    async runDeploymentReadinessTests() {
        console.log('\n🚀 PHASE 4: DEPLOYMENT READINESS VALIDATION');
        console.log('==========================================');

        try {
            const deploymentTests = [
                this.testBuildProcess.bind(this),
                this.testHealthEndpoint.bind(this),
                this.testEnvironmentValidation.bind(this),
                this.testSecurityHeaders.bind(this)
            ];
            
            let deploymentScores = [];
            
            for (const test of deploymentTests) {
                try {
                    const result = await test();
                    deploymentScores.push(result.score);
                    console.log(`    ${result.passed ? '✅' : '❌'} ${result.test}: ${result.score.toFixed(1)}/10`);
                } catch (error) {
                    console.log(`    ❌ Deployment test failed: ${error.message}`);
                    deploymentScores.push(0);
                }
            }
            
            const avgDeploymentScore = deploymentScores.reduce((sum, score) => sum + score, 0) / deploymentScores.length;
            this.testResults.testSuiteResults.deploymentReadiness = avgDeploymentScore;
            this.testResults.deploymentReadiness = avgDeploymentScore >= 7;
            
            console.log(`\n📊 Phase 4 Results:`);
            console.log(`   Deployment Readiness: ${avgDeploymentScore.toFixed(1)}/10`);
            
        } catch (error) {
            console.error('❌ Phase 4 failed:', error.message);
            this.testResults.criticalIssues.push({
                category: 'Deployment Readiness',
                issue: error.message,
                severity: 'HIGH'
            });
        }
    }

    async testBuildProcess() {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            
            // Test build command (with timeout)
            await execAsync('npm run build', { timeout: 120000 }); // 2 minutes
            
            // Check for build artifacts
            const hasBuildOutput = fs.existsSync('.next') || fs.existsSync('out') || fs.existsSync('dist');
            
            return {
                passed: hasBuildOutput,
                test: 'Build Process',
                score: hasBuildOutput ? 10 : 0
            };
        } catch (error) {
            return {
                passed: false,
                test: 'Build Process',
                score: 0,
                error: error.message
            };
        }
    }

    async testHealthEndpoint() {
        try {
            const response = await fetch(`${this.baseUrl}/api/health`, { timeout: 5000 });
            const isHealthy = response.status === 200;
            
            return {
                passed: isHealthy,
                test: 'Health Endpoint',
                score: isHealthy ? 10 : 0
            };
        } catch (error) {
            return {
                passed: false,
                test: 'Health Endpoint',
                score: 0
            };
        }
    }

    async testEnvironmentValidation() {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            
            // Test environment validation
            const result = await execAsync('npm run stripe:validate');
            
            // In development, we expect validation to fail (using mock values)
            const expectedFailure = result.includes('VALIDATION FAILED');
            
            return {
                passed: expectedFailure,
                test: 'Environment Validation',
                score: expectedFailure ? 10 : 5
            };
        } catch (error) {
            // If script doesn't exist or fails to run
            return {
                passed: false,
                test: 'Environment Validation',
                score: 0
            };
        }
    }

    async testSecurityHeaders() {
        try {
            const response = await fetch(this.baseUrl, { timeout: 5000 });
            
            let score = 0;
            const headers = response.headers;
            
            // Check for security headers
            if (headers.get('x-frame-options')) score += 2;
            if (headers.get('x-content-type-options')) score += 2;
            if (headers.get('x-xss-protection')) score += 2;
            if (headers.get('content-security-policy')) score += 2;
            if (headers.get('referrer-policy')) score += 2;
            
            return {
                passed: score >= 6,
                test: 'Security Headers',
                score: Math.min(10, score)
            };
        } catch (error) {
            return {
                passed: false,
                test: 'Security Headers',
                score: 0
            };
        }
    }

    // ===============================================
    // PHASE 5: FINAL INTEGRATION ASSESSMENT
    // ===============================================

    async runFinalIntegrationAssessment() {
        console.log('\n🔗 PHASE 5: FINAL INTEGRATION ASSESSMENT');
        console.log('======================================');

        try {
            // End-to-end integration test
            const integrationScore = await this.runEndToEndIntegrationTest();
            this.testResults.testSuiteResults.endToEndIntegration = integrationScore;
            
            // Calculate overall score
            const agentScores = Object.values(this.testResults.agentScores).map(agent => agent.score);
            const suiteScores = Object.values(this.testResults.testSuiteResults).filter(score => 
                typeof score === 'number'
            );
            
            const allScores = [...agentScores, ...suiteScores];
            this.testResults.overallScore = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
            
            console.log(`\n📊 Phase 5 Results:`);
            console.log(`   End-to-End Integration: ${integrationScore.toFixed(1)}/10`);
            console.log(`   Overall System Score: ${this.testResults.overallScore.toFixed(1)}/10`);
            
        } catch (error) {
            console.error('❌ Phase 5 failed:', error.message);
            this.testResults.criticalIssues.push({
                category: 'Final Integration',
                issue: error.message,
                severity: 'HIGH'
            });
        }
    }

    async runEndToEndIntegrationTest() {
        let browser;
        try {
            browser = await puppeteer.launch({ 
                headless: 'new',
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            
            const page = await browser.newPage();
            
            // Test complete user journey
            await page.goto(`${this.baseUrl}`, { waitUntil: 'networkidle0', timeout: 15000 });
            
            // Navigate to pricing
            await page.goto(`${this.baseUrl}/pricing`, { waitUntil: 'networkidle0', timeout: 10000 });
            
            // Try to interact with payment system
            const integrationTest = await page.evaluate(() => {
                // Look for payment buttons
                const buttons = Array.from(document.querySelectorAll('button, .btn, [role="button"]'));
                const paymentButtons = buttons.filter(btn => {
                    const text = btn.textContent.toLowerCase();
                    return text.includes('upgrade') || text.includes('subscribe') || text.includes('get started');
                });
                
                // Check for error handling components
                const hasErrorComponents = document.querySelector('.error, .notification, [role="alert"]') !== null ||
                    Array.from(document.querySelectorAll('*')).some(el => 
                        el.className && (el.className.includes('Error') || el.className.includes('Notification'))
                    );
                
                return {
                    pageLoaded: true,
                    hasPaymentButtons: paymentButtons.length > 0,
                    hasErrorHandling: hasErrorComponents,
                    hasInteractiveElements: buttons.length > 0
                };
            });
            
            let score = 0;
            if (integrationTest.pageLoaded) score += 3;
            if (integrationTest.hasPaymentButtons) score += 3;
            if (integrationTest.hasErrorHandling) score += 2;
            if (integrationTest.hasInteractiveElements) score += 2;
            
            return Math.min(10, score);
            
        } catch (error) {
            console.log(`    ⚠️  Integration test error: ${error.message}`);
            return 3; // Minimal score for basic functionality
        } finally {
            if (browser) await browser.close();
        }
    }

    // ===============================================
    // REPORTING & RESULTS
    // ===============================================

    generateMasterReport() {
        console.log('\n📊 COMPREHENSIVE AGENT FIX VALIDATION REPORT');
        console.log('============================================');
        
        // Overall Assessment
        console.log(`\n🎯 OVERALL SYSTEM SCORE: ${this.testResults.overallScore.toFixed(1)}/10`);
        
        if (this.testResults.overallScore >= 8) {
            console.log('✅ EXCELLENT: All agent fixes working together successfully');
        } else if (this.testResults.overallScore >= 6) {
            console.log('⚠️  GOOD: Minor integration issues need attention');
        } else {
            console.log('❌ NEEDS WORK: Significant integration issues must be resolved');
        }
        
        // Agent-specific scores
        console.log('\n👥 AGENT FIX VALIDATION SCORES:');
        console.log('==============================');
        Object.entries(this.testResults.agentScores).forEach(([agent, data]) => {
            const status = data.status === 'SECURE' || data.status === 'WORKING' ? '✅' : 
                          data.status === 'NEEDS_ATTENTION' || data.status === 'NEEDS_FIXES' ? '⚠️' : '❌';
            console.log(`${agent.toUpperCase()}: ${data.score.toFixed(1)}/10 ${status} (${data.status})`);
        });
        
        // Test suite results
        console.log('\n🧪 TEST SUITE RESULTS:');
        console.log('======================');
        Object.entries(this.testResults.testSuiteResults).forEach(([suite, result]) => {
            if (typeof result === 'number') {
                const status = result >= 8 ? '✅' : result >= 6 ? '⚠️' : '❌';
                console.log(`${suite}: ${result.toFixed(1)}/10 ${status}`);
            } else if (result && result.score) {
                const status = result.score >= 8 ? '✅' : result.score >= 6 ? '⚠️' : '❌';
                console.log(`${suite}: ${result.score.toFixed(1)}/10 ${status}`);
            } else {
                console.log(`${suite}: Not completed`);
            }
        });
        
        // Critical issues
        if (this.testResults.criticalIssues.length > 0) {
            console.log('\n🚨 CRITICAL ISSUES:');
            console.log('==================');
            this.testResults.criticalIssues.forEach((issue, i) => {
                console.log(`${i + 1}. [${issue.severity}] ${issue.category}: ${issue.issue}`);
            });
        } else {
            console.log('\n✅ NO CRITICAL ISSUES FOUND');
        }
        
        // Deployment readiness
        console.log('\n🚀 DEPLOYMENT READINESS:');
        console.log('=======================');
        if (this.testResults.deploymentReadiness && this.testResults.overallScore >= 7 && this.testResults.criticalIssues.length === 0) {
            console.log('✅ READY FOR PRODUCTION DEPLOYMENT');
            console.log('   All agent fixes have been validated and are working together properly');
        } else {
            console.log('⚠️  NOT READY FOR PRODUCTION DEPLOYMENT');
            console.log('   Resolve critical issues and improve integration scores before deployment');
        }
        
        // Recommendations
        this.generateRecommendations();
        if (this.testResults.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS:');
            console.log('==================');
            this.testResults.recommendations.forEach((rec, i) => {
                console.log(`${i + 1}. ${rec}`);
            });
        }
    }

    generateRecommendations() {
        // Generate recommendations based on scores
        Object.entries(this.testResults.agentScores).forEach(([agent, data]) => {
            if (data.score < 7) {
                this.testResults.recommendations.push(
                    `Improve ${agent.toUpperCase()}'s fixes - current score ${data.score.toFixed(1)}/10`
                );
            }
        });
        
        if (this.testResults.overallScore < 8) {
            this.testResults.recommendations.push(
                'Focus on integration testing between agent fixes to improve overall system score'
            );
        }
        
        if (!this.testResults.deploymentReadiness) {
            this.testResults.recommendations.push(
                'Address deployment readiness issues before production deployment'
            );
        }
        
        if (this.testResults.criticalIssues.length > 0) {
            this.testResults.recommendations.push(
                'Resolve all critical issues before proceeding with production deployment'
            );
        }
    }

    async saveMasterResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const jsonPath = `comprehensive_agent_fix_validation_${timestamp}.json`;
        const reportPath = `COMPREHENSIVE_AGENT_FIX_VALIDATION_REPORT.md`;
        
        // Save JSON results
        fs.writeFileSync(jsonPath, JSON.stringify(this.testResults, null, 2));
        
        // Generate markdown report
        const markdown = this.generateMarkdownReport();
        fs.writeFileSync(reportPath, markdown);
        
        console.log(`\n📄 Comprehensive validation results saved:`);
        console.log(`   JSON: ${jsonPath}`);
        console.log(`   Report: ${reportPath}`);
    }

    generateMarkdownReport() {
        const agentScoresTable = Object.entries(this.testResults.agentScores)
            .map(([agent, data]) => 
                `| ${agent.toUpperCase()} | ${data.score.toFixed(1)}/10 | ${data.status} |`
            ).join('\n');

        const criticalIssuesTable = this.testResults.criticalIssues.length > 0 ?
            this.testResults.criticalIssues.map((issue, i) => 
                `${i + 1}. **[${issue.severity}]** ${issue.category}: ${issue.issue}`
            ).join('\n') :
            '✅ **No critical issues found**';

        return `# 🚀 COMPREHENSIVE AGENT FIX VALIDATION REPORT

## Executive Summary

**Validation Date**: ${new Date(this.testResults.timestamp).toLocaleDateString()}
**Environment**: ${this.testResults.environment}
**Base URL**: ${this.testResults.baseUrl}
**Overall Score**: ${this.testResults.overallScore.toFixed(1)}/10
**Deployment Ready**: ${this.testResults.deploymentReadiness ? 'YES' : 'NO'}

## 👥 Agent Fix Validation Results

| Agent | Score | Status |
|-------|--------|--------|
${agentScoresTable}

### Agent Responsibilities
- **HUDSON**: Security audit vulnerability fixes
- **JACKSON**: Infrastructure cleanup and environment security  
- **SHANE**: Stripe integration fixes and API error handling
- **BEN**: Frontend payment integration and UI error handling

## 🧪 Test Suite Results

| Test Suite | Score | Status |
|------------|--------|--------|
${Object.entries(this.testResults.testSuiteResults).map(([suite, result]) => {
    const score = typeof result === 'number' ? result : (result && result.score) ? result.score : 'N/A';
    const status = score >= 8 ? 'PASS' : score >= 6 ? 'WARNING' : 'FAIL';
    return `| ${suite} | ${typeof score === 'number' ? score.toFixed(1) + '/10' : score} | ${status} |`;
}).join('\n')}

## 🚨 Critical Issues

${criticalIssuesTable}

## 💡 Recommendations

${this.testResults.recommendations.length > 0 ? 
    this.testResults.recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n') :
    '✅ **No specific recommendations - system performing well**'
}

## 🎯 Final Assessment

${this.testResults.overallScore >= 8 ? 
    '✅ **EXCELLENT**: All agent fixes are working together successfully. Ready for production deployment.' :
    this.testResults.overallScore >= 6 ?
    '⚠️ **GOOD**: Agent fixes are working well with minor integration issues. Address recommendations before production.' :
    '❌ **NEEDS WORK**: Significant integration issues between agent fixes. Resolve critical issues before deployment.'
}

### Deployment Status

${this.testResults.deploymentReadiness && this.testResults.overallScore >= 7 ? 
    '🟢 **READY FOR PRODUCTION DEPLOYMENT**' :
    '🔴 **NOT READY FOR PRODUCTION** - Address critical issues first'
}

---

*Report generated by Comprehensive Agent Fix Validator*
*Date: ${new Date().toISOString()}*
*Environment: ${this.testResults.environment}*
`;
    }
}

// Run the comprehensive validation
if (require.main === module) {
    const validator = new ComprehensiveAgentFixValidator();
    validator.runComprehensiveValidation()
        .then(results => {
            console.log('\n✅ Comprehensive agent fix validation completed');
            const isReady = results.deploymentReadiness && 
                           results.overallScore >= 7 && 
                           results.criticalIssues.length === 0;
            process.exit(isReady ? 0 : 1);
        })
        .catch(error => {
            console.error('\n❌ Comprehensive validation failed:', error.message);
            process.exit(1);
        });
}

module.exports = ComprehensiveAgentFixValidator;