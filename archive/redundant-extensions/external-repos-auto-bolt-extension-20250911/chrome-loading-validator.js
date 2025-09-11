/**
 * Chrome Extension Loading Validator
 * Comprehensive validation script for Chrome Developer Mode loading
 */

const fs = require('fs');
const path = require('path');

const EXTENSION_DIR = 'C:\\Users\\Ben\\auto-bolt-extension\\build\\auto-bolt-extension';

class ChromeLoadingValidator {
    constructor() {
        this.results = {
            manifestValidation: { passed: false, issues: [] },
            fileExistence: { passed: false, issues: [] },
            syntaxValidation: { passed: false, issues: [] },
            permissionsValidation: { passed: false, issues: [] },
            overallStatus: 'PENDING'
        };
    }

    validateManifest() {
        console.log('🔍 Validating manifest.json...');
        
        const manifestPath = path.join(EXTENSION_DIR, 'manifest.json');
        
        if (!fs.existsSync(manifestPath)) {
            this.results.manifestValidation.issues.push('manifest.json not found');
            return;
        }

        try {
            const manifestContent = fs.readFileSync(manifestPath, 'utf8');
            const manifest = JSON.parse(manifestContent);

            // Check required fields
            const requiredFields = ['manifest_version', 'name', 'version'];
            for (const field of requiredFields) {
                if (!manifest[field]) {
                    this.results.manifestValidation.issues.push(`Missing required field: ${field}`);
                }
            }

            // Check manifest version
            if (manifest.manifest_version !== 3) {
                this.results.manifestValidation.issues.push(`Expected manifest_version 3, got ${manifest.manifest_version}`);
            }

            // Check action configuration
            if (!manifest.action || !manifest.action.default_popup) {
                this.results.manifestValidation.issues.push('Missing action.default_popup configuration');
            }

            // Check background script
            if (!manifest.background || !manifest.background.service_worker) {
                this.results.manifestValidation.issues.push('Missing background.service_worker configuration');
            }

            if (this.results.manifestValidation.issues.length === 0) {
                this.results.manifestValidation.passed = true;
                console.log('✅ Manifest validation passed');
            } else {
                console.log('❌ Manifest validation failed:', this.results.manifestValidation.issues);
            }

        } catch (error) {
            this.results.manifestValidation.issues.push(`JSON parsing error: ${error.message}`);
            console.log('❌ Manifest JSON parsing failed:', error.message);
        }
    }

    validateFileExistence() {
        console.log('🔍 Validating file existence...');

        const manifestPath = path.join(EXTENSION_DIR, 'manifest.json');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        const filesToCheck = [
            // Popup files
            manifest.action?.default_popup,
            'popup.js',
            'popup.css',
            
            // Icons
            ...(manifest.icons ? Object.values(manifest.icons) : []),
            ...(manifest.action?.default_icon ? Object.values(manifest.action.default_icon) : []),
            
            // Background script
            manifest.background?.service_worker,
            
            // Content scripts
            ...(manifest.content_scripts ? manifest.content_scripts.flatMap(cs => cs.js || []) : []),
            
            // Web accessible resources
            ...(manifest.web_accessible_resources ? 
                manifest.web_accessible_resources.flatMap(war => war.resources || []) : [])
        ];

        for (const file of filesToCheck.filter(Boolean)) {
            const filePath = path.join(EXTENSION_DIR, file);
            if (!fs.existsSync(filePath)) {
                this.results.fileExistence.issues.push(`Missing file: ${file}`);
            }
        }

        if (this.results.fileExistence.issues.length === 0) {
            this.results.fileExistence.passed = true;
            console.log('✅ File existence validation passed');
        } else {
            console.log('❌ File existence validation failed:', this.results.fileExistence.issues);
        }
    }

    validateSyntax() {
        console.log('🔍 Validating JavaScript syntax...');

        const jsFiles = [
            'popup.js',
            'background-batch.js',
            'content.js',
            'directory-form-filler.js',
            'queue-processor.js',
            'directory-registry.js'
        ];

        for (const file of jsFiles) {
            const filePath = path.join(EXTENSION_DIR, file);
            if (fs.existsSync(filePath)) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    // Basic syntax check using eval (in try-catch)
                    new Function(content);
                } catch (error) {
                    this.results.syntaxValidation.issues.push(`Syntax error in ${file}: ${error.message}`);
                }
            }
        }

        if (this.results.syntaxValidation.issues.length === 0) {
            this.results.syntaxValidation.passed = true;
            console.log('✅ Syntax validation passed');
        } else {
            console.log('❌ Syntax validation failed:', this.results.syntaxValidation.issues);
        }
    }

    validatePermissions() {
        console.log('🔍 Validating permissions...');

        const manifestPath = path.join(EXTENSION_DIR, 'manifest.json');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        const validPermissions = [
            'activeTab', 'storage', 'scripting', 'tabs', 'alarms', 
            'background', 'bookmarks', 'contextMenus', 'cookies',
            'downloads', 'history', 'identity', 'management',
            'notifications', 'permissions', 'system.storage',
            'topSites', 'webNavigation', 'webRequest'
        ];

        const permissions = manifest.permissions || [];
        const hostPermissions = manifest.host_permissions || [];

        // Check permissions
        for (const permission of permissions) {
            if (!validPermissions.includes(permission)) {
                this.results.permissionsValidation.issues.push(`Invalid permission: ${permission}`);
            }
        }

        // Check host permissions format
        for (const hostPerm of hostPermissions) {
            if (!hostPerm.includes('://')) {
                this.results.permissionsValidation.issues.push(`Invalid host permission format: ${hostPerm}`);
            }
        }

        if (this.results.permissionsValidation.issues.length === 0) {
            this.results.permissionsValidation.passed = true;
            console.log('✅ Permissions validation passed');
        } else {
            console.log('❌ Permissions validation failed:', this.results.permissionsValidation.issues);
        }
    }

    generateReport() {
        console.log('\n🔍 CHROME EXTENSION LOADING VALIDATION REPORT');
        console.log('='.repeat(50));

        const allPassed = Object.values(this.results)
            .filter(r => r.passed !== undefined)
            .every(r => r.passed);

        this.results.overallStatus = allPassed ? 'READY_FOR_LOADING' : 'ISSUES_FOUND';

        console.log(`\n📊 Overall Status: ${this.results.overallStatus}`);
        console.log('\n📋 Detailed Results:');

        for (const [category, result] of Object.entries(this.results)) {
            if (result.passed !== undefined) {
                const status = result.passed ? '✅ PASS' : '❌ FAIL';
                console.log(`  ${category}: ${status}`);
                if (result.issues.length > 0) {
                    result.issues.forEach(issue => console.log(`    - ${issue}`));
                }
            }
        }

        console.log('\n🚀 Chrome Developer Mode Loading Instructions:');
        console.log('1. Open Chrome and navigate to chrome://extensions/');
        console.log('2. Enable "Developer mode" toggle (top right)');
        console.log('3. Click "Load unpacked" button');
        console.log('4. Select directory: C:\\Users\\Ben\\auto-bolt-extension\\build\\auto-bolt-extension');
        console.log('5. Verify extension loads without errors');

        if (allPassed) {
            console.log('\n✅ Extension is ready for Chrome loading!');
        } else {
            console.log('\n❌ Fix the above issues before loading in Chrome.');
        }

        return this.results;
    }

    runValidation() {
        console.log('🚀 Starting Chrome Extension Loading Validation...\n');

        this.validateManifest();
        this.validateFileExistence();
        this.validateSyntax();
        this.validatePermissions();
        
        return this.generateReport();
    }
}

// Run validation if called directly
if (require.main === module) {
    const validator = new ChromeLoadingValidator();
    validator.runValidation();
}

module.exports = ChromeLoadingValidator;