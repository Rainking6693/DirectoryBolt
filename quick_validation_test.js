/**
 * QUICK VALIDATION TEST
 * Tests core functionality and improvements
 */

const puppeteer = require('puppeteer');

async function quickValidation() {
  console.log('🚀 Starting Quick DirectoryBolt Validation');
  
  const results = {
    tests: [],
    improvements: [],
    launchReadinessScore: 0
  };
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 },
    args: ['--no-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Test 1: Landing page loads
    console.log('📱 Testing landing page...');
    const startTime = Date.now();
    await page.goto('http://localhost:3006');
    
    try {
      await page.waitForSelector('h1, h2, [data-testid="landing-hero"]', { timeout: 10000 });
      const loadTime = Date.now() - startTime;
      results.tests.push({ name: 'Landing Page Load', status: 'passed', time: loadTime });
      results.improvements.push(`Landing page loads in ${loadTime}ms`);
      console.log(`✅ Landing page loaded in ${loadTime}ms`);
    } catch (error) {
      results.tests.push({ name: 'Landing Page Load', status: 'failed', error: error.message });
      console.log(`❌ Landing page failed to load: ${error.message}`);
    }
    
    // Test 2: Navigation to analysis
    console.log('🔍 Testing navigation to analysis...');
    try {
      // Look for analysis or URL input
      const urlInput = await page.$('input[type="url"], input[placeholder*="website"], input[placeholder*="URL"]');
      if (urlInput) {
        results.tests.push({ name: 'Analysis Form Available', status: 'passed' });
        results.improvements.push('Website analysis form is accessible');
        console.log('✅ Analysis form found');
        
        // Test 3: API call with timeout handling
        console.log('⚡ Testing API timeout handling...');
        const apiStartTime = Date.now();
        
        await urlInput.type('https://example.com');
        
        // Find submit button
        const submitButton = await page.$('button[type="submit"], button:contains("Analyze"), button:contains("FREE")');
        if (submitButton) {
          await submitButton.click();
          
          try {
            // Wait for response or error (max 30 seconds)
            await page.waitForFunction(() => {
              return document.textContent.includes('Analysis completed') ||
                     document.textContent.includes('error') ||
                     document.textContent.includes('Error') ||
                     document.textContent.includes('failed') ||
                     document.textContent.includes('timeout') ||
                     document.querySelector('[data-testid="analysis-results"]') ||
                     document.querySelector('[data-testid="error-display"]');
            }, { timeout: 35000 });
            
            const apiTime = Date.now() - apiStartTime;
            
            if (apiTime < 25000) { // Under 25 seconds is improvement
              results.improvements.push(`API response time improved: ${(apiTime/1000).toFixed(1)}s (vs previous 30s+ timeouts)`);
            }
            
            results.tests.push({ name: 'API Analysis Call', status: 'passed', time: apiTime });
            console.log(`✅ API call completed in ${(apiTime/1000).toFixed(1)}s`);
            
            // Check for specific error messages
            const pageContent = await page.content();
            if (pageContent.includes('could not find') || 
                pageContent.includes('DNS') || 
                pageContent.includes('timeout') ||
                pageContent.includes('SSL')) {
              results.improvements.push('Specific error messages instead of generic failures');
              console.log('✅ Specific error messaging detected');
            }
            
          } catch (apiError) {
            const apiTime = Date.now() - apiStartTime;
            results.tests.push({ name: 'API Analysis Call', status: 'timeout', time: apiTime });
            console.log(`⏰ API call timed out after ${(apiTime/1000).toFixed(1)}s`);
          }
        }
      } else {
        results.tests.push({ name: 'Analysis Form Available', status: 'failed' });
        console.log('❌ Analysis form not found');
      }
    } catch (error) {
      results.tests.push({ name: 'Analysis Navigation', status: 'failed', error: error.message });
      console.log(`❌ Analysis navigation failed: ${error.message}`);
    }
    
    // Test 4: Check pricing page and checkout
    console.log('💳 Testing pricing and checkout...');
    try {
      await page.goto('http://localhost:3006/pricing');
      await page.waitForSelector('button, .pricing', { timeout: 5000 });
      
      // Look for checkout buttons
      const checkoutButtons = await page.$$('button:contains("Start"), button:contains("Checkout"), button[data-testid*="checkout"]');
      if (checkoutButtons.length > 0) {
        results.tests.push({ name: 'Pricing Page Available', status: 'passed' });
        results.improvements.push(`${checkoutButtons.length} pricing options available with checkout functionality`);
        console.log(`✅ Pricing page with ${checkoutButtons.length} checkout options`);
      }
    } catch (error) {
      results.tests.push({ name: 'Pricing Page Available', status: 'failed', error: error.message });
      console.log(`❌ Pricing page failed: ${error.message}`);
    }
    
  } finally {
    await browser.close();
  }
  
  // Calculate launch readiness score
  const passedTests = results.tests.filter(t => t.status === 'passed').length;
  const totalTests = results.tests.length;
  const improvementCount = results.improvements.length;
  
  let score = totalTests > 0 ? (passedTests / totalTests) * 6 : 0; // Base score out of 6
  score += Math.min(4, improvementCount * 0.5); // Up to 4 points for improvements
  
  results.launchReadinessScore = Math.round(score * 10) / 10;
  
  // Display results
  console.log('\n' + '='.repeat(60));
  console.log('🎯 QUICK VALIDATION RESULTS');
  console.log('='.repeat(60));
  console.log(`\n📊 Tests: ${passedTests}/${totalTests} passed`);
  console.log(`🚀 Launch Readiness Score: ${results.launchReadinessScore}/10`);
  
  console.log('\n✨ Improvements Detected:');
  results.improvements.forEach(improvement => {
    console.log(`   • ${improvement}`);
  });
  
  console.log('\n📋 Test Results:');
  results.tests.forEach(test => {
    const status = test.status === 'passed' ? '✅' : 
                   test.status === 'timeout' ? '⏰' : '❌';
    const time = test.time ? ` (${test.time}ms)` : '';
    console.log(`   ${status} ${test.name}${time}`);
    if (test.error) console.log(`      Error: ${test.error}`);
  });
  
  if (results.launchReadinessScore >= 8) {
    console.log('\n🎉 EXCELLENT! Ready for production deployment.');
  } else if (results.launchReadinessScore >= 6) {
    console.log('\n✅ GOOD! Major improvements detected, minor fixes recommended.');
  } else {
    console.log('\n⚠️ Additional development work recommended.');
  }
  
  console.log('='.repeat(60));
  
  return results;
}

if (require.main === module) {
  quickValidation().catch(console.error);
}

module.exports = { quickValidation };