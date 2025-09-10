/**
 * SECURITY AUDIT TEST SUITE
 * Comprehensive security testing for DirectoryBolt
 * Focuses on API endpoint security, authentication vulnerabilities, and exposed credentials
 */

const fs = require('fs');
const path = require('path');

class SecurityAuditSuite {
    constructor() {
        this.findings = [];
        this.projectRoot = __dirname;
    }

    log(category, severity, finding, details = null, recommendation = null) {
        const entry = {
            timestamp: new Date().toISOString(),
            category,
            severity, // 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'
            finding,
            details,
            recommendation
        };

        this.findings.push(entry);

        const emoji = {
            'CRITICAL': '🚨',
            'HIGH': '🔴',
            'MEDIUM': '🟡',
            'LOW': '🟢',
            'INFO': 'ℹ️'
        }[severity] || '⚪';

        console.log(`${emoji} [${severity}] ${category}: ${finding}`);
        if (details) {
            console.log(`   Details: ${details}`);
        }
        if (recommendation) {
            console.log(`   Recommendation: ${recommendation}`);
        }
    }

    /**
     * Test 1: Scan for exposed API keys and secrets
     */
    async scanForExposedSecrets() {
        console.log('\n🔍 Scanning for Exposed API Keys and Secrets...');

        const sensitivePatterns = [
            { name: 'Stripe Secret Key', pattern: /sk_live_[a-zA-Z0-9]{99,}/, severity: 'CRITICAL' },
            { name: 'Stripe Test Key', pattern: /sk_test_[a-zA-Z0-9]{99,}/, severity: 'HIGH' },
            { name: 'OpenAI API Key', pattern: /sk-[a-zA-Z0-9]{48}/, severity: 'HIGH' },
            { name: 'Airtable API Key', pattern: /key[a-zA-Z0-9]{14}/, severity: 'HIGH' },
            { name: 'Airtable PAT', pattern: /pat[a-zA-Z0-9.]{32,}/, severity: 'HIGH' },
            { name: 'JWT Secret', pattern: /jwt[_-]?secret.{0,10}[=:]\s*['""]?[a-zA-Z0-9+/=]{20,}/, severity: 'MEDIUM' },
            { name: 'Database URL', pattern: /postgres:\/\/[^\\s]+/, severity: 'MEDIUM' },
            { name: 'Generic API Key', pattern: /api[_-]?key.{0,10}[=:]\s*['""]?[a-zA-Z0-9]{20,}/, severity: 'LOW' }
        ];

        const filesToScan = [
            '.env',
            '.env.local',
            '.env.production',
            'next.config.js',
            'package.json'
        ];

        // Also scan JavaScript/TypeScript files in pages/api
        const apiFiles = this.getApiFiles();

        const allFiles = [...filesToScan, ...apiFiles];

        for (const file of allFiles) {
            const filePath = path.join(this.projectRoot, file);
            
            try {
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    for (const pattern of sensitivePatterns) {
                        const matches = content.match(pattern.pattern);
                        if (matches) {
                            this.log(
                                'Exposed Secrets',
                                pattern.severity,
                                `${pattern.name} found in ${file}`,
                                `Pattern matched: ${matches[0].substring(0, 20)}...`,
                                'Remove or move to secure environment variables'
                            );
                        }
                    }

                    // Check for placeholder values that should be replaced
                    const placeholders = [
                        'your_api_key_here',
                        'your_stripe_key_here',
                        'your_openai_key_here',
                        'your_airtable_access_token_here'
                    ];

                    for (const placeholder of placeholders) {
                        if (content.includes(placeholder)) {
                            this.log(
                                'Configuration',
                                'MEDIUM',
                                `Placeholder value found in ${file}`,
                                `Placeholder: ${placeholder}`,
                                'Replace with actual values or ensure this is not in production'
                            );
                        }
                    }
                }
            } catch (error) {
                this.log(
                    'File Access',
                    'LOW',
                    `Could not read file: ${file}`,
                    error.message
                );
            }
        }
    }

    /**
     * Test 2: Check for exposed debug endpoints
     */
    async scanDebugEndpoints() {
        console.log('\n🔍 Scanning for Debug Endpoints...');

        const debugEndpoints = [
            'pages/api/debug.env.js',
            'pages/api/config.js',
            'pages/api/test.js',
            'pages/api/env-test.js',
            'pages/api/test-airtable.js'
        ];

        for (const endpoint of debugEndpoints) {
            const filePath = path.join(this.projectRoot, endpoint);
            
            if (fs.existsSync(filePath)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    // Check if endpoint exposes sensitive information
                    if (content.includes('process.env') || content.includes('console.log')) {
                        this.log(
                            'Debug Endpoints',
                            'HIGH',
                            `Debug endpoint found: ${endpoint}`,
                            'May expose environment variables or sensitive data',
                            'Remove debug endpoints from production or secure them'
                        );
                    }

                    // Check if endpoint is accessible in production
                    if (!content.includes('NODE_ENV') || !content.includes('development')) {
                        this.log(
                            'Debug Endpoints',
                            'MEDIUM',
                            `Debug endpoint not properly protected: ${endpoint}`,
                            'Endpoint may be accessible in production',
                            'Add NODE_ENV checks to restrict to development only'
                        );
                    }
                } catch (error) {
                    this.log(
                        'Debug Endpoints',
                        'LOW',
                        `Could not analyze debug endpoint: ${endpoint}`,
                        error.message
                    );
                }
            }
        }
    }

    /**
     * Test 3: Authentication security analysis
     */
    async analyzeAuthenticationSecurity() {
        console.log('\n🔍 Analyzing Authentication Security...');

        const authFiles = [
            'pages/api/auth/login.ts',
            'pages/api/auth/register.ts',
            'pages/api/extension/validate.ts'
        ];

        for (const file of authFiles) {
            const filePath = path.join(this.projectRoot, file);
            
            if (fs.existsSync(filePath)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');

                    // Check for rate limiting
                    if (content.includes('rateLimit') || content.includes('rate-limit')) {
                        this.log(
                            'Authentication Security',
                            'INFO',
                            `Rate limiting implemented in ${file}`,
                            'Good security practice'
                        );
                    } else {
                        this.log(
                            'Authentication Security',
                            'HIGH',
                            `No rate limiting found in ${file}`,
                            'Missing protection against brute force attacks',
                            'Implement rate limiting for authentication endpoints'
                        );
                    }

                    // Check for password hashing
                    if (content.includes('bcrypt') || content.includes('hash')) {
                        this.log(
                            'Authentication Security',
                            'INFO',
                            `Password hashing implemented in ${file}`,
                            'Good security practice'
                        );
                    } else if (content.includes('password')) {
                        this.log(
                            'Authentication Security',
                            'CRITICAL',
                            `Plain text password handling in ${file}`,
                            'Passwords may not be properly hashed',
                            'Implement proper password hashing with bcrypt'
                        );
                    }

                    // Check for JWT token security
                    if (content.includes('JWT_SECRET') || content.includes('jwt')) {
                        if (content.includes('process.env.JWT_SECRET')) {
                            this.log(
                                'Authentication Security',
                                'INFO',
                                `JWT secret properly configured in ${file}`,
                                'Using environment variable'
                            );
                        } else {
                            this.log(
                                'Authentication Security',
                                'HIGH',
                                `Hardcoded JWT secret in ${file}`,
                                'JWT secret should be in environment variables',
                                'Move JWT secret to environment variables'
                            );
                        }
                    }

                    // Check for SQL injection protection
                    if (content.includes('SELECT') || content.includes('UPDATE') || content.includes('INSERT')) {
                        if (content.includes('parameterized') || content.includes('prepared')) {
                            this.log(
                                'Authentication Security',
                                'INFO',
                                `Parameterized queries used in ${file}`,
                                'Good SQL injection protection'
                            );
                        } else {
                            this.log(
                                'Authentication Security',
                                'HIGH',
                                `Potential SQL injection vulnerability in ${file}`,
                                'Raw SQL queries detected',
                                'Use parameterized queries to prevent SQL injection'
                            );
                        }
                    }

                } catch (error) {
                    this.log(
                        'Authentication Security',
                        'LOW',
                        `Could not analyze authentication file: ${file}`,
                        error.message
                    );
                }
            }
        }
    }

    /**
     * Test 4: Check CORS and security headers
     */
    async checkSecurityHeaders() {
        console.log('\n🔍 Checking Security Headers Configuration...');

        const configFiles = [
            'next.config.js',
            'pages/_app.tsx',
            'netlify.toml'
        ];

        for (const file of configFiles) {
            const filePath = path.join(this.projectRoot, file);
            
            if (fs.existsSync(filePath)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');

                    // Check for security headers
                    const securityHeaders = [
                        'X-Content-Type-Options',
                        'X-Frame-Options',
                        'X-XSS-Protection',
                        'Strict-Transport-Security',
                        'Content-Security-Policy'
                    ];

                    let headersFound = 0;
                    for (const header of securityHeaders) {
                        if (content.includes(header)) {
                            headersFound++;
                            this.log(
                                'Security Headers',
                                'INFO',
                                `${header} configured in ${file}`,
                                'Good security practice'
                            );
                        }
                    }

                    if (headersFound === 0) {
                        this.log(
                            'Security Headers',
                            'MEDIUM',
                            `No security headers found in ${file}`,
                            'Missing important security headers',
                            'Add security headers to prevent common attacks'
                        );
                    }

                    // Check CORS configuration
                    if (content.includes('cors') || content.includes('CORS')) {
                        if (content.includes('*')) {
                            this.log(
                                'CORS Configuration',
                                'HIGH',
                                `Overly permissive CORS in ${file}`,
                                'Wildcard CORS allows any origin',
                                'Restrict CORS to specific trusted domains'
                            );
                        } else {
                            this.log(
                                'CORS Configuration',
                                'INFO',
                                `CORS properly configured in ${file}`,
                                'Restricted to specific origins'
                            );
                        }
                    }

                } catch (error) {
                    this.log(
                        'Security Headers',
                        'LOW',
                        `Could not analyze config file: ${file}`,
                        error.message
                    );
                }
            }
        }
    }

    /**
     * Test 5: Dependency vulnerability scan
     */
    async scanDependencyVulnerabilities() {
        console.log('\n🔍 Scanning for Dependency Vulnerabilities...');

        const packageJsonPath = path.join(this.projectRoot, 'package.json');
        
        if (fs.existsSync(packageJsonPath)) {
            try {
                const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
                const packageData = JSON.parse(packageContent);

                // Check for known vulnerable packages
                const vulnerablePackages = [
                    { name: 'lodash', version: '<4.17.21', issue: 'Prototype pollution vulnerability' },
                    { name: 'axios', version: '<0.21.1', issue: 'SSRF vulnerability' },
                    { name: 'express', version: '<4.17.1', issue: 'Various security issues' },
                    { name: 'next', version: '<12.0.0', issue: 'XSS and other vulnerabilities' }
                ];

                const dependencies = { ...packageData.dependencies, ...packageData.devDependencies };

                for (const [depName, depVersion] of Object.entries(dependencies)) {
                    const vulnerable = vulnerablePackages.find(vp => vp.name === depName);
                    if (vulnerable) {
                        this.log(
                            'Dependency Vulnerabilities',
                            'HIGH',
                            `Potentially vulnerable dependency: ${depName}@${depVersion}`,
                            vulnerable.issue,
                            'Update to latest secure version'
                        );
                    }
                }

                // Check for outdated critical packages
                const criticalPackages = ['next', 'react', 'stripe', 'airtable'];
                for (const pkg of criticalPackages) {
                    if (dependencies[pkg]) {
                        this.log(
                            'Dependency Audit',
                            'INFO',
                            `Critical package found: ${pkg}@${dependencies[pkg]}`,
                            'Ensure this is the latest secure version'
                        );
                    }
                }

            } catch (error) {
                this.log(
                    'Dependency Vulnerabilities',
                    'LOW',
                    'Could not analyze package.json',
                    error.message
                );
            }
        }
    }

    /**
     * Test 6: Check for exposed customer data
     */
    async scanForExposedCustomerData() {
        console.log('\n🔍 Scanning for Exposed Customer Data...');

        const dataFiles = [
            'data/',
            'public/',
            '.next/static/',
            'pages/api/'
        ];

        const customerDataPatterns = [
            { name: 'Email Address', pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, severity: 'MEDIUM' },
            { name: 'Phone Number', pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, severity: 'MEDIUM' },
            { name: 'Credit Card', pattern: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, severity: 'CRITICAL' },
            { name: 'SSN', pattern: /\b\d{3}-\d{2}-\d{4}\b/, severity: 'CRITICAL' },
            { name: 'Customer ID', pattern: /DIR-\d{6}-[a-zA-Z0-9]+/, severity: 'LOW' }
        ];

        for (const dir of dataFiles) {
            const dirPath = path.join(this.projectRoot, dir);
            
            if (fs.existsSync(dirPath)) {
                try {
                    this.scanDirectoryForPatterns(dirPath, customerDataPatterns);
                } catch (error) {
                    this.log(
                        'Customer Data Scan',
                        'LOW',
                        `Could not scan directory: ${dir}`,
                        error.message
                    );
                }
            }
        }
    }

    /**
     * Helper: Get all API files
     */
    getApiFiles() {
        const apiDir = path.join(this.projectRoot, 'pages/api');
        const files = [];

        if (fs.existsSync(apiDir)) {
            const scan = (dir) => {
                const items = fs.readdirSync(dir);
                for (const item of items) {
                    const fullPath = path.join(dir, item);
                    const stat = fs.statSync(fullPath);
                    if (stat.isDirectory()) {
                        scan(fullPath);
                    } else if (item.endsWith('.js') || item.endsWith('.ts')) {
                        files.push(path.relative(this.projectRoot, fullPath));
                    }
                }
            };
            scan(apiDir);
        }

        return files;
    }

    /**
     * Helper: Scan directory for patterns
     */
    scanDirectoryForPatterns(dirPath, patterns) {
        const scan = (dir) => {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                
                if (stat.isDirectory() && !item.startsWith('.')) {
                    scan(fullPath);
                } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.ts') || item.endsWith('.json'))) {
                    try {
                        const content = fs.readFileSync(fullPath, 'utf8');
                        const relativePath = path.relative(this.projectRoot, fullPath);
                        
                        for (const pattern of patterns) {
                            const matches = content.match(pattern.pattern);
                            if (matches && !this.isTestData(content, matches[0])) {
                                this.log(
                                    'Exposed Customer Data',
                                    pattern.severity,
                                    `${pattern.name} found in ${relativePath}`,
                                    `Pattern: ${matches[0]}`,
                                    'Remove or anonymize customer data from code'
                                );
                            }
                        }
                    } catch (error) {
                        // Skip files that can't be read
                    }
                }
            }
        };

        if (fs.existsSync(dirPath)) {
            scan(dirPath);
        }
    }

    /**
     * Helper: Check if data appears to be test/dummy data
     */
    isTestData(content, match) {
        const testIndicators = [
            'test@example.com',
            'demo@',
            'sample@',
            '555-0123',
            '4111111111111111',
            'DIR-000000-',
            'DIR-123456-'
        ];

        return testIndicators.some(indicator => 
            content.includes(indicator) || match.includes(indicator)
        );
    }

    /**
     * Generate security report
     */
    generateSecurityReport() {
        const severityCounts = {
            CRITICAL: this.findings.filter(f => f.severity === 'CRITICAL').length,
            HIGH: this.findings.filter(f => f.severity === 'HIGH').length,
            MEDIUM: this.findings.filter(f => f.severity === 'MEDIUM').length,
            LOW: this.findings.filter(f => f.severity === 'LOW').length,
            INFO: this.findings.filter(f => f.severity === 'INFO').length
        };

        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFindings: this.findings.length,
                severityBreakdown: severityCounts,
                riskLevel: this.calculateRiskLevel(severityCounts)
            },
            findings: this.findings,
            recommendations: this.generateRecommendations(severityCounts)
        };

        return report;
    }

    /**
     * Calculate overall risk level
     */
    calculateRiskLevel(counts) {
        if (counts.CRITICAL > 0) return 'CRITICAL';
        if (counts.HIGH > 2) return 'HIGH';
        if (counts.HIGH > 0 || counts.MEDIUM > 5) return 'MEDIUM';
        if (counts.MEDIUM > 0 || counts.LOW > 10) return 'LOW';
        return 'MINIMAL';
    }

    /**
     * Generate security recommendations
     */
    generateRecommendations(counts) {
        const recommendations = [];

        if (counts.CRITICAL > 0) {
            recommendations.push('URGENT: Address all critical security issues immediately before any deployment');
        }

        if (counts.HIGH > 0) {
            recommendations.push('HIGH PRIORITY: Fix high-severity issues within 24 hours');
        }

        recommendations.push('Implement a security review process for all code changes');
        recommendations.push('Set up automated security scanning in CI/CD pipeline');
        recommendations.push('Regular security audits and penetration testing');
        recommendations.push('Security training for all developers');

        return recommendations;
    }

    /**
     * Run complete security audit
     */
    async runCompleteAudit() {
        console.log('🚀 Starting Security Audit Suite');
        console.log('='.repeat(60));

        await this.scanForExposedSecrets();
        await this.scanDebugEndpoints();
        await this.analyzeAuthenticationSecurity();
        await this.checkSecurityHeaders();
        await this.scanDependencyVulnerabilities();
        await this.scanForExposedCustomerData();

        console.log('\n' + '='.repeat(60));
        console.log('📊 SECURITY AUDIT SUMMARY');
        console.log('='.repeat(60));

        const report = this.generateSecurityReport();

        console.log(`Total Findings: ${report.summary.totalFindings}`);
        console.log(`Risk Level: ${report.summary.riskLevel}`);
        console.log('\nSeverity Breakdown:');
        Object.entries(report.summary.severityBreakdown).forEach(([severity, count]) => {
            if (count > 0) {
                console.log(`  ${severity}: ${count}`);
            }
        });

        if (report.recommendations.length > 0) {
            console.log('\n📋 SECURITY RECOMMENDATIONS:');
            report.recommendations.forEach((rec, index) => {
                console.log(`${index + 1}. ${rec}`);
            });
        }

        return report;
    }
}

// Export for use as module
module.exports = SecurityAuditSuite;

// Run audit if called directly
if (require.main === module) {
    const audit = new SecurityAuditSuite();
    audit.runCompleteAudit().then(report => {
        // Save report
        const reportPath = `security-audit-report-${Date.now()}.json`;
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Security report saved to: ${reportPath}`);
        
        process.exit(report.summary.riskLevel === 'CRITICAL' ? 1 : 0);
    }).catch(error => {
        console.error('❌ Security audit failed:', error);
        process.exit(1);
    });
}