#!/usr/bin/env node

/**
 * End-to-End Automation Test
 * Tests the complete flow from customer creation to worker processing
 */

require('dotenv').config({ path: '.env.local' });
const axios = require('axios');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const STAFF_API_KEY = process.env.STAFF_API_KEY || 'DirectoryBolt-Staff-2025-SecureKey';
const WORKER_API_KEY = process.env.AUTOBOLT_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testCustomerCreation() {
  logStep(1, 'Creating test customer...');
  
  const customerData = {
    business_name: `Test Business ${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    phone: '555-1234',
    website: 'https://testbusiness.com',
    address: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zip: '12345',
    package_type: 'starter',
    directory_limit: 50
  };

  try {
    const response = await axios.post(
      `${BASE_URL}/api/staff/customers/create`,
      customerData,
      {
        headers: {
          'X-Staff-Key': STAFF_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success && response.data.data) {
      logSuccess(`Customer created: ${response.data.data.id}`);
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'Failed to create customer');
    }
  } catch (error) {
    logError(`Failed to create customer: ${error.message}`);
    if (error.response) {
      logError(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

async function testJobFetching() {
  logStep(2, 'Fetching next job from worker API...');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/autobolt/jobs/next`,
      {
        headers: {
          'Authorization': `Bearer ${WORKER_API_KEY}`,
          'X-Worker-ID': 'test-worker-001'
        }
      }
    );

    if (response.data.success && response.data.data) {
      const job = response.data.data;
      logSuccess(`Job fetched: ${job.jobId}`);
      logInfo(`  Customer: ${job.customerName || 'Unknown'}`);
      logInfo(`  Package: ${job.packageType} (${job.directoryLimit} directories)`);
      logInfo(`  Status: ${job.status}`);
      return job;
    } else if (response.data.success && !response.data.data) {
      logInfo('No jobs available in queue');
      return null;
    } else {
      throw new Error(response.data.error || 'Failed to fetch job');
    }
  } catch (error) {
    logError(`Failed to fetch job: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

async function testJobUpdate(jobId) {
  logStep(3, 'Simulating directory submission...');
  
  const testResults = [
    {
      directory_id: 'test-directory-1',
      directory_name: 'Test Directory 1',
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      screenshot_url: 'https://example.com/screenshot1.png'
    },
    {
      directory_id: 'test-directory-2',
      directory_name: 'Test Directory 2',
      status: 'failed',
      submitted_at: new Date().toISOString(),
      error_message: 'Test error message'
    }
  ];

  try {
    const response = await axios.post(
      `${BASE_URL}/api/autobolt/jobs/update`,
      {
        jobId,
        directoryResults: testResults,
        status: 'in_progress'
      },
      {
        headers: {
          'Authorization': `Bearer ${WORKER_API_KEY}`,
          'X-Worker-ID': 'test-worker-001',
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      logSuccess(`Job updated with ${testResults.length} directory results`);
      logInfo(`  Submitted: ${testResults.filter(r => r.status === 'submitted').length}`);
      logInfo(`  Failed: ${testResults.filter(r => r.status === 'failed').length}`);
      return response.data;
    } else {
      throw new Error(response.data.error || 'Failed to update job');
    }
  } catch (error) {
    logError(`Failed to update job: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

async function testJobCompletion(jobId) {
  logStep(4, 'Completing job...');
  
  const summary = {
    totalDirectories: 2,
    successfulSubmissions: 1,
    failedSubmissions: 1,
    processingTimeSeconds: 30
  };

  try {
    const response = await axios.post(
      `${BASE_URL}/api/autobolt/jobs/complete`,
      {
        jobId,
        finalStatus: 'complete',
        summary
      },
      {
        headers: {
          'Authorization': `Bearer ${WORKER_API_KEY}`,
          'X-Worker-ID': 'test-worker-001',
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data.success) {
      logSuccess(`Job completed successfully`);
      logInfo(`  Total: ${summary.totalDirectories}`);
      logInfo(`  Successful: ${summary.successfulSubmissions}`);
      logInfo(`  Failed: ${summary.failedSubmissions}`);
      return response.data;
    } else {
      throw new Error(response.data.error || 'Failed to complete job');
    }
  } catch (error) {
    logError(`Failed to complete job: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

async function testQueueView() {
  logStep(5, 'Checking staff queue view...');
  
  try {
    const response = await axios.get(
      `${BASE_URL}/api/staff/queue`,
      {
        headers: {
          'X-Staff-Key': STAFF_API_KEY
        }
      }
    );

    if (response.data.success) {
      const jobs = response.data.jobs || [];
      logSuccess(`Queue view loaded: ${jobs.length} jobs`);
      
      if (jobs.length > 0) {
        jobs.forEach((job, index) => {
          logInfo(`  Job ${index + 1}: ${job.business_name}`);
          logInfo(`    Status: ${job.status}`);
          logInfo(`    Progress: ${job.progress_percentage}%`);
          logInfo(`    Directories: ${job.directories_submitted}/${job.directories_allocated}`);
        });
      }
      
      return response.data;
    } else {
      throw new Error(response.data.error || 'Failed to load queue');
    }
  } catch (error) {
    logError(`Failed to load queue: ${error.message}`);
    if (error.response) {
      logError(`Status: ${error.response.status}`);
      logError(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    throw error;
  }
}

async function runFullTest() {
  log('\n' + '='.repeat(60), 'bright');
  log('END-TO-END AUTOMATION TEST', 'bright');
  log('='.repeat(60), 'bright');
  
  log(`\nBase URL: ${BASE_URL}`, 'yellow');
  log(`Worker API Key: ${WORKER_API_KEY ? 'Set (' + WORKER_API_KEY.substring(0, 20) + '...)' : 'NOT SET'}`, 'yellow');
  log(`Staff API Key: ${STAFF_API_KEY ? 'Set' : 'NOT SET'}`, 'yellow');
  
  let customer = null;
  let job = null;
  
  try {
    // Step 1: Create customer
    customer = await testCustomerCreation();
    await sleep(1000);
    
    // Step 2: Fetch job
    job = await testJobFetching();
    
    if (!job) {
      logError('No job available to test. Please create a customer first.');
      return;
    }
    
    await sleep(1000);
    
    // Step 3: Update job with directory results
    await testJobUpdate(job.jobId);
    await sleep(1000);
    
    // Step 4: Complete job
    await testJobCompletion(job.jobId);
    await sleep(1000);
    
    // Step 5: Check queue view
    await testQueueView();
    
    log('\n' + '='.repeat(60), 'bright');
    logSuccess('ALL TESTS PASSED! 🎉');
    log('='.repeat(60), 'bright');
    
  } catch (error) {
    log('\n' + '='.repeat(60), 'bright');
    logError('TEST FAILED');
    log('='.repeat(60), 'bright');
    logError(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the test
runFullTest().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});

