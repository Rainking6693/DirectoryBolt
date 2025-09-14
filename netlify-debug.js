#!/usr/bin/env node

/**
 * Netlify Debug Script - Access Netlify API to investigate DirectoryBolt issues
 * Uses auth token from .env.local to access Netlify dashboard programmatically
 */

const https = require('https');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const NETLIFY_TOKEN = process.env.NETLIFY_AUTH_TOKEN;

if (!NETLIFY_TOKEN) {
    console.error('❌ NETLIFY_AUTH_TOKEN not found in .env.local');
    process.exit(1);
}

console.log('🔍 DirectoryBolt Netlify Debug Tool');
console.log('=' .repeat(50));

class NetlifyDebugger {
    constructor(token) {
        this.token = token;
        this.baseUrl = 'api.netlify.com';
    }

    async makeRequest(path, method = 'GET') {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: this.baseUrl,
                port: 443,
                path: `/api/v1${path}`,
                method: method,
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    'User-Agent': 'DirectoryBolt-Debug/1.0'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        resolve({ status: res.statusCode, data: parsed });
                    } catch (e) {
                        resolve({ status: res.statusCode, data: data });
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.end();
        });
    }

    async findDirectoryBoltSite() {
        console.log('🔍 Finding DirectoryBolt site...');
        
        try {
            const response = await this.makeRequest('/sites');
            
            if (response.status !== 200) {
                console.error('❌ Failed to fetch sites:', response.status, response.data);
                return null;
            }

            const sites = response.data;
            console.log(`📋 Found ${sites.length} sites in account`);

            // Look for DirectoryBolt site
            const directoryBoltSite = sites.find(site => 
                site.name.toLowerCase().includes('directorybolt') ||
                site.url.includes('directorybolt') ||
                site.custom_domain === 'directorybolt.com'
            );

            if (directoryBoltSite) {
                console.log('✅ Found DirectoryBolt site:');
                console.log(`   Site ID: ${directoryBoltSite.id}`);
                console.log(`   Name: ${directoryBoltSite.name}`);
                console.log(`   URL: ${directoryBoltSite.url}`);
                console.log(`   Custom Domain: ${directoryBoltSite.custom_domain || 'None'}`);
                console.log(`   State: ${directoryBoltSite.state}`);
                return directoryBoltSite;
            } else {
                console.log('🔍 DirectoryBolt site not found. Available sites:');
                sites.forEach(site => {
                    console.log(`   - ${site.name} (${site.url})`);
                });
                return null;
            }
        } catch (error) {
            console.error('❌ Error finding site:', error);
            return null;
        }
    }

    async checkFunctionLogs(siteId) {
        console.log('\\n📋 Checking function logs...');
        
        try {
            const response = await this.makeRequest(`/sites/${siteId}/functions`);
            
            if (response.status !== 200) {
                console.error('❌ Failed to fetch functions:', response.status, response.data);
                return;
            }

            const functions = response.data;
            console.log(`📋 Found ${functions.length} functions`);

            functions.forEach(func => {
                console.log(`   - ${func.name}: ${func.state}`);
            });

            // Get recent function invocations
            const logsResponse = await this.makeRequest(`/sites/${siteId}/functions/invocations`);
            
            if (logsResponse.status === 200) {
                console.log('\\n📋 Recent function invocations:');
                logsResponse.data.slice(0, 10).forEach(invocation => {
                    console.log(`   ${invocation.created_at}: ${invocation.function_name} - ${invocation.status}`);
                    if (invocation.error) {
                        console.log(`     Error: ${invocation.error}`);
                    }
                });
            }

        } catch (error) {
            console.error('❌ Error checking function logs:', error);
        }
    }

    async checkEnvironmentVariables(siteId) {
        console.log('\\n🔧 Checking environment variables...');
        
        try {
            const response = await this.makeRequest(`/sites/${siteId}/env`);
            
            if (response.status !== 200) {
                console.error('❌ Failed to fetch environment variables:', response.status, response.data);
                return;
            }

            const envVars = response.data;
            console.log(`📋 Found ${Object.keys(envVars).length} environment variables`);

            // Check for critical variables
            const criticalVars = [
                'GOOGLE_SHEET_ID',
                'GOOGLE_SERVICE_ACCOUNT_EMAIL', 
                'GOOGLE_PRIVATE_KEY',
                'ADMIN_API_KEY',
                'STAFF_API_KEY',
                'STRIPE_SECRET_KEY'
            ];

            console.log('\\n🔍 Critical variables status:');
            criticalVars.forEach(varName => {
                const exists = envVars[varName] !== undefined;
                const status = exists ? '✅ SET' : '❌ MISSING';
                console.log(`   ${varName}: ${status}`);
                
                if (exists && varName.includes('GOOGLE')) {
                    const value = envVars[varName].value || envVars[varName];
                    console.log(`     Length: ${value.length} characters`);
                    if (varName === 'GOOGLE_PRIVATE_KEY') {
                        console.log(`     Starts with: ${value.substring(0, 30)}...`);
                    }
                }
            });

        } catch (error) {
            console.error('❌ Error checking environment variables:', error);
        }
    }

    async checkDeployments(siteId) {
        console.log('\\n🚀 Checking recent deployments...');
        
        try {
            const response = await this.makeRequest(`/sites/${siteId}/deploys`);
            
            if (response.status !== 200) {
                console.error('❌ Failed to fetch deployments:', response.status, response.data);
                return;
            }

            const deploys = response.data;
            console.log(`📋 Found ${deploys.length} deployments`);

            // Show recent deployments
            console.log('\\n📋 Recent deployments:');
            deploys.slice(0, 5).forEach(deploy => {
                console.log(`   ${deploy.created_at}: ${deploy.state} (${deploy.context})`);
                if (deploy.error_message) {
                    console.log(`     Error: ${deploy.error_message}`);
                }
            });

            // Get build logs for latest deployment
            const latestDeploy = deploys[0];
            if (latestDeploy) {
                console.log(`\\n📋 Latest deployment details:`);
                console.log(`   ID: ${latestDeploy.id}`);
                console.log(`   State: ${latestDeploy.state}`);
                console.log(`   Context: ${latestDeploy.context}`);
                console.log(`   Branch: ${latestDeploy.branch}`);
                
                if (latestDeploy.error_message) {
                    console.log(`   Error: ${latestDeploy.error_message}`);
                }
            }

        } catch (error) {
            console.error('❌ Error checking deployments:', error);
        }
    }

    async run() {
        try {
            // Find DirectoryBolt site
            const site = await this.findDirectoryBoltSite();
            
            if (!site) {
                console.error('❌ Could not find DirectoryBolt site');
                return;
            }

            const siteId = site.id;

            // Check environment variables
            await this.checkEnvironmentVariables(siteId);

            // Check deployments
            await this.checkDeployments(siteId);

            // Check function logs
            await this.checkFunctionLogs(siteId);

            console.log('\\n🎯 DIAGNOSIS COMPLETE');
            console.log('=' .repeat(50));

        } catch (error) {
            console.error('❌ Debug script failed:', error);
        }
    }
}

// Run the debugger
const debugger = new NetlifyDebugger(NETLIFY_TOKEN);
debugger.run().catch(console.error);