const puppeteer = require('puppeteer');

async function debugJavaScriptVisibility() {
  console.log('🔍 Debugging JavaScript visibility issue...');
  
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle0' });
    
    // Get the full text content of the page
    const bodyText = await page.evaluate(() => document.body.innerText);
    
    // Look for specific JavaScript patterns
    const jsPatterns = [
      /function\s*\(/g,
      /const\s+\w+\s*=/g,
      /let\s+\w+\s*=/g,
      /var\s+\w+\s*=/g,
      /import\s+.*from/g,
      /export\s+/g,
      /\{\s*"[^"]*":\s*function/g,
      /window\.\w+\s*=/g,
      /document\.\w+/g
    ];
    
    console.log('🔍 Searching for JavaScript patterns in visible text...');
    
    let foundJs = false;
    jsPatterns.forEach((pattern, index) => {
      const matches = bodyText.match(pattern);
      if (matches) {
        console.log(`❌ Pattern ${index + 1} found ${matches.length} times:`, pattern);
        console.log(`   Sample matches:`, matches.slice(0, 3));
        foundJs = true;
      }
    });
    
    // Get specific sections that might contain JavaScript
    const suspiciousElements = await page.evaluate(() => {
      const elements = [];
      
      // Check for script tags that might be visible
      const scripts = document.querySelectorAll('script');
      scripts.forEach((script, i) => {
        if (script.innerHTML && script.innerHTML.trim() && 
            getComputedStyle(script).display !== 'none') {
          elements.push(`Script ${i}: ${script.innerHTML.substring(0, 100)}...`);
        }
      });
      
      // Check for elements with suspicious text content
      const allElements = document.querySelectorAll('*');
      allElements.forEach(el => {
        const text = el.textContent || '';
        if ((text.includes('function(') || text.includes('const ') || 
             text.includes('import ')) && 
            text.length > 50 &&
            getComputedStyle(el).display !== 'none') {
          elements.push(`${el.tagName}: ${text.substring(0, 100)}...`);
        }
      });
      
      return elements;
    });
    
    if (suspiciousElements.length > 0) {
      console.log('❌ Found visible JavaScript content in:');
      suspiciousElements.forEach(elem => {
        console.log(`  - ${elem}`);
      });
    }
    
    // Check if there are any hydration issues
    const hydrationErrors = await page.evaluate(() => {
      const errors = [];
      const originalError = console.error;
      console.error = (...args) => {
        if (args.some(arg => String(arg).includes('hydrat'))) {
          errors.push(args.join(' '));
        }
        originalError.apply(console, args);
      };
      return errors;
    });
    
    console.log(`✅ Hydration errors found: ${hydrationErrors.length}`);
    
    // Take a screenshot for visual inspection
    await page.screenshot({ path: 'debug-homepage.png', fullPage: true });
    console.log('📸 Screenshot saved as debug-homepage.png');
    
    return { foundJs, suspiciousElements, hydrationErrors };
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    return { error: error.message };
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the debug
debugJavaScriptVisibility()
  .then(results => {
    if (results.error) {
      console.log(`❌ Debug failed: ${results.error}`);
    } else if (results.foundJs) {
      console.log('❌ CONFIRMED: Raw JavaScript is visible to users!');
      console.log('This is the critical issue that needs to be fixed before deployment.');
    } else {
      console.log('✅ No raw JavaScript found in visible content.');
    }
  })
  .catch(console.error);