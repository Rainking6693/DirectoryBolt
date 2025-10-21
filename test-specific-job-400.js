// Test the specific job that's failing with 400 error
const axios = require('axios');

const API_KEY = '718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622';
const BASE_URL = 'https://directorybolt.netlify.app';

// This is the job ID from your latest logs
const jobId = '72c1f22e-e5f0-41ee-9271-76abe7b0ee79';

async function testSpecificJob400() {
  console.log('🔍 Testing job that\'s getting 400 error');
  console.log('Job ID:', jobId);
  console.log('━'.repeat(60));
  
  // Test 1: Check if this job exists and what status it's in
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
  
  // Test 2: Try to update job to in_progress first
  console.log('\n2️⃣ Testing POST /api/autobolt/jobs/update (set to in_progress)');
  try {
    const updateResponse = await axios.post(`${BASE_URL}/api/autobolt/jobs/update`, {
      jobId: jobId,
      status: 'in_progress'
    }, {
      headers: {
        'X-API-Key': API_KEY,
        'X-Worker-ID': 'test-worker'
      }
    });
    console.log('✅ Update response:', JSON.stringify(updateResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Update error:', error.response?.data || error.message);
    console.log('❌ Status:', error.response?.status);
  }
  
  // Test 3: Now try to complete the job
  console.log('\n3️⃣ Testing POST /api/autobolt/jobs/complete');
  try {
    const completeResponse = await axios.post(`${BASE_URL}/api/autobolt/jobs/complete`, {
      jobId: jobId,
      finalStatus: 'complete',
      summary: {
        totalDirectories: 1,
        successfulSubmissions: 1,
        failedSubmissions: 0,
        processingTimeSeconds: 1
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
    
    // Check if it's still a job status issue
    if (error.response?.data?.error?.includes('not found') || 
        error.response?.data?.error?.includes('not in progress')) {
      console.log('\n🔍 This suggests the job status issue persists!');
    }
  }
}

testSpecificJob400();
