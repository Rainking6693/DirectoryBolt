/**
 * Performance Testing Script for DirectoryBolt
 * Tests Core Web Vitals and other performance metrics
 */

const puppeteer = require('puppeteer');

async function testPerformance() {
  console.log('🚀 Starting Performance Analysis...\n');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  // Set mobile viewport for mobile testing
  await page.setViewport({ width: 375, height: 667 });
  
  // Enable performance monitoring
  await page.setCacheEnabled(false);
  
  const metrics = {};
  let performanceEntries = [];

  // Collect performance metrics
  await page.evaluateOnNewDocument(() => {
    window.performanceMetrics = {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null
    };

    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      window.performanceMetrics.lcp = lastEntry.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        window.performanceMetrics.fid = entry.processingStart - entry.startTime;
      });
    }).observe({ type: 'first-input', buffered: true });

    // Cumulative Layout Shift
    new PerformanceObserver((list) => {
      let cls = 0;
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          cls += entry.value;
        }
      });
      window.performanceMetrics.cls = cls;
    }).observe({ type: 'layout-shift', buffered: true });

    // First Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          window.performanceMetrics.fcp = entry.startTime;
        }
      });
    }).observe({ type: 'paint', buffered: true });
  });

  try {
    console.log('📊 Testing localhost:3000...\n');
    
    const startTime = Date.now();
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    const loadTime = Date.now() - startTime;

    // Wait for page to fully load and stabilize
    await page.waitForTimeout(3000);

    // Get Core Web Vitals
    const webVitals = await page.evaluate(() => window.performanceMetrics);
    
    // Get additional metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        domComplete: navigation.domComplete - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime
      };
    });

    // Get resource timing
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map(resource => ({
        name: resource.name,
        duration: resource.duration,
        transferSize: resource.transferSize,
        encodedBodySize: resource.encodedBodySize,
        decodedBodySize: resource.decodedBodySize
      }));
    });

    // Calculate bundle sizes
    const jsResources = resources.filter(r => r.name.includes('.js'));
    const cssResources = resources.filter(r => r.name.includes('.css'));
    const imageResources = resources.filter(r => r.name.match(/\.(png|jpg|jpeg|webp|svg)$/));
    
    const totalJSSize = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    const totalCSSSize = cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    const totalImageSize = imageResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);

    // Performance scoring
    function getScore(metric, value) {
      const thresholds = {
        lcp: { good: 2500, poor: 4000 },
        fid: { good: 100, poor: 300 },
        cls: { good: 0.1, poor: 0.25 },
        fcp: { good: 1800, poor: 3000 },
        ttfb: { good: 800, poor: 1800 }
      };
      
      if (!thresholds[metric] || value === null) return 'N/A';
      
      if (value <= thresholds[metric].good) return '🟢 Good';
      if (value <= thresholds[metric].poor) return '🟡 Needs Improvement';
      return '🔴 Poor';
    }

    // Display results
    console.log('='.repeat(60));
    console.log('🎯 CORE WEB VITALS RESULTS');
    console.log('='.repeat(60));
    console.log(`LCP (Largest Contentful Paint): ${webVitals.lcp ? Math.round(webVitals.lcp) + 'ms' : 'N/A'} ${getScore('lcp', webVitals.lcp)}`);
    console.log(`FID (First Input Delay): ${webVitals.fid ? Math.round(webVitals.fid) + 'ms' : 'N/A'} ${getScore('fid', webVitals.fid)}`);
    console.log(`CLS (Cumulative Layout Shift): ${webVitals.cls ? webVitals.cls.toFixed(3) : 'N/A'} ${getScore('cls', webVitals.cls)}`);
    console.log('');

    console.log('='.repeat(60));
    console.log('⏱️  LOADING PERFORMANCE');
    console.log('='.repeat(60));
    console.log(`TTFB (Time to First Byte): ${Math.round(performanceMetrics.ttfb)}ms ${getScore('ttfb', performanceMetrics.ttfb)}`);
    console.log(`FCP (First Contentful Paint): ${Math.round(performanceMetrics.firstContentfulPaint)}ms ${getScore('fcp', performanceMetrics.firstContentfulPaint)}`);
    console.log(`DOM Content Loaded: ${Math.round(performanceMetrics.domContentLoaded)}ms`);
    console.log(`Full Page Load: ${Math.round(performanceMetrics.loadComplete)}ms`);
    console.log('');

    console.log('='.repeat(60));
    console.log('📦 BUNDLE SIZE ANALYSIS');
    console.log('='.repeat(60));
    console.log(`Total JavaScript: ${(totalJSSize / 1024).toFixed(1)}KB (${jsResources.length} files)`);
    console.log(`Total CSS: ${(totalCSSSize / 1024).toFixed(1)}KB (${cssResources.length} files)`);
    console.log(`Total Images: ${(totalImageSize / 1024).toFixed(1)}KB (${imageResources.length} files)`);
    console.log('');

    // Recommendations
    console.log('='.repeat(60));
    console.log('💡 PERFORMANCE RECOMMENDATIONS');
    console.log('='.repeat(60));
    
    if (webVitals.lcp > 2500) {
      console.log('🔴 LCP needs improvement: Optimize hero image and reduce render-blocking resources');
    } else {
      console.log('✅ LCP is optimized');
    }
    
    if (webVitals.cls > 0.1) {
      console.log('🔴 CLS needs improvement: Ensure dimensions are set for images and dynamic content');
    } else {
      console.log('✅ CLS is optimized');
    }
    
    if (totalJSSize > 150000) {
      console.log('🔴 JavaScript bundle is large: Consider code splitting and tree shaking');
    } else {
      console.log('✅ JavaScript bundle size is reasonable');
    }
    
    if (performanceMetrics.ttfb > 800) {
      console.log('🔴 TTFB is slow: Optimize server response time');
    } else {
      console.log('✅ TTFB is fast');
    }

    console.log('');
    console.log('📊 Test completed successfully!');

  } catch (error) {
    console.error('❌ Error during performance testing:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the test
testPerformance().catch(console.error);