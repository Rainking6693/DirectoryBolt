// Test the jobs complete API endpoint
const axios = require('axios');

const API_KEY = '718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622';
const BASE_URL = 'https://directorybolt.netlify.app';

async function testCompleteAPI() {
  try {
    console.log('Testing jobs complete API...');
    
    const response = await axios.post(`${BASE_URL}/api/autobolt/jobs/complete`, {
      jobId: 'test-job-id',
      finalStatus: 'complete',
      summary: {
        total: 1,
        submitted: 1,
        failed: 0,
        success_rate: 1.0
      }
    }, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ API Response:', response.data);
  } catch (error) {
    console.log('❌ API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
  }
}

testCompleteAPI();
