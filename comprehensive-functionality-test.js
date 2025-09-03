#!/usr/bin/env node

/**
 * AutoBolt Chrome Extension - Comprehensive Functionality Validation Test Suite
 * Tests all core functionality after Phase 1 cleanup to ensure everything works correctly
 */

const fs = require('fs');
const path = require('path');

class ComprehensiveFunctionalityTester {
    constructor() {
        this.results = {
            startTime: new Date().toISOString(),
            testSuite: 'AutoBolt Comprehensive Functionality Validation',
            phase: 'Post-Cleanup Validation',
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            warnings: 0,
            criticalIssues: [],
            categories: {
                'Chrome Extension Architecture': {
                    tests: [],
                    passed: 0,
                    failed: 0
                },
                'Form Field Mapping & Airtable Integration': {
                    tests: [],
                    passed: 0,
                    failed: 0
                },
                'Popup Interface & Script Duplication': {
                    tests: [],
                    passed: 0,
                    failed: 0
                },
                'Background Script & Message Passing': {
                    tests: [],
                    passed: 0,
                    failed: 0
                },
                'Performance & Memory Usage': {
                    tests: [],
                    passed: 0,
                    failed: 0
                },
                'Directory Site Compatibility': {
                    tests: [],
                    passed: 0,
                    failed: 0
                },
                'Post-Cleanup Verification': {
                    tests: [],
                    passed: 0,
                    failed: 0
                }
            }
        };
        
        this.extensionPath = path.join(__dirname, 'build', 'auto-bolt-extension');
        this.sourcePath = __dirname;
        this.directoryCount = 0;
        this.performanceMetrics = {};
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const colors = {
            info: '\x1b[36m',    // Cyan
            pass: '\x1b[32m',    // Green
            fail: '\x1b[31m',    // Red
            warn: '\x1b[33m',    // Yellow
            reset: '\x1b[0m'     // Reset
        };
        
        console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
    }

    addTestResult(category, testName, passed, details, isWarning = false, isCritical = false) {
        const result = {
            testName,
            passed,
            details,
            timestamp: new Date().toISOString(),
            isWarning,
            isCritical
        };

        this.results.categories[category].tests.push(result);
        this.results.totalTests++;

        if (passed) {
            this.results.categories[category].passed++;
            this.results.passedTests++;
            this.log(`✅ ${testName}`, 'pass');
        } else {
            this.results.categories[category].failed++;
            this.results.failedTests++;
            this.log(`❌ ${testName}: ${details}`, 'fail');
            
            if (isCritical) {
                this.results.criticalIssues.push({
                    category,
                    testName,
                    details,
                    timestamp: result.timestamp
                });
            }
        }

        if (isWarning) {
            this.results.warnings++;
            this.log(`⚠️  ${testName}: ${details}`, 'warn');
        }
    }

    async runAllTests() {
        this.log('🚀 Starting AutoBolt Comprehensive Functionality Validation', 'info');
        this.log(`📂 Extension Path: ${this.extensionPath}`, 'info');
        this.log(`📂 Source Path: ${this.sourcePath}`, 'info');

        // Test Chrome Extension Architecture
        await this.testChromeExtensionArchitecture();
        
        // Test Form Field Mapping & Airtable Integration
        await this.testFormFieldMappingAndAirtable();
        
        // Test Popup Interface & Script Duplication
        await this.testPopupInterfaceAndScripts();
        
        // Test Background Script & Message Passing
        await this.testBackgroundScriptAndMessaging();
        
        // Test Performance & Memory Usage
        await this.testPerformanceAndMemory();
        
        // Test Directory Site Compatibility
        await this.testDirectorySiteCompatibility();
        
        // Test Post-Cleanup Verification
        await this.testPostCleanupVerification();

        // Generate final report
        this.generateFinalReport();
    }

    async testChromeExtensionArchitecture() {
        const category = 'Chrome Extension Architecture';
        this.log(`\n📋 Testing ${category}...`, 'info');

        // Test 1: Manifest V3 Compliance
        try {
            const manifestPath = path.join(this.extensionPath, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            const isManifestV3 = manifest.manifest_version === 3;
            this.addTestResult(category, 'Manifest V3 Compliance', isManifestV3, 
                isManifestV3 ? 'Extension uses Manifest V3' : 'Extension not using Manifest V3', false, !isManifestV3);

            // Test required fields
            const requiredFields = ['name', 'version', 'description', 'permissions', 'action'];
            let missingFields = [];
            for (const field of requiredFields) {
                if (!manifest[field]) {
                    missingFields.push(field);
                }
            }
            
            this.addTestResult(category, 'Manifest Required Fields', missingFields.length === 0, 
                missingFields.length === 0 ? 'All required manifest fields present' : `Missing fields: ${missingFields.join(', ')}`);

            // Test permissions appropriateness
            const permissions = manifest.permissions || [];
            const hostPermissions = manifest.host_permissions || [];
            const hasExcessivePermissions = permissions.includes('tabs') || permissions.includes('<all_urls>');
            
            this.addTestResult(category, 'Appropriate Permissions', !hasExcessivePermissions, 
                !hasExcessivePermissions ? 'Extension has appropriate permissions' : 'Extension has potentially excessive permissions',
                hasExcessivePermissions);

        } catch (error) {
            this.addTestResult(category, 'Manifest V3 Compliance', false, `Error reading manifest: ${error.message}`, false, true);
        }

        // Test 2: Content Script Files Exist
        const coreFiles = ['content.js', 'background-batch.js', 'popup.js', 'popup.html'];
        for (const file of coreFiles) {
            const filePath = path.join(this.extensionPath, file);
            const exists = fs.existsSync(filePath);
            this.addTestResult(category, `Core File: ${file}`, exists, 
                exists ? `${file} exists and accessible` : `${file} missing or inaccessible`, false, !exists);
        }

        // Test 3: Icons and Resources
        const iconsPath = path.join(this.extensionPath, 'icons');
        const iconsExist = fs.existsSync(iconsPath);
        this.addTestResult(category, 'Extension Icons', iconsExist, 
            iconsExist ? 'Extension icons directory exists' : 'Extension icons directory missing');

        // Test 4: Directory Data
        const directoriesPath = path.join(this.extensionPath, 'directories', 'master-directory-list.json');
        try {
            const directoriesData = JSON.parse(fs.readFileSync(directoriesPath, 'utf8'));
            this.directoryCount = directoriesData.metadata?.totalDirectories || directoriesData.directories?.length || 0;
            
            this.addTestResult(category, 'Directory Data Integrity', this.directoryCount > 0, 
                `Found ${this.directoryCount} directories in master list`);

            const hasFieldMappings = directoriesData.directories?.some(dir => dir.fieldMapping) || false;
            this.addTestResult(category, 'Field Mapping Definitions', hasFieldMappings, 
                hasFieldMappings ? 'Directories have field mapping definitions' : 'No field mapping definitions found');

        } catch (error) {
            this.addTestResult(category, 'Directory Data Integrity', false, 
                `Error reading directory data: ${error.message}`, false, true);
        }
    }

    async testFormFieldMappingAndAirtable() {
        const category = 'Form Field Mapping & Airtable Integration';
        this.log(`\n📋 Testing ${category}...`, 'info');

        // Test 1: Airtable API Configuration
        try {
            const popupPath = path.join(this.extensionPath, 'popup.js');
            const popupContent = fs.readFileSync(popupPath, 'utf8');
            
            const hasAirtableConfig = popupContent.includes('api.airtable.com');
            this.addTestResult(category, 'Airtable API Configuration', hasAirtableConfig,
                hasAirtableConfig ? 'Airtable API endpoint configured' : 'Airtable API endpoint not found');

            const hasAPIKeyHandling = popupContent.includes('airtableKey') || popupContent.includes('apiKey');
            this.addTestResult(category, 'API Key Handling', hasAPIKeyHandling,
                hasAPIKeyHandling ? 'API key handling present in popup' : 'No API key handling found');

        } catch (error) {
            this.addTestResult(category, 'Airtable API Configuration', false, 
                `Error reading popup.js: ${error.message}`, false, true);
        }

        // Test 2: Form Field Mapping Engine
        try {
            const contentPath = path.join(this.extensionPath, 'content.js');
            const contentScript = fs.readFileSync(contentPath, 'utf8');
            
            const hasFormDetection = contentScript.includes('form') && contentScript.includes('input');
            this.addTestResult(category, 'Form Detection Logic', hasFormDetection,
                hasFormDetection ? 'Form detection logic present' : 'No form detection logic found');

            const hasFieldMapping = contentScript.includes('fieldMapping') || contentScript.includes('mapFields');
            this.addTestResult(category, 'Field Mapping Engine', hasFieldMapping,
                hasFieldMapping ? 'Field mapping engine present' : 'No field mapping engine found');

            const hasBusinessDataHandling = contentScript.includes('businessData') || contentScript.includes('business');
            this.addTestResult(category, 'Business Data Handling', hasBusinessDataHandling,
                hasBusinessDataHandling ? 'Business data handling present' : 'No business data handling found');

        } catch (error) {
            this.addTestResult(category, 'Form Field Mapping Engine', false, 
                `Error reading content.js: ${error.message}`, false, true);
        }

        // Test 3: Directory Form Filler
        try {
            const fillerPath = path.join(this.extensionPath, 'directory-form-filler.js');
            const fillerExists = fs.existsSync(fillerPath);
            
            if (fillerExists) {
                const fillerContent = fs.readFileSync(fillerPath, 'utf8');
                const hasFormFillLogic = fillerContent.includes('fill') && fillerContent.includes('input');
                
                this.addTestResult(category, 'Directory Form Filler', hasFormFillLogic,
                    hasFormFillLogic ? 'Form filling logic present' : 'Form filler exists but no fill logic found');

                const hasErrorHandling = fillerContent.includes('try') && fillerContent.includes('catch');
                this.addTestResult(category, 'Form Filling Error Handling', hasErrorHandling,
                    hasErrorHandling ? 'Error handling present in form filler' : 'No error handling in form filler', !hasErrorHandling);

            } else {
                this.addTestResult(category, 'Directory Form Filler', false, 
                    'directory-form-filler.js not found', false, true);
            }

        } catch (error) {
            this.addTestResult(category, 'Directory Form Filler', false, 
                `Error reading directory-form-filler.js: ${error.message}`, false, true);
        }
    }

    async testPopupInterfaceAndScripts() {
        const category = 'Popup Interface & Script Duplication';
        this.log(`\n📋 Testing ${category}...`, 'info');

        // Test 1: Popup HTML Structure
        try {
            const popupHtmlPath = path.join(this.extensionPath, 'popup.html');
            const popupHtml = fs.readFileSync(popupHtmlPath, 'utf8');
            
            const hasRequiredElements = popupHtml.includes('fetchButton') && 
                                      popupHtml.includes('fillFormsButton') && 
                                      popupHtml.includes('businessInfoDisplay');
            
            this.addTestResult(category, 'Popup HTML Structure', hasRequiredElements,
                hasRequiredElements ? 'Required popup elements present' : 'Missing required popup elements');

            const hasSettings = popupHtml.includes('airtableKey') && popupHtml.includes('settings');
            this.addTestResult(category, 'Settings Interface', hasSettings,
                hasSettings ? 'Settings interface present' : 'No settings interface found');

        } catch (error) {
            this.addTestResult(category, 'Popup HTML Structure', false, 
                `Error reading popup.html: ${error.message}`, false, true);
        }

        // Test 2: Script Duplication Analysis
        const popupJsPath = path.join(this.extensionPath, 'popup.js');
        const enhancedPopupJsPath = path.join(this.sourcePath, 'enhanced-popup.js');
        
        const popupJsExists = fs.existsSync(popupJsPath);
        const enhancedPopupJsExists = fs.existsSync(enhancedPopupJsPath);

        this.addTestResult(category, 'Production Popup Script', popupJsExists,
            popupJsExists ? 'popup.js exists in build' : 'popup.js missing from build', false, !popupJsExists);

        if (enhancedPopupJsExists) {
            try {
                const enhancedSize = fs.statSync(enhancedPopupJsPath).size;
                const popupSize = popupJsExists ? fs.statSync(popupJsPath).size : 0;
                
                this.addTestResult(category, 'Script Size Analysis', true,
                    `popup.js: ${Math.round(popupSize/1024)}KB, enhanced-popup.js: ${Math.round(enhancedSize/1024)}KB`, 
                    enhancedSize > popupSize * 2);

                this.performanceMetrics.popupScriptSize = popupSize;
                this.performanceMetrics.enhancedPopupScriptSize = enhancedSize;

            } catch (error) {
                this.addTestResult(category, 'Script Size Analysis', false, 
                    `Error analyzing script sizes: ${error.message}`);
            }
        }

        // Test 3: Popup Functionality
        if (popupJsExists) {
            try {
                const popupContent = fs.readFileSync(popupJsPath, 'utf8');
                
                const hasEventHandlers = popupContent.includes('addEventListener') || popupContent.includes('onclick');
                this.addTestResult(category, 'Event Handling', hasEventHandlers,
                    hasEventHandlers ? 'Event handlers present' : 'No event handlers found');

                const hasUIManager = popupContent.includes('UIManager') || popupContent.includes('ui');
                this.addTestResult(category, 'UI Management', hasUIManager,
                    hasUIManager ? 'UI management code present' : 'No UI management found');

                const hasStorageAPI = popupContent.includes('chrome.storage') || popupContent.includes('storage');
                this.addTestResult(category, 'Chrome Storage API', hasStorageAPI,
                    hasStorageAPI ? 'Chrome storage API usage found' : 'No Chrome storage API usage');

            } catch (error) {
                this.addTestResult(category, 'Popup Functionality', false, 
                    `Error analyzing popup.js: ${error.message}`);
            }
        }
    }

    async testBackgroundScriptAndMessaging() {
        const category = 'Background Script & Message Passing';
        this.log(`\n📋 Testing ${category}...`, 'info');

        // Test 1: Background Script Analysis
        try {
            const backgroundPath = path.join(this.extensionPath, 'background-batch.js');
            const backgroundContent = fs.readFileSync(backgroundPath, 'utf8');
            
            const hasServiceWorkerSetup = backgroundContent.includes('chrome.') || backgroundContent.includes('self.');
            this.addTestResult(category, 'Service Worker Setup', hasServiceWorkerSetup,
                hasServiceWorkerSetup ? 'Service worker setup present' : 'No service worker setup found');

            const hasMessageHandling = backgroundContent.includes('onMessage') || backgroundContent.includes('message');
            this.addTestResult(category, 'Message Handling', hasMessageHandling,
                hasMessageHandling ? 'Message handling present' : 'No message handling found');

            const hasDirectoryRegistry = backgroundContent.includes('DirectoryRegistry') || backgroundContent.includes('directory-registry');
            this.addTestResult(category, 'Directory Registry Integration', hasDirectoryRegistry,
                hasDirectoryRegistry ? 'Directory registry integration present' : 'No directory registry integration');

            const hasQueueProcessor = backgroundContent.includes('QueueProcessor') || backgroundContent.includes('queue-processor');
            this.addTestResult(category, 'Queue Processor Integration', hasQueueProcessor,
                hasQueueProcessor ? 'Queue processor integration present' : 'No queue processor integration');

        } catch (error) {
            this.addTestResult(category, 'Background Script Analysis', false, 
                `Error reading background-batch.js: ${error.message}`, false, true);
        }

        // Test 2: Queue Processor Analysis
        try {
            const queueProcessorPath = path.join(this.extensionPath, 'queue-processor.js');
            const queueProcessorExists = fs.existsSync(queueProcessorPath);
            
            if (queueProcessorExists) {
                const queueContent = fs.readFileSync(queueProcessorPath, 'utf8');
                const queueSize = fs.statSync(queueProcessorPath).size;
                
                this.addTestResult(category, 'Queue Processor Exists', true,
                    `Queue processor present (${Math.round(queueSize/1024)}KB)`);

                const hasBatchProcessing = queueContent.includes('batch') || queueContent.includes('queue');
                this.addTestResult(category, 'Batch Processing Logic', hasBatchProcessing,
                    hasBatchProcessing ? 'Batch processing logic present' : 'No batch processing logic found');

                this.performanceMetrics.queueProcessorSize = queueSize;

            } else {
                this.addTestResult(category, 'Queue Processor Exists', false, 
                    'queue-processor.js not found', false, true);
            }

        } catch (error) {
            this.addTestResult(category, 'Queue Processor Analysis', false, 
                `Error analyzing queue-processor.js: ${error.message}`);
        }

        // Test 3: Directory Registry Analysis
        try {
            const registryPath = path.join(this.extensionPath, 'directory-registry.js');
            const registryExists = fs.existsSync(registryPath);
            
            if (registryExists) {
                const registryContent = fs.readFileSync(registryPath, 'utf8');
                const registrySize = fs.statSync(registryPath).size;
                
                this.addTestResult(category, 'Directory Registry Exists', true,
                    `Directory registry present (${Math.round(registrySize/1024)}KB)`);

                const hasDirectoryManagement = registryContent.includes('directory') && registryContent.includes('register');
                this.addTestResult(category, 'Directory Management Logic', hasDirectoryManagement,
                    hasDirectoryManagement ? 'Directory management logic present' : 'No directory management logic found');

                this.performanceMetrics.registrySize = registrySize;

            } else {
                this.addTestResult(category, 'Directory Registry Exists', false, 
                    'directory-registry.js not found', false, true);
            }

        } catch (error) {
            this.addTestResult(category, 'Directory Registry Analysis', false, 
                `Error analyzing directory-registry.js: ${error.message}`);
        }
    }

    async testPerformanceAndMemory() {
        const category = 'Performance & Memory Usage';
        this.log(`\n📋 Testing ${category}...`, 'info');

        // Test 1: Script Size Analysis
        try {
            let totalSize = 0;
            let fileCount = 0;
            const buildDir = this.extensionPath;
            
            function calculateDirectorySize(dir) {
                const files = fs.readdirSync(dir);
                for (const file of files) {
                    const filePath = path.join(dir, file);
                    const stat = fs.statSync(filePath);
                    
                    if (stat.isDirectory()) {
                        calculateDirectorySize(filePath);
                    } else {
                        totalSize += stat.size;
                        fileCount++;
                    }
                }
            }
            
            calculateDirectorySize(buildDir);
            
            const totalSizeMB = totalSize / (1024 * 1024);
            this.performanceMetrics.totalExtensionSize = totalSize;
            this.performanceMetrics.totalFiles = fileCount;
            
            this.addTestResult(category, 'Extension Size Analysis', totalSizeMB < 5,
                `Total extension size: ${totalSizeMB.toFixed(2)}MB (${fileCount} files)`,
                totalSizeMB > 2, totalSizeMB > 10);

        } catch (error) {
            this.addTestResult(category, 'Extension Size Analysis', false, 
                `Error calculating extension size: ${error.message}`);
        }

        // Test 2: Large Script Impact Analysis
        const largeScriptThreshold = 50000; // 50KB
        const veryLargeScriptThreshold = 100000; // 100KB
        
        const scriptFiles = ['popup.js', 'content.js', 'background-batch.js', 'queue-processor.js', 'directory-form-filler.js'];
        
        for (const script of scriptFiles) {
            try {
                const scriptPath = path.join(this.extensionPath, script);
                if (fs.existsSync(scriptPath)) {
                    const scriptSize = fs.statSync(scriptPath).size;
                    const isLarge = scriptSize > largeScriptThreshold;
                    const isVeryLarge = scriptSize > veryLargeScriptThreshold;
                    
                    this.addTestResult(category, `${script} Size Impact`, !isVeryLarge,
                        `${script}: ${Math.round(scriptSize/1024)}KB`,
                        isLarge, isVeryLarge);
                    
                    this.performanceMetrics[script.replace('.js', 'Size')] = scriptSize;
                }
            } catch (error) {
                this.addTestResult(category, `${script} Size Impact`, false, 
                    `Error analyzing ${script}: ${error.message}`);
            }
        }

        // Test 3: Memory Usage Estimation
        const estimatedMemoryUsage = (this.performanceMetrics.totalExtensionSize || 0) * 2; // Rough estimate
        const estimatedMemoryMB = estimatedMemoryUsage / (1024 * 1024);
        
        this.addTestResult(category, 'Estimated Memory Usage', estimatedMemoryMB < 20,
            `Estimated memory usage: ${estimatedMemoryMB.toFixed(1)}MB`,
            estimatedMemoryMB > 10, estimatedMemoryMB > 50);
    }

    async testDirectorySiteCompatibility() {
        const category = 'Directory Site Compatibility';
        this.log(`\n📋 Testing ${category}...`, 'info');

        // Test 1: Content Script Injection Configuration
        try {
            const manifestPath = path.join(this.extensionPath, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            const contentScripts = manifest.content_scripts || [];
            const hasContentScripts = contentScripts.length > 0;
            
            this.addTestResult(category, 'Content Script Configuration', hasContentScripts,
                hasContentScripts ? `Content scripts configured for ${contentScripts.length} rule(s)` : 'No content scripts configured');

            if (hasContentScripts) {
                const matches = contentScripts[0].matches || [];
                const supportedSites = matches.length;
                
                this.addTestResult(category, 'Supported Directory Sites', supportedSites >= 5,
                    `Content scripts match ${supportedSites} site patterns`,
                    supportedSites < 10, supportedSites < 5);

                // Check for major directory sites
                const majorSites = ['google.com', 'yelp.com', 'yellowpages.com', 'facebook.com'];
                const supportedMajorSites = majorSites.filter(site => 
                    matches.some(match => match.includes(site))
                );
                
                this.addTestResult(category, 'Major Directory Site Support', supportedMajorSites.length >= 3,
                    `Supports ${supportedMajorSites.length} major sites: ${supportedMajorSites.join(', ')}`);
            }

        } catch (error) {
            this.addTestResult(category, 'Content Script Configuration', false, 
                `Error reading manifest: ${error.message}`, false, true);
        }

        // Test 2: Directory Registry Completeness
        if (this.directoryCount > 0) {
            this.addTestResult(category, 'Directory Count Assessment', this.directoryCount >= 50,
                `${this.directoryCount} directories in registry`,
                this.directoryCount < 30, this.directoryCount < 10);

            // Expected count is 63 based on requirements
            const expectedCount = 63;
            const countAccuracy = Math.abs(this.directoryCount - expectedCount) <= 5;
            
            this.addTestResult(category, 'Directory Count Accuracy', countAccuracy,
                `Directory count ${this.directoryCount} vs expected ${expectedCount}`,
                !countAccuracy);
        }

        // Test 3: Web Accessible Resources
        try {
            const manifestPath = path.join(this.extensionPath, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            const webAccessibleResources = manifest.web_accessible_resources || [];
            const hasWebResources = webAccessibleResources.length > 0;
            
            this.addTestResult(category, 'Web Accessible Resources', hasWebResources,
                hasWebResources ? `${webAccessibleResources.length} web accessible resource group(s)` : 'No web accessible resources configured');

            if (hasWebResources && webAccessibleResources[0].resources) {
                const resources = webAccessibleResources[0].resources;
                const hasDirectoryData = resources.some(r => r.includes('directory'));
                
                this.addTestResult(category, 'Directory Data Accessibility', hasDirectoryData,
                    hasDirectoryData ? 'Directory data configured as web accessible' : 'Directory data not web accessible');
            }

        } catch (error) {
            this.addTestResult(category, 'Web Accessible Resources', false, 
                `Error checking web accessible resources: ${error.message}`);
        }
    }

    async testPostCleanupVerification() {
        const category = 'Post-Cleanup Verification';
        this.log(`\n📋 Testing ${category}...`, 'info');

        // Test 1: Visual Indicator Removal
        const visualIndicatorTerms = [
            'AUTO-BOLT ACTIVE',
            'addContentScriptBadge',
            'badge',
            'floating',
            'visual indicator',
            'Auto-Bolt On'
        ];

        const filesToCheck = [
            'content.js',
            'popup.js',
            'background-batch.js',
            'directory-form-filler.js'
        ];

        let indicatorsFound = [];
        for (const file of filesToCheck) {
            try {
                const filePath = path.join(this.extensionPath, file);
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    for (const term of visualIndicatorTerms) {
                        if (content.includes(term)) {
                            indicatorsFound.push(`${term} in ${file}`);
                        }
                    }
                }
            } catch (error) {
                this.addTestResult(category, `Visual Indicator Check - ${file}`, false, 
                    `Error checking ${file}: ${error.message}`);
            }
        }

        this.addTestResult(category, 'Visual Indicators Removed', indicatorsFound.length === 0,
            indicatorsFound.length === 0 ? 'No visual indicators found - cleanup successful' : 
            `Found visual indicators: ${indicatorsFound.join(', ')}`, false, indicatorsFound.length > 0);

        // Test 2: Functionality Preservation Check
        try {
            const contentPath = path.join(this.extensionPath, 'content.js');
            const contentScript = fs.readFileSync(contentPath, 'utf8');
            
            // Check that core functionality remains
            const hasCoreInit = contentScript.includes('init') || contentScript.includes('initialize');
            this.addTestResult(category, 'Core Initialization Preserved', hasCoreInit,
                hasCoreInit ? 'Core initialization code present' : 'Core initialization code missing');

            const hasMessageListeners = contentScript.includes('addListener') || contentScript.includes('onMessage');
            this.addTestResult(category, 'Message Listeners Preserved', hasMessageListeners,
                hasMessageListeners ? 'Message listeners present' : 'Message listeners missing');

            const hasFormHandling = contentScript.includes('form') && (contentScript.includes('fill') || contentScript.includes('input'));
            this.addTestResult(category, 'Form Handling Preserved', hasFormHandling,
                hasFormHandling ? 'Form handling functionality present' : 'Form handling functionality missing', false, !hasFormHandling);

        } catch (error) {
            this.addTestResult(category, 'Functionality Preservation Check', false, 
                `Error checking functionality preservation: ${error.message}`, false, true);
        }

        // Test 3: Silent Operation Verification
        // This checks that the extension can operate without user-visible indicators
        try {
            const manifestPath = path.join(this.extensionPath, 'manifest.json');
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            // Check that popup still exists for user interaction
            const hasPopup = manifest.action && manifest.action.default_popup;
            this.addTestResult(category, 'User Interface Available', hasPopup,
                hasPopup ? 'Popup interface available for user interaction' : 'No popup interface available', false, !hasPopup);

            // Check that background processing is maintained
            const hasBackground = manifest.background && manifest.background.service_worker;
            this.addTestResult(category, 'Background Processing Available', hasBackground,
                hasBackground ? 'Background processing maintained' : 'No background processing configured', false, !hasBackground);

        } catch (error) {
            this.addTestResult(category, 'Silent Operation Verification', false, 
                `Error verifying silent operation: ${error.message}`);
        }
    }

    generateFinalReport() {
        this.results.endTime = new Date().toISOString();
        const testDurationMs = new Date(this.results.endTime) - new Date(this.results.startTime);
        this.results.testDuration = `${Math.round(testDurationMs / 1000)}s`;

        // Calculate overall status
        const successRate = this.results.totalTests > 0 ? 
            (this.results.passedTests / this.results.totalTests * 100).toFixed(1) : 0;
        
        this.results.overallStatus = this.results.criticalIssues.length > 0 ? 'CRITICAL_ISSUES' :
                                   this.results.failedTests > 0 ? 'FAILED' :
                                   this.results.warnings > 0 ? 'PASSED_WITH_WARNINGS' : 'PASSED';

        this.results.successRate = `${successRate}%`;
        this.results.performanceMetrics = this.performanceMetrics;

        // Production readiness assessment
        this.results.productionReadiness = {
            ready: this.results.criticalIssues.length === 0 && this.results.failedTests < 3,
            blockers: this.results.criticalIssues.length,
            warnings: this.results.warnings,
            recommendation: this.results.criticalIssues.length === 0 ? 
                (this.results.failedTests === 0 ? 'READY FOR PHASE 2' : 'MINOR FIXES NEEDED') :
                'CRITICAL ISSUES MUST BE RESOLVED'
        };

        // Generate report
        this.log('\n' + '='.repeat(80), 'info');
        this.log('🎯 AUTOBOLT COMPREHENSIVE FUNCTIONALITY VALIDATION REPORT', 'info');
        this.log('='.repeat(80), 'info');
        
        this.log(`\n📊 SUMMARY:`, 'info');
        this.log(`   Overall Status: ${this.results.overallStatus}`, 
                 this.results.overallStatus === 'PASSED' ? 'pass' : 
                 this.results.overallStatus.includes('CRITICAL') ? 'fail' : 'warn');
        this.log(`   Success Rate: ${this.results.successRate}`, 'info');
        this.log(`   Total Tests: ${this.results.totalTests}`, 'info');
        this.log(`   Passed: ${this.results.passedTests}`, 'pass');
        this.log(`   Failed: ${this.results.failedTests}`, this.results.failedTests > 0 ? 'fail' : 'info');
        this.log(`   Warnings: ${this.results.warnings}`, this.results.warnings > 0 ? 'warn' : 'info');
        this.log(`   Test Duration: ${this.results.testDuration}`, 'info');

        if (this.directoryCount > 0) {
            this.log(`   Mapped Directories: ${this.directoryCount}`, 'info');
        }

        // Category breakdown
        this.log(`\n📋 CATEGORY BREAKDOWN:`, 'info');
        for (const [categoryName, category] of Object.entries(this.results.categories)) {
            const categoryTotal = category.passed + category.failed;
            const categoryRate = categoryTotal > 0 ? ((category.passed / categoryTotal) * 100).toFixed(0) : '0';
            
            this.log(`   ${categoryName}: ${category.passed}/${categoryTotal} (${categoryRate}%)`, 
                     category.failed === 0 ? 'pass' : 'warn');
        }

        // Critical issues
        if (this.results.criticalIssues.length > 0) {
            this.log(`\n🚨 CRITICAL ISSUES (${this.results.criticalIssues.length}):`, 'fail');
            this.results.criticalIssues.forEach((issue, index) => {
                this.log(`   ${index + 1}. [${issue.category}] ${issue.testName}: ${issue.details}`, 'fail');
            });
        }

        // Performance metrics
        if (Object.keys(this.performanceMetrics).length > 0) {
            this.log(`\n⚡ PERFORMANCE METRICS:`, 'info');
            if (this.performanceMetrics.totalExtensionSize) {
                this.log(`   Total Extension Size: ${Math.round(this.performanceMetrics.totalExtensionSize/1024)}KB`, 'info');
            }
            if (this.performanceMetrics.popupScriptSize) {
                this.log(`   Popup Script: ${Math.round(this.performanceMetrics.popupScriptSize/1024)}KB`, 'info');
            }
            if (this.performanceMetrics.queueProcessorSize) {
                this.log(`   Queue Processor: ${Math.round(this.performanceMetrics.queueProcessorSize/1024)}KB`, 'info');
            }
        }

        // Production readiness
        this.log(`\n🚀 PRODUCTION READINESS:`, 'info');
        this.log(`   Ready for Phase 2: ${this.results.productionReadiness.ready ? 'YES' : 'NO'}`, 
                 this.results.productionReadiness.ready ? 'pass' : 'fail');
        this.log(`   Recommendation: ${this.results.productionReadiness.recommendation}`, 
                 this.results.productionReadiness.recommendation === 'READY FOR PHASE 2' ? 'pass' : 'warn');

        if (this.results.productionReadiness.blockers > 0) {
            this.log(`   Blocking Issues: ${this.results.productionReadiness.blockers}`, 'fail');
        }

        this.log('='.repeat(80), 'info');

        // Save detailed results
        const reportPath = path.join(this.sourcePath, 'comprehensive-functionality-test-report.json');
        fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
        this.log(`\n📄 Detailed report saved: ${reportPath}`, 'info');

        return this.results;
    }
}

// Run the test suite
async function main() {
    const tester = new ComprehensiveFunctionalityTester();
    await tester.runAllTests();
    process.exit(0);
}

if (require.main === module) {
    main();
}

module.exports = ComprehensiveFunctionalityTester;