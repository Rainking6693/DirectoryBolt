// Hudson's API Endpoint Validation Test
// Testing Emily's claims about API functionality and responses

const fetch = require('node-fetch');

async function hudsonApiValidation() {
  console.log('🔒 HUDSON\'S SECURITY AUDIT - API Validation');
  console.log('===========================================');
  
  const results = {
    server_running: false,
    endpoints: {
      health: { accessible: false, response: null },
      staff_queue: { accessible: false, response: null, authenticated: false },
      staff_extensions: { accessible: false, response: null },
      autobolt_directories: { accessible: false, response: null }
    },
    claimed_uuids: {
      found: [],
      missing: []
    },
    security: {
      cors_configured: false,
      auth_required: false,
      error_handling: false
    }
  };

  const baseUrl = 'http://localhost:3001';
  const claimedUUIDs = [
    '44a6459d-0f0f-4cc0-bd22-c5350e338690',
    'a774a900-06d6-4c49-be12-2878896c15e1', 
    'f2c4e524-886c-4b77-b8f3-cf9ff5a564bd'
  ];

  try {
    console.log('\\n1. 🔍 Testing Server Accessibility...');
    
    // Test if server is running
    try {
      const healthResponse = await fetch(`${baseUrl}/api/autobolt/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      results.server_running = true;
      results.endpoints.health.accessible = healthResponse.ok;
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        results.endpoints.health.response = healthData;
        console.log('✅ Server is running and health endpoint accessible');
        console.log(`   Status: ${healthData.status}`);
        console.log(`   Version: ${healthData.version}`);
        console.log(`   Database: ${healthData.services?.database?.status}`);
      } else {
        console.log(`❌ Health endpoint returned ${healthResponse.status}`);
      }
    } catch (err) {
      console.log('❌ Server not accessible:', err.message);
      console.log('   This could mean:');
      console.log('   - Development server is not running');
      console.log('   - Server is running on different port');
      console.log('   - Network/firewall issues');
      return results;
    }

    console.log('\\n2. 🔍 Testing Staff API Endpoints...');
    
    // Test staff queue endpoint (should require authentication)
    try {
      const queueResponse = await fetch(`${baseUrl}/api/staff/autobolt-queue`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      results.endpoints.staff_queue.accessible = true;
      
      if (queueResponse.status === 401 || queueResponse.status === 403) {
        results.security.auth_required = true;
        console.log('✅ Staff queue endpoint properly requires authentication');
      } else if (queueResponse.ok) {
        const queueData = await queueResponse.json();
        results.endpoints.staff_queue.response = queueData;
        results.endpoints.staff_queue.authenticated = true;
        console.log('✅ Staff queue endpoint accessible (no auth required - security concern)');
        
        // Check for Emily's claimed UUIDs
        if (queueData.data && queueData.data.queue_items) {
          const foundIds = queueData.data.queue_items.map(item => item.id);
          claimedUUIDs.forEach(uuid => {
            if (foundIds.includes(uuid)) {
              results.claimed_uuids.found.push(uuid);
              console.log(`   ✅ Found claimed UUID: ${uuid}`);
            } else {
              results.claimed_uuids.missing.push(uuid);
              console.log(`   ❌ Missing claimed UUID: ${uuid}`);
            }
          });
        }
      } else {
        console.log(`❌ Staff queue endpoint returned ${queueResponse.status}`);
      }
    } catch (err) {
      console.log('❌ Staff queue endpoint test failed:', err.message);
    }

    // Test with authentication (try common staff auth patterns)
    console.log('\\n3. 🔍 Testing Authentication Methods...');
    
    const authMethods = [
      { name: 'API Key Header', headers: { 'x-staff-key': 'DirectoryBoltStaff2025!' } },
      { name: 'Authorization Bearer', headers: { 'Authorization': 'Bearer staff-token' } },
      { name: 'Basic Auth', headers: { 'Authorization': 'Basic ' + Buffer.from('staff:DirectoryBoltStaff2025!').toString('base64') } }
    ];

    for (const method of authMethods) {
      try {
        const authResponse = await fetch(`${baseUrl}/api/staff/autobolt-queue`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...method.headers
          }
        });

        if (authResponse.ok) {
          console.log(`✅ ${method.name} authentication successful`);
          const authData = await authResponse.json();
          
          if (authData.data && authData.data.queue_items) {
            console.log(`   Queue items returned: ${authData.data.queue_items.length}`);
            
            // Check for Emily's claimed UUIDs with auth
            const foundIds = authData.data.queue_items.map(item => item.id);
            claimedUUIDs.forEach(uuid => {
              if (foundIds.includes(uuid) && !results.claimed_uuids.found.includes(uuid)) {
                results.claimed_uuids.found.push(uuid);
                console.log(`   ✅ Found claimed UUID with auth: ${uuid}`);
              }
            });
          }
          break;
        } else {
          console.log(`❌ ${method.name} failed: ${authResponse.status}`);
        }
      } catch (err) {
        console.log(`❌ ${method.name} error:`, err.message);
      }
    }

    console.log('\\n4. 🔍 Testing Additional Endpoints...');
    
    // Test autobolt extensions endpoint
    try {
      const extensionsResponse = await fetch(`${baseUrl}/api/staff/autobolt-extensions`);
      results.endpoints.staff_extensions.accessible = extensionsResponse.ok;
      
      if (extensionsResponse.ok) {
        const extensionsData = await extensionsResponse.json();
        results.endpoints.staff_extensions.response = extensionsData;
        console.log('✅ AutoBolt extensions endpoint accessible');
        console.log(`   Extensions found: ${extensionsData.data?.length || 0}`);
      } else {
        console.log(`❌ Extensions endpoint returned ${extensionsResponse.status}`);
      }
    } catch (err) {
      console.log('❌ Extensions endpoint test failed:', err.message);
    }

    // Test directories endpoint
    try {
      const directoriesResponse = await fetch(`${baseUrl}/api/autobolt/directories?stats=true`);
      results.endpoints.autobolt_directories.accessible = directoriesResponse.ok;
      
      if (directoriesResponse.ok) {
        const directoriesData = await directoriesResponse.json();
        results.endpoints.autobolt_directories.response = directoriesData;
        console.log('✅ AutoBolt directories endpoint accessible');
        
        if (directoriesData.total_count) {
          console.log(`   Total directories: ${directoriesData.total_count} (Emily claimed 484)`);
          if (directoriesData.total_count === 484) {
            console.log('   ✅ Directory count matches Emily\\'s claim exactly!');
          } else {
            console.log(`   ⚠️  Directory count differs from Emily\\'s claim (${directoriesData.total_count} vs 484)`);
          }
        }
      } else {
        console.log(`❌ Directories endpoint returned ${directoriesResponse.status}`);
      }
    } catch (err) {
      console.log('❌ Directories endpoint test failed:', err.message);
    }

    console.log('\\n5. 🔍 Security Assessment...');
    
    // Test CORS configuration
    try {
      const corsResponse = await fetch(`${baseUrl}/api/autobolt/health`, {
        method: 'OPTIONS'
      });
      
      const corsHeaders = corsResponse.headers.get('access-control-allow-origin');
      results.security.cors_configured = !!corsHeaders;
      console.log(`CORS Configuration: ${corsHeaders ? '✅ Configured' : '❌ Not configured'}`);
    } catch (err) {
      console.log('❌ CORS test failed:', err.message);
    }

    // Test error handling
    try {
      const errorResponse = await fetch(`${baseUrl}/api/nonexistent-endpoint`);
      results.security.error_handling = errorResponse.status === 404;
      console.log(`Error Handling: ${results.security.error_handling ? '✅ Proper 404' : '❌ Poor error handling'}`);
    } catch (err) {
      console.log('Error handling test inconclusive');
    }

  } catch (error) {
    console.error('❌ API validation failed:', error.message);
  }

  // Generate Hudson's API verdict
  console.log('\\n🔒 HUDSON\\'S API SECURITY VERDICT');
  console.log('=================================');
  
  const endpointsWorking = Object.values(results.endpoints).filter(ep => ep.accessible).length;
  const uuidsFound = results.claimed_uuids.found.length;
  
  console.log(`Server Running: ${results.server_running ? '✅' : '❌'}`);
  console.log(`Endpoints Working: ${endpointsWorking}/4 (${endpointsWorking >= 3 ? '✅' : '❌'})`);
  console.log(`Authentication: ${results.security.auth_required ? '✅ Required' : '❌ Not required'}`);
  console.log(`Emily's UUIDs Found: ${uuidsFound}/3 (${uuidsFound > 0 ? '✅' : '❌'})`);
  console.log(`Security Measures: ${results.security.cors_configured ? '✅' : '❌'}`);
  
  // Final API assessment
  const apiScore = (
    (results.server_running ? 30 : 0) +
    (endpointsWorking * 15) +
    (results.security.auth_required ? 20 : 0) +
    (uuidsFound * 10) +
    (results.security.cors_configured ? 10 : 0)
  );
  
  console.log(`\\nAPI Score: ${apiScore}/100`);
  
  if (apiScore >= 80) {
    console.log('🎉 HUDSON API VERDICT: APPROVED - Emily\\'s API claims are verified');
  } else if (apiScore >= 60) {
    console.log('⚠️  HUDSON API VERDICT: PARTIAL - Some API functionality exists');
  } else {
    console.log('❌ HUDSON API VERDICT: REJECTED - API claims not substantiated');
  }
  
  return results;
}

// Run Hudson's API validation
hudsonApiValidation().catch(console.error);