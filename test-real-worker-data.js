/**
 * Test with real worker data format
 */
const axios = require('axios');

async function testRealWorkerData() {
  const apiKey = '718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622';
  const baseURL = 'https://directorybolt.com';
  
  console.log('🧪 Testing with real worker data format...\n');
  
  // Simulate what the worker actually sends
  const realWorkerData = {
    jobId: 'ff4d836a-4fad-4c3a-8582-a61669e6e947',
    status: 'in_progress',
    directoryResults: [
      {
        directoryName: 'Libhunt',  // Real directory name from logs
        status: 'failed',
        message: 'No selector worked for field businessName',
        timestamp: new Date().toISOString()
      },
      {
        directoryName: 'TrustRadius',  // Another real directory name
        status: 'failed', 
        message: 'No selector worked for field businessName',
        timestamp: new Date().toISOString()
      }
    ]
  };
  
  try {
    console.log('📤 Sending real worker data:', JSON.stringify(realWorkerData, null, 2));
    console.log();
    
    const response = await axios.post(`${baseURL}/api/autobolt/jobs/update`, realWorkerData, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ API Response:', JSON.stringify(response.data, null, 2));
    console.log('📊 Status Code:', response.status);
    
  } catch (error) {
    console.error('❌ API Error:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testRealWorkerData().catch(console.error);


