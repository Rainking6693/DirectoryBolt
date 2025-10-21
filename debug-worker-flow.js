// Debug the exact worker flow to see where it's failing
const axios = require('axios');

const API_KEY = '718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622';
const BASE_URL = 'https://directorybolt.netlify.app';

async function debugWorkerFlow() {
  console.log('🔍 Debugging Worker Flow - Step by Step');
  console.log('━'.repeat(60));
  
  // Step 1: Get next job (what the worker does)
  console.log('\n1️⃣ GET /api/autobolt/jobs/next (what worker does first)');
  try {
    const nextResponse = await axios.get(`${BASE_URL}/api/autobolt/jobs/next`, {
      headers: {
        'X-API-Key': API_KEY,
        'X-Worker-ID': 'debug-worker'
      }
    });
    console.log('✅ Next job response:', JSON.stringify(nextResponse.data, null, 2));
    
    if (!nextResponse.data.success || !nextResponse.data.data) {
      console.log('❌ No jobs available for worker to pick up');
      return;
    }
    
    const job = nextResponse.data.data;
    console.log('📋 Job details:');
    console.log('   - ID:', job.jobId);
    console.log('   - Customer:', job.customerId);
    console.log('   - Status:', job.status);
    console.log('   - Package:', job.packageType);
    
    // Step 2: Try to update to in_progress (what worker should do)
    console.log('\n2️⃣ POST /api/autobolt/jobs/update (set to in_progress)');
    try {
      const updateResponse = await axios.post(`${BASE_URL}/api/autobolt/jobs/update`, {
        jobId: job.jobId,
        status: 'in_progress'
      }, {
        headers: {
          'X-API-Key': API_KEY,
          'X-Worker-ID': 'debug-worker'
        }
      });
      console.log('✅ Update to in_progress successful:', JSON.stringify(updateResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Update to in_progress failed:', error.response?.data || error.message);
      console.log('❌ Status:', error.response?.status);
      return;
    }
    
    // Step 3: Try to complete the job (what worker does next)
    console.log('\n3️⃣ POST /api/autobolt/jobs/complete');
    try {
      const completeResponse = await axios.post(`${BASE_URL}/api/autobolt/jobs/complete`, {
        jobId: job.jobId,
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
          'X-Worker-ID': 'debug-worker'
        }
      });
      console.log('✅ Complete successful:', JSON.stringify(completeResponse.data, null, 2));
    } catch (error) {
      console.log('❌ Complete failed:', error.response?.data || error.message);
      console.log('❌ Status:', error.response?.status);
      
      // Check what the specific error is
      if (error.response?.data?.error) {
        console.log('\n🔍 Specific error details:');
        console.log('   Error:', error.response.data.error);
        if (error.response.data.details) {
          console.log('   Details:', error.response.data.details);
        }
      }
    }
    
  } catch (error) {
    console.log('❌ Failed to get next job:', error.response?.data || error.message);
  }
}

debugWorkerFlow();
