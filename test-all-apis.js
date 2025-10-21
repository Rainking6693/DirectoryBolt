// COMPREHENSIVE API AUDIT SCRIPT
// This tests ALL three API endpoints the worker needs

const axios = require('axios');

// Configuration
const API_KEY = '718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622';
const BASE_URL = 'https://directorybolt.netlify.app';

// Test results
const results = {
  passed: [],
  failed: []
};

async function test1_GetNextJob() {
  console.log('\n🔍 TEST 1: GET /api/autobolt/jobs/next');
  console.log('━'.repeat(60));
  
  try {
    const response = await axios.get(`${BASE_URL}/api/autobolt/jobs/next`, {
      headers: {
        'X-API-Key': API_KEY,
        'X-Worker-ID': 'test-worker',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Status:', response.status);
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success !== undefined) {
      results.passed.push('GET /api/autobolt/jobs/next');
      return response.data;
    } else {
      throw new Error('Response missing "success" field');
    }
  } catch (error) {
    console.log('❌ Status:', error.response?.status);
    console.log('❌ Error:', error.response?.data || error.message);
    results.failed.push({
      endpoint: 'GET /api/autobolt/jobs/next',
      error: error.response?.data || error.message
    });
    return null;
  }
}

async function test2_UpdateJobProgress(jobId) {
  console.log('\n🔍 TEST 2: POST /api/autobolt/jobs/update');
  console.log('━'.repeat(60));
  
  const payload = {
    jobId: jobId || 'test-job-id-' + Date.now(),
    status: 'in_progress',
    directoryResults: [
      {
        directoryName: 'Test Directory 1',
        status: 'submitted',
        responseLog: { test: true }
      }
    ]
  };
  
  console.log('📤 Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await axios.post(`${BASE_URL}/api/autobolt/jobs/update`, payload, {
      headers: {
        'X-API-Key': API_KEY,
        'X-Worker-ID': 'test-worker',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });
    
    console.log('✅ Status:', response.status);
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success !== undefined) {
      results.passed.push('POST /api/autobolt/jobs/update');
      return true;
    } else {
      throw new Error('Response missing "success" field');
    }
  } catch (error) {
    console.log('❌ Status:', error.response?.status);
    console.log('❌ Error:', JSON.stringify(error.response?.data || error.message, null, 2));
    results.failed.push({
      endpoint: 'POST /api/autobolt/jobs/update',
      error: error.response?.data || error.message,
      payload: payload
    });
    return false;
  }
}

async function test3_CompleteJob(jobId) {
  console.log('\n🔍 TEST 3: POST /api/autobolt/jobs/complete');
  console.log('━'.repeat(60));
  
  const payload = {
    jobId: jobId || 'test-job-id-' + Date.now(),
    finalStatus: 'complete',
    summary: {
      totalDirectories: 10,
      successfulSubmissions: 8,
      failedSubmissions: 2,
      processingTimeSeconds: 120
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
    
    if (response.data.success !== undefined) {
      results.passed.push('POST /api/autobolt/jobs/complete');
      return true;
    } else {
      throw new Error('Response missing "success" field');
    }
  } catch (error) {
    console.log('❌ Status:', error.response?.status);
    console.log('❌ Error:', JSON.stringify(error.response?.data || error.message, null, 2));
    results.failed.push({
      endpoint: 'POST /api/autobolt/jobs/complete',
      error: error.response?.data || error.message,
      payload: payload
    });
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 DirectoryBolt API Comprehensive Test Suite');
  console.log('═'.repeat(60));
  console.log('Base URL:', BASE_URL);
  console.log('API Key:', API_KEY.substring(0, 20) + '...');
  console.log('═'.repeat(60));
  
  // Test 1: Get next job
  const jobData = await test1_GetNextJob();
  const testJobId = jobData?.data?.jobId || null;
  
  // Test 2: Update job progress (use real job ID if available)
  await test2_UpdateJobProgress(testJobId);
  
  // Test 3: Complete job (use real job ID if available)
  await test3_CompleteJob(testJobId);
  
  // Print summary
  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`✅ Passed: ${results.passed.length}/3`);
  console.log(`❌ Failed: ${results.failed.length}/3`);
  
  if (results.passed.length > 0) {
    console.log('\n✅ Passing Tests:');
    results.passed.forEach(test => console.log(`   - ${test}`));
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ Failing Tests:');
    results.failed.forEach(({ endpoint, error, payload }) => {
      console.log(`   - ${endpoint}`);
      console.log(`     Error: ${JSON.stringify(error)}`);
      if (payload) {
        console.log(`     Payload: ${JSON.stringify(payload)}`);
      }
    });
  }
  
  console.log('\n');
  
  if (results.failed.length === 0) {
    console.log('🎉 ALL TESTS PASSED! Worker should work correctly.');
  } else {
    console.log('⚠️  SOME TESTS FAILED. Review errors above.');
  }
  
  console.log('═'.repeat(60));
}

// Run tests
runAllTests().catch(error => {
  console.error('💥 Fatal error running tests:', error);
  process.exit(1);
});

