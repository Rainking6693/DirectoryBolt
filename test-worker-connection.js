// Test worker connection to backend
const axios = require('axios');

async function testWorkerConnection() {
  console.log('🧪 Testing worker connection to backend...');
  
  try {
    // Test 1: Check if we can reach the backend
    console.log('🔍 Testing backend connectivity...');
    const statusResponse = await axios.get('https://directorybolt.netlify.app/api/status', {
      timeout: 10000
    });
    console.log('✅ Backend is reachable:', statusResponse.status);
    
    // Test 2: Check if we can get next job (this should work with proper auth)
    console.log('🔍 Testing job fetching...');
    const nextJobResponse = await axios.get('https://directorybolt.netlify.app/api/autobolt/jobs/next', {
      headers: {
        'Authorization': `Bearer 718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622`,
        'X-Worker-ID': 'test-worker-001',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Job fetching works:', nextJobResponse.status);
    console.log('📋 Next job data:', nextJobResponse.data);
    
    // Test 3: Test job update endpoint
    if (nextJobResponse.data && nextJobResponse.data.job) {
      const jobId = nextJobResponse.data.job.id;
      console.log('🔍 Testing job update...');
      
      const updateResponse = await axios.post('https://directorybolt.netlify.app/api/autobolt/jobs/update', {
        jobId: jobId,
        status: 'in_progress',
        directoryResults: [{
          directoryName: 'Test Directory',
          status: 'submitted',
          directoryUrl: 'https://example.com'
        }]
      }, {
        headers: {
          'Authorization': `Bearer 718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622`,
          'X-Worker-ID': 'test-worker-001',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      console.log('✅ Job update works:', updateResponse.status);
      console.log('📋 Update response:', updateResponse.data);
    }
    
  } catch (error) {
    console.log('❌ Error details:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Headers:', error.response?.headers);
    console.log('Data:', error.response?.data);
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.log('❌ Cannot reach backend - check URL and network');
    } else if (error.response?.status === 401) {
      console.log('❌ Authentication failed - check AUTOBOLT_API_KEY');
    } else if (error.response?.status === 404) {
      console.log('❌ Endpoint not found - check API routes');
    }
  }
}

testWorkerConnection().catch(console.error);
