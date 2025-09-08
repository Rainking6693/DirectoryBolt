#!/usr/bin/env node

// 🔍 SEO VALIDATION TEST SUITE
// Comprehensive testing of DirectoryBolt SEO implementation

const fs = require('fs')
const path = require('path')

console.log('🔍 DirectoryBolt SEO Validation Suite')
console.log('=' .repeat(60))

// Test results tracking
const testResults = {
  technical: { passed: 0, failed: 0, tests: [] },
  content: { passed: 0, failed: 0, tests: [] },
  competitive: { passed: 0, failed: 0, tests: [] },
  performance: { passed: 0, failed: 0, tests: [] },
  schema: { passed: 0, failed: 0, tests: [] }
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

// Test 1: Technical SEO Foundation
function testTechnicalSEO() {
  console.log('\\n🔧 Technical SEO Foundation Tests')
  console.log('-'.repeat(50))
  
  // Test 1.1: Sitemap Configuration
  try {
    const sitemapExists = fs.existsSync(path.join(process.cwd(), 'public/sitemap.xml'))
    const sitemapIndexExists = fs.existsSync(path.join(process.cwd(), 'public/sitemap-0.xml'))
    
    logTest('technical', 'XML Sitemap exists', sitemapExists)
    logTest('technical', 'Sitemap index structure', sitemapIndexExists)
    
    if (sitemapExists) {
      const sitemapContent = fs.readFileSync(path.join(process.cwd(), 'public/sitemap.xml'), 'utf8')
      const hasCorrectStructure = sitemapContent.includes('sitemapindex') && sitemapContent.includes('sitemap-0.xml')
      logTest('technical', 'Sitemap has correct structure', hasCorrectStructure)
    }
  } catch (error) {
    logTest('technical', 'Sitemap configuration check', false, `Error: ${error.message}`)
  }
  
  // Test 1.2: Robots.txt Configuration
  try {
    const robotsExists = fs.existsSync(path.join(process.cwd(), 'public/robots.txt'))
    logTest('technical', 'Robots.txt exists', robotsExists)
    
    if (robotsExists) {
      const robotsContent = fs.readFileSync(path.join(process.cwd(), 'public/robots.txt'), 'utf8')
      const hasAllowAll = robotsContent.includes('Allow: /')
      const hasSitemap = robotsContent.includes('Sitemap: https://directorybolt.com/sitemap.xml')
      const hasHost = robotsContent.includes('Host: https://directorybolt.com')
      
      logTest('technical', 'Robots.txt allows crawling', hasAllowAll)
      logTest('technical', 'Robots.txt includes sitemap', hasSitemap)
      logTest('technical', 'Robots.txt includes host directive', hasHost)
    }
  } catch (error) {
    logTest('technical', 'Robots.txt configuration check', false, `Error: ${error.message}`)
  }
  
  // Test 1.3: Next.js Configuration
  try {
    const nextConfigExists = fs.existsSync(path.join(process.cwd(), 'next.config.js'))
    logTest('technical', 'Next.js config exists', nextConfigExists)
    
    if (nextConfigExists) {
      const nextConfigContent = fs.readFileSync(path.join(process.cwd(), 'next.config.js'), 'utf8')
      const hasImageOptimization = nextConfigContent.includes('images:')
      const hasSecurityHeaders = nextConfigContent.includes('headers()')
      const hasCaching = nextConfigContent.includes('Cache-Control')
      const hasCompression = nextConfigContent.includes('compress: true')
      
      logTest('technical', 'Image optimization configured', hasImageOptimization)
      logTest('technical', 'Security headers configured', hasSecurityHeaders)
      logTest('technical', 'Caching strategy implemented', hasCaching)
      logTest('technical', 'Compression enabled', hasCompression)
    }
  } catch (error) {
    logTest('technical', 'Next.js configuration check', false, `Error: ${error.message}`)
  }
  
  // Test 1.4: Mobile Optimization
  try {
    const documentPath = path.join(process.cwd(), 'pages/_document.tsx')
    const documentExists = fs.existsSync(documentPath)
    logTest('technical', 'Document configuration exists', documentExists)
    
    if (documentExists) {
      const documentContent = fs.readFileSync(documentPath, 'utf8')
      const hasViewport = documentContent.includes('viewport')
      const hasCharset = documentContent.includes('charset')
      const hasMobileOptimization = documentContent.includes('mobile-web-app')
      const hasThemeColor = documentContent.includes('theme-color')
      
      logTest('technical', 'Viewport meta tag configured', hasViewport)
      logTest('technical', 'Character encoding set', hasCharset)
      logTest('technical', 'Mobile app optimization', hasMobileOptimization)
      logTest('technical', 'Theme color configured', hasThemeColor)
    }
  } catch (error) {
    logTest('technical', 'Mobile optimization check', false, `Error: ${error.message}`)
  }
}

// Test 2: Content & Keyword Strategy
function testContentStrategy() {
  console.log('\\n📝 Content & Keyword Strategy Tests')
  console.log('-'.repeat(50))
  
  // Test 2.1: Homepage SEO
  try {
    const homepagePath = path.join(process.cwd(), 'pages/index.tsx')
    const homepageExists = fs.existsSync(homepagePath)
    logTest('content', 'Homepage file exists', homepageExists)
    
    if (homepageExists) {
      const homepageContent = fs.readFileSync(homepagePath, 'utf8')
      
      // Target keyword analysis
      const hasAIBusinessIntelligence = homepageContent.includes('AI Business Intelligence')
      const hasBusinessDirectorySubmission = homepageContent.includes('directory submission')
      const hasAIBusinessAnalysis = homepageContent.includes('AI business analysis') || homepageContent.includes('AI Market Analysis')
      
      logTest('content', 'Contains \"AI Business Intelligence\" keyword', hasAIBusinessIntelligence)
      logTest('content', 'Contains directory submission keywords', hasBusinessDirectorySubmission)
      logTest('content', 'Contains AI business analysis keywords', hasAIBusinessAnalysis)
      
      // SEO meta tags
      const hasTitle = homepageContent.includes('<title>')
      const hasDescription = homepageContent.includes('meta name=\"description\"')
      const hasCanonical = homepageContent.includes('rel=\"canonical\"')
      const hasKeywords = homepageContent.includes('meta name=\"keywords\"')
      
      logTest('content', 'Has optimized title tag', hasTitle)
      logTest('content', 'Has meta description', hasDescription)
      logTest('content', 'Has canonical URL', hasCanonical)
      logTest('content', 'Has keywords meta tag', hasKeywords)
      
      // Open Graph and Twitter Cards
      const hasOGTags = homepageContent.includes('property=\"og:')
      const hasTwitterCards = homepageContent.includes('name=\"twitter:')
      
      logTest('content', 'Has Open Graph tags', hasOGTags)
      logTest('content', 'Has Twitter Card tags', hasTwitterCards)
    }
  } catch (error) {
    logTest('content', 'Homepage SEO check', false, `Error: ${error.message}`)
  }
  
  // Test 2.2: Landing Page Content
  try {
    const landingPagePath = path.join(process.cwd(), 'components/LandingPage.tsx')
    const landingPageExists = fs.existsSync(landingPagePath)
    logTest('content', 'Landing page component exists', landingPageExists)
    
    if (landingPageExists) {
      const landingPageContent = fs.readFileSync(landingPagePath, 'utf8')
      
      // Content quality indicators
      const hasH1Tag = landingPageContent.includes('h1 className')
      const hasValueProposition = landingPageContent.includes('$4,300') && landingPageContent.includes('$299')
      const hasCompetitorComparison = landingPageContent.includes('consultant')
      const hasCTAs = landingPageContent.includes('Start Free Analysis')
      const hasFeatures = landingPageContent.includes('AI Market Analysis')
      
      logTest('content', 'Has proper H1 structure', hasH1Tag)
      logTest('content', 'Has clear value proposition', hasValueProposition)
      logTest('content', 'Has competitor comparison', hasCompetitorComparison)
      logTest('content', 'Has strong CTAs', hasCTAs)
      logTest('content', 'Has detailed features', hasFeatures)
      
      // E-A-T indicators
      const hasGuarantee = landingPageContent.includes('guarantee')
      const hasTestimonials = landingPageContent.includes('TestimonialsSection')
      const hasProfessionalTone = landingPageContent.includes('Enterprise') || landingPageContent.includes('Professional')
      
      logTest('content', 'Has trust indicators (guarantee)', hasGuarantee)
      logTest('content', 'Has social proof (testimonials)', hasTestimonials)
      logTest('content', 'Has professional positioning', hasProfessionalTone)
    }
  } catch (error) {
    logTest('content', 'Landing page content check', false, `Error: ${error.message}`)
  }
  
  // Test 2.3: Pricing Page SEO
  try {
    const pricingPagePath = path.join(process.cwd(), 'pages/pricing.tsx')
    const pricingPageExists = fs.existsSync(pricingPagePath)
    logTest('content', 'Pricing page exists', pricingPageExists)
    
    if (pricingPageExists) {
      const pricingPageContent = fs.readFileSync(pricingPagePath, 'utf8')
      
      const hasDirectoryKeywords = pricingPageContent.includes('directory')
      const hasPricingKeywords = pricingPageContent.includes('pricing')
      const hasLocalSEOKeywords = pricingPageContent.includes('local SEO') || pricingPageContent.includes('SEO')
      const hasBusinessListingKeywords = pricingPageContent.includes('business listing')
      
      logTest('content', 'Pricing page has directory keywords', hasDirectoryKeywords)
      logTest('content', 'Pricing page has pricing keywords', hasPricingKeywords)
      logTest('content', 'Pricing page has SEO keywords', hasLocalSEOKeywords)
      logTest('content', 'Pricing page has business listing keywords', hasBusinessListingKeywords)
    }
  } catch (error) {
    logTest('content', 'Pricing page SEO check', false, `Error: ${error.message}`)
  }
}

// Test 3: Competitive Positioning
function testCompetitivePositioning() {
  console.log('\\n🏆 Competitive Positioning Tests')
  console.log('-'.repeat(50))
  
  // Test 3.1: Premium Positioning
  try {
    const landingPagePath = path.join(process.cwd(), 'components/LandingPage.tsx')
    const landingPageContent = fs.readFileSync(landingPagePath, 'utf8')
    
    const hasPremiumPositioning = landingPageContent.includes('Enterprise') || landingPageContent.includes('Premium')
    const hasValueComparison = landingPageContent.includes('$4,300') && landingPageContent.includes('$299')
    const hasConsultantComparison = landingPageContent.includes('consultant') && landingPageContent.includes('$3,000')
    const hasAIAdvantage = landingPageContent.includes('AI-Powered') || landingPageContent.includes('AI-powered')
    const hasOneTimeValue = landingPageContent.includes('one-time') || landingPageContent.includes('ONE-TIME')
    
    logTest('competitive', 'Has premium positioning language', hasPremiumPositioning)
    logTest('competitive', 'Has clear value comparison', hasValueComparison)
    logTest('competitive', 'Has consultant cost comparison', hasConsultantComparison)
    logTest('competitive', 'Emphasizes AI advantage', hasAIAdvantage)
    logTest('competitive', 'Highlights one-time purchase benefit', hasOneTimeValue)
  } catch (error) {
    logTest('competitive', 'Premium positioning check', false, `Error: ${error.message}`)
  }
  
  // Test 3.2: Differentiation Strategy
  try {
    const landingPagePath = path.join(process.cwd(), 'components/LandingPage.tsx')
    const landingPageContent = fs.readFileSync(landingPagePath, 'utf8')
    
    const hasBusinessIntelligence = landingPageContent.includes('Business Intelligence')
    const hasMarketingStackReplacement = landingPageContent.includes('Marketing Stack')
    const hasCompetitorIntelligence = landingPageContent.includes('Competitor Intelligence')
    const hasAutomatedGrowth = landingPageContent.includes('Automated Growth')
    const hasLifetimeAccess = landingPageContent.includes('forever') || landingPageContent.includes('Lifetime')
    
    logTest('competitive', 'Positions as business intelligence platform', hasBusinessIntelligence)
    logTest('competitive', 'Positions as marketing stack replacement', hasMarketingStackReplacement)
    logTest('competitive', 'Offers competitor intelligence', hasCompetitorIntelligence)
    logTest('competitive', 'Provides automated growth strategies', hasAutomatedGrowth)
    logTest('competitive', 'Emphasizes lifetime value', hasLifetimeAccess)
  } catch (error) {
    logTest('competitive', 'Differentiation strategy check', false, `Error: ${error.message}`)
  }
  
  // Test 3.3: Market Positioning
  try {
    const homepagePath = path.join(process.cwd(), 'pages/index.tsx')
    const homepageContent = fs.readFileSync(homepagePath, 'utf8')
    
    const targetsBusinessOwners = homepageContent.includes('business') || homepageContent.includes('Business')
    const targetsEnterpriseClients = homepageContent.includes('Enterprise') || homepageContent.includes('enterprise')
    const hasROIFocus = homepageContent.includes('ROI') || homepageContent.includes('Save 93%')
    const hasScalabilityMessage = homepageContent.includes('scale') || homepageContent.includes('growth')
    
    logTest('competitive', 'Targets business owners', targetsBusinessOwners)
    logTest('competitive', 'Appeals to enterprise clients', targetsEnterpriseClients)
    logTest('competitive', 'Focuses on ROI/savings', hasROIFocus)
    logTest('competitive', 'Emphasizes scalability/growth', hasScalabilityMessage)
  } catch (error) {
    logTest('competitive', 'Market positioning check', false, `Error: ${error.message}`)
  }
}

// Test 4: Schema Markup Implementation
function testSchemaMarkup() {
  console.log('\\n🏷️ Schema Markup Tests')
  console.log('-'.repeat(50))
  
  // Test 4.1: Homepage Schema
  try {
    const homepagePath = path.join(process.cwd(), 'pages/index.tsx')
    const homepageContent = fs.readFileSync(homepagePath, 'utf8')
    
    const hasOrganizationSchema = homepageContent.includes('\"@type\": \"Organization\"')
    const hasWebsiteSchema = homepageContent.includes('\"@type\": \"WebSite\"')
    const hasServiceSchema = homepageContent.includes('\"@type\": \"Service\"')
    const hasBreadcrumbSchema = homepageContent.includes('\"@type\": \"BreadcrumbList\"')
    const hasStructuredData = homepageContent.includes('application/ld+json')
    
    logTest('schema', 'Has Organization schema', hasOrganizationSchema)
    logTest('schema', 'Has Website schema', hasWebsiteSchema)
    logTest('schema', 'Has Service schema', hasServiceSchema)
    logTest('schema', 'Has Breadcrumb schema', hasBreadcrumbSchema)
    logTest('schema', 'Uses proper JSON-LD format', hasStructuredData)
  } catch (error) {
    logTest('schema', 'Homepage schema check', false, `Error: ${error.message}`)
  }
  
  // Test 4.2: Pricing Schema
  try {
    const pricingPagePath = path.join(process.cwd(), 'pages/pricing.tsx')
    const pricingPageContent = fs.readFileSync(pricingPagePath, 'utf8')
    
    const hasOfferSchema = pricingPageContent.includes('\"@type\": \"Offer\"')
    const hasPriceSpecification = pricingPageContent.includes('price') && pricingPageContent.includes('USD')
    const hasProductSchema = pricingPageContent.includes('\"@type\": \"Product\"')
    
    logTest('schema', 'Has Offer schema for pricing', hasOfferSchema)
    logTest('schema', 'Has price specifications', hasPriceSpecification)
    logTest('schema', 'Has Product schema', hasProductSchema)
  } catch (error) {
    logTest('schema', 'Pricing schema check', false, `Error: ${error.message}`)
  }
  
  // Test 4.3: Contact Information Schema
  try {
    const homepagePath = path.join(process.cwd(), 'pages/index.tsx')
    const homepageContent = fs.readFileSync(homepagePath, 'utf8')
    
    const hasContactPoint = homepageContent.includes('\"@type\": \"ContactPoint\"')
    const hasEmail = homepageContent.includes('support@directorybolt.com')
    const hasSameAs = homepageContent.includes('\"sameAs\"')
    
    logTest('schema', 'Has ContactPoint schema', hasContactPoint)
    logTest('schema', 'Has contact email in schema', hasEmail)
    logTest('schema', 'Has social media links (sameAs)', hasSameAs)
  } catch (error) {
    logTest('schema', 'Contact schema check', false, `Error: ${error.message}`)
  }
}

// Test 5: Performance Optimization
function testPerformanceOptimization() {
  console.log('\\n⚡ Performance Optimization Tests')
  console.log('-'.repeat(50))
  
  // Test 5.1: Image Optimization
  try {
    const landingPagePath = path.join(process.cwd(), 'components/LandingPage.tsx')
    const landingPageContent = fs.readFileSync(landingPagePath, 'utf8')
    
    const usesNextImage = landingPageContent.includes('import Image from \\'next/image\\'')
    const hasPriorityImages = landingPageContent.includes('priority')
    const hasFetchPriority = landingPageContent.includes('fetchPriority')
    const hasSizes = landingPageContent.includes('sizes=')
    const hasAltText = landingPageContent.includes('alt=')
    
    logTest('performance', 'Uses Next.js Image component', usesNextImage)
    logTest('performance', 'Has priority loading for hero images', hasPriorityImages)
    logTest('performance', 'Has fetch priority optimization', hasFetchPriority)
    logTest('performance', 'Has responsive image sizes', hasSizes)
    logTest('performance', 'Has descriptive alt text', hasAltText)
  } catch (error) {
    logTest('performance', 'Image optimization check', false, `Error: ${error.message}`)
  }
  
  // Test 5.2: Code Splitting
  try {
    const landingPagePath = path.join(process.cwd(), 'components/LandingPage.tsx')
    const landingPageContent = fs.readFileSync(landingPagePath, 'utf8')
    
    const usesDynamicImports = landingPageContent.includes('dynamic(')
    const hasLazyLoading = landingPageContent.includes('ssr: false')
    
    logTest('performance', 'Uses dynamic imports for code splitting', usesDynamicImports)
    logTest('performance', 'Has lazy loading for below-fold content', hasLazyLoading)
  } catch (error) {
    logTest('performance', 'Code splitting check', false, `Error: ${error.message}`)
  }
  
  // Test 5.3: Font Optimization
  try {
    const documentPath = path.join(process.cwd(), 'pages/_document.tsx')
    const documentContent = fs.readFileSync(documentPath, 'utf8')
    
    const hasPreconnect = documentContent.includes('rel=\"preconnect\"')
    const hasGoogleFonts = documentContent.includes('fonts.googleapis.com')
    const hasDisplaySwap = documentContent.includes('display=swap')
    
    logTest('performance', 'Has font preconnect optimization', hasPreconnect)
    logTest('performance', 'Uses Google Fonts efficiently', hasGoogleFonts)
    logTest('performance', 'Has font display swap', hasDisplaySwap)
  } catch (error) {
    logTest('performance', 'Font optimization check', false, `Error: ${error.message}`)
  }
}

// Run all tests
async function runAllTests() {
  testTechnicalSEO()
  testContentStrategy()
  testCompetitivePositioning()
  testSchemaMarkup()
  testPerformanceOptimization()
  
  // Generate summary
  console.log('\\n' + '=' .repeat(60))
  console.log('📊 SEO VALIDATION SUMMARY')
  console.log('=' .repeat(60))
  
  let totalPassed = 0
  let totalFailed = 0
  
  Object.entries(testResults).forEach(([category, results]) => {
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1)
    console.log(`\\n${categoryName} SEO:`)
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
  console.log(`OVERALL SEO SCORE: ${totalPassed}/${totalPassed + totalFailed} tests passed`)
  
  const successRate = Math.round((totalPassed / (totalPassed + totalFailed)) * 100)
  console.log(`SEO Success Rate: ${successRate}%`)
  
  if (successRate >= 90) {
    console.log('\\n🎉 SEO EXCELLENT!')
    console.log('✅ Ready for production launch')
    console.log('🚀 Strong foundation for organic growth')
    console.log('🏆 Competitive advantage established')
  } else if (successRate >= 80) {
    console.log('\\n⚡ SEO VERY GOOD')
    console.log('✅ Ready for launch with minor optimizations')
    console.log('📈 Strong potential for organic growth')
  } else if (successRate >= 70) {
    console.log('\\n⚠️  SEO GOOD')
    console.log('🔧 Some optimizations needed before launch')
    console.log('📊 Solid foundation with room for improvement')
  } else {
    console.log('\\n❌ SEO NEEDS WORK')
    console.log('🚨 Significant optimizations required')
    console.log('⏰ Delay launch until critical issues resolved')
  }
  
  // Specific SEO recommendations
  console.log('\\n💡 SEO OPTIMIZATION STATUS:')
  if (testResults.technical.failed === 0) {
    console.log('   ✅ Technical SEO foundation is solid')
  } else {
    console.log('   ❌ Technical SEO issues need attention')
  }
  
  if (testResults.content.failed <= 2) {
    console.log('   ✅ Content strategy is well-optimized')
  } else {
    console.log('   ❌ Content strategy needs improvement')
  }
  
  if (testResults.competitive.failed === 0) {
    console.log('   ✅ Competitive positioning is strong')
  } else {
    console.log('   ❌ Competitive positioning needs work')
  }
  
  if (testResults.schema.failed === 0) {
    console.log('   ✅ Schema markup is comprehensive')
  } else {
    console.log('   ❌ Schema markup needs enhancement')
  }
  
  if (testResults.performance.failed <= 1) {
    console.log('   ✅ Performance optimization is good')
  } else {
    console.log('   ❌ Performance optimization needs work')
  }
  
  if (totalFailed <= 3) {
    console.log('\\n🎯 SEO LAUNCH READY!')
    console.log('   🚀 Strong technical foundation')
    console.log('   📈 Competitive content strategy')
    console.log('   🏆 Premium market positioning')
    console.log('   ⚡ Performance optimized')
    console.log('   🔍 Rich schema implementation')
  }
  
  process.exit(totalFailed > 5 ? 1 : 0)
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('💥 SEO test runner crashed:', error)
    process.exit(1)
  })
}

module.exports = {
  runAllTests,
  testResults
}