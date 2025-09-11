const { Handler } = require('@netlify/functions');

/**
 * Production Monitoring and Alerting System
 * Handles health checks, performance metrics, and error tracking
 */

// In-memory metrics storage (replace with Redis/MongoDB in production)
const metrics = {
  requests: [],
  errors: [],
  performance: [],
  alerts: [],
  systemHealth: {
    lastCheck: null,
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    connections: 0
  }
};

// Alert thresholds
const ALERT_THRESHOLDS = {
  errorRate: 0.05, // 5% error rate
  responseTime: 5000, // 5 second response time
  memoryUsage: 0.9, // 90% memory usage
  consecutiveErrors: 10
};

const handler = async (event, context) => {
  const { httpMethod, path, body, headers, queryStringParameters } = event;
  
  // CORS handling
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      },
      body: ''
    };
  }

  try {
    const pathSegments = path.split('/').filter(Boolean);
    const action = pathSegments[pathSegments.length - 1];

    switch (httpMethod) {
      case 'GET':
        if (action === 'health') {
          return await handleHealthCheck();
        } else if (action === 'metrics') {
          return await handleGetMetrics(queryStringParameters);
        } else if (action === 'alerts') {
          return await handleGetAlerts(queryStringParameters);
        } else if (action === 'dashboard') {
          return await handleGetDashboard();
        }
        break;
      
      case 'POST':
        if (action === 'error') {
          return await handleLogError(JSON.parse(body || '{}'));
        } else if (action === 'metric') {
          return await handleLogMetric(JSON.parse(body || '{}'));
        } else if (action === 'alert') {
          return await handleCreateAlert(JSON.parse(body || '{}'));
        }
        break;
    }

    return {
      statusCode: 404,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Endpoint not found' })
    };

  } catch (error) {
    console.error('Monitoring error:', error);
    
    // Log the error to metrics
    await logError({
      type: 'monitoring_error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context: { path, httpMethod }
    });
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: 'Internal monitoring error',
        message: error.message 
      })
    };
  }
};

async function handleHealthCheck() {
  const startTime = Date.now();
  
  try {
    // Update system health
    metrics.systemHealth = {
      lastCheck: new Date().toISOString(),
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      connections: 0, // Would be actual connection count in production
      responseTime: Date.now() - startTime
    };
    
    // Check for critical issues
    const healthStatus = await performHealthChecks();
    
    return {
      statusCode: healthStatus.critical ? 503 : 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      },
      body: JSON.stringify({
        status: healthStatus.critical ? 'unhealthy' : 'healthy',
        timestamp: new Date().toISOString(),
        checks: healthStatus.checks,
        metrics: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          responseTime: Date.now() - startTime
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 503,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
}

async function performHealthChecks() {
  const checks = {
    api: { status: 'pass', responseTime: 0 },
    database: { status: 'pass', responseTime: 0 },
    memory: { status: 'pass', usage: 0 },
    errorRate: { status: 'pass', rate: 0 }
  };
  
  let critical = false;
  
  // Memory check
  const memUsage = process.memoryUsage();
  const memPercent = memUsage.used / memUsage.total;
  checks.memory.usage = memPercent;
  
  if (memPercent > ALERT_THRESHOLDS.memoryUsage) {
    checks.memory.status = 'fail';
    critical = true;
  }
  
  // Error rate check
  const recentErrors = getRecentErrors(5); // Last 5 minutes
  const recentRequests = getRecentRequests(5);
  const errorRate = recentRequests.length > 0 ? recentErrors.length / recentRequests.length : 0;
  checks.errorRate.rate = errorRate;
  
  if (errorRate > ALERT_THRESHOLDS.errorRate) {
    checks.errorRate.status = 'fail';
    critical = true;
  }
  
  return { checks, critical };
}

async function handleGetMetrics(queryParams) {
  const timeframe = queryParams?.timeframe || '1h';
  const type = queryParams?.type || 'all';
  
  const timeframeMs = parseTimeframe(timeframe);
  const cutoff = Date.now() - timeframeMs;
  
  let filteredMetrics = {};
  
  if (type === 'all' || type === 'requests') {
    filteredMetrics.requests = metrics.requests.filter(r => new Date(r.timestamp).getTime() > cutoff);
  }
  
  if (type === 'all' || type === 'errors') {
    filteredMetrics.errors = metrics.errors.filter(e => new Date(e.timestamp).getTime() > cutoff);
  }
  
  if (type === 'all' || type === 'performance') {
    filteredMetrics.performance = metrics.performance.filter(p => new Date(p.timestamp).getTime() > cutoff);
  }
  
  const aggregated = aggregateMetrics(filteredMetrics, timeframe);
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      timeframe,
      type,
      metrics: filteredMetrics,
      aggregated,
      timestamp: new Date().toISOString()
    })
  };
}

async function handleGetAlerts(queryParams) {
  const severity = queryParams?.severity || 'all';
  const status = queryParams?.status || 'all';
  const limit = parseInt(queryParams?.limit || '50');
  
  let filteredAlerts = [...metrics.alerts];
  
  if (severity !== 'all') {
    filteredAlerts = filteredAlerts.filter(a => a.severity === severity);
  }
  
  if (status !== 'all') {
    filteredAlerts = filteredAlerts.filter(a => a.status === status);
  }
  
  // Sort by timestamp (newest first)
  filteredAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  // Apply limit
  filteredAlerts = filteredAlerts.slice(0, limit);
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      alerts: filteredAlerts,
      total: metrics.alerts.length,
      filtered: filteredAlerts.length,
      timestamp: new Date().toISOString()
    })
  };
}

async function handleGetDashboard() {
  const now = Date.now();
  const last24h = now - (24 * 60 * 60 * 1000);
  const lastHour = now - (60 * 60 * 1000);
  
  const dashboard = {
    overview: {
      status: metrics.systemHealth.status,
      uptime: process.uptime(),
      totalRequests: metrics.requests.length,
      totalErrors: metrics.errors.length,
      activeAlerts: metrics.alerts.filter(a => a.status === 'active').length
    },
    last24h: {
      requests: metrics.requests.filter(r => new Date(r.timestamp).getTime() > last24h).length,
      errors: metrics.errors.filter(e => new Date(e.timestamp).getTime() > last24h).length,
      avgResponseTime: calculateAverageResponseTime(last24h)
    },
    lastHour: {
      requests: metrics.requests.filter(r => new Date(r.timestamp).getTime() > lastHour).length,
      errors: metrics.errors.filter(e => new Date(e.timestamp).getTime() > lastHour).length,
      avgResponseTime: calculateAverageResponseTime(lastHour)
    },
    systemHealth: metrics.systemHealth,
    recentAlerts: metrics.alerts
      .filter(a => a.status === 'active')
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10)
  };
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      dashboard,
      timestamp: new Date().toISOString()
    })
  };
}

async function handleLogError(errorData) {
  const error = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    type: errorData.type || 'unknown',
    message: errorData.message,
    stack: errorData.stack,
    context: errorData.context || {},
    severity: errorData.severity || 'error',
    resolved: false
  };
  
  metrics.errors.push(error);
  
  // Keep only last 1000 errors
  if (metrics.errors.length > 1000) {
    metrics.errors = metrics.errors.slice(-1000);
  }
  
  // Check for alert conditions
  await checkErrorAlerts(error);
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      success: true,
      errorId: error.id,
      timestamp: error.timestamp
    })
  };
}

async function handleLogMetric(metricData) {
  const metric = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    name: metricData.name,
    value: metricData.value,
    unit: metricData.unit || 'count',
    tags: metricData.tags || {},
    source: metricData.source || 'unknown'
  };
  
  metrics.performance.push(metric);
  
  // Keep only last 10000 metrics
  if (metrics.performance.length > 10000) {
    metrics.performance = metrics.performance.slice(-10000);
  }
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      success: true,
      metricId: metric.id,
      timestamp: metric.timestamp
    })
  };
}

async function handleCreateAlert(alertData) {
  const alert = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    type: alertData.type || 'custom',
    title: alertData.title,
    message: alertData.message,
    severity: alertData.severity || 'warning',
    status: 'active',
    source: alertData.source || 'manual',
    metadata: alertData.metadata || {}
  };
  
  metrics.alerts.push(alert);
  
  // Keep only last 500 alerts
  if (metrics.alerts.length > 500) {
    metrics.alerts = metrics.alerts.slice(-500);
  }
  
  // Send notification (in production, use email/Slack/SMS)
  await sendAlertNotification(alert);
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      success: true,
      alertId: alert.id,
      timestamp: alert.timestamp
    })
  };
}

async function checkErrorAlerts(error) {
  // Check for consecutive errors
  const recentErrors = getRecentErrors(1); // Last 1 minute
  
  if (recentErrors.length >= ALERT_THRESHOLDS.consecutiveErrors) {
    await handleCreateAlert({
      type: 'consecutive_errors',
      title: 'High Error Rate Alert',
      message: `${recentErrors.length} consecutive errors in the last minute`,
      severity: 'critical',
      source: 'auto',
      metadata: { errorCount: recentErrors.length, errors: recentErrors.slice(-5) }
    });
  }
}

async function sendAlertNotification(alert) {
  // In production, integrate with:
  // - Email service (SendGrid, AWS SES)
  // - Slack webhooks
  // - SMS service (Twilio)
  // - PagerDuty
  
  console.log(`🚨 ALERT: ${alert.title}`, {
    severity: alert.severity,
    message: alert.message,
    timestamp: alert.timestamp
  });
}

// Utility functions

function parseTimeframe(timeframe) {
  const units = {
    'm': 60 * 1000,
    'h': 60 * 60 * 1000,
    'd': 24 * 60 * 60 * 1000
  };
  
  const match = timeframe.match(/^(\d+)([mhd])$/);
  if (!match) return 60 * 60 * 1000; // Default 1 hour
  
  const [, amount, unit] = match;
  return parseInt(amount) * units[unit];
}

function aggregateMetrics(metricsData, timeframe) {
  const aggregated = {};
  
  // Request aggregation
  if (metricsData.requests) {
    aggregated.requests = {
      total: metricsData.requests.length,
      avgResponseTime: calculateAverageResponseTime(),
      statusCodes: aggregateStatusCodes(metricsData.requests)
    };
  }
  
  // Error aggregation
  if (metricsData.errors) {
    aggregated.errors = {
      total: metricsData.errors.length,
      byType: aggregateErrorsByType(metricsData.errors),
      bySeverity: aggregateErrorsBySeverity(metricsData.errors)
    };
  }
  
  return aggregated;
}

function calculateAverageResponseTime(since = 0) {
  const relevantPerformance = metrics.performance.filter(p => 
    p.name === 'response_time' && 
    new Date(p.timestamp).getTime() > since
  );
  
  if (relevantPerformance.length === 0) return 0;
  
  const total = relevantPerformance.reduce((sum, p) => sum + p.value, 0);
  return total / relevantPerformance.length;
}

function aggregateStatusCodes(requests) {
  const codes = {};
  requests.forEach(req => {
    const code = req.statusCode || 'unknown';
    codes[code] = (codes[code] || 0) + 1;
  });
  return codes;
}

function aggregateErrorsByType(errors) {
  const types = {};
  errors.forEach(error => {
    types[error.type] = (types[error.type] || 0) + 1;
  });
  return types;
}

function aggregateErrorsBySeverity(errors) {
  const severity = {};
  errors.forEach(error => {
    severity[error.severity] = (severity[error.severity] || 0) + 1;
  });
  return severity;
}

function getRecentErrors(minutes) {
  const cutoff = Date.now() - (minutes * 60 * 1000);
  return metrics.errors.filter(e => new Date(e.timestamp).getTime() > cutoff);
}

function getRecentRequests(minutes) {
  const cutoff = Date.now() - (minutes * 60 * 1000);
  return metrics.requests.filter(r => new Date(r.timestamp).getTime() > cutoff);
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

async function logError(error) {
  metrics.errors.push({
    id: generateId(),
    timestamp: new Date().toISOString(),
    ...error
  });
}

exports.handler = handler;