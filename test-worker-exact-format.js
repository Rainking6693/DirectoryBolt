/**
 * Test with the exact format the worker is sending
 */
const axios = require('axios');

async function testWorkerExactFormat() {
  const apiKey = '718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622';
  const baseURL = 'https://directorybolt.com';
  
  console.log('🧪 Testing with exact worker format...\n');
  
  // Simulate exactly what the worker sends based on the logs
  const workerData = {
    jobId: 'ff4d836a-4fad-4c3a-8582-a61669e6e947',
    status: 'in_progress',
    directoryResults: [
      {
        directoryName: 'Site Jabber',
        status: 'failed',
        message: 'No success indicator',
        timestamp: new Date().toISOString()
      }
    ]
  };
  
  try {
    console.log('📤 Sending worker data:', JSON.stringify(workerData, null, 2));
    console.log();
    
    const response = await axios.post(`${baseURL}/api/autobolt/jobs/update`, workerData, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ API Response:', JSON.stringify(response.data, null, 2));
    console.log('📊 Status Code:', response.status);
    
    // Check if data was saved
    console.log('\n🔍 Checking if data was saved...');
    
  } catch (error) {
    console.error('❌ API Error:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testWorkerExactFormat().catch(console.error);


