import { supabase, testConnection, getCorsHeaders } from './_supabaseClient.js';

// /api/healthz - System health check endpoint
// Used by monitoring systems, load balancers, and infrastructure

export async function handler(event, context) {
  const startTime = Date.now();

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: getCorsHeaders()
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'unknown',
    checks: {}
  };

  try {
    // 1. Database connectivity check
    console.log('Performing health checks...');
    
    const dbCheck = await testConnection();
    checks.checks.database = {
      status: dbCheck.connected ? 'healthy' : 'unhealthy',
      connected: dbCheck.connected,
      error: dbCheck.error || null,
      responseTime: Date.now() - startTime
    };

    // 2. Environment variables check
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    checks.checks.environment = {
      status: missingEnvVars.length === 0 ? 'healthy' : 'unhealthy',
      requiredVariables: requiredEnvVars.length,
      missingVariables: missingEnvVars.length,
      missing: missingEnvVars
    };

    // 3. Queue system health check (basic functionality test)
    let queueHealth = { status: 'unknown' };
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, status')
        .limit(1);
      
      queueHealth = {
        status: error ? 'unhealthy' : 'healthy',
        accessible: !error,
        error: error?.message || null
      };
    } catch (queueError) {
      queueHealth = {
        status: 'unhealthy',
        accessible: false,
        error: queueError.message
      };
    }
    checks.checks.queue = queueHealth;

    // 4. Memory and runtime checks
    const memoryUsage = process.memoryUsage();
    checks.checks.runtime = {
      status: 'healthy',
      uptime: process.uptime(),
      memoryUsage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
      },
      nodeVersion: process.version
    };

    // 5. Determine overall health status
    const unhealthyChecks = Object.values(checks.checks).filter(check => check.status === 'unhealthy');
    if (unhealthyChecks.length > 0) {
      checks.status = 'unhealthy';
    }

    checks.responseTime = Date.now() - startTime;

    // Return appropriate status code
    const httpStatus = checks.status === 'healthy' ? 200 : 503;
    
    console.log(`Health check completed: ${checks.status} (${checks.responseTime}ms)`);
    if (unhealthyChecks.length > 0) {
      console.error('Unhealthy components:', unhealthyChecks.map(c => c.error).filter(Boolean));
    }

    return {
      statusCode: httpStatus,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      body: JSON.stringify(checks, null, 2)
    };

  } catch (error) {
    console.error('Health check failed:', error);
    
    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(),
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error.message,
        responseTime: Date.now() - startTime,
        checks: checks.checks
      }, null, 2)
    };
  }
}

// This endpoint requires the following environment variables:
// - SUPABASE_URL
// - SUPABASE_SERVICE_ROLE_KEY
//
// Optional environment variables:
// - NODE_ENV (for environment identification)
// - npm_package_version (for version reporting)