// Test worker status and connectivity
const axios = require('axios');

async function testWorkerStatus() {
  console.log('🧪 Testing worker status and connectivity...');
  
  try {
    // Test 1: Check if worker can reach the backend
    console.log('🔍 Testing worker connectivity to backend...');
    const statusResponse = await axios.get('https://directorybolt.netlify.app/api/status', {
      timeout: 10000
    });
    console.log('✅ Backend is reachable:', statusResponse.status);
    
    // Test 2: Check if worker can get next job
    console.log('🔍 Testing job fetching with worker credentials...');
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
    
    // Test 3: Check if there are any jobs available
    if (nextJobResponse.data && nextJobResponse.data.data && nextJobResponse.data.data.job) {
      const job = nextJobResponse.data.data.job;
      console.log('🎯 Found job to process:');
      console.log('  Job ID:', job.jobId);
      console.log('  Customer:', job.customerName);
      console.log('  Status:', job.status);
      console.log('  Package:', job.packageType);
      
      // Test 4: Simulate a progress update
      console.log('🔍 Testing job progress update...');
      const updateResponse = await axios.post('https://directorybolt.netlify.app/api/autobolt/jobs/update', {
        jobId: job.jobId,
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
      
    } else {
      console.log('❌ No jobs available for processing');
    }
    
  } catch (error) {
    console.log('❌ Error details:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
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

testWorkerStatus().catch(console.error);
