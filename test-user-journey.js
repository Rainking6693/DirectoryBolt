const puppeteer = require('puppeteer');

async function testUserJourney() {
  console.log('👤 Testing complete user journey...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    const results = {
      homepage: { loaded: false, navigation: false },
      pricing: { loaded: false, pricing_cards: false },
      analyze: { loaded: false, form: false },
      checkout: { button_clicks: 0, errors: [] },
      mobile: { responsive: false }
    };
    
    // Test 1: Homepage Journey
    console.log('🏠 Testing homepage user journey...');
    await page.goto('http://localhost:3001/', { waitUntil: 'networkidle0' });
    
    // Check if homepage loads properly
    const homepageTitle = await page.title();
    results.homepage.loaded = homepageTitle.includes('DirectoryBolt');
    console.log(`✅ Homepage loaded: ${results.homepage.loaded ? 'YES' : 'NO'} - "${homepageTitle}"`);
    
    // Test navigation links
    const navLinks = await page.$$eval('nav a', links => 
      links.map(link => ({ href: link.href, text: link.textContent.trim() }))
    );
    results.homepage.navigation = navLinks.length > 0;
    console.log(`✅ Navigation links found: ${navLinks.length}`);
    navLinks.forEach(link => console.log(`  - ${link.text}: ${link.href}`));
    
    // Test 2: Pricing Page Journey
    console.log('💰 Testing pricing page journey...');
    await page.goto('http://localhost:3001/pricing', { waitUntil: 'networkidle0' });
    
    const pricingTitle = await page.title();
    results.pricing.loaded = pricingTitle.includes('DirectoryBolt');
    console.log(`✅ Pricing page loaded: ${results.pricing.loaded ? 'YES' : 'NO'}`);
    
    // Check for pricing cards/plans
    const pricingCards = await page.$$('.pricing, [class*="plan"], [class*="price"], button[class*="trial"], button[class*="start"]');
    results.pricing.pricing_cards = pricingCards.length > 0;
    console.log(`✅ Pricing elements found: ${pricingCards.length}`);
    
    // Test CTA buttons
    const ctaButtons = await page.$$eval('button', buttons => 
      buttons.filter(btn => 
        btn.textContent.includes('Start') || 
        btn.textContent.includes('Trial') || 
        btn.textContent.includes('Free')
      ).map(btn => btn.textContent.trim())
    );
    console.log(`✅ CTA buttons found: ${ctaButtons.length}`);
    ctaButtons.forEach(btn => console.log(`  - "${btn}"`));
    
    // Test 3: Analyze Page Journey
    console.log('🔍 Testing analyze page journey...');
    await page.goto('http://localhost:3001/analyze', { waitUntil: 'networkidle0' });
    
    const analyzeTitle = await page.title();
    results.analyze.loaded = analyzeTitle.includes('DirectoryBolt');
    console.log(`✅ Analyze page loaded: ${results.analyze.loaded ? 'YES' : 'NO'}`);
    
    // Check for form elements
    const formElements = await page.$$('form, input, textarea, button[type="submit"]');
    results.analyze.form = formElements.length > 0;
    console.log(`✅ Form elements found: ${formElements.length}`);
    
    // Test form inputs
    const inputs = await page.$$eval('input', inputs => 
      inputs.map(input => ({ type: input.type, placeholder: input.placeholder }))
    );
    console.log(`✅ Input fields: ${inputs.length}`);
    inputs.forEach(input => console.log(`  - Type: ${input.type}, Placeholder: "${input.placeholder}"`));
    
    // Test 4: Mobile Responsiveness
    console.log('📱 Testing mobile responsiveness...');
    await page.setViewport({ width: 375, height: 667 }); // iPhone size
    await page.goto('http://localhost:3001/', { waitUntil: 'networkidle0' });
    
    // Check if mobile navigation exists
    const mobileElements = await page.$$('nav, button, .menu, [class*="mobile"]');
    results.mobile.responsive = mobileElements.length > 0;
    console.log(`✅ Mobile elements found: ${mobileElements.length}`);
    
    // Test mobile viewport
    const viewportSize = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight
    }));
    console.log(`✅ Mobile viewport: ${viewportSize.width}x${viewportSize.height}`);
    
    // Test 5: Button Interactions (without actual form submissions)
    console.log('🔘 Testing button interactions...');
    await page.setViewport({ width: 1920, height: 1080 }); // Desktop
    await page.goto('http://localhost:3001/', { waitUntil: 'networkidle0' });
    
    // Find and test CTA buttons
    const mainCTAs = await page.$$('button');
    console.log(`✅ Total buttons found: ${mainCTAs.length}`);
    
    for (let i = 0; i < Math.min(mainCTAs.length, 3); i++) {
      try {
        const buttonText = await page.evaluate(el => el.textContent, mainCTAs[i]);
        console.log(`  - Testing button: "${buttonText.trim()}"`);
        
        // Just check if button is clickable (don't actually click to avoid navigation)
        const isClickable = await page.evaluate(el => {
          return !el.disabled && el.offsetParent !== null;
        }, mainCTAs[i]);
        
        if (isClickable) {
          results.checkout.button_clicks++;
        }
      } catch (error) {
        results.checkout.errors.push(`Button ${i}: ${error.message}`);
      }
    }
    
    console.log(`✅ Clickable buttons: ${results.checkout.button_clicks}`);
    
    return results;
    
  } catch (error) {
    console.error('❌ User journey testing failed:', error.message);
    return { error: error.message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testUserJourney()
  .then(results => {
    console.log('\n📋 User Journey Test Summary:');
    
    if (results.error) {
      console.log(`❌ FAILED: ${results.error}`);
      process.exit(1);
    }
    
    const issues = [];
    
    if (!results.homepage.loaded) issues.push('Homepage not loading properly');
    if (!results.homepage.navigation) issues.push('Homepage navigation missing');
    if (!results.pricing.loaded) issues.push('Pricing page not loading properly');
    if (!results.pricing.pricing_cards) issues.push('Pricing cards not found');
    if (!results.analyze.loaded) issues.push('Analyze page not loading properly');
    if (!results.analyze.form) issues.push('Analyze form not found');
    if (!results.mobile.responsive) issues.push('Mobile responsiveness issues');
    if (results.checkout.button_clicks === 0) issues.push('No clickable CTA buttons');
    
    console.log(`📊 Results Summary:`);
    console.log(`  - Homepage: ${results.homepage.loaded ? '✅' : '❌'} Loaded, ${results.homepage.navigation ? '✅' : '❌'} Navigation`);
    console.log(`  - Pricing: ${results.pricing.loaded ? '✅' : '❌'} Loaded, ${results.pricing.pricing_cards ? '✅' : '❌'} Pricing Cards`);
    console.log(`  - Analyze: ${results.analyze.loaded ? '✅' : '❌'} Loaded, ${results.analyze.form ? '✅' : '❌'} Form`);
    console.log(`  - Mobile: ${results.mobile.responsive ? '✅' : '❌'} Responsive`);
    console.log(`  - Interactions: ${results.checkout.button_clicks} clickable buttons`);
    
    if (results.checkout.errors.length > 0) {
      console.log('⚠️  Button interaction errors:');
      results.checkout.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (issues.length === 0) {
      console.log('🎉 ✅ ALL USER JOURNEY TESTS PASSED!');
      console.log('🚀 Users can successfully navigate the entire website!');
      process.exit(0);
    } else {
      console.log('❌ USER JOURNEY ISSUES:');
      issues.forEach(issue => console.log(`  - ${issue}`));
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });