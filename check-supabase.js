// Check Supabase Database Schema
const https = require('https');

const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbGdxZmpnbmNkd2RkemlxbG96Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjczODc2MSwiZXhwIjoyMDcyMzE0NzYxfQ.xPoR2Q_yey7AQcorPG3iBLKTadzzSEMmK3eM9ZW46Qc';
const BASE_URL = 'https://kolgqfjgncdwddziqloz.supabase.co';

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}/rest/v1/${path}`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'apikey': API_KEY,
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (error) => reject(error));
    req.end();
  });
}

async function checkSchema() {
  console.log('\n=== Checking Supabase Database Schema ===\n');

  // 1. Check customers table
  console.log('1. Checking CUSTOMERS table...');
  try {
    const result = await makeRequest('customers?select=*&limit=1');
    if (result.status === 200) {
      if (result.data.length > 0) {
        console.log('   ✓ Customers table exists');
        console.log('   Columns:', Object.keys(result.data[0]).join(', '));
        console.log('   Has "status" column?', 'status' in result.data[0] ? 'YES ❌' : 'NO ✓');
        console.log('   Has "id" column?', 'id' in result.data[0] ? 'YES' : 'NO');
        console.log('   Has "customer_id" column?', 'customer_id' in result.data[0] ? 'YES ✓' : 'NO ❌');
      } else {
        console.log('   ✓ Customers table exists (empty)');
      }
    } else {
      console.log('   ✗ Error:', result.status, result.data);
    }
  } catch (error) {
    console.log('   ✗ Error:', error.message);
  }
  console.log('');

  // 2. Check jobs table
  console.log('2. Checking JOBS table...');
  try {
    const result = await makeRequest('jobs?select=*&limit=1');
    if (result.status === 200) {
      if (result.data.length > 0) {
        console.log('   ✓ Jobs table exists');
        console.log('   Columns:', Object.keys(result.data[0]).join(', '));
        console.log('   Has "status" column?', 'status' in result.data[0] ? 'YES ✓' : 'NO ❌');
        console.log('   Has "customer_id" column?', 'customer_id' in result.data[0] ? 'YES ✓' : 'NO ❌');
      } else {
        console.log('   ✓ Jobs table exists (empty)');
      }
    } else {
      console.log('   ✗ Error:', result.status, result.data);
    }
  } catch (error) {
    console.log('   ✗ Error:', error.message);
  }
  console.log('');

  // 3. Check directory_submissions table
  console.log('3. Checking DIRECTORY_SUBMISSIONS table...');
  try {
    const result = await makeRequest('directory_submissions?select=*&limit=1');
    if (result.status === 200) {
      if (result.data.length > 0) {
        console.log('   ✓ Directory_submissions table exists');
        console.log('   Columns:', Object.keys(result.data[0]).join(', '));
      } else {
        console.log('   ✓ Directory_submissions table exists (empty)');
      }
    } else {
      console.log('   ✗ Error:', result.status, result.data);
    }
  } catch (error) {
    console.log('   ✗ Error:', error.message);
  }
  console.log('');

  // 4. Check directories table
  console.log('4. Checking DIRECTORIES table...');
  try {
    const result = await makeRequest('directories?select=id,name,active&limit=5');
    if (result.status === 200) {
      console.log(`   ✓ Directories table exists (${result.data.length} found)`);
      result.data.forEach(dir => {
        const status = dir.active ? 'ACTIVE' : 'INACTIVE';
        console.log(`     - ${dir.name} [${status}]`);
      });
    } else {
      console.log('   ✗ Error:', result.status, result.data);
    }
  } catch (error) {
    console.log('   ✗ Error:', error.message);
  }
  console.log('');

  // 5. Check autobolt_submission_logs table
  console.log('5. Checking AUTOBOLT_SUBMISSION_LOGS table...');
  try {
    const result = await makeRequest('autobolt_submission_logs?select=*&limit=1');
    if (result.status === 200) {
      if (result.data.length > 0) {
        console.log('   ✓ Autobolt_submission_logs table exists');
        console.log('   Columns:', Object.keys(result.data[0]).join(', '));
      } else {
        console.log('   ✓ Autobolt_submission_logs table exists (empty)');
      }
    } else {
      console.log('   ✗ Error:', result.status, result.data);
    }
  } catch (error) {
    console.log('   ✗ Error:', error.message);
  }
  console.log('');

  // 6. Count active directories
  console.log('6. Counting ACTIVE directories...');
  try {
    const result = await makeRequest('directories?select=id&active=eq.true');
    if (result.status === 200) {
      console.log(`   ✓ Found ${result.data.length} active directories`);
      if (result.data.length === 0) {
        console.log('   ⚠ WARNING: No active directories! Poller will fail.');
      }
    } else {
      console.log('   ✗ Error:', result.status, result.data);
    }
  } catch (error) {
    console.log('   ✗ Error:', error.message);
  }
  console.log('');

  console.log('=== Schema Check Complete ===\n');
}

checkSchema().catch(console.error);
