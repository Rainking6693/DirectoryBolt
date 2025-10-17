/**
 * Test Railway Worker Update with Real Job ID
 * 
 * This script tests the /jobs/update endpoint with a real job ID from the database
 * to see if the issue is with the test data or the actual worker data.
 */

const axios = require('axios');

// Railway worker configuration
const config = {
  orchestratorBaseUrl: 'https://www.directorybolt.com/api',
  workerAuthToken: '718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622',
  workerId: 'railway-worker-1'
};

async function getRealJobId() {
  try {
    console.log('🔍 Getting a real job ID from the database...');
    
    const response = await axios.get(`${config.orchestratorBaseUrl}/jobs/next`, {
      headers: {
        'Authorization': `Bearer ${config.workerAuthToken}`,
        'X-Worker-ID': config.workerId,
        'Content-Type': 'application/json',
        'User-Agent': 'DirectoryBolt-Worker/1.0.0',
      },
      timeout: 10000,
    });

    if (response.data.success && response.data.data && response.data.data.job) {
      const jobId = response.data.data.job.id;
      console.log(`✅ Found real job ID: ${jobId}`);
      return jobId;
    } else {
      console.log('❌ No jobs available in queue');
      return null;
    }

  } catch (error) {
    console.log('❌ Failed to get job ID:', error.message);
    return null;
  }
}

async function testUpdateWithRealJobId(jobId) {
  try {
    console.log();
    console.log(`🔍 Testing /jobs/update with real job ID: ${jobId}`);
    
    const testPayload = {
      jobId: jobId,
      status: 'in_progress',
      directoryResults: [{
        directoryName: 'Test Directory',
        status: 'submitted',
        timestamp: new Date().toISOString()
      }]
    };

    console.log('📤 Sending payload:', JSON.stringify(testPayload, null, 2));

    const response = await axios.post(`${config.orchestratorBaseUrl}/jobs/update`, testPayload, {
      headers: {
        'Authorization': `Bearer ${config.workerAuthToken}`,
        'X-Worker-ID': config.workerId,
        'Content-Type': 'application/json',
        'User-Agent': 'DirectoryBolt-Worker/1.0.0',
      },
      timeout: 10000,
    });

    console.log('✅ SUCCESS! Worker can update job status with real job ID');
    console.log(`  Status: ${response.status}`);
    console.log(`  Response:`, response.data);

  } catch (error) {
    console.log('❌ FAILED! Worker cannot update job status with real job ID');
    console.log(`  Error: ${error.message}`);
    
    if (error.response) {
      console.log(`  Status: ${error.response.status}`);
      console.log(`  Response:`, error.response.data);
    }
  }
}

async function runTest() {
  console.log('='.repeat(80));
  console.log('🧪 TESTING WITH REAL JOB ID');
  console.log('='.repeat(80));
  
  const realJobId = await getRealJobId();
  
  if (realJobId) {
    await testUpdateWithRealJobId(realJobId);
  } else {
    console.log('❌ Cannot test - no jobs available');
  }
  
  console.log();
  console.log('='.repeat(80));
  console.log('📋 ANALYSIS:');
  console.log('='.repeat(80));
  console.log();
  console.log('If this test PASSES:');
  console.log('  - The /jobs/update endpoint works with real job IDs');
  console.log('  - The issue was just with the test data ("test-job-id")');
  console.log('  - Railway worker should work fine with real job IDs');
  console.log();
  console.log('If this test FAILS:');
  console.log('  - There is a real issue with the /jobs/update endpoint');
  console.log('  - Need to debug the updateJobProgress function');
  console.log('  - Railway worker will continue to fail');
  console.log();
  console.log('='.repeat(80));
}

runTest().catch(console.error);
