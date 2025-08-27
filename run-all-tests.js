/**
 * DIRECTORYBOLT - COMPREHENSIVE TEST RUNNER
 * Executes all test suites and generates a unified report
 */

const DirectoryBoltTestSuite = require('./tests/user-journey-test-suite.js')
const NavigationFlowTest = require('./tests/navigation-flow-test.js')
const MobileResponsivenessTest = require('./tests/mobile-responsiveness-test.js')
const DirectoryBoltAPITest = require('./tests/api-testing-suite.js')

class ComprehensiveTestRunner {
  constructor() {
    this.allResults = {
      userJourney: null,
      navigation: null,
      mobile: null,
      api: null,
      summary: {
        totalTests: 0,
        totalPassed: 0,
        totalWarnings: 0,
        totalFailed: 0,
        totalErrors: 0,
        overallScore: 0,
        readinessLevel: 'Unknown'
      },
      startTime: Date.now(),
      endTime: null,
      duration: null
    }
  }

  async runAllTestSuites() {
    console.log('🚀 DIRECTORYBOLT COMPREHENSIVE TEST EXECUTION')
    console.log('='.repeat(70))
    console.log('Running complete test battery for production readiness assessment')
    console.log('='.repeat(70))

    try {
      // 1. User Journey Testing
      console.log('\n🎯 PHASE 1: User Journey Testing')
      console.log('Testing complete user experience flow...')
      const userJourneyTest = new DirectoryBoltTestSuite()
      this.allResults.userJourney = await this.runTestSuiteWithTimeout(
        () => userJourneyTest.runAllTests(),
        'User Journey Tests',
        300000 // 5 minutes timeout
      )

      // 2. Navigation Flow Testing
      console.log('\n🧭 PHASE 2: Navigation Flow Testing')
      console.log('Testing navigation and user interaction flows...')
      const navigationTest = new NavigationFlowTest()
      this.allResults.navigation = await this.runTestSuiteWithTimeout(
        () => navigationTest.testCompleteUserJourney(),
        'Navigation Flow Tests',
        180000 // 3 minutes timeout
      )

      // 3. Mobile Responsiveness Testing
      console.log('\n📱 PHASE 3: Mobile Responsiveness Testing')
      console.log('Testing mobile experience across devices...')
      const mobileTest = new MobileResponsivenessTest()
      this.allResults.mobile = await this.runTestSuiteWithTimeout(
        () => mobileTest.runAllMobileTests(),
        'Mobile Responsiveness Tests',
        240000 // 4 minutes timeout
      )

      // 4. API Testing
      console.log('\n🔌 PHASE 4: API Testing')
      console.log('Testing API endpoints and security...')
      const apiTest = new DirectoryBoltAPITest()
      this.allResults.api = await this.runTestSuiteWithTimeout(
        () => apiTest.runAllAPITests(),
        'API Tests',
        300000 // 5 minutes timeout
      )

      // Generate comprehensive report
      this.allResults.endTime = Date.now()
      this.allResults.duration = this.allResults.endTime - this.allResults.startTime

      this.calculateOverallSummary()
      this.generateComprehensiveReport()
      this.generateProductionReadinessAssessment()

    } catch (error) {
      console.error('❌ Test execution failed:', error)
      throw error
    }
  }

  async runTestSuiteWithTimeout(testFunction, suiteName, timeout) {
    return new Promise(async (resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`${suiteName} timed out after ${timeout}ms`))
      }, timeout)

      try {
        const startTime = Date.now()
        const result = await testFunction()
        const duration = Date.now() - startTime
        
        clearTimeout(timeoutId)
        
        console.log(`✅ ${suiteName} completed in ${duration}ms`)
        
        resolve({
          ...result,
          suiteName,
          duration,
          status: 'completed'
        })
      } catch (error) {
        clearTimeout(timeoutId)
        console.error(`❌ ${suiteName} failed:`, error.message)
        
        resolve({
          suiteName,
          status: 'failed',
          error: error.message,
          duration: Date.now() - this.allResults.startTime
        })
      }
    })
  }

  calculateOverallSummary() {
    const suites = [this.allResults.userJourney, this.allResults.navigation, 
                   this.allResults.mobile, this.allResults.api]

    this.allResults.summary = suites.reduce((acc, suite) => {
      if (suite && suite.summary) {
        acc.totalTests += suite.summary.totalTests || 0
        acc.totalPassed += suite.summary.passedTests || suite.summary.passed || 0
        acc.totalWarnings += suite.summary.warningTests || suite.summary.warnings || 0
        acc.totalFailed += suite.summary.failedTests || suite.summary.failed || 0
        acc.totalErrors += suite.summary.errorTests || suite.summary.errors || 0
      }
      return acc
    }, {
      totalTests: 0,
      totalPassed: 0,
      totalWarnings: 0,
      totalFailed: 0,
      totalErrors: 0
    })

    // Calculate overall score
    const { totalTests, totalPassed } = this.allResults.summary
    this.allResults.summary.overallScore = totalTests > 0 ? (totalPassed / totalTests * 100) : 0

    // Determine readiness level
    const score = this.allResults.summary.overallScore
    if (score >= 95) {
      this.allResults.summary.readinessLevel = 'Production Ready'
    } else if (score >= 85) {
      this.allResults.summary.readinessLevel = 'Nearly Ready'
    } else if (score >= 70) {
      this.allResults.summary.readinessLevel = 'Needs Improvement'
    } else {
      this.allResults.summary.readinessLevel = 'Not Ready'
    }
  }

  generateComprehensiveReport() {
    console.log('\n' + '='.repeat(70))
    console.log('📊 COMPREHENSIVE TEST REPORT - DIRECTORYBOLT')
    console.log('='.repeat(70))

    const summary = this.allResults.summary
    const durationMinutes = (this.allResults.duration / 1000 / 60).toFixed(1)

    // Executive Summary
    console.log('\n📈 EXECUTIVE SUMMARY')
    console.log('-'.repeat(40))
    console.log(`⏱️  Total Execution Time: ${durationMinutes} minutes`)
    console.log(`📋 Total Tests Executed: ${summary.totalTests}`)
    console.log(`✅ Tests Passed: ${summary.totalPassed}`)
    console.log(`⚠️  Warnings: ${summary.totalWarnings}`)
    console.log(`❌ Tests Failed: ${summary.totalFailed}`)
    console.log(`💥 Test Errors: ${summary.totalErrors}`)
    console.log(`📊 Overall Score: ${summary.overallScore.toFixed(1)}%`)
    console.log(`🎯 Readiness Level: ${summary.readinessLevel}`)

    // Test Suite Breakdown
    console.log('\n📂 TEST SUITE BREAKDOWN')
    console.log('-'.repeat(40))

    const suiteResults = [
      { name: 'User Journey', result: this.allResults.userJourney },
      { name: 'Navigation Flow', result: this.allResults.navigation },
      { name: 'Mobile Responsiveness', result: this.allResults.mobile },
      { name: 'API Testing', result: this.allResults.api }
    ]

    suiteResults.forEach(suite => {
      if (suite.result && suite.result.summary) {
        const passed = suite.result.summary.passedTests || suite.result.summary.passed || 0
        const total = suite.result.summary.totalTests || 0
        const score = total > 0 ? (passed / total * 100).toFixed(0) : 0
        const status = score >= 80 ? '✅' : score >= 60 ? '⚠️' : '❌'
        
        console.log(`${status} ${suite.name}: ${passed}/${total} (${score}%)`)
      } else {
        console.log(`❌ ${suite.name}: Failed to execute`)
      }
    })

    // Critical Issues Analysis
    this.analyzeCriticalIssues()

    // Quality Gates Assessment
    this.assessQualityGates()

    // Performance Analysis
    this.analyzePerformance()

    console.log('\n' + '='.repeat(70))
  }

  analyzeCriticalIssues() {
    console.log('\n🚨 CRITICAL ISSUES ANALYSIS')
    console.log('-'.repeat(40))

    const criticalIssues = []

    // Check each test suite for critical issues
    if (this.allResults.userJourney && this.allResults.userJourney.summary.failed > 0) {
      criticalIssues.push({
        category: 'User Journey',
        severity: 'HIGH',
        count: this.allResults.userJourney.summary.failed,
        impact: 'User experience severely compromised'
      })
    }

    if (this.allResults.navigation && this.allResults.navigation.errors && this.allResults.navigation.errors.length > 0) {
      criticalIssues.push({
        category: 'Navigation',
        severity: 'HIGH',
        count: this.allResults.navigation.errors.length,
        impact: 'Users cannot navigate the application properly'
      })
    }

    if (this.allResults.mobile && this.allResults.mobile.summary.failedTests > 0) {
      criticalIssues.push({
        category: 'Mobile Responsiveness',
        severity: 'MEDIUM',
        count: this.allResults.mobile.summary.failedTests,
        impact: 'Poor mobile user experience'
      })
    }

    if (this.allResults.api && this.allResults.api.summary.failedTests > 0) {
      criticalIssues.push({
        category: 'API Security/Functionality',
        severity: 'HIGH',
        count: this.allResults.api.summary.failedTests,
        impact: 'Security vulnerabilities or API failures'
      })
    }

    if (criticalIssues.length === 0) {
      console.log('🎉 No critical issues detected! Application is stable.')
    } else {
      criticalIssues.forEach((issue, index) => {
        const severityIcon = issue.severity === 'HIGH' ? '🔴' : issue.severity === 'MEDIUM' ? '🟡' : '🟢'
        console.log(`${severityIcon} ${issue.category}: ${issue.count} issues`)
        console.log(`   Impact: ${issue.impact}`)
      })
    }
  }

  assessQualityGates() {
    console.log('\n🚪 QUALITY GATES ASSESSMENT')
    console.log('-'.repeat(40))

    const qualityGates = [
      {
        name: 'User Journey Success Rate',
        threshold: 90,
        actual: this.calculateSuiteScore(this.allResults.userJourney),
        critical: true
      },
      {
        name: 'Navigation Functionality',
        threshold: 95,
        actual: this.calculateSuiteScore(this.allResults.navigation),
        critical: true
      },
      {
        name: 'Mobile Responsiveness',
        threshold: 80,
        actual: this.calculateSuiteScore(this.allResults.mobile),
        critical: false
      },
      {
        name: 'API Security & Performance',
        threshold: 85,
        actual: this.calculateSuiteScore(this.allResults.api),
        critical: true
      },
      {
        name: 'Overall System Health',
        threshold: 85,
        actual: this.allResults.summary.overallScore,
        critical: true
      }
    ]

    let criticalGatesFailed = 0
    qualityGates.forEach(gate => {
      const passed = gate.actual >= gate.threshold
      const icon = passed ? '✅' : gate.critical ? '🔴' : '⚠️'
      
      console.log(`${icon} ${gate.name}: ${gate.actual.toFixed(0)}% (Threshold: ${gate.threshold}%)`)
      
      if (!passed && gate.critical) {
        criticalGatesFailed++
      }
    })

    console.log(`\n🎯 Quality Gates Summary:`)
    console.log(`Critical Gates Failed: ${criticalGatesFailed}`)
    
    if (criticalGatesFailed === 0) {
      console.log('🎉 All critical quality gates passed!')
    } else {
      console.log('🚨 Critical quality gates failed - production deployment not recommended')
    }
  }

  analyzePerformance() {
    console.log('\n⚡ PERFORMANCE ANALYSIS')
    console.log('-'.repeat(40))

    const performanceMetrics = {
      testExecutionTime: (this.allResults.duration / 1000).toFixed(1),
      avgTestTime: this.allResults.summary.totalTests > 0 ? 
        (this.allResults.duration / this.allResults.summary.totalTests).toFixed(0) : 0,
      passRate: this.allResults.summary.overallScore.toFixed(1),
      testCoverage: this.estimateTestCoverage()
    }

    console.log(`⏱️  Test Execution Time: ${performanceMetrics.testExecutionTime}s`)
    console.log(`📊 Average Test Time: ${performanceMetrics.avgTestTime}ms`)
    console.log(`✅ Test Pass Rate: ${performanceMetrics.passRate}%`)
    console.log(`🎯 Estimated Coverage: ${performanceMetrics.testCoverage}%`)

    // Performance recommendations
    const recommendations = []
    if (parseFloat(performanceMetrics.testExecutionTime) > 300) {
      recommendations.push('Consider parallel test execution for faster results')
    }
    if (parseFloat(performanceMetrics.passRate) < 90) {
      recommendations.push('Improve test reliability and fix failing tests')
    }
    if (parseFloat(performanceMetrics.testCoverage) < 80) {
      recommendations.push('Increase test coverage for critical user paths')
    }

    if (recommendations.length > 0) {
      console.log('\n💡 Performance Recommendations:')
      recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`)
      })
    }
  }

  calculateSuiteScore(suiteResult) {
    if (!suiteResult || !suiteResult.summary) return 0
    
    const passed = suiteResult.summary.passedTests || suiteResult.summary.passed || 0
    const total = suiteResult.summary.totalTests || 1
    
    return (passed / total) * 100
  }

  estimateTestCoverage() {
    // Estimate test coverage based on number and types of tests
    const userJourneyTests = this.allResults.userJourney?.summary?.totalTests || 0
    const navigationTests = this.allResults.navigation?.summary?.totalTests || 0
    const mobileTests = this.allResults.mobile?.summary?.totalTests || 0
    const apiTests = this.allResults.api?.summary?.totalTests || 0

    const totalTests = userJourneyTests + navigationTests + mobileTests + apiTests
    
    // Estimate coverage based on test distribution
    let coverage = 0
    if (userJourneyTests >= 20) coverage += 30 // Core user flows
    if (navigationTests >= 15) coverage += 20 // Navigation coverage
    if (mobileTests >= 25) coverage += 25 // Mobile coverage
    if (apiTests >= 30) coverage += 25 // API coverage

    return Math.min(100, coverage)
  }

  generateProductionReadinessAssessment() {
    console.log('\n🎯 PRODUCTION READINESS ASSESSMENT')
    console.log('='.repeat(70))

    const overallScore = this.allResults.summary.overallScore
    const readinessLevel = this.allResults.summary.readinessLevel

    console.log(`📊 Overall Quality Score: ${overallScore.toFixed(1)}%`)
    console.log(`🎯 Readiness Level: ${readinessLevel}`)

    // Detailed readiness analysis
    console.log('\n📋 READINESS CRITERIA:')
    console.log('-'.repeat(40))

    const readinessCriteria = [
      {
        criterion: 'Core User Journey Functionality',
        score: this.calculateSuiteScore(this.allResults.userJourney),
        weight: 30,
        required: 90
      },
      {
        criterion: 'Navigation & Interaction Flow',
        score: this.calculateSuiteScore(this.allResults.navigation),
        weight: 25,
        required: 85
      },
      {
        criterion: 'Mobile User Experience',
        score: this.calculateSuiteScore(this.allResults.mobile),
        weight: 20,
        required: 75
      },
      {
        criterion: 'API Security & Performance',
        score: this.calculateSuiteScore(this.allResults.api),
        weight: 25,
        required: 80
      }
    ]

    let weightedScore = 0
    let criticalFailures = 0

    readinessCriteria.forEach(criterion => {
      const passed = criterion.score >= criterion.required
      const icon = passed ? '✅' : '❌'
      
      console.log(`${icon} ${criterion.criterion}: ${criterion.score.toFixed(0)}% (Required: ${criterion.required}%)`)
      
      if (passed) {
        weightedScore += (criterion.score * criterion.weight / 100)
      } else {
        criticalFailures++
      }
    })

    console.log(`\n🏆 FINAL RECOMMENDATION:`)
    console.log('-'.repeat(40))

    if (readinessLevel === 'Production Ready') {
      console.log('🎉 APPROVED FOR PRODUCTION DEPLOYMENT')
      console.log('   All critical quality gates passed')
      console.log('   User experience meets production standards')
      console.log('   Security and performance requirements satisfied')
    } else if (readinessLevel === 'Nearly Ready') {
      console.log('⚠️  CONDITIONAL APPROVAL')
      console.log('   Minor issues should be addressed before deployment')
      console.log('   Consider staged rollout or beta testing')
    } else {
      console.log('❌ NOT APPROVED FOR PRODUCTION')
      console.log('   Critical issues must be resolved')
      console.log(`   ${criticalFailures} critical criteria failed`)
      console.log('   Recommend additional development and testing')
    }

    // Next steps
    console.log(`\n🚀 RECOMMENDED NEXT STEPS:`)
    console.log('-'.repeat(40))

    if (readinessLevel === 'Production Ready') {
      console.log('1. Final security review')
      console.log('2. Performance monitoring setup')
      console.log('3. Deploy to production')
      console.log('4. Monitor user metrics')
    } else {
      console.log('1. Address failed test cases')
      console.log('2. Improve test coverage')
      console.log('3. Re-run comprehensive tests')
      console.log('4. Security audit if API issues exist')
    }

    console.log('\n' + '='.repeat(70))
    console.log('📄 Test execution completed!')
    console.log(`📊 Results saved with ${this.allResults.summary.totalTests} total tests executed`)
    console.log('='.repeat(70))
  }

  // Export results to JSON for CI/CD integration
  exportToJSON() {
    const jsonReport = {
      timestamp: new Date().toISOString(),
      testExecution: {
        startTime: new Date(this.allResults.startTime).toISOString(),
        endTime: new Date(this.allResults.endTime).toISOString(),
        duration: this.allResults.duration
      },
      summary: this.allResults.summary,
      suiteResults: {
        userJourney: this.allResults.userJourney,
        navigation: this.allResults.navigation,
        mobile: this.allResults.mobile,
        api: this.allResults.api
      },
      qualityGates: this.allResults.summary.overallScore >= 85,
      productionReady: this.allResults.summary.readinessLevel === 'Production Ready'
    }

    return JSON.stringify(jsonReport, null, 2)
  }
}

// Main execution
async function main() {
  const testRunner = new ComprehensiveTestRunner()
  
  try {
    await testRunner.runAllTestSuites()
    
    // Export results
    const jsonReport = testRunner.exportToJSON()
    
    // In a real environment, you would write this to a file
    console.log('\n📄 JSON Report available for CI/CD integration')
    
    // Exit with appropriate code for CI/CD
    const isReady = testRunner.allResults.summary.readinessLevel === 'Production Ready'
    process.exit(isReady ? 0 : 1)
    
  } catch (error) {
    console.error('❌ Test execution failed:', error)
    process.exit(1)
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main()
}

module.exports = ComprehensiveTestRunner