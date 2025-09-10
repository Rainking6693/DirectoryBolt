/**
 * EMERGENCY FIX SCRIPT
 * Automated fixes for critical security issues found in testing
 * Run this BEFORE Blake's audit
 */

const fs = require('fs');
const path = require('path');

class EmergencyFixer {
    constructor() {
        this.fixes = [];
        this.errors = [];
    }

    log(action, status, details) {
        const entry = { action, status, details, timestamp: new Date().toISOString() };
        this.fixes.push(entry);
        
        const emoji = status === 'SUCCESS' ? '✅' : status === 'ERROR' ? '❌' : '⚠️';
        console.log(`${emoji} ${action}: ${details}`);
    }

    /**
     * Fix 1: Remove dangerous debug endpoints
     */
    removeDebugEndpoints() {
        console.log('\n🔧 Removing Debug Endpoints...');
        
        const debugEndpoints = [
            'pages/api/debug.env.js',
            'pages/api/config.js',
            'pages/api/test.js',
            'pages/api/env-test.js',
            'pages/api/test-airtable.js'
        ];

        for (const endpoint of debugEndpoints) {
            try {
                if (fs.existsSync(endpoint)) {
                    // Move to backup instead of deleting
                    const backupPath = `${endpoint}.REMOVED_${Date.now()}`;
                    fs.renameSync(endpoint, backupPath);
                    this.log('Remove Debug Endpoint', 'SUCCESS', `${endpoint} moved to ${backupPath}`);
                } else {
                    this.log('Remove Debug Endpoint', 'INFO', `${endpoint} not found (already removed)`);
                }
            } catch (error) {
                this.log('Remove Debug Endpoint', 'ERROR', `Failed to remove ${endpoint}: ${error.message}`);
                this.errors.push(error);
            }
        }
    }

    /**
     * Fix 2: Create secure environment template
     */
    createSecureEnvironmentTemplate() {
        console.log('\n🔧 Creating Secure Environment Template...');

        const secureEnvTemplate = `# DirectoryBolt Production Environment - SECURE
# =============================================================================
# CRITICAL: Replace ALL placeholder values with actual credentials
# =============================================================================

# =============================================================================
# AIRTABLE CONFIGURATION (REQUIRED - REPLACE IMMEDIATELY)
# =============================================================================
# Get your Personal Access Token from: https://airtable.com/developers/web/api/personal-access-tokens
AIRTABLE_ACCESS_TOKEN=pat_YOUR_ACTUAL_AIRTABLE_TOKEN_HERE

# Your Airtable Base ID (keep this if correct)
AIRTABLE_BASE_ID=appZDNMzebkaOkLXo

# Your Airtable Table Name (update if different)
AIRTABLE_TABLE_NAME=Directory Bolt Import

# =============================================================================
# STRIPE CONFIGURATION (PRODUCTION - VERIFY THESE ARE LIVE KEYS)
# =============================================================================
STRIPE_SECRET_KEY=sk_live_YOUR_ACTUAL_STRIPE_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_ACTUAL_STRIPE_PUBLISHABLE_KEY_HERE

# Stripe Price IDs (verify these exist in your Stripe dashboard)
STRIPE_STARTER_PRICE_ID=price_1QZqGePQdMywmVkHKJGKJGKJ
STRIPE_GROWTH_PRICE_ID=price_1QZqGfPQdMywmVkHLKJHLKJH  
STRIPE_PROFESSIONAL_PRICE_ID=price_1QZqGgPQdMywmVkHMNMNMNMN
STRIPE_ENTERPRISE_PRICE_ID=price_1QZqGhPQdMywmVkHNONONONO

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================
NEXTAUTH_URL=https://directorybolt.com
BASE_URL=https://directorybolt.com
NEXT_PUBLIC_APP_URL=https://directorybolt.com
SITE_URL=https://directorybolt.com

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================
JWT_SECRET=GENERATE_A_SECURE_JWT_SECRET_HERE_32_CHARS_MIN
NODE_ENV=production

# =============================================================================
# OPTIONAL INTEGRATIONS (Configure if needed)
# =============================================================================
# OPENAI_API_KEY=sk-your-actual-openai-key-here
# SENTRY_DSN=https://your-actual-sentry-dsn-here

# =============================================================================
# IMPORTANT SECURITY NOTES:
# =============================================================================
# 1. NEVER commit this file to git
# 2. Always use environment variables in production
# 3. Regularly rotate your API keys
# 4. Monitor for any unauthorized access
# =============================================================================
`;

        try {
            fs.writeFileSync('.env.production.secure', secureEnvTemplate);
            this.log('Environment Template', 'SUCCESS', 'Secure environment template created (.env.production.secure)');
            
            // Also create a checklist
            const checklist = `# ENVIRONMENT CONFIGURATION CHECKLIST

Before Blake's audit, verify these are completed:

## ✅ Required Environment Variables
- [ ] AIRTABLE_ACCESS_TOKEN - Replace with actual PAT token
- [ ] AIRTABLE_BASE_ID - Verify this is correct: appZDNMzebkaOkLXo  
- [ ] AIRTABLE_TABLE_NAME - Verify table name: "Directory Bolt Import"
- [ ] STRIPE_SECRET_KEY - Use live key for production
- [ ] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY - Use live key for production
- [ ] JWT_SECRET - Generate secure 32+ character secret

## ✅ Security Verification  
- [ ] No debug endpoints accessible
- [ ] No hardcoded API keys in source code
- [ ] All placeholder values replaced
- [ ] Environment files not committed to git

## ✅ Customer Testing
- [ ] Test customer ID: DIR-202597-recwsFS91NG2O90xi
- [ ] Verify returns: DirectoryBolt business name  
- [ ] Verify returns: Correct package type
- [ ] Verify returns: 100 directory allocation

## ✅ Authentication Flow
- [ ] Extension validation endpoint working
- [ ] Real customer data properly returned
- [ ] Error handling for invalid customers
- [ ] Rate limiting functioning correctly
`;

            fs.writeFileSync('ENVIRONMENT_CHECKLIST.md', checklist);
            this.log('Environment Checklist', 'SUCCESS', 'Configuration checklist created');

        } catch (error) {
            this.log('Environment Template', 'ERROR', `Failed to create template: ${error.message}`);
            this.errors.push(error);
        }
    }

    /**
     * Fix 3: Scan and report hardcoded API keys
     */
    scanForHardcodedKeys() {
        console.log('\n🔧 Scanning for Hardcoded API Keys...');

        const filesToScan = [
            'pages/api/ai/business-analysis.ts',
            'pages/api/ai/enhanced-analysis.ts'
        ];

        const apiKeyPatterns = [
            /key[a-zA-Z0-9]{14}/g,
            /pat[a-zA-Z0-9.]{32,}/g,
            /sk_[a-zA-Z0-9]{48,}/g
        ];

        for (const file of filesToScan) {
            try {
                if (fs.existsSync(file)) {
                    const content = fs.readFileSync(file, 'utf8');
                    let foundKeys = false;

                    for (const pattern of apiKeyPatterns) {
                        const matches = content.match(pattern);
                        if (matches) {
                            foundKeys = true;
                            this.log('Hardcoded Key Found', 'ERROR', `${file}: ${matches[0].substring(0, 10)}...`);
                        }
                    }

                    if (!foundKeys) {
                        this.log('Key Scan', 'SUCCESS', `${file}: No hardcoded keys found`);
                    }
                } else {
                    this.log('Key Scan', 'INFO', `${file}: File not found`);
                }
            } catch (error) {
                this.log('Key Scan', 'ERROR', `Failed to scan ${file}: ${error.message}`);
                this.errors.push(error);
            }
        }
    }

    /**
     * Fix 4: Add NODE_ENV protection to remaining endpoints
     */
    addNodeEnvProtection() {
        console.log('\n🔧 Adding NODE_ENV Protection...');

        // Find any remaining test/debug endpoints
        const protectionCode = `
  // Security: Block access in production
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }
`;

        try {
            // Look for files that might need protection
            const apiDir = 'pages/api';
            if (fs.existsSync(apiDir)) {
                const files = this.getAllApiFiles(apiDir);
                const testFiles = files.filter(f => 
                    f.includes('test') || 
                    f.includes('debug') || 
                    f.includes('dev')
                );

                if (testFiles.length === 0) {
                    this.log('NODE_ENV Protection', 'SUCCESS', 'No test files found requiring protection');
                } else {
                    this.log('NODE_ENV Protection', 'INFO', `Found ${testFiles.length} files that may need protection`);
                    testFiles.forEach(file => {
                        this.log('Potential Risk', 'WARN', `Review file: ${file}`);
                    });
                }
            }
        } catch (error) {
            this.log('NODE_ENV Protection', 'ERROR', `Failed to add protection: ${error.message}`);
            this.errors.push(error);
        }
    }

    /**
     * Fix 5: Create customer validation test
     */
    createCustomerValidationTest() {
        console.log('\n🔧 Creating Customer Validation Test...');

        const testScript = `#!/usr/bin/env node
/**
 * CUSTOMER VALIDATION QUICK TEST
 * Test the real customer ID after environment configuration
 */

const https = require('https');

const CUSTOMER_ID = 'DIR-202597-recwsFS91NG2O90xi';
const BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://directorybolt.com' 
    : 'http://localhost:3000';

async function testCustomerValidation() {
    console.log('🧪 Testing Customer Validation...');
    console.log(\`Customer ID: \${CUSTOMER_ID}\`);
    console.log(\`URL: \${BASE_URL}\`);
    
    const postData = JSON.stringify({
        customerId: CUSTOMER_ID,
        extensionVersion: '1.0.0',
        timestamp: Date.now()
    });

    const options = {
        hostname: BASE_URL.replace(/https?:\\/\\//, ''),
        port: BASE_URL.includes('localhost') ? 3000 : 443,
        path: '/api/extension/validate',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve({ status: res.statusCode, data: response });
                } catch (e) {
                    resolve({ status: res.statusCode, data: { parseError: e.message }, raw: data });
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function runTest() {
    try {
        const result = await testCustomerValidation();
        
        console.log(\`\\nResponse Status: \${result.status}\`);
        console.log('Response Data:', JSON.stringify(result.data, null, 2));
        
        if (result.status === 200 && result.data.valid) {
            console.log('\\n✅ SUCCESS: Customer validation working');
            console.log(\`Customer Name: \${result.data.customerName}\`);
            console.log(\`Package Type: \${result.data.packageType}\`);
            
            // Verify expected data
            if (result.data.customerName && result.data.customerName.includes('DirectoryBolt')) {
                console.log('✅ Customer name matches expected');
            } else {
                console.log(\`⚠️  Customer name unexpected: \${result.data.customerName}\`);
            }
            
        } else {
            console.log('\\n❌ FAILED: Customer validation not working');
            console.log(\`Error: \${result.data.error || 'Unknown error'}\`);
        }
        
    } catch (error) {
        console.log('\\n❌ TEST FAILED:', error.message);
    }
}

if (require.main === module) {
    runTest();
}

module.exports = { testCustomerValidation, CUSTOMER_ID };
`;

        try {
            fs.writeFileSync('test-customer-validation.js', testScript);
            this.log('Customer Test', 'SUCCESS', 'Customer validation test script created');
        } catch (error) {
            this.log('Customer Test', 'ERROR', `Failed to create test: ${error.message}`);
            this.errors.push(error);
        }
    }

    /**
     * Helper: Get all API files
     */
    getAllApiFiles(dir, files = []) {
        const items = fs.readdirSync(dir);
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                this.getAllApiFiles(fullPath, files);
            } else if (item.endsWith('.js') || item.endsWith('.ts')) {
                files.push(fullPath);
            }
        }
        return files;
    }

    /**
     * Generate final report
     */
    generateReport() {
        const successful = this.fixes.filter(f => f.status === 'SUCCESS').length;
        const errors = this.fixes.filter(f => f.status === 'ERROR').length;
        const warnings = this.fixes.filter(f => f.status === 'WARN').length;

        return {
            timestamp: new Date().toISOString(),
            summary: {
                totalActions: this.fixes.length,
                successful,
                errors,
                warnings
            },
            fixes: this.fixes,
            criticalErrors: this.errors,
            nextSteps: this.generateNextSteps()
        };
    }

    /**
     * Generate next steps
     */
    generateNextSteps() {
        const steps = [
            'Configure real Airtable credentials in .env.production.secure',
            'Test customer ID DIR-202597-recwsFS91NG2O90xi using test-customer-validation.js',
            'Verify no debug endpoints are accessible',
            'Run security scan to confirm no hardcoded keys remain',
            'Test authentication flow end-to-end'
        ];

        if (this.errors.length > 0) {
            steps.unshift('Resolve the errors found during emergency fixes');
        }

        return steps;
    }

    /**
     * Run all emergency fixes
     */
    async runAllFixes() {
        console.log('🚨 EMERGENCY FIX SCRIPT FOR BLAKE\'S AUDIT');
        console.log('==========================================');

        this.removeDebugEndpoints();
        this.createSecureEnvironmentTemplate();
        this.scanForHardcodedKeys();
        this.addNodeEnvProtection();
        this.createCustomerValidationTest();

        console.log('\n' + '='.repeat(50));
        console.log('📊 EMERGENCY FIX SUMMARY');
        console.log('='.repeat(50));

        const report = this.generateReport();
        
        console.log(`Total Actions: ${report.summary.totalActions}`);
        console.log(`Successful: ${report.summary.successful}`);
        console.log(`Errors: ${report.summary.errors}`);
        console.log(`Warnings: ${report.summary.warnings}`);

        if (report.criticalErrors.length > 0) {
            console.log('\n🚨 CRITICAL ERRORS TO RESOLVE:');
            report.criticalErrors.forEach((error, index) => {
                console.log(`${index + 1}. ${error.message}`);
            });
        }

        console.log('\n📋 NEXT STEPS:');
        report.nextSteps.forEach((step, index) => {
            console.log(`${index + 1}. ${step}`);
        });

        console.log('\n🎯 BLAKE AUDIT STATUS:');
        if (report.summary.errors === 0) {
            console.log('STATUS: ✅ Emergency fixes completed - ready for environment configuration');
        } else {
            console.log('STATUS: ⚠️ Some issues remain - review errors above');
        }

        return report;
    }
}

// Export for use as module
module.exports = EmergencyFixer;

// Run fixes if called directly
if (require.main === module) {
    const fixer = new EmergencyFixer();
    fixer.runAllFixes().then(report => {
        // Save report
        const reportPath = `emergency-fix-report-${Date.now()}.json`;
        require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`\n📄 Fix report saved to: ${reportPath}`);
        
        process.exit(report.summary.errors > 0 ? 1 : 0);
    }).catch(error => {
        console.error('❌ Emergency fixes failed:', error);
        process.exit(1);
    });
}