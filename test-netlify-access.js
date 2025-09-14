#!/usr/bin/env node

/**
 * Quick test to verify Netlify API access
 */

const https = require('https');

// Netlify token from .env.local
const NETLIFY_TOKEN = 'nfp_TqZCh5N6X1PvH5BBBAHbJUonTa1u3Czk8186';

console.log('🔍 Testing Netlify API access...');

const options = {
    hostname: 'api.netlify.com',
    port: 443,
    path: '/api/v1/sites',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${NETLIFY_TOKEN}`,
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    
    console.log(`Status: ${res.statusCode}`);
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const parsed = JSON.parse(data);
            console.log('✅ API Access successful!');
            console.log(`Found ${parsed.length} sites`);
            
            // Look for DirectoryBolt
            const directoryBolt = parsed.find(site => 
                site.name.toLowerCase().includes('directorybolt') ||
                site.url.includes('directorybolt') ||
                site.custom_domain === 'directorybolt.com'
            );
            
            if (directoryBolt) {
                console.log('\\n🎯 Found DirectoryBolt site:');
                console.log(`Site ID: ${directoryBolt.id}`);
                console.log(`Name: ${directoryBolt.name}`);
                console.log(`URL: ${directoryBolt.url}`);
                console.log(`State: ${directoryBolt.state}`);
                console.log(`Custom Domain: ${directoryBolt.custom_domain || 'None'}`);
                
                // Now check environment variables for this site
                checkEnvVars(directoryBolt.id);
            } else {
                console.log('❌ DirectoryBolt site not found');
                console.log('Available sites:');
                parsed.forEach(site => {
                    console.log(`  - ${site.name} (${site.url})`);
                });
            }
            
        } catch (e) {
            console.error('❌ Failed to parse response:', e);
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Request failed:', error);
});

req.end();

function checkEnvVars(siteId) {
    console.log('\\n🔧 Checking environment variables...');
    
    const envOptions = {
        hostname: 'api.netlify.com',
        port: 443,
        path: `/api/v1/sites/${siteId}/env`,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${NETLIFY_TOKEN}`,
            'Content-Type': 'application/json'
        }
    };

    const envReq = https.request(envOptions, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const envVars = JSON.parse(data);
                console.log(`Found ${Object.keys(envVars).length} environment variables`);
                
                // Check critical variables
                const critical = [
                    'GOOGLE_SHEET_ID',
                    'GOOGLE_SERVICE_ACCOUNT_EMAIL',
                    'GOOGLE_PRIVATE_KEY',
                    'ADMIN_API_KEY',
                    'STAFF_API_KEY'
                ];
                
                console.log('\\nCritical variables:');
                critical.forEach(varName => {
                    const exists = envVars[varName] !== undefined;
                    console.log(`  ${varName}: ${exists ? '✅ SET' : '❌ MISSING'}`);
                });
                
            } catch (e) {
                console.error('❌ Failed to parse env vars:', e);
                console.log('Raw response:', data);
            }
        });
    });

    envReq.on('error', (error) => {
        console.error('❌ Env vars request failed:', error);
    });

    envReq.end();
}