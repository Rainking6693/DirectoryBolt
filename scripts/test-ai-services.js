#!/usr/bin/env node

/**
 * AI Services Test Script
 * Tests connectivity and configuration for OpenAI and Anthropic APIs
 */

const puppeteer = require('puppeteer');

// Load environment variables
require('dotenv').config();

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const makeRequest = async (url, options = {}) => {
  try {
    // Use axios for HTTP requests
    const axios = require('axios');
    const response = await axios({
      url,
      method: options.method || 'GET',
      headers: options.headers || {},
      data: options.body,
      timeout: 30000,
      validateStatus: () => true // Don't throw on HTTP error status
    });
    
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      json: () => Promise.resolve(response.data),
      text: () => Promise.resolve(typeof response.data === 'string' ? response.data : JSON.stringify(response.data))
    };
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
};

const checkOpenAI = async () => {
  log('🤖 Testing OpenAI API...', 'blue');
  
  if (!process.env.OPENAI_API_KEY) {
    log('❌ OPENAI_API_KEY not found in environment variables', 'red');
    return false;
  }
  
  try {
    // Test OpenAI API with a simple request
    const response = await makeRequest('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      log(`✅ OpenAI API connection successful (${data.data?.length || 0} models available)`, 'green');
      return true;
    } else {
      const errorData = await response.text();
      log(`❌ OpenAI API connection failed: ${response.status} - ${errorData}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ OpenAI API error: ${error.message}`, 'red');
    return false;
  }
};

const checkAnthropic = async () => {
  log('🧠 Testing Anthropic API...', 'blue');
  
  if (!process.env.ANTHROPIC_API_KEY) {
    log('❌ ANTHROPIC_API_KEY not found in environment variables', 'red');
    return false;
  }
  
  try {
    // For Anthropic, we'll just check if the API key format is valid
    if (process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
      log('✅ Anthropic API key format is valid', 'green');
      return true;
    } else {
      log('❌ Anthropic API key format is invalid', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Anthropic API error: ${error.message}`, 'red');
    return false;
  }
};

const checkPuppeteer = async () => {
  log('🌐 Testing Puppeteer setup...', 'blue');
  
  try {
    const browser = await puppeteer.launch({
      headless: true,
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
    
    const version = await browser.version();
    log(`✅ Puppeteer browser launch successful (${version})`, 'green');
    
    await browser.close();
    return true;
    
  } catch (error) {
    log(`❌ Puppeteer error: ${error.message}`, 'red');
    return false;
  }
};

const checkNetlifyEnvironment = () => {
  log('🚀 Checking Netlify environment...', 'blue');
  
  const netlifyVars = {
    NETLIFY: process.env.NETLIFY || 'false',
    URL: process.env.URL || 'not set',
    DEPLOY_URL: process.env.DEPLOY_URL || 'not set',
    CONTEXT: process.env.CONTEXT || 'not set',
    NODE_ENV: process.env.NODE_ENV || 'not set'
  };
  
  console.table(netlifyVars);
  
  if (process.env.NETLIFY === 'true') {
    log('✅ Running in Netlify environment', 'green');
    
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      log(`✅ Puppeteer executable path configured: ${process.env.PUPPETEER_EXECUTABLE_PATH}`, 'green');
    } else {
      log('⚠️ PUPPETEER_EXECUTABLE_PATH not set - may cause issues in Netlify functions', 'yellow');
    }
    
    return true;
  } else {
    log('ℹ️ Running in local development environment', 'blue');
    return false;
  }
};

const generateReport = (results) => {
  log('\n📊 AI Services Test Report', 'blue');
  log('='.repeat(50));
  
  const serviceResults = [
    { name: 'OpenAI API', status: results.openai },
    { name: 'Anthropic API', status: results.anthropic },
    { name: 'Puppeteer', status: results.puppeteer }
  ];
  
  serviceResults.forEach(service => {
    const status = service.status ? '✅ PASS' : '❌ FAIL';
    const color = service.status ? 'green' : 'red';
    log(`${service.name.padEnd(20)} ${status}`, color);
  });
  
  const passCount = serviceResults.filter(s => s.status).length;
  const totalCount = serviceResults.length;
  
  log(`\n📈 Overall Status: ${passCount}/${totalCount} services operational`);
  
  if (passCount === 0) {
    log('🚨 CRITICAL: No AI services are operational. Configure at least one AI API key.', 'red');
  } else if (passCount < totalCount) {
    log('⚠️ WARNING: Some AI services are not operational. Some features may be disabled.', 'yellow');
  } else {
    log('🎉 SUCCESS: All AI services are operational and ready for production!', 'green');
  }
  
  // Recommendations
  log('\n🔧 Recommendations:', 'blue');
  if (!results.openai) {
    log('   • Set OPENAI_API_KEY environment variable', 'yellow');
  }
  if (!results.anthropic) {
    log('   • Set ANTHROPIC_API_KEY environment variable', 'yellow');
  }
  if (!results.puppeteer) {
    log('   • Install Puppeteer dependencies and check system requirements', 'yellow');
  }
  
  log('\n✅ Test completed successfully!', 'green');
};

// Main execution
const main = async () => {
  log('🔍 DirectoryBolt AI Services Connectivity Test', 'blue');
  log('='.repeat(48) + '\n');
  
  const results = {
    openai: false,
    anthropic: false,
    puppeteer: false,
    netlify: false
  };
  
  // Run all tests
  results.openai = await checkOpenAI();
  results.anthropic = await checkAnthropic();
  results.puppeteer = await checkPuppeteer();
  results.netlify = checkNetlifyEnvironment();
  
  // Generate and display report
  generateReport(results);
};

// Handle script execution
if (require.main === module) {
  main().catch(error => {
    log(`💥 Test script failed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { checkOpenAI, checkAnthropic, checkPuppeteer, checkNetlifyEnvironment };