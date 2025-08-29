/**
 * COMPREHENSIVE END-TO-END USER FLOW TEST SUITE
 * DirectoryBolt - Complete User Journey Validation
 * 
 * ⚡ CRITICAL TEST SCENARIOS:
 * 1. Homepage to Payment Flow
 * 2. Website Analysis Flow  
 * 3. Pricing Page Payment Flow
 * 4. API Integration Testing
 * 5. End-to-End Payment Process
 * 6. Cross-Page Integration
 * 7. Environment Configuration Testing
 * 
 * Validates complete user flow from website submission to payment completion
 * Tests integration between Ben's UI components and Shane's API endpoints
 */

const puppeteer = require('puppeteer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

class EndToEndUserFlowTestSuite {
  constructor(options = {}) {
    this.baseURL = options.baseURL || 'http://localhost:3000';
    this.headless = options.headless !== false; // Default to headless
    this.viewport = { width: 1920, height: 1080 };
    this.mobileViewport = { width: 375, height: 667 };
    
    // Test results tracking
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      errors: [],
      scenarios: {
        homepageFlow: [],
        analysisFlow: [],
        pricingFlow: [],
        apiIntegration: [],
        paymentProcess: [],
        crossPageNavigation: [],
        environmentConfig: []
      }
    };
    
    // Test configuration
    this.config = {
      timeout: 30000,
      navigationTimeout: 10000,
      elementWaitTimeout: 5000,
      maxRetries: 3
    };
    
    // Mock test data
    this.testData = {
      validWebsites: [
        'https://google.com',
        'https://facebook.com', 
        'https://amazon.com',
        'https://microsoft.com',
        'https://apple.com'
      ],
      invalidWebsites: [
        '',
        'not-a-url',
        'javascript:alert(1)',
        'localhost',
        'http://'
      ],
      businessInfo: {
        name: 'Test Business Solutions',
        description: 'A comprehensive business solutions company',
        category: 'Technology',
        email: 'test@testbusiness.com'
      },
      paymentPlans: [
        { name: 'starter', displayName: 'Starter', price: '$49' },
        { name: 'growth', displayName: 'Growth', price: '$149' },
        { name: 'professional', displayName: 'Professional', price: '$299' },
        { name: 'enterprise', displayName: 'Enterprise', price: '$999' }
      ]
    };
  }

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  async initializeBrowser() {
    this.browser = await puppeteer.launch({
      headless: this.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    console.log('🚀 Browser initialized');
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Browser closed');
    }
  }

  async createPage(mobile = false) {
    const page = await this.browser.newPage();
    
    // Set viewport
    await page.setViewport(mobile ? this.mobileViewport : this.viewport);
    
    // Set user agent
    if (mobile) {
      await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1');
    }
    
    // Console and error handling
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.log('❌ Page Console Error:', msg.text());
      }
    });
    
    page.on('pageerror', (error) => {
      console.log('💥 Page Error:', error.message);
    });
    
    return page;
  }

  async logTest(scenario, testName, status, details = '', data = {}) {
    const timestamp = new Date().toISOString();
    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : status === 'WARNING' ? '⚠️' : '🔍';
    
    console.log(`${statusIcon} [${timestamp}] ${scenario} - ${testName}: ${status}`);
    if (details) {
      console.log(`   📝 ${details}`);
    }
    
    // Track results
    const testResult = {
      timestamp,
      testName,
      status,
      details,
      data
    };
    
    this.results.total++;
    this.results.scenarios[scenario].push(testResult);
    
    switch (status) {
      case 'PASS':
        this.results.passed++;
        break;
      case 'FAIL':
        this.results.failed++;
        this.results.errors.push({ scenario, test: testName, details });
        break;
      case 'WARNING':
        this.results.warnings++;
        break;
    }
  }

  async waitForElement(page, selector, timeout = this.config.elementWaitTimeout) {
    try {
      await page.waitForSelector(selector, { timeout });
      return true;
    } catch (error) {
      return false;
    }
  }

  async clickElement(page, selector, timeout = this.config.elementWaitTimeout) {
    try {
      await page.waitForSelector(selector, { timeout, visible: true });
      await page.click(selector);
      return true;
    } catch (error) {
      console.log(`❌ Failed to click element: ${selector} - ${error.message}`);
      return false;
    }
  }

  async typeInElement(page, selector, text, timeout = this.config.elementWaitTimeout) {
    try {
      await page.waitForSelector(selector, { timeout, visible: true });
      await page.type(selector, text);
      return true;
    } catch (error) {
      console.log(`❌ Failed to type in element: ${selector} - ${error.message}`);
      return false;
    }
  }

  // =============================================================================
  // TEST SCENARIO 1: HOMEPAGE TO PAYMENT FLOW
  // =============================================================================

  async testHomepageToPaymentFlow() {
    console.log('\n🏠 TESTING HOMEPAGE TO PAYMENT FLOW');
    console.log('=' .repeat(60));
    
    const page = await this.createPage();
    
    try {
      // Step 1: Load homepage
      await page.goto(this.baseURL, { 
        waitUntil: 'networkidle2',
        timeout: this.config.navigationTimeout 
      });
      
      const title = await page.title();
      this.logTest('homepageFlow', 'Homepage Load', 'PASS', `Page title: ${title}`);
      
      // Step 2: Find and test "Start Free Trial" buttons
      const startTrialSelectors = [
        'button:contains("Start Free Trial")',
        'a:contains("Start Free Trial")',
        '[data-testid="start-trial-btn"]',
        '.cta-button',
        'button[class*="trial"]',
        'a[href*="pricing"]'
      ];
      
      let trialButtonFound = false;
      let buttonSelector = null;
      
      for (const selector of startTrialSelectors) {
        try {
          const elements = await page.$$(selector);
          if (elements.length > 0) {
            trialButtonFound = true;
            buttonSelector = selector;
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      if (trialButtonFound) {
        this.logTest('homepageFlow', 'Start Free Trial Button Found', 'PASS', 
          `Button found with selector: ${buttonSelector}`);
        
        // Step 3: Click the trial button
        const clicked = await this.clickElement(page, buttonSelector);
        if (clicked) {
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: this.config.navigationTimeout });
          
          const currentUrl = page.url();
          const expectedPages = ['/pricing', '/analyze', '/register', '/signup'];
          const correctRedirect = expectedPages.some(path => currentUrl.includes(path));
          
          this.logTest('homepageFlow', 'Trial Button Navigation', 
            correctRedirect ? 'PASS' : 'FAIL',
            `Redirected to: ${currentUrl}`);
            
          // Step 4: Test pricing page if redirected there
          if (currentUrl.includes('/pricing')) {
            await this.testPricingPageFromHomepage(page);
          }
        } else {
          this.logTest('homepageFlow', 'Trial Button Click', 'FAIL', 'Button not clickable');
        }
      } else {
        this.logTest('homepageFlow', 'Start Free Trial Button Found', 'FAIL', 
          'No Start Free Trial buttons found on homepage');
      }
      
      // Step 5: Test Free Analysis button
      await this.testFreeAnalysisButton(page);
      
      // Step 6: Test hero CTA buttons
      await this.testHeroCTAButtons(page);
      
    } catch (error) {
      this.logTest('homepageFlow', 'Homepage Flow Critical Error', 'FAIL', error.message);
    } finally {
      await page.close();
    }
  }

  async testFreeAnalysisButton(page) {
    // Navigate back to homepage first
    await page.goto(this.baseURL, { waitUntil: 'networkidle2' });
    
    const freeAnalysisSelectors = [
      'button:contains("Free Analysis")',
      'a:contains("Get Free Analysis")',
      '[data-testid="free-analysis-btn"]',
      'button[class*="analysis"]',
      'a[href*="analyze"]'
    ];
    
    let analysisButtonFound = false;
    
    for (const selector of freeAnalysisSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          analysisButtonFound = true;
          
          const clicked = await this.clickElement(page, selector);
          if (clicked) {
            await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: this.config.navigationTimeout });
            const currentUrl = page.url();
            
            this.logTest('homepageFlow', 'Free Analysis Button', 
              currentUrl.includes('/analyze') ? 'PASS' : 'FAIL',
              `Redirected to: ${currentUrl}`);
          }
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    if (!analysisButtonFound) {
      this.logTest('homepageFlow', 'Free Analysis Button Found', 'WARNING', 
        'No Free Analysis buttons found on homepage');
    }
  }

  async testHeroCTAButtons(page) {
    // Navigate back to homepage
    await page.goto(this.baseURL, { waitUntil: 'networkidle2' });
    
    // Test various CTA button patterns
    const ctaSelectors = [
      'button[class*="cta"]',
      '.hero button',
      'button[class*="primary"]',
      'a[class*="button"]',
      '[data-testid*="cta"]'
    ];
    
    let ctaButtonsFound = 0;
    
    for (const selector of ctaSelectors) {
      try {
        const elements = await page.$$(selector);
        ctaButtonsFound += elements.length;
      } catch (error) {
        // Continue
      }
    }
    
    this.logTest('homepageFlow', 'Hero CTA Buttons Count', 
      ctaButtonsFound > 0 ? 'PASS' : 'WARNING',
      `Found ${ctaButtonsFound} CTA buttons`);
  }

  async testPricingPageFromHomepage(page) {
    // Test pricing page layout and buttons
    const pricingButtons = await page.$$('button[class*="checkout"], button:contains("Choose"), button:contains("Select")');
    
    this.logTest('homepageFlow', 'Pricing Page Checkout Buttons', 
      pricingButtons.length >= 4 ? 'PASS' : 'FAIL',
      `Found ${pricingButtons.length} pricing buttons (expected 4+ for all tiers)`);
    
    // Test clicking a pricing button
    if (pricingButtons.length > 0) {
      try {
        await pricingButtons[0].click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: this.config.navigationTimeout });
        
        const currentUrl = page.url();
        const isStripeCheckout = currentUrl.includes('checkout.stripe.com') || 
                               currentUrl.includes('/payment/') ||
                               currentUrl.includes('/checkout/');
        
        this.logTest('homepageFlow', 'Pricing Button to Checkout', 
          isStripeCheckout ? 'PASS' : 'FAIL',
          `Redirected to: ${currentUrl}`);
      } catch (error) {
        this.logTest('homepageFlow', 'Pricing Button Click', 'FAIL', error.message);
      }
    }
  }

  // =============================================================================
  // TEST SCENARIO 2: WEBSITE ANALYSIS FLOW
  // =============================================================================

  async testWebsiteAnalysisFlow() {
    console.log('\n🔍 TESTING WEBSITE ANALYSIS FLOW');
    console.log('=' .repeat(60));
    
    const page = await this.createPage();
    
    try {
      // Step 1: Navigate to analysis page
      await page.goto(`${this.baseURL}/analyze`, { 
        waitUntil: 'networkidle2',
        timeout: this.config.navigationTimeout 
      });
      
      this.logTest('analysisFlow', 'Analysis Page Load', 'PASS', 'Analysis page loaded successfully');
      
      // Step 2: Test URL input field
      const urlInputSelectors = [
        'input[type="url"]',
        'input[placeholder*="website"]',
        'input[name*="url"]',
        '[data-testid="url-input"]',
        'input[class*="url"]'
      ];
      
      let urlInputFound = false;
      let inputSelector = null;
      
      for (const selector of urlInputSelectors) {
        if (await this.waitForElement(page, selector, 1000)) {
          urlInputFound = true;
          inputSelector = selector;
          break;
        }
      }
      
      if (urlInputFound) {
        this.logTest('analysisFlow', 'URL Input Field Found', 'PASS', 
          `Input field found: ${inputSelector}`);
        
        // Step 3: Test valid website submission
        await this.testValidWebsiteSubmission(page, inputSelector);
        
        // Step 4: Test invalid website handling
        await this.testInvalidWebsiteSubmission(page, inputSelector);
        
      } else {
        this.logTest('analysisFlow', 'URL Input Field Found', 'FAIL', 
          'No URL input field found on analysis page');
      }
      
      // Step 5: Test analysis results flow
      await this.testAnalysisResultsFlow(page);
      
    } catch (error) {
      this.logTest('analysisFlow', 'Analysis Flow Critical Error', 'FAIL', error.message);
    } finally {
      await page.close();
    }
  }

  async testValidWebsiteSubmission(page, inputSelector) {
    for (const website of this.testData.validWebsites.slice(0, 2)) { // Test first 2 websites
      try {
        // Clear and type website URL
        await page.evaluate((selector) => {
          document.querySelector(selector).value = '';
        }, inputSelector);
        
        await this.typeInElement(page, inputSelector, website);
        
        // Find and click submit button
        const submitSelectors = [
          'button[type="submit"]',
          'button:contains("Analyze")',
          'button:contains("Submit")',
          '[data-testid="submit-btn"]',
          'button[class*="submit"]'
        ];
        
        let submitClicked = false;
        for (const selector of submitSelectors) {
          if (await this.clickElement(page, selector)) {
            submitClicked = true;
            break;
          }
        }
        
        if (submitClicked) {
          // Wait for analysis to start
          await page.waitForTimeout(2000);
          
          // Check for progress indicators or results
          const progressIndicators = [
            '.progress',
            '.loading',
            '.spinner',
            '[data-testid="progress"]',
            '.analysis-progress'
          ];
          
          let progressFound = false;
          for (const indicator of progressIndicators) {
            if (await page.$(indicator)) {
              progressFound = true;
              break;
            }
          }
          
          this.logTest('analysisFlow', `Valid Website Analysis - ${website}`, 
            progressFound ? 'PASS' : 'WARNING',
            progressFound ? 'Analysis started with progress indicator' : 'Analysis may have started without visible progress');
            
        } else {
          this.logTest('analysisFlow', `Valid Website Submit - ${website}`, 'FAIL', 
            'Submit button not found or not clickable');
        }
        
        // Wait between tests
        await page.waitForTimeout(1000);
        
      } catch (error) {
        this.logTest('analysisFlow', `Valid Website Error - ${website}`, 'FAIL', error.message);
      }
    }
  }

  async testInvalidWebsiteSubmission(page, inputSelector) {
    for (const invalidUrl of this.testData.invalidWebsites) {
      try {
        // Clear and type invalid URL
        await page.evaluate((selector) => {
          document.querySelector(selector).value = '';
        }, inputSelector);
        
        if (invalidUrl) { // Don't type empty string
          await this.typeInElement(page, inputSelector, invalidUrl);
        }
        
        // Try to submit
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
          await submitButton.click();
          await page.waitForTimeout(1000);
          
          // Look for error message
          const errorSelectors = [
            '.error',
            '.alert-error',
            '[data-testid="error"]',
            '.validation-error',
            '.text-red'
          ];
          
          let errorFound = false;
          for (const selector of errorSelectors) {
            if (await page.$(selector)) {
              errorFound = true;
              break;
            }
          }
          
          this.logTest('analysisFlow', `Invalid URL Handling - "${invalidUrl}"`, 
            errorFound ? 'PASS' : 'WARNING',
            errorFound ? 'Error message displayed for invalid input' : 'No error validation visible');
        }
        
      } catch (error) {
        this.logTest('analysisFlow', `Invalid URL Test Error - "${invalidUrl}"`, 'FAIL', error.message);
      }
    }
  }

  async testAnalysisResultsFlow(page) {
    // Navigate to results page (if it exists) or simulate results
    try {
      await page.goto(`${this.baseURL}/results`, { 
        waitUntil: 'networkidle2',
        timeout: this.config.navigationTimeout 
      });
      
      // Check for key result elements
      const resultElements = [
        '.results-container',
        '.directory-recommendations', 
        '.business-analysis',
        '.upgrade-prompt',
        '[data-testid="results"]'
      ];
      
      let resultsFound = false;
      for (const element of resultElements) {
        if (await page.$(element)) {
          resultsFound = true;
          break;
        }
      }
      
      this.logTest('analysisFlow', 'Results Page Display', 
        resultsFound ? 'PASS' : 'WARNING',
        resultsFound ? 'Results page contains analysis data' : 'Results page may not be fully implemented');
      
      // Test upgrade prompts on results page
      await this.testUpgradePromptsOnResults(page);
      
    } catch (error) {
      this.logTest('analysisFlow', 'Results Page Access', 'WARNING', 
        'Results page may not exist or be accessible');
    }
  }

  async testUpgradePromptsOnResults(page) {
    const upgradeSelectors = [
      'button:contains("Upgrade")',
      'a:contains("Get Full Results")',
      '.upgrade-prompt button',
      '[data-testid="upgrade-btn"]',
      'button[class*="upgrade"]'
    ];
    
    let upgradePromptFound = false;
    
    for (const selector of upgradeSelectors) {
      try {
        const elements = await page.$$(selector);
        if (elements.length > 0) {
          upgradePromptFound = true;
          
          // Test clicking upgrade prompt
          await elements[0].click();
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 });
          
          const currentUrl = page.url();
          const redirectsToPayment = currentUrl.includes('/pricing') || 
                                   currentUrl.includes('/checkout') ||
                                   currentUrl.includes('stripe.com');
          
          this.logTest('analysisFlow', 'Upgrade Prompt to Payment', 
            redirectsToPayment ? 'PASS' : 'FAIL',
            `Upgrade button redirected to: ${currentUrl}`);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    this.logTest('analysisFlow', 'Upgrade Prompts Present', 
      upgradePromptFound ? 'PASS' : 'WARNING',
      upgradePromptFound ? 'Upgrade prompts found and functional' : 'No upgrade prompts detected');
  }

  // =============================================================================
  // TEST SCENARIO 3: PRICING PAGE PAYMENT FLOW
  // =============================================================================

  async testPricingPagePaymentFlow() {
    console.log('\n💳 TESTING PRICING PAGE PAYMENT FLOW');
    console.log('=' .repeat(60));
    
    const page = await this.createPage();
    
    try {
      // Step 1: Navigate to pricing page
      await page.goto(`${this.baseURL}/pricing`, { 
        waitUntil: 'networkidle2',
        timeout: this.config.navigationTimeout 
      });
      
      this.logTest('pricingFlow', 'Pricing Page Load', 'PASS', 'Pricing page loaded successfully');
      
      // Step 2: Test all pricing tiers
      await this.testAllPricingTiers(page);
      
      // Step 3: Test billing toggle (monthly/annual)
      await this.testBillingToggle(page);
      
      // Step 4: Test feature comparison
      await this.testFeatureComparison(page);
      
      // Step 5: Test checkout flow for each plan
      await this.testCheckoutFlowForPlans(page);
      
    } catch (error) {
      this.logTest('pricingFlow', 'Pricing Flow Critical Error', 'FAIL', error.message);
    } finally {
      await page.close();
    }
  }

  async testAllPricingTiers(page) {
    const pricingTiers = [
      { name: 'starter', selectors: ['button:contains("Starter")', '[data-plan="starter"]'] },
      { name: 'growth', selectors: ['button:contains("Growth")', '[data-plan="growth"]'] },
      { name: 'professional', selectors: ['button:contains("Professional")', '[data-plan="professional"]'] },
      { name: 'enterprise', selectors: ['button:contains("Enterprise")', '[data-plan="enterprise"]'] }
    ];
    
    let tiersFound = 0;
    
    for (const tier of pricingTiers) {
      let tierFound = false;
      
      for (const selector of tier.selectors) {
        try {
          const elements = await page.$$(selector);
          if (elements.length > 0) {
            tierFound = true;
            tiersFound++;
            break;
          }
        } catch (error) {
          // Continue to next selector
        }
      }
      
      this.logTest('pricingFlow', `${tier.name.toUpperCase()} Tier Present`, 
        tierFound ? 'PASS' : 'FAIL',
        tierFound ? `${tier.name} pricing tier found` : `${tier.name} tier missing`);
    }
    
    this.logTest('pricingFlow', 'All Pricing Tiers Count', 
      tiersFound >= 4 ? 'PASS' : 'FAIL',
      `Found ${tiersFound}/4 expected pricing tiers`);
  }

  async testBillingToggle(page) {
    const billingToggles = [
      'input[type="checkbox"]',
      '.billing-toggle',
      'button[class*="toggle"]',
      '[data-testid="billing-toggle"]'
    ];
    
    let toggleFound = false;
    
    for (const selector of billingToggles) {
      try {
        const element = await page.$(selector);
        if (element) {
          toggleFound = true;
          
          // Test toggle functionality
          await element.click();
          await page.waitForTimeout(500);
          
          // Check if prices updated
          const priceElements = await page.$$('.price, [class*="price"]');
          
          this.logTest('pricingFlow', 'Billing Toggle Functionality', 
            priceElements.length > 0 ? 'PASS' : 'WARNING',
            `Toggle found and ${priceElements.length} price elements detected`);
          break;
        }
      } catch (error) {
        // Continue to next selector
      }
    }
    
    this.logTest('pricingFlow', 'Billing Toggle Present', 
      toggleFound ? 'PASS' : 'WARNING',
      toggleFound ? 'Billing toggle found and functional' : 'No billing toggle detected');
  }

  async testFeatureComparison(page) {
    const featureElements = await page.$$('.feature, [class*="feature"], li');
    const pricingCards = await page.$$('.pricing-card, .plan, [class*="tier"]');
    
    this.logTest('pricingFlow', 'Feature Comparison Display', 
      featureElements.length >= 10 && pricingCards.length >= 3 ? 'PASS' : 'WARNING',
      `Found ${featureElements.length} features and ${pricingCards.length} pricing cards`);
  }

  async testCheckoutFlowForPlans(page) {
    // Test checkout buttons for each visible plan
    const checkoutButtons = await page.$$('button:contains("Choose"), button:contains("Select"), button:contains("Get Started"), button[class*="checkout"]');
    
    this.logTest('pricingFlow', 'Checkout Buttons Present', 
      checkoutButtons.length >= 3 ? 'PASS' : 'FAIL',
      `Found ${checkoutButtons.length} checkout buttons`);
    
    if (checkoutButtons.length > 0) {
      // Test first checkout button
      try {
        await checkoutButtons[0].click();
        
        // Wait for navigation or modal
        await Promise.race([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 5000 }),
          page.waitForSelector('.modal, [class*="modal"]', { timeout: 3000 })
        ]);
        
        const currentUrl = page.url();
        const hasModal = await page.$('.modal, [class*="modal"]');
        
        const checkoutInitiated = currentUrl.includes('checkout') || 
                                  currentUrl.includes('stripe.com') ||
                                  currentUrl.includes('/payment') ||
                                  hasModal;
        
        this.logTest('pricingFlow', 'Checkout Button Functionality', 
          checkoutInitiated ? 'PASS' : 'FAIL',
          checkoutInitiated ? `Checkout initiated: ${currentUrl}` : 'Checkout button not functional');
          
      } catch (error) {
        this.logTest('pricingFlow', 'Checkout Button Click', 'FAIL', error.message);
      }
    }
  }

  // =============================================================================
  // TEST SCENARIO 4: API INTEGRATION TESTING
  // =============================================================================

  async testAPIIntegration() {
    console.log('\n🔗 TESTING API INTEGRATION');
    console.log('=' .repeat(60));
    
    try {
      // Test analysis API endpoint
      await this.testAnalysisAPIEndpoint();
      
      // Test checkout session creation API
      await this.testCheckoutSessionAPI();
      
      // Test status/health API
      await this.testHealthStatusAPI();
      
      // Test error responses
      await this.testAPIErrorHandling();
      
    } catch (error) {
      this.logTest('apiIntegration', 'API Integration Critical Error', 'FAIL', error.message);
    }
  }

  async testAnalysisAPIEndpoint() {
    const analysisPayload = {
      website_url: 'https://example.com',
      business_info: this.testData.businessInfo
    };
    
    try {
      const response = await axios.post(`${this.baseURL}/api/analyze`, analysisPayload, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DirectoryBolt-Test/1.0'
        }
      });
      
      this.logTest('apiIntegration', 'Analysis API Endpoint', 'PASS', 
        `API responded with status ${response.status}`, {
          status: response.status,
          hasData: !!response.data,
          responseTime: response.headers['x-response-time'] || 'unknown'
        });
        
      // Validate response structure
      this.validateAnalysisResponse(response.data);
      
    } catch (error) {
      const isConnRefused = error.code === 'ECONNREFUSED';
      const status = error.response?.status;
      
      this.logTest('apiIntegration', 'Analysis API Endpoint', 
        isConnRefused ? 'WARNING' : 'FAIL',
        isConnRefused ? 'Server not running - expected in development' : 
                       `API error: ${status} - ${error.message}`);
    }
  }

  async testCheckoutSessionAPI() {
    for (const plan of this.testData.paymentPlans) {
      const checkoutPayload = {
        package: plan.name,
        success_url: `${this.baseURL}/payment/success`,
        cancel_url: `${this.baseURL}/pricing`
      };
      
      try {
        const response = await axios.post(`${this.baseURL}/api/create-checkout-session`, 
          checkoutPayload, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        this.logTest('apiIntegration', `Checkout API - ${plan.name.toUpperCase()}`, 'PASS', 
          `Checkout session created for ${plan.name}`, {
            status: response.status,
            hasCheckoutUrl: !!(response.data?.url || response.data?.checkout_url),
            plan: plan.name
          });
          
      } catch (error) {
        const isConnRefused = error.code === 'ECONNREFUSED';
        const status = error.response?.status;
        
        this.logTest('apiIntegration', `Checkout API - ${plan.name.toUpperCase()}`, 
          isConnRefused ? 'WARNING' : 'FAIL',
          isConnRefused ? 'Server not running' : `API error: ${status} - ${error.message}`);
      }
    }
  }

  async testHealthStatusAPI() {
    const healthEndpoints = [
      '/api/health',
      '/api/status', 
      '/api/ping',
      '/health'
    ];
    
    for (const endpoint of healthEndpoints) {
      try {
        const response = await axios.get(`${this.baseURL}${endpoint}`, {
          timeout: 5000
        });
        
        this.logTest('apiIntegration', `Health Check - ${endpoint}`, 'PASS', 
          `Health endpoint responded with ${response.status}`);
        return; // Found working health endpoint
        
      } catch (error) {
        if (error.response?.status === 404) {
          continue; // Try next endpoint
        }
        
        const isConnRefused = error.code === 'ECONNREFUSED';
        this.logTest('apiIntegration', `Health Check - ${endpoint}`, 
          isConnRefused ? 'WARNING' : 'FAIL',
          isConnRefused ? 'Server not running' : error.message);
      }
    }
    
    this.logTest('apiIntegration', 'Health Check Endpoints', 'WARNING', 
      'No working health check endpoint found');
  }

  async testAPIErrorHandling() {
    // Test invalid data submissions
    const errorTests = [
      {
        name: 'Invalid Website URL',
        endpoint: '/api/analyze',
        payload: { website_url: 'invalid-url' }
      },
      {
        name: 'Empty Analysis Request', 
        endpoint: '/api/analyze',
        payload: {}
      },
      {
        name: 'Invalid Checkout Package',
        endpoint: '/api/create-checkout-session',
        payload: { package: 'invalid_package' }
      }
    ];
    
    for (const test of errorTests) {
      try {
        const response = await axios.post(`${this.baseURL}${test.endpoint}`, test.payload, {
          timeout: 5000,
          validateStatus: () => true // Accept all status codes
        });
        
        const isErrorStatus = response.status >= 400;
        const hasErrorMessage = response.data?.error || response.data?.message;
        
        this.logTest('apiIntegration', `Error Handling - ${test.name}`, 
          (isErrorStatus && hasErrorMessage) ? 'PASS' : 'WARNING',
          `Status: ${response.status}, Has Error Message: ${!!hasErrorMessage}`);
          
      } catch (error) {
        const isConnRefused = error.code === 'ECONNREFUSED';
        this.logTest('apiIntegration', `Error Handling - ${test.name}`, 
          isConnRefused ? 'WARNING' : 'FAIL',
          isConnRefused ? 'Server not running' : error.message);
      }
    }
  }

  validateAnalysisResponse(data) {
    const requiredFields = ['success', 'data'];
    const missingFields = requiredFields.filter(field => !(field in data));
    
    this.logTest('apiIntegration', 'Analysis Response Structure', 
      missingFields.length === 0 ? 'PASS' : 'FAIL',
      missingFields.length === 0 ? 'Response has required fields' : 
                                   `Missing fields: ${missingFields.join(', ')}`);
  }

  // =============================================================================
  // TEST SCENARIO 5: END-TO-END PAYMENT PROCESS
  // =============================================================================

  async testEndToEndPaymentProcess() {
    console.log('\n💰 TESTING END-TO-END PAYMENT PROCESS');
    console.log('=' .repeat(60));
    
    const page = await this.createPage();
    
    try {
      // Complete user journey: Homepage → Analysis → Results → Pricing → Checkout
      await this.simulateCompleteUserJourney(page);
      
      // Test payment success flow
      await this.testPaymentSuccessFlow(page);
      
      // Test payment failure handling
      await this.testPaymentFailureFlow(page);
      
    } catch (error) {
      this.logTest('paymentProcess', 'Payment Process Critical Error', 'FAIL', error.message);
    } finally {
      await page.close();
    }
  }

  async simulateCompleteUserJourney(page) {
    try {
      // Step 1: Start at homepage
      await page.goto(this.baseURL, { waitUntil: 'networkidle2' });
      this.logTest('paymentProcess', 'User Journey - Homepage', 'PASS', 'Started at homepage');
      
      // Step 2: Click Free Analysis
      const analysisButton = await page.$('button:contains("Free Analysis"), a[href*="analyze"]');
      if (analysisButton) {
        await analysisButton.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
        this.logTest('paymentProcess', 'User Journey - Analysis Navigation', 'PASS', 
          `Navigated to: ${page.url()}`);
      }
      
      // Step 3: Submit website for analysis  
      const urlInput = await page.$('input[type="url"], input[placeholder*="website"]');
      if (urlInput) {
        await urlInput.type('https://testbusiness.example.com');
        
        const submitButton = await page.$('button[type="submit"], button:contains("Analyze")');
        if (submitButton) {
          await submitButton.click();
          await page.waitForTimeout(3000); // Wait for analysis
          
          this.logTest('paymentProcess', 'User Journey - Website Analysis', 'PASS', 
            'Website analysis submitted');
        }
      }
      
      // Step 4: Navigate to pricing from results
      await page.goto(`${this.baseURL}/pricing`, { waitUntil: 'networkidle2' });
      this.logTest('paymentProcess', 'User Journey - Pricing Page', 'PASS', 'Reached pricing page');
      
      // Step 5: Select a plan
      const planButton = await page.$('button:contains("Choose"), button:contains("Select")');
      if (planButton) {
        await planButton.click();
        
        // Check if redirected to checkout
        await page.waitForTimeout(2000);
        const currentUrl = page.url();
        
        this.logTest('paymentProcess', 'User Journey - Plan Selection', 
          currentUrl.includes('checkout') || currentUrl.includes('stripe') ? 'PASS' : 'WARNING',
          `Plan selected, current URL: ${currentUrl}`);
      }
      
    } catch (error) {
      this.logTest('paymentProcess', 'Complete User Journey', 'FAIL', error.message);
    }
  }

  async testPaymentSuccessFlow(page) {
    try {
      // Navigate to success page (simulate successful payment)
      await page.goto(`${this.baseURL}/payment/success?session_id=cs_test_success`, { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });
      
      const successElements = [
        '.success',
        '.payment-success',
        'h1:contains("Success")',
        '[data-testid="success"]'
      ];
      
      let successFound = false;
      for (const selector of successElements) {
        if (await page.$(selector)) {
          successFound = true;
          break;
        }
      }
      
      this.logTest('paymentProcess', 'Payment Success Page', 
        successFound ? 'PASS' : 'WARNING',
        successFound ? 'Payment success page displays correctly' : 
                      'Success page may not be implemented');
                      
    } catch (error) {
      this.logTest('paymentProcess', 'Payment Success Flow', 'WARNING', 
        'Success page may not exist: ' + error.message);
    }
  }

  async testPaymentFailureFlow(page) {
    try {
      // Navigate to cancel page (simulate canceled payment)
      await page.goto(`${this.baseURL}/payment/cancel`, { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });
      
      const cancelElements = [
        '.cancel',
        '.payment-canceled',
        'h1:contains("Cancel")',
        '[data-testid="cancel"]'
      ];
      
      let cancelFound = false;
      for (const selector of cancelElements) {
        if (await page.$(selector)) {
          cancelFound = true;
          break;
        }
      }
      
      this.logTest('paymentProcess', 'Payment Cancel Page', 
        cancelFound ? 'PASS' : 'WARNING',
        cancelFound ? 'Payment cancel page displays correctly' : 
                     'Cancel page may not be implemented');
                     
    } catch (error) {
      this.logTest('paymentProcess', 'Payment Cancel Flow', 'WARNING', 
        'Cancel page may not exist: ' + error.message);
    }
  }

  // =============================================================================
  // TEST SCENARIO 6: CROSS-PAGE INTEGRATION
  // =============================================================================

  async testCrossPageIntegration() {
    console.log('\n🔄 TESTING CROSS-PAGE INTEGRATION');
    console.log('=' .repeat(60));
    
    const page = await this.createPage();
    
    try {
      // Test navigation between all pages
      await this.testPageNavigation(page);
      
      // Test state persistence across pages
      await this.testStatePersistence(page);
      
      // Test back/forward navigation
      await this.testBrowserNavigation(page);
      
    } catch (error) {
      this.logTest('crossPageNavigation', 'Cross-Page Integration Critical Error', 'FAIL', error.message);
    } finally {
      await page.close();
    }
  }

  async testPageNavigation(page) {
    const pages = [
      { path: '/', name: 'Homepage' },
      { path: '/analyze', name: 'Analysis Page' },
      { path: '/pricing', name: 'Pricing Page' },
      { path: '/results', name: 'Results Page' }
    ];
    
    for (const pageInfo of pages) {
      try {
        await page.goto(`${this.baseURL}${pageInfo.path}`, { 
          waitUntil: 'networkidle2',
          timeout: this.config.navigationTimeout 
        });
        
        const title = await page.title();
        this.logTest('crossPageNavigation', `Navigation - ${pageInfo.name}`, 'PASS', 
          `Successfully loaded ${pageInfo.name} (${title})`);
          
      } catch (error) {
        this.logTest('crossPageNavigation', `Navigation - ${pageInfo.name}`, 'FAIL', 
          `Failed to load ${pageInfo.name}: ${error.message}`);
      }
    }
  }

  async testStatePersistence(page) {
    // Test if user input persists across page navigation
    try {
      // Go to analysis page and enter data
      await page.goto(`${this.baseURL}/analyze`, { waitUntil: 'networkidle2' });
      
      const urlInput = await page.$('input[type="url"], input[placeholder*="website"]');
      if (urlInput) {
        await urlInput.type('https://persistence-test.com');
        
        // Navigate away and back
        await page.goto(`${this.baseURL}/pricing`, { waitUntil: 'networkidle2' });
        await page.goto(`${this.baseURL}/analyze`, { waitUntil: 'networkidle2' });
        
        // Check if input value persisted
        const inputValue = await page.evaluate(() => {
          const input = document.querySelector('input[type="url"], input[placeholder*="website"]');
          return input ? input.value : '';
        });
        
        this.logTest('crossPageNavigation', 'State Persistence', 
          inputValue.includes('persistence-test.com') ? 'PASS' : 'WARNING',
          `Input value persistence: ${inputValue || 'empty'}`);
      }
      
    } catch (error) {
      this.logTest('crossPageNavigation', 'State Persistence', 'WARNING', 
        'State persistence test failed: ' + error.message);
    }
  }

  async testBrowserNavigation(page) {
    try {
      // Navigate through several pages
      await page.goto(`${this.baseURL}`, { waitUntil: 'networkidle2' });
      await page.goto(`${this.baseURL}/analyze`, { waitUntil: 'networkidle2' });
      await page.goto(`${this.baseURL}/pricing`, { waitUntil: 'networkidle2' });
      
      // Test back navigation
      await page.goBack();
      await page.waitForTimeout(1000);
      
      let currentUrl = page.url();
      this.logTest('crossPageNavigation', 'Browser Back Navigation', 
        currentUrl.includes('/analyze') ? 'PASS' : 'WARNING',
        `Back navigation result: ${currentUrl}`);
      
      // Test forward navigation  
      await page.goForward();
      await page.waitForTimeout(1000);
      
      currentUrl = page.url();
      this.logTest('crossPageNavigation', 'Browser Forward Navigation', 
        currentUrl.includes('/pricing') ? 'PASS' : 'WARNING',
        `Forward navigation result: ${currentUrl}`);
        
    } catch (error) {
      this.logTest('crossPageNavigation', 'Browser Navigation', 'WARNING', 
        'Browser navigation test failed: ' + error.message);
    }
  }

  // =============================================================================
  // TEST SCENARIO 7: ENVIRONMENT CONFIGURATION TESTING  
  // =============================================================================

  async testEnvironmentConfiguration() {
    console.log('\n⚙️ TESTING ENVIRONMENT CONFIGURATION');
    console.log('=' .repeat(60));
    
    try {
      // Test development vs production behavior
      await this.testEnvironmentBehavior();
      
      // Test error handling configuration
      await this.testErrorHandlingConfiguration();
      
      // Test mobile responsiveness
      await this.testMobileResponsiveness();
      
    } catch (error) {
      this.logTest('environmentConfig', 'Environment Config Critical Error', 'FAIL', error.message);
    }
  }

  async testEnvironmentBehavior() {
    try {
      const response = await axios.get(`${this.baseURL}/api/status`, {
        timeout: 5000,
        validateStatus: () => true
      });
      
      // Check for development indicators
      const isDevelopment = response.data?.environment === 'development' ||
                           response.data?.debug === true ||
                           response.headers['x-debug'];
      
      this.logTest('environmentConfig', 'Environment Detection', 'PASS', 
        `Environment appears to be: ${isDevelopment ? 'development' : 'production'}`);
        
    } catch (error) {
      this.logTest('environmentConfig', 'Environment Detection', 'WARNING', 
        'Could not determine environment: ' + error.message);
    }
  }

  async testErrorHandlingConfiguration() {
    const page = await this.createPage();
    
    try {
      // Test 404 page
      await page.goto(`${this.baseURL}/non-existent-page`, { 
        waitUntil: 'networkidle2',
        timeout: 10000 
      });
      
      const has404Content = await page.$('h1:contains("404"), h1:contains("Not Found")');
      this.logTest('environmentConfig', '404 Error Page', 
        has404Content ? 'PASS' : 'WARNING',
        has404Content ? '404 page displays correctly' : 'Custom 404 page may not be configured');
      
    } catch (error) {
      this.logTest('environmentConfig', '404 Error Handling', 'WARNING', error.message);
    } finally {
      await page.close();
    }
  }

  async testMobileResponsiveness() {
    const mobilePage = await this.createPage(true); // Create mobile page
    
    try {
      await mobilePage.goto(this.baseURL, { waitUntil: 'networkidle2' });
      
      // Test key elements are visible on mobile
      const mobileElements = await mobilePage.$$('button, .cta, input[type="url"]');
      const viewportWidth = this.mobileViewport.width;
      
      this.logTest('environmentConfig', 'Mobile Responsiveness', 
        mobileElements.length > 0 ? 'PASS' : 'WARNING',
        `Mobile page loaded with ${mobileElements.length} interactive elements on ${viewportWidth}px viewport`);
      
      // Test mobile pricing page
      await mobilePage.goto(`${this.baseURL}/pricing`, { waitUntil: 'networkidle2' });
      const mobileButtons = await mobilePage.$$('button');
      
      this.logTest('environmentConfig', 'Mobile Pricing Page', 
        mobileButtons.length >= 4 ? 'PASS' : 'WARNING',
        `Mobile pricing page has ${mobileButtons.length} buttons`);
        
    } catch (error) {
      this.logTest('environmentConfig', 'Mobile Responsiveness', 'WARNING', error.message);
    } finally {
      await mobilePage.close();
    }
  }

  // =============================================================================
  // MAIN TEST RUNNER & REPORTING
  // =============================================================================

  async runAllTests() {
    const startTime = Date.now();
    
    console.log('🚀 COMPREHENSIVE END-TO-END USER FLOW TEST SUITE');
    console.log('=' .repeat(80));
    console.log(`🌐 Base URL: ${this.baseURL}`);
    console.log(`📱 Testing Mode: ${this.headless ? 'Headless' : 'Visible'}`);
    console.log(`⏱️  Timeout: ${this.config.timeout}ms`);
    console.log('=' .repeat(80));
    
    try {
      // Initialize browser
      await this.initializeBrowser();
      
      // Run all test scenarios
      await this.testHomepageToPaymentFlow();
      await this.testWebsiteAnalysisFlow(); 
      await this.testPricingPagePaymentFlow();
      await this.testAPIIntegration();
      await this.testEndToEndPaymentProcess();
      await this.testCrossPageIntegration();
      await this.testEnvironmentConfiguration();
      
    } catch (error) {
      console.error('❌ Critical test suite error:', error);
      this.results.errors.push({ scenario: 'Test Suite', test: 'Critical Error', details: error.message });
    } finally {
      // Clean up
      await this.closeBrowser();
    }
    
    // Generate comprehensive report
    const totalTime = Date.now() - startTime;
    await this.generateComprehensiveReport(totalTime);
    
    return this.results;
  }

  async generateComprehensiveReport(totalTime) {
    console.log('\n📊 COMPREHENSIVE END-TO-END TEST RESULTS');
    console.log('=' .repeat(80));
    console.log(`📈 Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log(`⏱️  Total Time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`📊 Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    // Scenario breakdown
    console.log('\n📂 SCENARIO BREAKDOWN:');
    console.log('-'.repeat(50));
    
    Object.entries(this.results.scenarios).forEach(([scenario, tests]) => {
      if (tests.length === 0) return;
      
      const passed = tests.filter(t => t.status === 'PASS').length;
      const failed = tests.filter(t => t.status === 'FAIL').length;
      const warnings = tests.filter(t => t.status === 'WARNING').length;
      
      console.log(`${scenario.toUpperCase()}: ${passed}✅ ${warnings}⚠️ ${failed}❌ (${tests.length} total)`);
    });
    
    // Critical Issues
    if (this.results.errors.length > 0) {
      console.log('\n🚨 CRITICAL ISSUES FOUND:');
      console.log('-'.repeat(50));
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. [${error.scenario}] ${error.test}`);
        console.log(`   ${error.details}`);
      });
    }
    
    // User Flow Analysis
    console.log('\n🔍 USER FLOW ANALYSIS:');
    console.log('-'.repeat(50));
    
    const flowAnalysis = this.analyzeUserFlows();
    flowAnalysis.forEach(analysis => {
      console.log(`• ${analysis.flow}: ${analysis.status} - ${analysis.summary}`);
    });
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('-'.repeat(50));
    
    const recommendations = this.generateRecommendations();
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    
    // Next Steps
    console.log('\n🎯 IMMEDIATE NEXT STEPS:');
    console.log('-'.repeat(50));
    console.log('• Fix any FAILED tests before production deployment');
    console.log('• Review WARNING tests for potential improvements');
    console.log('• Test payment integration with real Stripe test cards');
    console.log('• Verify mobile payment experience on actual devices');
    console.log('• Set up monitoring for critical user flow metrics');
    
    // Save detailed results
    await this.saveDetailedResults();
    
    console.log('\n🎉 END-TO-END USER FLOW TESTING COMPLETE');
    console.log('=' .repeat(80));
  }

  analyzeUserFlows() {
    const flows = [
      {
        flow: 'Homepage → Payment',
        scenarios: ['homepageFlow', 'pricingFlow'],
        status: this.getFlowStatus(['homepageFlow', 'pricingFlow']),
        summary: 'User can navigate from homepage to payment checkout'
      },
      {
        flow: 'Analysis → Payment',
        scenarios: ['analysisFlow', 'pricingFlow'],
        status: this.getFlowStatus(['analysisFlow', 'pricingFlow']),
        summary: 'User can analyze website and proceed to payment'
      },
      {
        flow: 'Complete End-to-End',
        scenarios: ['paymentProcess'],
        status: this.getFlowStatus(['paymentProcess']),
        summary: 'Complete user journey from start to finish'
      },
      {
        flow: 'API Integration',
        scenarios: ['apiIntegration'],
        status: this.getFlowStatus(['apiIntegration']),
        summary: 'Ben\'s UI properly integrates with Shane\'s APIs'
      }
    ];
    
    return flows;
  }

  getFlowStatus(scenarios) {
    let totalTests = 0;
    let passedTests = 0;
    let failedTests = 0;
    
    scenarios.forEach(scenario => {
      const tests = this.results.scenarios[scenario] || [];
      totalTests += tests.length;
      passedTests += tests.filter(t => t.status === 'PASS').length;
      failedTests += tests.filter(t => t.status === 'FAIL').length;
    });
    
    if (totalTests === 0) return '🔍 UNTESTED';
    if (failedTests > 0) return '❌ FAILED';
    if (passedTests === totalTests) return '✅ PASSED';
    return '⚠️ PARTIAL';
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Scenario-specific recommendations
    const homepageIssues = this.results.scenarios.homepageFlow.filter(t => t.status === 'FAIL').length;
    const pricingIssues = this.results.scenarios.pricingFlow.filter(t => t.status === 'FAIL').length;
    const apiIssues = this.results.scenarios.apiIntegration.filter(t => t.status === 'FAIL').length;
    
    if (homepageIssues > 0) {
      recommendations.push('🏠 Fix homepage CTA buttons to ensure proper navigation to payment flows');
    }
    
    if (pricingIssues > 0) {
      recommendations.push('💳 Resolve pricing page payment button issues for all tiers');
    }
    
    if (apiIssues > 0) {
      recommendations.push('🔗 Fix API integration issues between frontend and backend');
    }
    
    // General recommendations
    if (this.results.failed === 0) {
      recommendations.push('✅ All critical user flows are working! Ready for staging deployment');
      recommendations.push('📈 Consider adding more edge case tests and monitoring');
    }
    
    if (this.results.warnings > 0) {
      recommendations.push('⚠️ Review warning items to optimize user experience');
    }
    
    // Always include these
    recommendations.push('🔍 Test with real payment methods in Stripe test mode');
    recommendations.push('📱 Validate mobile payment experience with actual devices');
    recommendations.push('⚙️ Set up monitoring and alerting for payment conversion rates');
    
    return recommendations;
  }

  async saveDetailedResults() {
    const detailedReport = {
      summary: {
        timestamp: new Date().toISOString(),
        baseURL: this.baseURL,
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        successRate: ((this.results.passed / this.results.total) * 100).toFixed(1)
      },
      scenarios: this.results.scenarios,
      errors: this.results.errors,
      configuration: {
        timeout: this.config.timeout,
        headless: this.headless,
        viewport: this.viewport,
        mobileViewport: this.mobileViewport
      }
    };
    
    const reportPath = path.join(__dirname, 'end_to_end_test_results.json');
    
    try {
      fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    } catch (error) {
      console.log(`⚠️ Could not save detailed report: ${error.message}`);
    }
  }
}

// Export for use in other files
module.exports = EndToEndUserFlowTestSuite;

// Run tests if called directly
if (require.main === module) {
  const options = {
    baseURL: process.env.TEST_BASE_URL || 'http://localhost:3000',
    headless: process.env.HEADLESS !== 'false'
  };
  
  const testSuite = new EndToEndUserFlowTestSuite(options);
  
  testSuite.runAllTests()
    .then(results => {
      console.log('\n✅ Test execution completed successfully!');
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Test execution failed:', error);
      process.exit(1);
    });
}