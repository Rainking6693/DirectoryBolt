#!/usr/bin/env node

/**
 * CLIVE - Quick API Endpoint Test
 * Test DirectoryBolt customer validation endpoints
 */

const https = require('https');

async function testEndpoint(hostname, path, method = 'POST', body = null) {
    return new Promise((resolve) => {
        const postData = body ? JSON.stringify(body) : null;
        
        const options = {
            hostname: hostname,
            port: 443,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'CLIVE-Quick-Test/1.0'
            }
        };

        if (postData) {
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        console.log(`🔍 Testing: ${method} https://${hostname}${path}`);

        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const result = {
                    status: res.statusCode,
                    headers: res.headers,
                    body: data
                };
                
                console.log(`   Status: ${res.statusCode}`);
                if (data) {
                    try {
                        const parsed = JSON.parse(data);
                        console.log(`   Response: ${JSON.stringify(parsed, null, 2).substring(0, 200)}...`);
                    } catch (e) {
                        console.log(`   Response: ${data.substring(0, 200)}...`);
                    }
                }
                console.log('');
                resolve(result);
            });
        });

        req.on('error', (error) => {
            console.log(`   Error: ${error.message}`);
            console.log('');
            resolve({ status: 0, error: error.message });
        });

        if (postData) {
            req.write(postData);
        }
        
        req.end();
    });
}

async function runQuickTest() {
    console.log('🔍 CLIVE - Quick API Endpoint Test');
    console.log('=' .repeat(50));
    
    const testPayload = { customerId: 'TEST-123' };
    
    // Test the main endpoint the extension calls
    console.log('📋 Testing Customer Validation Endpoint (Extension calls this):');
    await testEndpoint('directorybolt.com', '/api/customer/validate', 'POST', testPayload);
    
    // Test Netlify Function directly
    console.log('⚡ Testing Netlify Function Directly:');
    await testEndpoint('directorybolt.com', '/.netlify/functions/customer-validate', 'POST', testPayload);
    
    // Test health endpoint
    console.log('🏥 Testing Health Endpoint:');
    await testEndpoint('directorybolt.com', '/api/health/google-sheets', 'GET');
    
    console.log('🎯 Quick test complete. Check results above.');
}

runQuickTest().catch(console.error);