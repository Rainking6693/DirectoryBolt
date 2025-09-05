const puppeteer = require('puppeteer');

async function testCSPErrors() {
  console.log('🔍 Testing CSP fixes...');
  
  const browser = await puppeteer.launch({
    headless: false,
    devtools: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const errors = [];
  const warnings = [];

  // Listen for console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      errors.push(text);
      console.log('❌ Console Error:', text);
    } else if (type === 'warning') {
      warnings.push(text);
      console.log('⚠️ Console Warning:', text);
    }
  });

  try {
    console.log('📄 Testing homepage at http://localhost:3001');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
    
    // Wait a bit for any delayed errors
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Filter out non-CSP errors
    const cspErrors = errors.filter(err => 
      err.includes('Content Security Policy') ||
      err.includes('Trusted') ||
      err.includes('require-trusted-types-for')
    );
    
    console.log('\n📊 Test Results:');
    console.log(`Total Console Errors: ${errors.length}`);
    console.log(`CSP-Related Errors: ${cspErrors.length}`);
    console.log(`Console Warnings: ${warnings.length}`);
    
    if (cspErrors.length === 0) {
      console.log('✅ CSP errors have been fixed!');
    } else {
      console.log('❌ CSP errors still present:');
      cspErrors.forEach(err => console.log(`  - ${err}`));
    }
    
    // Test pricing page
    console.log('\n📄 Testing pricing page...');
    await page.goto('http://localhost:3001/pricing', { waitUntil: 'networkidle0' });
    
    // Check for pricing content
    const pricingCards = await page.$$eval('*', elements => {
      return elements.filter(el => {
        const text = el.textContent || '';
        return text.includes('$') && (text.includes('month') || text.includes('Starter') || text.includes('Growth') || text.includes('Pro'));
      }).length;
    });
    
    console.log(`Found ${pricingCards} pricing-related elements on pricing page`);
    
    // Test analyze page
    console.log('\n📄 Testing analyze page...');
    await page.goto('http://localhost:3001/analyze', { waitUntil: 'networkidle0' });
    
    // Check for form
    const forms = await page.$$('form');
    const inputs = await page.$$('input[type="text"], input[type="url"]');
    const buttons = await page.$$('button[type="submit"], input[type="submit"]');
    
    console.log(`Found ${forms.length} forms, ${inputs.length} text inputs, ${buttons.length} submit buttons on analyze page`);
    
    const summary = {
      cspErrorsFixed: cspErrors.length === 0,
      totalErrors: errors.length,
      cspErrors: cspErrors.length,
      pricingElements: pricingCards,
      formsFound: forms.length,
      inputsFound: inputs.length,
      buttonsFound: buttons.length
    };
    
    console.log('\n📋 Final Summary:', JSON.stringify(summary, null, 2));
    
    return summary;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  testCSPErrors()
    .then(results => {
      console.log('\n✅ CSP test completed');
      if (results.cspErrorsFixed && results.formsFound > 0 && results.pricingElements > 0) {
        console.log('🎉 All critical issues appear to be fixed!');
        process.exit(0);
      } else {
        console.log('⚠️ Some issues may remain');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testCSPErrors };