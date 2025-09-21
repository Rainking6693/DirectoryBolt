#!/usr/bin/env node

// 🧪 AI SERVICES INTEGRATION TEST
// Tests all AI services to ensure they're working correctly

const { createEnhancedWebsiteAnalyzer } = require('../lib/services/enhanced-website-analyzer')
const { createAIBusinessAnalyzer } = require('../lib/services/ai-business-analyzer')
const { DirectoryMatcher } = require('../lib/services/directory-matcher')

// Test configuration
const TEST_URL = 'https://example.com'
const TEST_CONFIG = {
  timeout: 10000,
  maxRetries: 1,
  userAgent: 'DirectoryBolt Test Agent',
  enableScreenshots: false, // Disable for testing
  enableSocialAnalysis: true,
  enableTechStackAnalysis: true,
  screenshotOptions: {
    fullPage: false,
    width: 1200,
    height: 800,
    quality: 50,
    format: 'png'
  }
}

async function testEnhancedWebsiteAnalyzer() {
  console.log('🔍 Testing Enhanced Website Analyzer...')
  
  try {
    const analyzer = createEnhancedWebsiteAnalyzer(TEST_CONFIG)
    const result = await analyzer.analyzeWebsite(TEST_URL)
    
    console.log('✅ Enhanced Website Analyzer - SUCCESS')
    console.log(`   - Business Name: ${result.businessProfile.name}`)
    console.log(`   - SEO Score: ${result.seoAnalysis.currentScore}`)
    console.log(`   - Tech Stack: ${Object.keys(result.techStack).length} categories`)
    console.log(`   - Social Platforms: ${result.socialPresence.platforms.length}`)
    
    return { success: true, data: result }
  } catch (error) {
    console.log('❌ Enhanced Website Analyzer - FAILED')
    console.log(`   Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function testAIBusinessAnalyzer(websiteData) {
  console.log('🤖 Testing AI Business Analyzer...')
  
  // Check if OpenAI API key is available
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    console.log('⚠️  AI Business Analyzer - SKIPPED (No OpenAI API key)')
    return { success: false, error: 'No OpenAI API key configured' }
  }
  
  try {
    const analyzer = createAIBusinessAnalyzer({
      model: 'gpt-4o',
      temperature: 0.3,
      maxTokens: 2000,
      enableRevenueProjections: true,
      enableCompetitorAnalysis: true,
      analysisDepth: 'standard'
    })
    
    const context = {
      websiteData,
      url: TEST_URL,
      userInput: {
        businessGoals: ['Increase online visibility', 'Generate more leads'],
        targetAudience: 'Small business owners',
        budget: 1000,
        timeline: '3 months'
      }
    }
    
    const result = await analyzer.analyzeBusinessIntelligence(context)
    
    console.log('✅ AI Business Analyzer - SUCCESS')
    console.log(`   - Primary Category: ${result.profile.primaryCategory}`)
    console.log(`   - Industry: ${result.profile.industryVertical}`)
    console.log(`   - Confidence: ${result.confidence}%`)
    console.log(`   - Market Size: $${result.industryAnalysis.marketSize}B`)
    
    return { success: true, data: result }
  } catch (error) {
    console.log('❌ AI Business Analyzer - FAILED')
    console.log(`   Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function testDirectoryMatcher(businessIntelligence) {
  console.log('📁 Testing Directory Matcher...')
  
  try {
    const matcher = new DirectoryMatcher({
      maxDirectories: 10,
      enableAIOptimization: false, // Disable AI for testing
      includeInternational: true,
      includePremium: false,
      budgetRange: { min: 0, max: 100 },
      industryFocus: ['Technology'],
      targetROI: 200,
      analysisDepth: 'basic'
    })
    
    const result = await matcher.findOptimalDirectories(businessIntelligence)
    
    console.log('✅ Directory Matcher - SUCCESS')
    console.log(`   - Total Directories: ${result.totalDirectories}`)
    console.log(`   - High Authority: ${result.categorizedOpportunities.highAuthority.length}`)
    console.log(`   - Free Directories: ${result.categorizedOpportunities.freeDirectories.length}`)
    console.log(`   - Expected Traffic: +${result.estimatedResults.totalTrafficIncrease}`)
    
    return { success: true, data: result }
  } catch (error) {
    console.log('❌ Directory Matcher - FAILED')
    console.log(`   Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function testAPIEndpoint() {
  console.log('🌐 Testing API Endpoint...')
  
  try {
    const response = await fetch('http://localhost:3000/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: TEST_URL,
        tier: 'free'
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    console.log('✅ API Endpoint - SUCCESS')
    console.log(`   - Response: ${result.success ? 'Success' : 'Failed'}`)
    console.log(`   - Data Type: ${result.data?.tier || 'Unknown'}`)
    console.log(`   - Processing Time: ${result.processingTime || 0}ms`)
    
    return { success: true, data: result }
  } catch (error) {
    console.log('❌ API Endpoint - FAILED')
    console.log(`   Error: ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function runAllTests() {
  console.log('🚀 DirectoryBolt AI Services Integration Test')
  console.log('=' .repeat(50))
  
  const results = {
    websiteAnalyzer: null,
    aiAnalyzer: null,
    directoryMatcher: null,
    apiEndpoint: null
  }
  
  // Test 1: Enhanced Website Analyzer
  results.websiteAnalyzer = await testEnhancedWebsiteAnalyzer()
  
  // Test 2: AI Business Analyzer (only if website analyzer succeeded)
  if (results.websiteAnalyzer.success) {
    results.aiAnalyzer = await testAIBusinessAnalyzer(results.websiteAnalyzer.data)
  } else {
    console.log('⚠️  AI Business Analyzer - SKIPPED (Website analyzer failed)')
    results.aiAnalyzer = { success: false, error: 'Website analyzer failed' }
  }
  
  // Test 3: Directory Matcher (only if AI analyzer succeeded or use fallback)
  if (results.aiAnalyzer.success) {
    results.directoryMatcher = await testDirectoryMatcher(results.aiAnalyzer.data)
  } else {
    // Create minimal business intelligence for testing
    const fallbackBI = {
      profile: {
        name: 'Test Business',
        primaryCategory: 'Technology',
        industryVertical: 'Software',
        businessModel: { type: 'B2B' },
        targetMarket: { primaryAudience: 'Developers' }
      },
      industryAnalysis: { marketSize: 10, growthRate: 5 },
      competitiveAnalysis: { directCompetitors: [] }
    }
    results.directoryMatcher = await testDirectoryMatcher(fallbackBI)
  }
  
  // Test 4: API Endpoint
  results.apiEndpoint = await testAPIEndpoint()
  
  // Summary
  console.log('\n' + '=' .repeat(50))
  console.log('📊 TEST SUMMARY')
  console.log('=' .repeat(50))
  
  const tests = [
    { name: 'Enhanced Website Analyzer', result: results.websiteAnalyzer },
    { name: 'AI Business Analyzer', result: results.aiAnalyzer },
    { name: 'Directory Matcher', result: results.directoryMatcher },
    { name: 'API Endpoint', result: results.apiEndpoint }
  ]
  
  let passedTests = 0
  let totalTests = tests.length
  
  tests.forEach(test => {
    const status = test.result.success ? '✅ PASS' : '❌ FAIL'
    console.log(`${status} - ${test.name}`)
    if (test.result.success) passedTests++
    if (!test.result.success && test.result.error) {
      console.log(`      Error: ${test.result.error}`)
    }
  })
  
  console.log('\n' + '-'.repeat(50))
  console.log(`OVERALL: ${passedTests}/${totalTests} tests passed`)
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED! AI services are ready for production.')
    process.exit(0)
  } else {
    console.log('⚠️  Some tests failed. Please check the configuration and try again.')
    
    // Provide helpful suggestions
    console.log('\n💡 TROUBLESHOOTING TIPS:')
    if (!results.websiteAnalyzer.success) {
      console.log('   - Check internet connection and URL accessibility')
      console.log('   - Verify Node.js polyfills are working correctly')
    }
    if (!results.aiAnalyzer.success) {
      console.log('   - Set OPENAI_API_KEY in your .env.local file')
      console.log('   - Ensure you have OpenAI API credits available')
    }
    if (!results.directoryMatcher.success) {
      console.log('   - Check database connection and directory data')
    }
    if (!results.apiEndpoint.success) {
      console.log('   - Make sure the development server is running (npm run dev)')
      console.log('   - Check for any compilation errors')
    }
    
    process.exit(1)
  }
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Test runner crashed:', error)
    process.exit(1)
  })
}

module.exports = {
  testEnhancedWebsiteAnalyzer,
  testAIBusinessAnalyzer,
  testDirectoryMatcher,
  testAPIEndpoint,
  runAllTests
}