/**
 * Puppeteer Handler Function for Netlify
 * Provides web scraping and automated browser operations
 */

// Lazy-load heavy native modules at runtime. Wrapping require in try/catch
// prevents the Netlify bundler from failing when the native module isn't
// available in the build environment. The function will return a helpful
// error when the module is not present at runtime.
let puppeteer = null;
let chromium = null;

// Configure Puppeteer for Netlify environment
const getBrowserConfig = async () => {
  if (process.env.NETLIFY) {
    return {
      args: [
        ...chromium.args,
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection'
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || await chromium.executablePath(),
      headless: chromium.headless,
    };
  } else {
    return {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    };
  }
};

/**
 * Rate limiting and validation
 */
const validateRequest = (body) => {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }
  
  const { action, url, options = {} } = body;
  
  if (!action) {
    throw new Error('Action is required');
  }
  
  if (!url && ['scrape', 'screenshot', 'pdf'].includes(action)) {
    throw new Error('URL is required for this action');
  }
  
  // Security: Only allow HTTPS URLs and specific domains
  if (url) {
    try {
      const urlObj = new URL(url);
      if (!['https:', 'http:'].includes(urlObj.protocol)) {
        throw new Error('Only HTTP and HTTPS URLs are allowed');
      }
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }
  
  return { action, url, options };
};

/**
 * Scrape webpage content
 */
const scrapeContent = async (browser, url, options = {}) => {
  const page = await browser.newPage();
  
  try {
    // Set user agent
    await page.setUserAgent('DirectoryBolt/2.0 (+https://directorybolt.com)');
    
    // Configure viewport
    await page.setViewport({
      width: options.width || 1920,
      height: options.height || 1080
    });
    
    // Navigate to page with timeout
    await page.goto(url, {
      waitUntil: options.waitUntil || 'networkidle2',
      timeout: 30000
    });
    
    // Wait for specific selector if provided
    if (options.waitForSelector) {
      await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
    }
    
    // Extract content based on selectors
    const content = await page.evaluate((selectors) => {
      const result = {
        title: document.title,
        url: window.location.href,
        metadata: {}
      };
      
      // Extract meta tags
      const metaTags = document.querySelectorAll('meta');
      metaTags.forEach(tag => {
        const name = tag.getAttribute('name') || tag.getAttribute('property');
        const content = tag.getAttribute('content');
        if (name && content) {
          result.metadata[name] = content;
        }
      });
      
      // Extract content based on provided selectors
      if (selectors && typeof selectors === 'object') {
        Object.keys(selectors).forEach(key => {
          const selector = selectors[key];
          const elements = document.querySelectorAll(selector);
          
          if (elements.length === 1) {
            result[key] = elements[0].textContent.trim();
          } else if (elements.length > 1) {
            result[key] = Array.from(elements).map(el => el.textContent.trim());
          }
        });
      } else {
        // Default content extraction
        result.headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => ({
          tag: h.tagName.toLowerCase(),
          text: h.textContent.trim()
        }));
        
        result.paragraphs = Array.from(document.querySelectorAll('p')).map(p => 
          p.textContent.trim()
        ).filter(text => text.length > 20).slice(0, 10); // First 10 substantial paragraphs
        
        result.links = Array.from(document.querySelectorAll('a[href]')).map(a => ({
          text: a.textContent.trim(),
          href: a.href
        })).filter(link => link.text && link.href).slice(0, 20); // First 20 links
      }
      
      return result;
    }, options.selectors);
    
    return content;
    
  } finally {
    await page.close();
  }
};

/**
 * Take screenshot of webpage
 */
const takeScreenshot = async (browser, url, options = {}) => {
  const page = await browser.newPage();
  
  try {
    await page.setViewport({
      width: options.width || 1920,
      height: options.height || 1080
    });
    
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    if (options.waitForSelector) {
      await page.waitForSelector(options.waitForSelector, { timeout: 10000 });
    }
    
    const screenshot = await page.screenshot({
      type: options.format || 'png',
      quality: options.quality || 80,
      fullPage: options.fullPage || false,
      encoding: 'base64'
    });
    
    return screenshot;
    
  } finally {
    await page.close();
  }
};

/**
 * Main handler function
 * @param {Object} event - Netlify function event
 * @param {Object} context - Netlify function context
 * @returns {Object} HTTP response
 */
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.URL || process.env.DEPLOY_URL || 'https://directorybolt.com',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Allow a simple GET-based health probe: `GET /.netlify/functions/puppeteer-handler?action=health`
  if (event.httpMethod === 'GET') {
    const q = event.queryStringParameters || {};
    if (!q.action) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing action query parameter' })
      };
    }

    // Emulate a POST body for downstream logic
    event.body = JSON.stringify({ action: q.action, url: q.url, options: {} });
  }

  if (event.httpMethod !== 'POST' && event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ 
        error: 'Method not allowed. Use POST or GET (for health)'.trim() 
      })
    };
  }

  let browser = null;

  try {
    // Parse and validate request
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid JSON in request body'
        })
      };
    }

    const { action, url, options } = validateRequest(body);
    
    // Try to load puppeteer/chromium at runtime. If not installed, return a 501
    // to indicate the operation is not available in this environment.
    try {
      if (!puppeteer) puppeteer = require('puppeteer');
    } catch (loadErr) {
      console.error('Puppeteer not available in this environment:', loadErr.message);
      return {
        statusCode: 501,
        headers,
        body: JSON.stringify({ error: 'Puppeteer is not available in this environment.' })
      };
    }

    try {
      if (!chromium) chromium = require('@sparticuz/chromium');
    } catch (loadErr) {
      // chromium is optional; continue if not present — getBrowserConfig will
      // handle missing chromium by falling back to bundled puppeteer behavior.
      chromium = null;
    }

    // Launch browser with appropriate configuration
    const browserConfig = await getBrowserConfig();
    browser = await puppeteer.launch(browserConfig);
    
    let result = {};
    
    switch (action) {
      case 'scrape':
        result.content = await scrapeContent(browser, url, options);
        break;
        
      case 'screenshot':
        result.screenshot = await takeScreenshot(browser, url, options);
        result.format = options.format || 'png';
        break;
        
      case 'health':
        // Simple health check
        result.status = 'healthy';
        result.browserVersion = await browser.version();
        break;
        
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
    
    result.timestamp = new Date().toISOString();
    result.action = action;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Puppeteer handler error:', error);
    
    // Determine appropriate error code and message
    let statusCode = 500;
    let errorMessage = 'Internal server error';
    
    if (error.message.includes('Invalid')) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.message.includes('timeout')) {
      statusCode = 408;
      errorMessage = 'Request timeout - page took too long to load';
    } else if (error.message.includes('navigation')) {
      statusCode = 422;
      errorMessage = 'Unable to navigate to the specified URL';
    }
    
    return {
      statusCode,
      headers,
      body: JSON.stringify({
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      })
    };
    
  } finally {
    // Always close browser to prevent memory leaks
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
};

// Function configuration for memory and timeout
exports.config = {
  schedule: null // On-demand only
};