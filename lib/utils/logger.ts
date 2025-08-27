// 🔒 JORDAN'S LOGGING SYSTEM - Enterprise-grade logging with structured data
// Comprehensive logging, monitoring, and alerting for production systems

enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4
}

export { LogLevel }

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  service: string
  version: string
  environment: string
  requestId?: string
  userId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  duration?: number
  httpMethod?: string
  httpStatus?: number
  httpUrl?: string
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  metadata?: Record<string, any>
}

export interface MetricsEntry {
  timestamp: string
  metric: string
  value: number
  tags: Record<string, string>
  type: 'counter' | 'gauge' | 'histogram' | 'timer'
}

class Logger {
  private static instance: Logger
  private logLevel: LogLevel = LogLevel.INFO
  private service: string = 'directorybolt-api'
  private version: string = '1.0.0'
  private environment: string = process.env.NODE_ENV || 'development'
  
  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }
  
  setLogLevel(level: LogLevel): void {
    this.logLevel = level
  }
  
  // Core logging methods
  error(message: string, context?: LogContext, error?: Error): void {
    if (this.logLevel >= LogLevel.ERROR) {
      this.writeLog(LogLevel.ERROR, message, context, error)
    }
  }
  
  warn(message: string, context?: LogContext): void {
    if (this.logLevel >= LogLevel.WARN) {
      this.writeLog(LogLevel.WARN, message, context)
    }
  }
  
  info(message: string, context?: LogContext): void {
    if (this.logLevel >= LogLevel.INFO) {
      this.writeLog(LogLevel.INFO, message, context)
    }
  }
  
  debug(message: string, context?: LogContext): void {
    if (this.logLevel >= LogLevel.DEBUG) {
      this.writeLog(LogLevel.DEBUG, message, context)
    }
  }
  
  trace(message: string, context?: LogContext): void {
    if (this.logLevel >= LogLevel.TRACE) {
      this.writeLog(LogLevel.TRACE, message, context)
    }
  }
  
  // Specialized logging methods
  apiRequest(context: ApiRequestContext): void {
    this.info(`${context.method} ${context.url}`, {
      requestId: context.requestId,
      userId: context.userId,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: {
        method: context.method,
        url: context.url,
        query: context.query,
        body: context.sanitizedBody // Never log sensitive data
      }
    })
  }
  
  apiResponse(context: ApiResponseContext): void {
    const level = context.status >= 500 ? LogLevel.ERROR : 
                 context.status >= 400 ? LogLevel.WARN : LogLevel.INFO
    
    const message = `${context.method} ${context.url} - ${context.status} (${context.duration}ms)`
    
    this.writeLog(level, message, {
      requestId: context.requestId,
      userId: context.userId,
      duration: context.duration,
      httpMethod: context.method,
      httpStatus: context.status,
      httpUrl: context.url,
      metadata: {
        responseSize: context.responseSize,
        cached: context.cached
      }
    })
    
    // Track API metrics
    this.recordMetric('api_request_duration', context.duration, {
      method: context.method,
      status: context.status.toString(),
      endpoint: this.sanitizeUrl(context.url)
    }, 'histogram')
    
    this.recordMetric('api_requests_total', 1, {
      method: context.method,
      status: context.status.toString(),
      endpoint: this.sanitizeUrl(context.url)
    }, 'counter')
  }
  
  databaseQuery(query: string, duration: number, context?: LogContext): void {
    this.debug(`Database query executed (${duration}ms)`, {
      ...context,
      duration,
      metadata: {
        query: this.sanitizeQuery(query),
        type: 'database'
      }
    })
    
    this.recordMetric('database_query_duration', duration, {
      operation: this.extractQueryOperation(query)
    }, 'histogram')
  }
  
  paymentEvent(event: PaymentEventContext): void {
    this.info(`Payment ${event.type}: ${event.paymentId}`, {
      userId: event.userId,
      metadata: {
        type: event.type,
        paymentId: event.paymentId,
        amount: event.amount,
        currency: event.currency,
        status: event.status
      }
    })
    
    this.recordMetric('payment_events_total', 1, {
      type: event.type,
      status: event.status,
      currency: event.currency
    }, 'counter')
  }
  
  scrapingJob(job: ScrapingJobContext): void {
    this.info(`Scraping job ${job.status}: ${job.jobId}`, {
      metadata: {
        jobId: job.jobId,
        type: job.type,
        status: job.status,
        url: job.url,
        attempts: job.attempts,
        duration: job.duration
      }
    })
    
    this.recordMetric('scraping_jobs_total', 1, {
      type: job.type,
      status: job.status
    }, 'counter')
    
    if (job.duration) {
      this.recordMetric('scraping_job_duration', job.duration, {
        type: job.type
      }, 'histogram')
    }
  }
  
  securityEvent(event: SecurityEventContext): void {
    this.warn(`Security event: ${event.type}`, {
      userId: event.userId,
      ipAddress: event.ipAddress,
      userAgent: event.userAgent,
      metadata: {
        type: event.type,
        severity: event.severity,
        details: event.details,
        blocked: event.blocked
      }
    })
    
    this.recordMetric('security_events_total', 1, {
      type: event.type,
      severity: event.severity,
      blocked: event.blocked ? 'true' : 'false'
    }, 'counter')
  }
  
  performanceAlert(metric: PerformanceMetric): void {
    const level = metric.threshold === 'critical' ? LogLevel.ERROR : LogLevel.WARN
    
    this.writeLog(level, `Performance alert: ${metric.name}`, {
      metadata: {
        metric: metric.name,
        value: metric.value,
        threshold: metric.expectedValue,
        severity: metric.threshold,
        unit: metric.unit
      }
    })
  }
  
  // Core write method
  private writeLog(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      version: this.version,
      environment: this.environment,
      ...context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: (error as any).code
        }
      })
    }
    
    // Output to console (in production, send to logging service)
    this.outputLog(logEntry)
    
    // Send alerts for critical errors
    if (level === LogLevel.ERROR) {
      this.sendAlert(logEntry)
    }
  }
  
  private outputLog(entry: LogEntry): void {
    const logString = JSON.stringify(entry, null, this.environment === 'development' ? 2 : 0)
    
    switch (entry.level) {
      case LogLevel.ERROR:
        if (this.environment === 'development') console.error(logString)
        break
      case LogLevel.WARN:
        if (this.environment === 'development') console.warn(logString)
        break
      default:
        if (this.environment === 'development') console.log(logString)
        break
    }
    
    // In production, send to external logging services:
    // - DataDog: await this.sendToDatadog(entry)
    // - CloudWatch: await this.sendToCloudWatch(entry)
    // - Elasticsearch: await this.sendToElasticsearch(entry)
  }
  
  private recordMetric(name: string, value: number, tags: Record<string, string>, type: MetricsEntry['type']): void {
    const metric: MetricsEntry = {
      timestamp: new Date().toISOString(),
      metric: name,
      value,
      tags: {
        service: this.service,
        environment: this.environment,
        ...tags
      },
      type
    }
    
    if (this.environment === 'development') {
      console.log(`📊 METRIC:`, JSON.stringify(metric))
    }
    
    // In production, send to metrics service:
    // - Prometheus: await this.sendToPrometheus(metric)
    // - StatsD: await this.sendToStatsD(metric)
    // - DataDog: await this.sendToDatadogMetrics(metric)
  }
  
  private sendAlert(logEntry: LogEntry): void {
    // In production, send to alerting systems:
    // - PagerDuty for critical issues
    // - Slack for team notifications
    // - Email for security events
    
    if (this.shouldAlert(logEntry) && this.environment === 'development') {
      console.log(`🚨 ALERT: ${logEntry.message}`)
    }
  }
  
  private shouldAlert(logEntry: LogEntry): boolean {
    // Define alerting rules
    const alertConditions = [
      logEntry.level === LogLevel.ERROR,
      logEntry.httpStatus && logEntry.httpStatus >= 500,
      logEntry.message.toLowerCase().includes('payment'),
      logEntry.message.toLowerCase().includes('security'),
      logEntry.duration && logEntry.duration > 10000 // >10 seconds
    ]
    
    return alertConditions.some(condition => condition)
  }
  
  // Utility methods
  private sanitizeUrl(url: string): string {
    // Remove sensitive parameters and IDs
    return url
      .replace(/\/[0-9a-f-]{36}/g, '/:id') // UUIDs
      .replace(/\/\d+/g, '/:id') // Numeric IDs
      .replace(/[?&]token=[^&]*/g, '') // Tokens
      .replace(/[?&]key=[^&]*/g, '') // API keys
  }
  
  private sanitizeQuery(query: string): string {
    // Remove sensitive data from SQL queries
    return query
      .replace(/'[^']*'/g, "'***'") // String values
      .replace(/\b\d+\b/g, '***') // Numeric values
      .substring(0, 200) // Truncate long queries
  }
  
  private extractQueryOperation(query: string): string {
    const operation = query.trim().split(' ')[0].toUpperCase()
    return ['SELECT', 'INSERT', 'UPDATE', 'DELETE'].includes(operation) ? operation : 'OTHER'
  }
}

// Context interfaces
export interface LogContext {
  requestId?: string
  userId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  duration?: number
  httpMethod?: string
  httpStatus?: number
  httpUrl?: string
  metadata?: Record<string, any>
}

export interface ApiRequestContext {
  requestId: string
  userId?: string
  method: string
  url: string
  ipAddress: string
  userAgent: string
  query?: any
  sanitizedBody?: any
}

export interface ApiResponseContext {
  requestId: string
  userId?: string
  method: string
  url: string
  status: number
  duration: number
  responseSize?: number
  cached?: boolean
}

export interface PaymentEventContext {
  userId: string
  type: 'created' | 'succeeded' | 'failed' | 'refunded'
  paymentId: string
  amount: number
  currency: string
  status: string
}

export interface ScrapingJobContext {
  jobId: string
  type: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  url: string
  attempts: number
  duration?: number
}

export interface SecurityEventContext {
  type: 'login_attempt' | 'rate_limit_exceeded' | 'invalid_token' | 'suspicious_activity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  userId?: string
  ipAddress: string
  userAgent: string
  details: Record<string, any>
  blocked: boolean
}

export interface PerformanceMetric {
  name: string
  value: number
  expectedValue: number
  threshold: 'warning' | 'critical'
  unit: string
}

// Export singleton instance
export const logger = Logger.getInstance()

// Convenience functions
export const log = {
  error: (message: string, context?: LogContext, error?: Error) => logger.error(message, context, error),
  warn: (message: string, context?: LogContext) => logger.warn(message, context),
  info: (message: string, context?: LogContext) => logger.info(message, context),
  debug: (message: string, context?: LogContext) => logger.debug(message, context),
  trace: (message: string, context?: LogContext) => logger.trace(message, context),
  
  apiRequest: (context: ApiRequestContext) => logger.apiRequest(context),
  apiResponse: (context: ApiResponseContext) => logger.apiResponse(context),
  databaseQuery: (query: string, duration: number, context?: LogContext) => logger.databaseQuery(query, duration, context),
  paymentEvent: (event: PaymentEventContext) => logger.paymentEvent(event),
  scrapingJob: (job: ScrapingJobContext) => logger.scrapingJob(job),
  securityEvent: (event: SecurityEventContext) => logger.securityEvent(event),
  performanceAlert: (metric: PerformanceMetric) => logger.performanceAlert(metric)
}

// Performance monitoring utilities
export function withTiming<T>(
  name: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now()
    
    try {
      const result = await fn()
      const duration = Date.now() - startTime
      
      logger.debug(`Operation completed: ${name}`, {
        ...context,
        duration,
        metadata: { operation: name }
      })
      
      resolve(result)
    } catch (error) {
      const duration = Date.now() - startTime
      
      logger.error(`Operation failed: ${name}`, {
        ...context,
        duration,
        metadata: { operation: name }
      }, error as Error)
      
      reject(error)
    }
  })
}