// Test Airtable Connection with Personal Access Token
require('dotenv').config({ path: '.env.local' });

const Airtable = require('airtable');

console.log('Testing Airtable connection...');
console.log('=====================================');

// Check environment variables
const accessToken = process.env.AIRTABLE_ACCESS_TOKEN || process.env.AIRTABLE_API_KEY;
const baseId = process.env.AIRTABLE_BASE_ID;
const tableName = process.env.AIRTABLE_TABLE_NAME;

console.log('Configuration:');
console.log('- Access Token:', accessToken ? `${accessToken.substring(0, 10)}...` : 'NOT SET');
console.log('- Base ID:', baseId || 'NOT SET');
console.log('- Table Name:', tableName || 'NOT SET');
console.log('');

if (!accessToken || !baseId || !tableName) {
  console.error('❌ Missing required configuration!');
  process.exit(1);
}

// Configure Airtable with Personal Access Token
Airtable.configure({
  endpointUrl: 'https://api.airtable.com',
  apiKey: accessToken  // PAT is passed as apiKey in the SDK
});

const base = Airtable.base(baseId);

// Test connection by fetching records
async function testConnection() {
  try {
    console.log('Attempting to connect to Airtable...');
    
    // Try to fetch one record
    const records = await base(tableName).select({
      maxRecords: 1,
      view: 'Grid view'
    }).firstPage();
    
    console.log('✅ Successfully connected to Airtable!');
    console.log(`Found ${records.length} record(s) in table "${tableName}"`);
    
    if (records.length > 0) {
      console.log('\nSample record fields:');
      const fields = Object.keys(records[0].fields);
      fields.forEach(field => {
        console.log(`  - ${field}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Failed to connect to Airtable:');
    console.error('Error:', error.message);
    
    if (error.statusCode === 401) {
      console.error('\n⚠️  Authentication failed. Please check your Personal Access Token.');
    } else if (error.statusCode === 404) {
      console.error('\n⚠️  Base or table not found. Please check your Base ID and Table Name.');
    }
  }
}

testConnection();