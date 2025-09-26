#!/usr/bin/env node

/**
 * DirectoryBolt Worker Security Validation Test
 * 
 * Validates that all security fixes are properly implemented:
 * - No hardcoded API keys
 * - Required environment variables validation
 * - Proper authentication headers
 * - Secure API communication
 */

const DirectoryBoltWorker = require('./worker.js');
const path = require('path');

class WorkerSecurityTest {
    constructor() {
        this.testResults = [];
        this.passed = 0;
        this.failed = 0;
    }
    
    /**
     * Run all security tests
     */
    async runAllTests() {
        console.log('🔒 DirectoryBolt Worker Security Validation Tests');
        console.log('================================================\n');
        
        // Test environment variable validation
        await this.testEnvironmentValidation();
        
        // Test no hardcoded secrets
        await this.testNoHardcodedSecrets();
        
        // Test secure configuration
        await this.testSecureConfiguration();
        
        // Test authentication requirements
        await this.testAuthenticationRequirements();
        
        // Test HTTPS usage
        await this.testHttpsUsage();
        
        this.printResults();
    }
    
    /**
     * Test environment variable validation
     */
    async testEnvironmentValidation() {
        console.log('🧪 Testing environment variable validation...');
        
        // Clear environment variables to test validation
        const originalTwoCaptcha = process.env.TWO_CAPTCHA_KEY;
        const originalAuthToken = process.env.WORKER_AUTH_TOKEN;
        
        try {
            // Test missing TWO_CAPTCHA_KEY
            delete process.env.TWO_CAPTCHA_KEY;
            delete process.env.WORKER_AUTH_TOKEN;
            
            const worker = new DirectoryBoltWorker();
            
            try {
                await worker.initialize();
                this.addResult('Environment Validation', 'FAIL', 'Should throw error for missing environment variables');
            } catch (error) {
                if (error.message.includes('Missing required environment variables')) {
                    this.addResult('Environment Validation', 'PASS', 'Correctly validates missing environment variables');
                } else {
                    this.addResult('Environment Validation', 'FAIL', `Unexpected error: ${error.message}`);
                }
            }
            
            // Restore environment variables
            if (originalTwoCaptcha) process.env.TWO_CAPTCHA_KEY = originalTwoCaptcha;
            if (originalAuthToken) process.env.WORKER_AUTH_TOKEN = originalAuthToken;
            
        } catch (error) {
            this.addResult('Environment Validation', 'FAIL', `Test error: ${error.message}`);
        }
    }
    
    /**
     * Test that no hardcoded secrets exist in code
     */
    async testNoHardcodedSecrets() {
        console.log('🧪 Testing for hardcoded secrets...');
        
        const fs = require('fs');
        const workerCode = fs.readFileSync(path.join(__dirname, 'worker.js'), 'utf8');
        
        // Check for the specific hardcoded API key that was removed
        const hardcodedKey = '${TWO_CAPTCHA_KEY}';
        
        if (workerCode.includes(hardcodedKey)) {
            this.addResult('No Hardcoded Secrets', 'FAIL', 'Found hardcoded 2Captcha API key in source code');
        } else {
            this.addResult('No Hardcoded Secrets', 'PASS', 'No hardcoded API keys found in source code');
        }
        
        // Check for hardcoded tokens or keys patterns
        const suspiciousPatterns = [
            /[a-f0-9]{32}/g, // 32-character hex strings (common for API keys)
            /Bearer [a-zA-Z0-9]{20,}/g, // Bearer tokens
            /'[a-zA-Z0-9]{32,}'/g // Quoted long strings
        ];
        
        let suspiciousFound = false;
        for (const pattern of suspiciousPatterns) {
            const matches = workerCode.match(pattern);
            if (matches) {
                // Filter out legitimate patterns (like hex colors, etc.)
                const legitimateMatches = matches.filter(match => 
                    !match.includes('Mozilla') && // User agent strings
                    !match.includes('webkit') && // Browser identifiers
                    !match.includes('color') && // CSS colors
                    match.length > 20 // Only long strings
                );
                
                if (legitimateMatches.length > 0) {
                    console.warn(`⚠️  Found potentially suspicious patterns: ${legitimateMatches.join(', ')}`);
                    suspiciousFound = true;
                }
            }
        }
        
        if (!suspiciousFound) {
            this.addResult('Pattern Check', 'PASS', 'No suspicious hardcoded patterns detected');
        } else {
            this.addResult('Pattern Check', 'WARN', 'Found potentially suspicious patterns (manual review needed)');
        }
    }
    
    /**
     * Test secure configuration
     */
    async testSecureConfiguration() {
        console.log('🧪 Testing secure configuration...');
        
        // Set minimal required environment variables for testing
        process.env.TWO_CAPTCHA_KEY = 'test_key_32_characters_long_12345';
        process.env.WORKER_AUTH_TOKEN = 'test_auth_token_long_enough_123456';
        
        try {
            const worker = new DirectoryBoltWorker();
            
            // Check that config doesn't contain fallback hardcoded values
            if (worker.config.twoCaptchaApiKey === process.env.TWO_CAPTCHA_KEY) {
                this.addResult('Secure Config', 'PASS', 'Uses environment variable for 2Captcha API key');
            } else {
                this.addResult('Secure Config', 'FAIL', 'Not properly using environment variable for API key');
            }
            
            if (worker.config.workerAuthToken === process.env.WORKER_AUTH_TOKEN) {
                this.addResult('Secure Auth Config', 'PASS', 'Uses environment variable for auth token');
            } else {
                this.addResult('Secure Auth Config', 'FAIL', 'Not properly using environment variable for auth token');
            }
            
        } catch (error) {
            this.addResult('Secure Configuration', 'FAIL', `Configuration test failed: ${error.message}`);
        }
    }
    
    /**
     * Test authentication requirements
     */
    async testAuthenticationRequirements() {
        console.log('🧪 Testing authentication requirements...');
        
        try {
            const worker = new DirectoryBoltWorker();
            
            // Check that authentication headers are properly set
            const hasAuthValidation = worker.constructor.toString().includes('Authorization');
            if (hasAuthValidation) {
                this.addResult('Authentication Headers', 'PASS', 'Worker implements authentication headers');
            } else {
                this.addResult('Authentication Headers', 'FAIL', 'Missing authentication header implementation');
            }
            
            // Check for proper user agent
            const hasUserAgent = worker.constructor.toString().includes('DirectoryBolt-Worker');
            if (hasUserAgent) {
                this.addResult('User Agent', 'PASS', 'Implements proper User-Agent header');
            } else {
                this.addResult('User Agent', 'FAIL', 'Missing proper User-Agent header');
            }
            
        } catch (error) {
            this.addResult('Authentication Requirements', 'FAIL', `Auth test failed: ${error.message}`);
        }
    }
    
    /**
     * Test HTTPS usage
     */
    async testHttpsUsage() {
        console.log('🧪 Testing HTTPS usage...');
        
        const fs = require('fs');
        const workerCode = fs.readFileSync(path.join(__dirname, 'worker.js'), 'utf8');
        
        // Check that 2Captcha requests use HTTPS
        if (workerCode.includes('https://2captcha.com')) {
            this.addResult('HTTPS Usage', 'PASS', '2Captcha API calls use HTTPS');
        } else if (workerCode.includes('http://2captcha.com')) {
            this.addResult('HTTPS Usage', 'FAIL', '2Captcha API calls still use HTTP (insecure)');
        } else {
            this.addResult('HTTPS Usage', 'WARN', 'Could not verify 2Captcha HTTPS usage');
        }
        
        // Check for any HTTP URLs (potential security issues)
        const httpMatches = workerCode.match(/http:\/\/[^\s'"]+/g);
        if (httpMatches) {
            const filteredMatches = httpMatches.filter(url => !url.includes('localhost'));
            if (filteredMatches.length > 0) {
                this.addResult('HTTP URLs Check', 'WARN', `Found HTTP URLs: ${filteredMatches.join(', ')}`);
            } else {
                this.addResult('HTTP URLs Check', 'PASS', 'No insecure HTTP URLs found');
            }
        } else {
            this.addResult('HTTP URLs Check', 'PASS', 'No HTTP URLs detected');
        }
    }
    
    /**
     * Add test result
     */
    addResult(test, status, message) {
        const result = { test, status, message };
        this.testResults.push(result);
        
        const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
        console.log(`  ${icon} ${test}: ${message}`);
        
        if (status === 'PASS') this.passed++;
        else if (status === 'FAIL') this.failed++;
    }
    
    /**
     * Print final test results
     */
    printResults() {
        console.log('\n' + '='.repeat(50));
        console.log('🔒 Security Test Results Summary');
        console.log('='.repeat(50));
        console.log(`✅ Passed: ${this.passed}`);
        console.log(`❌ Failed: ${this.failed}`);
        console.log(`⚠️  Warnings: ${this.testResults.filter(r => r.status === 'WARN').length}`);
        
        if (this.failed > 0) {
            console.log('\n❌ SECURITY ISSUES DETECTED - Review and fix before deployment');
            process.exit(1);
        } else {
            console.log('\n✅ All security tests passed - Worker is ready for secure deployment');
            process.exit(0);
        }
    }
}

// Run tests if called directly
if (require.main === module) {
    const tester = new WorkerSecurityTest();
    tester.runAllTests().catch(error => {
        console.error('❌ Security test suite failed:', error);
        process.exit(1);
    });
}

module.exports = WorkerSecurityTest;