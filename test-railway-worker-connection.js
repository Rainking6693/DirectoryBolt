/**
 * Test Railway Worker Connection to Production API
 * 
 * This script tests if the Railway worker can successfully connect to the production API
 * using the same configuration as the Railway worker.
 */

const axios = require('axios');

// Railway worker configuration
const config = {
  orchestratorBaseUrl: 'https://www.directorybolt.com/api',
  workerAuthToken: '718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622',
  workerId: 'railway-worker-1'
};

console.log('='.repeat(80));
console.log('🧪 TESTING RAILWAY WORKER CONNECTION');
console.log('='.repeat(80));
console.log();

console.log('📋 Configuration:');
console.log(`  Base URL: ${config.orchestratorBaseUrl}`);
console.log(`  Worker ID: ${config.workerId}`);
console.log(`  Auth Token: ${config.workerAuthToken.substring(0, 20)}...`);
console.log();

async function testConnection() {
  try {
    console.log('🔍 Testing /jobs/next endpoint...');
    
    const response = await axios.get(`${config.orchestratorBaseUrl}/jobs/next`, {
      headers: {
        'Authorization': `Bearer ${config.workerAuthToken}`,
        'X-Worker-ID': config.workerId,
        'Content-Type': 'application/json',
        'User-Agent': 'DirectoryBolt-Worker/1.0.0',
      },
      timeout: 10000,
    });

    console.log('✅ SUCCESS! Worker can connect to production API');
    console.log(`  Status: ${response.status}`);
    console.log(`  Response:`, response.data);
    
    if (response.data.success && response.data.data === null) {
      console.log('  📝 Note: No jobs currently in queue (this is normal)');
    }

  } catch (error) {
    console.log('❌ FAILED! Worker cannot connect to production API');
    console.log(`  Error: ${error.message}`);
    
    if (error.response) {
      console.log(`  Status: ${error.response.status}`);
      console.log(`  Response:`, error.response.data);
    }
    
    if (error.code === 'ENOTFOUND') {
      console.log('  🔍 DNS Issue: Cannot resolve www.directorybolt.com');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('  🔍 Connection Issue: Server is not responding');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('  🔍 Timeout Issue: Server took too long to respond');
    }
  }
}

async function testUpdateEndpoint() {
  try {
    console.log();
    console.log('🔍 Testing /jobs/update endpoint...');
    
    const testPayload = {
      jobId: 'test-job-id',
      status: 'in_progress',
      directoryResults: [{
        directoryName: 'Test Directory',
        status: 'submitted',
        timestamp: new Date().toISOString()
      }]
    };

    const response = await axios.post(`${config.orchestratorBaseUrl}/jobs/update`, testPayload, {
      headers: {
        'Authorization': `Bearer ${config.workerAuthToken}`,
        'X-Worker-ID': config.workerId,
        'Content-Type': 'application/json',
        'User-Agent': 'DirectoryBolt-Worker/1.0.0',
      },
      timeout: 10000,
    });

    console.log('✅ SUCCESS! Worker can update job status');
    console.log(`  Status: ${response.status}`);
    console.log(`  Response:`, response.data);

  } catch (error) {
    console.log('❌ FAILED! Worker cannot update job status');
    console.log(`  Error: ${error.message}`);
    
    if (error.response) {
      console.log(`  Status: ${error.response.status}`);
      console.log(`  Response:`, error.response.data);
    }
  }
}

async function runTests() {
  await testConnection();
  await testUpdateEndpoint();
  
  console.log();
  console.log('='.repeat(80));
  console.log('📋 NEXT STEPS:');
  console.log('='.repeat(80));
  console.log();
  console.log('If tests PASS:');
  console.log('  - Railway worker should be able to connect');
  console.log('  - Check Railway logs for other issues');
  console.log('  - Verify worker is actually running');
  console.log();
  console.log('If tests FAIL:');
  console.log('  - Check if www.directorybolt.com is accessible');
  console.log('  - Verify API endpoints are deployed');
  console.log('  - Check authentication tokens');
  console.log();
  console.log('='.repeat(80));
}

runTests().catch(console.error);
