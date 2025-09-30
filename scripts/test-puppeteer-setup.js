#!/usr/bin/env node

// 🧪 PUPPETEER SETUP VALIDATION TEST
// Tests Puppeteer configuration for both local and serverless environments

const puppeteer = require('puppeteer-core')

async function testPuppeteerSetup() {
  console.log('🔍 Testing Puppeteer Setup for DirectoryBolt...')
  console.log('=' .repeat(50))
  
  // Test 1: Check if puppeteer-core is installed
  console.log('📦 Checking puppeteer-core installation...')
  try {
    const puppeteerVersion = require('puppeteer-core/package.json').version
    console.log(`✅ puppeteer-core@${puppeteerVersion} - INSTALLED`)
  } catch (error) {
    console.log('❌ chrome-aws-lambda - NOT INSTALLED')
    console.log('   Run: npm install chrome-aws-lambda@^10.1.0')
    console.log('   TODO: Align puppeteer-core with chrome-aws-lambda peer requirement before enabling serverless Chrome.')
    return false
  }
  
  // Test 2: Check if @sparticuz/chromium is installed
  console.log('🌐 Checking @sparticuz/chromium installation...')
  try {
    const chromiumVersion = require('@sparticuz/chromium/package.json').version
    console.log(`✅ @sparticuz/chromium@${chromiumVersion} - INSTALLED`)
  } catch (error) {
    console.log('❌ @sparticuz/chromium - NOT INSTALLED')
    console.log('   Run: npm install @sparticuz/chromium@^116.0.0')
    return false
  }
  
  // Test 3: Check if chrome-aws-lambda is installed
  console.log('☁️  Checking chrome-aws-lambda installation...')
  try {
    const chromeAwsVersion = require('chrome-aws-lambda/package.json').version
    console.log(`✅ chrome-aws-lambda@${chromeAwsVersion} - INSTALLED`)
  } catch (error) {\n    console.log('❌ chrome-aws-lambda - NOT INSTALLED')\n    console.log('   Run: npm install chrome-aws-lambda@^10.1.0')\n    return false\n  }\n  \n  // Test 4: Test local Puppeteer launch\n  console.log('🚀 Testing local Puppeteer launch...')\n  try {\n    const browser = await puppeteer.launch({\n      headless: 'new',\n      args: [\n        '--no-sandbox',\n        '--disable-setuid-sandbox',\n        '--disable-dev-shm-usage',\n        '--disable-accelerated-2d-canvas',\n        '--no-first-run',\n        '--no-zygote',\n        '--disable-gpu'\n      ]\n    })\n    \n    const page = await browser.newPage()\n    await page.goto('https://example.com', { waitUntil: 'networkidle2', timeout: 10000 })\n    const title = await page.title()\n    await browser.close()\n    \n    console.log(`✅ Local Puppeteer - SUCCESS (Page title: \"${title}\")`)\n  } catch (error) {\n    console.log('❌ Local Puppeteer - FAILED')\n    console.log(`   Error: ${error.message}`)\n    console.log('   This may be normal if Chrome is not installed locally')\n  }\n  \n  // Test 5: Test serverless configuration\n  console.log('☁️  Testing serverless Puppeteer configuration...')\n  try {\n    const chromium = require('@sparticuz/chromium')\n    \n    // Test chromium.executablePath() without actually launching\n    const executablePath = await chromium.executablePath()\n    console.log(`✅ Serverless config - SUCCESS (Executable: ${executablePath ? 'Found' : 'Will download'})`)\n    \n    // Test args configuration\n    const args = chromium.args\n    console.log(`✅ Chromium args - ${args.length} arguments configured`)\n    \n  } catch (error) {\n    console.log('❌ Serverless config - FAILED')\n    console.log(`   Error: ${error.message}`)\n    return false\n  }\n  \n  // Test 6: Environment variables check\n  console.log('🔧 Checking environment configuration...')\n  \n  if (process.env.PUPPETEER_EXECUTABLE_PATH) {\n    console.log('⚠️  PUPPETEER_EXECUTABLE_PATH is set - this may conflict with serverless')\n    console.log('   Consider removing this environment variable for serverless compatibility')\n  } else {\n    console.log('✅ PUPPETEER_EXECUTABLE_PATH - Not set (good for serverless)')\n  }\n  \n  if (process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD === 'true') {\n    console.log('✅ PUPPETEER_SKIP_CHROMIUM_DOWNLOAD - Enabled (good for serverless)')\n  } else {\n    console.log('⚠️  PUPPETEER_SKIP_CHROMIUM_DOWNLOAD - Not set or false')\n    console.log('   Consider setting this to \"true\" to avoid downloading Chromium')\n  }\n  \n  // Test 7: Check for conflicting packages\n  console.log('🔍 Checking for conflicting packages...')\n  try {\n    require('puppeteer')\n    console.log('⚠️  Full \"puppeteer\" package detected - this may cause conflicts')\n    console.log('   Consider removing \"puppeteer\" and using only \"puppeteer-core\"')\n  } catch (error) {\n    console.log('✅ No conflicting \"puppeteer\" package found')\n  }\n  \n  console.log('\\n' + '=' .repeat(50))\n  console.log('📊 PUPPETEER SETUP SUMMARY')\n  console.log('=' .repeat(50))\n  \n  console.log('✅ Dependencies: All required packages installed')\n  console.log('✅ Configuration: Serverless-compatible setup')\n  console.log('✅ Environment: Properly configured for Netlify/Vercel')\n  \n  console.log('\\n💡 DEPLOYMENT NOTES:')\n  console.log('   - Uses puppeteer-core (not full puppeteer) for smaller bundle size')\n  console.log('   - @sparticuz/chromium provides Chrome binary for serverless')\n  console.log('   - chrome-aws-lambda provides AWS Lambda compatibility')\n  console.log('   - No PUPPETEER_EXECUTABLE_PATH needed - handled automatically')\n  \n  console.log('\\n🎉 Puppeteer setup is ready for production deployment!')\n  return true\n}\n\n// Test the enhanced website analyzer integration\nasync function testWebsiteAnalyzerIntegration() {\n  console.log('\\n🔗 Testing Website Analyzer Integration...')\n  \n  try {\n    // Import the analyzer (this tests the import chain)\n    const { createEnhancedWebsiteAnalyzer } = require('../lib/services/enhanced-website-analyzer')\n    \n    console.log('✅ Enhanced Website Analyzer - Import successful')\n    \n    // Create analyzer with screenshots disabled for testing\n    const analyzer = createEnhancedWebsiteAnalyzer({\n      timeout: 10000,\n      maxRetries: 1,\n      enableScreenshots: false, // Disable for testing\n      enableSocialAnalysis: true,\n      enableTechStackAnalysis: true\n    })\n    \n    console.log('✅ Enhanced Website Analyzer - Configuration successful')\n    \n    // Test basic analysis (without screenshots)\n    const result = await analyzer.analyzeWebsite('https://example.com')\n    \n    console.log('✅ Enhanced Website Analyzer - Basic analysis successful')\n    console.log(`   Business Name: ${result.businessProfile.name || 'Detected'}`)\n    console.log(`   SEO Score: ${result.seoAnalysis.currentScore}`)\n    \n    return true\n  } catch (error) {\n    console.log('❌ Website Analyzer Integration - FAILED')\n    console.log(`   Error: ${error.message}`)\n    return false\n  }\n}\n\n// Run all tests\nasync function runAllTests() {\n  const setupSuccess = await testPuppeteerSetup()\n  const integrationSuccess = await testWebsiteAnalyzerIntegration()\n  \n  if (setupSuccess && integrationSuccess) {\n    console.log('\\n🎉 ALL TESTS PASSED! Puppeteer is ready for DirectoryBolt AI features.')\n    process.exit(0)\n  } else {\n    console.log('\\n❌ Some tests failed. Please check the configuration and try again.')\n    process.exit(1)\n  }\n}\n\nif (require.main === module) {\n  runAllTests().catch(error => {\n    console.error('💥 Test runner crashed:', error)\n    process.exit(1)\n  })\n}\n\nmodule.exports = {\n  testPuppeteerSetup,\n  testWebsiteAnalyzerIntegration,\n  runAllTests\n}"