#!/usr/bin/env node

// 🧪 PHASE 2 UX TESTING SCRIPT - POST-FIXES VALIDATION
// Tests all UX fixes and improvements made to Phase 2

const fs = require('fs')
const path = require('path')

console.log('🎯 DirectoryBolt Phase 2 UX Testing Suite')
console.log('=' .repeat(60))

// Test results tracking
const testResults = {
  userJourney: { passed: 0, failed: 0, tests: [] },
  mobile: { passed: 0, failed: 0, tests: [] },
  conversion: { passed: 0, failed: 0, tests: [] },
  technical: { passed: 0, failed: 0, tests: [] }
}

function logTest(category, testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL'
  console.log(`${status} - ${testName}`)
  if (details) console.log(`      ${details}`)
  
  testResults[category].tests.push({ name: testName, passed, details })
  if (passed) {
    testResults[category].passed++
  } else {
    testResults[category].failed++
  }
}

// Test 1: User Journey Consistency
function testUserJourneyFixes() {
  console.log('\\n🛤️  User Journey Consistency Tests')
  console.log('-'.repeat(50))
  
  // Test 1.1: Landing page CTAs go to /analyze
  try {
    const landingPath = path.join(process.cwd(), 'components/LandingPage.tsx')
    const landingContent = fs.readFileSync(landingPath, 'utf8')
    
    const hasAnalyzeLinks = landingContent.includes("window.location.href = '/analyze'")
    const hasStartFreeAnalysis = landingContent.includes('Start Free Analysis')
    const noOnboardingLinks = !landingContent.includes("window.location.href = '/onboarding'")
    
    logTest('userJourney', 'Landing page CTAs redirect to /analyze', hasAnalyzeLinks && noOnboardingLinks)
    logTest('userJourney', 'Landing page uses "Start Free Analysis" text', hasStartFreeAnalysis)
  } catch (error) {
    logTest('userJourney', 'Landing page CTA consistency check', false, `Error: ${error.message}`)
  }
  
  // Test 1.2: Pricing buttons have consistent text
  try {
    const pricingPath = path.join(process.cwd(), 'components/sections/PricingPreviewSection.tsx')
    const pricingContent = fs.readFileSync(pricingPath, 'utf8')
    
    const hasConsistentButtons = pricingContent.includes('Get Full Analysis - $149') &&
                                pricingContent.includes('Get Full Analysis - $299') &&
                                pricingContent.includes('Get Full Analysis - $499') &&
                                pricingContent.includes('Get Full Analysis - $799')
    
    const noGenericButtons = !pricingContent.includes('Get Instant Access')
    
    logTest('userJourney', 'Pricing buttons have consistent text with prices', hasConsistentButtons)
    logTest('userJourney', 'No generic "Get Instant Access" buttons remain', noGenericButtons)
  } catch (error) {
    logTest('userJourney', 'Pricing button consistency check', false, `Error: ${error.message}`)
  }
  
  // Test 1.3: Demo modal has skip option
  try {
    const modalPath = path.join(process.cwd(), 'components/demo/SampleAnalysisModal.tsx')
    const modalContent = fs.readFileSync(modalPath, 'utf8')
    
    const hasSkipButton = modalContent.includes('Skip Animation →')
    const hasSkipFunction = modalContent.includes('setIsAnimating(false)')
    
    logTest('userJourney', 'Demo modal has skip animation button', hasSkipButton && hasSkipFunction)
  } catch (error) {
    logTest('userJourney', 'Demo modal skip option check', false, `Error: ${error.message}`)
  }
}

// Test 2: Mobile Experience Improvements
function testMobileExperience() {
  console.log('\\n📱 Mobile Experience Tests')
  console.log('-'.repeat(50))
  
  // Test 2.1: Responsive pricing grid
  try {
    const pricingPath = path.join(process.cwd(), 'components/sections/PricingPreviewSection.tsx')
    const pricingContent = fs.readFileSync(pricingPath, 'utf8')
    
    const hasResponsiveGrid = pricingContent.includes('grid-cols-1 sm:grid-cols-2 lg:grid-cols-4')
    
    logTest('mobile', 'Pricing grid is responsive (1/2/4 columns)', hasResponsiveGrid)
  } catch (error) {
    logTest('mobile', 'Responsive pricing grid check', false, `Error: ${error.message}`)
  }
  
  // Test 2.2: Modal mobile optimization
  try {
    const modalPath = path.join(process.cwd(), 'components/demo/SampleAnalysisModal.tsx')
    const modalContent = fs.readFileSync(modalPath, 'utf8')
    
    const hasMobilePadding = modalContent.includes('p-2 sm:p-4')
    const hasMobileMaxWidth = modalContent.includes('max-w-4xl sm:max-w-6xl')
    const hasMobileHeight = modalContent.includes('max-h-[95vh] sm:max-h-[90vh]')
    
    logTest('mobile', 'Modal has mobile-optimized padding', hasMobilePadding)
    logTest('mobile', 'Modal has mobile-optimized max width', hasMobileMaxWidth)
    logTest('mobile', 'Modal has mobile-optimized height', hasMobileHeight)
  } catch (error) {
    logTest('mobile', 'Modal mobile optimization check', false, `Error: ${error.message}`)
  }
  
  // Test 2.3: Faster animation speed
  try {
    const modalPath = path.join(process.cwd(), 'components/demo/SampleAnalysisModal.tsx')
    const modalContent = fs.readFileSync(modalPath, 'utf8')
    
    const hasFasterAnimation = modalContent.includes('}, 800)')
    const noSlowAnimation = !modalContent.includes('}, 1500)')
    
    logTest('mobile', 'Demo animation speed reduced to 800ms', hasFasterAnimation && noSlowAnimation)
  } catch (error) {
    logTest('mobile', 'Animation speed optimization check', false, `Error: ${error.message}`)
  }
}

// Test 3: Conversion Optimization
function testConversionOptimization() {
  console.log('\\n💰 Conversion Optimization Tests')
  console.log('-'.repeat(50))
  
  // Test 3.1: Urgency messaging
  try {
    const landingPath = path.join(process.cwd(), 'components/LandingPage.tsx')
    const landingContent = fs.readFileSync(landingPath, 'utf8')
    
    const hasUrgencyMessage = landingContent.includes('🔥 Limited Time: 487 businesses upgraded this month')
    const hasBeforePricesIncrease = landingContent.includes('before prices increase')
    
    logTest('conversion', 'Landing page has urgency messaging', hasUrgencyMessage)
    logTest('conversion', 'Urgency message mentions price increase', hasBeforePricesIncrease)
  } catch (error) {
    logTest('conversion', 'Urgency messaging check', false, `Error: ${error.message}`)
  }
  
  // Test 3.2: One-time purchase clarity
  try {
    const pricingPath = path.join(process.cwd(), 'components/sections/PricingPreviewSection.tsx')
    const pricingContent = fs.readFileSync(pricingPath, 'utf8')
    
    const hasOneTimePurchase = pricingContent.includes('One-Time Purchase Business Intelligence Plans')
    const hasPayOnceOwnForever = pricingContent.includes('Pay once, own forever')
    
    logTest('conversion', 'Pricing clearly states "One-Time Purchase"', hasOneTimePurchase)
    logTest('conversion', 'Pricing emphasizes "Pay once, own forever"', hasPayOnceOwnForever)
  } catch (error) {
    logTest('conversion', 'One-time purchase clarity check', false, `Error: ${error.message}`)
  }
}

// Test 4: Technical Fixes
function testTechnicalFixes() {
  console.log('\\n🔧 Technical Fixes Tests')
  console.log('-'.repeat(50))
  
  // Test 4.1: CSV export line breaks fixed
  try {
    const exportPath = path.join(process.cwd(), 'lib/utils/export-utils.ts')
    const exportContent = fs.readFileSync(exportPath, 'utf8')
    
    const hasCorrectLineBreaks = exportContent.includes("].join('\\\\n')")
    const noIncorrectLineBreaks = !exportContent.includes("].join('\\\\\\\\n')")
    
    logTest('technical', 'CSV export uses correct line breaks (\\\\n)', hasCorrectLineBreaks && noIncorrectLineBreaks)
  } catch (error) {
    logTest('technical', 'CSV export line breaks check', false, `Error: ${error.message}`)
  }
  
  // Test 4.2: Browser compatibility fallback
  try {
    const exportPath = path.join(process.cwd(), 'lib/utils/export-utils.ts')
    const exportContent = fs.readFileSync(exportPath, 'utf8')
    
    const hasFallback = exportContent.includes('document.execCommand(\\'copy\\')')
    const hasClipboardMessage = exportContent.includes('CSV data copied to clipboard')
    const hasModernBrowserMessage = exportContent.includes('Please use a modern browser')
    
    logTest('technical', 'CSV export has browser compatibility fallback', hasFallback)
    logTest('technical', 'Fallback provides helpful user messages', hasClipboardMessage && hasModernBrowserMessage)
  } catch (error) {
    logTest('technical', 'Browser compatibility fallback check', false, `Error: ${error.message}`)
  }
  
  // Test 4.3: All critical files exist
  const criticalFiles = [
    'components/LandingPage.tsx',
    'components/demo/SampleAnalysisModal.tsx',
    'components/sections/PricingPreviewSection.tsx',
    'lib/utils/export-utils.ts',
    'pages/api/stripe/create-checkout-session.ts',
    'pages/results.tsx'
  ]
  
  criticalFiles.forEach(file => {
    const exists = fs.existsSync(path.join(process.cwd(), file))
    logTest('technical', `Critical file exists: ${file}`, exists)
  })
}

// Test 5: End-to-End User Flow Validation
function testEndToEndFlow() {
  console.log('\\n🎯 End-to-End User Flow Validation')
  console.log('-'.repeat(50))
  
  // Test 5.1: Complete user journey components
  const userJourneySteps = [
    { step: 'Landing page with demo button', file: 'components/LandingPage.tsx', check: 'See Sample Analysis' },
    { step: 'Sample analysis modal', file: 'components/demo/SampleAnalysisModal.tsx', check: 'SampleAnalysisModal' },
    { step: 'Free analysis page', file: 'pages/analyze.tsx', check: 'Free Website Analysis' },
    { step: 'Results with export', file: 'pages/results.tsx', check: 'Export PDF Report' },
    { step: 'Pricing with 4 tiers', file: 'components/sections/PricingPreviewSection.tsx', check: '$149' },
    { step: 'Stripe checkout', file: 'pages/api/stripe/create-checkout-session.ts', check: 'PRICING_PLANS' }
  ]
  
  userJourneySteps.forEach(({ step, file, check }) => {
    try {
      const filePath = path.join(process.cwd(), file)
      const content = fs.readFileSync(filePath, 'utf8')
      const hasCheck = content.includes(check)
      
      logTest('userJourney', `User journey step: ${step}`, hasCheck, `File: ${file}`)
    } catch (error) {
      logTest('userJourney', `User journey step: ${step}`, false, `Error reading ${file}: ${error.message}`)
    }
  })
}

// Run all tests
async function runAllTests() {
  testUserJourneyFixes()
  testMobileExperience()
  testConversionOptimization()
  testTechnicalFixes()
  testEndToEndFlow()
  
  // Generate summary
  console.log('\\n' + '=' .repeat(60))
  console.log('📊 PHASE 2 UX TESTING SUMMARY')
  console.log('=' .repeat(60))
  
  let totalPassed = 0
  let totalFailed = 0
  
  Object.entries(testResults).forEach(([category, results]) => {
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1')
    console.log(`\\n${categoryName}:`)
    console.log(`  ✅ Passed: ${results.passed}`)
    console.log(`  ❌ Failed: ${results.failed}`)
    
    totalPassed += results.passed
    totalFailed += results.failed
    
    // Show failed tests
    const failedTests = results.tests.filter(t => !t.passed)
    if (failedTests.length > 0) {
      console.log(`  Failed tests:`)
      failedTests.forEach(test => {
        console.log(`    - ${test.name}`)
        if (test.details) console.log(`      ${test.details}`)
      })
    }
  })
  
  console.log('\\n' + '-'.repeat(60))
  console.log(`OVERALL RESULTS: ${totalPassed}/${totalPassed + totalFailed} tests passed`)
  
  const successRate = Math.round((totalPassed / (totalPassed + totalFailed)) * 100)
  console.log(`Success Rate: ${successRate}%`)
  
  if (successRate >= 95) {
    console.log('\\n🎉 PHASE 2 UX: EXCELLENT!')
    console.log('✅ Ready for production deployment')
    console.log('🚀 User experience optimized for maximum conversion')
  } else if (successRate >= 85) {
    console.log('\\n⚡ PHASE 2 UX: VERY GOOD')
    console.log('✅ Minor tweaks may improve conversion further')
  } else if (successRate >= 75) {
    console.log('\\n⚠️  PHASE 2 UX: GOOD')
    console.log('🔧 Some UX issues remain that could impact conversion')
  } else {
    console.log('\\n❌ PHASE 2 UX: NEEDS WORK')
    console.log('🚨 Significant UX issues need to be addressed')
  }
  
  // Specific recommendations
  console.log('\\n💡 UX OPTIMIZATION STATUS:')
  if (testResults.userJourney.failed === 0) {
    console.log('   ✅ User journey is consistent and clear')
  } else {
    console.log('   ❌ User journey has inconsistencies that confuse users')
  }
  
  if (testResults.mobile.failed === 0) {
    console.log('   ✅ Mobile experience is optimized')
  } else {
    console.log('   ❌ Mobile experience needs improvement')
  }
  
  if (testResults.conversion.failed === 0) {
    console.log('   ✅ Conversion optimization elements in place')
  } else {
    console.log('   ❌ Missing conversion optimization opportunities')
  }
  
  if (testResults.technical.failed === 0) {
    console.log('   ✅ Technical implementation is solid')
  } else {
    console.log('   ❌ Technical issues may impact user experience')
  }
  
  if (totalFailed === 0) {
    console.log('\\n🎯 PHASE 2 UX COMPLETE!')
    console.log('   🚀 Ready for production launch')
    console.log('   💰 Optimized for maximum conversion')
    console.log('   📱 Mobile-friendly experience')
    console.log('   🎨 Consistent user journey')
  }
  
  process.exit(totalFailed > 0 ? 1 : 0)
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 UX test runner crashed:', error)
    process.exit(1)
  })
}

module.exports = {
  runAllTests,
  testResults
}"