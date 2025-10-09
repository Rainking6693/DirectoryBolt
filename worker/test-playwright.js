const playwright = require('playwright');

async function testPlaywright() {
  console.log('========================================');
  console.log('TESTING PLAYWRIGHT INSTALLATION');
  console.log('========================================');

  try {
    console.log('Step 1: Launching browser...');
    const browser = await playwright.chromium.launch({
      headless: false,
      slowMo: 500
    });
    console.log('✓ Browser launched successfully');

    console.log('Step 2: Creating new page...');
    const page = await browser.newPage();
    console.log('✓ Page created successfully');

    console.log('Step 3: Navigating to example.com...');
    await page.goto('https://example.com', { timeout: 30000 });
    console.log('✓ Navigation successful');

    console.log('Step 4: Taking screenshot...');
    await page.screenshot({ path: 'test-screenshot.png' });
    console.log('✓ Screenshot saved as test-screenshot.png');

    console.log('Step 5: Closing browser...');
    await browser.close();
    console.log('✓ Browser closed');

    console.log('');
    console.log('========================================');
    console.log('✓ PLAYWRIGHT IS WORKING CORRECTLY');
    console.log('========================================');
  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('✗ PLAYWRIGHT TEST FAILED');
    console.error('========================================');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('');
    console.error('TROUBLESHOOTING:');
    console.error('1. Run: npm --prefix ./worker install');
    console.error('2. Run: npx --prefix ./worker playwright install chromium');
    console.error('3. Check if antivirus is blocking the browser');
    process.exit(1);
  }
}

testPlaywright();
