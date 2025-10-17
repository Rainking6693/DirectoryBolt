/**
 * Test /jobs/update with the real job ID we just created
 */

const axios = require('axios');

const config = {
  orchestratorBaseUrl: 'https://www.directorybolt.com/api',
  workerAuthToken: '718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622',
  workerId: 'railway-worker-1'
};

// Real job ID from the test customer we just created
const realJobId = '59beac96-45e6-4553-a1d7-2e6b8cae30ad';

async function testUpdate() {
  try {
    console.log('🔍 Testing /jobs/update with real job ID:', realJobId);
    
    const testPayload = {
      jobId: realJobId,
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

    console.log('✅ SUCCESS! /jobs/update works with real job ID');
    console.log(`  Status: ${response.status}`);
    console.log(`  Response:`, response.data);

  } catch (error) {
    console.log('❌ FAILED! /jobs/update failed with real job ID');
    console.log(`  Error: ${error.message}`);
    
    if (error.response) {
      console.log(`  Status: ${error.response.status}`);
      console.log(`  Response:`, error.response.data);
    }
  }
}

testUpdate().catch(console.error);
