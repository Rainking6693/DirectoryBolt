#!/usr/bin/env node
/**
 * CUSTOMER VALIDATION QUICK TEST
 * Test the real customer ID after environment configuration
 */

const https = require('https');

const CUSTOMER_ID = 'DIR-202597-recwsFS91NG2O90xi';
const BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://directorybolt.com' 
    : 'http://localhost:3000';

async function testCustomerValidation() {
    console.log('🧪 Testing Customer Validation...');
    console.log(`Customer ID: ${CUSTOMER_ID}`);
    console.log(`URL: ${BASE_URL}`);
    
    const postData = JSON.stringify({
        customerId: CUSTOMER_ID,
        extensionVersion: '1.0.0',
        timestamp: Date.now()
    });

    const options = {
        hostname: BASE_URL.replace(/https?:\/\//, ''),
        port: BASE_URL.includes('localhost') ? 3000 : 443,
        path: '/api/extension/validate',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const response = JSON.parse(data);
                    resolve({ status: res.statusCode, data: response });
                } catch (e) {
                    resolve({ status: res.statusCode, data: { parseError: e.message }, raw: data });
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function runTest() {
    try {
        const result = await testCustomerValidation();
        
        console.log(`\nResponse Status: ${result.status}`);
        console.log('Response Data:', JSON.stringify(result.data, null, 2));
        
        if (result.status === 200 && result.data.valid) {
            console.log('\n✅ SUCCESS: Customer validation working');
            console.log(`Customer Name: ${result.data.customerName}`);
            console.log(`Package Type: ${result.data.packageType}`);
            
            // Verify expected data
            if (result.data.customerName && result.data.customerName.includes('DirectoryBolt')) {
                console.log('✅ Customer name matches expected');
            } else {
                console.log(`⚠️  Customer name unexpected: ${result.data.customerName}`);
            }
            
        } else {
            console.log('\n❌ FAILED: Customer validation not working');
            console.log(`Error: ${result.data.error || 'Unknown error'}`);
        }
        
    } catch (error) {
        console.log('\n❌ TEST FAILED:', error.message);
    }
}

if (require.main === module) {
    runTest();
}

module.exports = { testCustomerValidation, CUSTOMER_ID };
