const puppeteer = require('puppeteer');

async function debugSpecificPages() {
  console.log('🔍 Debugging specific page issues...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // Debug pricing page
    console.log('\n💰 Debugging pricing page...');
    await page.goto('http://localhost:3001/pricing', { waitUntil: 'networkidle0' });
    
    // Look for pricing-related elements with more flexible selectors
    const pricingElements = await page.evaluate(() => {
      const elements = [];
      
      // Look for price indicators
      document.querySelectorAll('*').forEach(el => {
        const text = el.textContent || '';
        if (text.includes('$') || text.includes('price') || text.includes('plan') || 
            text.includes('starter') || text.includes('growth') || text.includes('pro')) {
          elements.push({
            tag: el.tagName,
            class: el.className,
            text: text.substring(0, 50) + '...'
          });
        }
      });
      
      return elements.slice(0, 10); // Limit results
    });
    
    console.log('💰 Pricing-related elements found:');
    pricingElements.forEach(el => {
      console.log(`  - ${el.tag}.${el.class}: "${el.text}"`);
    });
    
    // Check for buttons specifically
    const allButtons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map(btn => ({
        text: btn.textContent.trim(),
        disabled: btn.disabled,
        visible: btn.offsetParent !== null,
        classes: btn.className
      }));
    });
    
    console.log(`💰 All buttons on pricing page: ${allButtons.length}`);
    allButtons.forEach(btn => {
      console.log(`  - "${btn.text}" (disabled: ${btn.disabled}, visible: ${btn.visible})`);
    });
    
    // Debug analyze page
    console.log('\n🔍 Debugging analyze page...');
    await page.goto('http://localhost:3001/analyze', { waitUntil: 'networkidle0' });
    
    // Look for form elements more broadly
    const formElements = await page.evaluate(() => {
      const forms = Array.from(document.querySelectorAll('form')).map(form => ({
        id: form.id,
        class: form.className,
        inputs: form.querySelectorAll('input, textarea, select').length
      }));
      
      const inputs = Array.from(document.querySelectorAll('input, textarea, select')).map(input => ({
        type: input.type || input.tagName.toLowerCase(),
        name: input.name,
        placeholder: input.placeholder,
        id: input.id
      }));
      
      return { forms, inputs };
    });
    
    console.log(`🔍 Forms found: ${formElements.forms.length}`);
    formElements.forms.forEach(form => {
      console.log(`  - Form (id: ${form.id}, class: ${form.class}, inputs: ${form.inputs})`);
    });
    
    console.log(`🔍 Input fields found: ${formElements.inputs.length}`);
    formElements.inputs.forEach(input => {
      console.log(`  - ${input.type} (name: ${input.name}, placeholder: "${input.placeholder}")`);
    });
    
    // Check page content to see what's actually there
    const analyzeContent = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent.trim());
      const bodyText = document.body.textContent.substring(0, 500) + '...';
      return { headings, bodyText };
    });
    
    console.log('🔍 Analyze page content:');
    console.log(`  - Headings: ${analyzeContent.headings.join(', ')}`);
    console.log(`  - Body preview: ${analyzeContent.bodyText}`);
    
    // Test button interactions more carefully
    console.log('\n🔘 Testing button click handling...');
    await page.goto('http://localhost:3001/', { waitUntil: 'networkidle0' });
    
    const buttonDetails = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).map((btn, index) => ({
        index,
        text: btn.textContent.trim(),
        disabled: btn.disabled,
        visible: btn.offsetParent !== null,
        hasClickHandler: btn.onclick !== null || btn.addEventListener !== undefined,
        styles: getComputedStyle(btn).display
      }));
    });
    
    console.log('🔘 Button click analysis:');
    buttonDetails.forEach(btn => {
      console.log(`  - Button ${btn.index}: "${btn.text}"`);
      console.log(`    Disabled: ${btn.disabled}, Visible: ${btn.visible}, Display: ${btn.styles}`);
    });
    
    return {
      pricing: { elements: pricingElements.length, buttons: allButtons.length },
      analyze: { forms: formElements.forms.length, inputs: formElements.inputs.length },
      buttons: buttonDetails.length
    };
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    return { error: error.message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugSpecificPages()
  .then(results => {
    console.log('\n📋 Debug Summary:');
    if (results.error) {
      console.log(`❌ Debug failed: ${results.error}`);
    } else {
      console.log(`💰 Pricing page: ${results.pricing.elements} price elements, ${results.pricing.buttons} buttons`);
      console.log(`🔍 Analyze page: ${results.analyze.forms} forms, ${results.analyze.inputs} inputs`);
      console.log(`🔘 Interactive buttons: ${results.buttons} found`);
      
      if (results.pricing.elements > 0 && results.pricing.buttons > 0) {
        console.log('✅ Pricing page appears functional');
      } else {
        console.log('⚠️  Pricing page may have issues');
      }
      
      if (results.analyze.forms > 0 || results.analyze.inputs > 0) {
        console.log('✅ Analyze page appears functional');
      } else {
        console.log('⚠️  Analyze page may have issues');
      }
    }
  })
  .catch(console.error);