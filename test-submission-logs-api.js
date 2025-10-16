// Test submission logs API
const axios = require('axios');

async function testSubmissionLogsAPI() {
  console.log('🧪 Testing submission logs API...');
  
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
    
    // Step 2: Test submission logs API
    console.log('📊 Testing submission logs API...');
    const logsResponse = await axios.get('http://localhost:3000/api/staff/submission-logs', {
      withCredentials: true,
      headers: {
        'Cookie': cookies.join('; ')
      }
    });
    
    if (!logsResponse.data.success) {
      throw new Error('Submission logs API failed: ' + logsResponse.data.error);
    }
    
    console.log('✅ Submission logs API works!');
    console.log('📋 Submission logs data:');
    console.log('  Total logs:', logsResponse.data.data?.length || 0);
    
    if (logsResponse.data.data && logsResponse.data.data.length > 0) {
      console.log('\n📋 Recent logs:');
      logsResponse.data.data.slice(0, 3).forEach((log, index) => {
        console.log(`${index + 1}. ${log.directory_name} - ${log.action} - ${log.success ? 'Success' : 'Failed'}`);
      });
    } else {
      console.log('📝 No submission logs found (this is expected if no worker has submitted logs yet)');
    }
    
  } catch (error) {
    console.log('❌ Error details:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Data:', error.response?.data);
  }
}

testSubmissionLogsAPI().catch(console.error);
