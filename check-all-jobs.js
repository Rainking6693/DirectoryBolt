// Check all jobs in the database to see their status
const axios = require('axios');

const API_KEY = '718e8866b81ecc6527dfc1b640e103e6741d844f4438286210d652ca02ee4622';
const BASE_URL = 'https://directorybolt.netlify.app';

async function checkAllJobs() {
  console.log('🔍 Checking all jobs in the database');
  console.log('━'.repeat(60));
  
  try {
    // Try to get the staff queue data which shows all jobs
    const response = await axios.get(`${BASE_URL}/api/staff/queue`, {
      headers: {
        'X-API-Key': API_KEY
      }
    });
    
    if (response.data.success && response.data.data) {
      const queueData = response.data.data;
      console.log('📊 Queue Statistics:');
      console.log('   - Pending:', queueData.stats.pending);
      console.log('   - Processing:', queueData.stats.processing);
      console.log('   - Completed:', queueData.stats.completed);
      console.log('   - Failed:', queueData.stats.failed);
      console.log('   - Total:', queueData.stats.total);
      
      if (queueData.queue && queueData.queue.length > 0) {
        console.log('\n📋 Jobs in queue:');
        queueData.queue.forEach((job, index) => {
          console.log(`   ${index + 1}. ${job.customer_id} - ${job.status} (${job.package_type})`);
        });
      } else {
        console.log('\n❌ No jobs found in queue');
      }
    } else {
      console.log('❌ Failed to get queue data:', response.data);
    }
  } catch (error) {
    console.log('❌ Error getting queue data:', error.response?.data || error.message);
  }
}

checkAllJobs();
