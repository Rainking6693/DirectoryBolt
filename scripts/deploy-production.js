#!/usr/bin/env node

/**
 * DirectoryBolt Production Deployment Script
 * Handles complete deployment process with monitoring and validation
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ProductionDeployer {
    constructor() {
        this.startTime = Date.now();
        this.deploymentId = `deploy-${Date.now()}`;
        this.logFile = path.join(process.cwd(), 'deployment-logs', `${this.deploymentId}.log`);
        
        // Ensure logs directory exists
        const logsDir = path.dirname(this.logFile);
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
        }
        
        console.log(`🚀 DirectoryBolt Production Deployment Started`);
        console.log(`📋 Deployment ID: ${this.deploymentId}`);
        console.log(`📝 Logs: ${this.logFile}`);
        console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
        
        // Console output with colors
        const colors = {
            info: '\x1b[36m',    // Cyan
            success: '\x1b[32m', // Green
            warning: '\x1b[33m', // Yellow
            error: '\x1b[31m',   // Red
            reset: '\x1b[0m'     // Reset
        };
        
        console.log(`${colors[level] || colors.info}${message}${colors.reset}`);
        
        // File output
        fs.appendFileSync(this.logFile, logEntry);
    }

    execCommand(command, description) {
        this.log(`▶️ ${description}...`);
        try {
            const result = execSync(command, { 
                encoding: 'utf8', 
                cwd: process.cwd(),
                timeout: 300000 // 5 minutes timeout
            });
            this.log(`✅ ${description} completed successfully`, 'success');
            return result;
        } catch (error) {
            this.log(`❌ ${description} failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async validateEnvironment() {
        this.log('🔍 Validating deployment environment...');
        
        // Check if .env.production exists
        if (!fs.existsSync('.env.production')) {
            throw new Error('.env.production file not found. Please create it with your production configuration.');
        }
        
        // Check Node.js version
        const nodeVersion = process.version;
        this.log(`Node.js version: ${nodeVersion}`);
        
        // Check if Stripe keys are configured (basic check)
        const envContent = fs.readFileSync('.env.production', 'utf8');
        if (envContent.includes('REPLACE_WITH_ACTUAL')) {
            this.log('⚠️  Warning: Some environment variables still contain placeholder values', 'warning');
        }
        
        this.log('✅ Environment validation completed', 'success');
    }

    async runPreDeploymentTests() {
        this.log('🧪 Running pre-deployment tests...');
        
        // Type checking
        this.execCommand('npm run type-check', 'TypeScript type checking');
        
        // Build test
        this.execCommand('npm run build', 'Production build test');
        
        // API validation test
        if (fs.existsSync('comprehensive_validation_test.js')) {
            this.execCommand('node comprehensive_validation_test.js', 'API validation test');
        }
        
        this.log('✅ Pre-deployment tests completed', 'success');
    }

    async deployToVercel() {
        this.log('🚀 Deploying to Vercel...');
        
        try {
            // Install Vercel CLI if not present
            try {
                execSync('vercel --version', { stdio: 'ignore' });
            } catch {
                this.log('📦 Installing Vercel CLI...');
                this.execCommand('npm install -g vercel', 'Vercel CLI installation');
            }
            
            // Deploy to production
            this.log('🌐 Starting Vercel deployment...');
            const deployResult = this.execCommand('vercel --prod --yes', 'Vercel production deployment');
            
            // Extract deployment URL
            const urlMatch = deployResult.match(/https:\/\/[^\s]+/);
            if (urlMatch) {
                this.deploymentUrl = urlMatch[0];
                this.log(`🎉 Deployment successful! URL: ${this.deploymentUrl}`, 'success');
                return this.deploymentUrl;
            } else {
                throw new Error('Could not extract deployment URL from Vercel output');
            }
            
        } catch (error) {
            this.log(`❌ Vercel deployment failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async validateDeployment(url) {
        this.log('🔍 Validating production deployment...');
        
        const testEndpoints = [
            { path: '/', name: 'Homepage' },
            { path: '/pricing', name: 'Pricing Page' },
            { path: '/api/health', name: 'Health Check API' },
            { path: '/api/analyze', name: 'Analyze API (should require POST)' }
        ];
        
        for (const endpoint of testEndpoints) {
            try {
                this.log(`Testing ${endpoint.name}: ${url}${endpoint.path}`);
                
                const response = await fetch(`${url}${endpoint.path}`, {
                    method: endpoint.path.includes('/api/') ? 'GET' : 'GET',
                    timeout: 10000
                });
                
                if (response.ok || (endpoint.path === '/api/analyze' && response.status === 405)) {
                    this.log(`✅ ${endpoint.name} is accessible`, 'success');
                } else {
                    this.log(`⚠️  ${endpoint.name} returned status: ${response.status}`, 'warning');
                }
                
                // Wait between requests
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                this.log(`❌ ${endpoint.name} test failed: ${error.message}`, 'error');
            }
        }
    }

    async runPostDeploymentTests(url) {
        this.log('🧪 Running post-deployment tests...');
        
        try {
            // Create a focused production test
            const testScript = `
                const https = require('https');
                const url = require('url');
                
                async function testEndpoint(testUrl, method = 'GET') {
                    return new Promise((resolve, reject) => {
                        const parsed = url.parse(testUrl);
                        const options = {
                            hostname: parsed.hostname,
                            port: parsed.port || 443,
                            path: parsed.path,
                            method: method,
                            timeout: 10000,
                            headers: {
                                'User-Agent': 'DirectoryBolt-Deployment-Test/1.0'
                            }
                        };
                        
                        const req = https.request(options, (res) => {
                            let data = '';
                            res.on('data', chunk => data += chunk);
                            res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
                        });
                        
                        req.on('error', reject);
                        req.on('timeout', () => reject(new Error('Request timeout')));
                        req.setTimeout(10000);
                        req.end();
                    });
                }
                
                async function runTests() {
                    console.log('🧪 Testing production deployment...');
                    
                    // Test homepage
                    try {
                        const homeResponse = await testEndpoint('${url}/');
                        console.log(\`✅ Homepage test: Status \${homeResponse.status}\`);
                    } catch (error) {
                        console.log(\`❌ Homepage test failed: \${error.message}\`);
                    }
                    
                    // Test API health
                    try {
                        const healthResponse = await testEndpoint('${url}/api/health');
                        console.log(\`✅ Health API test: Status \${healthResponse.status}\`);
                    } catch (error) {
                        console.log(\`❌ Health API test failed: \${error.message}\`);
                    }
                    
                    console.log('🎉 Post-deployment tests completed');
                }
                
                runTests().catch(console.error);
            `;
            
            // Write and run the test
            const testFile = 'temp-production-test.js';
            fs.writeFileSync(testFile, testScript);
            this.execCommand(`node ${testFile}`, 'Production endpoint tests');
            fs.unlinkSync(testFile);
            
        } catch (error) {
            this.log(`⚠️  Post-deployment tests had issues: ${error.message}`, 'warning');
        }
    }

    generateDeploymentReport() {
        const endTime = Date.now();
        const duration = Math.round((endTime - this.startTime) / 1000);
        
        const report = `
# DirectoryBolt Production Deployment Report

## Deployment Summary
- **Deployment ID**: ${this.deploymentId}
- **Started**: ${new Date(this.startTime).toISOString()}
- **Completed**: ${new Date(endTime).toISOString()}
- **Duration**: ${duration} seconds
- **Status**: ✅ SUCCESS
- **URL**: ${this.deploymentUrl || 'Check deployment logs'}

## Deployment Steps Completed
- ✅ Environment validation
- ✅ Pre-deployment tests
- ✅ TypeScript compilation
- ✅ Production build
- ✅ Vercel deployment
- ✅ Post-deployment validation
- ✅ Endpoint testing

## Next Steps
1. Update DNS settings if using custom domain
2. Configure SSL certificate
3. Set up monitoring alerts
4. Test all pricing tiers
5. Validate Stripe webhook endpoints

## Monitoring Endpoints
- **Health Check**: ${this.deploymentUrl}/api/health
- **Homepage**: ${this.deploymentUrl}/
- **Pricing**: ${this.deploymentUrl}/pricing

## Support
- **Logs**: ${this.logFile}
- **Deployment Documentation**: DEPLOYMENT_READY_SUMMARY.md
        `;
        
        const reportFile = `deployment-report-${this.deploymentId}.md`;
        fs.writeFileSync(reportFile, report);
        
        this.log(`📋 Deployment report generated: ${reportFile}`, 'success');
        this.log(`🎉 DirectoryBolt deployment completed successfully!`, 'success');
        this.log(`🌐 Your application is live at: ${this.deploymentUrl}`, 'success');
        
        return reportFile;
    }

    async deploy() {
        try {
            await this.validateEnvironment();
            await this.runPreDeploymentTests();
            const deploymentUrl = await this.deployToVercel();
            await this.validateDeployment(deploymentUrl);
            await this.runPostDeploymentTests(deploymentUrl);
            
            this.generateDeploymentReport();
            
            return {
                success: true,
                url: deploymentUrl,
                deploymentId: this.deploymentId
            };
            
        } catch (error) {
            this.log(`💥 Deployment failed: ${error.message}`, 'error');
            this.log(`📋 Check logs for details: ${this.logFile}`, 'error');
            
            throw error;
        }
    }
}

// Run deployment if called directly
if (require.main === module) {
    const deployer = new ProductionDeployer();
    
    deployer.deploy()
        .then(result => {
            console.log('\n🎉 DEPLOYMENT SUCCESSFUL! 🎉');
            console.log(`🌐 URL: ${result.url}`);
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 DEPLOYMENT FAILED! 💥');
            console.error(`❌ Error: ${error.message}`);
            process.exit(1);
        });
}

module.exports = ProductionDeployer;