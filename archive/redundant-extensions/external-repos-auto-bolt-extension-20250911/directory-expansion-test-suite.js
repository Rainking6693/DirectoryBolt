/**
 * AutoBolt Directory Expansion Test Suite
 * Comprehensive testing framework for validating 190+ directory mappings
 * 
 * Test Categories:
 * 1. Directory Registry Loading and Validation
 * 2. Package Tier Access Control
 * 3. Form Field Mapping Accuracy
 * 4. Platform-Specific Integration Tests
 * 5. Performance and Reliability Tests
 */

class DirectoryExpansionTestSuite {
    constructor() {
        this.testResults = {
            totalTests: 0,
            passed: 0,
            failed: 0,
            warnings: 0,
            errors: [],
            details: new Map()
        };
        
        this.testCategories = [
            'registry-loading',
            'package-tiers',
            'form-mapping',
            'platform-integration',
            'performance'
        ];
        
        this.sampleBusinessData = {
            businessName: 'AutoBolt Test Company',
            email: 'test@autobolt.com',
            phone: '+1-555-123-4567',
            website: 'https://test.autobolt.com',
            address: '123 Test Street, Test City, TS 12345',
            description: 'Test business for AutoBolt directory expansion validation'
        };
    }

    /**
     * Run complete test suite
     */
    async runCompleteTestSuite() {
        console.log('🚀 Starting AutoBolt Directory Expansion Test Suite...');
        console.log('📊 Testing 190+ directories across 5 categories');
        
        const startTime = performance.now();
        
        try {
            // Test 1: Directory Registry Loading
            await this.testDirectoryRegistryLoading();
            
            // Test 2: Package Tier Functionality
            await this.testPackageTierFunctionality();
            
            // Test 3: Form Mapping Validation
            await this.testFormMappingValidation();
            
            // Test 4: Platform Integration Tests
            await this.testPlatformIntegration();
            
            // Test 5: Performance Tests
            await this.testPerformanceMetrics();
            
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            this.generateTestReport(duration);
            
        } catch (error) {
            console.error('❌ Test suite execution failed:', error);
            this.testResults.errors.push({
                category: 'suite-execution',
                error: error.message,
                stack: error.stack
            });
        }
    }

    /**
     * Test directory registry loading and validation
     */
    async testDirectoryRegistryLoading() {
        console.log('📁 Testing Directory Registry Loading...');
        
        const tests = [
            {
                name: 'Load Expanded Directory List',
                test: async () => {
                    const registry = new DirectoryRegistry();
                    const result = await registry.initialize();
                    
                    this.assert(result.success, 'Registry initialization should succeed');
                    this.assert(result.totalDirectories >= 190, `Should load 190+ directories, got ${result.totalDirectories}`);
                    this.assert(registry.isInitialized(), 'Registry should be initialized');
                    
                    return { directories: result.totalDirectories };
                }
            },
            {
                name: 'Validate Directory Structure',
                test: async () => {
                    const registry = new DirectoryRegistry();
                    await registry.initialize();
                    
                    const directories = registry.getDirectories();
                    const requiredFields = ['id', 'name', 'url', 'category', 'priority', 'tier', 'domainAuthority'];
                    
                    let validDirectories = 0;
                    let invalidDirectories = [];
                    
                    directories.forEach(dir => {
                        const hasAllFields = requiredFields.every(field => dir[field] !== undefined);
                        if (hasAllFields) {
                            validDirectories++;
                        } else {
                            invalidDirectories.push({
                                id: dir.id,
                                missing: requiredFields.filter(field => dir[field] === undefined)
                            });
                        }
                    });
                    
                    this.assert(invalidDirectories.length === 0, 
                        `All directories should have required fields. Invalid: ${JSON.stringify(invalidDirectories)}`);
                    
                    return { valid: validDirectories, invalid: invalidDirectories.length };
                }
            },
            {
                name: 'Validate Category Distribution',
                test: async () => {
                    const registry = new DirectoryRegistry();
                    await registry.initialize();
                    
                    const stats = registry.getStatistics();
                    const expectedCategories = [
                        'tech-startups', 'business-professional', 'traditional-directories',
                        'local-niche', 'ecommerce-marketplaces', 'content-media'
                    ];
                    
                    expectedCategories.forEach(category => {
                        this.assert(stats.byCategory[category] > 0, `Category '${category}' should have directories`);
                    });
                    
                    return { categories: Object.keys(stats.byCategory).length };
                }
            }
        ];
        
        await this.runTestGroup('registry-loading', tests);
    }

    /**
     * Test package tier functionality
     */
    async testPackageTierFunctionality() {
        console.log('🎯 Testing Package Tier Functionality...');
        
        const tests = [
            {
                name: 'Package Tier Access Control',
                test: async () => {
                    const registry = new DirectoryRegistry();
                    await registry.initialize();
                    
                    const tiers = ['starter', 'growth', 'professional', 'enterprise'];
                    let tierResults = {};
                    
                    for (const tier of tiers) {
                        const directories = registry.getDirectoriesByTier(tier);
                        tierResults[tier] = directories.length;
                        
                        // Validate tier hierarchy
                        if (tier !== 'starter') {
                            const previousTierIndex = tiers.indexOf(tier) - 1;
                            const previousTier = tiers[previousTierIndex];
                            const previousCount = tierResults[previousTier];
                            
                            this.assert(directories.length >= previousCount, 
                                `${tier} should have >= directories than ${previousTier}`);
                        }
                    }
                    
                    return tierResults;
                }
            },
            {
                name: 'Directory Access Validation',
                test: async () => {
                    const registry = new DirectoryRegistry();
                    await registry.initialize();
                    
                    const testDirectory = registry.getDirectories()[0];
                    const accessResults = {};
                    
                    ['starter', 'growth', 'professional', 'enterprise'].forEach(userTier => {
                        const validation = registry.validateDirectoryAccess(testDirectory.id, userTier);
                        accessResults[userTier] = validation.access;
                    });
                    
                    return accessResults;
                }
            },
            {
                name: 'High-Value Directory Distribution',
                test: async () => {
                    const registry = new DirectoryRegistry();
                    await registry.initialize();
                    
                    const highValueDirs = registry.getHighValueDirectories('enterprise');
                    const stats = registry.getStatistics();
                    
                    this.assert(highValueDirs.length > 0, 'Should have high-value directories (DA 80+)');
                    this.assert(stats.byDomainAuthority['80-89'] > 0 || stats.byDomainAuthority['90+'] > 0, 
                        'Should have directories with DA 80+');
                    
                    return { 
                        highValueCount: highValueDirs.length,
                        da80Plus: stats.byDomainAuthority['80-89'] + stats.byDomainAuthority['90+']
                    };
                }
            }
        ];
        
        await this.runTestGroup('package-tiers', tests);
    }

    /**
     * Test form mapping validation
     */
    async testFormMappingValidation() {
        console.log('🗺️ Testing Form Mapping Validation...');
        
        const tests = [
            {
                name: 'Enhanced Form Mapper Initialization',
                test: async () => {
                    const mapper = new EnhancedFormMapper();
                    
                    this.assert(mapper.fieldPatterns.size > 0, 'Should have field patterns');
                    this.assert(mapper.detectionStrategies.length > 0, 'Should have detection strategies');
                    
                    // Test key field patterns
                    const keyFields = ['businessName', 'email', 'website', 'phone', 'address', 'description'];
                    keyFields.forEach(field => {
                        this.assert(mapper.fieldPatterns.has(field), `Should have patterns for ${field}`);
                        this.assert(mapper.fieldPatterns.get(field).length > 0, `Should have multiple patterns for ${field}`);
                    });
                    
                    return { 
                        fieldTypes: mapper.fieldPatterns.size,
                        strategies: mapper.detectionStrategies.length
                    };
                }
            },
            {
                name: 'Platform-Specific Pattern Validation',
                test: async () => {
                    const mapper = new EnhancedFormMapper();
                    
                    // Test platform-specific patterns exist
                    const platformPatterns = [
                        // Product Hunt
                        'input[name="redirect_url"]',
                        'textarea[name="tagline"]',
                        // Crunchbase
                        'input[name="homepage_url"]',
                        'input[name="founded_on"]',
                        // App stores
                        'input[name="app_name"]',
                        'select[name="primary_category"]'
                    ];
                    
                    let foundPatterns = 0;
                    for (const [fieldType, patterns] of mapper.fieldPatterns) {
                        platformPatterns.forEach(pattern => {
                            if (patterns.includes(pattern)) {
                                foundPatterns++;
                            }
                        });
                    }
                    
                    this.assert(foundPatterns > 0, 'Should have platform-specific patterns');
                    
                    return { foundPlatformPatterns: foundPatterns };
                }
            },
            {
                name: 'Form Detection Strategy Testing',
                test: async () => {
                    const mapper = new EnhancedFormMapper();
                    
                    // Create test form elements
                    const testForm = document.createElement('form');
                    testForm.innerHTML = `
                        <input name="business_name" type="text" placeholder="Business Name">
                        <input name="email" type="email" placeholder="Email">
                        <input name="website" type="url" placeholder="Website">
                        <textarea name="description" placeholder="Description"></textarea>
                    `;
                    document.body.appendChild(testForm);
                    
                    const detectedForms = await mapper.detectForms();
                    
                    this.assert(detectedForms.length > 0, 'Should detect test form');
                    
                    // Cleanup
                    document.body.removeChild(testForm);
                    
                    return { detectedForms: detectedForms.length };
                }
            }
        ];
        
        await this.runTestGroup('form-mapping', tests);
    }

    /**
     * Test platform integration capabilities
     */
    async testPlatformIntegration() {
        console.log('🔗 Testing Platform Integration...');
        
        const tests = [
            {
                name: 'Directory-Specific Configuration Loading',
                test: async () => {
                    const registry = new DirectoryRegistry();
                    await registry.initialize();
                    
                    const directories = registry.getDirectories();
                    let directoriesWithFieldMapping = 0;
                    let directoriesWithRequirements = 0;
                    
                    directories.forEach(dir => {
                        if (dir.fieldMapping && Object.keys(dir.fieldMapping).length > 0) {
                            directoriesWithFieldMapping++;
                        }
                        if (dir.requirements && dir.requirements.length > 0) {
                            directoriesWithRequirements++;
                        }
                    });
                    
                    this.assert(directoriesWithFieldMapping > 0, 'Some directories should have field mappings');
                    this.assert(directoriesWithRequirements > 0, 'Some directories should have requirements');
                    
                    return { 
                        withFieldMapping: directoriesWithFieldMapping,
                        withRequirements: directoriesWithRequirements
                    };
                }
            },
            {
                name: 'Anti-Bot and Login Detection',
                test: async () => {
                    const registry = new DirectoryRegistry();
                    await registry.initialize();
                    
                    const stats = registry.getStatistics();
                    
                    this.assert(stats.hasAntiBot >= 0, 'Should track anti-bot directories');
                    this.assert(stats.requiresLogin >= 0, 'Should track login-required directories');
                    this.assert(stats.automatable >= 0, 'Should track automatable directories');
                    
                    return {
                        antiBot: stats.hasAntiBot,
                        requiresLogin: stats.requiresLogin,
                        automatable: stats.automatable
                    };
                }
            },
            {
                name: 'Business Type Matching',
                test: async () => {
                    const registry = new DirectoryRegistry();
                    await registry.initialize();
                    
                    const businessTypes = ['tech-startup', 'local-business', 'ecommerce', 'software'];
                    let matchingResults = {};
                    
                    businessTypes.forEach(businessType => {
                        const matchingDirectories = registry.getDirectoriesForBusinessType(businessType);
                        matchingResults[businessType] = matchingDirectories.length;
                        
                        this.assert(matchingDirectories.length > 0, 
                            `Should find directories for business type: ${businessType}`);
                    });
                    
                    return matchingResults;
                }
            }
        ];
        
        await this.runTestGroup('platform-integration', tests);
    }

    /**
     * Test performance and reliability metrics
     */
    async testPerformanceMetrics() {
        console.log('⚡ Testing Performance Metrics...');
        
        const tests = [
            {
                name: 'Registry Loading Performance',
                test: async () => {
                    const startTime = performance.now();
                    
                    const registry = new DirectoryRegistry();
                    await registry.initialize();
                    
                    const loadTime = performance.now() - startTime;
                    
                    this.assert(loadTime < 2000, `Registry loading should be < 2s, got ${loadTime}ms`);
                    
                    return { loadTimeMs: Math.round(loadTime) };
                }
            },
            {
                name: 'Directory Filtering Performance',
                test: async () => {
                    const registry = new DirectoryRegistry();
                    await registry.initialize();
                    
                    const startTime = performance.now();
                    
                    // Test various filtering operations
                    registry.getDirectoriesByCategory('tech-startups');
                    registry.getDirectoriesByTier('professional');
                    registry.getHighValueDirectories('enterprise');
                    registry.getDirectoriesForBusinessType('software');
                    
                    const filterTime = performance.now() - startTime;
                    
                    this.assert(filterTime < 100, `Directory filtering should be < 100ms, got ${filterTime}ms`);
                    
                    return { filterTimeMs: Math.round(filterTime) };
                }
            },
            {
                name: 'Memory Usage Validation',
                test: async () => {
                    const registry = new DirectoryRegistry();
                    await registry.initialize();
                    
                    const directories = registry.getDirectories();
                    const estimatedMemoryUsage = JSON.stringify(directories).length;
                    
                    // Reasonable memory usage check (should be < 10MB)
                    this.assert(estimatedMemoryUsage < 10000000, 
                        `Memory usage should be reasonable, estimated ${estimatedMemoryUsage} bytes`);
                    
                    return { estimatedMemoryBytes: estimatedMemoryUsage };
                }
            }
        ];
        
        await this.runTestGroup('performance', tests);
    }

    /**
     * Run a group of tests
     */
    async runTestGroup(category, tests) {
        console.log(`\n📋 Running ${category} tests (${tests.length} tests)...`);
        
        const groupResults = {
            category,
            total: tests.length,
            passed: 0,
            failed: 0,
            results: []
        };
        
        for (const test of tests) {
            try {
                console.log(`  🧪 ${test.name}...`);
                const result = await test.test();
                
                console.log(`  ✅ ${test.name} - PASSED`);
                groupResults.passed++;
                groupResults.results.push({
                    name: test.name,
                    status: 'PASSED',
                    result
                });
                
                this.testResults.passed++;
                
            } catch (error) {
                console.error(`  ❌ ${test.name} - FAILED: ${error.message}`);
                groupResults.failed++;
                groupResults.results.push({
                    name: test.name,
                    status: 'FAILED',
                    error: error.message
                });
                
                this.testResults.failed++;
                this.testResults.errors.push({
                    category,
                    test: test.name,
                    error: error.message
                });
            }
            
            this.testResults.totalTests++;
        }
        
        this.testResults.details.set(category, groupResults);
        console.log(`📊 ${category}: ${groupResults.passed}/${groupResults.total} passed`);
    }

    /**
     * Assert helper function
     */
    assert(condition, message) {
        if (!condition) {
            throw new Error(message);
        }
    }

    /**
     * Generate comprehensive test report
     */
    generateTestReport(duration) {
        console.log('\n🎉 AutoBolt Directory Expansion Test Suite Complete!');
        console.log('=' .repeat(60));
        console.log(`📊 RESULTS SUMMARY:`);
        console.log(`   Total Tests: ${this.testResults.totalTests}`);
        console.log(`   ✅ Passed: ${this.testResults.passed}`);
        console.log(`   ❌ Failed: ${this.testResults.failed}`);
        console.log(`   ⏱️  Duration: ${Math.round(duration)}ms`);
        console.log(`   📈 Success Rate: ${Math.round((this.testResults.passed / this.testResults.totalTests) * 100)}%`);
        
        console.log('\n📋 CATEGORY BREAKDOWN:');
        for (const [category, results] of this.testResults.details) {
            const successRate = Math.round((results.passed / results.total) * 100);
            console.log(`   ${category}: ${results.passed}/${results.total} (${successRate}%)`);
        }
        
        if (this.testResults.errors.length > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.testResults.errors.forEach(error => {
                console.log(`   • ${error.category}/${error.test}: ${error.error}`);
            });
        }
        
        // Generate detailed report object for external consumption
        const detailedReport = {
            summary: {
                totalTests: this.testResults.totalTests,
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                duration: Math.round(duration),
                successRate: Math.round((this.testResults.passed / this.testResults.totalTests) * 100)
            },
            categories: Object.fromEntries(this.testResults.details),
            errors: this.testResults.errors,
            timestamp: new Date().toISOString()
        };
        
        // Store report for external access
        window.AutoBoltTestReport = detailedReport;
        
        console.log('\n✅ Test report available at window.AutoBoltTestReport');
        console.log('=' .repeat(60));
        
        return detailedReport;
    }
}

// Auto-run if in test environment
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // Only run in development/test environment
    document.addEventListener('DOMContentLoaded', () => {
        const testSuite = new DirectoryExpansionTestSuite();
        testSuite.runCompleteTestSuite();
    });
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DirectoryExpansionTestSuite;
} else {
    window.DirectoryExpansionTestSuite = DirectoryExpansionTestSuite;
}