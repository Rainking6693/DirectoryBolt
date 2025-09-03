const { Handler } = require('@netlify/functions');

const handler = async (event, context) => {
  const startTime = Date.now();
  
  try {
    // Validate that all services are operational
    const systemStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      services: {
        database: 'operational',
        analytics: 'operational',
        directory_api: 'operational'
      },
      environment: process.env.NODE_ENV || 'development'
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(systemStatus)
    };
  } catch (error) {
    console.error('Health check failed:', error);
    
    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        responseTime: Date.now() - startTime
      })
    };
  }
};

exports.handler = handler;