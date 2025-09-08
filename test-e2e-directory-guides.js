#!/usr/bin/env node

// 📋 E2E DIRECTORY GUIDES TESTING SUITE
// Tests the complete Directory Knowledge Base system end-to-end
// Validates user journey from discovery to conversion

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3005',
  timeout: 30000,
  chromePath: process.env.PUPPETEER_EXECUTABLE_PATH || 
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  viewport: { width: 1200, height: 800 },
  mobile: { width: 375, height: 667 }
};

class DirectoryGuidesE2ETester {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      testResults: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      }
    };
  }

  async runTests() {
    console.log('🚀 Starting Directory Knowledge Base E2E Testing...\n');
    
    let browser;
    try {
      // Launch browser
      browser = await puppeteer.launch({
        executablePath: CONFIG.chromePath,
        headless: false, // Show browser for debugging
        defaultViewport: CONFIG.viewport,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });

      // Test homepage and navigation
      await this.testHomepageAndNavigation(browser);
      
      // Test guides index page
      await this.testGuidesIndexPage(browser);
      
      // Test individual guide pages
      await this.testIndividualGuidePage(browser);
      
      // Test search and filtering
      await this.testSearchAndFiltering(browser);
      
      // Test mobile responsiveness
      await this.testMobileResponsiveness(browser);
      
      // Test conversion elements
      await this.testConversionElements(browser);
      
      // Test SEO elements
      await this.testSEOElements(browser);

    } catch (error) {
      this.addResult('CRITICAL', 'Browser Setup', false, `Failed to initialize browser: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }

    this.generateReport();
  }

  async testHomepageAndNavigation(browser) {
    console.log('📝 Testing Homepage and Navigation...');
    
    const page = await browser.newPage();
    
    try {
      // Navigate to homepage
      await page.goto(CONFIG.baseUrl, { waitUntil: 'networkidle0', timeout: CONFIG.timeout });
      
      // Check if guides navigation exists
      const guidesNav = await page.$('a[href="/guides"], a[href*="guides"]');
      if (guidesNav) {
        this.addResult('Navigation', 'Guides navigation exists', true, 'Found guides navigation link');
        
        // Click guides navigation
        await guidesNav.click();
        await page.waitForNavigation({ waitUntil: 'networkidle0' });
        
        const currentUrl = page.url();
        if (currentUrl.includes('/guides')) {
          this.addResult('Navigation', 'Guides page navigation', true, `Navigated to: ${currentUrl}`);
        } else {
          this.addResult('Navigation', 'Guides page navigation', false, `Expected /guides, got: ${currentUrl}`);
        }
      } else {
        this.addResult('Navigation', 'Guides navigation exists', false, 'No guides navigation link found');
      }
      
    } catch (error) {
      this.addResult('Navigation', 'Homepage access', false, `Error: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  async testGuidesIndexPage(browser) {
    console.log('📚 Testing Guides Index Page...');
    
    const page = await browser.newPage();
    
    try {
      // Navigate directly to guides page
      await page.goto(`${CONFIG.baseUrl}/guides`, { waitUntil: 'networkidle0', timeout: CONFIG.timeout });
      
      // Check page title
      const title = await page.title();
      if (title.includes('Guides') || title.includes('Directory')) {
        this.addResult('Guides Index', 'Page title', true, `Title: ${title}`);
      } else {
        this.addResult('Guides Index', 'Page title', false, `Unexpected title: ${title}`);
      }
      
      // Check for hero section
      const heroSection = await page.$('h1, .hero, [class*="hero"]');
      if (heroSection) {
        const heroText = await page.evaluate(el => el.textContent, heroSection);
        this.addResult('Guides Index', 'Hero section', true, `Found hero: ${heroText.slice(0, 100)}...`);
      } else {
        this.addResult('Guides Index', 'Hero section', false, 'No hero section found');
      }
      
      // Check for guide cards/list
      const guideCards = await page.$$('[class*="guide"], [class*="card"], .guide-item, article');
      if (guideCards.length > 0) {
        this.addResult('Guides Index', 'Guide listings', true, `Found ${guideCards.length} guide elements`);
        
        // Check first guide card for essential elements
        const firstCard = guideCards[0];
        const cardText = await page.evaluate(el => el.textContent, firstCard);
        const hasLink = await page.evaluate(el => el.querySelector('a'), firstCard);
        
        if (hasLink) {
          this.addResult('Guides Index', 'Guide card links', true, 'Guide cards have navigation links');
        } else {
          this.addResult('Guides Index', 'Guide card links', false, 'Guide cards missing navigation links');
        }
      } else {
        this.addResult('Guides Index', 'Guide listings', false, 'No guide cards found');
      }
      
      // Check for category filtering
      const filterElements = await page.$$('[class*="filter"], [class*="category"], select, button');
      if (filterElements.length > 0) {
        this.addResult('Guides Index', 'Category filtering', true, `Found ${filterElements.length} filter elements`);
      } else {
        this.addResult('Guides Index', 'Category filtering', false, 'No filtering elements found');
      }
      
    } catch (error) {
      this.addResult('Guides Index', 'Page loading', false, `Error: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  async testIndividualGuidePage(browser) {
    console.log('📖 Testing Individual Guide Page...');
    
    const page = await browser.newPage();
    
    try {
      // Test a specific guide (using Yelp guide as example)
      await page.goto(`${CONFIG.baseUrl}/guides/yelp-business-optimization`, { 
        waitUntil: 'networkidle0', 
        timeout: CONFIG.timeout 
      });
      
      // Check if page loads successfully
      const pageContent = await page.content();
      if (pageContent.includes('Yelp') || pageContent.includes('Business')) {
        this.addResult('Individual Guide', 'Guide page loading', true, 'Guide page loaded successfully');
        
        // Check for guide structure elements
        const elements = {
          title: await page.$('h1'),
          content: await page.$('[class*="content"], main, article'),
          tableOfContents: await page.$('[class*="toc"], [class*="table-of-contents"]'),
          sections: await page.$$('h2, h3, section'),
          images: await page.$$('img'),
          internalLinks: await page.$$('a[href*="/"]'),
          conversionElements: await page.$$('[class*="checkout"], [class*="upgrade"], [class*="cta"]')
        };
        
        // Test each element
        Object.entries(elements).forEach(([name, element]) => {
          if (Array.isArray(element)) {
            if (element.length > 0) {
              this.addResult('Individual Guide', `${name}`, true, `Found ${element.length} ${name}`);
            } else {
              this.addResult('Individual Guide', `${name}`, false, `No ${name} found`);
            }
          } else if (element) {
            this.addResult('Individual Guide', `${name}`, true, `Found ${name}`);
          } else {
            this.addResult('Individual Guide', `${name}`, false, `Missing ${name}`);
          }
        });
        
        // Test reading experience
        await this.testReadingExperience(page);
        
      } else {
        this.addResult('Individual Guide', 'Guide page loading', false, 'Guide page not found or empty');
      }
      
    } catch (error) {
      this.addResult('Individual Guide', 'Page access', false, `Error: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  async testReadingExperience(page) {
    console.log('👁️ Testing Reading Experience...');
    
    try {
      // Check text readability
      const textElements = await page.$$('p, li, div');
      if (textElements.length > 0) {
        // Sample first few text elements
        let totalReadableChars = 0;
        for (let i = 0; i < Math.min(5, textElements.length); i++) {
          const text = await page.evaluate(el => el.textContent, textElements[i]);
          totalReadableChars += text.length;
        }
        
        if (totalReadableChars > 500) {
          this.addResult('Reading Experience', 'Content length', true, `Substantial content found (${totalReadableChars}+ chars)`);
        } else {
          this.addResult('Reading Experience', 'Content length', false, 'Insufficient content');
        }
      }
      
      // Test scroll functionality
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(1000);
      
      const scrollPosition = await page.evaluate(() => window.pageYOffset);
      if (scrollPosition > 0) {
        this.addResult('Reading Experience', 'Scroll functionality', true, 'Page scrolls properly');
      } else {
        this.addResult('Reading Experience', 'Scroll functionality', false, 'Scroll not working');
      }
      
    } catch (error) {
      this.addResult('Reading Experience', 'Testing', false, `Error: ${error.message}`);
    }
  }

  async testSearchAndFiltering(browser) {
    console.log('🔍 Testing Search and Filtering...');
    
    const page = await browser.newPage();
    
    try {
      await page.goto(`${CONFIG.baseUrl}/guides`, { waitUntil: 'networkidle0' });
      
      // Look for search elements
      const searchElements = await page.$$('input[type="search"], input[placeholder*="search"], [class*="search"]');
      if (searchElements.length > 0) {
        this.addResult('Search & Filter', 'Search elements', true, `Found ${searchElements.length} search elements`);
      } else {
        this.addResult('Search & Filter', 'Search elements', false, 'No search functionality found');
      }
      
      // Look for filter elements
      const filterElements = await page.$$('select, [class*="filter"], [class*="category"]');
      if (filterElements.length > 0) {
        this.addResult('Search & Filter', 'Filter elements', true, `Found ${filterElements.length} filter elements`);
      } else {
        this.addResult('Search & Filter', 'Filter elements', false, 'No filtering functionality found');
      }
      
    } catch (error) {
      this.addResult('Search & Filter', 'Testing', false, `Error: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  async testMobileResponsiveness(browser) {
    console.log('📱 Testing Mobile Responsiveness...');
    
    const page = await browser.newPage();
    
    try {
      // Set mobile viewport
      await page.setViewport(CONFIG.mobile);
      await page.goto(`${CONFIG.baseUrl}/guides`, { waitUntil: 'networkidle0' });
      
      // Check if page adapts to mobile
      const isMobileOptimized = await page.evaluate(() => {
        const viewport = window.innerWidth;
        const hasFlexLayout = getComputedStyle(document.body).display.includes('flex');
        const hasResponsiveElements = document.querySelectorAll('[class*="mobile"], [class*="responsive"], [class*="sm:"], [class*="md:"]').length > 0;
        
        return viewport < 500 && (hasFlexLayout || hasResponsiveElements);
      });
      
      if (isMobileOptimized) {
        this.addResult('Mobile', 'Responsive design', true, 'Page adapts to mobile viewport');
      } else {
        this.addResult('Mobile', 'Responsive design', false, 'Page may not be mobile optimized');
      }
      
      // Test mobile navigation
      const mobileNavElements = await page.$$('[class*="mobile"], button[class*="menu"], [class*="hamburger"]');
      if (mobileNavElements.length > 0) {
        this.addResult('Mobile', 'Mobile navigation', true, 'Mobile navigation elements found');
      } else {
        this.addResult('Mobile', 'Mobile navigation', false, 'No mobile navigation found');
      }
      
    } catch (error) {
      this.addResult('Mobile', 'Testing', false, `Error: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  async testConversionElements(browser) {
    console.log('💰 Testing Conversion Elements...');
    
    const page = await browser.newPage();
    
    try {
      await page.goto(`${CONFIG.baseUrl}/guides/yelp-business-optimization`, { waitUntil: 'networkidle0' });
      
      // Look for conversion elements
      const conversionElements = {
        ctaButtons: await page.$$('[class*="cta"], [class*="checkout"], button[class*="upgrade"]'),
        leadForms: await page.$$('form, [class*="form"], input[type="email"]'),
        pricingMentions: await page.$$('[class*="price"], [class*="plan"], [class*="tier"]'),
        urgencyElements: await page.$$('[class*="limited"], [class*="urgent"], [class*="now"]')
      };
      
      Object.entries(conversionElements).forEach(([name, elements]) => {
        if (elements.length > 0) {
          this.addResult('Conversion', name, true, `Found ${elements.length} ${name}`);
        } else {
          this.addResult('Conversion', name, false, `No ${name} found`);
        }
      });
      
      // Test conversion flow integration
      const pageText = await page.evaluate(() => document.body.textContent);
      const hasDirectoryBoltMention = pageText.includes('DirectoryBolt');
      const hasServiceMention = pageText.includes('service') || pageText.includes('automation');
      
      if (hasDirectoryBoltMention && hasServiceMention) {
        this.addResult('Conversion', 'Service integration', true, 'Guide promotes DirectoryBolt services');
      } else {
        this.addResult('Conversion', 'Service integration', false, 'No clear service promotion');
      }
      
    } catch (error) {
      this.addResult('Conversion', 'Testing', false, `Error: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  async testSEOElements(browser) {
    console.log('🔍 Testing SEO Elements...');
    
    const page = await browser.newPage();
    
    try {
      await page.goto(`${CONFIG.baseUrl}/guides/yelp-business-optimization`, { waitUntil: 'networkidle0' });
      
      // Check meta tags
      const metaTags = {
        title: await page.title(),
        description: await page.$eval('meta[name="description"]', el => el.content).catch(() => null),
        keywords: await page.$eval('meta[name="keywords"]', el => el.content).catch(() => null),
        ogTitle: await page.$eval('meta[property="og:title"]', el => el.content).catch(() => null),
        structuredData: await page.$('script[type="application/ld+json"]')
      };
      
      Object.entries(metaTags).forEach(([name, value]) => {
        if (value) {
          this.addResult('SEO', name, true, typeof value === 'string' ? value.slice(0, 100) : 'Present');
        } else {
          this.addResult('SEO', name, false, `Missing ${name}`);
        }
      });
      
      // Check heading structure
      const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements => 
        elements.map(el => ({ tag: el.tagName, text: el.textContent.slice(0, 50) }))
      );
      
      if (headings.length > 0) {
        this.addResult('SEO', 'Heading structure', true, `Found ${headings.length} headings`);
      } else {
        this.addResult('SEO', 'Heading structure', false, 'No proper heading structure');
      }
      
    } catch (error) {
      this.addResult('SEO', 'Testing', false, `Error: ${error.message}`);
    } finally {
      await page.close();
    }
  }

  addResult(category, test, passed, details) {
    this.results.testResults.push({
      category,
      test,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
    
    this.results.summary.total++;
    if (passed) {
      this.results.summary.passed++;
      console.log(`✅ ${category}: ${test}`);
    } else {
      this.results.summary.failed++;
      console.log(`❌ ${category}: ${test} - ${details}`);
    }
    
    if (details.includes('warn')) {
      this.results.summary.warnings++;
    }
  }

  generateReport() {
    console.log('\n📊 E2E TESTING COMPLETE\n');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${this.results.summary.total}`);
    console.log(`✅ Passed: ${this.results.summary.passed}`);
    console.log(`❌ Failed: ${this.results.summary.failed}`);
    console.log(`⚠️  Warnings: ${this.results.summary.warnings}`);
    console.log('='.repeat(50));
    
    const successRate = (this.results.summary.passed / this.results.summary.total * 100).toFixed(1);
    console.log(`Success Rate: ${successRate}%\n`);
    
    // Save detailed results
    const reportPath = path.join(__dirname, `e2e-directory-guides-test-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Detailed report saved: ${reportPath}`);
    
    // Generate deployment readiness assessment
    this.generateDeploymentAssessment();
  }

  generateDeploymentAssessment() {
    const criticalFailures = this.results.testResults.filter(r => 
      !r.passed && (r.category === 'Navigation' || r.category === 'Guides Index' || r.category === 'Individual Guide')
    );
    
    const conversionIssues = this.results.testResults.filter(r => 
      !r.passed && r.category === 'Conversion'
    );
    
    const seoIssues = this.results.testResults.filter(r => 
      !r.passed && r.category === 'SEO'
    );
    
    console.log('\n🚀 DEPLOYMENT READINESS ASSESSMENT');
    console.log('='.repeat(50));
    
    if (criticalFailures.length === 0) {
      console.log('✅ Core functionality: READY');
    } else {
      console.log(`❌ Core functionality: ${criticalFailures.length} critical issues`);
    }
    
    if (conversionIssues.length <= 2) {
      console.log('✅ Conversion system: ACCEPTABLE');
    } else {
      console.log(`⚠️  Conversion system: ${conversionIssues.length} issues need attention`);
    }
    
    if (seoIssues.length <= 3) {
      console.log('✅ SEO infrastructure: GOOD');
    } else {
      console.log(`⚠️  SEO infrastructure: ${seoIssues.length} optimizations needed`);
    }
    
    const overallReadiness = criticalFailures.length === 0 ? 'READY FOR PRODUCTION' : 'NEEDS FIXES BEFORE PRODUCTION';
    console.log(`\n🎯 Overall Status: ${overallReadiness}`);
    console.log('='.repeat(50));
  }
}

// Run the tests
const tester = new DirectoryGuidesE2ETester();
tester.runTests().catch(console.error);