/**
 * Worker Logging & Monitoring Module
 * 
 * Provides centralized logging with severity levels and
 * placeholder for external alerting (Slack, email, etc.)
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4
};

const CURRENT_LOG_LEVEL = process.env.LOG_LEVEL 
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] 
  : LOG_LEVELS.INFO;

/**
 * Formats log message with timestamp and level
 */
function formatLog(level, message, details) {
  const timestamp = new Date().toISOString();
  const detailsStr = details ? ` | ${JSON.stringify(details)}` : '';
  return `[${timestamp}] [${level}] ${message}${detailsStr}`;
}

/**
 * Log debug information (development only)
 */
export function logDebug(message, details = null) {
  if (CURRENT_LOG_LEVEL <= LOG_LEVELS.DEBUG) {
    console.log(formatLog('DEBUG', message, details));
  }
}

/**
 * Log informational messages
 */
export function logInfo(message, details = null) {
  if (CURRENT_LOG_LEVEL <= LOG_LEVELS.INFO) {
    console.log(formatLog('INFO', message, details));
  }
}

/**
 * Log warnings that don't halt execution
 */
export function logWarn(message, details = null) {
  if (CURRENT_LOG_LEVEL <= LOG_LEVELS.WARN) {
    console.warn(formatLog('WARN', message, details));
  }
}

/**
 * Log errors with optional alerting
 */
export function logError(message, details = null) {
  if (CURRENT_LOG_LEVEL <= LOG_LEVELS.ERROR) {
    console.error(formatLog('ERROR', message, details));
    
    // TODO: Integrate with external alerting
    // sendAlert('error', message, details);
  }
}

/**
 * Log critical errors that require immediate attention
 */
export function logCritical(message, details = null) {
  console.error(formatLog('CRITICAL', message, details));
  
  // TODO: Integrate with external alerting (Slack, PagerDuty, etc.)
  // sendAlert('critical', message, details);
  
  // TODO: Consider triggering emergency shutdown or failover
}

/**
 * Placeholder for external alerting integration
 * 
 * Integrate with:
 * - Slack: Use webhook to post to #alerts channel
 * - Email: Send via SendGrid, Mailgun, etc.
 * - PagerDuty: Trigger incident
 * - Sentry: Capture exception
 */
function sendAlert(severity, message, details) {
  // Example Slack webhook integration:
  /*
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;
  
  fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 Worker ${severity.toUpperCase()}: ${message}`,
      attachments: [{
        color: severity === 'critical' ? 'danger' : 'warning',
        fields: [
          { title: 'Details', value: JSON.stringify(details, null, 2) },
          { title: 'Timestamp', value: new Date().toISOString() }
        ]
      }]
    })
  });
  */
}

/**
 * Log job processing metrics
 */
export function logMetrics(jobId, metrics) {
  logInfo('Job metrics', { jobId, ...metrics });
  
  // TODO: Send to metrics aggregation service (DataDog, CloudWatch, etc.)
}

/**
 * Create a scoped logger for a specific job
 */
export function createJobLogger(jobId) {
  return {
    debug: (msg, details) => logDebug(`[Job ${jobId}] ${msg}`, details),
    info: (msg, details) => logInfo(`[Job ${jobId}] ${msg}`, details),
    warn: (msg, details) => logWarn(`[Job ${jobId}] ${msg}`, details),
    error: (msg, details) => logError(`[Job ${jobId}] ${msg}`, details),
    critical: (msg, details) => logCritical(`[Job ${jobId}] ${msg}`, details),
    metrics: (metrics) => logMetrics(jobId, metrics)
  };
}

// Export all logging functions
export default {
  debug: logDebug,
  info: logInfo,
  warn: logWarn,
  error: logError,
  critical: logCritical,
  metrics: logMetrics,
  createJobLogger
};

