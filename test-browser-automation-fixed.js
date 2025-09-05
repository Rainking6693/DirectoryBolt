const puppeteer = require('puppeteer');

async function testWebsiteRenderingFixed() {
  console.log('🚀 Testing FIXED website rendering...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Capture console errors
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Capture network failures
    const networkErrors = [];
    page.on('response', (response) => {
      if (!response.ok() && response.status() !== 304) {
        networkErrors.push(`${response.status()} - ${response.url()}`);
      }
    });
    
    console.log('🏠 Testing homepage...');
    const startTime = Date.now();
    await page.goto('http://localhost:3001/', { waitUntil: 'networkidle0' });
    const loadTime = Date.now() - startTime;
    
    // Check if JavaScript is being rendered as text
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasRawJs = bodyText.includes('function(') || bodyText.includes('const ') || bodyText.includes('import ');
    
    // Check if main content is visible
    const hasContent = await page.$('nav') !== null && await page.$('h1') !== null;
    
    // Get page title to verify it's loading correctly
    const pageTitle = await page.title();
    
    // Get page metrics
    const metrics = await page.metrics();
    
    console.log(`✅ Homepage loaded in ${loadTime}ms`);
    console.log(`✅ Page title: "${pageTitle}"`);
    console.log(`✅ Raw JavaScript visible: ${hasRawJs ? '❌ YES (PROBLEM!)' : '✅ NO (FIXED!)'}`);
    console.log(`✅ Main content rendered: ${hasContent ? '✅ YES' : '❌ NO (PROBLEM!)'}`);
    console.log(`✅ Console errors: ${consoleErrors.length}`);
    console.log(`✅ Network errors: ${networkErrors.length}`);
    
    // Test pricing page
    console.log('💰 Testing pricing page...');
    await page.goto('http://localhost:3001/pricing', { waitUntil: 'networkidle0' });
    const pricingHasContent = await page.$('[data-testid="pricing"], .pricing, h1, h2') !== null;
    const pricingTitle = await page.title();
    console.log(`✅ Pricing page loaded: "${pricingTitle}"`);
    console.log(`✅ Pricing page content: ${pricingHasContent ? '✅ YES' : '❌ NO (PROBLEM!)'}`);
    
    // Test analyze page
    console.log('🔍 Testing analyze page...');
    await page.goto('http://localhost:3001/analyze', { waitUntil: 'networkidle0' });
    const analyzeHasContent = await page.$('form, input, h1, h2') !== null;
    const analyzeTitle = await page.title();
    console.log(`✅ Analyze page loaded: "${analyzeTitle}"`);
    console.log(`✅ Analyze page content: ${analyzeHasContent ? '✅ YES' : '❌ NO (PROBLEM!)'}`);
    
    // Test mobile responsiveness
    console.log('📱 Testing mobile responsiveness...');
    await page.setViewport({ width: 375, height: 667 }); // iPhone 6/7/8
    await page.goto('http://localhost:3001/', { waitUntil: 'networkidle0' });
    const mobileNav = await page.$('nav') !== null;
    console.log(`✅ Mobile navigation: ${mobileNav ? '✅ YES' : '❌ NO (PROBLEM!)'}`);
    
    // Performance metrics
    console.log('\n📊 Performance Metrics:');
    console.log(`- JSEventListeners: ${metrics.JSEventListeners || 0}`);
    console.log(`- JSHeapUsedSize: ${Math.round((metrics.JSHeapUsedSize || 0) / 1024 / 1024)}MB`);
    console.log(`- JSHeapTotalSize: ${Math.round((metrics.JSHeapTotalSize || 0) / 1024 / 1024)}MB`);
    
    // Show only critical errors
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('Content Security Policy') && 
      !err.includes('X-Frame-Options') && 
      !err.includes('trusted-types') &&
      !err.includes('favicon') &&
      !err.includes('apple-touch-icon')
    );
    
    if (criticalErrors.length > 0) {
      console.log('\n❌ Critical Console Errors Found:');
      criticalErrors.forEach(error => console.log(`  - ${error}`));
    }
    
    const criticalNetworkErrors = networkErrors.filter(err => !err.includes('favicon') && !err.includes('apple-touch-icon'));
    if (criticalNetworkErrors.length > 0) {
      console.log('\n❌ Critical Network Errors Found:');
      criticalNetworkErrors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('\n🎉 Fixed website testing completed!');
    
    // Return test results
    return {
      homepage: { hasRawJs, hasContent, loadTime, title: pageTitle },
      pricing: { hasContent: pricingHasContent, title: pricingTitle },
      analyze: { hasContent: analyzeHasContent, title: analyzeTitle },
      mobile: { hasNav: mobileNav },
      errors: { console: criticalErrors, network: criticalNetworkErrors },
      metrics
    };
    
  } catch (error) {
    console.error('❌ Fixed website testing failed:', error.message);
    return { error: error.message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testWebsiteRenderingFixed()
  .then(results => {
    console.log('\n📋 FIXED Website Test Summary:');
    if (results.error) {
      console.log(`❌ FAILED: ${results.error}`);
      process.exit(1);
    } else {
      const issues = [];
      if (results.homepage?.hasRawJs) issues.push('Homepage shows raw JavaScript');
      if (!results.homepage?.hasContent) issues.push('Homepage missing content');
      if (!results.pricing?.hasContent) issues.push('Pricing page missing content');
      if (!results.analyze?.hasContent) issues.push('Analyze page missing content');
      if (!results.mobile?.hasNav) issues.push('Mobile navigation missing');
      
      if (issues.length === 0) {
        console.log('🎉 ✅ ALL TESTS PASSED - CRITICAL ISSUE FIXED!');
        console.log('🚀 Site is ready for deployment - users will see proper content!');
        process.exit(0);
      } else {
        console.log('❌ REMAINING ISSUES:');
        issues.forEach(issue => console.log(`  - ${issue}`));
        process.exit(1);
      }
    }
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });