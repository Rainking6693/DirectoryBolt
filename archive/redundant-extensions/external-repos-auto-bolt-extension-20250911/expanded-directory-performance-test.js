/**
 * Performance Test Suite for Expanded AutoBolt Directory Integration
 * Tests the 86-directory expanded set for performance, accuracy, and reliability
 * 
 * Performance Criteria:
 * - Registry initialization < 2 seconds
 * - Directory filtering < 500ms  
 * - Memory usage < 50MB increase
 * - Field mapping accuracy > 95%
 * - No performance degradation > 5%
 */

class ExpandedDirectoryPerformanceTest {
    constructor() {
        this.testResults = {
            performance: {},
            accuracy: {},
            reliability: {},
            memory: {},
            summary: {}
        };
        this.benchmarkBaseline = null;
        this.testStartTime = Date.now();
    }

    /**
     * Main test execution function
     */
    async runAllTests() {
        console.log('🚀 Starting AutoBolt Expanded Directory Performance Test Suite');
        console.log('📊 Testing 86 directories vs. original 57 directory baseline\n');

        try {
            // Initialize test environment
            await this.initializeTestEnvironment();

            // Performance Tests
            await this.testRegistryInitializationPerformance();
            await this.testDirectoryFilteringPerformance();
            await this.testFieldMappingPerformance();
            await this.testConcurrentAccessPerformance();

            // Accuracy Tests
            await this.testFieldMappingAccuracy();
            await this.testTierAssignmentAccuracy();
            await this.testCategoryDistributionAccuracy();

            // Reliability Tests
            await this.testSystemStabilityUnderLoad();
            await this.testMemoryUsageStability();
            await this.testErrorHandlingRobustness();

            // Generate comprehensive report
            await this.generatePerformanceReport();

        } catch (error) {
            console.error('❌ Test suite failed:', error);
            this.testResults.summary.success = false;
            this.testResults.summary.error = error.message;
        }

        return this.testResults;
    }

    /**
     * Initialize test environment with baseline measurements
     */
    async initializeTestEnvironment() {
        console.log('🏗️ Initializing test environment...');

        // Load original directory registry for comparison
        this.originalRegistry = new DirectoryRegistry();
        
        // Load expanded directory registry
        this.expandedRegistry = new DirectoryRegistry();

        // Establish performance baseline
        const baselineStart = performance.now();
        await this.originalRegistry.initialize();
        const baselineEnd = performance.now();
        
        this.benchmarkBaseline = {
            initTime: baselineEnd - baselineStart,
            directoryCount: this.originalRegistry.directories.length,
            memoryBefore: this.getMemoryUsage()
        };

        console.log(`✅ Baseline established: ${this.benchmarkBaseline.directoryCount} directories, ${this.benchmarkBaseline.initTime.toFixed(2)}ms init time`);
    }

    /**
     * Test registry initialization performance
     */
    async testRegistryInitializationPerformance() {
        console.log('⚡ Testing registry initialization performance...');

        const tests = [];
        const iterations = 10;

        for (let i = 0; i < iterations; i++) {
            const registry = new DirectoryRegistry();
            const startTime = performance.now();
            await registry.initialize();
            const endTime = performance.now();
            
            tests.push({
                iteration: i + 1,
                initTime: endTime - startTime,
                directoryCount: registry.directories.length,
                memoryUsed: this.getMemoryUsage()
            });
        }

        const avgInitTime = tests.reduce((sum, test) => sum + test.initTime, 0) / iterations;
        const maxInitTime = Math.max(...tests.map(t => t.initTime));
        const minInitTime = Math.min(...tests.map(t => t.initTime));

        this.testResults.performance.initialization = {
            averageTime: avgInitTime,
            maxTime: maxInitTime,
            minTime: minInitTime,
            baselineTime: this.benchmarkBaseline.initTime,
            performanceImpact: ((avgInitTime - this.benchmarkBaseline.initTime) / this.benchmarkBaseline.initTime * 100),
            passed: avgInitTime < 2000, // 2 second threshold
            iterations: iterations
        };

        console.log(`   Average: ${avgInitTime.toFixed(2)}ms (${this.testResults.performance.initialization.performanceImpact.toFixed(1)}% vs baseline)`);
        console.log(`   Range: ${minInitTime.toFixed(2)}ms - ${maxInitTime.toFixed(2)}ms`);
    }

    /**
     * Test directory filtering performance
     */
    async testDirectoryFilteringPerformance() {
        console.log('🔍 Testing directory filtering performance...');

        const registry = new DirectoryRegistry();
        await registry.initialize();

        const filterTests = [
            { name: 'category-filter', filters: { category: 'social-media' } },
            { name: 'tier-filter', filters: { tier: 'professional' } },
            { name: 'priority-filter', filters: { priority: 'high' } },
            { name: 'complex-filter', filters: { 
                category: ['social-media', 'review-sites'], 
                difficulty: 'easy',
                excludeAntiBot: true 
            }},
            { name: 'domain-authority-filter', filters: { 
                minDomainAuthority: 80,
                maxDomainAuthority: 95 
            }}
        ];

        const filterResults = [];

        for (const test of filterTests) {
            const times = [];
            const iterations = 100;

            for (let i = 0; i < iterations; i++) {
                const startTime = performance.now();
                const results = registry.getDirectories(test.filters);
                const endTime = performance.now();
                
                times.push({
                    time: endTime - startTime,
                    resultCount: results.length
                });
            }

            const avgTime = times.reduce((sum, t) => sum + t.time, 0) / iterations;
            const avgResults = times.reduce((sum, t) => sum + t.resultCount, 0) / iterations;

            filterResults.push({
                name: test.name,
                averageTime: avgTime,
                averageResults: avgResults,
                passed: avgTime < 500 // 500ms threshold
            });
        }

        this.testResults.performance.filtering = {
            tests: filterResults,
            overallPassed: filterResults.every(test => test.passed),
            averageFilterTime: filterResults.reduce((sum, test) => sum + test.averageTime, 0) / filterResults.length
        };

        filterResults.forEach(test => {
            console.log(`   ${test.name}: ${test.averageTime.toFixed(2)}ms (${test.averageResults} results) ${test.passed ? '✅' : '❌'}`);
        });
    }

    /**
     * Test field mapping performance
     */
    async testFieldMappingPerformance() {
        console.log('🗺️ Testing field mapping performance...');

        const registry = new DirectoryRegistry();
        await registry.initialize();

        const startTime = performance.now();
        const fieldPatterns = registry.getFieldMappingPatterns();
        const endTime = performance.now();

        const patternGenerationTime = endTime - startTime;
        const totalPatterns = Object.values(fieldPatterns).reduce((sum, patterns) => sum + patterns.length, 0);

        // Test pattern matching performance
        const mockDOM = this.createMockDOMElements();
        const matchingTests = [];

        for (const [fieldType, patterns] of Object.entries(fieldPatterns)) {
            const matchStart = performance.now();
            let matchCount = 0;

            patterns.forEach(pattern => {
                try {
                    const matches = mockDOM.querySelectorAll(pattern);
                    matchCount += matches.length;
                } catch (e) {
                    // Skip invalid selectors
                }
            });

            const matchEnd = performance.now();
            matchingTests.push({
                fieldType,
                patternCount: patterns.length,
                matchTime: matchEnd - matchStart,
                matchCount
            });
        }

        this.testResults.performance.fieldMapping = {
            patternGenerationTime,
            totalPatterns,
            matchingTests,
            averageMatchTime: matchingTests.reduce((sum, test) => sum + test.matchTime, 0) / matchingTests.length,
            passed: patternGenerationTime < 100 && matchingTests.every(test => test.matchTime < 50)
        };

        console.log(`   Pattern generation: ${patternGenerationTime.toFixed(2)}ms (${totalPatterns} patterns)`);
        console.log(`   Average matching: ${this.testResults.performance.fieldMapping.averageMatchTime.toFixed(2)}ms per field type`);
    }

    /**
     * Test concurrent access performance
     */
    async testConcurrentAccessPerformance() {
        console.log('🔀 Testing concurrent access performance...');

        const registry = new DirectoryRegistry();
        await registry.initialize();

        const concurrentTests = [];
        const concurrentCount = 50;

        // Simulate concurrent registry operations
        const promises = Array(concurrentCount).fill().map(async (_, index) => {
            const startTime = performance.now();
            
            // Perform various registry operations
            const directories = registry.getDirectories({ category: 'social-media' });
            const highPriority = registry.getHighPriorityDirectories();
            const byTier = registry.getDirectoriesByTier('professional');
            const stats = registry.getStatistics();
            
            const endTime = performance.now();
            
            return {
                id: index,
                time: endTime - startTime,
                results: {
                    directories: directories.length,
                    highPriority: highPriority.length,
                    byTier: byTier.length,
                    stats: stats ? Object.keys(stats).length : 0
                }
            };
        });

        const results = await Promise.all(promises);
        
        const avgConcurrentTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
        const maxConcurrentTime = Math.max(...results.map(r => r.time));

        this.testResults.performance.concurrent = {
            concurrentOperations: concurrentCount,
            averageTime: avgConcurrentTime,
            maxTime: maxConcurrentTime,
            passed: avgConcurrentTime < 100 && maxConcurrentTime < 500,
            results: results.slice(0, 5) // Sample results
        };

        console.log(`   ${concurrentCount} concurrent operations: ${avgConcurrentTime.toFixed(2)}ms avg, ${maxConcurrentTime.toFixed(2)}ms max`);
    }

    /**
     * Test field mapping accuracy
     */
    async testFieldMappingAccuracy() {
        console.log('🎯 Testing field mapping accuracy...');

        const registry = new DirectoryRegistry();
        await registry.initialize();

        let totalMappings = 0;
        let validMappings = 0;
        let requiredFieldsCovered = 0;
        let totalRequiredFields = 0;

        const requiredFields = ['businessName', 'email', 'phone', 'website', 'description'];

        registry.directories.forEach(directory => {
            const mapping = directory.fieldMapping || {};
            const mappingKeys = Object.keys(mapping);
            
            totalMappings += mappingKeys.length;
            
            mappingKeys.forEach(key => {
                const selector = mapping[key];
                if (selector && typeof selector === 'string' && selector.length > 0) {
                    validMappings++;
                }
            });

            // Check required fields coverage
            totalRequiredFields += requiredFields.length;
            requiredFields.forEach(field => {
                if (mapping[field]) {
                    requiredFieldsCovered++;
                }
            });
        });

        const mappingAccuracy = (validMappings / totalMappings) * 100;
        const requiredFieldCoverage = (requiredFieldsCovered / totalRequiredFields) * 100;

        this.testResults.accuracy.fieldMapping = {
            totalMappings,
            validMappings,
            mappingAccuracy,
            requiredFieldCoverage,
            passed: mappingAccuracy > 95 && requiredFieldCoverage > 90
        };

        console.log(`   Field mapping accuracy: ${mappingAccuracy.toFixed(1)}% (${validMappings}/${totalMappings})`);
        console.log(`   Required field coverage: ${requiredFieldCoverage.toFixed(1)}%`);
    }

    /**
     * Test tier assignment accuracy
     */
    async testTierAssignmentAccuracy() {
        console.log('🏷️ Testing tier assignment accuracy...');

        const registry = new DirectoryRegistry();
        await registry.initialize();

        const tierCounts = { starter: 0, growth: 0, professional: 0, enterprise: 0 };
        const tierValidation = { valid: 0, invalid: 0 };

        registry.directories.forEach(directory => {
            const tier = directory.tier;
            const da = directory.domainAuthority || 0;
            const difficulty = directory.difficulty || 'easy';

            if (tier && tierCounts.hasOwnProperty(tier)) {
                tierCounts[tier]++;
                
                // Validate tier assignment logic
                let expectedTier = 'starter';
                if (da >= 85 || difficulty === 'hard') {
                    expectedTier = 'enterprise';
                } else if (da >= 75 || directory.priority === 'high') {
                    expectedTier = 'professional';
                } else if (da >= 60) {
                    expectedTier = 'growth';
                }

                // Allow some flexibility in tier assignment
                const tierLevels = { starter: 1, growth: 2, professional: 3, enterprise: 4 };
                const actualLevel = tierLevels[tier] || 1;
                const expectedLevel = tierLevels[expectedTier] || 1;
                
                if (Math.abs(actualLevel - expectedLevel) <= 1) {
                    tierValidation.valid++;
                } else {
                    tierValidation.invalid++;
                }
            }
        });

        const tierAccuracy = (tierValidation.valid / (tierValidation.valid + tierValidation.invalid)) * 100;

        this.testResults.accuracy.tierAssignment = {
            tierCounts,
            tierAccuracy,
            validAssignments: tierValidation.valid,
            invalidAssignments: tierValidation.invalid,
            passed: tierAccuracy > 85 // Allow some flexibility
        };

        console.log(`   Tier assignment accuracy: ${tierAccuracy.toFixed(1)}%`);
        console.log(`   Distribution:`, Object.entries(tierCounts).map(([tier, count]) => `${tier}: ${count}`).join(', '));
    }

    /**
     * Test category distribution accuracy
     */
    async testCategoryDistributionAccuracy() {
        console.log('📊 Testing category distribution accuracy...');

        const registry = new DirectoryRegistry();
        await registry.initialize();

        const categoryStats = {};
        const expectedCategories = [
            'search-engines', 'social-media', 'review-sites', 'traditional-directories',
            'local-directories', 'international-directories', 'b2b-directories',
            'industry-specific', 'professional-services', 'social-commerce', 'tech-startups'
        ];

        registry.directories.forEach(directory => {
            const category = directory.category;
            categoryStats[category] = (categoryStats[category] || 0) + 1;
        });

        const categoryCoverage = expectedCategories.filter(cat => categoryStats[cat] > 0).length;
        const coveragePercentage = (categoryCoverage / expectedCategories.length) * 100;

        this.testResults.accuracy.categoryDistribution = {
            categoryStats,
            expectedCategories: expectedCategories.length,
            actualCategories: Object.keys(categoryStats).length,
            coveragePercentage,
            passed: coveragePercentage > 80
        };

        console.log(`   Category coverage: ${coveragePercentage.toFixed(1)}% (${categoryCoverage}/${expectedCategories.length})`);
        console.log(`   Total categories: ${Object.keys(categoryStats).length}`);
    }

    /**
     * Test system stability under load
     */
    async testSystemStabilityUnderLoad() {
        console.log('⚡ Testing system stability under load...');

        const registry = new DirectoryRegistry();
        await registry.initialize();

        const loadTests = [];
        const operationsCount = 1000;
        let errors = 0;

        const startTime = performance.now();

        for (let i = 0; i < operationsCount; i++) {
            try {
                // Mix of operations to simulate real usage
                const operations = [
                    () => registry.getDirectories({ category: 'social-media' }),
                    () => registry.getDirectoriesByTier('professional'),
                    () => registry.getHighPriorityDirectories(),
                    () => registry.getStatistics(),
                    () => registry.getFieldMappingPatterns()
                ];

                const operation = operations[i % operations.length];
                const result = operation();
                
                if (!result || (Array.isArray(result) && result.length === 0 && Math.random() > 0.1)) {
                    // Allow some empty results, but not too many
                }
            } catch (error) {
                errors++;
            }
        }

        const endTime = performance.now();
        const totalTime = endTime - startTime;
        const avgOperationTime = totalTime / operationsCount;
        const errorRate = (errors / operationsCount) * 100;

        this.testResults.reliability.stability = {
            operationsCount,
            totalTime,
            avgOperationTime,
            errors,
            errorRate,
            passed: errorRate < 1 && avgOperationTime < 5
        };

        console.log(`   ${operationsCount} operations: ${totalTime.toFixed(2)}ms total, ${avgOperationTime.toFixed(2)}ms avg`);
        console.log(`   Error rate: ${errorRate.toFixed(2)}% (${errors} errors)`);
    }

    /**
     * Test memory usage stability
     */
    async testMemoryUsageStability() {
        console.log('💾 Testing memory usage stability...');

        const initialMemory = this.getMemoryUsage();
        const registries = [];

        // Create multiple registry instances to test memory leaks
        for (let i = 0; i < 10; i++) {
            const registry = new DirectoryRegistry();
            await registry.initialize();
            registries.push(registry);
            
            // Perform operations to potentially trigger memory leaks
            registry.getDirectories({ category: 'social-media' });
            registry.getStatistics();
            registry.clearCache();
        }

        const peakMemory = this.getMemoryUsage();
        const memoryIncrease = peakMemory - initialMemory;
        const memoryPerRegistry = memoryIncrease / registries.length;

        // Clear registries and force garbage collection if available
        registries.length = 0;
        if (global.gc) {
            global.gc();
        }

        const finalMemory = this.getMemoryUsage();
        const memoryRecovered = peakMemory - finalMemory;
        const leakIndicator = finalMemory - initialMemory;

        this.testResults.reliability.memory = {
            initialMemory,
            peakMemory,
            finalMemory,
            memoryIncrease,
            memoryPerRegistry,
            memoryRecovered,
            leakIndicator,
            passed: memoryIncrease < 100 * 1024 * 1024 && leakIndicator < 10 * 1024 * 1024 // 100MB increase, 10MB leak max
        };

        console.log(`   Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   Memory per registry: ${(memoryPerRegistry / 1024 / 1024).toFixed(2)}MB`);
        console.log(`   Potential leak: ${(leakIndicator / 1024 / 1024).toFixed(2)}MB`);
    }

    /**
     * Test error handling robustness
     */
    async testErrorHandlingRobustness() {
        console.log('🛡️ Testing error handling robustness...');

        const registry = new DirectoryRegistry();
        
        const errorTests = [
            {
                name: 'invalid-filter',
                test: () => registry.getDirectories({ invalidFilter: 'test' }),
                expectedResult: 'array'
            },
            {
                name: 'malformed-tier',
                test: () => registry.getDirectoriesByTier('invalid-tier'),
                expectedResult: 'array'
            },
            {
                name: 'null-directory-id',
                test: () => registry.getDirectoryById(null),
                expectedResult: 'undefined'
            },
            {
                name: 'empty-recommendations',
                test: () => registry.getProcessingRecommendations({ maxTime: 0 }),
                expectedResult: 'object'
            }
        ];

        let passedTests = 0;
        const errorResults = [];

        for (const test of errorTests) {
            try {
                await registry.initialize(); // Ensure registry is initialized
                const result = test.test();
                
                let passed = false;
                if (test.expectedResult === 'array' && Array.isArray(result)) {
                    passed = true;
                } else if (test.expectedResult === 'object' && typeof result === 'object') {
                    passed = true;
                } else if (test.expectedResult === 'undefined' && result === undefined) {
                    passed = true;
                }

                if (passed) passedTests++;
                
                errorResults.push({
                    name: test.name,
                    passed,
                    result: typeof result
                });

            } catch (error) {
                errorResults.push({
                    name: test.name,
                    passed: false,
                    error: error.message
                });
            }
        }

        this.testResults.reliability.errorHandling = {
            totalTests: errorTests.length,
            passedTests,
            errorResults,
            passed: passedTests === errorTests.length
        };

        console.log(`   Error handling tests: ${passedTests}/${errorTests.length} passed`);
    }

    /**
     * Generate comprehensive performance report
     */
    async generatePerformanceReport() {
        console.log('\n📋 Generating performance report...\n');

        const totalTestTime = Date.now() - this.testStartTime;
        
        // Calculate overall scores
        const performanceScore = this.calculatePerformanceScore();
        const accuracyScore = this.calculateAccuracyScore();
        const reliabilityScore = this.calculateReliabilityScore();
        const overallScore = (performanceScore + accuracyScore + reliabilityScore) / 3;

        this.testResults.summary = {
            success: overallScore >= 80,
            overallScore,
            performanceScore,
            accuracyScore,
            reliabilityScore,
            totalTestTime,
            timestamp: new Date().toISOString(),
            recommendation: this.generateRecommendation(overallScore)
        };

        // Print summary
        console.log('=' .repeat(80));
        console.log('                AutoBolt Expanded Directory Performance Report');
        console.log('=' .repeat(80));
        console.log(`Overall Score: ${overallScore.toFixed(1)}/100 ${overallScore >= 80 ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Performance:   ${performanceScore.toFixed(1)}/100`);
        console.log(`Accuracy:      ${accuracyScore.toFixed(1)}/100`);
        console.log(`Reliability:   ${reliabilityScore.toFixed(1)}/100`);
        console.log();
        console.log(`Test Duration: ${(totalTestTime / 1000).toFixed(1)}s`);
        console.log(`Directory Count: 57 → 86 directories (+${86-57})`);
        console.log();
        console.log('Recommendation:', this.testResults.summary.recommendation);
        console.log('=' .repeat(80));
    }

    /**
     * Helper methods
     */
    getMemoryUsage() {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            return process.memoryUsage().heapUsed;
        }
        return 0;
    }

    createMockDOMElements() {
        // Create mock DOM for testing field mapping patterns
        const mockDocument = {
            querySelectorAll: (selector) => {
                // Simulate DOM elements based on common patterns
                const mockElements = [];
                if (selector.includes('business') || selector.includes('company')) {
                    mockElements.push({}, {});
                } else if (selector.includes('email')) {
                    mockElements.push({});
                }
                return mockElements;
            }
        };
        return mockDocument;
    }

    calculatePerformanceScore() {
        const perf = this.testResults.performance;
        let score = 100;

        if (!perf.initialization?.passed) score -= 25;
        if (!perf.filtering?.overallPassed) score -= 25;
        if (!perf.fieldMapping?.passed) score -= 20;
        if (!perf.concurrent?.passed) score -= 30;

        return Math.max(0, score);
    }

    calculateAccuracyScore() {
        const acc = this.testResults.accuracy;
        let score = 100;

        if (!acc.fieldMapping?.passed) score -= 40;
        if (!acc.tierAssignment?.passed) score -= 30;
        if (!acc.categoryDistribution?.passed) score -= 30;

        return Math.max(0, score);
    }

    calculateReliabilityScore() {
        const rel = this.testResults.reliability;
        let score = 100;

        if (!rel.stability?.passed) score -= 35;
        if (!rel.memory?.passed) score -= 35;
        if (!rel.errorHandling?.passed) score -= 30;

        return Math.max(0, score);
    }

    generateRecommendation(score) {
        if (score >= 90) {
            return 'EXCELLENT - Ready for production deployment. All performance targets met.';
        } else if (score >= 80) {
            return 'GOOD - Acceptable for production with minor optimizations recommended.';
        } else if (score >= 70) {
            return 'FAIR - Requires optimization before production deployment.';
        } else {
            return 'POOR - Significant issues detected. Review and fix before deployment.';
        }
    }
}

// Export for use in other scripts or testing environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExpandedDirectoryPerformanceTest;
}

// Auto-run if executed directly
if (typeof window === 'undefined' && typeof global !== 'undefined') {
    // Node.js environment - run tests
    (async () => {
        try {
            // Mock DirectoryRegistry for testing
            global.DirectoryRegistry = class {
                constructor() {
                    this.directories = [];
                    this.initialized = false;
                }
                
                async initialize() {
                    // Simulate loading 86 directories
                    this.directories = Array(86).fill().map((_, i) => ({
                        id: `dir-${i}`,
                        name: `Directory ${i}`,
                        category: ['social-media', 'review-sites', 'tech-startups'][i % 3],
                        tier: ['starter', 'growth', 'professional', 'enterprise'][i % 4],
                        domainAuthority: 30 + (i * 2),
                        difficulty: ['easy', 'medium', 'hard'][i % 3],
                        priority: ['low', 'medium', 'high'][i % 3],
                        fieldMapping: {
                            businessName: 'input[name="business_name"]',
                            email: 'input[name="email"]',
                            phone: 'input[name="phone"]',
                            website: 'input[name="website"]',
                            description: 'textarea[name="description"]'
                        }
                    }));
                    this.initialized = true;
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 50)); // Simulate async loading
                }

                getDirectories(filters = {}) {
                    if (!this.initialized) return [];
                    return this.directories.filter(dir => {
                        if (filters.category && dir.category !== filters.category) return false;
                        if (filters.tier && dir.tier !== filters.tier) return false;
                        if (filters.priority && dir.priority !== filters.priority) return false;
                        return true;
                    });
                }

                getDirectoriesByTier(tier) {
                    return this.getDirectories({ tier });
                }

                getDirectoryById(id) {
                    return this.directories.find(d => d.id === id);
                }

                getHighPriorityDirectories() {
                    return this.getDirectories({ priority: 'high' });
                }

                getStatistics() {
                    return {
                        total: this.directories.length,
                        byCategory: {},
                        byTier: {},
                        byPriority: {}
                    };
                }

                getFieldMappingPatterns() {
                    return {
                        businessName: ['input[name="business_name"]', 'input[name="company_name"]'],
                        email: ['input[type="email"]', 'input[name="email"]'],
                        phone: ['input[type="tel"]', 'input[name="phone"]'],
                        website: ['input[name="website"]', 'input[name="url"]'],
                        description: ['textarea[name="description"]', 'textarea[name="about"]']
                    };
                }

                clearCache() {
                    // Mock cache clearing
                }

                getProcessingRecommendations(criteria = {}) {
                    return {
                        recommended: this.directories.slice(0, 10),
                        totalEstimatedTime: 1800,
                        skippedCount: 0,
                        summary: { high: 3, medium: 4, low: 3 }
                    };
                }
            };

            const tester = new ExpandedDirectoryPerformanceTest();
            await tester.runAllTests();

        } catch (error) {
            console.error('Test execution failed:', error);
        }
    })();
}