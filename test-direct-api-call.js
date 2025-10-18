/**
 * Test the API endpoint directly to see if it's executing the database insert code
 */
const axios = require('axios');

async function testDirectApiCall() {
  const apiKey = '718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622';
  const baseURL = 'https://directorybolt.com';
  
  console.log('🔍 Testing API endpoint directly...\n');
  
  // Test with the exact same data format the Railway worker sends
  const testData = {
    jobId: 'ff4d836a-4fad-4c3a-8582-a61669e6e947',
    status: 'in_progress',
    directoryResults: [
      {
        directoryName: 'Direct API Test',
        status: 'failed',
        message: 'Direct API test message',
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
    
    // Wait for database to process
    console.log('\n⏳ Waiting for database to process...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if data was saved
    console.log('\n🔍 Checking if data was saved...');
    
  } catch (error) {
    console.error('❌ API Error:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testDirectApiCall().catch(console.error);
