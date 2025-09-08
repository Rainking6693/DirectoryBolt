/**
 * Phase 3.2: Enhanced Airtable Integration Test Suite
 * 
 * This test suite validates the enhanced Airtable integration including
 * AI analysis storage, caching functionality, and optimization tracking.
 */

const { createAirtableService } = require('../lib/services/airtable.ts')
const { createAIAnalysisCacheService } = require('../lib/services/ai-analysis-cache.ts')
const { createEnhancedAIIntegrationService } = require('../lib/services/enhanced-ai-integration.ts')

// Test configuration
const TEST_CONFIG = {
  testCustomerId: `TEST-${Date.now()}`,
  testBusinessData: {
    businessName: 'Test AI Enhanced Business',
    website: 'https://testbusiness.example.com',
    description: 'A test business for AI analysis integration testing',
    email: 'test@testbusiness.example.com',
    phone: '+1-555-0123',
    city: 'San Francisco',
    state: 'California',
    industry: 'Business Services'
  }
}

async function runEnhancedAirtableIntegrationTests() {
  console.log('🧪 Starting Enhanced Airtable Integration Tests - Phase 3.2')
  console.log('=' .repeat(60))

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  }

  try {
    // Test 1: Airtable Service with Enhanced Schema
    console.log('\n📊 Test 1: Enhanced Airtable Schema Support')
    await testEnhancedAirtableSchema(results)

    // Test 2: AI Analysis Storage
    console.log('\n🧠 Test 2: AI Analysis Results Storage')
    await testAIAnalysisStorage(results)

    // Test 3: Analysis Caching System
    console.log('\n💾 Test 3: Analysis Caching System')
    await testAnalysisCaching(results)

    // Test 4: Cache Validation and Expiry
    console.log('\n🕒 Test 4: Cache Validation and Expiry')
    await testCacheValidation(results)

    // Test 5: Optimization Progress Tracking
    console.log('\n📈 Test 5: Optimization Progress Tracking')
    await testOptimizationTracking(results)

    // Test 6: Enhanced AI Integration Service
    console.log('\n🚀 Test 6: Enhanced AI Integration Service')
    await testEnhancedAIIntegration(results)

    // Test 7: Customer Dashboard Data Retrieval
    console.log('\n📋 Test 7: Customer Dashboard Data')
    await testCustomerDashboardData(results)

  } catch (error) {
    console.error('❌ Test suite execution failed:', error)
    results.failed++
    results.tests.push({
      name: 'Test Suite Execution',
      passed: false,
      error: error.message
    })
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('🏁 Enhanced Airtable Integration Test Results - Phase 3.2')
  console.log('='.repeat(60))
  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`📊 Total Tests: ${results.tests.length}`)
  
  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:')
    results.tests
      .filter(test => !test.passed)
      .forEach(test => console.log(`   • ${test.name}: ${test.error}`))
  }

  console.log('\n🎯 Test Coverage Areas:')
  console.log('   ✓ Enhanced Airtable schema with AI fields')
  console.log('   ✓ AI analysis results storage and retrieval')
  console.log('   ✓ Intelligent caching system')
  console.log('   ✓ Cache validation and expiry logic')
  console.log('   ✓ Optimization progress tracking')
  console.log('   ✓ Enhanced AI integration orchestration')
  console.log('   ✓ Customer dashboard data aggregation')

  return results.failed === 0
}

async function testEnhancedAirtableSchema(results) {
  try {
    const airtableService = createAirtableService()
    
    // Test creating a record with enhanced AI fields
    const testRecord = {
      ...TEST_CONFIG.testBusinessData,
      customerId: TEST_CONFIG.testCustomerId,
      packageType: 'growth',
      submissionStatus: 'pending',
      // Enhanced AI fields
      aiAnalysisResults: JSON.stringify({ test: 'mock analysis data' }),
      competitivePositioning: 'Test competitive positioning summary',
      directorySuccessProbabilities: JSON.stringify([{ directoryId: 'test', probability: 85 }]),
      seoRecommendations: JSON.stringify(['Test SEO recommendation']),
      lastAnalysisDate: new Date().toISOString(),
      analysisConfidenceScore: 87,
      industryCategory: 'Business Services'
    }

    const createdRecord = await airtableService.createBusinessSubmission(testRecord)
    
    if (createdRecord && createdRecord.customerId === TEST_CONFIG.testCustomerId) {
      console.log('✅ Enhanced schema record created successfully')
      console.log(`   Customer ID: ${createdRecord.customerId}`)
      console.log(`   Record ID: ${createdRecord.recordId}`)
      console.log(`   Analysis Confidence: ${createdRecord.analysisConfidenceScore}`)
      
      results.passed++
      results.tests.push({ name: 'Enhanced Schema Support', passed: true })
    } else {
      throw new Error('Failed to create enhanced schema record')
    }

  } catch (error) {
    console.error('❌ Enhanced schema test failed:', error.message)
    results.failed++
    results.tests.push({ name: 'Enhanced Schema Support', passed: false, error: error.message })
  }
}

async function testAIAnalysisStorage(results) {
  try {
    const airtableService = createAirtableService()
    
    // Mock AI analysis data
    const mockAnalysisData = {
      confidence: 85,
      qualityScore: 90,
      analysisTimestamp: new Date(),
      industryAnalysis: { primaryIndustry: 'Business Services' },
      competitiveAnalysis: { competitiveAdvantages: ['Quality', 'Speed', 'Price'] },
      seoAnalysis: { 
        improvementOpportunities: [
          { description: 'Improve meta descriptions' },
          { description: 'Add schema markup' }
        ]
      },
      marketPositioning: {
        currentPosition: 'Local Provider',
        recommendedPosition: 'Regional Expert'
      }
    }

    const mockDirectoryOpportunities = {
      prioritizedSubmissions: [
        {
          directoryId: 'dir-001',
          directoryName: 'Test Directory',
          successProbability: 85,
          expectedROI: 300,
          priority: 90
        }
      ]
    }

    const mockRevenueProjections = {
      baseline: { projectedRevenue: 150000, timeframe: '1year' }
    }

    // Store AI analysis results
    await airtableService.storeAIAnalysisResults(
      TEST_CONFIG.testCustomerId,
      mockAnalysisData,
      mockDirectoryOpportunities,
      mockRevenueProjections
    )

    // Verify storage
    const storedRecord = await airtableService.findByCustomerId(TEST_CONFIG.testCustomerId)
    
    if (storedRecord && storedRecord.aiAnalysisResults) {
      const parsedAnalysis = JSON.parse(storedRecord.aiAnalysisResults)
      if (parsedAnalysis.confidence === 85) {
        console.log('✅ AI analysis results stored successfully')
        console.log(`   Confidence Score: ${storedRecord.analysisConfidenceScore}`)
        console.log(`   Industry Category: ${storedRecord.industryCategory}`)
        console.log(`   Analysis Version: ${storedRecord.analysisVersion}`)
        
        results.passed++
        results.tests.push({ name: 'AI Analysis Storage', passed: true })
      } else {
        throw new Error('Stored analysis data does not match input')
      }
    } else {
      throw new Error('AI analysis results not found in stored record')
    }

  } catch (error) {
    console.error('❌ AI analysis storage test failed:', error.message)
    results.failed++
    results.tests.push({ name: 'AI Analysis Storage', passed: false, error: error.message })
  }
}

async function testAnalysisCaching(results) {
  try {
    const cacheService = createAIAnalysisCacheService()
    
    // Test cache retrieval for existing record
    const cachedAnalysis = await cacheService.getCachedAnalysisResults(TEST_CONFIG.testCustomerId)
    
    if (cachedAnalysis && cachedAnalysis.confidence === 85) {
      console.log('✅ Analysis caching working correctly')
      console.log(`   Cached confidence: ${cachedAnalysis.confidence}`)
      console.log(`   Cache hit successful`)
      
      results.passed++
      results.tests.push({ name: 'Analysis Caching', passed: true })
    } else {
      throw new Error('Failed to retrieve cached analysis or data mismatch')
    }

  } catch (error) {
    console.error('❌ Analysis caching test failed:', error.message)
    results.failed++
    results.tests.push({ name: 'Analysis Caching', passed: false, error: error.message })
  }
}

async function testCacheValidation(results) {
  try {
    const cacheService = createAIAnalysisCacheService()
    
    // Test cache validation
    const { cached, validation } = await cacheService.getCachedAnalysisOrValidate(
      TEST_CONFIG.testCustomerId,
      TEST_CONFIG.testBusinessData
    )
    
    if (validation.isValid && cached) {
      console.log('✅ Cache validation working correctly')
      console.log(`   Cache status: ${validation.reason}`)
      console.log(`   Days old: ${validation.daysOld || 0}`)
      console.log(`   Confidence: ${validation.confidenceScore}`)
      
      results.passed++
      results.tests.push({ name: 'Cache Validation', passed: true })
    } else {
      throw new Error(`Cache validation failed: ${validation.reason}`)
    }

  } catch (error) {
    console.error('❌ Cache validation test failed:', error.message)
    results.failed++
    results.tests.push({ name: 'Cache Validation', passed: false, error: error.message })
  }
}

async function testOptimizationTracking(results) {
  try {
    const airtableService = createAirtableService()
    
    // Test optimization progress tracking
    await airtableService.trackOptimizationProgress(TEST_CONFIG.testCustomerId, {
      directoriesSubmittedSinceAnalysis: 15,
      approvalRate: 80,
      trafficIncrease: 25,
      leadIncrease: 12
    })

    // Verify tracking
    const updatedRecord = await airtableService.findByCustomerId(TEST_CONFIG.testCustomerId)
    
    if (updatedRecord && updatedRecord.directoriesSubmitted === 15) {
      console.log('✅ Optimization tracking working correctly')
      console.log(`   Directories submitted: ${updatedRecord.directoriesSubmitted}`)
      console.log(`   Tracking data updated successfully`)
      
      results.passed++
      results.tests.push({ name: 'Optimization Tracking', passed: true })
    } else {
      throw new Error('Optimization tracking data not updated correctly')
    }

  } catch (error) {
    console.error('❌ Optimization tracking test failed:', error.message)
    results.failed++
    results.tests.push({ name: 'Optimization Tracking', passed: false, error: error.message })
  }
}

async function testEnhancedAIIntegration(results) {
  try {
    const integrationService = createEnhancedAIIntegrationService()
    
    // Test dashboard data retrieval
    const dashboardData = await integrationService.getCustomerDashboardData(TEST_CONFIG.testCustomerId)
    
    if (dashboardData && dashboardData.businessProfile && dashboardData.analysisResults) {
      console.log('✅ Enhanced AI integration working correctly')
      console.log(`   Business: ${dashboardData.businessProfile.businessName}`)
      console.log(`   Cache age: ${dashboardData.cacheStatus.daysOld} days`)
      console.log(`   Needs refresh: ${dashboardData.cacheStatus.needsRefresh}`)
      
      results.passed++
      results.tests.push({ name: 'Enhanced AI Integration', passed: true })
    } else {
      throw new Error('Enhanced AI integration failed to retrieve complete data')
    }

  } catch (error) {
    console.error('❌ Enhanced AI integration test failed:', error.message)
    results.failed++
    results.tests.push({ name: 'Enhanced AI Integration', passed: false, error: error.message })
  }
}

async function testCustomerDashboardData(results) {
  try {
    const integrationService = createEnhancedAIIntegrationService()
    
    // Test system analytics
    const analytics = await integrationService.getSystemAnalytics()
    
    if (analytics && typeof analytics.totalCustomers === 'number') {
      console.log('✅ Customer dashboard data retrieval working')
      console.log(`   Total customers: ${analytics.totalCustomers}`)
      console.log(`   Cache hit rate: ${analytics.cacheMetrics.cacheHitRate}`)
      console.log(`   Cost savings: $${analytics.costSavings}`)
      
      results.passed++
      results.tests.push({ name: 'Customer Dashboard Data', passed: true })
    } else {
      throw new Error('Customer dashboard data incomplete')
    }

  } catch (error) {
    console.error('❌ Customer dashboard data test failed:', error.message)
    results.failed++
    results.tests.push({ name: 'Customer Dashboard Data', passed: false, error: error.message })
  }
}

// Cleanup function
async function cleanupTestData() {
  try {
    console.log('\n🧹 Cleaning up test data...')
    // Note: In a real test, you'd want to clean up the test record
    // For safety, we'll leave the test record for manual verification
    console.log(`ℹ️  Test record ${TEST_CONFIG.testCustomerId} left for manual verification`)
  } catch (error) {
    console.warn('⚠️  Cleanup warning:', error.message)
  }
}

// Main execution
if (require.main === module) {
  runEnhancedAirtableIntegrationTests()
    .then(success => {
      if (success) {
        console.log('\n🎉 All Enhanced Airtable Integration tests passed!')
        process.exit(0)
      } else {
        console.log('\n💥 Some tests failed. Check the output above.')
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('\n💥 Test execution failed:', error)
      process.exit(1)
    })
    .finally(() => {
      cleanupTestData()
    })
}

module.exports = { runEnhancedAirtableIntegrationTests }