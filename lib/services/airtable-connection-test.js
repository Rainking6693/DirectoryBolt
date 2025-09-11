#!/usr/bin/env node

/**
 * FRANK - Emergency Airtable Connection Diagnostic
 * Tests real API connectivity and troubleshoots 401 errors
 */

const https = require('https');

const AIRTABLE_TOKEN = process.env.AIRTABLE_ACCESS_TOKEN || 'patpWWU88HJac0C6f.3f037d5baa8c3486634a626b32e9eb8ce6538cb8fb75824b331d9ca49d82cdf0';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || 'appZDNMzebkaOkLXo';
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME || 'Directory Bolt Import';

async function testAirtableConnection() {
    console.log('🔍 FRANK - Testing Airtable API Connection');
    console.log('=====================================');
    
    const options = {
        hostname: 'api.airtable.com',
        port: 443,
        path: `/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
            'Content-Type': 'application/json'
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            console.log(`📡 Response Status: ${res.statusCode}`);
            console.log(`📡 Headers:`, res.headers);
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const parsed = JSON.parse(data);
                        console.log('✅ AIRTABLE CONNECTION SUCCESSFUL');
                        console.log(`📊 Records found: ${parsed.records?.length || 0}`);
                        
                        if (parsed.records && parsed.records.length > 0) {
                            console.log('📋 Sample Customer IDs:');
                            parsed.records.slice(0, 3).forEach((record, i) => {
                                console.log(`  ${i+1}. ${record.fields?.customerID || 'No ID'}`);
                            });
                        }
                        
                        resolve({
                            success: true,
                            statusCode: res.statusCode,
                            recordCount: parsed.records?.length || 0,
                            data: parsed
                        });
                    } else if (res.statusCode === 401) {
                        console.log('❌ AUTHENTICATION FAILED (401)');
                        console.log('🔑 Token being used:', AIRTABLE_TOKEN.substring(0, 20) + '...');
                        console.log('🗂️ Base ID:', AIRTABLE_BASE_ID);
                        console.log('📋 Table Name:', AIRTABLE_TABLE_NAME);
                        console.log('💡 Troubleshooting:');
                        console.log('   - Check token permissions in Airtable');
                        console.log('   - Verify base ID is correct');
                        console.log('   - Confirm table name matches exactly');
                        
                        resolve({
                            success: false,
                            statusCode: res.statusCode,
                            error: 'AUTHENTICATION_REQUIRED',
                            troubleshooting: data
                        });
                    } else {
                        console.log(`❌ UNEXPECTED STATUS: ${res.statusCode}`);
                        console.log('Response:', data);
                        resolve({
                            success: false,
                            statusCode: res.statusCode,
                            error: data
                        });
                    }
                } catch (error) {
                    console.log('❌ JSON PARSE ERROR:', error.message);
                    resolve({
                        success: false,
                        error: 'PARSE_ERROR',
                        rawResponse: data
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            console.log('❌ REQUEST ERROR:', error.message);
            reject({
                success: false,
                error: 'NETWORK_ERROR',
                details: error.message
            });
        });
        
        req.end();
    });
}

async function testCustomerLookup(customerId) {
    console.log('\n🔍 Testing Customer Lookup:', customerId);
    console.log('================================');
    
    const filterFormula = encodeURIComponent(`{customerID} = "${customerId}"`);
    
    const options = {
        hostname: 'api.airtable.com',
        port: 443,
        path: `/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_NAME)}?filterByFormula=${filterFormula}`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
            'Content-Type': 'application/json'
        }
    };
    
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.records && parsed.records.length > 0) {
                        console.log('✅ Customer found:', parsed.records[0].fields);
                        resolve({ success: true, customer: parsed.records[0] });
                    } else {
                        console.log('❌ Customer not found in database');
                        resolve({ success: false, error: 'CUSTOMER_NOT_FOUND' });
                    }
                } catch (error) {
                    console.log('❌ Error parsing response:', error.message);
                    reject(error);
                }
            });
        });
        
        req.on('error', reject);
        req.end();
    });
}

// Run tests if called directly
if (require.main === module) {
    (async () => {
        try {
            const connectionTest = await testAirtableConnection();
            
            if (connectionTest.success) {
                // Test with real customer IDs
                const testCustomers = [
                    'DIR-202597-recwsFS91NG2O90xi',
                    'DIR-2025-001234',
                    'TEST-CUSTOMER-123'
                ];
                
                for (const customerId of testCustomers) {
                    await testCustomerLookup(customerId);
                }
            }
            
            console.log('\n🏁 FRANK DIAGNOSTIC COMPLETE');
            console.log(`🎯 Result: ${connectionTest.success ? 'AIRTABLE WORKING' : 'NEEDS ATTENTION'}`);
            
        } catch (error) {
            console.error('💥 Test failed:', error);
            process.exit(1);
        }
    })();
}

module.exports = { testAirtableConnection, testCustomerLookup };