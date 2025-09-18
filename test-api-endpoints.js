#!/usr/bin/env node

/**
 * API Endpoints Integration Test
 * Tests critical API endpoints to ensure they work with Supabase
 */

require('dotenv').config({ path: '.env.local' });
const http = require('http');

async function testLocalEndpoint(path, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve) => {
        const postData = body ? JSON.stringify(body) : null;
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'DirectoryBolt-Test/1.0',
                ...headers
            }
        };

        if (postData) {
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        console.log(`🔍 Testing: ${method} http://localhost:3000${path}`);

        const req = http.request(options, (res) => {
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

async function runAPITests() {
    console.log('🔍 DirectoryBolt API Endpoints Integration Test');
    console.log('=' .repeat(60));
    
    let testResults = [];
    
    // Test 1: Extension Validation API
    console.log('\n📋 Testing Extension Validation API:');
    try {
        const result = await testLocalEndpoint('/api/extension/validate?customerId=DIR-20250918-123456');
        console.log(`   Status: ${result.status}`);
        if (result.body) {
            try {
                const parsed = JSON.parse(result.body);
                console.log(`   Response: ${JSON.stringify(parsed, null, 2)}`);
                testResults.push({ test: 'Extension Validation', status: result.status, response: parsed });
            } catch (e) {
                console.log(`   Response: ${result.body.substring(0, 200)}...`);
                testResults.push({ test: 'Extension Validation', status: result.status, rawResponse: true });
            }
        }
    } catch (error) {
        console.log(`   Error: ${error.message}`);
        testResults.push({ test: 'Extension Validation', error: error.message });
    }
    
    // Test 2: Admin Customer Stats (with auth)
    console.log('\n📊 Testing Admin Customer Stats API:');
    try {
        const result = await testLocalEndpoint('/api/admin/customers/stats', 'GET', null, {
            'Authorization': `Bearer ${process.env.ADMIN_API_KEY}`
        });
        console.log(`   Status: ${result.status}`);
        if (result.body) {
            try {
                const parsed = JSON.parse(result.body);
                console.log(`   Response: ${JSON.stringify(parsed, null, 2)}`);
                testResults.push({ test: 'Admin Customer Stats', status: result.status, response: parsed });
            } catch (e) {
                console.log(`   Response: ${result.body.substring(0, 200)}...`);
                testResults.push({ test: 'Admin Customer Stats', status: result.status, rawResponse: true });
            }
        }
    } catch (error) {
        console.log(`   Error: ${error.message}`);
        testResults.push({ test: 'Admin Customer Stats', error: error.message });
    }
    
    // Test 3: AutoBolt Queue Status
    console.log('\n🔄 Testing AutoBolt Queue Status API:');
    try {
        const result = await testLocalEndpoint('/api/autobolt/queue-status');
        console.log(`   Status: ${result.status}`);
        if (result.body) {
            try {
                const parsed = JSON.parse(result.body);
                console.log(`   Response: ${JSON.stringify(parsed, null, 2)}`);
                testResults.push({ test: 'AutoBolt Queue Status', status: result.status, response: parsed });
            } catch (e) {
                console.log(`   Response: ${result.body.substring(0, 200)}...`);
                testResults.push({ test: 'AutoBolt Queue Status', status: result.status, rawResponse: true });
            }
        }
    } catch (error) {
        console.log(`   Error: ${error.message}`);
        testResults.push({ test: 'AutoBolt Queue Status', error: error.message });
    }
    
    // Test 4: Health Check
    console.log('\n💚 Testing Health Check API:');
    try {
        const result = await testLocalEndpoint('/api/health');
        console.log(`   Status: ${result.status}`);
        if (result.body) {
            try {
                const parsed = JSON.parse(result.body);
                console.log(`   Response: ${JSON.stringify(parsed, null, 2)}`);
                testResults.push({ test: 'Health Check', status: result.status, response: parsed });
            } catch (e) {
                console.log(`   Response: ${result.body.substring(0, 200)}...`);
                testResults.push({ test: 'Health Check', status: result.status, rawResponse: true });
            }
        }
    } catch (error) {
        console.log(`   Error: ${error.message}`);
        testResults.push({ test: 'Health Check', error: error.message });
    }
    
    // Generate Summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 API ENDPOINTS TEST SUMMARY');
    console.log('='.repeat(60));
    
    const working = testResults.filter(r => r.status === 200).length;
    const errors = testResults.filter(r => r.error).length;
    const otherStatus = testResults.filter(r => r.status && r.status !== 200).length;
    
    console.log(`Total Tests: ${testResults.length}`);
    console.log(`Working (200): ${working}`);
    console.log(`Errors: ${errors}`);
    console.log(`Other Status: ${otherStatus}`);
    
    testResults.forEach(result => {
        const status = result.status === 200 ? '✅' : result.error ? '❌' : '⚠️';
        console.log(`${status} ${result.test}: ${result.status || 'ERROR'}`);
    });
    
    const overallStatus = errors === 0 ? 'PASSED' : 'FAILED';
    console.log(`\nOverall Status: ${overallStatus}`);
    
    // Write results to file
    const fs = require('fs');
    fs.writeFileSync('api-endpoints-test-results.json', JSON.stringify({
        timestamp: new Date().toISOString(),
        summary: { total: testResults.length, working, errors, otherStatus, overallStatus },
        results: testResults
    }, null, 2));
    
    console.log('Results saved to: api-endpoints-test-results.json');
    console.log('='.repeat(60) + '\n');
    
    return overallStatus === 'PASSED';
}

if (require.main === module) {
    runAPITests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Test suite failed:', error);
            process.exit(1);
        });
}