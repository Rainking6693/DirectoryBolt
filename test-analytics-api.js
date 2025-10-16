// Test analytics API
const axios = require('axios');

async function testAnalyticsAPI() {
  console.log('🧪 Testing analytics API...');
  
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
    
    // Step 2: Test analytics API
    console.log('📊 Testing analytics API...');
    const analyticsResponse = await axios.get('http://localhost:3000/api/staff/analytics', {
      withCredentials: true,
      headers: {
        'Cookie': cookies.join('; ')
      }
    });
    
    if (!analyticsResponse.data.success) {
      throw new Error('Analytics API failed: ' + analyticsResponse.data.error);
    }
    
    console.log('✅ Analytics API works!');
    console.log('📋 Analytics data:');
    console.log('  Total customers:', analyticsResponse.data.data.overview.total_customers);
    console.log('  Active customers:', analyticsResponse.data.data.overview.active_customers);
    console.log('  Completed customers:', analyticsResponse.data.data.overview.completed_customers);
    console.log('  Pending customers:', analyticsResponse.data.data.overview.pending_customers);
    console.log('  Package breakdown:', analyticsResponse.data.data.package_breakdown);
    console.log('  Directory stats:', analyticsResponse.data.data.directory_stats);
    
  } catch (error) {
    console.log('❌ Error details:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Data:', error.response?.data);
  }
}

testAnalyticsAPI().catch(console.error);
