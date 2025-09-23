#!/usr/bin/env node

/**
 * DirectoryBolt Audit Server Starter
 * Starts development server for audit execution
 */

const { spawn } = require('child_process');
const http = require('http');

console.log('🚀 Starting DirectoryBolt Audit Server...');
console.log('📋 Following EXTERNAL_AUDIT_PROTOCOL_SECURE.md v2.0');

// Function to check if port is available
function checkPort(port) {
  return new Promise((resolve) => {
    const server = http.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on('error', () => resolve(false));
  });
}

// Function to test API endpoint
function testEndpoint(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ success: true, status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ success: false, status: res.statusCode, error: error.message, data });
        }
      });
    }).on('error', (error) => {
      resolve({ success: false, error: error.message });
    });
  });
}

async function startAuditServer() {
  console.log('\n🔍 Phase 1: Backend APIs and Job Queue Validation');
  console.log('==================================================');
  
  // Check if port 3000 is available
  const portAvailable = await checkPort(3000);
  if (!portAvailable) {
    console.log('⚠️  Port 3000 is in use. Attempting to test existing server...');
  } else {
    console.log('✅ Port 3000 is available. Starting development server...');
    
    // Start development server
    const devServer = spawn('npm', ['run', 'dev'], {
      stdio: 'pipe',
      shell: true
    });
    
    devServer.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Ready') || output.includes('started server')) {
        console.log('✅ Development server started successfully');
      }
    });
    
    devServer.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('warn') && !error.includes('info')) {
        console.log('⚠️  Server error:', error);
      }
    });
    
    // Wait for server to start
    console.log('⏳ Waiting for server to start...');
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // Test health endpoint
  console.log('\n📊 Testing Core API Endpoints:');
  console.log('------------------------------');
  
  console.log('🔍 Testing Health Check Endpoint...');
  const healthResult = await testEndpoint('http://localhost:3000/api/health');
  
  if (healthResult.success) {
    console.log('✅ Health Check: PASSED');
    console.log(`   Status: ${healthResult.status}`);
    console.log(`   Response: ${JSON.stringify(healthResult.data, null, 2)}`);
  } else {
    console.log('❌ Health Check: FAILED');
    console.log(`   Error: ${healthResult.error}`);
  }
  
  // Test system status endpoint
  console.log('\n🔍 Testing System Status Endpoint...');
  const statusResult = await testEndpoint('http://localhost:3000/api/system-status');
  
  if (statusResult.success) {
    console.log('✅ System Status: PASSED');
    console.log(`   Status: ${statusResult.status}`);
    console.log(`   Critical Issues: ${statusResult.data.critical_issues?.length || 0}`);
    console.log(`   Warnings: ${statusResult.data.warnings?.length || 0}`);
    
    if (statusResult.data.critical_issues?.length > 0) {
      console.log('⚠️  Critical Issues Found:');
      statusResult.data.critical_issues.forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue}`);
      });
    }
  } else {
    console.log('❌ System Status: FAILED');
    console.log(`   Error: ${statusResult.error}`);
  }
  
  // Test analyze endpoint
  console.log('\n🔍 Testing Website Analysis API...');
  const analyzeTest = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.com', tier: 'free' })
  };
  
  // For now, just check if the endpoint exists
  const analyzeResult = await testEndpoint('http://localhost:3000/api/analyze');
  console.log('📝 Analyze endpoint test (GET request for endpoint existence):');
  if (analyzeResult.success || analyzeResult.status === 405) {
    console.log('✅ Analyze Endpoint: EXISTS (Method not allowed for GET is expected)');
  } else {
    console.log('❌ Analyze Endpoint: NOT FOUND');
  }
  
  console.log('\n📋 Phase 1 Initial Results:');
  console.log('===========================');
  console.log(`Health Check: ${healthResult.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`System Status: ${statusResult.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Analyze Endpoint: ${analyzeResult.success || analyzeResult.status === 405 ? '✅ EXISTS' : '❌ MISSING'}`);
  
  console.log('\n🎯 Next Steps:');
  console.log('- Continue with Phase 1.2: Job Queue Operations');
  console.log('- Test staff authentication endpoints');
  console.log('- Validate AutoBolt integration APIs');
  console.log('\n📊 Audit server ready for comprehensive testing...');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Audit server shutting down...');
  process.exit(0);
});

// Start the audit
startAuditServer().catch(console.error);