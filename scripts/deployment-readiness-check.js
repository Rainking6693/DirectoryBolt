#!/usr/bin/env node

/**
 * DirectoryBolt Deployment Readiness Verification
 * Pre-deployment validation to ensure 8.0/10 readiness score
 * 
 * Usage: node scripts/deployment-readiness-check.js
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');

class DeploymentReadinessCheck {
    constructor() {
        this.checks = [];
        this.score = 0;
        this.maxScore = 10;
        this.requiredScore = 8.0;
    }

    log(message, level = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = level === 'error' ? '❌' : level === 'warn' ? '⚠️ ' : '✅';
        console.log(`[${timestamp}] ${prefix} ${message}`);
    }

    async runCommand(command, args = []) {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, { 
                stdio: 'pipe', 
                shell: true 
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                resolve({ stdout, stderr, code });
            });

            child.on('error', reject);
        });
    }

    async checkEnvironmentVariables() {
        this.log('🔍 Checking environment configuration...');
        
        const requiredVars = [
            'STRIPE_SECRET_KEY',
            'STRIPE_STARTER_PRICE_ID', 
            'STRIPE_GROWTH_PRICE_ID',
            'STRIPE_PROFESSIONAL_PRICE_ID',
            'STRIPE_ENTERPRISE_PRICE_ID',
            'NEXTAUTH_URL'
        ];

        let envFileExists = false;
        let validVars = 0;

        // Check if .env files exist
        try {
            await fs.access('.env.production');
            envFileExists = true;
            this.log('✅ .env.production file exists');
        } catch {
            this.log('❌ .env.production file missing', 'error');
        }

        try {
            await fs.access('.env.local');
            this.log('✅ .env.local file exists');
        } catch {
            this.log('⚠️  .env.local file missing - you may need to create it', 'warn');
        }

        // Check environment variables
        for (const envVar of requiredVars) {
            if (process.env[envVar] && !process.env[envVar].includes('REPLACE_WITH')) {
                validVars++;
                this.log(`✅ ${envVar} configured`);
            } else {
                this.log(`❌ ${envVar} missing or needs configuration`, 'error');
            }
        }

        const envScore = envFileExists && validVars === requiredVars.length ? 2.0 : 
                        envFileExists && validVars >= 3 ? 1.5 :
                        envFileExists ? 1.0 : 0;

        this.checks.push({
            name: 'Environment Configuration',
            score: envScore,
            maxScore: 2.0,
            passed: envScore >= 1.5,
            details: `${validVars}/${requiredVars.length} variables configured`
        });

        return envScore;
    }

    async checkProjectStructure() {
        this.log('📁 Checking project structure...');
        
        const criticalFiles = [
            'package.json',
            'next.config.js', 
            'vercel.json',
            'pages/api/health.ts',
            'pages/api/analyze.ts',
            'pages/api/create-checkout-session.js',
            'scripts/production-deployment.js',
            'scripts/production-monitor.js'
        ];

        let existingFiles = 0;

        for (const file of criticalFiles) {
            try {
                await fs.access(file);
                existingFiles++;
                this.log(`✅ ${file} exists`);
            } catch {
                this.log(`❌ ${file} missing`, 'error');
            }
        }

        const structureScore = (existingFiles / criticalFiles.length) * 1.5;

        this.checks.push({
            name: 'Project Structure',
            score: structureScore,
            maxScore: 1.5,
            passed: structureScore >= 1.2,
            details: `${existingFiles}/${criticalFiles.length} critical files present`
        });

        return structureScore;
    }

    async checkBuildCapability() {
        this.log('🔨 Testing build capability...');
        
        try {
            // Test if build completes successfully
            const buildResult = await this.runCommand('npm', ['run', 'build']);
            
            if (buildResult.code === 0) {
                this.log('✅ Production build successful');
                
                // Check if .next directory was created
                try {
                    await fs.access('.next');
                    this.log('✅ Build output directory created');
                    
                    const buildScore = 2.0;
                    this.checks.push({
                        name: 'Build Capability',
                        score: buildScore,
                        maxScore: 2.0,
                        passed: true,
                        details: 'Production build completed successfully'
                    });
                    
                    return buildScore;
                } catch {
                    this.log('⚠️  Build completed but no .next directory found', 'warn');
                    
                    const buildScore = 1.5;
                    this.checks.push({
                        name: 'Build Capability',
                        score: buildScore,
                        maxScore: 2.0,
                        passed: false,
                        details: 'Build completed but output directory missing'
                    });
                    
                    return buildScore;
                }
            } else {
                this.log('❌ Build failed', 'error');
                this.log(`Build error: ${buildResult.stderr}`, 'error');
                
                const buildScore = 0;
                this.checks.push({
                    name: 'Build Capability',
                    score: buildScore,
                    maxScore: 2.0,
                    passed: false,
                    details: 'Production build failed'
                });
                
                return buildScore;
            }
        } catch (error) {
            this.log(`❌ Build test failed: ${error.message}`, 'error');
            
            const buildScore = 0;
            this.checks.push({
                name: 'Build Capability',
                score: buildScore,
                maxScore: 2.0,
                passed: false,
                details: `Build test error: ${error.message}`
            });
            
            return buildScore;
        }
    }

    async checkDependencies() {
        this.log('📦 Checking dependencies...');
        
        try {
            const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
            
            const criticalDeps = [
                'next',
                'react', 
                'stripe',
                'axios'
            ];
            
            let installedDeps = 0;
            
            for (const dep of criticalDeps) {
                if (packageJson.dependencies && packageJson.dependencies[dep]) {
                    installedDeps++;
                    this.log(`✅ ${dep} dependency present`);
                } else {
                    this.log(`❌ ${dep} dependency missing`, 'error');
                }
            }
            
            // Test if node_modules is installed
            try {
                await fs.access('node_modules');
                this.log('✅ node_modules installed');
                installedDeps += 1;
            } catch {
                this.log('❌ node_modules missing - run npm install', 'error');
            }
            
            const depScore = (installedDeps / (criticalDeps.length + 1)) * 1.5;
            
            this.checks.push({
                name: 'Dependencies',
                score: depScore,
                maxScore: 1.5,
                passed: depScore >= 1.2,
                details: `${installedDeps}/${criticalDeps.length + 1} critical dependencies ready`
            });
            
            return depScore;
        } catch (error) {
            this.log(`❌ Failed to check dependencies: ${error.message}`, 'error');
            
            const depScore = 0;
            this.checks.push({
                name: 'Dependencies',
                score: depScore,
                maxScore: 1.5,
                passed: false,
                details: 'Failed to read package.json'
            });
            
            return depScore;
        }
    }

    async checkApiEndpoints() {
        this.log('🔗 Checking API endpoints...');
        
        const endpoints = [
            'pages/api/health.ts',
            'pages/api/analyze.ts', 
            'pages/api/create-checkout-session.js'
        ];
        
        let validEndpoints = 0;
        
        for (const endpoint of endpoints) {
            try {
                const content = await fs.readFile(endpoint, 'utf8');
                
                // Basic validation - check if it exports a handler
                if (content.includes('export default') || content.includes('module.exports')) {
                    validEndpoints++;
                    this.log(`✅ ${endpoint} has valid handler`);
                } else {
                    this.log(`⚠️  ${endpoint} may be missing handler`, 'warn');
                }
            } catch {
                this.log(`❌ ${endpoint} not found or unreadable`, 'error');
            }
        }
        
        const apiScore = (validEndpoints / endpoints.length) * 1.5;
        
        this.checks.push({
            name: 'API Endpoints',
            score: apiScore,
            maxScore: 1.5,
            passed: validEndpoints >= 2,
            details: `${validEndpoints}/${endpoints.length} critical API endpoints ready`
        });
        
        return apiScore;
    }

    async checkDeploymentScripts() {
        this.log('📜 Checking deployment scripts...');
        
        const scripts = [
            'scripts/production-deployment.js',
            'scripts/production-monitor.js'
        ];
        
        let validScripts = 0;
        
        for (const script of scripts) {
            try {
                const content = await fs.readFile(script, 'utf8');
                
                // Check if script is executable
                if (content.includes('class') && content.includes('module.exports')) {
                    validScripts++;
                    this.log(`✅ ${script} ready`);
                } else {
                    this.log(`⚠️  ${script} may have issues`, 'warn');
                }
            } catch {
                this.log(`❌ ${script} not found`, 'error');
            }
        }
        
        const scriptScore = (validScripts / scripts.length) * 1.5;
        
        this.checks.push({
            name: 'Deployment Scripts',
            score: scriptScore,
            maxScore: 1.5,
            passed: validScripts === scripts.length,
            details: `${validScripts}/${scripts.length} deployment scripts ready`
        });
        
        return scriptScore;
    }

    async generateReadinessReport() {
        const totalScore = this.checks.reduce((sum, check) => sum + check.score, 0);
        const totalMaxScore = this.checks.reduce((sum, check) => sum + check.maxScore, 0);
        const finalScore = (totalScore / totalMaxScore) * 10;
        
        const report = {
            timestamp: new Date().toISOString(),
            overallScore: finalScore,
            requiredScore: this.requiredScore,
            passed: finalScore >= this.requiredScore,
            checks: this.checks,
            summary: {
                totalChecks: this.checks.length,
                passedChecks: this.checks.filter(c => c.passed).length,
                failedChecks: this.checks.filter(c => !c.passed).length
            }
        };
        
        // Save report
        await fs.mkdir('deployment-reports', { recursive: true });
        const reportPath = path.join('deployment-reports', 'readiness-check.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        return report;
    }

    async runReadinessCheck() {
        this.log('🚀 Starting DirectoryBolt deployment readiness check...');
        
        try {
            // Run all checks
            await this.checkEnvironmentVariables();
            await this.checkProjectStructure();
            await this.checkDependencies();
            await this.checkApiEndpoints();
            await this.checkDeploymentScripts();
            await this.checkBuildCapability();
            
            // Generate report
            const report = await this.generateReadinessReport();
            
            // Display results
            console.log('\n📊 DEPLOYMENT READINESS REPORT');
            console.log('================================');
            console.log(`Overall Score: ${report.overallScore.toFixed(1)}/10`);
            console.log(`Required Score: ${report.requiredScore}/10`);
            console.log(`Status: ${report.passed ? '✅ READY FOR DEPLOYMENT' : '❌ NOT READY'}`);
            
            console.log('\nCheck Details:');
            for (const check of report.checks) {
                const status = check.passed ? '✅' : '❌';
                console.log(`${status} ${check.name}: ${check.score.toFixed(1)}/${check.maxScore} - ${check.details}`);
            }
            
            if (report.passed) {
                console.log('\n🎉 DirectoryBolt is ready for production deployment!');
                console.log('Next steps:');
                console.log('1. Configure your Stripe keys in .env.local');
                console.log('2. Run: npm run deploy:production');
                console.log('3. Start monitoring: npm run deploy:monitor');
            } else {
                console.log('\n⚠️  Please resolve the issues above before deploying to production.');
            }
            
            return report.passed;
            
        } catch (error) {
            this.log(`❌ Readiness check failed: ${error.message}`, 'error');
            return false;
        }
    }
}

// Run if called directly
if (require.main === module) {
    const checker = new DeploymentReadinessCheck();
    checker.runReadinessCheck().then(ready => {
        process.exit(ready ? 0 : 1);
    });
}

module.exports = DeploymentReadinessCheck;