/**
 * Test the autobolt jobs update API
 */
const axios = require('axios');

async function testApiUpdate() {
  const apiKey = '718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622';
  const baseURL = 'https://directorybolt.com';
  
  console.log('🧪 Testing API update endpoint...\n');
  
  // Test data similar to what the worker sends
  const testData = {
    jobId: 'ff4d836a-4fad-4c3a-8582-a61669e6e947', // Use the actual job ID from logs
    status: 'in_progress',
    directoryResults: [
      {
        directoryName: 'Test Directory',
        status: 'failed',
        message: 'Test failure',
        timestamp: new Date().toISOString()
      }
    ]
  };
  
  try {
    console.log('📤 Sending test data:', JSON.stringify(testData, null, 2));
    console.log();
    
    const response = await axios.post(`${baseURL}/api/autobolt/jobs/update`, testData, {
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

testApiUpdate().catch(console.error);

