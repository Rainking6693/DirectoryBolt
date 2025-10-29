#!/usr/bin/env node
/**
 * Diagnostic script to test all backend connections for DB-WORKER
 * Tests: Supabase, Anthropic, Gemini, 2Captcha, and database schema
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m'
};

function logSuccess(message) {
  console.log(`${colors.green}✓ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}✗ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

async function testSupabaseConnection() {
  logInfo('Testing Supabase connection...');
  
  if (!process.env.SUPABASE_URL) {
    logError('SUPABASE_URL not set in .env');
    return false;
  }
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    logError('SUPABASE_SERVICE_ROLE_KEY not set in .env');
    return false;
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Test basic connection
    const { data, error } = await supabase.from('jobs').select('id').limit(1);
    
    if (error) {
      logError(`Supabase connection failed: ${error.message}`);
      return false;
    }

    logSuccess('Supabase connection successful');
    
    // Check for pending jobs
    const { data: pendingJobs, error: jobError } = await supabase
      .from('jobs')
      .select('id, status, customer_id')
      .in('status', ['pending', 'in_progress'])
      .limit(5);
    
    if (jobError) {
      logWarning(`Could not query pending jobs: ${jobError.message}`);
    } else {
      logInfo(`Found ${pendingJobs?.length || 0} pending/in_progress jobs`);
      if (pendingJobs && pendingJobs.length > 0) {
        pendingJobs.forEach(job => {
          console.log(`  - Job ${job.id}: ${job.status} (customer: ${job.customer_id})`);
        });
      }
    }

    // Check directory_submissions table
    const { data: submissions, error: subError } = await supabase
      .from('directory_submissions')
      .select('id, status')
      .limit(1);
    
    if (subError) {
      logWarning(`directory_submissions table check failed: ${subError.message}`);
    } else {
      logSuccess('directory_submissions table accessible');
    }

    // Check worker_status table
    const { data: workerStatus, error: wsError } = await supabase
      .from('worker_status')
      .select('worker_id, status')
      .limit(1);
    
    if (wsError) {
      logWarning(`worker_status table check failed: ${wsError.message}`);
    } else {
      logSuccess('worker_status table accessible');
    }

    // Check directory_form_mappings table
    const { data: mappings, error: mapError } = await supabase
      .from('directory_form_mappings')
      .select('id')
      .limit(1);
    
    if (mapError) {
      logWarning(`directory_form_mappings table check failed: ${mapError.message}`);
    } else {
      logSuccess('directory_form_mappings table accessible');
    }

    return true;
  } catch (error) {
    logError(`Supabase test failed: ${error.message}`);
    return false;
  }
}

async function testAnthropicAPI() {
  logInfo('Testing Anthropic API...');
  
  if (!process.env.ANTHROPIC_API_KEY) {
    logWarning('ANTHROPIC_API_KEY not set in .env');
    return false;
  }

  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 50,
      messages: [{ role: "user", content: "Reply with 'OK' if you can read this." }]
    });

    if (response.content && response.content[0]) {
      logSuccess('Anthropic API connection successful');
      return true;
    } else {
      logError('Anthropic API returned unexpected response');
      return false;
    }
  } catch (error) {
    logError(`Anthropic API test failed: ${error.message}`);
    return false;
  }
}

async function testGeminiAPI() {
  logInfo('Testing Gemini API...');
  
  if (!process.env.GEMINI_API_KEY) {
    logWarning('GEMINI_API_KEY not set in .env');
    return false;
  }

  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent("Reply with 'OK' if you can read this.");
    const text = result.response.text();

    if (text) {
      logSuccess('Gemini API connection successful');
      return true;
    } else {
      logError('Gemini API returned empty response');
      return false;
    }
  } catch (error) {
    logError(`Gemini API test failed: ${error.message}`);
    return false;
  }
}

async function test2CaptchaAPI() {
  logInfo('Testing 2Captcha API...');
  
  if (!process.env.TWO_CAPTCHA_API_KEY) {
    logWarning('TWO_CAPTCHA_API_KEY not set in .env (optional)');
    return false;
  }

  try {
    const Captcha = require("2captcha");
    const solver = new Captcha.Solver(process.env.TWO_CAPTCHA_API_KEY);
    
    // Test balance check (doesn't consume credits)
    const balance = await solver.balance();
    logSuccess(`2Captcha API connection successful (Balance: $${balance})`);
    
    if (balance < 1) {
      logWarning('2Captcha balance is low. Consider adding funds.');
    }
    
    return true;
  } catch (error) {
    logError(`2Captcha API test failed: ${error.message}`);
    return false;
  }
}

async function testPlaywright() {
  logInfo('Testing Playwright installation...');
  
  try {
    const playwright = require('playwright');
    const browser = await playwright.chromium.launch({ headless: true });
    await browser.close();
    logSuccess('Playwright chromium browser available');
    return true;
  } catch (error) {
    logError(`Playwright test failed: ${error.message}`);
    logWarning('Run: npm run postinstall or npx playwright install --with-deps');
    return false;
  }
}

async function checkJobStructure() {
  logInfo('Checking job and submission structure...');
  
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get a sample job with submissions
    const { data: jobs, error: jobError } = await supabase
      .from('jobs')
      .select('id, customer_id, status, business_data, customer_name, customer_email')
      .limit(1);

    if (jobError) {
      logError(`Could not fetch jobs: ${jobError.message}`);
      return false;
    }

    if (!jobs || jobs.length === 0) {
      logWarning('No jobs found in database. Create a test job first.');
      return false;
    }

    const job = jobs[0];
    logInfo(`Sample job found: ${job.id} (${job.status})`);

    // Check for submissions linked to this job
    const { data: submissions, error: subError } = await supabase
      .from('directory_submissions')
      .select('id, status, directory_url, submission_queue_id')
      .eq('submission_queue_id', job.id);

    if (subError) {
      logError(`Could not fetch submissions: ${subError.message}`);
      return false;
    }

    if (!submissions || submissions.length === 0) {
      logWarning(`Job ${job.id} has no linked submissions. Check submission_queue_id foreign key.`);
      return false;
    }

    logSuccess(`Job ${job.id} has ${submissions.length} submission(s)`);
    submissions.slice(0, 3).forEach(sub => {
      console.log(`  - Submission ${sub.id}: ${sub.status} -> ${sub.directory_url}`);
    });

    return true;
  } catch (error) {
    logError(`Job structure check failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n=== DirectoryBolt DB-WORKER Connection Diagnostics ===\n');

  const results = {
    supabase: await testSupabaseConnection(),
    anthropic: await testAnthropicAPI(),
    gemini: await testGeminiAPI(),
    captcha: await test2CaptchaAPI(),
    playwright: await testPlaywright(),
    jobStructure: await checkJobStructure()
  };

  console.log('\n=== Summary ===\n');
  
  const passed = Object.values(results).filter(r => r === true).length;
  const total = Object.keys(results).length;
  
  console.log(`Tests passed: ${passed}/${total}\n`);

  if (results.supabase && results.anthropic && results.gemini && results.playwright) {
    logSuccess('All critical services are operational. Worker should function correctly.');
  } else {
    logError('Critical services are missing. Worker will not function properly.');
    console.log('\nRequired fixes:');
    if (!results.supabase) console.log('  - Configure Supabase credentials in .env');
    if (!results.anthropic) console.log('  - Add ANTHROPIC_API_KEY to .env');
    if (!results.gemini) console.log('  - Add GEMINI_API_KEY to .env');
    if (!results.playwright) console.log('  - Run: npm run postinstall');
  }

  console.log('\n');
  process.exit(passed === total ? 0 : 1);
}

main();
