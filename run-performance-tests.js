/**
 * Atlas Performance Test Runner
 * Execute comprehensive performance assessment of Chrome extension
 */

async function runAtlasPerformanceTests() {
    console.log('🚀 Starting Atlas Performance Assessment...');
    console.log('📊 Testing Chrome Extension Performance Post-Manifest Optimization');
    
    try {
        // Load the performance test suite
        if (typeof window.AtlasPerformanceTestSuite === 'undefined') {
            console.error('❌ AtlasPerformanceTestSuite not loaded. Please ensure performance-test-suite.js is included.');
            return;
        }
        
        // Initialize test suite
        const testSuite = new window.AtlasPerformanceTestSuite();
        
        // Run comprehensive assessment
        const report = await testSuite.runFullPerformanceAssessment();
        
        // Display results
        console.log('📈 PERFORMANCE ASSESSMENT COMPLETE');
        console.log('=====================================');
        
        if (report.success !== false) {
            displayPerformanceReport(report);
        } else {
            console.error('❌ Performance assessment failed:', report.error);
        }
        
        return report;
        
    } catch (error) {
        console.error('❌ Performance test execution failed:', error);
        return {
            success: false,
            error: error.message,
            timestamp: Date.now()
        };
    }
}

function displayPerformanceReport(report) {
    console.log(`🎯 Overall Score: ${report.executive_summary.overall_score.toFixed(1)}%`);
    console.log(`📊 Grade: ${report.executive_summary.performance_grade}`);
    console.log(`✅ Tests Passed: ${report.executive_summary.passed_tests}/${report.executive_summary.total_tests}`);
    console.log(`⚠️ Critical Issues: ${report.executive_summary.critical_issues}`);
    
    console.log('\n📋 TEST RESULTS:');
    console.log('================');
    
    // Extension Loading Performance
    if (report.detailed_results.extension_loading) {
        const test = report.detailed_results.extension_loading;
        console.log(`📱 Extension Loading: ${test.passed ? '✅ PASSED' : '❌ FAILED'}`);
        if (test.metrics) {
            console.log(`   - Total Init Time: ${test.metrics.totalInitTime.toFixed(0)}ms (Benchmark: ${test.metrics.benchmark}ms)`);
            console.log(`   - Service Worker: ${test.metrics.serviceWorkerResponseTime.toFixed(0)}ms`);
            console.log(`   - Background Init: ${test.metrics.backgroundInitTime.toFixed(0)}ms`);
            console.log(`   - Popup Load: ${test.metrics.popupLoadTime.toFixed(0)}ms`);
        }
    }
    
    // Content Script Performance
    if (report.detailed_results.content_scripts) {
        const test = report.detailed_results.content_scripts;
        console.log(`📝 Content Scripts: ${test.passed ? '✅ PASSED' : '❌ FAILED'}`);
        if (test.metrics) {
            console.log(`   - Avg Injection Time: ${test.metrics.avgInjectionTime.toFixed(0)}ms (Benchmark: ${test.metrics.benchmark}ms)`);
            console.log(`   - Success Rate: ${test.metrics.successRate.toFixed(1)}%`);
            console.log(`   - Sites Tested: ${test.metrics.totalSitesTested}`);
        }
    }
    
    // API Integration Performance
    if (report.detailed_results.api_integration) {
        const test = report.detailed_results.api_integration;
        console.log(`🌐 API Integration: ${test.passed ? '✅ PASSED' : '❌ FAILED'}`);
        if (test.metrics) {
            console.log(`   - Avg Response Time: ${test.metrics.avgResponseTime.toFixed(0)}ms (Benchmark: ${test.metrics.benchmark}ms)`);
            console.log(`   - Success Rate: ${test.metrics.successRate.toFixed(1)}%`);
            console.log(`   - Auth Time: ${test.metrics.authTime.toFixed(0)}ms`);
        }
    }
    
    // Memory Usage
    if (report.detailed_results.memory_usage) {
        const test = report.detailed_results.memory_usage;
        console.log(`🧠 Memory Usage: ${test.passed ? '✅ PASSED' : '❌ FAILED'}`);
        if (test.metrics) {
            console.log(`   - Final Memory: ${test.metrics.finalMemoryMB.toFixed(1)}MB (Benchmark: ${test.metrics.benchmarkMB.toFixed(1)}MB)`);
            console.log(`   - Memory Increase: ${test.metrics.memoryIncreaseMB.toFixed(1)}MB`);
            console.log(`   - Potential Leakage: ${test.metrics.memoryLeakageMB.toFixed(1)}MB`);
        }
    }
    
    // Manifest Optimization
    if (report.detailed_results.manifest_optimization) {
        const test = report.detailed_results.manifest_optimization;
        console.log(`📋 Manifest Optimization: ${test.passed ? '✅ PASSED' : '❌ FAILED'}`);
        if (test.metrics) {
            console.log(`   - Optimization Score: ${test.metrics.optimizationScore}%`);
            console.log(`   - Content Script Patterns: ${test.metrics.contentScriptPatterns}`);
            console.log(`   - Web Accessible Resources: ${test.metrics.webAccessibleResources}`);
        }
    }
    
    // Issues and Recommendations
    if (report.issues_identified && report.issues_identified.length > 0) {
        console.log('\n⚠️ ISSUES IDENTIFIED:');
        console.log('=====================');
        report.issues_identified.forEach(issue => {
            console.log(`[${issue.severity}] ${issue.type}: ${issue.message}`);
        });
    }
    
    if (report.optimization_recommendations && report.optimization_recommendations.length > 0) {
        console.log('\n🔧 OPTIMIZATION RECOMMENDATIONS:');
        console.log('=================================');
        report.optimization_recommendations.slice(0, 5).forEach((rec, index) => {
            console.log(`${index + 1}. [${rec.priority}] ${rec.category}: ${rec.action}`);
            console.log(`   Impact: ${rec.impact}`);
        });
    }
    
    // Manifest Analysis
    if (report.manifest_analysis) {
        console.log('\n📋 MANIFEST ANALYSIS:');
        console.log('=====================');
        console.log(`Current Structure: ${report.manifest_analysis.current_structure}`);
        console.log(`Pattern Count: ${report.manifest_analysis.patterns_count}`);
        console.log(`Resource Count: ${report.manifest_analysis.resources_count}`);
        
        console.log('\nOptimization Benefits:');
        report.manifest_analysis.optimization_benefits.forEach(benefit => {
            console.log(`  ✓ ${benefit}`);
        });
    }
    
    console.log('\n📈 PERFORMANCE BENCHMARKS MET:');
    console.log('==============================');
    Object.entries(report.performance_benchmarks).forEach(([key, value]) => {
        console.log(`${key.replace(/_/g, ' ')}: ${value}`);
    });
}

// Auto-run if script is loaded directly
if (typeof window !== 'undefined') {
    // Run tests after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runAtlasPerformanceTests);
    } else {
        // DOM is already ready
        setTimeout(runAtlasPerformanceTests, 100);
    }
}

// Export for manual execution
if (typeof window !== 'undefined') {
    window.runAtlasPerformanceTests = runAtlasPerformanceTests;
}

console.log('✅ Atlas Performance Test Runner loaded successfully');