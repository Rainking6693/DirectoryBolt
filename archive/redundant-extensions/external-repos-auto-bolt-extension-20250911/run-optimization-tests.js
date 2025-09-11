/**
 * Test Runner for Optimization Validation
 */

const OptimizationTester = require('./optimization-test.js');

async function runTests() {
    try {
        console.log('🚀 Starting Auto-Bolt Optimization Test Suite...\n');
        
        const tester = new OptimizationTester();
        const success = await tester.runAllTests();
        
        if (success) {
            console.log('\n🎉 OPTIMIZATION COMPLETE - ALL TARGETS ACHIEVED!');
            process.exit(0);
        } else {
            console.log('\n⚠️ OPTIMIZATION PARTIAL - Review results above');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
        process.exit(1);
    }
}

runTests();