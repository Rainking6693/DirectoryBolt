// Test the complete API with the actual job ID from the logs
const axios = require('axios');

const API_KEY = '718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622';
const BASE_URL = 'https://directorybolt.netlify.app';

// Use the actual job ID from your logs
const jobId = '83c7b118-fbd4-49b9-b91d-38701d375a2a';

async function testCompleteWithRealJob() {
  console.log('🔍 Testing complete API with real job ID:', jobId);
  console.log('━'.repeat(60));
  
  const payload = {
    jobId: jobId,
    finalStatus: 'complete',
    summary: {
      totalDirectories: 1,
      successfulSubmissions: 1,
      failedSubmissions: 0,
      processingTimeSeconds: 0
    }
  };
  
  console.log('📤 Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await axios.post(`${BASE_URL}/api/autobolt/jobs/complete`, payload, {
      headers: {
        'X-API-Key': API_KEY,
        'X-Worker-ID': 'test-worker',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Status:', response.status);
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Status:', error.response?.status);
    console.log('❌ Error Response:', JSON.stringify(error.response?.data, null, 2));
    console.log('❌ Full Error:', error.message);
    
    // Check if it's a Supabase connection issue
    if (error.response?.data?.error?.includes('supabase') || 
        error.response?.data?.error?.includes('database') ||
        error.response?.data?.error?.includes('connection')) {
      console.log('\n🔍 This looks like a Supabase connection issue!');
    }
  }
}

testCompleteWithRealJob();
