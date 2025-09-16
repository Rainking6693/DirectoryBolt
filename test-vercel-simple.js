// Simple Vercel API test
const https = require('https');

function testVercelAPI() {
    const token = 'vpETvjTsIUzOMbRaBaWoz03W';
    
    const options = {
        hostname: 'api.vercel.com',
        path: '/v6/deployments',
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    const req = https.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers: ${JSON.stringify(res.headers)}`);
        
        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            console.log('Response:', data);
            if (res.statusCode === 200) {
                console.log('✅ Quinn: Vercel API authentication successful!');
                console.log('✅ CHECKPOINT 1 COMPLETE: Authenticated with Vercel using API token');
            } else {
                console.log('❌ Quinn: Vercel API authentication failed');
            }
        });
    });

    req.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
    });

    req.end();
}

console.log('Quinn (DevOps): Testing Vercel API authentication...');
testVercelAPI();