#!/usr/bin/env node

/**
 * DirectoryBolt Production Deployment Script
 * Handles deployment process with monitoring and validation
 * 
 * Usage: npm run deploy:production
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

class ProductionDeployment {
    constructor() {
        this.deploymentId = `deploy-${Date.now()}`;
        this.startTime = Date.now();
        this.baseUrl = process.env.PRODUCTION_URL || 'https://directorybolt.com';
        this.healthCheckEndpoints = [
            '/api/health',
            '/api/analyze',
            '/api/create-checkout-session'
        ];
        this.deploymentLog = [];
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
        console.log(logEntry);
        this.deploymentLog.push(logEntry);
    }

    async validateEnvironment() {
        this.log('🔍 Validating environment configuration...');
        
        const requiredEnvVars = [
            'STRIPE_SECRET_KEY',
            'STRIPE_STARTER_PRICE_ID', 
            'STRIPE_GROWTH_PRICE_ID',
            'STRIPE_PROFESSIONAL_PRICE_ID',
            'STRIPE_ENTERPRISE_PRICE_ID',
            'NEXTAUTH_URL'
        ];

        const missing = [];
        
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar] || process.env[envVar].includes('REPLACE_WITH')) {
                missing.push(envVar);
            }
        }

        if (missing.length > 0) {
            this.log(`❌ Missing or incomplete environment variables: ${missing.join(', ')}`, 'error');
            this.log('Please update your .env.production file with actual values', 'error');
            return false;
        }

        // Validate Stripe keys
        if (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
            this.log('⚠️  Warning: Using test Stripe key in production', 'warn');
        } else if (process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
            this.log('✅ Using live Stripe key for production', 'info');
        } else {
            this.log('❌ Invalid Stripe secret key format', 'error');
            return false;
        }

        this.log('✅ Environment validation passed');
        return true;
    }

    async runCommand(command, args = [], options = {}) {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, { 
                stdio: 'pipe', 
                shell: true,
                ...options 
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                if (options.verbose !== false) {
                    process.stdout.write(output);
                }
            });

            child.stderr.on('data', (data) => {
                const output = data.toString();
                stderr += output;
                if (options.verbose !== false) {
                    process.stderr.write(output);
                }
            });

            child.on('close', (code) => {
                if (code === 0) {
                    resolve({ stdout, stderr, code });
                } else {
                    reject({ stdout, stderr, code });
                }
            });
        });
    }

    async buildApplication() {
        this.log('🔨 Building application for production...');
        
        try {
            // Clean previous builds
            await this.runCommand('npm', ['run', 'clean']);
            
            // Run production build
            const buildResult = await this.runCommand('npm', ['run', 'build:production']);
            
            this.log('✅ Production build completed successfully');
            return true;
        } catch (error) {
            this.log(`❌ Build failed: ${error.stderr || error.message}`, 'error');
            return false;
        }
    }

    async deployToVercel() {
        this.log('🚀 Deploying to Vercel production...');
        
        try {
            // Deploy with environment variables
            const deployResult = await this.runCommand('vercel', [
                '--prod', 
                '--confirm',
                '--env', `NODE_ENV=production`
            ]);
            
            // Extract deployment URL from output
            const deploymentUrl = this.extractDeploymentUrl(deployResult.stdout);
            if (deploymentUrl) {
                this.baseUrl = deploymentUrl;
                this.log(`✅ Deployment successful: ${deploymentUrl}`);
            }
            
            return true;
        } catch (error) {
            this.log(`❌ Vercel deployment failed: ${error.stderr || error.message}`, 'error');
            return false;
        }
    }

    extractDeploymentUrl(output) {
        const lines = output.split('\n');
        for (const line of lines) {
            if (line.includes('https://') && (line.includes('vercel.app') || line.includes('.com'))) {
                const match = line.match(/https:\/\/[^\s]+/);
                return match ? match[0] : null;
            }
        }
        return null;
    }

    async healthCheck(endpoint) {
        return new Promise((resolve) => {
            const url = `${this.baseUrl}${endpoint}`;
            const client = url.startsWith('https://') ? https : http;
            
            const req = client.get(url, { timeout: 10000 }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        endpoint,
                        status: res.statusCode,
                        success: res.statusCode >= 200 && res.statusCode < 400,
                        response: data,
                        responseTime: Date.now()
                    });
                });
            });
            
            req.on('error', (error) => {
                resolve({
                    endpoint,
                    status: 0,
                    success: false,
                    error: error.message,
                    responseTime: Date.now()
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve({
                    endpoint,
                    status: 0,
                    success: false,
                    error: 'Request timeout',
                    responseTime: Date.now()
                });
            });
        });
    }

    async validateDeployment() {
        this.log('🔍 Running post-deployment health checks...');
        
        // Wait for deployment to be ready
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        const results = [];
        let successCount = 0;
        
        for (const endpoint of this.healthCheckEndpoints) {
            this.log(`Testing ${endpoint}...`);
            const result = await this.healthCheck(endpoint);
            results.push(result);
            
            if (result.success) {
                this.log(`✅ ${endpoint} - Status: ${result.status}`, 'info');
                successCount++;
            } else {
                this.log(`❌ ${endpoint} - Error: ${result.error || result.status}`, 'error');
            }
        }

        const healthScore = (successCount / this.healthCheckEndpoints.length) * 10;
        this.log(`📊 Health Check Score: ${healthScore.toFixed(1)}/10`);
        
        return {
            score: healthScore,
            results,
            passed: successCount >= 2 // At least 2/3 endpoints must work
        };
    }

    async testCriticalFlows() {
        this.log('🧪 Testing critical user flows...');
        
        const tests = [];
        
        // Test 1: API Analysis Endpoint
        try {
            const analysisTest = await this.healthCheck('/api/analyze?url=https://example.com&tier=starter');
            tests.push({
                name: 'API Analysis Flow',
                success: analysisTest.success,
                details: analysisTest
            });
        } catch (error) {
            tests.push({
                name: 'API Analysis Flow',
                success: false,
                error: error.message
            });
        }

        // Test 2: Stripe Checkout Creation
        try {
            const checkoutTest = await this.testStripeIntegration();
            tests.push({
                name: 'Stripe Checkout Integration',
                success: checkoutTest.success,
                details: checkoutTest
            });
        } catch (error) {
            tests.push({
                name: 'Stripe Checkout Integration',
                success: false,
                error: error.message
            });
        }

        const passedTests = tests.filter(t => t.success).length;
        const flowScore = (passedTests / tests.length) * 10;
        
        this.log(`📊 Critical Flow Score: ${flowScore.toFixed(1)}/10`);
        
        return {
            score: flowScore,
            tests,
            passed: passedTests >= 1 // At least 1 critical flow must work
        };
    }

    async testStripeIntegration() {
        return new Promise((resolve) => {
            const postData = JSON.stringify({
                tier: 'starter'
            });

            const options = {
                hostname: this.baseUrl.replace('https://', '').replace('http://', ''),
                port: this.baseUrl.startsWith('https://') ? 443 : 80,
                path: '/api/create-checkout-session',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(postData)
                }
            };

            const client = this.baseUrl.startsWith('https://') ? https : http;
            const req = client.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        success: res.statusCode === 200,
                        status: res.statusCode,
                        response: data
                    });
                });
            });

            req.on('error', (error) => {
                resolve({
                    success: false,
                    error: error.message
                });
            });

            req.write(postData);
            req.end();
        });
    }

    async generateDeploymentReport() {
        const deploymentTime = Math.round((Date.now() - this.startTime) / 1000);
        
        const report = {
            deploymentId: this.deploymentId,
            timestamp: new Date().toISOString(),
            deploymentTime: `${deploymentTime}s`,
            baseUrl: this.baseUrl,
            environment: process.env.NODE_ENV,
            log: this.deploymentLog
        };

        const reportPath = path.join(__dirname, '..', 'deployment-reports', `${this.deploymentId}.json`);
        
        // Ensure reports directory exists
        await fs.mkdir(path.dirname(reportPath), { recursive: true });
        
        // Write report
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        this.log(`📄 Deployment report saved: ${reportPath}`);
        return report;
    }

    async deploy() {
        this.log(`🚀 Starting production deployment: ${this.deploymentId}`);
        
        try {
            // Step 1: Validate environment
            const envValid = await this.validateEnvironment();
            if (!envValid) {
                throw new Error('Environment validation failed');
            }

            // Step 2: Build application
            const buildSuccess = await this.buildApplication();
            if (!buildSuccess) {
                throw new Error('Application build failed');
            }

            // Step 3: Deploy to Vercel
            const deploySuccess = await this.deployToVercel();
            if (!deploySuccess) {
                throw new Error('Deployment to Vercel failed');
            }

            // Step 4: Validate deployment
            const healthCheck = await this.validateDeployment();
            const flowCheck = await this.testCriticalFlows();

            // Step 5: Calculate overall score
            const overallScore = ((healthCheck.score + flowCheck.score) / 2);
            
            this.log(`📊 Final Launch Readiness Score: ${overallScore.toFixed(1)}/10`);
            
            // Step 6: Generate report
            await this.generateDeploymentReport();

            if (overallScore >= 8.0) {
                this.log('🎉 Deployment successful! Application meets 8.0/10 launch readiness criteria');
                this.log(`🌐 Production URL: ${this.baseUrl}`);
                return true;
            } else {
                this.log(`⚠️  Deployment completed but score (${overallScore.toFixed(1)}/10) below target`, 'warn');
                return false;
            }

        } catch (error) {
            this.log(`❌ Deployment failed: ${error.message}`, 'error');
            await this.generateDeploymentReport();
            return false;
        }
    }
}

// Run deployment if called directly
if (require.main === module) {
    const deployment = new ProductionDeployment();
    deployment.deploy().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = ProductionDeployment;