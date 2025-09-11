/**
 * Simple Logger Utility
 * Provides basic logging functionality for DirectoryBolt
 */

export interface LogMetadata {
  [key: string]: any
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  timestamp: string
  metadata?: LogMetadata
  error?: Error
}

class Logger {
  private logs: LogEntry[] = []
  private maxLogs = 1000

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    metadata?: LogMetadata,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata,
      error
    }
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry)
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Console output
    const logMessage = `[${entry.timestamp}] ${entry.level.toUpperCase()}: ${entry.message}`
    
    switch (entry.level) {
      case 'error':
        console.error(logMessage, entry.metadata, entry.error)
        break
      case 'warn':
        console.warn(logMessage, entry.metadata)
        break
      case 'debug':
        console.debug(logMessage, entry.metadata)
        break
      default:
        console.log(logMessage, entry.metadata)
    }
  }

  info(message: string, metadata?: { metadata?: LogMetadata }): void {
    this.addLog(this.createLogEntry('info', message, metadata?.metadata))
  }

  warn(message: string, metadata?: { metadata?: LogMetadata }): void {
    this.addLog(this.createLogEntry('warn', message, metadata?.metadata))
  }

  error(message: string, metadata?: { metadata?: LogMetadata }, error?: Error): void {
    this.addLog(this.createLogEntry('error', message, metadata?.metadata, error))
  }

  debug(message: string, metadata?: { metadata?: LogMetadata }): void {
    this.addLog(this.createLogEntry('debug', message, metadata?.metadata))
  }

  getLogs(level?: LogEntry['level']): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level)
    }
    return [...this.logs]
  }

  clearLogs(): void {
    this.logs = []
  }
}

export const logger = new Logger()
export const log = logger