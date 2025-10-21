// Test with the specific job ID from the worker logs
const axios = require('axios');

const API_KEY = '718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622';
const BASE_URL = 'https://directorybolt.netlify.app';

// This is the job ID from your worker logs
const jobId = '83c7b118-fbd4-49b9-b91d-38701d375a2a';

async function testSpecificJob() {
  console.log('🔍 Testing with specific job ID from worker logs');
  console.log('Job ID:', jobId);
  console.log('━'.repeat(60));
  
  // Test 1: Try to get this specific job
  console.log('\n1️⃣ Testing GET /api/autobolt/jobs/[id]');
  try {
    const jobResponse = await axios.get(`${BASE_URL}/api/autobolt/jobs/${jobId}`, {
      headers: {
        'X-API-Key': API_KEY,
        'X-Worker-ID': 'test-worker'
      }
    });
    console.log('✅ Job details:', JSON.stringify(jobResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Job fetch error:', error.response?.data || error.message);
    console.log('❌ Status:', error.response?.status);
  }
  
  // Test 2: Try to complete this specific job
  console.log('\n2️⃣ Testing POST /api/autobolt/jobs/complete');
  try {
    const completeResponse = await axios.post(`${BASE_URL}/api/autobolt/jobs/complete`, {
      jobId: jobId,
      finalStatus: 'complete',
      summary: {
        totalDirectories: 1,
        successfulSubmissions: 1,
        failedSubmissions: 0,
        processingTimeSeconds: 0
      }
    }, {
      headers: {
        'X-API-Key': API_KEY,
        'X-Worker-ID': 'test-worker'
      }
    });
    console.log('✅ Complete response:', JSON.stringify(completeResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Complete error:', error.response?.data || error.message);
    console.log('❌ Status:', error.response?.status);
    
    // Check if it's a job not found error
    if (error.response?.data?.error?.includes('not found') || 
        error.response?.data?.error?.includes('Job not found')) {
      console.log('\n🔍 This suggests the job doesn\'t exist in the database!');
      console.log('   The worker is picking up jobs that may have been deleted or never created.');
    }
  }
}

testSpecificJob();
