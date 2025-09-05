/**
 * AI Health Check Function for Netlify
 * Validates AI service availability and API key configuration
 */

const OpenAI = require('openai');

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

// Initialize Anthropic client if key is available
let anthropic = null;
if (process.env.ANTHROPIC_API_KEY) {
  try {
    const { Anthropic } = require('@anthropic-ai/sdk');
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });
  } catch (error) {
    console.warn('Anthropic SDK not available:', error.message);
  }
}

/**
 * Health check for AI services
 * @param {Object} event - Netlify function event
 * @param {Object} context - Netlify function context
 * @returns {Object} HTTP response
 */
exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.URL || process.env.DEPLOY_URL || 'https://directorybolt.com',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

  try {
    const healthCheck = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        openai: {
          configured: !!process.env.OPENAI_API_KEY,
          status: 'unknown',
          model: null,
          error: null
        },
        anthropic: {
          configured: !!process.env.ANTHROPIC_API_KEY,
          status: 'unknown',
          model: null,
          error: null
        },
        puppeteer: {
          configured: !!process.env.PUPPETEER_EXECUTABLE_PATH,
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 'default',
          status: 'unknown',
          error: null
        }
      },
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external
      },
      overall: {
        healthy: false,
        availableServices: 0,
        totalServices: 3
      }
    };

    // Test OpenAI connection
    if (openai && process.env.OPENAI_API_KEY) {
      try {
        // Quick test with minimal token usage
        const models = await openai.models.list();
        healthCheck.services.openai.status = 'healthy';
        healthCheck.services.openai.model = 'gpt-3.5-turbo'; // Default model
        healthCheck.overall.availableServices++;
      } catch (error) {
        console.error('OpenAI health check failed:', error.message);
        healthCheck.services.openai.status = 'error';
        healthCheck.services.openai.error = error.message.includes('API key')
          ? 'Invalid API key'
          : 'Service unavailable';
      }
    } else if (!process.env.OPENAI_API_KEY) {
      healthCheck.services.openai.status = 'not_configured';
      healthCheck.services.openai.error = 'API key not set';
    }

    // Test Anthropic connection
    if (anthropic && process.env.ANTHROPIC_API_KEY) {
      try {
        // Test with minimal request to verify API key
        await anthropic.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Test' }]
        });
        healthCheck.services.anthropic.status = 'healthy';
        healthCheck.services.anthropic.model = 'claude-3-sonnet-20240229';
        healthCheck.overall.availableServices++;
      } catch (error) {
        console.error('Anthropic health check failed:', error.message);
        healthCheck.services.anthropic.status = 'error';
        healthCheck.services.anthropic.error = error.message.includes('authentication')
          ? 'Invalid API key'
          : 'Service unavailable';
      }
    } else if (!process.env.ANTHROPIC_API_KEY) {
      healthCheck.services.anthropic.status = 'not_configured';
      healthCheck.services.anthropic.error = 'API key not set';
    }

    // Test Puppeteer availability
    try {
      const puppeteer = require('puppeteer');
      
      // Check if executable path is configured for Netlify
      if (process.env.NETLIFY && !process.env.PUPPETEER_EXECUTABLE_PATH) {
        healthCheck.services.puppeteer.status = 'warning';
        healthCheck.services.puppeteer.error = 'PUPPETEER_EXECUTABLE_PATH not configured for Netlify';
      } else {
        // Test browser launch (quick check)
        const browser = await puppeteer.launch({
          headless: true,
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
          ]
        });
        
        await browser.close();
        healthCheck.services.puppeteer.status = 'healthy';
        healthCheck.overall.availableServices++;
      }
    } catch (error) {
      console.error('Puppeteer health check failed:', error.message);
      healthCheck.services.puppeteer.status = 'error';
      healthCheck.services.puppeteer.error = error.message;
    }

    // Calculate overall health
    healthCheck.overall.healthy = healthCheck.overall.availableServices >= 2; // At least 2 services should work
    
    // Add recommendations
    healthCheck.recommendations = [];
    
    if (!healthCheck.services.openai.configured) {
      healthCheck.recommendations.push('Configure OPENAI_API_KEY in Netlify environment variables');
    }
    
    if (!healthCheck.services.anthropic.configured) {
      healthCheck.recommendations.push('Configure ANTHROPIC_API_KEY in Netlify environment variables');
    }
    
    if (healthCheck.services.puppeteer.status !== 'healthy') {
      healthCheck.recommendations.push('Configure PUPPETEER_EXECUTABLE_PATH for Netlify deployment');
    }
    
    if (healthCheck.overall.availableServices === 0) {
      healthCheck.recommendations.push('At least one AI service must be configured for the application to function');
    }

    // Return appropriate status code
    const statusCode = healthCheck.overall.healthy ? 200 : 503;
    
    return {
      statusCode,
      headers,
      body: JSON.stringify(healthCheck, null, 2)
    };

  } catch (error) {
    console.error('Health check error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        message: error.message,
        overall: {
          healthy: false
        }
      })
    };
  }
};

// Function configuration
exports.config = {
  schedule: '@every 5m' // Run health check every 5 minutes
};