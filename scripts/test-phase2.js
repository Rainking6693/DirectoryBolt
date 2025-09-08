#!/usr/bin/env node

// 🧪 PHASE 2 COMPREHENSIVE TESTING SCRIPT
// Tests all Phase 2 features: Pricing, Stripe Integration, Demo, Export functionality

const fs = require('fs')
const path = require('path')

console.log('🚀 DirectoryBolt Phase 2 Testing Suite')
console.log('=' .repeat(60))

// Test results tracking
const testResults = {
  pricing: { passed: 0, failed: 0, tests: [] },
  stripe: { passed: 0, failed: 0, tests: [] },
  demo: { passed: 0, failed: 0, tests: [] },
  export: { passed: 0, failed: 0, tests: [] },
  integration: { passed: 0, failed: 0, tests: [] }
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

// Section 2.1: Market-Appropriate Pricing Tests
function testPricingStructure() {
  console.log('\\n📊 Section 2.1: Market-Appropriate Pricing')
  console.log('-'.repeat(50))
  
  // Test 1: Environment variables have new pricing
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    
    const hasStarterPrice = envContent.includes('STRIPE_STARTER_PRICE_ID=price_starter_149_usd')
    const hasGrowthPrice = envContent.includes('STRIPE_GROWTH_PRICE_ID=price_growth_299_usd')
    const hasProfessionalPrice = envContent.includes('STRIPE_PROFESSIONAL_PRICE_ID=price_professional_499_usd')
    const hasEnterprisePrice = envContent.includes('STRIPE_ENTERPRISE_PRICE_ID=price_enterprise_799_usd')
    
    logTest('pricing', 'Environment variables updated to new pricing ($149, $299, $499, $799)', 
      hasStarterPrice && hasGrowthPrice && hasProfessionalPrice && hasEnterprisePrice,
      `Starter: ${hasStarterPrice}, Growth: ${hasGrowthPrice}, Professional: ${hasProfessionalPrice}, Enterprise: ${hasEnterprisePrice}`)
  } catch (error) {
    logTest('pricing', 'Environment variables check', false, `Error reading .env.local: ${error.message}`)
  }
  
  // Test 2: Stripe integration files exist
  const stripeFiles = [
    'pages/api/stripe/create-checkout-session.ts',
    'pages/api/stripe/webhook.ts'
  ]
  
  stripeFiles.forEach(file => {
    const exists = fs.existsSync(path.join(process.cwd(), file))
    logTest('pricing', `Stripe integration file exists: ${file}`, exists)
  })
  
  // Test 3: Pricing components updated
  try {
    const pricingPath = path.join(process.cwd(), 'components/sections/PricingPreviewSection.tsx')
    const pricingContent = fs.readFileSync(pricingPath, 'utf8')
    
    const hasNewPricing = pricingContent.includes('$149') && 
                         pricingContent.includes('$299') && 
                         pricingContent.includes('$499') && 
                         pricingContent.includes('$799')
    
    const hasFourTiers = pricingContent.includes('xl:grid-cols-4')
    
    logTest('pricing', 'Pricing components show new structure (4 tiers: $149-$799)', 
      hasNewPricing && hasFourTiers,
      `New pricing: ${hasNewPricing}, Four tiers: ${hasFourTiers}`)
  } catch (error) {
    logTest('pricing', 'Pricing components check', false, `Error reading pricing component: ${error.message}`)
  }
}

// Section 2.2: Value Proposition Frontend Tests
function testValueProposition() {
  console.log('\\n💎 Section 2.2: Value Proposition Frontend')
  console.log('-'.repeat(50))
  
  // Test 1: Landing page has value proposition
  try {
    const landingPath = path.join(process.cwd(), 'components/LandingPage.tsx')
    const landingContent = fs.readFileSync(landingPath, 'utf8')
    
    const hasValueProp = landingContent.includes('$4,300 Worth of Business Intelligence for $299')
    const hasSavings = landingContent.includes('Save 93%')
    const hasSampleButton = landingContent.includes('See Sample Analysis')
    
    logTest('demo', 'Landing page shows value proposition ($4,300 worth for $299)', hasValueProp)
    logTest('demo', 'Landing page shows 93% savings calculation', hasSavings)
    logTest('demo', 'Landing page has \"See Sample Analysis\" button', hasSampleButton)
  } catch (error) {
    logTest('demo', 'Landing page value proposition check', false, `Error reading landing page: ${error.message}`)
  }
}

// Section 2.3: Enhanced Analysis Results Interface Tests
function testAnalysisResults() {
  console.log('\\n📈 Section 2.3: Enhanced Analysis Results Interface')
  console.log('-'.repeat(50))
  
  // Test 1: Results page exists and has export functionality
  try {
    const resultsPath = path.join(process.cwd(), 'pages/results.tsx')
    const resultsContent = fs.readFileSync(resultsPath, 'utf8')
    
    const hasExportImport = resultsContent.includes('generatePDFReport, generateCSVExport')
    const hasPDFButton = resultsContent.includes('Export PDF Report')
    const hasCSVButton = resultsContent.includes('Export CSV Data')
    const hasUpgradePrompts = resultsContent.includes('Want ALL Premium Recommendations')
    
    logTest('export', 'Results page imports export utilities', hasExportImport)
    logTest('export', 'Results page has PDF export button', hasPDFButton)
    logTest('export', 'Results page has CSV export button', hasCSVButton)
    logTest('integration', 'Results page has upgrade prompts for free tier', hasUpgradePrompts)
  } catch (error) {
    logTest('export', 'Results page analysis', false, `Error reading results page: ${error.message}`)
  }
  
  // Test 2: Export utilities exist
  try {
    const exportPath = path.join(process.cwd(), 'lib/utils/export-utils.ts')
    const exportContent = fs.readFileSync(exportPath, 'utf8')
    
    const hasPDFFunction = exportContent.includes('generatePDFReport')
    const hasCSVFunction = exportContent.includes('generateCSVExport')
    const hasSampleFunctions = exportContent.includes('generateSamplePDF') && exportContent.includes('generateSampleCSV')
    
    logTest('export', 'Export utilities file exists with PDF generation', hasPDFFunction)
    logTest('export', 'Export utilities file exists with CSV generation', hasCSVFunction)
    logTest('export', 'Export utilities include sample generation functions', hasSampleFunctions)
  } catch (error) {
    logTest('export', 'Export utilities check', false, `Error reading export utilities: ${error.message}`)
  }
}

// Section 2.4: AI Analysis Demo & Sample Results Tests
function testDemoFunctionality() {
  console.log('\\n🎭 Section 2.4: AI Analysis Demo & Sample Results')
  console.log('-'.repeat(50))
  
  // Test 1: Sample analysis modal exists
  try {
    const modalPath = path.join(process.cwd(), 'components/demo/SampleAnalysisModal.tsx')
    const modalContent = fs.readFileSync(modalPath, 'utf8')
    
    const hasModalComponent = modalContent.includes('SampleAnalysisModal')
    const hasSampleData = modalContent.includes('SAMPLE_ANALYSIS_DATA')
    const hasBusinessProfile = modalContent.includes('businessProfile')
    const hasDirectoryOpportunities = modalContent.includes('directoryOpportunities')
    const hasRevenueProjections = modalContent.includes('revenueProjections')
    
    logTest('demo', 'Sample analysis modal component exists', hasModalComponent)
    logTest('demo', 'Modal includes comprehensive sample data', hasSampleData)
    logTest('demo', 'Modal shows business profile detection', hasBusinessProfile)
    logTest('demo', 'Modal displays directory opportunities with success probabilities', hasDirectoryOpportunities)
    logTest('demo', 'Modal includes revenue projections', hasRevenueProjections)
  } catch (error) {
    logTest('demo', 'Sample analysis modal check', false, `Error reading modal component: ${error.message}`)
  }
  
  // Test 2: Landing page integrates demo modal
  try {
    const landingPath = path.join(process.cwd(), 'components/LandingPage.tsx')
    const landingContent = fs.readFileSync(landingPath, 'utf8')
    
    const importsModal = landingContent.includes('import SampleAnalysisModal')
    const hasModalState = landingContent.includes('showSampleModal')
    const rendersModal = landingContent.includes('<SampleAnalysisModal')
    
    logTest('demo', 'Landing page imports sample analysis modal', importsModal)
    logTest('demo', 'Landing page manages modal state', hasModalState)
    logTest('demo', 'Landing page renders modal component', rendersModal)
  } catch (error) {
    logTest('demo', 'Landing page demo integration check', false, `Error checking landing page integration: ${error.message}`)
  }
}

// Dependencies and Package Tests
function testDependencies() {
  console.log('\\n📦 Dependencies & Package Tests')
  console.log('-'.repeat(50))
  
  // Test 1: Required dependencies in package.json
  try {
    const packagePath = path.join(process.cwd(), 'package.json')
    const packageContent = fs.readFileSync(packagePath, 'utf8')
    const packageJson = JSON.parse(packageContent)
    
    const hasJsPDF = packageJson.dependencies['jspdf']
    const hasStripe = packageJson.dependencies['stripe']
    const hasCorrectPuppeteer = packageJson.dependencies['puppeteer-core'] === '^21.0.0'
    
    logTest('integration', 'jsPDF dependency added for PDF export', !!hasJsPDF, `Version: ${hasJsPDF || 'Not found'}`)
    logTest('integration', 'Stripe dependency exists', !!hasStripe, `Version: ${hasStripe || 'Not found'}`)
    logTest('integration', 'Puppeteer-core version correct (21.0.0)', hasCorrectPuppeteer)
  } catch (error) {
    logTest('integration', 'Package.json dependencies check', false, `Error reading package.json: ${error.message}`)
  }
}

// Critical End-to-End User Journey Test
function testUserJourney() {
  console.log('\\n🛤️  Critical End-to-End User Journey')
  console.log('-'.repeat(50))
  
  // Test 1: Complete user flow components exist
  const journeyComponents = [
    { file: 'components/LandingPage.tsx', feature: 'Landing page with demo button' },
    { file: 'components/demo/SampleAnalysisModal.tsx', feature: 'Sample analysis demo modal' },
    { file: 'pages/analyze.tsx', feature: 'Website analysis page' },
    { file: 'pages/results.tsx', feature: 'Results page with export' },
    { file: 'components/sections/PricingPreviewSection.tsx', feature: 'Pricing page with 4 tiers' },
    { file: 'pages/api/stripe/create-checkout-session.ts', feature: 'Stripe checkout integration' }
  ]
  
  journeyComponents.forEach(({ file, feature }) => {
    const exists = fs.existsSync(path.join(process.cwd(), file))
    logTest('integration', `User journey component: ${feature}`, exists, file)
  })
  
  // Test 2: Checkout button uses new endpoint
  try {
    const checkoutPath = path.join(process.cwd(), 'components/CheckoutButton.jsx')
    const checkoutContent = fs.readFileSync(checkoutPath, 'utf8')
    
    const usesNewEndpoint = checkoutContent.includes('/api/stripe/create-checkout-session')
    logTest('integration', 'Checkout button uses new Stripe endpoint', usesNewEndpoint)
  } catch (error) {
    logTest('integration', 'Checkout button endpoint check', false, `Error reading checkout button: ${error.message}`)
  }
}

// Run all tests
async function runAllTests() {
  testPricingStructure()
  testValueProposition()
  testAnalysisResults()
  testDemoFunctionality()
  testDependencies()
  testUserJourney()
  
  // Generate summary
  console.log('\\n' + '=' .repeat(60))
  console.log('📊 PHASE 2 TESTING SUMMARY')
  console.log('=' .repeat(60))
  
  let totalPassed = 0
  let totalFailed = 0
  
  Object.entries(testResults).forEach(([category, results]) => {
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1)
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
  
  if (successRate >= 90) {
    console.log('\\n🎉 PHASE 2 IMPLEMENTATION: EXCELLENT!')
    console.log('✅ Ready for production deployment')
  } else if (successRate >= 75) {
    console.log('\\n⚠️  PHASE 2 IMPLEMENTATION: GOOD')
    console.log('🔧 Minor fixes needed before production')
  } else if (successRate >= 50) {
    console.log('\\n⚠️  PHASE 2 IMPLEMENTATION: NEEDS WORK')
    console.log('🚧 Significant issues need to be addressed')
  } else {
    console.log('\\n❌ PHASE 2 IMPLEMENTATION: INCOMPLETE')
    console.log('🚨 Major implementation work required')
  }
  
  // Specific recommendations
  console.log('\\n💡 NEXT STEPS:')
  if (testResults.pricing.failed > 0) {
    console.log('   - Fix pricing structure and Stripe integration')
  }
  if (testResults.demo.failed > 0) {
    console.log('   - Complete demo functionality implementation')
  }
  if (testResults.export.failed > 0) {
    console.log('   - Implement PDF/CSV export features')
  }
  if (testResults.integration.failed > 0) {
    console.log('   - Fix integration and user journey issues')
  }
  
  if (totalFailed === 0) {
    console.log('   🚀 Phase 2 is complete! Ready to test end-to-end user journey.')
  }
  
  process.exit(totalFailed > 0 ? 1 : 0)
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 Test runner crashed:', error)
    process.exit(1)
  })
}

module.exports = {
  runAllTests,
  testResults
}"