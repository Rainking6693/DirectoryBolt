// Test AutoBolt queue API
const axios = require('axios');

async function testAutoBoltQueueAPI() {
  console.log('🧪 Testing AutoBolt queue API...');
  
  try {
    // Step 1: Login to get session cookie
    console.log('🔐 Logging in to get session cookie...');
    const loginResponse = await axios.post('http://localhost:3000/api/staff/login', {
      username: 'staffuser',
      password: 'DirectoryBoltStaff2025!'
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.error);
    }
    
    console.log('✅ Login successful');
    
    // Extract cookies from login response
    const cookies = loginResponse.headers['set-cookie'];
    if (!cookies) {
      throw new Error('No session cookie received from login');
    }
    
    // Step 2: Test AutoBolt queue API
    console.log('📊 Testing AutoBolt queue API...');
    const queueResponse = await axios.get('http://localhost:3000/api/staff/autobolt-queue', {
      withCredentials: true,
      headers: {
        'Cookie': cookies.join('; ')
      }
    });
    
    if (!queueResponse.data.success) {
      throw new Error('AutoBolt queue API failed: ' + queueResponse.data.error);
    }
    
    console.log('✅ AutoBolt queue API works!');
    console.log('📋 Queue data:');
    console.log('  Total jobs:', queueResponse.data.data.stats.total_jobs);
    console.log('  Pending jobs:', queueResponse.data.data.stats.total_queued);
    console.log('  In progress jobs:', queueResponse.data.data.stats.total_processing);
    console.log('  Completed jobs:', queueResponse.data.data.stats.total_completed);
    console.log('  Failed jobs:', queueResponse.data.data.stats.total_failed);
    console.log('  Queue items:', queueResponse.data.data.queueItems?.length || 0);
    
    if (queueResponse.data.data.queueItems && queueResponse.data.data.queueItems.length > 0) {
      console.log('\n📋 Queue items:');
      queueResponse.data.data.queueItems.slice(0, 3).forEach((item, index) => {
        console.log(`${index + 1}. ${item.businessName} (${item.customerId}) - ${item.status} - ${item.progressPercentage}%`);
      });
    }
    
  } catch (error) {
    console.log('❌ Error details:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Data:', error.response?.data);
  }
}

testAutoBoltQueueAPI().catch(console.error);
