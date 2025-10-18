/**
 * Test with the exact format the Railway worker is sending
 */
const axios = require('axios');

async function testRailwayWorkerFormat() {
  const apiKey = '718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622';
  const baseURL = 'https://directorybolt.com';
  
  console.log('🧪 Testing with Railway worker format...\n');
  
  // Simulate exactly what the Railway worker sends based on the logs
  const railwayWorkerData = {
    jobId: 'ff4d836a-4fad-4c3a-8582-a61669e6e947',
    status: 'in_progress',
    directoryResults: [
      {
        directoryName: 'Libhunt',
        status: 'failed',
        message: 'No success indicator',
        timestamp: new Date().toISOString()
      },
      {
        directoryName: 'Built in Chicago', 
        status: 'submitted',
        message: 'OK',
        timestamp: new Date().toISOString()
      }
    ]
  };
  
  try {
    console.log('📤 Sending Railway worker data:', JSON.stringify(railwayWorkerData, null, 2));
    console.log();
    
    const response = await axios.post(`${baseURL}/api/autobolt/jobs/update`, railwayWorkerData, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ API Response:', JSON.stringify(response.data, null, 2));
    console.log('📊 Status Code:', response.status);
    
    // Wait a moment for the database to process
    console.log('\n⏳ Waiting for database to process...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if data was saved
    console.log('\n🔍 Checking if Railway worker data was saved...');
    
  } catch (error) {
    console.error('❌ API Error:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testRailwayWorkerFormat().catch(console.error);
