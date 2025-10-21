// Test the Netlify API with detailed error logging
const axios = require('axios');

const API_KEY = '718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622';
const BASE_URL = 'https://directorybolt.netlify.app';

async function testNetlifyAPI() {
  console.log('🔍 Testing Netlify API with detailed debugging');
  console.log('━'.repeat(60));
  
  // Test 1: Check if we can get a job first
  console.log('\n1️⃣ Testing GET /api/autobolt/jobs/next');
  try {
    const nextResponse = await axios.get(`${BASE_URL}/api/autobolt/jobs/next`, {
      headers: {
        'X-API-Key': API_KEY,
        'X-Worker-ID': 'test-worker'
      }
    });
    console.log('✅ Next job response:', JSON.stringify(nextResponse.data, null, 2));
  } catch (error) {
    console.log('❌ Next job error:', error.response?.data || error.message);
  }
  
  // Test 2: Try to complete a job with minimal payload
  console.log('\n2️⃣ Testing POST /api/autobolt/jobs/complete (minimal)');
  try {
    const completeResponse = await axios.post(`${BASE_URL}/api/autobolt/jobs/complete`, {
      jobId: 'test-job-' + Date.now(),
      finalStatus: 'complete'
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
    console.log('❌ Headers:', error.response?.headers);
  }
  
  // Test 3: Check Netlify function logs
  console.log('\n3️⃣ Checking if this is a Netlify function timeout or memory issue');
  console.log('   - 500 errors often indicate:');
  console.log('     • Function timeout (10s limit on free tier)');
  console.log('     • Memory limit exceeded');
  console.log('     • Database connection timeout');
  console.log('     • Missing environment variables');
}

testNetlifyAPI();
