require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const os = require('os');
const playwright = require('playwright');

// Config
const POLL_INTERVAL = 30000; // 30 seconds
const HEARTBEAT_INTERVAL = 10000; // 10 seconds
const WORKER_ID = os.hostname();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Fallback mapping for when JSON parsing fails
const FALLBACK_MAPPING = {
  business_name: 'input[name="business_name"], input[name="name"], input[placeholder*="business"], input[placeholder*="name"]',
  email: 'input[name="email"], input[type="email"], input[placeholder*="email"]',
  phone: 'input[name="phone"], input[type="tel"], input[placeholder*="phone"]',
  website: 'input[name="website"], input[name="url"], input[placeholder*="website"]',
  address: 'input[name="address"], textarea[name="address"], input[placeholder*="address"]',
  city: 'input[name="city"], input[placeholder*="city"]',
  state: 'input[name="state"], select[name="state"], input[placeholder*="state"]',
  zip: 'input[name="zip"], input[name="postal_code"], input[placeholder*="zip"]',
  description: 'textarea[name="description"], textarea[name="bio"], textarea[placeholder*="description"]',
  category: 'select[name="category"], input[name="category"], input[placeholder*="category"]'
};

// 2Captcha solver (optional - only initialize if API key is provided)
let solver = null;
try {
  if (process.env.TWO_CAPTCHA_API_KEY) {
    const Captcha = require("2captcha");
    solver = new Captcha.Solver(process.env.TWO_CAPTCHA_API_KEY);
  }
} catch (e) {
  console.log('2Captcha not available, CAPTCHA solving will be skipped');
}

// Logging function
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
  fs.appendFileSync(path.join(__dirname, 'poller.log'), `${message}\n`);
}

// Function to strip markdown code blocks from Gemini responses
function stripMarkdownCodeBlocks(text) {
  if (!text) return text;
  
  // Handle multiple markdown formats
  let stripped = text;
  
  // Remove ```json ... ``` format
  stripped = stripped.replace(/```json\s*([\s\S]*?)\s*```/gi, '$1');
  
  // Remove ``` ... ``` format
  stripped = stripped.replace(/```\s*([\s\S]*?)\s*```/gi, '$1');
  
  // Remove leading/trailing whitespace
  stripped = stripped.trim();
  
  return stripped;
}

// Function to parse JSON with fallback
function parseJsonWithFallback(text, directoryUrl) {
  try {
    // Strip markdown code blocks first
    const strippedText = stripMarkdownCodeBlocks(text);
    
    // Try to parse the JSON
    const parsed = JSON.parse(strippedText);
    log(`Successfully parsed JSON for ${directoryUrl}`);
    return { mapping: parsed, isFallback: false };
  } catch (parseError) {
    log(`Failed to parse JSON for ${directoryUrl}: ${parseError.message}`);
    log(`Raw response: ${text}`);
    
    // Use fallback mapping
    log(`Using fallback mapping for ${directoryUrl}`);
    return { mapping: FALLBACK_MAPPING, isFallback: true };
  }
}

// Function with retry logic for Gemini API calls
async function callGeminiWithRetry(prompt, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log(`Calling Gemini API (attempt ${attempt}/${maxRetries})`);
      const result = await model.generateContent(prompt);
      return result;
    } catch (error) {
      lastError = error;
      log(`Gemini API call failed (attempt ${attempt}/${maxRetries}): ${error.message}`);
      
      // If this isn't the last attempt, wait before retrying
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 2s, 4s, 8s
        log(`Waiting ${delay}ms before retrying...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // If all retries failed, throw the last error
  throw lastError;
}

function buildBusinessDataFromSubmission(submission, job) {
  // Prefer per-submission listing_data; fall back to job.business_data
  const src = submission?.listing_data || job?.business_data || {};
  return {
    business_name: src.business_name || src.name || job?.customer_name || '',
    email: src.email || job?.customer_email || '',
    phone: src.phone || '',
    website: src.website || '',
    address: src.address || '',
    city: src.city || '',
    state: src.state || '',
    zip: src.zip || '',
    category: src.category || '',
    description: src.description || ''
  };
}

async function updateJobStatus(jobId, patch) {
  const payload = {
    ...patch,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('jobs')
    .update(payload)
    .eq('id', jobId);

  if (error) {
    throw error;
  }
}

async function updateSubmissionStatus(submissionId, patch) {
  const payload = {
    ...patch,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase
    .from('directory_submissions')
    .update(payload)
    .eq('id', submissionId);

  if (error) {
    throw error;
  }
}

async function fetchNextJobWithSubmissions() {
  // Fetch the next pending or in_progress job deterministically
  const { data: jobs, error: jobError } = await supabase
    .from('jobs')
    .select(`
      id,
      status,
      package_size,
      package_type,
      customer_id,
      business_data,
      customer_name,
      customer_email,
      started_at,
      completed_at,
      error_message
    `)
    .in('status', ['pending', 'in_progress'])
    .order('created_at', { ascending: true })
    .limit(1);

  if (jobError) {
    throw jobError;
  }

  if (!jobs || jobs.length === 0) {
    return null;
  }

  const job = jobs[0];

  // Fetch submissions for this job via submission_queue_id = job.id
  const { data: submissions, error: submissionError } = await supabase
    .from('directory_submissions')
    .select(`
      id,
      status,
      directory_url,
      listing_data,
      submission_queue_id,
      customer_id
    `)
    .eq('submission_queue_id', job.id)
    .in('status', ['pending', 'submitting'])
    .order('created_at', { ascending: true });

  if (submissionError) {
    throw submissionError;
  }

  if (!submissions || submissions.length === 0) {
    return { job, submissions: [] };
  }

  return { job, submissions };
}

// Heartbeat function
let currentStatus = 'starting';
let desiredState = 'running';
async function sendHeartbeat() {
  try {
    const { error } = await supabase.from('worker_status').upsert({
      worker_id: WORKER_ID,
      last_heartbeat: new Date().toISOString(),
      status: currentStatus,
      desired_state: desiredState
    }, { onConflict: 'worker_id' });
    if (error) throw error;
  } catch (error) {
    log(`Error sending heartbeat: ${error.message}`);
  }
}

// Helper function for random delays
const randomDelay = (min, max) => new Promise(res => setTimeout(res, Math.random() * (max - min) + min));

async function submitWithPlaywright(directory_url, mapping, businessData) {
  const browser = await playwright.chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    log(`Navigating to ${directory_url}`);
    await page.goto(directory_url, { waitUntil: 'networkidle' });

    const recaptchaElement = await page.$('.g-recaptcha');
    if (recaptchaElement) {
      log('reCAPTCHA detected. Attempting to solve...');
      const sitekey = await recaptchaElement.getAttribute('data-sitekey');
      if (sitekey) {
        const result = await solver.recaptcha(sitekey, directory_url);
        const captchaSolution = result.data;
        await page.evaluate((token) => {
          document.getElementById('g-recaptcha-response').innerHTML = token;
        }, captchaSolution);
        log('CAPTCHA solution injected.');
      } else {
        log('Could not find sitekey for reCAPTCHA.');
      }
    }

    for (const key in mapping) {
      const selector = mapping[key];
      const value = businessData[key];
      if (selector && value) {
        await randomDelay(100, 350);
        log(`Filling selector "${selector}" with value "${value}"`);
        await page.fill(selector, value);
      }
    }

    await randomDelay(200, 500);
    const submitButton = page.locator('input[type="submit"], button[type="submit"], button:has-text("Submit"), button:has-text("submit")');
    await submitButton.first().click();

    log('Form submitted.');
    await page.waitForLoadState('networkidle');
    log('Submission page loaded.');

    const pageContent = await page.content();
    const prompt = `Analyze the following HTML content... Determine if the submission was successful. Respond with only "success" or "failure".\n\nHTML:${pageContent}`;
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }]
    });
    const prediction = response.content[0].text.trim().toLowerCase();

    log(`AI prediction for submission: ${prediction}`);
    return prediction === 'success' 
      ? { success: true, message: 'AI predicted submission was successful.' }
      : { success: false, message: 'AI predicted submission failed.' };

  } catch (error) {
    log(`Error during Playwright submission: ${error.message}`);
    return { success: false, message: `Playwright error: ${error.message}` };
  } finally {
    await browser.close();
  }
}

async function getFormHtml(url) {
    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: 'networkidle' });
        return await page.content();
    } finally {
        await browser.close();
    }
}

// Main Poller Logic
async function pollForJobs() {
  try {
    const { data: statusData } = await supabase
      .from('worker_status')
      .select('desired_state')
      .eq('worker_id', WORKER_ID)
      .single();

    desiredState = statusData && statusData.desired_state === 'paused' ? 'paused' : 'running';

    if (desiredState === 'paused') {
      log('Worker is paused.');
      currentStatus = 'paused';
      return;
    }

    const jobBundle = await fetchNextJobWithSubmissions();

    if (!jobBundle) {
      currentStatus = 'idle';
      log('No pending jobs.');
      return;
    }

    const { job, submissions } = jobBundle;

    if (!submissions.length) {
      log(`Job ${job.id} has no pending submissions. Marking as failed.`);
      await updateJobStatus(job.id, {
        status: 'failed',
        error_message: 'No pending submissions available for processing',
        completed_at: new Date().toISOString()
      });
      currentStatus = 'idle';
      return;
    }

    desiredState = 'running';
    currentStatus = 'running';

    await updateJobStatus(job.id, {
      status: 'in_progress',
      started_at: job.started_at || new Date().toISOString(),
      error_message: null
    });

    let completedCount = 0;
    let failedCount = 0;

    for (const submission of submissions) {
      const directoryUrl = submission.directory_url;

      if (!directoryUrl) {
        log(`Submission ${submission.id} has no directory URL. Marking as failed.`);
        await updateSubmissionStatus(submission.id, {
          status: 'failed',
          result_message: 'Missing directory URL for submission'
        });
        failedCount += 1;
        continue;
      }

      await updateSubmissionStatus(submission.id, { status: 'submitting' });

      let mapping;
      let isFallbackMapping = false;
      const { data: existingMapping } = await supabase
        .from('directory_form_mappings')
        .select('field_mappings')
        .eq('directory_url', directoryUrl)
        .maybeSingle();

      if (existingMapping && existingMapping.field_mappings) {
        log(`Found existing mapping for ${directoryUrl}`);
        mapping = existingMapping.field_mappings;
      } else {
        log(`No mapping found for ${directoryUrl}. Fetching HTML to analyze...`);
        const formHtml = await getFormHtml(directoryUrl);
        
        // Improved prompt for better Gemini responses
        const prompt = `
You are analyzing an HTML form for a business directory submission.

Your job: Map business data fields to CSS selectors on this form.

Business data fields we have:
- business_name: The company name
- email: Contact email
- phone: Contact phone number
- website: Company website URL
- address: Street address
- city: City
- state: State/Province
- zip: Postal code
- description: Business description (300 chars)
- category: Business category/industry

Return ONLY a JSON object. Each key is a business field. Each value is a CSS selector string that matches an input/select/textarea on the form that should receive that value.

If a field doesn't exist on the form, set the value to null.
Do NOT return code blocks, markdown, or any text. Return ONLY the raw JSON object.

Form HTML:
${formHtml}

Example output format (NO CODE BLOCKS):
{"business_name":"input[name='company']","email":"input#email","phone":null,"website":"input[name='website']",...}

Return only the JSON object, nothing else.
`;

        try {
          // Use retry logic for Gemini API calls
          const result = await callGeminiWithRetry(prompt);
          const text = result.response.text();
          
          // Parse JSON with fallback
          const parseResult = parseJsonWithFallback(text, directoryUrl);
          mapping = parseResult.mapping;
          isFallbackMapping = parseResult.isFallback;
          
          log(`AI generated mapping for ${directoryUrl}: ${JSON.stringify(mapping)}`);
          log(`Mapping source for ${directoryUrl}: ${isFallbackMapping ? 'fallback' : 'real'}`);
          
          // Save mapping to database
          await supabase.from('directory_form_mappings').insert({
            directory_url: directoryUrl,
            field_mappings: mapping
          });
          log(`Saved new mapping for ${directoryUrl} (source: ${isFallbackMapping ? 'fallback' : 'real'})`);
        } catch (e) {
          log(`Failed to generate form mapping for ${directoryUrl}: ${e.message}`);
          log(`Using fallback mapping for ${directoryUrl}`);
          mapping = FALLBACK_MAPPING;
          isFallbackMapping = true;
          
          // Save fallback mapping to database
          await supabase.from('directory_form_mappings').insert({
            directory_url: directoryUrl,
            field_mappings: mapping
          });
          log(`Saved fallback mapping for ${directoryUrl}`);
        }
      }

      const businessData = buildBusinessDataFromSubmission(submission, job);
      log(`Using payload for submission ${submission.id} (job ${job.id}): business_name="${businessData.business_name}" email="${businessData.email}" customer_id=${submission.customer_id}`);
      const submissionResult = await submitWithPlaywright(directoryUrl, mapping, businessData);

      await updateSubmissionStatus(submission.id, {
        status: submissionResult.success ? 'submitted' : 'failed',
        result_message: submissionResult.message
      });

      if (submissionResult.success) {
        completedCount += 1;
      } else {
        failedCount += 1;
      }
    }

    const finalStatus = failedCount > 0 ? 'failed' : 'completed';

    await updateJobStatus(job.id, {
      status: finalStatus,
      completed_at: new Date().toISOString(),
      error_message: failedCount > 0 ? `Failed ${failedCount} submission(s)` : null
    });

    log(
      `Job ${job.id} finished with status: ${finalStatus}. Completed: ${completedCount}, Failed: ${failedCount}`
    );

    currentStatus = failedCount > 0 ? 'error' : 'idle';
  } catch (error) {
    currentStatus = 'error';
    log(`Error in main poller: ${error.message}`);
  }
}

// Run poller and heartbeat
setInterval(pollForJobs, POLL_INTERVAL);
setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
log(`Poller started with WORKER_ID: ${WORKER_ID}`);