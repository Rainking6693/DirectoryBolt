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
        budget: 1000,\n        timeline: '3 months'\n      }\n    }\n    \n    const result = await analyzer.analyzeBusinessIntelligence(context)\n    \n    console.log('✅ AI Business Analyzer - SUCCESS')\n    console.log(`   - Primary Category: ${result.profile.primaryCategory}`)\n    console.log(`   - Industry: ${result.profile.industryVertical}`)\n    console.log(`   - Confidence: ${result.confidence}%`)\n    console.log(`   - Market Size: $${result.industryAnalysis.marketSize}B`)\n    \n    return { success: true, data: result }\n  } catch (error) {\n    console.log('❌ AI Business Analyzer - FAILED')\n    console.log(`   Error: ${error.message}`)\n    return { success: false, error: error.message }\n  }\n}\n\nasync function testDirectoryMatcher(businessIntelligence) {\n  console.log('📁 Testing Directory Matcher...')\n  \n  try {\n    const matcher = new DirectoryMatcher({\n      maxDirectories: 10,\n      enableAIOptimization: false, // Disable AI for testing\n      includeInternational: true,\n      includePremium: false,\n      budgetRange: { min: 0, max: 100 },\n      industryFocus: ['Technology'],\n      targetROI: 200,\n      analysisDepth: 'basic'\n    })\n    \n    const result = await matcher.findOptimalDirectories(businessIntelligence)\n    \n    console.log('✅ Directory Matcher - SUCCESS')\n    console.log(`   - Total Directories: ${result.totalDirectories}`)\n    console.log(`   - High Authority: ${result.categorizedOpportunities.highAuthority.length}`)\n    console.log(`   - Free Directories: ${result.categorizedOpportunities.freeDirectories.length}`)\n    console.log(`   - Expected Traffic: +${result.estimatedResults.totalTrafficIncrease}`)\n    \n    return { success: true, data: result }\n  } catch (error) {\n    console.log('❌ Directory Matcher - FAILED')\n    console.log(`   Error: ${error.message}`)\n    return { success: false, error: error.message }\n  }\n}\n\nasync function testAPIEndpoint() {\n  console.log('🌐 Testing API Endpoint...')\n  \n  try {\n    const response = await fetch('http://localhost:3000/api/analyze', {\n      method: 'POST',\n      headers: {\n        'Content-Type': 'application/json'\n      },\n      body: JSON.stringify({\n        url: TEST_URL,\n        tier: 'free'\n      })\n    })\n    \n    if (!response.ok) {\n      throw new Error(`HTTP ${response.status}: ${response.statusText}`)\n    }\n    \n    const result = await response.json()\n    \n    console.log('✅ API Endpoint - SUCCESS')\n    console.log(`   - Response: ${result.success ? 'Success' : 'Failed'}`)\n    console.log(`   - Data Type: ${result.data?.tier || 'Unknown'}`)\n    console.log(`   - Processing Time: ${result.processingTime || 0}ms`)\n    \n    return { success: true, data: result }\n  } catch (error) {\n    console.log('❌ API Endpoint - FAILED')\n    console.log(`   Error: ${error.message}`)\n    return { success: false, error: error.message }\n  }\n}\n\nasync function runAllTests() {\n  console.log('🚀 DirectoryBolt AI Services Integration Test')\n  console.log('=' .repeat(50))\n  \n  const results = {\n    websiteAnalyzer: null,\n    aiAnalyzer: null,\n    directoryMatcher: null,\n    apiEndpoint: null\n  }\n  \n  // Test 1: Enhanced Website Analyzer\n  results.websiteAnalyzer = await testEnhancedWebsiteAnalyzer()\n  \n  // Test 2: AI Business Analyzer (only if website analyzer succeeded)\n  if (results.websiteAnalyzer.success) {\n    results.aiAnalyzer = await testAIBusinessAnalyzer(results.websiteAnalyzer.data)\n  } else {\n    console.log('⚠️  AI Business Analyzer - SKIPPED (Website analyzer failed)')\n    results.aiAnalyzer = { success: false, error: 'Website analyzer failed' }\n  }\n  \n  // Test 3: Directory Matcher (only if AI analyzer succeeded or use fallback)\n  if (results.aiAnalyzer.success) {\n    results.directoryMatcher = await testDirectoryMatcher(results.aiAnalyzer.data)\n  } else {\n    // Create minimal business intelligence for testing\n    const fallbackBI = {\n      profile: {\n        name: 'Test Business',\n        primaryCategory: 'Technology',\n        industryVertical: 'Software',\n        businessModel: { type: 'B2B' },\n        targetMarket: { primaryAudience: 'Developers' }\n      },\n      industryAnalysis: { marketSize: 10, growthRate: 5 },\n      competitiveAnalysis: { directCompetitors: [] }\n    }\n    results.directoryMatcher = await testDirectoryMatcher(fallbackBI)\n  }\n  \n  // Test 4: API Endpoint\n  results.apiEndpoint = await testAPIEndpoint()\n  \n  // Summary\n  console.log('\\n' + '=' .repeat(50))\n  console.log('📊 TEST SUMMARY')\n  console.log('=' .repeat(50))\n  \n  const tests = [\n    { name: 'Enhanced Website Analyzer', result: results.websiteAnalyzer },\n    { name: 'AI Business Analyzer', result: results.aiAnalyzer },\n    { name: 'Directory Matcher', result: results.directoryMatcher },\n    { name: 'API Endpoint', result: results.apiEndpoint }\n  ]\n  \n  let passedTests = 0\n  let totalTests = tests.length\n  \n  tests.forEach(test => {\n    const status = test.result.success ? '✅ PASS' : '❌ FAIL'\n    console.log(`${status} - ${test.name}`)\n    if (test.result.success) passedTests++\n    if (!test.result.success && test.result.error) {\n      console.log(`      Error: ${test.result.error}`)\n    }\n  })\n  \n  console.log('\\n' + '-'.repeat(50))\n  console.log(`OVERALL: ${passedTests}/${totalTests} tests passed`)\n  \n  if (passedTests === totalTests) {\n    console.log('🎉 ALL TESTS PASSED! AI services are ready for production.')\n    process.exit(0)\n  } else {\n    console.log('⚠️  Some tests failed. Please check the configuration and try again.')\n    \n    // Provide helpful suggestions\n    console.log('\\n💡 TROUBLESHOOTING TIPS:')\n    if (!results.websiteAnalyzer.success) {\n      console.log('   - Check internet connection and URL accessibility')\n      console.log('   - Verify Node.js polyfills are working correctly')\n    }\n    if (!results.aiAnalyzer.success) {\n      console.log('   - Set OPENAI_API_KEY in your .env.local file')\n      console.log('   - Ensure you have OpenAI API credits available')\n    }\n    if (!results.directoryMatcher.success) {\n      console.log('   - Check database connection and directory data')\n    }\n    if (!results.apiEndpoint.success) {\n      console.log('   - Make sure the development server is running (npm run dev)')\n      console.log('   - Check for any compilation errors')\n    }\n    \n    process.exit(1)\n  }\n}\n\n// Run the tests\nif (require.main === module) {\n  runAllTests().catch(error => {\n    console.error('💥 Test runner crashed:', error)\n    process.exit(1)\n  })\n}\n\nmodule.exports = {\n  testEnhancedWebsiteAnalyzer,\n  testAIBusinessAnalyzer,\n  testDirectoryMatcher,\n  testAPIEndpoint,\n  runAllTests\n}"