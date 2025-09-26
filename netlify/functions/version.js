// /api/version - Version and build information endpoint
// Replaces build-info.json from the Chrome extension

// Helper function for production CORS
function getCorsHeaders() {
  const origin = process.env.NODE_ENV === 'production' 
    ? 'https://directorybolt.netlify.app'
    : '*';
    
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };
}

export async function handler(event, context) {
  // Handle CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders()
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json', ...getCorsHeaders() },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const buildTimestamp = process.env.BUILD_TIMESTAMP || new Date().toISOString();
    const gitCommit = process.env.GIT_COMMIT || 'unknown';
    const gitBranch = process.env.GIT_BRANCH || 'unknown';

    const versionInfo = {
      // System Information
      name: 'DirectoryBolt AutoBolt Backend',
      version: process.env.npm_package_version || '2.0.0',
      buildNumber: process.env.BUILD_NUMBER || '1',
      
      // Build Information
      buildTimestamp,
      gitCommit: gitCommit.substring(0, 8), // Short commit hash
      gitBranch,
      
      // Environment Information
      environment: process.env.NODE_ENV || 'production',
      platform: 'netlify-functions',
      nodeVersion: process.version,
      
      // Feature Flags (migrated from extension build-info)
      features: {
        extensionMigrated: true,
        playwrightWorkers: true,
        proxySupport: true,
        captchaSolving: true,
        realTimeMonitoring: true,
        enterpriseScaling: true,
        jwtAuthentication: true
      },
      
      // API Endpoints Available
      endpoints: {
        jobs: {
          next: '/api/jobs-next',
          update: '/api/jobs-update', 
          complete: '/api/jobs-complete',
          retry: '/api/jobs-retry'
        },
        monitoring: {
          status: '/api/autobolt-status',
          health: '/api/healthz',
          version: '/api/version'
        }
      },
      
      // Migration Status
      migration: {
        chromeExtensionRemoved: true,
        packageTierEngineIntegrated: true,
        backgroundBatchMigrated: true,
        formFillerMigrated: true,
        authenticationUpgraded: true,
        dashboardIntegrated: true
      },
      
      // Capabilities (replacing extension manifest permissions)
      capabilities: [
        'job-processing',
        'queue-management', 
        'worker-coordination',
        'real-time-monitoring',
        'retry-logic',
        'staff-dashboard',
        'enterprise-proxy-support',
        'captcha-solving',
        'jwt-authentication'
      ],
      
      // Runtime Information
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    console.log(`Version info requested: ${versionInfo.name} v${versionInfo.version}`);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
        ...getCorsHeaders()
      },
      body: JSON.stringify(versionInfo, null, 2)
    };

  } catch (error) {
    console.error('Error in version endpoint:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders()
      },
      body: JSON.stringify({
        error: 'Failed to retrieve version information',
        timestamp: new Date().toISOString()
      })
    };
  }
}

// Optional environment variables for enhanced build info:
// - BUILD_TIMESTAMP (set during CI/CD)
// - GIT_COMMIT (set during CI/CD) 
// - GIT_BRANCH (set during CI/CD)
// - BUILD_NUMBER (set during CI/CD)
// - npm_package_version (from package.json)