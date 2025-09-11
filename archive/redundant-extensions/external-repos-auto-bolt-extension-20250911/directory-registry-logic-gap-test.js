/**
 * Comprehensive Test Suite for Directory Registry Logic Gap Fixes
 * Tests the enhanced logic improvements to ensure robustness and prevent regressions
 */

class DirectoryRegistryLogicGapTest {
    constructor() {
        this.testResults = [];
        this.mockDirectoryData = this._createMockDirectoryData();
        this.originalConsole = { log: console.log, warn: console.warn, error: console.error };
        this.testLogs = [];
    }

    /**
     * Run all comprehensive tests
     */
    async runAllTests() {
        console.log('🧪 Running Directory Registry Logic Gap Tests...\n');
        
        // Setup test environment
        this._setupMockConsole();
        
        try {
            // Test 1: Initialization Logic
            await this.testInitializationLogic();
            
            // Test 2: Data Validation and Normalization
            await this.testDataValidationAndNormalization();
            
            // Test 3: Error Handling and Recovery
            await this.testErrorHandlingAndRecovery();
            
            // Test 4: Cache Management
            await this.testCacheManagement();
            
            // Test 5: Tier Hierarchy Consistency
            await this.testTierHierarchyConsistency();
            
            // Test 6: Concurrent Access Protection
            await this.testConcurrentAccessProtection();
            
            // Test 7: Memory Leak Prevention
            await this.testMemoryLeakPrevention();
            
            // Test 8: Edge Case Handling
            await this.testEdgeCaseHandling();
            
            // Generate comprehensive report
            this._generateTestReport();
            
        } catch (error) {
            console.error('❌ Test execution failed:', error);
            return { success: false, error: error.message };
        } finally {
            this._restoreMockConsole();
        }
        
        return { 
            success: true, 
            totalTests: this.testResults.length,
            passed: this.testResults.filter(r => r.passed).length,
            failed: this.testResults.filter(r => !r.passed).length
        };
    }

    /**
     * Test 1: Initialization Logic
     */
    async testInitializationLogic() {
        const testName = 'Initialization Logic';
        console.log(`\n🔧 Testing ${testName}...`);
        
        try {
            const registry = new DirectoryRegistry();
            
            // Test concurrent initialization prevention
            const initPromises = [
                registry.initialize(),
                registry.initialize(),
                registry.initialize()
            ];
            
            const results = await Promise.all(initPromises);
            
            // All should return the same result (no double initialization)
            const allSame = results.every(r => 
                JSON.stringify(r) === JSON.stringify(results[0])
            );
            
            this._addTestResult(testName, 'Concurrent initialization protection', allSame);
            
            // Test initialization state
            this._addTestResult(testName, 'Registry initialization state', registry.isInitialized());
            
            // Test data structure validation
            const hasValidDirectories = Array.isArray(registry.directories) && registry.directories.length > 0;
            this._addTestResult(testName, 'Directory data structure validation', hasValidDirectories);
            
        } catch (error) {
            this._addTestResult(testName, 'Initialization error handling', false, error.message);
        }
    }

    /**
     * Test 2: Data Validation and Normalization
     */
    async testDataValidationAndNormalization() {
        const testName = 'Data Validation and Normalization';
        console.log(`\n📊 Testing ${testName}...`);
        
        try {
            const registry = new DirectoryRegistry();
            
            // Test with corrupted data
            registry.directories = this.mockDirectoryData.corrupted;
            const normalizationResult = registry.normalizeDirectories();
            
            // Should handle corrupted data gracefully
            this._addTestResult(testName, 'Corrupted data handling', 
                normalizationResult.errors > 0 && normalizationResult.normalized > 0);
            
            // Test field validation
            const validatedDir = registry.directories[0];
            if (validatedDir) {
                const hasValidFields = 
                    validatedDir.id && 
                    validatedDir.name && 
                    validatedDir.url &&
                    ['high', 'medium', 'low'].includes(validatedDir.priority) &&
                    ['easy', 'medium', 'hard'].includes(validatedDir.difficulty);
                    
                this._addTestResult(testName, 'Field validation', hasValidFields);
            }
            
            // Test tier validation
            const validTiers = registry.directories.every(dir => 
                ['starter', 'growth', 'professional', 'enterprise'].includes(dir.tier)
            );
            this._addTestResult(testName, 'Tier validation', validTiers);
            
        } catch (error) {
            this._addTestResult(testName, 'Normalization error handling', false, error.message);
        }
    }

    /**
     * Test 3: Error Handling and Recovery
     */
    async testErrorHandlingAndRecovery() {
        const testName = 'Error Handling and Recovery';
        console.log(`\n⚠️ Testing ${testName}...`);
        
        try {
            const registry = new DirectoryRegistry();
            
            // Test invalid directory access
            const invalidAccess = registry.validateDirectoryAccess('invalid-id');
            this._addTestResult(testName, 'Invalid directory access handling', 
                !invalidAccess.access && invalidAccess.reason.includes('not found'));
            
            // Test invalid tier handling
            const invalidTierDirs = registry.getDirectoriesByTier('invalid-tier');
            this._addTestResult(testName, 'Invalid tier handling', Array.isArray(invalidTierDirs));
            
            // Test uninitialized registry access
            const uninitRegistry = new DirectoryRegistry();
            const uninitDirs = uninitRegistry.getDirectories();
            this._addTestResult(testName, 'Uninitialized registry access', 
                Array.isArray(uninitDirs) && uninitDirs.length === 0);
            
        } catch (error) {
            this._addTestResult(testName, 'Error handling robustness', false, error.message);
        }
    }

    /**
     * Test 4: Cache Management
     */
    async testCacheManagement() {
        const testName = 'Cache Management';
        console.log(`\n💾 Testing ${testName}...`);
        
        try {
            const registry = new DirectoryRegistry();
            await registry.initialize();
            
            // Fill cache beyond maxCacheSize
            for (let i = 0; i < 120; i++) {
                registry.getDirectories({ test: i });
            }
            
            // Should not exceed maxCacheSize
            this._addTestResult(testName, 'Cache size limit enforcement', 
                registry.filterCache.size <= registry.maxCacheSize);
            
            // Test selective cache clearing
            registry.getDirectories({ category: 'tech-startups' });
            registry.getDirectories({ priority: 'high' });
            
            const initialSize = registry.filterCache.size;
            registry.clearCache('category');
            const afterSelectiveSize = registry.filterCache.size;
            
            this._addTestResult(testName, 'Selective cache clearing', 
                afterSelectiveSize < initialSize);
            
            // Test complete cache clearing
            registry.clearCache();
            this._addTestResult(testName, 'Complete cache clearing', 
                registry.filterCache.size === 0);
            
        } catch (error) {
            this._addTestResult(testName, 'Cache management error handling', false, error.message);
        }
    }

    /**
     * Test 5: Tier Hierarchy Consistency
     */
    async testTierHierarchyConsistency() {
        const testName = 'Tier Hierarchy Consistency';
        console.log(`\n🏆 Testing ${testName}...`);
        
        try {
            const registry = new DirectoryRegistry();
            await registry.initialize();
            
            // Test consistent tier hierarchy across methods
            const starterDirs = registry.getDirectoriesByTier('starter');
            const growthDirs = registry.getDirectoriesByTier('growth');
            const proDirs = registry.getDirectoriesByTier('professional');
            const entDirs = registry.getDirectoriesByTier('enterprise');
            
            const hierarchyConsistent = 
                starterDirs.length <= growthDirs.length &&
                growthDirs.length <= proDirs.length &&
                proDirs.length <= entDirs.length;
                
            this._addTestResult(testName, 'Tier hierarchy consistency', hierarchyConsistent);
            
            // Test tier validation in directory access
            const testDir = registry.directories.find(d => d.tier === 'professional');
            if (testDir) {
                const starterAccess = registry.validateDirectoryAccess(testDir.id, 'starter');
                const proAccess = registry.validateDirectoryAccess(testDir.id, 'professional');
                
                this._addTestResult(testName, 'Access control consistency', 
                    !starterAccess.access && proAccess.access);
            }
            
        } catch (error) {
            this._addTestResult(testName, 'Tier hierarchy error handling', false, error.message);
        }
    }

    /**
     * Test 6: Concurrent Access Protection
     */
    async testConcurrentAccessProtection() {
        const testName = 'Concurrent Access Protection';
        console.log(`\n🔒 Testing ${testName}...`);
        
        try {
            const registry = new DirectoryRegistry();
            
            // Test multiple concurrent operations
            const operations = [
                () => registry.getDirectories({ category: 'tech-startups' }),
                () => registry.getDirectoriesByTier('growth'),
                () => registry.clearCache(),
                () => registry.getStatistics(),
                () => registry.getFieldMappingPatterns()
            ];
            
            const concurrentPromises = operations.map(op => {
                return new Promise(resolve => {
                    setTimeout(() => resolve(op()), Math.random() * 10);
                });
            });
            
            const results = await Promise.all(concurrentPromises);
            const allSuccessful = results.every(result => result !== null && result !== undefined);
            
            this._addTestResult(testName, 'Concurrent operations safety', allSuccessful);
            
        } catch (error) {
            this._addTestResult(testName, 'Concurrent access error handling', false, error.message);
        }
    }

    /**
     * Test 7: Memory Leak Prevention
     */
    async testMemoryLeakPrevention() {
        const testName = 'Memory Leak Prevention';
        console.log(`\n🧠 Testing ${testName}...`);
        
        try {
            const registry = new DirectoryRegistry();
            await registry.initialize();
            
            // Simulate heavy usage
            for (let i = 0; i < 200; i++) {
                registry.getDirectories({ test: Math.random() });
                
                if (i % 50 === 0) {
                    // Check cache doesn't grow unbounded
                    this._addTestResult(testName, `Cache size at iteration ${i}`, 
                        registry.filterCache.size <= registry.maxCacheSize);
                }
            }
            
            // Final cache size check
            this._addTestResult(testName, 'Final cache size within bounds', 
                registry.filterCache.size <= registry.maxCacheSize);
            
        } catch (error) {
            this._addTestResult(testName, 'Memory leak prevention error', false, error.message);
        }
    }

    /**
     * Test 8: Edge Case Handling
     */
    async testEdgeCaseHandling() {
        const testName = 'Edge Case Handling';
        console.log(`\n🎯 Testing ${testName}...`);
        
        try {
            const registry = new DirectoryRegistry();
            await registry.initialize();
            
            // Test empty filters
            const emptyFilterResult = registry.getDirectories({});
            this._addTestResult(testName, 'Empty filters handling', 
                Array.isArray(emptyFilterResult) && emptyFilterResult.length > 0);
            
            // Test null/undefined parameters
            const nullResult = registry.validateDirectoryAccess(null);
            this._addTestResult(testName, 'Null parameter handling', 
                !nullResult.access && nullResult.reason.includes('required'));
            
            // Test malformed filter objects
            const malformedResult = registry.getDirectories({ invalid: 'filter', number: 123 });
            this._addTestResult(testName, 'Malformed filter handling', 
                Array.isArray(malformedResult));
            
            // Test package tier edge cases
            const tierInfo = registry.getPackageTierInfo('nonexistent');
            this._addTestResult(testName, 'Nonexistent tier handling', tierInfo === null);
            
        } catch (error) {
            this._addTestResult(testName, 'Edge case error handling', false, error.message);
        }
    }

    /**
     * Create mock directory data for testing
     */
    _createMockDirectoryData() {
        return {
            valid: [
                {
                    id: 'test-dir-1',
                    name: 'Test Directory 1',
                    url: 'https://example.com/dir1',
                    category: 'tech-startups',
                    priority: 'high',
                    tier: 'starter',
                    difficulty: 'easy',
                    estimatedTime: 300,
                    domainAuthority: 85
                }
            ],
            corrupted: [
                null,
                { id: null, name: '', url: 'invalid-url' },
                { id: 'valid-1', name: 'Valid Dir', url: 'https://example.com', category: 'invalid-cat' },
                { id: 'valid-2', name: 'Another Valid', url: 'https://test.com', tier: 'invalid-tier' },
                { id: 'valid-3', name: 'Good Dir', url: 'https://good.com', estimatedTime: 'invalid-time' },
                { id: 'valid-4', name: 'Final Dir', url: 'https://final.com', domainAuthority: 150 }
            ]
        };
    }

    /**
     * Add test result
     */
    _addTestResult(category, test, passed, details = null) {
        this.testResults.push({
            category,
            test,
            passed: Boolean(passed),
            details,
            timestamp: new Date().toISOString()
        });
        
        const status = passed ? '✅' : '❌';
        console.log(`  ${status} ${test}: ${passed ? 'PASS' : 'FAIL'}${details ? ` (${details})` : ''}`);
    }

    /**
     * Setup mock console for testing
     */
    _setupMockConsole() {
        console.log = (...args) => {
            this.testLogs.push({ type: 'log', args });
            this.originalConsole.log(...args);
        };
        
        console.warn = (...args) => {
            this.testLogs.push({ type: 'warn', args });
            this.originalConsole.warn(...args);
        };
        
        console.error = (...args) => {
            this.testLogs.push({ type: 'error', args });
            this.originalConsole.error(...args);
        };
    }

    /**
     * Restore original console
     */
    _restoreMockConsole() {
        console.log = this.originalConsole.log;
        console.warn = this.originalConsole.warn;
        console.error = this.originalConsole.error;
    }

    /**
     * Generate comprehensive test report
     */
    _generateTestReport() {
        const passed = this.testResults.filter(r => r.passed).length;
        const failed = this.testResults.filter(r => !r.passed).length;
        const total = this.testResults.length;
        const passRate = ((passed / total) * 100).toFixed(1);
        
        console.log('\n📊 DIRECTORY REGISTRY LOGIC GAP TEST REPORT');
        console.log('================================================');
        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed} (${passRate}%)`);
        console.log(`Failed: ${failed}`);
        console.log('================================================');
        
        // Group results by category
        const byCategory = {};
        this.testResults.forEach(result => {
            if (!byCategory[result.category]) {
                byCategory[result.category] = { passed: 0, failed: 0, tests: [] };
            }
            byCategory[result.category].tests.push(result);
            if (result.passed) {
                byCategory[result.category].passed++;
            } else {
                byCategory[result.category].failed++;
            }
        });
        
        // Print category summaries
        Object.entries(byCategory).forEach(([category, data]) => {
            const categoryPass = ((data.passed / data.tests.length) * 100).toFixed(1);
            console.log(`\n${category}: ${data.passed}/${data.tests.length} (${categoryPass}%)`);
            
            // Show failed tests
            const failedTests = data.tests.filter(t => !t.passed);
            if (failedTests.length > 0) {
                console.log('  Failed Tests:');
                failedTests.forEach(test => {
                    console.log(`    ❌ ${test.test}${test.details ? ` - ${test.details}` : ''}`);
                });
            }
        });
        
        // Overall status
        console.log(`\n🎯 OVERALL STATUS: ${failed === 0 ? '✅ ALL TESTS PASSED' : `❌ ${failed} TEST(S) FAILED`}`);
        
        // Log summary
        const warnLogs = this.testLogs.filter(log => log.type === 'warn').length;
        const errorLogs = this.testLogs.filter(log => log.type === 'error').length;
        
        if (warnLogs > 0 || errorLogs > 0) {
            console.log(`\n📝 Console Activity: ${warnLogs} warnings, ${errorLogs} errors`);
        }
    }
}

// Export for use in other test environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DirectoryRegistryLogicGapTest;
}

// Auto-run if executed directly
if (typeof window === 'undefined' && typeof global !== 'undefined') {
    // Node.js environment - would need registry implementation
    console.log('Directory Registry Logic Gap Test Suite loaded.');
    console.log('Run with: const test = new DirectoryRegistryLogicGapTest(); await test.runAllTests();');
}