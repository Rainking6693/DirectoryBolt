/**
 * Test API endpoint with minimal data to debug the issue
 */
const axios = require('axios');

async function testApiDebug() {
  const apiKey = '718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622';
  const baseURL = 'https://directorybolt.com';
  
  console.log('🔍 Testing API endpoint with minimal data...\n');
  
  // Test with minimal data to see if the API works at all
  const minimalData = {
    jobId: 'ff4d836a-4fad-4c3a-8582-a61669e6e947',
    status: 'in_progress',
    directoryResults: [
      {
        directoryName: 'Debug Test',
        status: 'failed',
        message: 'Debug test message',
        timestamp: new Date().toISOString()
      }
    ]
  };
  
  try {
    console.log('📤 Sending minimal data:', JSON.stringify(minimalData, null, 2));
    console.log();
    
    const response = await axios.post(`${baseURL}/api/autobolt/jobs/update`, minimalData, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ API Response:', JSON.stringify(response.data, null, 2));
    console.log('📊 Status Code:', response.status);
    
    // Check if the API is actually working by looking at the response
    if (response.data.success) {
      console.log('\n🎯 API is working - the issue is in the database insert operations');
    } else {
      console.log('\n❌ API is not working properly');
    }
    
  } catch (error) {
    console.error('❌ API Error:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testApiDebug().catch(console.error);


