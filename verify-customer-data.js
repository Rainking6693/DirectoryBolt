const https = require('https');

// SECURITY FIX: Credentials moved to environment variables
const apiToken = process.env.AIRTABLE_ACCESS_TOKEN;
const baseId = process.env.AIRTABLE_BASE_ID || 'appZDNMzebkaOkLXo';
const tableName = 'Directory Bolt Import';
const targetCustomerId = 'DIR-202597-recwsFS91NG2O90xi';

const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;

console.log('🔍 VERIFICATION TEST: Checking customer data for', targetCustomerId);
console.log('📊 Connecting to Airtable...');

const options = {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${apiToken}`,
    'Content-Type': 'application/json'
  }
};

const req = https.request(url, options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      
      console.log('✅ API Response received');
      console.log('📊 Total records:', result.records?.length || 0);
      
      if (!result.records) {
        console.log('❌ No records found in response');
        console.log('Raw response:', data);
        return;
      }
      
      // Search for the target customer ID
      let found = false;
      for (const record of result.records) {
        const fields = record.fields || {};
        
        // Check all field values for the customer ID
        for (const [fieldName, fieldValue] of Object.entries(fields)) {
          if (typeof fieldValue === 'string' && fieldValue.includes(targetCustomerId)) {
            found = true;
            console.log('\n🎯 FOUND TARGET CUSTOMER:');
            console.log('Record ID:', record.id);
            console.log('Field containing customer ID:', fieldName, '=', fieldValue);
            console.log('\n📋 Complete record:');
            console.log(JSON.stringify(fields, null, 2));
            break;
          }
        }
        
        if (found) break;
      }
      
      if (!found) {
        console.log('\n❌ TARGET CUSTOMER NOT FOUND');
        console.log('\n📋 Sample records for debugging:');
        result.records.slice(0, 3).forEach((record, i) => {
          console.log(`\nRecord ${i + 1}:`);
          console.log('Fields:', Object.keys(record.fields || {}));
          console.log('Sample values:', Object.entries(record.fields || {}).slice(0, 3));
        });
      }
      
    } catch (e) {
      console.error('❌ Error parsing response:', e.message);
      console.log('Raw response:', data.substring(0, 500) + '...');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
});

req.end();